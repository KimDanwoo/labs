"""
Blender 5.3

실행:
blender -b --factory-startup --disable-autoexec --python tools/models/careerRope.py

고리의 원형 내경 0.21과 ±0.205 사각 금지 영역은 대각선에서 충돌한다.
축 방향 안쪽 반지름은 0.21로 유지하고 대각선 구멍을 넓혀 기둥 공간을 확보한다.
원본 .blend는 읽지 않는다. 모든 GLB는 원점·회전·스케일을 유지한다.
표식 기둥은 비교 렌더에서만 Z 방향으로 0.76 올려 전체 형상을 보여 준다.
"""

import json
import math
import struct
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "career"

TAU = math.tau
EPS = 1e-6
DYE = 13
ROPE_TURNS = 4
ROPE_STEPS = 20

EXPECTED = {
    2: "#574E37",
    3: "#3DBBE7",
    8: "#E4A90C",
    10: "#E49A78",
    11: "#988165",
    13: "#A49876",
    14: "#B36D45",
    17: "#FDE6E2",
    18: "#F8A658",
    23: "#FFF2E8",
}

PART_SLOTS = {
    "rope_strand": {13},
    "rope_fibre": {23},
    "ring_body": {13, 23},
    "ring_knot": {13},
    "button_rim": {13},
    "button_plate": {23},
    "shell": {23, 17},
    "stake_wood": {14},
    "stake_grain": {11},
    "stake_wrap": {13, 23},
    "stake_knot": {13},
    "marker_wood": {14, 2},
    "marker_carving": {2, 14, 18},
    "marker_band": {13, 23},
}

DYE_PARTS = {
    "careerRope": {"rope_strand"},
    "careerRing": {"ring_body", "ring_knot"},
    "careerButton": {"button_rim"},
    "careerStake": {"stake_wrap", "stake_knot"},
    "careerMarker": {"marker_band"},
}

LIMITS = {
    "careerRope": (
        300, 900, (-.07, -.5, -.015), (.07, .5, .125),
    ),
    "careerRing": (
        300, 1200, (-.33, -.33, -.01), (.33, .33, .10),
    ),
    "careerButton": (
        300, 1200, (-.25, -.25, 0), (.25, .25, .13),
    ),
    "careerStake": (
        200, 800, (-.13, -.13, -.05), (.13, .13, .34),
    ),
    "careerMarker": (
        300, 1500, (-.14, -.14, -.76), (.14, .14, .05),
    ),
}

RING_NOTE = (
    "축 방향 안쪽 반지름 0.21; 대각선에서는 사각 기둥 공간을 "
    "확보하도록 안쪽 반지름을 확대. 구멍 경계의 사각 여유는 0.207."
)


def bounds(points):
    points = list(points)
    assert points, "빈 메시"

    return tuple(
        Vector(tuple(fn(point[axis] for point in points) for axis in range(3)))
        for fn in (min, max)
    )


def slot_from_uv(uv):
    u, v = uv
    slot = round(u * 32 - .5)

    assert slot in {2, 11, 13, 14, 17, 18, 23}
    assert abs(u - (slot + .5) / 32) < 1e-7
    assert abs(v - .5) < 1e-7

    return slot


def check_palette_image(image):
    assert tuple(image.size) == (128, 4)
    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)
    actual_colors = {}

    for slot, expected in EXPECTED.items():
        # 경계색을 피하기 위해 각 4×4칸의 중앙 픽셀만 검사한다.
        offset = 4 * (2 * 128 + slot * 4 + 2)
        rgb = tuple(round(pixels[offset + channel] * 255) for channel in range(3))
        actual = "#" + "".join(f"{channel:02X}" for channel in rgb)

        assert actual == expected, (slot, actual, expected)
        assert pixels[offset + 3] > .999
        actual_colors[slot] = actual

    return actual_colors


def make_palette_material():
    if not PALETTE.is_file():
        raise FileNotFoundError(PALETTE)

    assert bpy.data.materials.get("palette") is None

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    colors = check_palette_image(image)
    image.pack()

    material = bpy.data.materials.new("palette")
    material.use_nodes = True
    material.diffuse_color = (1, 1, 1, 1)

    nodes = material.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")

    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    texture.mute = False
    nodes.active = texture

    shader.inputs["Metallic"].default_value = 0
    shader.inputs["Roughness"].default_value = 1

    material.node_tree.links.new(
        texture.outputs["Color"], shader.inputs["Base Color"],
    )
    material.node_tree.links.new(
        shader.outputs["BSDF"], output.inputs["Surface"],
    )

    return colors


