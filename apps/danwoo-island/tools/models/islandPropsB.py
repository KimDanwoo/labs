"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/islandPropsB.py

원본 blend 없이 생성한다. 정면은 Blender -Y, GLB +Z이다.
디딤돌 무늬는 윗면을 실제 분할한 같은 높이의 색 면이다.
"""

import json
import math
import struct
import sys
import zlib
from collections import Counter
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt


ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/props"

EXPECTED = {
    1: "#EBD1A3",
    3: "#3DBBE7",
    5: "#4A413C",
    9: "#91AD78",
    10: "#E49A78",
    11: "#988165",
    12: "#ABAE2B",
    13: "#A49876",
    14: "#B36D45",
    17: "#FDE6E2",
    18: "#F8A658",
    23: "#FFF2E8",
}

EPS = 1e-5
KEY_RECT = (-3.3, 3.35, -1.45, .5)

# 받침 홈과 렌더 확인용 평면만 정의한다. 실제 키 메시를 내보내지 않는다.
KEYS = [
    (-1.55, .16, .64, .62),
    (-2.30, -.53, .64, .62),
    (-1.55, -.53, .64, .62),
    (-.80, -.53, .64, .62),
    (1.55, .16, .64, .62),
    (.80, -.53, .64, .62),
    (1.55, -.53, .64, .62),
    (2.30, -.53, .64, .62),
    (0, -1.16, 4.35, .43),
]

LIMITS = {
    "driftKeyboard": (1500, 5000),
    **{f"steppingStone{letter}": (150, 600) for letter in "ABCD"},
}


def bounds(points):
    points = list(points)
    assert points

    return tuple(
        Vector(tuple(fn(p[axis] for p in points) for axis in range(3)))
        for fn in (min, max)
    )


def uv_slot(uv):
    u, v = uv
    slot = round(u * 32 - .5)

    assert slot in EXPECTED
    assert abs(u - (slot + .5) / 32) < 1e-7
    assert abs(v - .5) < 1e-7

    return slot


def load_palette():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3이 필요합니다.")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("--disable-autoexec로 실행하세요.")

    if not PALETTE.is_file():
        raise FileNotFoundError(PALETTE)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    image.colorspace_settings.name = "sRGB"

    assert tuple(image.size) == (128, 4)

    pixels = list(image.pixels)

    for slot, expected in EXPECTED.items():
        rgb = [
            round(pixels[4 * (2 * 128 + slot * 4 + 2) + c] * 255)
            for c in range(3)
        ]
        actual = "#" + "".join(f"{c:02X}" for c in rgb)

        assert actual == expected, (slot, actual, expected)

    image.pack()

    old = bpy.data.materials.get("palette")
    if old:
        bpy.data.materials.remove(old, do_unlink=True)

    material = bpy.data.materials.new("palette")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()

    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = .85
    shader.inputs["Metallic"].default_value = 0

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"

    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(
        texture.outputs["Color"], shader.inputs["Base Color"],
    )
    material.node_tree.links.new(
        shader.outputs["BSDF"], output.inputs["Surface"],
    )

    nodes.active = texture
    texture.select = True

    return material


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)
        return list(range(start, len(self.vertices)))

    def face(self, ids, slot):
        ids = tuple(ids)
        assert len(ids) >= 3 and len(ids) == len(set(ids))

        self.faces.append(ids)
        self.slots.append(slot)

    def bridge(self, a, b, slot):
        assert len(a) == len(b)

        for i in range(len(a)):
            j = (i + 1) % len(a)
            self.face((a[i], a[j], b[j], b[i]), slot)

    def finish(self, name):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate()

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for face, slot in zip(mesh.polygons, self.slots, strict=True):
            face.use_smooth = False

            for loop in face.loop_indices:
                uv.data[loop].uv = ((slot + .5) / 32, .5)

        bm = bmesh.new()

        try:
            bm.from_mesh(mesh)
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            bmesh.ops.triangulate(
                bm,
                faces=list(bm.faces),
                ngon_method="EAR_CLIP",
            )
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

            assert all(
                e.is_manifold and e.is_contiguous for e in bm.edges
            ), name
            assert all(v.is_manifold for v in bm.verts), name
            assert all(f.calc_area() > 1e-10 for f in bm.faces), name

            remaining = set(bm.faces)

            while remaining:
                component = {remaining.pop()}
                pending = list(component)

                while pending:
                    face = pending.pop()

                    for edge in face.edges:
                        for neighbor in edge.link_faces:
                            if neighbor in remaining:
                                remaining.remove(neighbor)
                                component.add(neighbor)
                                pending.append(neighbor)

                volume = sum(
                    f.verts[0].co.dot(
                        f.verts[1].co.cross(f.verts[2].co)
                    ) / 6
                    for f in component
                )

                assert abs(volume) > 1e-10

                if volume < 0:
                    bmesh.ops.reverse_faces(
                        bm, faces=list(component),
                    )

            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)

        validate_mesh(obj)

        return obj


def ccw(polygon):
    area = sum(
        a[0] * b[1] - a[1] * b[0]
        for a, b in zip(polygon, polygon[1:] + polygon[:1])
    )

    assert abs(area) > 1e-10

    return polygon if area > 0 else list(reversed(polygon))


def rounded_rect(cx, cy, width, height, radius, steps=3):
    points = []

    for x, y, angle in (
        (cx + width / 2 - radius, cy + height / 2 - radius, 0),
        (cx - width / 2 + radius, cy + height / 2 - radius, 90),
        (cx - width / 2 + radius, cy - height / 2 + radius, 180),
        (cx + width / 2 - radius, cy - height / 2 + radius, 270),
    ):
        for i in range(steps + 1):
            a = math.radians(angle + 90 * i / steps)
            points.append((
                x + radius * math.cos(a),
                y + radius * math.sin(a),
            ))

    return points


def stroke(points, width):
    points = [Vector(p) for p in points]
    left, right = [], []

    for i, p in enumerate(points):
        before = (p - points[max(0, i - 1)]).normalized()
        after = (
            points[min(len(points) - 1, i + 1)] - p
        ).normalized()

        if i == 0:
            before = after

        if i == len(points) - 1:
            after = before

        n1 = Vector((-before.y, before.x))
        n2 = Vector((-after.y, after.x))
        normal = (n1 + n2).normalized()
        offset = normal * (
            width / 2 / max(.35, normal.dot(n1))
        )

        left.append(tuple(p + offset))
        right.append(tuple(p - offset))

    return ccw(left + list(reversed(right)))


def partitioned_solid(
    builder,
    outline,
    regions,
    height,
    profile,
    base_slot,
    center=(0, 0),
):
    # 색 무늬와 홈 경계를 한 윗면에 통합해 겹치는 데칼 면을 만들지 않는다.
    polygons = [ccw(outline)] + [
        ccw(poly) for poly, _ in regions
    ]
    points, faces = [], []

    for polygon in polygons:
        start = len(points)
        points.extend(Vector(p) for p in polygon)
        faces.append(list(range(start, len(points))))

    verts, _, triangles, _, _, origins = delaunay_2d_cdt(
        points, [], faces, 1, 1e-8, True,
    )

    top_faces = [
        (tri, source)
        for tri, source in zip(triangles, origins, strict=True)
        if 0 in source
    ]
    used = sorted({
        i for tri, _ in top_faces for i in tri
    })
    ids = {
        i: builder.ring([
            (verts[i].x, verts[i].y, height(verts[i])),
        ])[0]
        for i in used
    }

    edge_counts = Counter()
    directed = []

    for tri, source in top_faces:
        a, b, c = (verts[i] for i in tri)

        if (b - a).cross(c - a) < 0:
            tri = list(reversed(tri))

        slot = (
            regions[max(source) - 1][1]
            if max(source)
            else base_slot
        )

        builder.face([ids[i] for i in tri], slot)

        for i, j in zip(tri, tri[1:] + tri[:1]):
            edge_counts[tuple(sorted((i, j)))] += 1
            directed.append((i, j))

    next_vertex = {
        i: j for i, j in directed
        if edge_counts[tuple(sorted((i, j)))] == 1
    }
    first = next(iter(next_vertex))
    boundary = [first]

    while next_vertex[boundary[-1]] != first:
        boundary.append(next_vertex[boundary[-1]])
        assert len(boundary) <= len(next_vertex)

    assert len(boundary) == len(next_vertex)

    previous = [ids[i] for i in boundary]
    cx, cy = center

    for scale, z in profile:
        ring = builder.ring([
            (
                cx + (verts[i].x - cx) * scale,
                cy + (verts[i].y - cy) * scale,
                z,
            )
            for i in boundary
        ])
        builder.bridge(previous, ring, base_slot)
        previous = ring

    builder.face(reversed(previous), base_slot)


def tube(builder, points, radius, slot, sides=5):
    points = [Vector(p) for p in points]
    rings = []

    for i, p in enumerate(points):
        tangent = (
            points[(i + 1) % len(points)] - points[i - 1]
        ).normalized()
        guide = (
            Vector((0, 0, 1))
            if abs(tangent.z) < .85
            else Vector((1, 0, 0))
        )
        side = tangent.cross(guide).normalized()
        up = tangent.cross(side).normalized()

        rings.append(builder.ring([
            p + radius * (
                math.cos(j * math.tau / sides) * side
                + math.sin(j * math.tau / sides) * up
            )
            for j in range(sides)
        ]))

    for i in range(len(rings)):
        builder.bridge(
            rings[i], rings[(i + 1) % len(rings)], slot,
        )


def resample_closed(points, count):
    points = [Vector(p) for p in points]
    edges = list(zip(points, points[1:] + points[:1]))
    lengths = [(b - a).length for a, b in edges]
    total = sum(lengths)
    output = []

    for i in range(count):
        distance = total * i / count

        for (a, b), length in zip(edges, lengths, strict=True):
            if distance <= length:
                output.append(a.lerp(b, distance / length))
                break

            distance -= length

    assert len(output) == count

    return output


def add_shell(builder, cx, cy, angle):
    origin = Vector((cx, cy, .30))
    right = Vector((math.cos(angle), math.sin(angle), 0))
    forward = Vector((-math.sin(angle), math.cos(angle), 0))

    def point(x, y, z):
        return (
            origin + right * x + forward * y
            + Vector((0, 0, z))
        )

    n = 12
    heel = builder.ring([point(0, -.11, .015)])[0]
    lower_heel = builder.ring([point(0, -.11, -.035)])[0]
    upper, lower = [], []

    for i in range(n + 1):
        a = math.pi * i / n
        x = .24 * math.cos(a)
        y = -.025 + .23 * math.sin(a)
        z = .04 + (.025 if i % 2 else 0)

        upper.extend(builder.ring([point(x, y, z)]))
        lower.extend(builder.ring([
            point(x * .96, y, -.025),
        ]))

    for i in range(n):
        builder.face(
            (heel, upper[i], upper[i + 1]),
            17 if i % 2 else 10,
        )
        builder.face(
            (lower_heel, lower[i + 1], lower[i]), 17,
        )
        builder.face(
            (upper[i], lower[i], lower[i + 1], upper[i + 1]),
            17,
        )

    builder.face(
        (heel, lower_heel, lower[0], upper[0]), 17,
    )
    builder.face(
        (heel, upper[-1], lower[-1], lower_heel), 17,
    )


def keyboard_height(p):
    depth = 0.0

    for cx, cy, width, height in KEYS:
        radius = .12
        qx = abs(p.x - cx) - width / 2 + radius
        qy = abs(p.y - cy) - height / 2 + radius
        signed = (
            math.hypot(max(qx, 0), max(qy, 0))
            + min(max(qx, qy), 0)
            - radius
        )
        depth = max(
            depth, .02 * min(1, max(0, -signed / .035)),
        )

    for seam in (-1.14, -.53, .08, .69):
        depth = max(
            depth,
            .012 * min(
                1, max(0, (.023 - abs(p.y - seam)) / .012),
            ),
        )

    return .28 - depth


def build_keyboard():
    builder = Builder()

    raw = [
        (-3.38, -1.75),
        (-2.8, -1.75),
        (-2.68, -1.70),
        (-2.55, -1.75),
        (-.3, -1.75),
        (-.2, -1.72),
        (1.7, -1.75),
        (3.48, -1.75),
        (3.65, -1.66),
        (3.7, -1.48),
        (3.7, -.7),
        (3.66, -.6),
        (3.7, .9),
        (3.63, 1.20),
        (3.45, 1.3),
        (1.8, 1.3),
        (1.69, 1.25),
        (1.58, 1.3),
        (-1.2, 1.3),
        (-1.3, 1.26),
        (-3.37, 1.3),
        (-3.55, 1.22),
        (-3.6, 1.05),
        (-3.6, -.6),
        (-3.55, -.72),
        (-3.6, -1.47),
    ]
    center = (.05, -.225)
    outline = [
        (
            center[0] + (x - center[0]) * .985,
            center[1] + (y - center[1]) * .985,
        )
        for x, y in raw
    ]

    regions = []

    for row in range(5):
        y = -1.45 + row * .61

        for line in range(2):
            x = -3.1 + .38 * ((row + line) % 3)
            points = [
                (x, y + line * .16),
                (x + 1.1, y + .035 + line * .16),
                (x + 2.5, y + .01 + line * .16),
                (min(3.2, x + 5.6), y + .045 + line * .16),
            ]
            regions.append((
                stroke(points, .014 + .005 * (row % 2)),
                11,
            ))

    for seam in (-1.14, -.53, .08, .69):
        for half in (.023, .011):
            regions.append(([
                (-3.8, seam - half),
                (3.9, seam - half),
                (3.9, seam + half),
                (-3.8, seam + half),
            ], 11))

    for cx, cy, width, height in KEYS:
        regions.append((
            rounded_rect(cx, cy, width, height, .12),
            13,
        ))
        regions.append((
            rounded_rect(
                cx, cy, width - .07, height - .07, .085,
            ),
            14,
        ))

    partitioned_solid(
        builder,
        outline,
        regions,
        keyboard_height,
        [
            (1 / .985, .15),
            (1 / .985, -.34),
            (.98, -.50),
        ],
        14,
        center,
    )
    deck_end = len(builder.vertices)

    route = rounded_rect(
        .05, -.225, 7.48, 3.23, .20, 5,
    )
    axis = resample_closed(route, 96)

    # 두 가닥의 외곽 반지름 합이 0.04로, 밧줄 전체 굵기는 0.08이다.
    for strand in range(2):
        path = []

        for i, p in enumerate(axis):
            tangent = (
                axis[(i + 1) % len(axis)] - axis[i - 1]
            ).normalized()
            normal = Vector((-tangent.y, tangent.x))
            phase = (
                math.tau * 16 * i / len(axis)
                + math.pi * strand
            )
            offset = .016 * math.cos(phase) * normal

            path.append((
                p.x + offset.x,
                p.y + offset.y,
                .24 + .016 * math.sin(phase),
            ))

        tube(builder, path, .024, 13)

    for cx in (-3.48, 3.58):
        for cy in (-1.49, 1.04):
            for wrap in (-.048, .048):
                path = [
                    (
                        cx + wrap + .009 * math.sin(2 * a),
                        cy + .23 * math.cos(a),
                        -.035 + .405 * math.sin(a),
                    )
                    for a in (
                        math.tau * i / 14 for i in range(14)
                    )
                ]
                tube(builder, path, .034, 13)

    add_shell(builder, -3.17, -1.73, -.28)
    add_shell(builder, 3.27, -1.73, .28)

    obj = builder.finish("driftKeyboard")
    lower, upper = bounds(builder.vertices[:deck_end])

    assert (
        lower - Vector((-3.6, -1.75, -.5))
    ).length < EPS
    assert (
        upper - Vector((3.7, 1.3, .28))
    ).length < EPS

    return obj


def stone_outline(variant):
    points = []

    for i in range(24):
        a = math.tau * i / 24
        radius = (
            1
            + .032 * math.sin(3 * a + variant * .9)
            + .018 * math.cos(5 * a + variant)
        )
        points.append((
            radius * math.cos(a),
            radius * math.sin(a),
        ))

    xs, ys = zip(*points)

    return [
        (
            (x - min(xs)) / (max(xs) - min(xs)) - .5,
            (y - min(ys)) / (max(ys) - min(ys)) - .5,
        )
        for x, y in points
    ]


def stone_regions(letter):
    if letter == "A":
        heel = (0, -.19)
        arc = [
            (
                .24 * math.cos(math.pi * i / 12),
                -.025 + .24 * math.sin(math.pi * i / 12),
            )
            for i in range(13)
        ]
        regions = [([heel] + arc, 11)]

        for i in (2, 4, 6, 8, 10):
            endpoint = Vector(arc[i])
            start = Vector(heel).lerp(endpoint, .28)
            end = Vector(heel).lerp(endpoint, .93)

            regions.append((
                stroke([tuple(start), tuple(end)], .013),
                13,
            ))

        return regions

    if letter == "B":
        star = []

        for i in range(10):
            a = math.pi / 2 + i * math.pi / 5
            r = .275 if i % 2 == 0 else .115
            star.append((
                r * math.cos(a),
                r * math.sin(a),
            ))

        return [(star, 18)]

    if letter == "C":
        paths = [
            (
                [(0, -.26), (-.015, -.10), (.025, .07), (0, .26)],
                .047,
            ),
            (
                [(-.006, -.10), (-.135, -.015), (-.20, .12)],
                .039,
            ),
            ([(-.13, -.015), (-.25, .005)], .033),
            ([(-.19, .10), (-.16, .20)], .031),
            (
                [(.005, -.06), (.15, .035), (.21, .18)],
                .039,
            ),
            ([(.15, .035), (.265, .06)], .031),
            (
                [(.02, .10), (-.075, .18), (-.10, .27)],
                .033,
            ),
            ([(.015, .155), (.115, .235)], .032),
        ]

        return [
            (stroke(path, width), 10)
            for path, width in paths
        ]

    points = []

    for i in range(33):
        t = i / 32
        a = -.65 + t * math.tau * 1.62
        r = .265 * (1 - t) + .015
        points.append((
            r * math.cos(a),
            r * math.sin(a),
        ))

    return [(stroke(points, .034), 13)]


def build_stone(letter):
    index = "ABCD".index(letter)
    base = {
        "A": 13,
        "B": 10,
        "C": 13,
        "D": 11,
    }[letter]
    outer = stone_outline(index)
    top = [(x * .875, y * .875) for x, y in outer]
    builder = Builder()

    partitioned_solid(
        builder,
        top,
        stone_regions(letter),
        lambda p: .08,
        [
            (.965 / .875, .057),
            (1 / .875, .015),
            (.985 / .875, -.062),
            (.88 / .875, -.1),
        ],
        base,
    )

    return builder.finish("steppingStone" + letter)


def validate_mesh(obj):
    mesh = obj.data
    mesh.calc_loop_triangles()

    assert (
        LIMITS[obj.name][0]
        <= len(mesh.loop_triangles)
        <= LIMITS[obj.name][1]
    ), (obj.name, len(mesh.loop_triangles))

    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert obj.location.length == 0
    assert tuple(obj.scale) == (1, 1, 1)
    assert obj.rotation_euler.to_matrix().is_identity

    for face in mesh.polygons:
        values = [
            tuple(mesh.uv_layers.active.data[i].uv)
            for i in face.loop_indices
        ]

        for uv in values:
            uv_slot(uv)

        assert all(uv == values[0] for uv in values)

    lower, upper = bounds(v.co for v in mesh.vertices)

    if obj.name == "driftKeyboard":
        x0, x1, y0, y1 = KEY_RECT

        assert not any(
            x0 <= v.co.x <= x1
            and y0 <= v.co.y <= y1
            and v.co.z > .29
            for v in mesh.vertices
        ), "키 영역 위에 형상이 있습니다."

    else:
        assert (
            lower - Vector((-.5, -.5, -.1))
        ).length < EPS, (obj.name, lower)
        assert (
            upper - Vector((.5, .5, .08))
        ).length < EPS, (obj.name, upper)


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]

    assert "sparse" not in accessor

    formats = {
        5121: "B",
        5123: "H",
        5125: "I",
        5126: "f",
    }
    widths = {
        "SCALAR": 1,
        "VEC2": 2,
        "VEC3": 3,
        "VEC4": 4,
    }
    fmt = (
        "<"
        + formats[accessor["componentType"]]
        * widths[accessor["type"]]
    )
    size = struct.calcsize(fmt)
    view = document["bufferViews"][accessor["bufferView"]]

    assert view.get("buffer", 0) == 0

    stride = view.get("byteStride", size)
    start = (
        view.get("byteOffset", 0)
        + accessor.get("byteOffset", 0)
    )

    assert accessor["count"] > 0
    assert stride >= size
    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_embedded_palette(png):
    assert png[:8] == b"\x89PNG\r\n\x1a\n"

    offset, chunks = 8, []

    while offset < len(png):
        size = struct.unpack_from(">I", png, offset)[0]
        kind = png[offset + 4:offset + 8]
        payload = png[offset + 8:offset + 8 + size]
        crc = struct.unpack_from(
            ">I", png, offset + 8 + size,
        )[0]

        assert zlib.crc32(kind + payload) & 0xffffffff == crc

        chunks.append((kind, payload))
        offset += 12 + size

    assert offset == len(png)
    assert chunks[-1][0] == b"IEND"

    header, = [
        payload for kind, payload in chunks
        if kind == b"IHDR"
    ]
    (
        width, height, depth, color, comp, filt, interlace,
    ) = struct.unpack(">IIBBBBB", header)

    assert (
        width, height, depth, comp, filt, interlace,
    ) == (128, 4, 8, 0, 0, 0)
    assert color in (2, 6)

    channels = 3 if color == 2 else 4
    stride = width * channels
    raw = zlib.decompress(b"".join(
        p for k, p in chunks if k == b"IDAT"
    ))

    assert len(raw) == height * (stride + 1)

    previous, rows = bytearray(stride), []

    for y in range(height):
        start = y * (stride + 1)
        filtering = raw[start]

        assert 0 <= filtering <= 4

        row = bytearray(
            raw[start + 1:start + 1 + stride]
        )

        for x in range(stride):
            left = (
                row[x - channels] if x >= channels else 0
            )
            above = previous[x]
            diagonal = (
                previous[x - channels] if x >= channels else 0
            )
            predictor = left + above - diagonal
            distances = [
                abs(predictor - n)
                for n in (left, above, diagonal)
            ]
            paeth = (
                left, above, diagonal,
            )[distances.index(min(distances))]

            row[x] = (
                row[x]
                + (
                    0,
                    left,
                    above,
                    (left + above) // 2,
                    paeth,
                )[filtering]
            ) & 255

        rows.append(row)
        previous = row

    # Blender의 y=2 중앙 행은 PNG의 위에서 두 번째 행(y=1)이다.
    for slot, expected in EXPECTED.items():
        rgb = rows[height - 1 - 2][
            (slot * 4 + 2) * channels:
        ][:3]
        actual = "#" + "".join(f"{c:02X}" for c in rgb)

        assert actual == expected, (slot, actual, expected)


def verify_glb(path, obj):
    data = path.read_bytes()

    assert struct.unpack_from("<4sII", data) == (
        b"glTF", 2, len(data),
    )

    offset, chunks = 12, {}

    while offset < len(data):
        size, kind = struct.unpack_from(
            "<I4s", data, offset,
        )

        assert size % 4 == 0
        assert offset + 8 + size <= len(data)
        assert kind not in chunks

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)

    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]
    buffer, = document["buffers"]

    assert "uri" not in buffer
    assert (
        buffer["byteLength"]
        <= len(binary)
        < buffer["byteLength"] + 4
    )

    mesh, = document["meshes"]
    node, = document["nodes"]
    material, = document["materials"]

    assert node["mesh"] == 0
    assert node["name"] == mesh["name"] == obj.name
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert material["name"] == "palette"

    primitive, = mesh["primitives"]

    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]

    assert {
        "POSITION", "NORMAL", "TEXCOORD_0",
    }.issubset(attributes)
    assert not any(
        k.startswith("COLOR_") for k in attributes
    )

    points = [
        Vector(p)
        for p in accessor_rows(
            document, binary, attributes["POSITION"],
        )
    ]
    normals = accessor_rows(
        document, binary, attributes["NORMAL"],
    )
    uvs = accessor_rows(
        document, binary, attributes["TEXCOORD_0"],
    )

    assert len(points) == len(normals) == len(uvs)

    for normal in normals:
        assert abs(Vector(normal).length - 1) < 1e-4

    for uv in uvs:
        uv_slot(uv)

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"],
        )
    ]

    assert len(indices) % 3 == 0

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a]).cross(
                points[c] - points[a]
            ).length > 2e-10
        )
        assert uvs[a] == uvs[b] == uvs[c]

    count = len(indices) // 3

    assert count == len(obj.data.loop_triangles)
    assert (
        LIMITS[obj.name][0]
        <= count
        <= LIMITS[obj.name][1]
    )

    lower, upper = bounds(points)
    expected_lower, expected_upper = bounds(
        (v.co.x, v.co.z, -v.co.y)
        for v in obj.data.vertices
    )

    assert (lower - expected_lower).length < EPS
    assert (upper - expected_upper).length < EPS

    if obj.name == "driftKeyboard":
        x0, x1, y0, y1 = KEY_RECT

        assert not any(
            x0 <= p.x <= x1
            and y0 <= -p.z <= y1
            and p.y > .29
            for p in points
        )

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0
    assert (
        material["pbrMetallicRoughness"]
        ["baseColorTexture"]["index"] == 0
    )
    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)

    verify_embedded_palette(
        binary[start:start + view["byteLength"]]
    )

    blender_lower, blender_upper = bounds(
        v.co for v in obj.data.vertices
    )

    return {
        "name": obj.name,
        "file": str(path),
        "triangles": count,
        "blender_bounds": {
            "min": list(blender_lower),
            "max": list(blender_upper),
        },
        "glb_bounds": {
            "min": list(lower),
            "max": list(upper),
        },
        "blender_dimensions": list(
            blender_upper - blender_lower
        ),
        "glb_dimensions": list(upper - lower),
        "front_blender": [0, -1, 0],
        "front_glb": [0, 0, 1],
        "origin_blender": [0, 0, 0],
        "export_yup": True,
        "palette_slots": sorted({
            uv_slot(uv) for uv in uvs
        }),
        "key_clearance_z": (
            .29 if obj.name == "driftKeyboard" else None
        ),
        "pattern": (
            "recessed_key_seats"
            if obj.name == "driftKeyboard"
            else "integrated_coplanar_faces"
        ),
    }


def export_glb(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    path = OUTPUT / (obj.name + ".glb")

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

    return verify_glb(path, obj)


def preview_material(name, color):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    return material


def preview_face(scene, name, polygon, z, material):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(
        [(x, y, z) for x, y in polygon],
        [],
        [tuple(range(len(polygon)))],
    )
    mesh.materials.append(material)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)

    return obj


def make_preview(objects):
    scene = bpy.data.scenes.new("propsB-preview")
    scene.render.engine = "BLENDER_WORKBENCH"

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 1.3
    shading.curvature_valley_factor = 1.1
    shading.cavity_ridge_factor = 1.2
    shading.cavity_valley_factor = 1.0
    shading.show_object_outline = False
    shading.show_specular_highlight = False
    shading.background_type = "WORLD"

    scene.world = bpy.data.worlds.new("propsB-world")
    scene.world.color = (.78, .70, .57)
    scene.display.render_aa = "32"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"

    scene.render.resolution_x = 1700
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = str(OUTPUT / "propsB.png")

    clones = []

    for i, source in enumerate(objects):
        clone = bpy.data.objects.new(
            "preview-" + source.name, source.data,
        )
        scene.collection.objects.link(clone)

        if i == 0:
            clone.location = (0, .85, .5)
        else:
            clone.scale = (1.35,) * 3
            clone.location = (
                -2.55 + (i - 1) * 1.7,
                -2.1,
                .135,
            )

        clones.append(clone)

    grey = preview_material(
        "preview-only-grey-keys", (.42, .44, .43),
    )

    for i, (cx, cy, width, height) in enumerate(KEYS):
        preview_face(
            scene,
            f"preview-only-key-{i}",
            rounded_rect(
                cx,
                cy + .85,
                width - .09,
                height - .09,
                .085,
            ),
            .5 + .30,
            grey,
        )

    sand = preview_material(
        "preview-only-sand", (.80, .69, .51),
    )
    preview_face(
        scene,
        "preview-only-floor",
        [
            (-100, -100),
            (100, -100),
            (100, 100),
            (-100, 100),
        ],
        -.008,
        sand,
    )

    for layer in scene.view_layers:
        layer.update()

    points = [
        clone.matrix_world @ v.co
        for clone in clones
        for v in clone.data.vertices
    ]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2
    direction = Vector((0, -1, 1)).normalized()
    rotation = (-direction).to_track_quat("-Z", "Y")
    basis = rotation.to_matrix()

    screen_lower, screen_upper = bounds(
        basis.transposed() @ (p - pivot)
        for p in points
    )
    target = pivot + basis @ Vector((
        (screen_lower.x + screen_upper.x) / 2,
        (screen_lower.y + screen_upper.y) / 2,
        0,
    ))

    camera = bpy.data.objects.new(
        "propsB-front-above-45",
        bpy.data.cameras.new("propsB-camera"),
    )
    scene.collection.objects.link(camera)

    camera.data.type = "ORTHO"
    camera.data.clip_start = .01
    camera.data.clip_end = 300
    camera.location = target + direction * 30
    camera.rotation_euler = rotation.to_euler()
    camera.data.ortho_scale = 1

    frame_lower, frame_upper = bounds(
        camera.data.view_frame(scene=scene)
    )
    camera.data.ortho_scale = 1.16 * max(
        (screen_upper.x - screen_lower.x)
        / (frame_upper.x - frame_lower.x),
        (screen_upper.y - screen_lower.y)
        / (frame_upper.y - frame_lower.y),
    )

    scene.camera = camera

    return scene


def main():
    load_palette()

    scene = bpy.data.scenes.new("propsB-export")
    bpy.context.window.scene = scene

    objects = [build_keyboard()] + [
        build_stone(letter) for letter in "ABCD"
    ]
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    records = [export_glb(obj) for obj in objects]

    # 확인용 키와 바닥은 모든 GLB 내보내기가 끝난 뒤 별도 장면에만 만든다.
    preview = make_preview(objects)
    bpy.context.window.scene = preview

    result = bpy.ops.render.render(
        write_still=True,
        scene=preview.name,
    )

    assert result == {"FINISHED"}

    png = OUTPUT / "propsB.png"
    data = png.read_bytes()

    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", data, 16) == (
        1700, 1100,
    )

    for record in records:
        record["comparison"] = {
            "file": str(png),
            "engine": "BLENDER_WORKBENCH",
            "color_type": "TEXTURE",
            "view_direction": [0, -1, 1],
            "temporary_grey_key_planes": True,
            "grey_keys_exported": False,
            "stone_order_left_to_right": list("ABCD"),
        }

        path = OUTPUT / (record["name"] + ".json")
        path.write_text(
            json.dumps(
                record,
                ensure_ascii=False,
                indent=2,
            ) + "\n",
            encoding="utf-8",
        )

    print(json.dumps(
        records,
        ensure_ascii=False,
        indent=2,
    ))


if __name__ == "__main__":
    main()
