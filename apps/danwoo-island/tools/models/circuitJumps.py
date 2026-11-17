"""
Blender 5.3 — circuitJumps.py

실행:
blender -b --factory-startup --disable-autoexec --python tools/models/circuitJumps.py

Blender 좌표: X 가로, +Y 진행, Z 위. 각 모델의 원점·회전·스케일을 유지한다.
끝면의 지지 통나무는 안쪽으로 파인 홈에 배치하여 지정 길이를 넘지 않는다.
깃발은 왼쪽 기둥에 3개, 오른쪽 기둥에 2개를 세로로 배치한다.
착지대와 이륙대의 높은 끝이 수로를 마주 보도록 비교 장면을 구성한다.

작성 시 Blender 5.3에서 기하·팔레트·레이캐스트 검사를 메모리로 실행했다.
GLB 저장·재검사와 PNG 렌더·재검사는 이 스크립트 실행 시 수행한다.
기존 .blend와 견본 Python 파일을 불러오거나 실행하지 않는다.
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
from mathutils.bvhtree import BVHTree
from mathutils.geometry import tessellate_polygon


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "jumps"

EPS = 1e-5
IMAGE_SIZE = (1800, 1200)
SURFACE_PARTS = {"deck", "groove", "edge_stripe"}
ORNAMENT_PARTS = {"socket", "bamboo", "rope", "flag"}

EXPECTED = {
    1: "#EBD1A3",
    2: "#574E37",
    3: "#3DBBE7",
    8: "#E4A90C",
    10: "#E49A78",
    11: "#988165",
    12: "#ABAE2B",
    13: "#A49876",
    14: "#B36D45",
    16: "#ED3F1C",
    17: "#FDE6E2",
    18: "#F8A658",
    22: "#1E0603",
    23: "#FFF2E8",
}

PART_SLOTS = {
    "body": {2, 14},
    "deck": {14},
    "groove": {2},
    "edge_stripe": {16, 23},
    "end_wall": {2, 14},
    "wood_grain": {11},
    "support_log": {11, 14},
    "socket": {14},
    "bamboo": {8},
    "rope": {13},
    "flag": {10, 18, 3, 12, 17},
    "arrow_black": {22},
    "arrow_yellow": {8},
}

SPECS = {
    "jumpTakeoff": {
        "length": 9.0,
        "height": 1.8,
        "boards": 10,
        "budget": (1500, 5000),
        "maximum_protrusion": .02,
        "height_function": "z = 0.2 * y",
    },
    "jumpLanding": {
        "length": 8.0,
        "height": 1.0,
        "boards": 9,
        "budget": (1200, 4500),
        "maximum_protrusion": 0.0,
        "height_function": "z = 1 - y / 8",
    },
    "jumpKicker": {
        "length": 3.6,
        "height": .45,
        "boards": 5,
        "budget": (400, 2000),
        "maximum_protrusion": .005,
        "height_function": "z = 0.15 * min(y, 3)",
    },
}

XS = [
    -5, -4.96, -4.75, -4.6, -4.5, -3.7, -3.6, -2, 0,
    2, 3.6, 3.7, 4.5, 4.6, 4.75, 4.96, 5,
]
LEVELS = [0, .04, .08, .32, .34, .65, .67, .92, .96, 1]


def height(name, y):
    if name == "jumpTakeoff":
        return .2 * y
    if name == "jumpLanding":
        return 1 - y / 8
    return .15 * min(y, 3)


def bounds(points):
    points = list(points)
    assert points

    return tuple(
        Vector(tuple(fn(p[axis] for p in points) for axis in range(3)))
        for fn in (min, max)
    )


def check_palette_image(image):
    assert tuple(image.size) == (128, 4)
    image.colorspace_settings.name = "sRGB"

    pixels = list(image.pixels)
    colors = {}

    for slot, expected in EXPECTED.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        actual = "#" + "".join(
            f"{round(pixels[offset + channel] * 255):02X}"
            for channel in range(3)
        )

        assert actual == expected, (slot, actual, expected)
        assert pixels[offset + 3] > .999
        colors[slot] = actual

    return colors


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
        self.lookup = {}

    def vertex(self, point):
        point = tuple(point)
        key = tuple(round(component, 10) for component in point)

        if key not in self.lookup:
            self.lookup[key] = len(self.vertices)
            self.vertices.append(point)

        return self.lookup[key]

    def face(self, points, slot, part):
        points = [Vector(point) for point in points]

        if len(points) == 3:
            triangles = [points]
        elif len(points) == 4:
            triangles = [
                points[:3],
                [points[0], points[2], points[3]],
            ]
        else:
            # Blender 5.3은 좌표가 아니라 정점 인덱스 삼중항을 반환한다.
            triangles = [
                [points[index] for index in triangle]
                for triangle in tessellate_polygon([points])
            ]

        for triangle in triangles:
            area_vector = (
                (triangle[1] - triangle[0])
                .cross(triangle[2] - triangle[0])
            )

            # 높이 0인 쐐기 끝에서 접히는 면만 제외한다.
            if area_vector.length <= 2e-10:
                continue

            indices = tuple(self.vertex(point) for point in triangle)
            assert len(set(indices)) == 3

            self.faces.append(indices)
            self.tags.append((slot, part))

    def bridge(self, first, second, slot, part):
        assert len(first) == len(second)

        for index in range(len(first)):
            following = (index + 1) % len(first)
            self.face(
                [
                    first[index],
                    first[following],
                    second[following],
                    second[index],
                ],
                slot,
                part,
            )

    def finish(self):
        assert bpy.data.objects.get(self.name) is None

        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        assert not mesh.validate()

        roles = list(dict.fromkeys(part for _, part in self.tags))
        bm = bmesh.new()

        try:
            bm.from_mesh(mesh)
            slot_layer = bm.faces.layers.int.new("palette_slot")
            part_layer = bm.faces.layers.int.new("part_id")

            for face, (slot, part) in zip(bm.faces, self.tags, strict=True):
                face[slot_layer] = slot
                face[part_layer] = roles.index(part)

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

                assert abs(volume) > 1e-12, (self.name, "zero volume")

                if volume < 0:
                    bmesh.ops.reverse_faces(bm, faces=list(component))

                components += 1

            assert all(
                edge.is_manifold and edge.is_contiguous
                for edge in bm.edges
            ), (self.name, "open or inconsistent edges")
            assert all(face.calc_area() > 1e-10 for face in bm.faces)

            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for face in mesh.polygons:
            slot = mesh.attributes["palette_slot"].data[face.index].value
            face.use_smooth = False

            for loop in face.loop_indices:
                uv.data[loop].uv = ((slot + .5) / 32, .5)

        mesh.update()
        mesh.calc_loop_triangles()

        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        return obj, roles, components


def plank_edges(name):
    spec = SPECS[name]

    if name == "jumpKicker":
        return [0, .75, 1.5, 2.25, 3, 3.6]

    return [
        spec["length"] * index / spec["boards"]
        for index in range(spec["boards"] + 1)
    ]


def deck_z(name, x, y):
    nominal = height(name, y)
    distance_to_seam = min(
        (abs(y - edge) for edge in plank_edges(name)[1:-1]),
        default=10,
    )
    groove = .012 * max(0, 1 - distance_to_seam / .028)
    shoulder = .010 * max(0, (abs(x) - 4.96) / .04)

    # 나뭇결을 얹어도 기준 경사면보다 높아지지 않도록 바탕을 4mm 내린다.
    return max(
        0,
        nominal
        - min(.004, nominal * .1)
        - min(groove + shoulder, nominal * .2),
    )


def cross_section(name, y):
    top = [(x, y, deck_z(name, x, y)) for x in XS]

    right = [
        (5, y, deck_z(name, 5, y) * fraction)
        for fraction in reversed(LEVELS[1:-1])
    ]

    # 윗면과 같은 X 분할을 사용하여 높이 0인 끝에서도 T 접합을 없앤다.
    bottom = [(x, y, 0) for x in reversed(XS)]

    left = [
        (-5, y, deck_z(name, -5, y) * fraction)
        for fraction in LEVELS[1:-1]
    ]

    return top + right + bottom + left


def make_deck(builder):
    name = builder.name
    spec = SPECS[name]
    edges = plank_edges(name)

    stations = sorted({
        0,
        spec["length"],
        *(
            edge + offset
            for edge in edges[1:-1]
            for offset in (-.028, 0, .028)
        ),
    })
    rings = [cross_section(name, y) for y in stations]

    for first, second in zip(rings, rings[1:]):
        middle_y = (first[0][1] + second[0][1]) / 2
        board = next(
            index
            for index in range(len(edges) - 1)
            if edges[index] <= middle_y <= edges[index + 1]
        )

        for index in range(len(first)):
            following = (index + 1) % len(first)
            slot = 14
            part = "body"

            if index < len(XS) - 1:
                middle_x = (XS[index] + XS[index + 1]) / 2
                part = "deck"

                if abs(middle_x) >= 4.75:
                    slot = 16 if board % 2 == 0 else 23
                    part = "edge_stripe"
                elif abs(
                    middle_y - min(edges, key=lambda edge: abs(edge - middle_y))
                ) < .029:
                    slot = 2
                    part = "groove"

            elif (
                len(XS) + len(LEVELS) - 2
                <= index
                < len(XS) * 2 + len(LEVELS) - 3
            ):
                slot = 2

            else:
                middle_z = (
                    first[index][2]
                    + first[following][2]
                    + second[index][2]
                    + second[following][2]
                ) / 4
                fraction = middle_z / max(height(name, middle_y), 1e-9)

                if .32 < fraction < .34 or .65 < fraction < .67:
                    slot = 2

            builder.face(
                [
                    first[index],
                    first[following],
                    second[following],
                    second[index],
                ],
                slot,
                part,
            )

    high_y = 0 if name == "jumpLanding" else spec["length"]

    for y in (0, spec["length"]):
        if height(name, y) < EPS:
            continue

        def point(x, fraction):
            is_log_recess = (
                name != "jumpKicker"
                and y == high_y
                and 3.7 - EPS <= abs(x) <= 4.5 + EPS
                and .08 - EPS <= fraction <= .92 + EPS
            )
            recess = .6 if is_log_recess else 0
            recessed_y = y + (recess if y == 0 else -recess)

            return (
                x,
                recessed_y,
                deck_z(name, x, y) * fraction,
            )

        for first_x, second_x in zip(XS, XS[1:]):
            for first_level, second_level in zip(LEVELS, LEVELS[1:]):
                builder.face(
                    [
                        point(first_x, first_level),
                        point(second_x, first_level),
                        point(second_x, second_level),
                        point(first_x, second_level),
                    ],
                    2 if first_level in (.32, .65) else 14,
                    "end_wall",
                )


def column(builder, x, y, profiles, slot, part, sides=8):
    rings = [
        [
            (
                x + radius * math.cos(math.tau * index / sides),
                y + radius * math.sin(math.tau * index / sides),
                z,
            )
            for index in range(sides)
        ]
        for z, radius in profiles
    ]

    end_slot = 11 if part == "support_log" else slot
    builder.face(list(reversed(rings[0])), end_slot, part)

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, slot, part)

    builder.face(rings[-1], end_slot, part)


def prism(builder, outline, top, bottom, slot, part):
    upper = [(x, y, top(x, y)) for x, y in outline]
    lower = [(x, y, bottom(x, y)) for x, y in outline]

    builder.face(upper, slot, part)
    builder.face(list(reversed(lower)), slot, part)
    builder.bridge(lower, upper, slot, part)


def add_grain(builder):
    edges = plank_edges(builder.name)

    for board, (first, second) in enumerate(zip(edges, edges[1:])):
        for index, x in enumerate((-2.8, 0, 2.8)):
            y = (first + second) / 2 + (index - 1) * .09
            span = 1.7 + .15 * ((board + index) % 3)

            outline = [
                (x - span / 2, y),
                (x - .12, y - .012),
                (x + span / 2, y + .004),
                (x + .18, y + .015),
            ]

            prism(
                builder,
                outline,
                lambda x, y: height(builder.name, y) - .001,
                lambda x, y: height(builder.name, y) - .002,
                11,
                "wood_grain",
            )


def binding(builder, x, y, z):
    rings = []

    for index in range(12):
        theta = math.tau * index / 12
        ring = []

        for side in range(4):
            phi = math.tau * side / 4
            radius = .145 + .022 * math.cos(phi)
            ring.append((
                x + radius * math.cos(theta),
                y + radius * math.sin(theta),
                z + .022 * math.sin(phi),
            ))

        rings.append(ring)

    for index in range(12):
        builder.bridge(
            rings[index], rings[(index + 1) % 12], 13, "rope",
        )


def flag(builder, x, y, z, direction, slot):
    front = [
        (x - .006, y, z + .15),
        (x - .006, y + direction * .78, z - .10),
        (x - .006, y, z - .23),
    ]
    back = [(px + .012, py, pz) for px, py, pz in front]

    builder.face(front, slot, "flag")
    builder.face(list(reversed(back)), slot, "flag")
    builder.bridge(front, back, slot, "flag")


def add_decorations(builder):
    name = builder.name
    spec = SPECS[name]
    end = 0 if name == "jumpLanding" else spec["length"]
    direction = 1 if end == 0 else -1
    high = spec["height"]

    for sign in (-1, 1):
        column(
            builder,
            sign * 4.1,
            end + direction * .33,
            [
                (.06, .25),
                (.12, .32),
                (high - .26, .32),
                (high - .20, .25),
            ],
            14,
            "support_log",
        )

        x = sign * 4.91
        y = end + direction * .18

        column(
            builder,
            x,
            y,
            [
                (high - .12, .12),
                (high - .06, .17),
                (high + .04, .17),
                (high + .08, .12),
            ],
            14,
            "socket",
        )

        column(
            builder,
            x,
            y,
            [
                (high, .11),
                (high + .06, .135),
                (high + .48, .12),
                (high + .52, .145),
                (high + .56, .12),
                (high + 1.12, .115),
                (high + 1.17, .14),
                (high + 1.22, .115),
                (high + 1.76, .10),
                (high + 1.8, .075),
            ],
            8,
            "bamboo",
        )

        for z in (high + .25, high + 1.55):
            binding(builder, x, y, z)

        colors = (10, 18, 3) if sign < 0 else (12, 17)
        centers = (
            (high + .40, high + .94, high + 1.48)
            if sign < 0
            else (high + .65, high + 1.32)
        )

        for color, z in zip(colors, centers, strict=True):
            flag(builder, x, y, z, direction, color)


def add_arrows(builder):
    prism(
        builder,
        [(-3.7, .18), (3.7, .18), (3.7, 2.90), (-3.7, 2.90)],
        lambda x, y: height(builder.name, y) + .001,
        lambda x, y: height(builder.name, y) + .0005,
        22,
        "arrow_black",
    )

    for y in (1.10, 2.22):
        # 두 셰브론의 꼭짓점은 모두 +Y를 향한다.
        outline = [
            (-3.25, y - .28),
            (0, y + .48),
            (3.25, y - .28),
            (3.25, y - .65),
            (0, y + .11),
            (-3.25, y - .65),
        ]

        prism(
            builder,
            outline,
            lambda x, y: height(builder.name, y) + .003,
            lambda x, y: height(builder.name, y) + .002,
            8,
            "arrow_yellow",
        )


def build_all():
    objects = {}

    for name in SPECS:
        builder = Builder(name)
        make_deck(builder)
        add_grain(builder)

        if name == "jumpKicker":
            add_arrows(builder)
        else:
            add_decorations(builder)

        objects[name] = builder.finish()

    return objects


def clip_plane(points, axis, boundary, sign):
    result = []

    if not points:
        return result

    for first, second in zip(points, points[1:] + points[:1]):
        first_distance = sign * (first[axis] - boundary)
        second_distance = sign * (second[axis] - boundary)

        if first_distance >= 0:
            result.append(first)

        if (first_distance >= 0) != (second_distance >= 0):
            result.append(first.lerp(
                second,
                first_distance / (first_distance - second_distance),
            ))

    return result


def check_triangle_clearance(name, points):
    points = clip_plane(points, 0, -4.6, 1)
    points = clip_plane(points, 0, 4.6, -1)

    intervals = (
        [(0, 3), (3, 3.6)]
        if name == "jumpKicker"
        else [(0, SPECS[name]["length"])]
    )
    limit = SPECS[name]["maximum_protrusion"]

    # 잘린 삼각형과 높이 함수가 모두 선형이므로 교차점까지 검사하면
    # 원래 정점이 금지 영역 밖에 있는 면의 침범도 빠짐없이 잡는다.
    for first, second in intervals:
        clipped = clip_plane(points, 1, first, 1)
        clipped = clip_plane(clipped, 1, second, -1)

        for point in clipped:
            assert point.z <= height(name, point.y) + limit + EPS, (
                name,
                "금지 영역 돌출",
                tuple(point),
                height(name, point.y),
            )


def slot_from_uv(uv):
    u, v = uv
    slot = round(u * 32 - .5)

    assert slot in EXPECTED
    assert abs(u - (slot + .5) / 32) < 1e-7
    assert abs(v - .5) < 1e-7

    return slot


def check_bounds(name, points):
    lower, upper = bounds(points)
    spec = SPECS[name]
    allowed_x = 5 if name == "jumpKicker" else 5.3
    allowed_z = spec["height"] + (
        .005 if name == "jumpKicker" else 1.8
    )

    assert lower.x >= -allowed_x - EPS
    assert upper.x <= allowed_x + EPS
    assert abs(lower.y) < EPS
    assert abs(upper.y - spec["length"]) < EPS
    assert abs(lower.z) < EPS
    assert upper.z <= allowed_z + EPS

    return lower, upper


def check_surface_rays(obj, roles):
    name = obj.name
    mesh = obj.data
    spec = SPECS[name]
    parts = mesh.attributes["part_id"].data
    vertices = [vertex.co for vertex in mesh.vertices]

    surface_faces = [
        tuple(face.vertices)
        for face in mesh.polygons
        if roles[parts[face.index].value] in SURFACE_PARTS
    ]

    surface_tree = BVHTree.FromPolygons(
        vertices, surface_faces, all_triangles=True,
    )
    full_tree = BVHTree.FromPolygons(
        vertices,
        [tuple(face.vertices) for face in mesh.polygons],
        all_triangles=True,
    )

    ys = sorted({
        .0001,
        spec["length"] - .0001,
        *(spec["length"] * index / 160 for index in range(1, 160)),
        *(
            max(.0001, min(spec["length"] - .0001, edge + offset))
            for edge in plank_edges(name)
            for offset in (-.028, 0, .028)
        ),
    })

    maximum_error = 0
    driving_rays = 0

    for index in range(65):
        x = -4.999 + 9.998 * index / 64

        for y in ys:
            origin = Vector((x, y, 6))
            direction = Vector((0, 0, -1))
            point, _, _, _ = surface_tree.ray_cast(origin, direction, 10)

            assert point is not None, (name, "경사면 구멍", x, y)
            error = abs(point.z - height(name, y))
            maximum_error = max(maximum_error, error)
            assert error <= .03 + EPS, (name, "경사면 오차", x, y, error)

            if abs(x) <= 4.6:
                hit, _, _, _ = full_tree.ray_cast(origin, direction, 10)
                assert hit is not None

                error = abs(hit.z - height(name, y))
                maximum_error = max(maximum_error, error)
                assert error <= .03 + EPS
                assert (
                    hit.z
                    <= height(name, y) + spec["maximum_protrusion"] + EPS
                )
                driving_rays += 1

    return {
        "surface_grid_rays": 65 * len(ys),
        "full_mesh_driving_rays": driving_rays,
        "maximum_height_error_m": maximum_error,
        "allowed_height_error_m": .03,
        "maximum_protrusion_m": spec["maximum_protrusion"],
        "groove_boundary_samples": True,
        "all_triangle_clearance": True,
    }


def check_model(obj, roles, components):
    name = obj.name
    mesh = obj.data
    spec = SPECS[name]

    assert obj.type == "MESH"
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert not obj.modifiers
    assert tuple(obj.location) == (0, 0, 0)
    assert tuple(obj.rotation_euler) == (0, 0, 0)
    assert tuple(obj.scale) == (1, 1, 1)
    assert len(mesh.uv_layers) == 1

    lower, upper = check_bounds(name, [v.co for v in mesh.vertices])
    count = len(mesh.loop_triangles)

    assert count == len(mesh.polygons)
    assert spec["budget"][0] <= count <= spec["budget"][1], (name, count)

    slots = mesh.attributes["palette_slot"].data
    parts = mesh.attributes["part_id"].data
    counts = Counter()
    by_part = defaultdict(Counter)
    surface_points = []

    for face in mesh.polygons:
        assert len(face.vertices) == 3
        assert face.area > 1e-10

        slot = slots[face.index].value
        part = roles[parts[face.index].value]
        points = [mesh.vertices[index].co for index in face.vertices]

        assert slot in PART_SLOTS[part]
        check_triangle_clearance(name, points)

        assert all(
            slot_from_uv(mesh.uv_layers.active.data[index].uv) == slot
            for index in face.loop_indices
        )

        if part not in ORNAMENT_PARTS:
            assert all(abs(point.x) <= 5 + EPS for point in points)

        if part in ORNAMENT_PARTS:
            assert all(abs(point.x) > 4.6 for point in points)

        if part in SURFACE_PARTS:
            surface_points.extend(points)

        counts[slot] += 1
        by_part[part][slot] += 1

    surface_lower, surface_upper = bounds(surface_points)
    assert abs(surface_lower.x + 5) < EPS
    assert abs(surface_upper.x - 5) < EPS
    assert abs(surface_lower.y) < EPS
    assert abs(surface_upper.y - spec["length"]) < EPS

    required = {2, 11, 14, 16, 23}

    if name == "jumpKicker":
        required.update({8, 22})
    else:
        required.update({8, 13, 10, 18, 3, 12, 17})

    assert required.issubset(counts)

    return {
        "name": name,
        "triangles": count,
        "triangle_budget": list(spec["budget"]),
        "components": components,
        "single_mesh": True,
        "closed_components": True,
        "blender_bounds": {"min": list(lower), "max": list(upper)},
        "triangles_by_slot": dict(sorted(counts.items())),
        "parts": {
            part: dict(sorted(part_counts.items()))
            for part, part_counts in by_part.items()
        },
        "origin_blender": [0, 0, 0],
        "forward_blender": [0, 1, 0],
        "forward_gltf": [0, 0, -1],
        "length_m": spec["length"],
        "width_m": 10,
        "boards": spec["boards"],
        "height_function": spec["height_function"],
        "stripe_width_m": .25,
        "surface_checks": check_surface_rays(obj, roles),
        "checks": {
            "bounds": True,
            "triangle_budget": True,
            "closed_manifold_components": True,
            "nondegenerate_triangles": True,
            "palette_uv": True,
            "part_slot_whitelist": True,
            "identity_transform": True,
            "forbidden_vertices_and_faces": True,
        },
    }


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
    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    assert view.get("buffer", 0) == 0
    assert accessor["count"] > 0
    assert stride >= size
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    )
    assert view.get("byteOffset", 0) + view["byteLength"] <= len(binary)

    return [
        struct.unpack_from(fmt, binary, start + index * stride)
        for index in range(accessor["count"])
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

    with tempfile.TemporaryDirectory(prefix="jumps-palette-", dir=OUTPUT) as temp:
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
    assert node["mesh"] == 0
    assert scene["nodes"] == [0]
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
    normals = [
        Vector(normal)
        for normal in accessor_rows(document, binary, attributes["NORMAL"])
    ]
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])

    assert len(gltf_points) == len(normals) == len(uvs)
    assert all(abs(normal.length - 1) < 1e-4 for normal in normals)

    slots = [slot_from_uv(uv) for uv in uvs]

    # export_yup=True: Blender (x, y, z) → glTF (x, z, -y).
    points = [Vector((point.x, -point.z, point.y)) for point in gltf_points]
    check_bounds(obj.name, points)

    indices = [
        row[0]
        for row in accessor_rows(document, binary, primitive["indices"])
    ]
    assert len(indices) % 3 == 0

    counts = Counter()
    exported_keys = Counter()

    for offset in range(0, len(indices), 3):
        first, second, third = indices[offset:offset + 3]
        assert min(first, second, third) >= 0
        assert max(first, second, third) < len(points)
        assert slots[first] == slots[second] == slots[third]

        triangle = [points[first], points[second], points[third]]
        area_vector = (
            (triangle[1] - triangle[0])
            .cross(triangle[2] - triangle[0])
        )
        assert area_vector.length > 2e-10

        check_triangle_clearance(obj.name, triangle)
        counts[slots[first]] += 1
        exported_keys[triangle_key(triangle, slots[first])] += 1

    assert len(indices) // 3 == metadata["triangles"]
    assert dict(counts) == metadata["triangles_by_slot"]
    assert exported_keys == mesh_triangle_keys(obj.data)

    verify_embedded_palette(document, binary)
    lower, upper = bounds(gltf_points)

    return {
        "file": str(path),
        "glb_verified": True,
        "export_yup": True,
        "mesh_count": 1,
        "primitive_count": 1,
        "material": "palette",
        "embedded_palette_verified": True,
        "exported_geometry_matches_checked_mesh": True,
        "glb_bounds": {"min": list(lower), "max": list(upper)},
        "glb_dimensions": list(upper - lower),
        "glb_triangles_by_slot": dict(sorted(counts.items())),
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
    assert path.is_file()
    return verify_glb(path, obj, metadata)


def preview_clone(scene, source, position):
    obj = bpy.data.objects.new("preview-" + source.name, source.data)
    scene.collection.objects.link(obj)
    obj.location = position
    return obj


def preview_block(name, first_x, second_x, first_y, second_y, z, slot):
    builder = Builder(name)
    prism(
        builder,
        [
            (first_x, first_y),
            (second_x, first_y),
            (second_x, second_y),
            (first_x, second_y),
        ],
        lambda x, y: z,
        lambda x, y: z - .08,
        slot,
        "scenery",
    )
    return builder.finish()[0]


def make_preview_scene(objects):
    scene = bpy.data.scenes.new("jumps-comparison")
    bpy.context.window.scene = scene

    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = IMAGE_SIZE[0]
    scene.render.resolution_y = IMAGE_SIZE[1]
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

    world = bpy.data.worlds.new("jumps-preview-world")
    world.color = (.84, .76, .61)
    scene.world = world

    # 높은 끝은 각각 Y=9, Y=12이다. 착지대도 +Y 진행 방향을 유지한다.
    clones = [
        preview_clone(scene, objects["jumpTakeoff"], (0, 0, 0)),
        preview_clone(scene, objects["jumpLanding"], (0, 12, 0)),
        preview_clone(scene, objects["jumpKicker"], (13, 7, 0)),
    ]

    preview_block("preview-sand", -100, 100, -100, 100, -.20, 1)
    preview_block("preview-channel", -6.5, 6.5, 9, 12, -.08, 3)
    preview_block("preview-near-bank", -6.5, 6.5, -1, 9, -.04, 1)
    preview_block("preview-far-bank", -6.5, 6.5, 12, 21, -.04, 1)

    for index, x in enumerate((-5.8, 5.8)):
        preview_block(
            f"preview-water-glint-{index}",
            x - .18,
            x + .18,
            9.75,
            11.15,
            -.075,
            23,
        )

    scene.view_layers[0].update()

    points = [
        clone.matrix_world @ vertex.co
        for clone in clones
        for vertex in clone.data.vertices
    ]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2

    elevation = math.radians(35)
    horizontal = Vector((.85, -.53, 0)).normalized()
    direction = (
        horizontal * math.cos(elevation)
        + Vector((0, 0, math.sin(elevation)))
    )
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
        "jumps-camera",
        bpy.data.cameras.new("jumps-camera"),
    )
    scene.collection.objects.link(camera)

    camera.data.type = "ORTHO"
    camera.data.clip_start = .01
    camera.data.clip_end = 300
    camera.data.ortho_scale = 1
    camera.location = target + direction * 80
    camera.rotation_euler = orientation.to_euler()

    frame_lower, frame_upper = bounds(camera.data.view_frame(scene=scene))
    camera.data.ortho_scale = max(
        (screen_upper.x - screen_lower.x)
        / (frame_upper.x - frame_lower.x),
        (screen_upper.y - screen_lower.y)
        / (frame_upper.y - frame_lower.y),
    ) * 1.17

    scene.camera = camera
    scene.view_layers[0].update()

    gap = clones[1].location.y - (clones[0].location.y + 9)
    assert abs(gap - 3) < EPS
    assert scene.render.engine == "BLENDER_WORKBENCH"
    assert scene.display.shading.color_type == "TEXTURE"
    assert all(tuple(clone.rotation_euler) == (0, 0, 0) for clone in clones)

    return scene


def render_comparison(objects):
    scene = make_preview_scene(objects)
    path = OUTPUT / "jumps.png"
    scene.render.filepath = str(path)

    result = bpy.ops.render.render(write_still=True, scene=scene.name)

    assert result == {"FINISHED"}
    assert path.is_file() and path.stat().st_size > 1024

    png = path.read_bytes()
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == IMAGE_SIZE

    rendered = bpy.data.images.load(str(path), check_existing=False)

    try:
        assert tuple(rendered.size) == IMAGE_SIZE
        pixels = list(rendered.pixels)
        samples = [
            pixels[offset + channel]
            for offset in range(0, len(pixels), 4 * 97)
            for channel in range(3)
        ]
        assert max(samples) - min(samples) > .05
    finally:
        bpy.data.images.remove(rendered)

    return {
        "file": str(path),
        "render_verified": True,
        "engine": "BLENDER_WORKBENCH",
        "color_type": "TEXTURE",
        "resolution": list(IMAGE_SIZE),
        "camera_elevation_degrees": 35,
        "channel_gap_m": 3,
        "takeoff_translation": [0, 0, 0],
        "landing_translation": [0, 12, 0],
        "kicker_translation": [13, 7, 0],
        "high_ends_face_channel": True,
        "driving_direction_blender": [0, 1, 0],
        "export_origins_unchanged": True,
    }


def main():
    if not __debug__:
        raise RuntimeError("assert 검사를 비활성화한 실행은 지원하지 않습니다")

    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError(
            f"Blender 5.3이 필요합니다: {bpy.app.version_string}"
        )

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("--disable-autoexec 옵션으로 실행하세요")

    colors = make_palette_material()

    export_scene = bpy.data.scenes.new("jumps-export")
    export_scene.unit_settings.system = "METRIC"
    export_scene.unit_settings.scale_length = 1
    bpy.context.window.scene = export_scene

    built = build_all()
    objects = {}
    records = {}

    for name, (obj, roles, components) in built.items():
        objects[name] = obj
        records[name] = check_model(obj, roles, components)

    bpy.context.view_layer.update()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for name, obj in objects.items():
        records[name].update(export_glb(obj, records[name]))

    comparison = render_comparison(objects)

    for name, record in records.items():
        obj = objects[name]
        assert tuple(obj.location) == (0, 0, 0)
        assert tuple(obj.rotation_euler) == (0, 0, 0)
        assert tuple(obj.scale) == (1, 1, 1)

        record["palette"] = {
            "source": str(PALETTE),
            "size": [128, 4],
            "sample_pixel": "x = slot * 4 + 2, y = 2 (Blender 하단 기준)",
            "uv": "u = (slot + 0.5) / 32, v = 0.5",
            "verified_center_colors": colors,
        }
        record["comparison"] = comparison

        if name != "jumpKicker":
            record["decoration"] = {
                "bamboo_poles": 2,
                "flags": 5,
                "flags_per_pole": [3, 2],
                "flag_slots": [10, 18, 3, 12, 17],
                "flags_between_poles": False,
                "support_logs": 2,
                "supports_recessed_inside_end_wall": True,
            }
        else:
            record["arrows"] = {
                "chevrons": 2,
                "direction_blender": [0, 1, 0],
                "black_slot": 22,
                "yellow_slot": 8,
                "maximum_paint_protrusion_m": .003,
            }

        path = OUTPUT / f"{name}.json"
        path.write_text(
            json.dumps(record, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        saved = json.loads(path.read_text(encoding="utf-8"))
        assert saved["glb_verified"]
        assert saved["comparison"]["render_verified"]
        assert sum(saved["triangles_by_slot"].values()) == saved["triangles"]

    expected_files = [
        OUTPUT / f"{name}.{extension}"
        for name in SPECS
        for extension in ("glb", "json")
    ] + [OUTPUT / "jumps.png"]

    assert all(
        path.is_file() and path.stat().st_size > 0
        for path in expected_files
    )

    print(json.dumps({
        "output": str(OUTPUT),
        "files": [str(path) for path in expected_files],
        "triangles": {
            name: record["triangles"]
            for name, record in records.items()
        },
        "maximum_height_errors_m": {
            name: record["surface_checks"]["maximum_height_error_m"]
            for name, record in records.items()
        },
        "verified": True,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