class Builder:
    def __init__(self, name):
        self.name = name
        self.vertices = []
        self.faces = []
        self.tags = []
        self.normals = []
        self.roles = []

    def ring(self, points, normals=None):
        points = list(points)
        start = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        self.normals.extend(
            normals if normals is not None else [(0, 0, 1)] * len(points)
        )
        return list(range(start, len(self.vertices)))

    def face(self, indices, slot, part):
        indices = tuple(indices)

        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)
        assert slot in PART_SLOTS[part]

        if slot == DYE:
            assert part in DYE_PARTS[self.name]

        if part not in self.roles:
            self.roles.append(part)

        self.faces.append(indices)
        self.tags.append((slot, self.roles.index(part)))

    def bridge(self, first, second, slots, part, closed=True):
        assert len(first) == len(second)

        count = len(first) if closed else len(first) - 1

        for i in range(count):
            j = (i + 1) % len(first)
            slot = slots[i] if isinstance(slots, (list, tuple)) else slots

            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
                part,
            )

    def finish(self):
        assert bpy.data.objects.get(self.name) is None
        assert bpy.data.meshes.get(self.name) is None

        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        assert not mesh.validate()

        bm = bmesh.new()

        try:
            bm.from_mesh(mesh)

            slot_layer = bm.faces.layers.int.new("palette_slot")
            part_layer = bm.faces.layers.int.new("part_id")

            for face, (slot, role) in zip(bm.faces, self.tags, strict=True):
                face[slot_layer] = slot
                face[part_layer] = role

            bmesh.ops.triangulate(
                bm,
                faces=list(bm.faces),
                quad_method="FIXED",
                ngon_method="EAR_CLIP",
            )
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

            pending = set(bm.faces)
            components = 0

            while pending:
                component = {pending.pop()}
                stack = list(component)

                while stack:
                    face = stack.pop()

                    for edge in face.edges:
                        for neighbor in edge.link_faces:
                            if neighbor in pending:
                                pending.remove(neighbor)
                                component.add(neighbor)
                                stack.append(neighbor)

                volume = sum(
                    face.verts[0].co.dot(
                        face.verts[1].co.cross(face.verts[2].co)
                    )
                    for face in component
                ) / 6

                assert abs(volume) > 1e-12

                if volume < 0:
                    bmesh.ops.reverse_faces(bm, faces=list(component))

                components += 1

            for edge in bm.edges:
                if edge.is_boundary:
                    assert self.name == "careerRope"
                    assert all(
                        abs(abs(vertex.co.y) - .5) < EPS
                        for vertex in edge.verts
                    )
                else:
                    assert edge.is_manifold and edge.is_contiguous

            assert all(face.calc_area() > 1e-10 for face in bm.faces)
            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")
        slots = mesh.attributes["palette_slot"].data

        for polygon in mesh.polygons:
            slot = slots[polygon.index].value
            polygon.use_smooth = self.name == "careerRope"

            for loop in polygon.loop_indices:
                uv.data[loop].uv = ((slot + .5) / 32, .5)

        if self.name == "careerRope":
            assert len(mesh.vertices) == len(self.normals)

            for vertex, original in zip(
                mesh.vertices, self.vertices, strict=True,
            ):
                assert (vertex.co - Vector(original)).length < EPS

            # 열린 타일 끝도 같은 주기적 법선을 사용해 음영 이음매를 막는다.
            mesh.normals_split_custom_set_from_vertices(self.normals)

        mesh.update()
        mesh.calc_loop_triangles()

        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)

        return obj, self.roles, components


def polygon_outline(z, radius, count=8):
    return [
        (
            radius * math.cos(TAU * i / count),
            radius * math.sin(TAU * i / count),
            z,
        )
        for i in range(count)
    ]


def square_outline(z, half, bevel=None):
    c = half * .18 if bevel is None else bevel

    return [
        (-half + c, -half, z),
        (half - c, -half, z),
        (half, -half + c, z),
        (half, half - c, z),
        (half - c, half, z),
        (-half + c, half, z),
        (-half, half - c, z),
        (-half, -half + c, z),
    ]


def loft(builder, profiles, outline, slot, part):
    rings = [
        builder.ring(outline(z, radius))
        for z, radius in profiles
    ]

    builder.face(reversed(rings[0]), slot, part)

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, slot, part)

    builder.face(rings[-1], slot, part)


def bead(builder, center, radii, part, slot=13):
    center = Vector(center)
    bottom = builder.ring([
        center + Vector((0, 0, -radii[2])),
    ])[0]
    rings = []

    for k in range(1, 4):
        phi = math.pi * k / 4
        rings.append(builder.ring([
            center + Vector((
                radii[0] * math.sin(phi) * math.cos(TAU * i / 8),
                radii[1] * math.sin(phi) * math.sin(TAU * i / 8),
                -radii[2] * math.cos(phi),
            ))
            for i in range(8)
        ]))

    for i in range(8):
        builder.face(
            (bottom, rings[0][(i + 1) % 8], rings[0][i]),
            slot,
            part,
        )

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, slot, part)

    top = builder.ring([
        center + Vector((0, 0, radii[2])),
    ])[0]

    for i in range(8):
        builder.face(
            (rings[-1][i], rings[-1][(i + 1) % 8], top),
            slot,
            part,
        )


