"""
Blender 5.3
실행:
  blender -b --factory-startup --disable-autoexec --python tools/models/beachShower.py
렌더 생략:
  blender -b --factory-startup --disable-autoexec --python tools/models/beachShower.py -- --skip-render

좌표: X 오른쪽, Y 뒤, Z 위. 정면 -Y, 원점은 바닥 중심.
검증: Blender 5.3 메모리에서 6816삼각형·167개 닫힌 부품·GLB 직렬화 검사 통과.
파일 저장과 실제 렌더는 이번 검토에서 실행하지 않았다.

원본 팔레트 11번의 중앙 픽셀은 (152, 129, 101)인 갈색이다.
원본 PNG를 보존하고 내장 텍스처의 11번만 밝은 대나무색으로 보정한다.
JSON에는 원본/사용 색과 각각의 밝은 노란색 판정 결과를 기록한다.
"""

import argparse
import json
import math
import struct
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
SOURCE = SOURCES / "folio-2025.blend"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "polish3"
NAME = "beachShower"
EPSILON = 1e-5

SLOTS = {
    "sand": 1,
    "teal": 3,
    "basalt": 5,
    "gray": 6,
    "green": 9,
    "coral": 10,
    "light_wood": 11,
    "vein": 12,
    "wood": 14,
    "pink": 17,
    "mango": 18,
    "white": 23,
}

EXPECTED_RGB = {
    1: (235, 209, 163),
    3: (61, 187, 231),
    5: (74, 65, 60),
    6: (87, 90, 94),
    9: (145, 173, 120),
    10: (228, 154, 120),
    11: (152, 129, 101),
    12: (171, 174, 43),
    14: (179, 109, 69),
    17: (253, 230, 226),
    18: (248, 166, 88),
    23: (255, 242, 232),
}

REQUIRED_SLOTS = {1, 3, 9, 10, 11, 12, 14, 18, 23}

SHOWER_CENTER = Vector((0, 0, 2.5))
GLASS_CENTER = Vector((-1.64, -1.00, 1.65))

POST_BOTTOM = 0.12
POST_TOP = 2.70
POST_RADIUS = 0.11
SHOWER_RADIUS = 0.30

BAMBOO_RGB = (244, 188, 84)
LEAF_THICKNESS = 0.07
ROOF_EAVE_Y = 1.18

POSTS = [
    Vector((x, y, (POST_BOTTOM + POST_TOP) / 2))
    for x in (-1.45, 1.45)
    for y in (-0.85, 0.85)
]


def bounds(points):
    points = list(points)
    assert points

    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


def yup(point):
    return Vector((point[0], point[2], -point[1]))


def xyz(point):
    return [round(float(c), 7) for c in point]


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)

    assert slot in SLOTS.values()
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7

    return slot