def box(builder, center, dimensions, slot, part, tilt=0):
    cx, cy, cz = center
    sx, sy, sz = dimensions
    rings = []

    for z, factor in (
        (-.5, .78),
        (-.36, 1),
        (.36, 1),
        (.5, .78),
    ):
        points = []

        for x, y, _ in square_outline(0, .5):
            x, y, zz = x * sx * factor, y * sy * factor, z * sz
            points.append((
                cx + x * math.cos(tilt) + zz * math.sin(tilt),
                cy + y,
                cz - x * math.sin(tilt) + zz * math.cos(tilt),
            ))

        rings.append(builder.ring(points))

    builder.face(reversed(rings[0]), slot, part)

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, slot, part)

    builder.face(rings[-1], slot, part)


def make_rope():
    builder = Builder("careerRope")

    for strand in range(4):
        is_fibre = strand == 3
        orbit, radius, sides = (
            (.044, .003, 3)
            if is_fibre
            else (.03, .04, 5)
        )
        phase = math.pi / 3 if is_fibre else strand * TAU / 3
        slot, part = (
            (23, "rope_fibre")
            if is_fibre
            else (13, "rope_strand")
        )
        rings = []

        for i in range(ROPE_STEPS + 1):
            # 마지막 링은 첫 링과 동일한 삼각함수 입력으로 계산한다.
            theta = phase + TAU * ROPE_TURNS * (i % ROPE_STEPS) / ROPE_STEPS
            points = []
            normals = []

            for j in range(sides):
                phi = TAU * j / sides

                points.append((
                    orbit * math.cos(theta) + radius * math.cos(theta + phi),
                    -.5 + i / ROPE_STEPS,
                    .055 + orbit * math.sin(theta) + radius * math.sin(theta + phi),
                ))
                normals.append(tuple(Vector((
                    math.cos(theta + phi),
                    -TAU * ROPE_TURNS * orbit * math.sin(phi),
                    math.sin(theta + phi),
                )).normalized()))

            rings.append(builder.ring(points, normals))

        for first, second in zip(rings, rings[1:]):
            builder.bridge(first, second, slot, part)

    return builder


def make_ring():
    builder = Builder("careerRing")
    angles = [
        0, .10,
        math.pi / 4, math.pi / 2, 3 * math.pi / 4,
        math.pi, 5 * math.pi / 4, 3 * math.pi / 2,
        7 * math.pi / 4, TAU - .10,
    ]
    rings = []

    for i in range(32):
        theta = TAU * i / 32
        inner = max(
            .21,
            .207 / max(abs(math.cos(theta)), abs(math.sin(theta))),
        )
        points = []

        for angle in angles:
            phi = angle + 4 * theta
            radius = inner + (.33 - inner) * (1 + math.cos(phi)) / 2

            # 매듭 아래만 낮춰 전체 높이 0.10 안에서도 매듭을 드러낸다.
            front = max(0, -math.sin(theta)) ** 16
            height = .055 - .017 * front

            points.append((
                radius * math.cos(theta),
                radius * math.sin(theta),
                .045 + height * math.sin(phi),
            ))

        rings.append(builder.ring(points))

    colors = [23 if j in (0, 9) else 13 for j in range(10)]

    for i in range(32):
        builder.bridge(
            rings[i], rings[(i + 1) % 32], colors, "ring_body",
        )

    bead(
        builder,
        (.025, -.276, .077),
        (.034, .024, .023),
        "ring_knot",
    )

    return builder


def make_button():
    builder = Builder("careerButton")
    profile = [
        (.23, 0),
        (.25, .018),
        (.25, .052),
        (.235, .07),
        (.19, .07),
        (.19, 0),
    ]
    rings = [
        builder.ring(polygon_outline(z, radius, 24))
        for radius, z in profile
    ]

    for i in range(len(rings)):
        builder.bridge(
            rings[i], rings[(i + 1) % len(rings)], 13, "button_rim",
        )

    loft(
        builder,
        [(.008, .18), (.018, .192), (.060, .192), (.070, .185)],
        lambda z, radius: polygon_outline(z, radius, 24),
        23,
        "button_plate",
    )

    spread = math.radians(65)
    angles = [
        -spread + 2 * spread * (i + offset) / 8
        for i in range(8)
        for offset in (0, .43, .57)
    ] + [spread]

    hinge = Vector((0, .115, .076))
    apex = builder.ring([hinge])[0]
    shell_rings = []

    for t, z in (
        (.12, .079),
        (.50, .13),
        (.82, .113),
        (1, .080),
    ):
        points = []

        for j, angle in enumerate(angles):
            is_groove = j % 3 in (1, 2)
            scallop = .965 if is_groove else 1

            edge = Vector((
                .15 * math.sin(angle) / math.sin(spread),
                .115 - .26 * math.cos(angle),
                z,
            ))
            point = hinge.lerp(edge, t)
            point.z = z - (.006 if is_groove and t < 1 else 0)

            if t == 1:
                point = hinge.lerp(point, scallop)

            points.append(point)

        shell_rings.append(builder.ring(points))

    colors = [
        17 if j % 3 == 1 else 23
        for j in range(len(angles) - 1)
    ]

    for j, slot in enumerate(colors):
        builder.face(
            (apex, shell_rings[0][j], shell_rings[0][j + 1]),
            slot,
            "shell",
        )

    for first, second in zip(shell_rings, shell_rings[1:]):
        builder.bridge(first, second, colors, "shell", closed=False)

    boundary = (
        [apex]
        + [ring[0] for ring in shell_rings]
        + shell_rings[-1][1:]
        + [ring[-1] for ring in reversed(shell_rings[:-1])]
    )
    bottom = builder.ring([
        (
            builder.vertices[index][0],
            builder.vertices[index][1],
            .07,
        )
        for index in boundary
    ])

    builder.bridge(boundary, bottom, 23, "shell")

    # 경계의 일직선 정점들이 퇴화 삼각형으로 묶이지 않도록 내부점으로 나눈다.
    center = builder.ring([(0, -.01, .07)])[0]

    for i in range(len(bottom)):
        builder.face(
            (center, bottom[(i + 1) % len(bottom)], bottom[i]),
            23,
            "shell",
        )

    return builder


def make_stake():
    builder = Builder("careerStake")

    loft(
        builder,
        [
            (-.05, .077),
            (0, .085),
            (.27, .085),
            (.31, .083),
            (.335, .069),
            (.34, .05),
        ],
        polygon_outline,
        14,
        "stake_wood",
    )

    for x, z, height in (
        (-.025, .057, .105),
        (.025, .067, .083),
        (0, .266, .061),
    ):
        y = -.085 + abs(x) * math.tan(math.pi / 8)
        box(
            builder,
            (x, y - .0004, z),
            (.003, .0015, height),
            11,
            "stake_grain",
        )

    angles = [
        0, .12, math.pi / 2, math.pi, 3 * math.pi / 2, TAU - .12,
    ]
    rings = []

    for i in range(21):
        t = i / 20
        theta = TAU * 2.5 * t

        rings.append(builder.ring([
            (
                (.091 + .014 * math.cos(phi)) * math.cos(theta),
                (.091 + .014 * math.cos(phi)) * math.sin(theta),
                .134 + .072 * t + .014 * math.sin(phi),
            )
            for phi in angles
        ]))

    builder.face(reversed(rings[0]), 13, "stake_wrap")

    for first, second in zip(rings, rings[1:]):
        builder.bridge(
            first, second, [23, 13, 13, 13, 13, 23], "stake_wrap",
        )

    builder.face(rings[-1], 13, "stake_wrap")

    bead(
        builder,
        (0, -.105, .171),
        (.016, .019, .021),
        "stake_knot",
    )

    return builder


def make_marker():
    builder = Builder("careerMarker")
    profiles = [
        (-.76, .13),
        (-.745, .14),
        (-.46, .14),
        (-.45, .094),
        (-.20, .094),
        (-.19, .14),
        (-.018, .14),
        (0, .132),
        (.025, .128),
        (.05, .112),
    ]
    rings = []

    for z, half in profiles:
        points = square_outline(z, half)

        if z in (-.19, -.018):
            # 얼굴 바탕을 안으로 넣어 조각도 ±0.14 안에 들어오게 한다.
            points = [
                (x, y + .012 if i in (0, 1) else y, zz)
                for i, (x, y, zz) in enumerate(points)
            ]

        rings.append(builder.ring(points))

    builder.face(reversed(rings[0]), 14, "marker_wood")

    for i, (first, second) in enumerate(zip(rings, rings[1:])):
        builder.bridge(
            first,
            second,
            2 if i in (2, 3, 4) else 14,
            "marker_wood",
        )

    builder.face(rings[-1], 14, "marker_wood")

    for x, angle in ((-.056, -.18), (.056, .18)):
        box(
            builder,
            (x, -.1325, -.083),
            (.069, .010, .018),
            2,
            "marker_carving",
            angle,
        )

    box(
        builder,
        (0, -.132, -.118),
        (.028, .014, .039),
        18,
        "marker_carving",
    )
    box(
        builder,
        (0, -.132, -.163),
        (.084, .010, .014),
        2,
        "marker_carving",
    )

    path = square_outline(.025, .130, .018)
    centers = []

    for i, point in enumerate(path):
        first = Vector(point)
        second = Vector(path[(i + 1) % len(path)])
        centers.extend((first, first.lerp(second, .5)))

    angles = [
        0, .12, math.pi / 2, math.pi, 3 * math.pi / 2, TAU - .12,
    ]
    band = []

    for center in centers:
        radial = Vector((center.x, center.y, 0)).normalized()

        band.append(builder.ring([
            center
            + radial * (.008 * math.cos(phi))
            + Vector((0, 0, .008 * math.sin(phi)))
            for phi in angles
        ]))

    for i in range(len(band)):
        builder.bridge(
            band[i],
            band[(i + 1) % len(band)],
            [23, 13, 13, 13, 13, 23],
            "marker_band",
        )

    return builder


def clip_plane(points, axis, boundary, sign):
    if not points:
        return []

    output = []

    for first, second in zip(points, points[1:] + points[:1]):
        da = sign * (first[axis] - boundary)
        db = sign * (second[axis] - boundary)

        if da >= 0:
            output.append(first)

        if (da >= 0) != (db >= 0):
            output.append(first.lerp(second, da / (da - db)))

    return output