def load_source():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3 is required")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("Start Blender with --disable-autoexec")

    for path in (SOURCE, PALETTE):
        if not path.is_file():
            raise FileNotFoundError(path)

    bpy.ops.wm.open_mainfile(
        filepath=str(SOURCE),
        load_ui=False,
        use_scripts=False,
    )

    material = bpy.data.materials.get("palette")
    assert material is not None and material.node_tree is not None

    textures = [
        node
        for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    assert len(textures) == 1

    image = bpy.data.images.load(
        str(PALETTE),
        check_existing=False,
    )
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    assert SLOTS == {
        "sand": 1,
        "teal": 3,
        "basalt": 5,
        "gray": 6,
        "green": 9,
        "coral": 10,
        "light_wood": 11,
        "vein": 12,
        "wood": 14,
        "pink": 17,
        "mango": 18,
        "white": 23,
    }

    palette_report = {}

    for label, slot in SLOTS.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        rgba = tuple(
            round(pixels[offset + c] * 255)
            for c in range(4)
        )

        assert rgba[:3] == EXPECTED_RGB[slot], (label, slot, rgba)
        assert rgba[3] == 255

        palette_report[label] = {
            "slot": slot,
            "center_rgba": rgba,
        }

    # 원본 색 검사는 유지하고, 원본 파일 대신 내장할 이미지 데이터만 보정한다.
    original_bamboo = palette_report["light_wood"]["center_rgba"]

    for y in range(4):
        for x in range(11 * 4, 12 * 4):
            offset = 4 * (y * 128 + x)
            pixels[offset:offset + 4] = [
                c / 255 for c in BAMBOO_RGB
            ] + [1.0]

    image.pixels.foreach_set(pixels)
    image.update()
    image.file_format = "PNG"

    actual = tuple(
        round(image.pixels[4 * (2 * 128 + 46) + c] * 255)
        for c in range(4)
    )
    is_bright_yellow = (
        actual[0] >= 220
        and actual[1] >= 160
        and actual[2] <= 130
    )

    assert actual == (*BAMBOO_RGB, 255)
    assert is_bright_yellow

    palette_report["light_wood"].update({
        "source_center_rgba": original_bamboo,
        "source_is_bright_yellow_wood": (
            original_bamboo[0] >= 220
            and original_bamboo[1] >= 160
            and original_bamboo[2] <= 130
        ),
        "center_rgba": actual,
        "is_bright_yellow_wood": is_bright_yellow,
        "embedded_texture_adjusted": True,
        "source_file_modified": False,
    })

    texture = textures[0]
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    texture.mute = False

    material.node_tree.nodes.active = texture
    material.use_nodes = True
    image.pack()

    principled = next(
        node
        for node in material.node_tree.nodes
        if node.type == "BSDF_PRINCIPLED"
    )

    assert any(
        link.from_node == texture
        and link.to_node == principled
        and link.to_socket == principled.inputs["Base Color"]
        for link in material.node_tree.links
    )

    principled.inputs["Metallic"].default_value = 0
    principled.inputs["Roughness"].default_value = 0.82

    reference_report = {}

    for label, name in {
        "hut": "wood.002",
        "lantern": "base",
        "bench": "benchPhysicalDynamic",
    }.items():
        reference = bpy.data.objects.get(name)

        assert reference is not None and reference.type == "MESH", name

        reference.data.calc_loop_triangles()

        reference_report[label] = {
            "object": name,
            "triangles": len(reference.data.loop_triangles),
            "smooth_faces": sum(
                polygon.use_smooth
                for polygon in reference.data.polygons
            ),
        }

    return palette_report, reference_report


def clip_polygon(points, axis, boundary, direction):
    if not points:
        return []

    result = []
    previous = points[-1]
    previous_distance = direction * (previous[axis] - boundary)

    for current in points:
        distance = direction * (current[axis] - boundary)

        if (distance >= 0) != (previous_distance >= 0):
            t = previous_distance / (previous_distance - distance)
            result.append(previous.lerp(current, t))

        if distance >= 0:
            result.append(current)

        previous, previous_distance = current, distance

    return result


def assert_clear_triangles(points, triangles):
    for triangle in triangles:
        polygon = [points[i] for i in triangle]

        for axis, boundary, direction in (
            (0, -1.2 + EPSILON, 1),
            (0, 1.2 - EPSILON, -1),
            (2, 0.08, 1),
            (2, 2.45, -1),
        ):
            polygon = clip_polygon(
                polygon,
                axis,
                boundary,
                direction,
            )

            if not polygon:
                break

        assert not polygon, (
            "Triangle intersects vehicle passage",
            triangle,
        )


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.parts = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)

        return list(range(start, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)

        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)
        assert slot in SLOTS.values()

        self.faces.append(indices)
        self.slots.append(slot)

    def loft(self, name, rings, slot, segment_slots=None):
        start = len(self.vertices)
        indices = [self.ring(ring) for ring in rings]

        assert len(indices) >= 2

        count = len(indices[0])
        assert all(len(ring) == count for ring in indices)

        self.face(reversed(indices[0]), slot)

        for row in range(len(indices) - 1):
            color = (
                slot
                if segment_slots is None
                else segment_slots[row]
            )

            for i in range(count):
                j = (i + 1) % count
                self.face(
                    (
                        indices[row][i],
                        indices[row][j],
                        indices[row + 1][j],
                        indices[row + 1][i],
                    ),
                    color,
                )

        self.face(indices[-1], slot)

        lower, upper = bounds(self.vertices[start:])

        # 표면뿐 아니라 닫힌 부품 내부도 통로와 분리되어야 한다.
        assert (
            upper.x <= -1.2
            or lower.x >= 1.2
            or upper.z < 0.08
            or lower.z > 2.45
        ), (
            "Solid bounds intersect passage",
            name,
            tuple(lower),
            tuple(upper),
        )

        self.parts.append({
            "name": name,
            "vertex_start": start,
            "vertex_end": len(self.vertices),
            "bounds": {
                "min": xyz(lower),
                "max": xyz(upper),
            },
        })

    def box(
        self,
        name,
        center,
        size,
        slot,
        bevel=0.015,
        rotation=None,
    ):
        center = Vector(center)
        hx, hy, hz = (value / 2 for value in size)
        bevel = min(bevel, hx * 0.4, hy * 0.4, hz * 0.4)

        rings = []

        for z, shrink in (
            (-hz, bevel),
            (-hz + bevel, 0),
            (hz - bevel, 0),
            (hz, bevel),
        ):
            a, b = hx - shrink, hy - shrink
            cut = min(bevel, a * 0.4, b * 0.4)

            xy = [
                (-a + cut, -b),
                (a - cut, -b),
                (a, -b + cut),
                (a, b - cut),
                (a - cut, b),
                (-a + cut, b),
                (-a, b - cut),
                (-a, -b + cut),
            ]

            ring = []

            for x, y in xy:
                point = Vector((x, y, z))

                if rotation is not None:
                    point = rotation @ point

                ring.append(center + point)

            rings.append(ring)

        self.loft(name, rings, slot)

    def cylinder(
        self,
        name,
        start,
        end,
        radius,
        slot,
        sides=10,
        bevel=0.012,
    ):
        start, end = Vector(start), Vector(end)
        axis = end - start
        length = axis.length

        assert length > 1e-6

        w = axis.normalized()
        helper = (
            Vector((0, 0, 1))
            if abs(w.z) < 0.9
            else Vector((0, 1, 0))
        )
        u = helper.cross(w).normalized()
        v = w.cross(u)

        bevel = min(bevel, length * 0.2, radius * 0.3)

        profile = (
            (0, radius - bevel),
            (bevel, radius),
            (length - bevel, radius),
            (length, radius - bevel),
        )

        if bevel <= EPSILON:
            profile = ((0, radius), (length, radius))

        rings = [
            [
                start + w * distance + r * (
                    math.cos(2 * math.pi * i / sides) * u
                    + math.sin(2 * math.pi * i / sides) * v
                )
                for i in range(sides)
            ]
            for distance, r in profile
        ]

        self.loft(name, rings, slot)

    def turned(
        self,
        name,
        center,
        profile,
        slot,
        sides=12,
        segment_slots=None,
    ):
        x, y = center

        rings = [
            [
                (
                    x + r * math.cos(2 * math.pi * i / sides),
                    y + r * math.sin(2 * math.pi * i / sides),
                    z,
                )
                for i in range(sides)
            ]
            for z, r in profile
        ]

        self.loft(name, rings, slot, segment_slots)

    def arch(
        self,
        name,
        y,
        crown,
        shoulder,
        width,
        depth,
        slot,
    ):
        rings = []

        for i in range(9):
            t = -1 + i / 4

            center = Vector((
                1.52 * t,
                y,
                shoulder + (crown - shoulder) * (1 - t * t),
            ))
            tangent = Vector((
                1.52,
                0,
                -2 * (crown - shoulder) * t,
            )).normalized()

            across = Vector((0, 1, 0))
            up = tangent.cross(across).normalized()

            a = depth / 2
            b = width / 2
            cut = min(width, depth) * 0.16

            profile = [
                (-a + cut, -b),
                (a - cut, -b),
                (a, -b + cut),
                (a, b - cut),
                (a - cut, b),
                (-a + cut, b),
                (-a, b - cut),
                (-a, -b + cut),
            ]

            rings.append([
                center + across * p + up * q
                for p, q in profile
            ])

        self.loft(name, rings, slot)

    def leaf(self, sign, row, layer):
        length = (1.76, 1.53, 1.23)[layer]
        stations = (0, 0.16, 0.31, 0.46, 0.61, 0.76, 0.90, 1)

        y0 = -0.90 + row * 0.36
        y0 += (
            0.025 if row % 2 else -0.025
        ) * (layer - 1)

        rings = []
        ridge = []
        thicknesses = []

        for i, t in enumerate(stations):
            x = sign * (-0.025 + (length + 0.025) * t)
            sway = (
                0.028
                * math.sin(math.pi * t)
                * math.sin(row * 1.4 + layer)
            )
            y = y0 + sway

            # 길이와 높이가 다른 세 겹으로 중앙 덩어리와 처진 처마를 만든다.
            base = (3.24, 3.35, 3.46)[layer]
            drop = (0.54, 0.60, 0.66)[layer]
            z = base - drop * (abs(x) / 1.76) ** 1.6
            z -= 0.045 * t ** 4

            if i == 0:
                z = base

            width = (
                0.035
                + 0.255 * math.sin(math.pi * t) ** 0.72
            )

            if 0 < i < len(stations) - 1:
                width *= 1.0 if i % 2 else 0.73

            if i == len(stations) - 1:
                width = 0.012

            left = max(-ROOF_EAVE_Y, y - width)
            right = min(ROOF_EAVE_Y, y + width)
            assert left < y < right

            top = 0.04 + 0.022 * math.sin(math.pi * t)
            bottom = LEAF_THICKNESS - 0.04
            thicknesses.append(top + bottom)

            rings.append([
                (x, left, z),
                (x, y, z + top),
                (x, right, z),
                (x, y, z - bottom),
            ])
            ridge.append(Vector((x, y, z + top)))

        assert min(thicknesses) >= 0.06

        name = f"palm-{sign}-{row}-layer-{layer}"
        self.loft(name, rings, SLOTS["green"])
        self.parts[-1].update({
            "roof_layer": layer,
            "minimum_center_thickness": min(thicknesses),
            "serrated_edges": True,
            "drooping_tip": True,
        })

        # 잎맥을 융기 아래에 조금 묻어 겹침과 최고 높이 초과를 피한다.
        vein_rings = []

        for index in (1, 4, 6):
            center = ridge[index] - Vector((0, 0, 0.002))
            r = 0.012 * (1 - stations[index] * 0.5)

            vein_rings.append([
                center + Vector((0, -r, -0.004)),
                center + Vector((0, 0, 0.006)),
                center + Vector((0, r, -0.004)),
            ])

        self.loft(
            f"vein-{sign}-{row}-{layer}",
            vein_rings,
            SLOTS["vein"],
        )

    def finish(self, scene):
        assert not bpy.data.objects.get(NAME)
        assert not bpy.data.meshes.get(NAME)

        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate(verbose=False)

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for polygon, slot in zip(
            mesh.polygons,
            self.slots,
            strict=True,
        ):
            polygon.use_smooth = False
            polygon.material_index = 0

            for index in polygon.loop_indices:
                uv.data[index].uv = (
                    (slot + 0.5) / 32,
                    0.5,
                )

        bm = bmesh.new()
        components = 0

        try:
            bm.from_mesh(mesh)

            bmesh.ops.recalc_face_normals(
                bm,
                faces=list(bm.faces),
            )
            bmesh.ops.triangulate(
                bm,
                faces=list(bm.faces),
                quad_method="BEAUTY",
                ngon_method="EAR_CLIP",
            )

            assert all(
                edge.is_manifold and edge.is_contiguous
                for edge in bm.edges
            )
            assert all(vertex.is_manifold for vertex in bm.verts)
            assert all(face.calc_area() > 1e-10 for face in bm.faces)

            remaining = set(bm.faces)

            while remaining:
                component = []
                pending = [remaining.pop()]

                while pending:
                    face = pending.pop()
                    component.append(face)

                    for edge in face.edges:
                        for neighbor in edge.link_faces:
                            if neighbor in remaining:
                                remaining.remove(neighbor)
                                pending.append(neighbor)

                volume = sum(
                    face.verts[0].co.dot(
                        face.verts[1].co.cross(face.verts[2].co)
                    ) / 6
                    for face in component
                )

                assert abs(volume) > 1e-11

                if volume < 0:
                    bmesh.ops.reverse_faces(
                        bm,
                        faces=component,
                    )

                components += 1

            assert components == len(self.parts)
            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert (
            2500 <= len(mesh.loop_triangles) <= 7000
        ), len(mesh.loop_triangles)

        points = [vertex.co.copy() for vertex in mesh.vertices]
        triangles = [
            tuple(triangle.vertices)
            for triangle in mesh.loop_triangles
        ]

        assert_clear_triangles(points, triangles)

        lower, upper = bounds(points)

        assert lower.x >= -1.80 and upper.x <= 1.80
        assert lower.y >= -1.20 and upper.y <= 1.20
        assert abs(lower.z) < EPSILON
        assert abs(upper.z - 3.5) < EPSILON

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used = set()

        for face in mesh.polygons:
            assert not face.use_smooth
            assert face.material_index == 0

            values = [
                tuple(mesh.uv_layers.active.data[i].uv)
                for i in face.loop_indices
            ]

            assert all(value == values[0] for value in values)
            used.add(check_uv(values[0]))

        assert REQUIRED_SLOTS <= used <= set(SLOTS.values())

        obj = bpy.data.objects.new(NAME, mesh)
        scene.collection.objects.link(obj)
        bpy.context.view_layer.update()

        assert obj.location.length == 0
        assert all(angle == 0 for angle in obj.rotation_euler)
        assert tuple(obj.scale) == (1, 1, 1)
        assert not obj.modifiers

        assert len([
            item
            for item in scene.objects
            if item.type == "MESH"
        ]) == 1

        verify_shower(obj)

        leaves = [
            part
            for part in self.parts
            if "roof_layer" in part
        ]

        assert {
            part["roof_layer"] for part in leaves
        } == {0, 1, 2}

        assert min(
            part["bounds"]["min"][2]
            for part in leaves
        ) >= 2.6

        roof_lower, roof_upper = bounds(
            point
            for part in leaves
            for point in (
                Vector(part["bounds"]["min"]),
                Vector(part["bounds"]["max"]),
            )
        )

        assert -0.85 - roof_lower.y >= 0.30
        assert roof_upper.y - 0.85 >= 0.30

        return obj, {
            "triangles": len(triangles),
            "closed_components": components,
            "bounds_blender": {
                "min": xyz(lower),
                "max": xyz(upper),
            },
            "dimensions_blender": xyz(upper - lower),
            "used_palette_slots": sorted(used),
            "passage": {
                "x_open_interval": [-1.2, 1.2],
                "z_closed_interval": [0.08, 2.45],
                "y": "unbounded",
                "triangle_clipping_passed": True,
                "solid_component_bounds_passed": True,
            },
            "parts": self.parts,
        }