def check_triangle_clearance(name, points):
    if name == "careerRing":
        clipped = list(points)

        for axis, boundary, sign in (
            (0, -.205 + EPS, 1),
            (0, .205 - EPS, -1),
            (1, -.205 + EPS, 1),
            (1, .205 - EPS, -1),
            (2, -.05 + EPS, 1),
        ):
            clipped = clip_plane(clipped, axis, boundary, sign)

        assert len(clipped) < 3, "고리 면이 기둥 공간을 침범합니다"

    if name == "careerMarker":
        clipped = clip_plane(list(points), 2, -.45, 1)
        clipped = clip_plane(clipped, 2, -.20, -1)

        assert all(
            max(abs(point.x), abs(point.y)) <= .095 + EPS
            for point in clipped
        ), "표식 면이 빛 띠 구간을 침범합니다"


def check_seam(points, normals, slots):
    ends = [defaultdict(list), defaultdict(list)]

    for point, normal, slot in zip(points, normals, slots, strict=True):
        for index, y in enumerate((-.5, .5)):
            if abs(point.y - y) < EPS:
                key = (round(point.x, 6), round(point.z, 6), slot)
                ends[index][key].append(Vector(normal))

    assert ends[0].keys() == ends[1].keys()
    assert len(ends[0]) == 18

    for key in ends[0]:
        reference = ends[0][key][0]

        assert all(
            (normal - reference).length < .001
            for normal in ends[0][key] + ends[1][key]
        ), ("밧줄 끝 법선 불일치", key)

    for endpoint in ends:
        body = [
            Vector((x, 0, z))
            for x, z, slot in endpoint
            if slot == DYE
        ]
        assert len(body) == 15
        center = sum(body, Vector()) / len(body)
        assert (center - Vector((0, 0, .055))).length < EPS


def check_bounds(name, points):
    points = list(points)
    lower, upper = bounds(points)
    _, _, low, high = LIMITS[name]

    assert all(
        lower[axis] >= low[axis] - EPS
        and upper[axis] <= high[axis] + EPS
        for axis in range(3)
    ), (name, tuple(lower), tuple(upper))

    if name == "careerRope":
        assert lower.y == -.5 and upper.y == .5
        assert -.015 - EPS <= lower.z <= -.012

        radii = [
            math.hypot(point.x, point.z - .055)
            for point in points
        ]
        assert max(radii) <= .07 + EPS
        assert abs(max(radii) - .07) < EPS

        ends = [
            sorted({
                (round(point.x, 6), round(point.z, 6))
                for point in points
                if abs(point.y - y) < EPS
            })
            for y in (-.5, .5)
        ]
        assert ends[0] == ends[1]
        assert len(ends[0]) == 18

    if name == "careerRing":
        assert all(
            not (
                abs(point.x) < .205
                and abs(point.y) < .205
                and point.z > -.05
            )
            for point in points
        )
        assert all(
            .21 - EPS <= math.hypot(point.x, point.y) <= .33 + EPS
            for point in points
        )
        assert abs(min(math.hypot(p.x, p.y) for p in points) - .21) < EPS

    if name == "careerMarker":
        assert all(
            max(abs(point.x), abs(point.y)) <= .095 + EPS
            for point in points
            if -.45 - EPS <= point.z <= -.20 + EPS
        )

    exact_bounds = (
        [(1, -.5, lower), (1, .5, upper)]
        if name == "careerRope"
        else [(2, low[2], lower), (2, high[2], upper)]
    )

    for axis, value, bound in exact_bounds:
        assert abs(bound[axis] - value) < EPS

    return lower, upper


def triangle_key(points, slot):
    return (
        slot,
        tuple(sorted(
            tuple(round(component, 6) for component in point)
            for point in points
        )),
    )


def mesh_triangle_keys(mesh):
    slots = mesh.attributes["palette_slot"].data

    return Counter(
        triangle_key(
            [mesh.vertices[index].co for index in face.vertices],
            slots[face.index].value,
        )
        for face in mesh.polygons
    )


def check_model(obj, roles, components):
    mesh = obj.data
    name = obj.name

    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert tuple(obj.location) == (0, 0, 0)
    assert tuple(obj.rotation_euler) == (0, 0, 0)
    assert tuple(obj.scale) == (1, 1, 1)
    assert not obj.modifiers

    lower, upper = check_bounds(name, [vertex.co for vertex in mesh.vertices])
    count = len(mesh.loop_triangles)
    assert LIMITS[name][0] <= count <= LIMITS[name][1], (name, count)

    slots = mesh.attributes["palette_slot"].data
    parts = mesh.attributes["part_id"].data
    counts = Counter()
    by_part = defaultdict(Counter)

    for face in mesh.polygons:
        assert len(face.vertices) == 3
        assert face.area > 1e-10

        slot = slots[face.index].value
        part = roles[parts[face.index].value]
        coords = [mesh.vertices[index].co for index in face.vertices]

        assert slot in PART_SLOTS[part]
        check_triangle_clearance(name, coords)

        if slot == DYE:
            assert part in DYE_PARTS[name]

            if name == "careerButton":
                assert all(
                    math.hypot(point.x, point.y) >= .19 - EPS
                    for point in coords
                )

            if name == "careerStake":
                assert all(
                    .12 - EPS <= point.z <= .22 + EPS
                    for point in coords
                )

            if name == "careerMarker":
                assert all(0 <= point.z <= .05 + EPS for point in coords)

        assert all(
            slot_from_uv(mesh.uv_layers.active.data[index].uv) == slot
            for index in face.loop_indices
        )

        counts[slot] += 1
        by_part[part][slot] += 1

    assert counts[13] > 0 and counts[23] > 0

    if name == "careerRope":
        assert components == 4
        check_seam(
            [mesh.vertices[loop.vertex_index].co for loop in mesh.loops],
            [normal.vector for normal in mesh.corner_normals],
            [
                slot_from_uv(uv.uv)
                for uv in mesh.uv_layers.active.data
            ],
        )

    return {
        "name": name,
        "triangles": count,
        "components": components,
        "blender_bounds": {
            "min": list(lower),
            "max": list(upper),
        },
        "triangles_by_slot": dict(sorted(counts.items())),
        "parts": {
            part: dict(sorted(part_counts.items()))
            for part, part_counts in by_part.items()
        },
        "dye_slot": DYE,
        "dye_parts": sorted(DYE_PARTS[name]),
        "origin_blender": [0, 0, 0],
        "front_blender": [0, -1, 0],
        "front_gltf": [0, 0, 1],
        "checks": {
            "bounds": True,
            "triangle_budget": True,
            "nondegenerate_triangles": True,
            "palette_uv": True,
            "dye_part_whitelist": True,
            "forbidden_vertices_and_faces": True,
            "periodic_end_positions_and_normals": name == "careerRope",
        },
    }


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]
    assert "sparse" not in accessor
    assert not accessor.get("normalized", False)

    formats = {5121: "B", 5123: "H", 5125: "I", 5126: "f"}
    widths = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}

    fmt = (
        "<"
        + formats[accessor["componentType"]]
        * widths[accessor["type"]]
    )
    size = struct.calcsize(fmt)
    view = document["bufferViews"][accessor["bufferView"]]

    assert view.get("buffer", 0) == 0

    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    assert accessor["count"] > 0
    assert stride >= size
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def read_glb(path):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (b"glTF", 2, len(data))

    chunks = {}
    offset = 12

    while offset < len(data):
        assert offset + 8 <= len(data)
        size, kind = struct.unpack_from("<I4s", data, offset)

        assert size % 4 == 0
        assert kind not in chunks
        assert offset + 8 + size <= len(data)

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)
    assert set(chunks) == {b"JSON", b"BIN\x00"}

    return json.loads(chunks[b"JSON"]), chunks[b"BIN\x00"]


def verify_embedded_palette(document, binary):
    material, = document["materials"]
    texture, = document["textures"]
    image, = document["images"]

    assert material["name"] == "palette"
    assert texture["source"] == 0
    assert material["pbrMetallicRoughness"]["baseColorTexture"]["index"] == 0
    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    # 내장 PNG도 다시 읽어 실제로 내보낸 팔레트 중앙색을 확인한다.
    with tempfile.TemporaryDirectory(prefix="career-palette-", dir=OUTPUT) as temp:
        path = Path(temp) / "palette.png"
        path.write_bytes(png)
        embedded = bpy.data.images.load(str(path), check_existing=False)

        try:
            check_palette_image(embedded)
        finally:
            bpy.data.images.remove(embedded)