def verify_shower(obj):
    hit, point, normal, index = obj.ray_cast(
        Vector((0, 0, 2.46)),
        Vector((0, 0, 1)),
    )

    assert hit
    assert (point - SHOWER_CENTER).length < EPSILON
    assert normal.z < -0.999

    polygon = obj.data.polygons[index]

    assert check_uv(
        obj.data.uv_layers.active.data[polygon.loop_start].uv
    ) == SLOTS["teal"]

    for x in (-0.8, 0, 0.8):
        for y in (-1.15, 0, 1.15):
            hit, point, normal, index = obj.ray_cast(
                Vector((x, y, 0.081)),
                Vector((0, 0, 1)),
                distance=2.369,
            )

            assert not hit, (point, index)


def build_shower(scene):
    builder = Builder()

    wood = SLOTS["wood"]
    light = SLOTS["light_wood"]
    white = SLOTS["white"]

    for i in range(12):
        y = -1.1 + (i + 0.5) * 2.2 / 12
        half_y = (2.2 / 12 - 0.032) / 2
        rings = []

        # 판자 사이 0.032 틈을 두고, 상면 베벨도 통로 바닥 높이 안에 둔다.
        for z, shrink in (
            (0, 0),
            (0.048, 0),
            (0.06, 0.009),
        ):
            rings.append([
                (-1.2 + shrink, y - half_y + shrink, z),
                (1.2 - shrink, y - half_y + shrink, z),
                (1.2 - shrink, y + half_y - shrink, z),
                (-1.2 + shrink, y + half_y - shrink, z),
            ])

        builder.loft(f"floor-plank-{i}", rings, wood)

    for i, center in enumerate(POSTS):
        x, y = center.x, center.y

        builder.turned(
            f"stone-base-{i}",
            (x, y),
            [
                (0, 0.145),
                (0.035, 0.17),
                (0.15, 0.165),
                (0.20, 0.125),
            ],
            SLOTS["sand"],
            sides=8,
        )

        builder.turned(
            f"bamboo-post-{i}",
            (x, y),
            [
                (POST_BOTTOM, 0.096),
                (0.18, POST_RADIUS),
                (0.68, 0.106),
                (1.22, POST_RADIUS),
                (1.82, 0.105),
                (2.40, POST_RADIUS),
                (POST_TOP, 0.095),
            ],
            light,
            sides=8,
        )

        for j, z in enumerate((0.31, 1.17, 2.03, 2.58)):
            builder.turned(
                f"rope-band-{i}-{j}",
                (x, y),
                [
                    (z - 0.034, 0.112),
                    (z, 0.126),
                    (z + 0.034, 0.112),
                ],
                white,
                sides=6,
            )

    for sign in (-1, 1):
        for j, z in enumerate((0.48, 0.91)):
            builder.box(
                f"outside-rail-{sign}-{j}",
                (sign * 1.45, 0, z),
                (0.14, 1.75, 0.115),
                wood,
                bevel=0.022,
            )

        builder.cylinder(
            f"roof-side-tie-{sign}",
            (sign * 1.45, -0.85, 2.63),
            (sign * 1.45, 0.85, 2.63),
            0.065,
            light,
            sides=8,
        )

    for y in (-0.85, 0.85):
        builder.arch(
            f"main-arched-beam-{y}",
            y,
            3.00,
            2.60,
            0.20,
            0.22,
            wood,
        )

    builder.cylinder(
        "crown-ridge-pole",
        (0, -1.06, 3.32),
        (0, 1.06, 3.32),
        0.055,
        light,
        sides=8,
    )

    for y in (-0.85, 0.85):
        for anchor, x in enumerate((-1.42, 0, 1.42)):
            z = 2.60 + 0.40 * (1 - (x / 1.52) ** 2)

            for diagonal in (-1, 1):
                builder.cylinder(
                    f"beam-lashing-{y}-{anchor}-{diagonal}",
                    (
                        x - 0.075,
                        y - 0.135,
                        z - diagonal * 0.11,
                    ),
                    (
                        x + 0.075,
                        y - 0.135,
                        z + diagonal * 0.11,
                    ),
                    0.029,
                    white,
                    sides=6,
                    bevel=0,
                )

    for layer in range(3):
        for sign in (-1, 1):
            for row in range(6):
                builder.leaf(sign, row, layer)

    for sign in (-1, 1):
        rings = []
        vein = []
        widths = (0.045, 0.19, 0.24, 0.21, 0.18, 0.10, 0.012)

        for i, width in enumerate(widths):
            t = i / (len(widths) - 1)
            y = sign * (0.10 + 1.08 * t)
            z = 3.40 - 0.25 * t ** 1.5
            x = 0.025 * math.sin(math.pi * t)

            rings.append([
                (x - width, y, z),
                (x, y, z + 0.055),
                (x + width, y, z),
                (x, y, z - 0.025),
            ])

            if i in (1, 3, 5):
                vein.append([
                    (x - 0.009, y, z + 0.052),
                    (x, y, z + 0.060),
                    (x + 0.009, y, z + 0.052),
                ])

        builder.loft(
            f"crown-palm-{sign}",
            rings,
            SLOTS["green"],
        )
        builder.loft(
            f"crown-vein-{sign}",
            vein,
            SLOTS["vein"],
        )

    builder.cylinder(
        "shower-supply-pipe",
        (0, 0, 2.62),
        (0, 0, 3.39),
        0.065,
        light,
        sides=12,
    )

    builder.turned(
        "shower-pipe-collar",
        (0, 0),
        [
            (2.76, 0.067),
            (2.775, 0.079),
            (2.82, 0.079),
            (2.835, 0.067),
        ],
        white,
        sides=10,
    )

    # 청록 아랫면과 테두리 바닥의 공면 겹침을 피한다.
    builder.turned(
        "shower-head-rim",
        (0, 0),
        [
            (2.505, 0.281),
            (2.514, SHOWER_RADIUS),
            (2.558, SHOWER_RADIUS),
            (2.598, 0.235),
            (2.620, 0.085),
        ],
        light,
        sides=24,
    )

    builder.turned(
        "shower-teal-underside",
        (0, 0),
        [
            (2.500, 0.277),
            (2.504, 0.282),
            (2.513, 0.282),
        ],
        SLOTS["teal"],
        sides=24,
    )

    for ring_index, (radius, count, phase) in enumerate((
        (0.093, 6, 0),
        (0.204, 10, math.pi / 10),
    )):
        for i in range(count):
            angle = phase + 2 * math.pi * i / count
            x = radius * math.cos(angle)
            y = radius * math.sin(angle)

            builder.turned(
                f"nozzle-hole-{ring_index}-{i}",
                (x, y),
                [
                    (2.496, 0.014),
                    (2.506, 0.014),
                ],
                white,
                sides=6,
            )

    builder.cylinder(
        "lantern-wall-bracket",
        (-1.45, -0.89, 2.03),
        (-1.70, -0.89, 2.03),
        0.026,
        wood,
        sides=8,
    )

    for i, end in enumerate((
        (-1.70, -0.99, 1.92),
        (-1.59, -0.99, 1.92),
    )):
        builder.cylinder(
            f"lantern-rope-{i}",
            (-1.66, -0.89, 2.035),
            end,
            0.013,
            white,
            sides=6,
            bevel=0.003,
        )

    builder.box(
        "lantern-glass",
        GLASS_CENTER,
        (0.16, 0.13, 0.30),
        SLOTS["mango"],
        bevel=0.014,
    )

    for x in (-1.735, -1.545):
        for y in (-1.078, -0.922):
            builder.box(
                f"lantern-upright-{x}-{y}",
                (x, y, 1.65),
                (0.026, 0.026, 0.35),
                wood,
                bevel=0.004,
            )

    builder.box(
        "lantern-bottom",
        (-1.64, -1, 1.475),
        (0.22, 0.19, 0.055),
        wood,
        bevel=0.012,
    )

    builder.box(
        "lantern-top",
        (-1.64, -1, 1.825),
        (0.22, 0.19, 0.055),
        wood,
        bevel=0.012,
    )

    builder.turned(
        "lantern-hip-roof",
        (-1.64, -1),
        [
            (1.85, 0.115),
            (1.88, 0.115),
            (1.96, 0.045),
            (1.97, 0.03),
        ],
        wood,
        sides=4,
    )

    builder.cylinder(
        "towel-peg",
        (1.45, -0.85, 1.96),
        (1.45, -1.03, 1.96),
        0.035,
        wood,
        sides=8,
    )

    builder.cylinder(
        "towel-rod",
        (1.43, -1.03, 1.96),
        (1.74, -1.03, 1.96),
        0.029,
        wood,
        sides=10,
    )

    towel_rings = []
    stripe_colors = [
        white,
        SLOTS["coral"],
        white,
        SLOTS["teal"],
        white,
        SLOTS["coral"],
        white,
    ]

    for i in range(8):
        z = 1.34 + i * 0.087
        y = -1.06 + 0.018 * math.sin(i * 0.9)
        width = 0.255 + 0.008 * math.sin(i * 0.8)

        x0 = 1.59 - width / 2
        x1 = 1.59 + width / 2
        hem_offset = 0.012 if i == 0 else 0

        towel_rings.append([
            (x0, y - 0.012, z + hem_offset),
            (x1, y - 0.012, z),
            (x1, y + 0.012, z),
            (x0, y + 0.012, z + hem_offset),
        ])

    builder.loft(
        "striped-towel",
        towel_rings,
        white,
        stripe_colors,
    )

    return builder.finish(scene)


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]

    assert "sparse" not in accessor
    assert not accessor.get("normalized", False)

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
    assert stride >= size

    start = (
        view.get("byteOffset", 0)
        + accessor.get("byteOffset", 0)
    )

    assert accessor["count"] > 0
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_glb(data, obj):
    assert struct.unpack_from("<4sII", data) == (
        b"glTF",
        2,
        len(data),
    )

    offset = 12
    chunks = {}

    while offset < len(data):
        size, kind = struct.unpack_from("<I4s", data, offset)

        assert size % 4 == 0
        assert kind not in chunks
        assert offset + 8 + size <= len(data)

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)

    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    buffer, = document["buffers"]

    assert "uri" not in buffer
    assert buffer["byteLength"] <= len(binary)

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]

    assert mesh["name"] == node["name"] == NAME
    assert node["mesh"] == 0
    assert material["name"] == "palette"
    assert "matrix" not in node

    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]

    scene, = document["scenes"]
    assert scene["nodes"] == [0]

    primitive, = mesh["primitives"]

    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]

    assert {"POSITION", "NORMAL", "TEXCOORD_0"} <= set(attributes)
    assert not any(
        key.startswith("COLOR_")
        for key in attributes
    )

    points = [
        Vector(point)
        for point in accessor_rows(
            document,
            binary,
            attributes["POSITION"],
        )
    ]
    normals = accessor_rows(
        document,
        binary,
        attributes["NORMAL"],
    )
    uvs = accessor_rows(
        document,
        binary,
        attributes["TEXCOORD_0"],
    )

    assert len(points) == len(normals) == len(uvs)

    used = {check_uv(uv) for uv in uvs}
    assert REQUIRED_SLOTS <= used <= set(SLOTS.values())

    assert all(
        math.isfinite(component)
        for point in points
        for component in point
    )
    assert all(
        abs(Vector(normal).length - 1) < 1e-4
        for normal in normals
    )

    indices = [
        row[0]
        for row in accessor_rows(
            document,
            binary,
            primitive["indices"],
        )
    ]

    assert len(indices) % 3 == 0

    triangles = [
        tuple(indices[i:i + 3])
        for i in range(0, len(indices), 3)
    ]

    assert 2500 <= len(triangles) <= 7000
    assert len(triangles) == len(obj.data.loop_triangles)

    for a, b, c in triangles:
        assert 0 <= min(a, b, c)
        assert max(a, b, c) < len(points)

        assert (
            (points[b] - points[a])
            .cross(points[c] - points[a])
            .length > 2e-10
        )

        assert uvs[a] == uvs[b] == uvs[c]

    blender_points = [
        Vector((point.x, -point.z, point.y))
        for point in points
    ]

    assert_clear_triangles(blender_points, triangles)

    expected = {
        tuple(round(component, 5) for component in yup(vertex.co))
        for vertex in obj.data.vertices
    }
    actual = {
        tuple(round(component, 5) for component in point)
        for point in points
    }

    assert actual == expected

    lower, upper = bounds(points)
    original_lower, original_upper = bounds(
        yup(vertex.co)
        for vertex in obj.data.vertices
    )

    assert (lower - original_lower).length < EPSILON
    assert (upper - original_upper).length < EPSILON
    assert abs(lower.y) < EPSILON
    assert abs(upper.y - 3.5) < EPSILON

    assert not document.get("animations")
    assert not document.get("skins")

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0
    assert (
        material["pbrMetallicRoughness"]["baseColorTexture"]["index"]
        == 0
    )

    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    glass_indices = [
        i
        for i, uv in enumerate(uvs)
        if check_uv(uv) == SLOTS["mango"]
    ]

    assert glass_indices

    glass_lower, glass_upper = bounds(
        points[i]
        for i in glass_indices
    )

    assert (
        (glass_lower + glass_upper) / 2
        - yup(GLASS_CENTER)
    ).length < EPSILON

    assert abs(glass_lower.y - 1.50) < EPSILON
    assert abs(glass_upper.y - 1.80) < EPSILON

    return {
        "bounds_glb_yup": {
            "min": xyz(lower),
            "max": xyz(upper),
        },
        "dimensions_glb_yup": xyz(upper - lower),
        "exported_triangles": len(triangles),
        "lantern_glass": {
            "center_blender": xyz(GLASS_CENTER),
            "center_glb_yup": xyz(yup(GLASS_CENTER)),
            "vertex_z_range_blender": [
                glass_lower.y,
                glass_upper.y,
            ],
            "vertex_y_range_glb_yup": [
                glass_lower.y,
                glass_upper.y,
            ],
            "palette_slot": SLOTS["mango"],
            "mesh_index": 0,
            "primitive_index": 0,
            "exported_vertex_indices": glass_indices,
        },
    }