def verify_glb(path, obj, metadata):
    document, binary = read_glb(path)

    buffer, = document["buffers"]
    assert "uri" not in buffer
    assert 0 <= len(binary) - buffer["byteLength"] <= 3

    mesh, = document["meshes"]
    node, = document["nodes"]
    scene, = document["scenes"]

    assert mesh["name"] == node["name"] == obj.name
    assert scene["nodes"] == [0]
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]

    primitive, = mesh["primitives"]

    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]

    assert {"POSITION", "NORMAL", "TEXCOORD_0"}.issubset(attributes)
    assert not any(key.startswith("COLOR_") for key in attributes)

    gltf_points = [
        Vector(point)
        for point in accessor_rows(document, binary, attributes["POSITION"])
    ]
    gltf_normals = [
        Vector(normal)
        for normal in accessor_rows(document, binary, attributes["NORMAL"])
    ]
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])

    assert len(gltf_points) == len(gltf_normals) == len(uvs)
    assert all(abs(normal.length - 1) < 1e-4 for normal in gltf_normals)

    slots = [slot_from_uv(uv) for uv in uvs]

    # export_yup=True의 역변환: glTF (x, z, -y) → Blender (x, y, z).
    points = [Vector((p.x, -p.z, p.y)) for p in gltf_points]
    normals = [Vector((n.x, -n.z, n.y)) for n in gltf_normals]

    check_bounds(obj.name, points)

    indices = [
        row[0]
        for row in accessor_rows(document, binary, primitive["indices"])
    ]
    assert len(indices) % 3 == 0

    counts = Counter()
    exported_keys = Counter()

    for index in range(0, len(indices), 3):
        a, b, c = indices[index:index + 3]

        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert slots[a] == slots[b] == slots[c]

        triangle = [points[a], points[b], points[c]]

        assert (
            (triangle[1] - triangle[0]).cross(triangle[2] - triangle[0]).length
            > 2e-10
        )

        check_triangle_clearance(obj.name, triangle)
        counts[slots[a]] += 1
        exported_keys[triangle_key(triangle, slots[a])] += 1

    triangle_count = len(indices) // 3

    assert triangle_count == metadata["triangles"]
    assert LIMITS[obj.name][0] <= triangle_count <= LIMITS[obj.name][1]
    assert dict(counts) == metadata["triangles_by_slot"]

    # 삼각형의 위치와 슬롯을 함께 비교해 부위별 염색 계약도 보존됐는지 확인한다.
    assert exported_keys == mesh_triangle_keys(obj.data)

    if obj.name == "careerRope":
        check_seam(points, normals, slots)

    verify_embedded_palette(document, binary)

    lower, upper = bounds(gltf_points)

    return {
        "file": str(path),
        "glb_bounds": {"min": list(lower), "max": list(upper)},
        "glb_dimensions": list(upper - lower),
        "glb_triangles_by_slot": dict(sorted(counts.items())),
        "glb_verified": True,
        "export_yup": True,
        "mesh_count": 1,
        "primitive_count": 1,
        "material": "palette",
        "embedded_palette_verified": True,
    }


def export_glb(obj, metadata):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    path = OUTPUT / f"{obj.name}.glb"

    result = bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        use_active_scene=True,
        export_yup=True,
        export_apply=False,
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_vertex_color="NONE",
        export_attributes=False,
        export_extras=False,
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_cameras=False,
        export_lights=False,
        export_draco_mesh_compression_enable=False,
        export_meshopt_compression_enable=False,
        export_use_gltfpack=False,
        will_save_settings=False,
    )

    assert result == {"FINISHED"}
    return verify_glb(path, obj, metadata)


def preview_clone(scene, source, name, position, rotation_z=0):
    clone = bpy.data.objects.new(name, source.data)
    scene.collection.objects.link(clone)
    clone.location = position
    clone.rotation_euler.z = rotation_z
    return clone


def make_preview_scene(objects):
    scene = bpy.data.scenes.new("career-comparison")
    bpy.context.window.scene = scene

    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.show_shadows = True
    shading.shadow_intensity = .35
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.cavity_ridge_factor = 1.2
    shading.cavity_valley_factor = 1.1
    shading.curvature_ridge_factor = 1.2
    shading.curvature_valley_factor = 1.1
    shading.show_object_outline = False
    shading.show_specular_highlight = False
    shading.background_type = "WORLD"

    world = bpy.data.worlds.new("career-preview-world")
    world.color = (.82, .74, .60)
    scene.world = world

    rotation = -math.pi / 2
    clones = []

    # 로컬 +Y를 렌더의 +X로 돌린다. GLB의 축과 원점은 바꾸지 않는다.
    for index in range(3):
        clones.append(preview_clone(
            scene,
            objects["careerRope"],
            f"preview-rope-{index}",
            (index, 0, 0),
            rotation,
        ))

    for name, source, position in (
        ("preview-start-stake", "careerStake", (-1.18, 0, 0)),
        ("preview-ring", "careerRing", (-.83, 0, 0)),
        ("preview-button", "careerButton", (2.73, 0, 0)),
        ("preview-end-stake", "careerStake", (3.04, 0, 0)),
    ):
        clones.append(preview_clone(
            scene, objects[source], name, position, rotation,
        ))

    clones.append(preview_clone(
        scene,
        objects["careerMarker"],
        "preview-marker",
        (.75, .85, .76),
    ))

    floor_mesh = bpy.data.meshes.new("career-preview-sand")
    floor_mesh.from_pydata(
        [(-30, -30, 0), (30, -30, 0), (30, 30, 0), (-30, 30, 0)],
        [],
        [(0, 1, 2, 3)],
    )
    floor_mesh.update()

    floor = bpy.data.objects.new("career-preview-sand", floor_mesh)
    scene.collection.objects.link(floor)

    sand = bpy.data.materials.new("career-preview-sand-material")
    sand.diffuse_color = (.83, .69, .45, 1)
    floor_mesh.materials.append(sand)

    scene.view_layers[0].update()

    points = [
        clone.matrix_world @ vertex.co
        for clone in clones
        for vertex in clone.data.vertices
    ]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2

    elevation = math.radians(35)
    direction = Vector((0, -math.cos(elevation), math.sin(elevation)))
    orientation = (-direction).to_track_quat("-Z", "Y")
    basis = orientation.to_matrix()

    screen_lower, screen_upper = bounds(
        basis.transposed() @ (point - pivot)
        for point in points
    )
    target = pivot + basis @ Vector((
        (screen_lower.x + screen_upper.x) / 2,
        (screen_lower.y + screen_upper.y) / 2,
        0,
    ))

    camera = bpy.data.objects.new(
        "career-preview-camera",
        bpy.data.cameras.new("career-preview-camera"),
    )
    scene.collection.objects.link(camera)

    camera.data.type = "ORTHO"
    camera.data.clip_start = .01
    camera.data.clip_end = 100
    camera.data.ortho_scale = 1
    camera.location = target + direction * 12
    camera.rotation_euler = orientation.to_euler()

    frame_lower, frame_upper = bounds(camera.data.view_frame(scene=scene))
    camera.data.ortho_scale = max(
        (screen_upper.x - screen_lower.x) / (frame_upper.x - frame_lower.x),
        (screen_upper.y - screen_lower.y) / (frame_upper.y - frame_lower.y),
    ) * 1.18

    scene.camera = camera
    scene.view_layers[0].update()

    assert scene.render.engine == "BLENDER_WORKBENCH"
    assert scene.display.shading.color_type == "TEXTURE"

    return scene, {
        "file": str(OUTPUT / "career.png"),
        "engine": "BLENDER_WORKBENCH",
        "color_type": "TEXTURE",
        "camera_elevation_degrees": 35,
        "rope_tiles": 3,
        "rope_length_m": 3,
        "layout": ["stake", "ring", "rope", "rope", "rope", "button", "stake"],
        "marker_preview_translation": [.75, .85, .76],
        "export_origins_unchanged": True,
    }


def render_comparison(objects):
    scene, metadata = make_preview_scene(objects)
    path = OUTPUT / "career.png"
    scene.render.filepath = str(path)

    result = bpy.ops.render.render(write_still=True, scene=scene.name)

    assert result == {"FINISHED"}
    assert path.is_file()
    assert path.stat().st_size > 1024

    png = path.read_bytes()
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (1600, 800)

    rendered = bpy.data.images.load(str(path), check_existing=False)

    try:
        assert tuple(rendered.size) == (1600, 800)
        pixels = list(rendered.pixels)
        samples = [
            pixels[offset + channel]
            for offset in range(0, len(pixels), 4 * 97)
            for channel in range(3)
        ]
        assert max(samples) - min(samples) > .05
    finally:
        bpy.data.images.remove(rendered)

    metadata["render_verified"] = True
    return metadata


def main():
    if not __debug__:
        raise RuntimeError("assert 검사를 비활성화한 Python 실행은 지원하지 않습니다")

    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError(f"Blender 5.3이 필요합니다: {bpy.app.version_string}")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("--disable-autoexec 옵션으로 실행하세요")

    colors = make_palette_material()

    export_scene = bpy.data.scenes.new("career-export")
    export_scene.unit_settings.system = "METRIC"
    export_scene.unit_settings.scale_length = 1
    bpy.context.window.scene = export_scene

    objects = {}
    records = {}

    for make in (
        make_rope,
        make_ring,
        make_button,
        make_stake,
        make_marker,
    ):
        obj, roles, components = make().finish()
        objects[obj.name] = obj
        records[obj.name] = check_model(obj, roles, components)

    records["careerRope"]["tiling"] = {
        "axis_blender": [0, 1, 0],
        "axis_gltf": [0, 0, -1],
        "length_m": 1,
        "period_m": .25,
        "turns": ROPE_TURNS,
        "cross_section_center_xz": [0, .055],
        "envelope_radius": .07,
        "ends": "open_planar",
    }
    records["careerRing"]["hole_geometry_note"] = RING_NOTE
    records["careerMarker"]["light_band_clearance"] = {
        "z_interval": [-.45, -.20],
        "maximum_half_extent_xy": .095,
        "constructed_half_extent_xy": .094,
    }

    bpy.context.view_layer.update()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for name, obj in objects.items():
        records[name].update(export_glb(obj, records[name]))

    comparison = render_comparison(objects)

    for name, record in records.items():
        record["palette"] = {
            "source": str(PALETTE),
            "size": [128, 4],
            "sample_pixel": "x = slot * 4 + 2, y = 2 (Blender 하단 기준)",
            "uv": "u = (slot + 0.5) / 32, v = 0.5",
            "verified_center_colors": colors,
        }
        record["comparison"] = comparison

        path = OUTPUT / f"{name}.json"
        path.write_text(
            json.dumps(record, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        assert json.loads(path.read_text(encoding="utf-8"))["glb_verified"]

    expected_files = [
        OUTPUT / f"{name}.{extension}"
        for name in objects
        for extension in ("glb", "json")
    ] + [OUTPUT / "career.png"]

    assert all(path.is_file() and path.stat().st_size > 0 for path in expected_files)

    print(json.dumps({
        "output": str(OUTPUT),
        "files": [str(path) for path in expected_files],
        "triangles": {
            name: record["triangles"]
            for name, record in records.items()
        },
        "verified": True,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