def export_options():
    return {
        "filepath": str(OUTPUT / (NAME + ".glb")),
        "export_format": "GLB",
        "use_selection": True,
        "use_active_scene": True,
        "export_yup": True,
        "export_apply": False,
        "export_texcoords": True,
        "export_normals": True,
        "export_tangents": False,
        "export_materials": "EXPORT",
        "export_image_format": "AUTO",
        "export_vertex_color": "NONE",
        "export_attributes": False,
        "export_animations": False,
        "export_skins": False,
        "export_morph": False,
        "export_cameras": False,
        "export_lights": False,
        "export_draco_mesh_compression_enable": False,
        "export_meshopt_compression_enable": False,
        "export_use_gltfpack": False,
        "will_save_settings": False,
    }


def export_glb(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    result = bpy.ops.export_scene.gltf(**export_options())

    assert result == {"FINISHED"}

    return verify_glb(
        (OUTPUT / (NAME + ".glb")).read_bytes(),
        obj,
    )


def make_render_scene(obj):
    scene = bpy.data.scenes.new(NAME + "-front-and-45")

    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 2200
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1

    scene.world = bpy.data.worlds.new(NAME + "-preview-world")
    scene.world.color = (0.86, 0.81, 0.70)

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "WORLD"
    shading.studio_light = "paint.sl"
    shading.show_shadows = True
    shading.shadow_intensity = 0.18
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.cavity_ridge_factor = 0.6
    shading.cavity_valley_factor = 0.45
    shading.curvature_ridge_factor = 0.6
    shading.curvature_valley_factor = 0.45
    shading.show_specular_highlight = False

    clones = []

    # 동일한 정면 카메라에서 메시를 회전해 비교 시점과 축척을 유지한다.
    for label, x, angle in (
        ("front-minus-Y", -2.06, 0),
        ("front-above-45", 2.06, math.pi / 4),
    ):
        rotation = Matrix.Rotation(angle, 3, "X")

        transformed = [
            rotation @ (vertex.co - Vector((0, 0, 1.75)))
            for vertex in obj.data.vertices
        ]

        lower, upper = bounds(transformed)
        center = (lower + upper) / 2
        mesh = obj.data.copy()

        for vertex, point in zip(
            mesh.vertices,
            transformed,
            strict=True,
        ):
            vertex.co = (
                point
                - center
                + Vector((x, 0, 0))
            )

        mesh.update()

        clone = bpy.data.objects.new(label, mesh)
        scene.collection.objects.link(clone)
        clones.append(clone)

    label_material = bpy.data.materials.new(
        NAME + "-preview-label"
    )
    label_material.diffuse_color = (0.16, 0.12, 0.09, 1)

    for text, x in (
        ("FRONT  -Y", -2.06),
        ("FRONT  +45 DEG", 2.06),
    ):
        curve = bpy.data.curves.new(text, type="FONT")
        curve.body = text
        curve.align_x = "CENTER"
        curve.size = 0.14
        curve.materials.append(label_material)

        label = bpy.data.objects.new(text, curve)
        scene.collection.objects.link(label)

        label.location = (x, -2, -2.10)
        label.rotation_euler = (math.pi / 2, 0, 0)

    camera = bpy.data.objects.new(
        NAME + "-preview-camera",
        bpy.data.cameras.new(NAME + "-preview-camera"),
    )

    scene.collection.objects.link(camera)
    scene.camera = camera

    camera.data.type = "ORTHO"
    camera.data.clip_start = 0.01
    camera.data.clip_end = 100
    camera.location = (0, -20, -0.06)
    camera.rotation_euler = (math.pi / 2, 0, 0)

    lower, upper = bounds(
        vertex.co
        for clone in clones
        for vertex in clone.data.vertices
    )

    width = upper.x - lower.x
    height = (
        max(upper.z, 1.90)
        - min(lower.z, -2.20)
    )
    aspect = (
        scene.render.resolution_x
        / scene.render.resolution_y
    )

    camera.data.ortho_scale = (
        max(width, height * aspect) * 1.09
    )

    return scene


def render_comparison(obj):
    scene = make_render_scene(obj)
    scene.render.filepath = str(OUTPUT / (NAME + ".png"))

    result = bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )

    assert result == {"FINISHED"}
    assert Path(scene.render.filepath).is_file()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    palette_report, reference_report = load_source()

    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene

    obj, report = build_shower(scene)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    report.update(export_glb(obj))

    report.update({
        "name": NAME,
        "file": str(OUTPUT / (NAME + ".glb")),
        "coordinate_system_blender": {
            "right": "+X",
            "back": "+Y",
            "up": "+Z",
            "front": "-Y",
        },
        "coordinate_system_glb": {
            "right": "+X",
            "up": "+Y",
            "front": "+Z",
        },
        "origin_blender": [0, 0, 0],
        "shower_underside_center_blender": xyz(SHOWER_CENTER),
        "shower_underside_center_glb_yup": xyz(yup(SHOWER_CENTER)),
        "shower_radius": SHOWER_RADIUS,
        "posts": [
            {
                "center_blender": xyz(center),
                "center_glb_yup": xyz(yup(center)),
                "axis_blender": [0, 0, 1],
                "axis_glb_yup": [0, 1, 0],
                "radius": POST_RADIUS,
                "height": POST_TOP - POST_BOTTOM,
                "bottom_center_blender": [
                    center.x,
                    center.y,
                    POST_BOTTOM,
                ],
                "top_center_blender": [
                    center.x,
                    center.y,
                    POST_TOP,
                ],
            }
            for center in POSTS
        ],
        "palette": palette_report,
        "source_references": reference_report,
        "preview": {
            "rendered": False,
            "file": None,
            "left": "front Blender -Y",
            "right": "front above 45 degrees, same scale",
        },
    })

    if not args.skip_render:
        render_comparison(obj)

        report["preview"]["rendered"] = True
        report["preview"]["file"] = str(
            OUTPUT / (NAME + ".png")
        )

    (OUTPUT / (NAME + ".json")).write_text(
        json.dumps(
            report,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
