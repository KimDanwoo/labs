"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/islandPropsA.py

출력:
tikiScoreboard.glb / tikiScoreboard.json
surfMenuSign.glb / surfMenuSign.json
portalArch.glb / portalArch.json
propsA.png

좌표: X 오른쪽, Y 뒤, Z 위. 정면은 -Y.
비교 장면만 높이를 정규화한다. GLB에는 원래 크기를 보존한다.
회색 표시 평면은 비교 장면 전용이며 GLB에 포함하지 않는다.
"""

import json
import math
import struct
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "props"
EPS = 1e-6
SURF_ANGLE = math.radians(15)

EXPECTED = {
    1: "#EBD1A3",
    3: "#3DBBE7",
    5: "#4A413C",
    8: "#E4A90C",
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


def bounds(points):
    points = list(points)
    assert points
    return tuple(
        Vector(tuple(fn(p[i] for p in points) for i in range(3)))
        for fn in (min, max)
    )


def setup():
    assert bpy.app.version[:2] == (5, 3), bpy.app.version_string
    assert "--disable-autoexec" in sys.argv
    assert PALETTE.is_file(), PALETTE

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for old in list(bpy.data.materials):
        bpy.data.materials.remove(old)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)
    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    # 경계의 혼합색을 피하기 위해 각 4px 칸의 중앙만 검사한다.
    for slot, expected in EXPECTED.items():
        rgb = [
            round(pixels[4 * (2 * 128 + slot * 4 + 2) + channel] * 255)
            for channel in range(3)
        ]
        actual = "#" + "".join(f"{channel:02X}" for channel in rgb)
        assert actual == expected, (slot, actual, expected)

    image.pack()

    material = bpy.data.materials.new("palette")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    shader = nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = 0.82
    shader.inputs["Metallic"].default_value = 0

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    nodes.active = texture
    material.node_tree.links.new(
        texture.outputs["Color"],
        shader.inputs["Base Color"],
    )
    return image


def check_uv(uv):
    slot = round(uv[0] * 32 - 0.5)
    assert slot in EXPECTED
    assert abs(uv[0] - (slot + 0.5) / 32) < 1e-7
    assert abs(uv[1] - 0.5) < 1e-7


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        return list(range(start, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)
        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)
        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, first, second, slot):
        assert len(first) == len(second)
        for i in range(len(first)):
            j = (i + 1) % len(first)
            color = slot[i % len(slot)] if isinstance(slot, tuple) else slot
            self.face(
                (first[i], first[j], second[j], second[i]),
                color,
            )

    def transform_since(self, start, transform):
        self.vertices[start:] = [
            tuple(transform(Vector(point)))
            for point in self.vertices[start:]
        ]

    def finish(self, name, limits):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        assert not mesh.validate()

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for polygon, slot in zip(mesh.polygons, self.slots, strict=True):
            for index in polygon.loop_indices:
                uv.data[index].uv = ((slot + 0.5) / 32, 0.5)

        bm = bmesh.new()
        try:
            bm.from_mesh(mesh)
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            bmesh.ops.triangulate(
                bm,
                faces=list(bm.faces),
                quad_method="BEAUTY",
                ngon_method="EAR_CLIP",
            )
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

            assert all(
                edge.is_manifold and edge.is_contiguous
                for edge in bm.edges
            )
            assert all(vertex.is_manifold for vertex in bm.verts)
            assert all(face.calc_area() > 1e-10 for face in bm.faces)

            remaining = set(bm.faces)
            while remaining:
                component = {remaining.pop()}
                pending = list(component)

                while pending:
                    for edge in pending.pop().edges:
                        for face in edge.link_faces:
                            if face in remaining:
                                remaining.remove(face)
                                component.add(face)
                                pending.append(face)

                volume = sum(
                    face.verts[0].co.dot(
                        face.verts[1].co.cross(face.verts[2].co)
                    ) / 6
                    for face in component
                )
                assert abs(volume) > 1e-11

                if volume < 0:
                    bmesh.ops.reverse_faces(bm, faces=list(component))

            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert limits[0] <= len(mesh.loop_triangles) <= limits[1], (
            name,
            len(mesh.loop_triangles),
        )

        for polygon in mesh.polygons:
            polygon.use_smooth = False
            values = [
                tuple(mesh.uv_layers.active.data[index].uv)
                for index in polygon.loop_indices
            ]
            for value in values:
                check_uv(value)
            assert all(value == values[0] for value in values)

        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"
        assert not mesh.color_attributes

        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        return obj


def prism(builder, outline, front, back, slot, bevel=0):
    assert back > front

    cx = sum(point[0] for point in outline) / len(outline)
    cz = sum(point[1] for point in outline) / len(outline)
    extent = max(
        max(abs(x - cx), abs(z - cz))
        for x, z in outline
    )
    bevel = min(bevel, (back - front) * 0.35, extent * 0.2)

    levels = (
        [(front, 1), (back, 1)]
        if not bevel
        else [
            (front, 1 - bevel / extent),
            (front + bevel, 1),
            (back - bevel, 1),
            (back, 1 - bevel / extent),
        ]
    )
    rings = [
        builder.ring([
            (cx + (x - cx) * scale, y, cz + (z - cz) * scale)
            for x, z in outline
        ])
        for y, scale in levels
    ]

    builder.face(reversed(rings[0]), slot)
    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, slot)
    builder.face(rings[-1], slot)


def outline_box(x, z, width, height, chamfer):
    r = min(chamfer, width * 0.25, height * 0.25)
    return [
        (x - width / 2 + r, z - height / 2),
        (x + width / 2 - r, z - height / 2),
        (x + width / 2, z - height / 2 + r),
        (x + width / 2, z + height / 2 - r),
        (x + width / 2 - r, z + height / 2),
        (x - width / 2 + r, z + height / 2),
        (x - width / 2, z + height / 2 - r),
        (x - width / 2, z - height / 2 + r),
    ]


def box(builder, center, size, slot, bevel=0.04):
    x, y, z = center
    width, depth, height = size

    outline = (
        outline_box(x, z, width, height, bevel)
        if bevel
        else [
            (x - width / 2, z - height / 2),
            (x + width / 2, z - height / 2),
            (x + width / 2, z + height / 2),
            (x - width / 2, z + height / 2),
        ]
    )
    prism(
        builder,
        outline,
        y - depth / 2,
        y + depth / 2,
        slot,
        bevel,
    )


def tube(builder, points, radius, slot, sides=6, closed=False):
    points = [Vector(point) for point in points]
    rings = []

    for i, point in enumerate(points):
        previous = (
            points[(i - 1) % len(points)]
            if closed or i
            else points[0]
        )
        following = (
            points[(i + 1) % len(points)]
            if closed or i < len(points) - 1
            else points[-1]
        )
        direction = (following - previous).normalized()
        reference = (
            Vector((0, 1, 0))
            if abs(direction.y) < 0.9
            else Vector((1, 0, 0))
        )
        u = direction.cross(reference).normalized()
        v = direction.cross(u)

        rings.append(builder.ring([
            point + radius * (
                u * math.cos(j * math.tau / sides)
                + v * math.sin(j * math.tau / sides)
            )
            for j in range(sides)
        ]))

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, slot)

    if closed:
        builder.bridge(rings[-1], rings[0], slot)
    else:
        builder.face(reversed(rings[0]), slot)
        builder.face(rings[-1], slot)


def beam(builder, start, end, width, depth, slot=14):
    start, end = Vector(start), Vector(end)
    length = (end - start).length
    rotation = Vector((0, 0, 1)).rotation_difference(
        (end - start).normalized()
    )
    first = len(builder.vertices)
    box(
        builder,
        (0, 0, length / 2),
        (width, depth, length),
        slot,
        min(width, depth) * 0.16,
    )
    builder.transform_since(first, lambda point: start + rotation @ point)


def coil(
    builder,
    center,
    axis,
    radius,
    turns=2,
    pitch=0.05,
    thickness=0.022,
):
    axis = Vector(axis).normalized()
    u = axis.cross(Vector((0, 1, 0))).normalized()
    v = axis.cross(u)
    center = Vector(center)
    steps = int(turns * 12)

    points = [
        center
        + axis * (pitch * (i / steps - 0.5) * turns)
        + radius * (
            u * math.cos(math.tau * turns * i / steps)
            + v * math.sin(math.tau * turns * i / steps)
        )
        for i in range(steps + 1)
    ]
    tube(builder, points, thickness, 13, 5)


def bamboo(builder, start, end, radius=0.10):
    start, end = Vector(start), Vector(end)
    tube(builder, [start, end], radius * 0.88, 11, 8)

    length = (end - start).length
    axis = (end - start).normalized()
    divisions = max(2, round(length / 0.7))

    for i in range(1, divisions):
        center = start + (end - start) * i / divisions
        tube(
            builder,
            [center - axis * 0.025, center + axis * 0.025],
            radius * 0.99,
            1,
            8,
        )


def shell(builder, center, width, height, depth, colors=(23, 18)):
    x, y, z = center
    outline = [(0, -height * 0.48)]

    for i in range(13):
        angle = math.radians(-78 + 156 * i / 12)
        scallop = 1 if i % 2 == 0 else 0.94
        outline.append((
            width * 0.51 * math.sin(angle) * scallop,
            -height * 0.30
            + height * 0.80 * math.cos(angle) * scallop,
        ))

    base = Vector((x, y - depth, z - height * 0.27))
    middle = builder.ring([
        base * 0.42
        + Vector((
            x + dx,
            y - depth * (0.20 if i % 2 else 0.40),
            z + dz,
        )) * 0.58
        for i, (dx, dz) in enumerate(outline)
    ])
    edge = builder.ring([
        (x + dx, y, z + dz)
        for dx, dz in outline
    ])
    rear = builder.ring([
        (x + dx * 0.96, y + depth * 0.28, z + dz * 0.96)
        for dx, dz in outline
    ])
    tip = builder.ring([base])[0]

    for i in range(len(outline)):
        j = (i + 1) % len(outline)
        slot = colors[(i // 2) % len(colors)]
        builder.face((tip, middle[i], middle[j]), slot)
        builder.face(
            (middle[i], edge[i], edge[j], middle[j]),
            slot,
        )

    builder.bridge(edge, rear, colors)
    builder.face(reversed(rear), colors[0])


def leaf(builder, start, end, width, slot=9):
    start, end = Vector(start), Vector(end)
    side = Vector((
        end.z - start.z,
        0,
        start.x - end.x,
    )).normalized()
    rings = []

    for t in (0, 0.22, 0.5, 0.78):
        point = start.lerp(end, t) + Vector((
            0,
            -0.07 * math.sin(math.pi * t),
            0.035 * math.sin(math.pi * t),
        ))
        half = max(
            0.008,
            width * math.sin(math.pi * (0.04 + 0.92 * t)),
        )
        rings.append(builder.ring([
            point - side * half,
            point + Vector((0, -width * 0.24, 0)),
            point + side * half,
            point + Vector((0, width * 0.10, 0)),
        ]))

    builder.face(reversed(rings[0]), slot)

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, (slot, 12, slot, slot))

    tip = builder.ring([end])[0]
    for i in range(4):
        builder.face(
            (rings[-1][i], rings[-1][(i + 1) % 4], tip),
            slot,
        )


def star(builder, center, radius, slot=18):
    x, y, z = center
    outline = []

    for i in range(10):
        angle = math.pi / 2 + i * math.pi / 5
        r = radius if i % 2 == 0 else radius * 0.43
        outline.append((
            x + r * math.cos(angle),
            z + r * math.sin(angle),
        ))

    prism(builder, outline, y - 0.025, y + 0.025, slot, 0.014)


def tiki_face(builder, x, z, width, height, y, depth):
    for side in (-1, 1):
        eye = [
            (
                x + side * width * 0.23 + dx * width,
                z + height * 0.12 + dz * height,
            )
            for dx, dz in (
                (-0.14, 0),
                (-0.11, 0.09),
                (0, 0.12),
                (0.11, 0.09),
                (0.14, 0),
                (0, 0.035),
            )
        ]
        prism(builder, eye, y - depth * 0.28, y + 0.006, 5)

        eyebrow = [
            (
                x + side * width * 0.23
                + width * 0.15 * math.cos(math.pi * i / 4),
                y - depth * 0.47,
                z + height * 0.15
                + height * 0.13 * math.sin(math.pi * i / 4),
            )
            for i in range(5)
        ]
        tube(builder, eyebrow, width * 0.045, 14, 5)

    nose = [
        (x - width * 0.075, z + height * 0.38),
        (x + width * 0.075, z + height * 0.38),
        (x + width * 0.12, z - height * 0.12),
        (x, z - height * 0.18),
        (x - width * 0.12, z - height * 0.12),
    ]
    prism(
        builder,
        nose,
        y - depth,
        y + 0.015,
        14,
        depth * 0.15,
    )

    smile = [
        (x - width * 0.36, z - height * 0.12),
        (x - width * 0.22, z - height * 0.25),
        (x, z - height * 0.30),
        (x + width * 0.22, z - height * 0.25),
        (x + width * 0.36, z - height * 0.12),
        (x + width * 0.29, z - height * 0.34),
        (x, z - height * 0.40),
        (x - width * 0.29, z - height * 0.34),
    ]
    prism(builder, smile, y - depth * 0.25, y + 0.008, 5)

    tube(
        builder,
        [
            (x - width * 0.32, y - depth * 0.43, z - height * 0.31),
            (x, y - depth * 0.46, z - height * 0.43),
            (x + width * 0.32, y - depth * 0.43, z - height * 0.31),
        ],
        width * 0.035,
        11,
        5,
    )


def rectangular_display(center, up, width, height):
    center = Vector(center)
    right = Vector((1, 0, 0))
    up = Vector(up)
    normal = right.cross(up).normalized()

    return {
        "shape": "rectangle",
        "center": tuple(center),
        "normal": tuple(normal),
        "right": tuple(right),
        "up": tuple(up),
        "width": width,
        "height": height,
        "corners": [
            tuple(
                center
                + right * sx * width / 2
                + up * sz * height / 2
            )
            for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))
        ],
    }


def build_scoreboard():
    builder = Builder()
    box(builder, (0, 0.09, 2.30), (4.9, 0.12, 3.3), 5, 0)

    for z in (0.55, 4.075):
        bamboo(
            builder,
            (-2.63, -0.055, z),
            (2.63, -0.055, z),
            0.10,
        )

    for x in (-2.575, 2.575):
        bamboo(
            builder,
            (x, -0.055, 0.55),
            (x, -0.055, 4.075),
            0.10,
        )

    for side in (-1, 1):
        x = side * 2.94
        box(builder, (x, 0.12, 2.48), (0.48, 0.52, 4.16), 14, 0.07)
        box(builder, (x, -0.005, 4.43), (0.58, 0.57, 0.46), 14, 0.09)
        tiki_face(builder, x, 3.64, 0.43, 0.66, -0.16, 0.18)

        for z in (1.0, 1.56, 2.12, 2.68):
            prism(
                builder,
                [(x - 0.16, z - 0.12), (x + 0.16, z - 0.12), (x, z + 0.15)],
                -0.20,
                -0.13,
                18,
                0.025,
            )

        spiral = [
            (-0.18, 0.17),
            (0.12, 0.17),
            (0.18, 0.08),
            (0.18, -0.12),
            (-0.10, -0.12),
            (-0.10, 0.065),
            (0.055, 0.065),
            (0.055, -0.035),
        ]
        tube(
            builder,
            [(x + side * dx, -0.31, 4.43 + dz) for dx, dz in spiral],
            0.026,
            11,
            5,
        )

        for z in (0.52, 4.24):
            coil(
                builder,
                (side * 2.61, -0.015, z),
                (0, 0, 1),
                0.16,
                2,
                0.045,
                0.024,
            )

        for dy in (-0.32, 0.38):
            beam(
                builder,
                (side * 1.92, dy, 0.10),
                (side * 1.72, 0.25, 0.69),
                0.28,
                0.22,
            )
            box(
                builder,
                (side * 1.92, dy, 0.055),
                (0.37, 0.31, 0.11),
                14,
                0.025,
            )

        coil(
            builder,
            (side * 1.9, 0.02, 0.23),
            (0, 0, 1),
            0.38,
            2,
            0.045,
            0.025,
        )
        leaf(
            builder,
            (side * 2.82, 0.17, 4.45),
            (side * 1.72, 0.19, 5.02),
            0.21,
        )
        leaf(
            builder,
            (side * 2.95, 0.18, 4.39),
            (side * 3.21, 0.14, 3.72),
            0.12,
        )

    crest = [
        (-0.78, 4.35),
        (0.78, 4.35),
        (0.91, 5.03),
        (0.55, 5.20),
        (-0.55, 5.20),
        (-0.91, 5.03),
    ]
    prism(builder, crest, -0.22, 0.26, 14, 0.065)
    tiki_face(builder, 0, 4.77, 1.34, 0.76, -0.23, 0.19)

    # 시안의 처진 전구는 화면 침범을 막도록 위 테 위에서만 내려온다.
    for i in range(5):
        x = -2.16 + i * 1.08
        tube(
            builder,
            [
                (x - 0.42, -0.18, 4.34),
                (x - 0.21, -0.23, 4.25),
                (x, -0.26, 4.22),
                (x + 0.21, -0.23, 4.25),
                (x + 0.42, -0.18, 4.34),
            ],
            0.018,
            13,
            5,
        )
        shell(
            builder,
            (x, -0.29, 4.13),
            0.34,
            0.28,
            0.075,
            (18, 23, 18),
        )

    obj = builder.finish("tikiScoreboard", (2500, 7000))
    display = rectangular_display(
        (0, 0.03, 2.30),
        (0, 0, 1),
        4.9,
        3.3,
    )
    display["forbidden_front_distance"] = 0.01
    return obj, display


def surf_transform(point):
    x, y, z = point
    return Vector((
        x,
        math.cos(SURF_ANGLE) * y + math.sin(SURF_ANGLE) * z,
        0.96 - math.sin(SURF_ANGLE) * y + math.cos(SURF_ANGLE) * z,
    ))


def clip_halfspace(polygon, normal, limit):
    if not polygon:
        return []

    normal = Vector(normal)
    result = []

    for first, second in zip(polygon, polygon[1:] + polygon[:1]):
        da = normal.dot(first) - limit
        db = normal.dot(second) - limit

        if da <= 0:
            result.append(first)

        if (da < 0 < db) or (db < 0 < da):
            result.append(first.lerp(second, da / (da - db)))

    return result


def build_surf():
    builder = Builder()

    # 끝점 베벨의 Y 위치까지 반영해 실제 최고점을 Z=2.1로 맞춘다.
    top = (
        2.10 - 0.96 + math.sin(SURF_ANGLE) * 0.049
    ) / math.cos(SURF_ANGLE)

    outline = [
        (-0.18, -0.87),
        (0.18, -0.87),
        (0.58, -0.78),
        (0.68, -0.69),
        (0.74, -0.4),
        (0.75, 0.30),
        (0.65, 0.70),
        (0.42, 0.94),
        (0.16, 1.10),
        (0, top),
        (-0.16, 1.10),
        (-0.42, 0.94),
        (-0.65, 0.70),
        (-0.75, 0.30),
        (-0.74, -0.4),
        (-0.68, -0.69),
        (-0.58, -0.78),
    ]
    prism(builder, outline, 0.025, 0.14, 23, 0.024)

    inner = [(x * 0.955, z * 0.975) for x, z in outline]
    prism(builder, inner, 0.01, 0.045, 10, 0.008)

    for low, high, slot, phase in (
        (-0.83, -0.66, 3, 0),
        (0.69, 0.90, 3, 1),
        (0.91, 1.30, 18, 1),
        (-0.70, -0.63, 23, 0),
    ):
        for i in range(12):
            xa = -0.75 + i * 0.125
            xb = -0.75 + (i + 1) * 0.125
            za = 0.065 * math.sin(5 * xa + phase)
            zb = 0.065 * math.sin(5 * xb + phase)

            polygon = [
                Vector((xa, low + za, 0)),
                Vector((xb, low + zb, 0)),
                Vector((xb, high + zb, 0)),
                Vector((xa, high + za, 0)),
            ]

            for first, second in zip(inner, inner[1:] + inner[:1]):
                normal = Vector((
                    second[1] - first[1],
                    first[0] - second[0],
                    0,
                ))
                polygon = clip_halfspace(
                    polygon,
                    normal,
                    normal.x * first[0] + normal.y * first[1],
                )

            polygon = [
                point
                for j, point in enumerate(polygon)
                if (point - polygon[j - 1]).length > 1e-6
            ]
            polygon = [
                point
                for j, point in enumerate(polygon)
                if abs(
                    (point - polygon[j - 1]).cross(
                        polygon[(j + 1) % len(polygon)] - point
                    ).z
                ) > 1e-8
            ]

            if len(polygon) >= 3:
                prism(
                    builder,
                    [(point.x, point.y) for point in polygon],
                    0.005,
                    0.009,
                    slot,
                )

    box(builder, (0, 0.035, 0), (1.15, 0.07, 1.4), 5, 0)
    shell(builder, (0, -0.07, 0.99), 0.36, 0.27, 0.065, (23, 17))
    shell(builder, (0, -0.075, -0.80), 0.31, 0.16, 0.055, (23, 17))
    star(builder, (0.74, -0.055, -0.36), 0.15)

    builder.transform_since(0, surf_transform)

    for x in (-0.53, 0.53):
        for y in (-0.10, 0.52):
            beam(builder, (x, y, 0.075), (x, 0.22, 0.95), 0.13, 0.14)
            box(
                builder,
                (x, y, 0.045),
                (0.21, 0.23, 0.09),
                14,
                0.018,
            )

        box(builder, (x, 0.14, 0.14), (0.16, 0.85, 0.13), 14, 0.02)
        coil(
            builder,
            (x, 0.21, 0.76),
            (0, 0, 1),
            0.13,
            2,
            0.025,
            0.015,
        )

    beam(builder, (-0.64, -0.14, 0.20), (0.64, -0.14, 0.20), 0.13, 0.14)
    beam(builder, (-0.60, 0.23, 0.77), (0.60, 0.23, 0.77), 0.10, 0.12)

    obj = builder.finish("surfMenuSign", (1200, 4000))
    display = rectangular_display(
        (0, 0, 0.96),
        (0, math.sin(SURF_ANGLE), math.cos(SURF_ANGLE)),
        1.15,
        1.4,
    )
    display["forbidden_front_distance"] = 0.01
    display["tilt_degrees"] = 15
    return obj, display


def annulus(
    builder,
    center,
    radius,
    outer,
    front,
    back,
    slot,
    segments=48,
):
    x, z = center
    profile = [
        (radius, back),
        (radius, front + 0.018),
        (radius + 0.018, front),
        (outer - 0.018, front),
        (outer, front + 0.018),
        (outer, back),
    ]
    rings = [
        builder.ring([
            (
                x + r * math.cos(i * math.tau / segments),
                y,
                z + r * math.sin(i * math.tau / segments),
            )
            for i in range(segments)
        ])
        for r, y in profile
    ]

    for first, second in zip(rings, rings[1:] + rings[:1]):
        builder.bridge(first, second, slot)


def arch_body(builder):
    center_z = -0.06
    inner = []
    outer = []

    for i in range(48):
        angle = i * math.tau / 48
        dx, dz = math.cos(angle), math.sin(angle)

        if dz >= 0:
            distance = 1 / math.sqrt(
                (dx / 0.95) ** 2 + (dz / 1.06) ** 2
            )
        else:
            distance = min(
                0.95 / max(abs(dx), 1e-8),
                1.09 / max(-dz, 1e-8),
            )

        inner.append((0.65 * dx, center_z + 0.65 * dz))
        outer.append((distance * dx, center_z + distance * dz))

    inset = [
        (x * 0.975, center_z + (z - center_z) * 0.975)
        for x, z in outer
    ]
    rings = [
        builder.ring([(x, y, z) for x, z in outline])
        for y, outline in (
            (-0.52, inner),
            (-0.575, inner),
            (-0.575, inset),
            (-0.55, outer),
            (-0.52, outer),
        )
    ]

    for first, second in zip(rings, rings[1:] + rings[:1]):
        builder.bridge(first, second, 14)


def build_portal():
    builder = Builder()
    arch_body(builder)

    # 다각형 링의 현도 지름 1.2 표시 원을 침범하지 않도록 여유를 둔다.
    annulus(builder, (0, -0.06), 0.61, 0.72, -0.595, -0.45, 18)
    annulus(builder, (0, -0.06), 0.724, 0.748, -0.572, -0.51, 14)

    circle = [
        (
            0.615 * math.cos(i * math.tau / 48),
            -0.06 + 0.615 * math.sin(i * math.tau / 48),
        )
        for i in range(48)
    ]
    prism(builder, circle, -0.30, -0.20, 5)

    for side in (-1, 1):
        x = side * 0.86

        for z in (-0.72, -0.04, 0.63):
            box(
                builder,
                (x, -0.08, z),
                (0.28, 0.91, 0.65 if z < 0.5 else 0.71),
                14,
                0.035,
            )

        box(builder, (x, -0.02, -1.08), (0.28, 0.94, 0.14), 14, 0.02)

        for z in (-0.70, 0.04):
            tiki_face(builder, x, z, 0.245, 0.54, -0.546, 0.047)

        box(builder, (x, -0.36, 0.985), (0.28, 0.31, 0.13), 14, 0.025)
        shell(builder, (x, -0.38, 1.19), 0.25, 0.32, 0.12, (18, 23))

        for tx, tz, width in (
            (0.53, 1.04, 0.065),
            (0.64, 1.16, 0.065),
            (0.98, 0.56, 0.04),
        ):
            leaf(
                builder,
                (side * 0.90, -0.22, 0.80),
                (side * tx, -0.23, tz),
                width,
            )

    for i in range(8):
        angle = i * math.tau / 8
        cx = 0.115 * math.cos(angle)
        cz = 0.86 + 0.115 * math.sin(angle)
        ux, uz = math.cos(angle), math.sin(angle)
        vx, vz = -uz, ux
        petal = [
            (cx + ux * 0.075, cz + uz * 0.075),
            (cx + vx * 0.032, cz + vz * 0.032),
            (cx - ux * 0.075, cz - uz * 0.075),
            (cx - vx * 0.032, cz - vz * 0.032),
        ]
        prism(builder, petal, -0.594, -0.552, 13, 0.012)

    prism(
        builder,
        [
            (
                0.047 * math.cos(i * math.tau / 8),
                0.86 + 0.047 * math.sin(i * math.tau / 8),
            )
            for i in range(8)
        ],
        -0.599,
        -0.55,
        18,
        0.012,
    )

    obj = builder.finish("portalArch", (2000, 6000))
    display = {
        "shape": "circle",
        "center": (0, -0.51, -0.06),
        "normal": (0, -1, 0),
        "right": (1, 0, 0),
        "up": (0, 0, 1),
        "radius": 0.6,
        "reserved_y": (-0.50, -0.35),
        "game_plane_y": (-0.51, -0.36),
        "forbidden_y_max": -0.35,
        "backing_y": (-0.30, -0.20),
    }
    return obj, display


def verify_clearance(obj, display):
    vertices = [vertex.co.copy() for vertex in obj.data.vertices]

    if display["shape"] == "rectangle":
        center = Vector(display["center"])
        right, up, normal = (
            Vector(display[key])
            for key in ("right", "up", "normal")
        )
        local = [
            Vector((
                (point - center).dot(right),
                (point - center).dot(up),
                (point - center).dot(normal),
            ))
            for point in vertices
        ]
        half_width = display["width"] / 2
        half_height = display["height"] / 2
        depth = display["forbidden_front_distance"]

        assert all(
            not (
                abs(point.x) <= half_width + EPS
                and abs(point.y) <= half_height + EPS
                and point.z > depth + EPS
            )
            for point in local
        ), obj.name

        planes = [
            ((1, 0, 0), half_width - EPS),
            ((-1, 0, 0), half_width - EPS),
            ((0, 1, 0), half_height - EPS),
            ((0, -1, 0), half_height - EPS),
            ((0, 0, -1), -depth - EPS),
        ]
    else:
        center = Vector(display["center"])
        local = [
            Vector((point.x - center.x, point.z - center.z, point.y))
            for point in vertices
        ]
        radius = display["radius"]
        ymax = display["forbidden_y_max"]

        assert all(
            not (
                point.x * point.x + point.y * point.y < radius * radius - EPS
                and point.z < ymax - EPS
            )
            for point in local
        ), obj.name

        # 원에 외접하는 64각형으로 면 교차를 보수적으로 검사한다.
        planes = [((0, 0, 1), ymax - EPS)]
        planes += [
            (
                (
                    math.cos(i * math.tau / 64),
                    math.sin(i * math.tau / 64),
                    0,
                ),
                radius - EPS,
            )
            for i in range(64)
        ]

    for triangle in obj.data.loop_triangles:
        polygon = [local[index] for index in triangle.vertices]

        for normal, limit in planes:
            polygon = clip_halfspace(polygon, normal, limit)
            if not polygon:
                break

        assert not polygon, (
            obj.name,
            "표시 영역 앞 삼각형 침범",
            triangle.index,
        )

    lower, upper = bounds(vertices)
    allowed = {
        "tikiScoreboard": ((-3.3, -0.5, 0), (3.3, 0.6, 5.2)),
        "surfMenuSign": ((-0.91, -0.5, 0), (0.91, 0.7, 2.1)),
        "portalArch": ((-1, -0.6, -1.15), (1, 0.45, 1.35)),
    }
    minimum, maximum = allowed[obj.name]

    assert all(
        lower[i] >= minimum[i] - 1e-5
        and upper[i] <= maximum[i] + 1e-5
        for i in range(3)
    ), (obj.name, lower, upper)
    assert abs(lower.z - minimum[2]) < 1e-5
    assert abs(upper.z - maximum[2]) < 1e-5
    assert obj.location.length == 0
    assert tuple(obj.scale) == (1, 1, 1)
    assert tuple(obj.rotation_euler) == (0, 0, 0)

    return {
        "vertices": len(vertices),
        "triangles": len(obj.data.loop_triangles),
        "bounds_blender": {
            "min": tuple(lower),
            "max": tuple(upper),
        },
        "display_blender": display,
        "front_blender": (0, -1, 0),
        "checks": {
            "closed_components": True,
            "outward_normals": True,
            "nondegenerate_triangles": True,
            "palette_uv": True,
            "display_vertices_clear": True,
            "display_triangles_clear": True,
        },
    }


def yup(point):
    return (point[0], point[2], -point[1])


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]
    assert "sparse" not in accessor

    widths = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
    formats = {5121: "B", 5123: "H", 5125: "I", 5126: "f"}
    fmt = (
        "<"
        + formats[accessor["componentType"]] * widths[accessor["type"]]
    )
    size = struct.calcsize(fmt)
    view = document["bufferViews"][accessor["bufferView"]]
    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    assert view.get("buffer", 0) == 0
    assert stride >= size
    assert accessor["count"] > 0
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_glb(path, obj, metadata):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (b"glTF", 2, len(data))

    chunks = {}
    offset = 12

    while offset < len(data):
        size, kind = struct.unpack_from("<I4s", data, offset)
        assert size % 4 == 0
        assert offset + 8 + size <= len(data)
        assert kind not in chunks

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)
    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    mesh, = document["meshes"]
    node, = document["nodes"]
    material, = document["materials"]
    primitive, = mesh["primitives"]

    assert mesh["name"] == node["name"] == obj.name
    assert material["name"] == "palette"
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]
    assert {"POSITION", "NORMAL", "TEXCOORD_0"}.issubset(attributes)
    assert not any(key.startswith("COLOR_") for key in attributes)

    points = [
        Vector(point)
        for point in accessor_rows(document, binary, attributes["POSITION"])
    ]
    normals = accessor_rows(document, binary, attributes["NORMAL"])
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])
    assert len(points) == len(normals) == len(uvs)

    for normal in normals:
        assert abs(Vector(normal).length - 1) < 1e-4

    for uv in uvs:
        check_uv(uv)

    indices = [
        row[0]
        for row in accessor_rows(document, binary, primitive["indices"])
    ]
    assert len(indices) == 3 * metadata["triangles"]

    for index in range(0, len(indices), 3):
        a, b, c = indices[index:index + 3]
        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a]).cross(points[c] - points[a]).length
            > 2e-10
        )
        assert uvs[a] == uvs[b] == uvs[c]

    lower, upper = bounds(points)
    expected_lower, expected_upper = bounds(
        yup(vertex.co)
        for vertex in obj.data.vertices
    )
    assert (lower - expected_lower).length < 1e-5
    assert (upper - expected_upper).length < 1e-5

    buffer, = document["buffers"]
    assert "uri" not in buffer
    assert len(binary) >= buffer["byteLength"]

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

    display = dict(metadata["display_blender"])
    for key in ("center", "normal", "right", "up"):
        display[key] = yup(display[key])

    if "corners" in display:
        display["corners"] = [yup(point) for point in display["corners"]]

    if display["shape"] == "circle":
        for key in ("reserved_y", "game_plane_y", "backing_y"):
            display[key.replace("_y", "_z")] = sorted(
                -value for value in display.pop(key)
            )
        display["forbidden_z_min"] = -display.pop("forbidden_y_max")

    metadata.update({
        "file": str(path),
        "bounds_glb": {
            "min": tuple(lower),
            "max": tuple(upper),
        },
        "front_glb": yup((0, -1, 0)),
        "display_glb": display,
    })
    metadata["checks"]["glb_binary_verified"] = True
    return metadata


def export_glb(obj, metadata):
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
    return verify_glb(path, obj, metadata)


def preview_plane(scene, name, display, transform, material):
    center = Vector(display["center"])
    right = Vector(display["right"])
    up = Vector(display["up"])
    normal = Vector(display["normal"])

    if display["shape"] == "rectangle":
        center += normal * 0.012
        points = [
            center
            + right * x * display["width"] / 2
            + up * z * display["height"] / 2
            for x, z in ((-1, -1), (1, -1), (1, 1), (-1, 1))
        ]
    else:
        center.y = -0.44
        points = [
            center
            + display["radius"] * (
                right * math.cos(i * math.tau / 64)
                + up * math.sin(i * math.tau / 64)
            )
            for i in range(64)
        ]

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(
        [tuple(transform(point)) for point in points],
        [],
        [tuple(range(len(points)))],
    )
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")
    for loop in uv.data:
        loop.uv = (0.5, 0.5)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def make_preview(models):
    scene = bpy.data.scenes.new("propsA-preview")
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 2400
    scene.render.resolution_y = 1100
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
    shading.studio_light = "paint.sl"
    shading.color_type = "TEXTURE"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 1.25
    shading.curvature_valley_factor = 1.05
    shading.show_specular_highlight = True
    shading.show_object_outline = False
    shading.background_type = "WORLD"

    world = bpy.data.worlds.new("propsA-world")
    world.color = (0.80, 0.73, 0.62)
    scene.world = world

    grey = bpy.data.images.new(
        "preview-grey",
        width=1,
        height=1,
        alpha=True,
    )
    grey.pixels = (0.48, 0.48, 0.48, 1)

    material = bpy.data.materials.new("preview-only-grey")
    material.use_nodes = True
    texture = material.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = grey
    texture.interpolation = "Closest"
    material.node_tree.nodes.active = texture
    material.node_tree.links.new(
        texture.outputs["Color"],
        material.node_tree.nodes["Principled BSDF"].inputs["Base Color"],
    )

    all_points = []
    placements = []
    cursor = 0

    for obj, display in models:
        lower, upper = bounds(vertex.co for vertex in obj.data.vertices)
        scale = 5.2 / (upper.z - lower.z)
        width = (upper.x - lower.x) * scale
        position = Vector((
            cursor - lower.x * scale,
            0,
            -lower.z * scale,
        ))

        def transform(point):
            return point * scale + position

        mesh = obj.data.copy()
        for vertex in mesh.vertices:
            vertex.co = transform(vertex.co)
        mesh.update()

        clone = bpy.data.objects.new("preview-" + obj.name, mesh)
        scene.collection.objects.link(clone)
        preview_plane(
            scene,
            "preview-display-" + obj.name,
            display,
            transform,
            material,
        )

        all_points.extend(vertex.co.copy() for vertex in mesh.vertices)
        placements.append({
            "model": obj.name,
            "scale": scale,
            "translation": tuple(position),
        })
        cursor += width + 1.0

    direction = Vector((
        0,
        -math.cos(math.radians(25)),
        math.sin(math.radians(25)),
    ))
    lower, upper = bounds(all_points)
    pivot = (lower + upper) / 2
    rotation = (-direction).to_track_quat("-Z", "Y")
    basis = rotation.to_matrix()

    screen_lower, screen_upper = bounds(
        basis.transposed() @ (point - pivot)
        for point in all_points
    )
    target = pivot + basis @ Vector((
        (screen_lower.x + screen_upper.x) / 2,
        (screen_lower.y + screen_upper.y) / 2,
        0,
    ))

    camera = bpy.data.objects.new(
        "propsA-camera",
        bpy.data.cameras.new("propsA-camera"),
    )
    scene.collection.objects.link(camera)
    camera.data.type = "ORTHO"
    camera.data.clip_start = 0.01
    camera.data.clip_end = 200
    camera.location = target + direction * 35
    camera.rotation_euler = rotation.to_euler()
    camera.data.ortho_scale = 1

    frame_lower, frame_upper = bounds(camera.data.view_frame(scene=scene))
    camera.data.ortho_scale = max(
        (screen_upper.x - screen_lower.x)
        / (frame_upper.x - frame_lower.x),
        (screen_upper.y - screen_lower.y)
        / (frame_upper.y - frame_lower.y),
    ) * 1.12

    scene.camera = camera
    scene.render.filepath = str(OUTPUT / "propsA.png")

    return scene, {
        "file": scene.render.filepath,
        "engine": "BLENDER_WORKBENCH",
        "color_type": "TEXTURE",
        "elevation_degrees": 25,
        "normalized_preview_height": 5.2,
        "placements": placements,
        "grey_planes_preview_only": True,
    }


def main():
    setup()
    models = []
    records = []

    for build in (build_scoreboard, build_surf, build_portal):
        obj, display = build()
        records.append(verify_clearance(obj, display))
        models.append((obj, display))

    bpy.context.view_layer.update()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for (obj, _), record in zip(models, records, strict=True):
        export_glb(obj, record)

    scene, preview = make_preview(models)
    result = bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )
    assert result == {"FINISHED"}

    png = (OUTPUT / "propsA.png").read_bytes()
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (2400, 1100)

    for (obj, _), record in zip(models, records, strict=True):
        record["comparison"] = preview
        record["palette"] = {
            "file": str(PALETTE),
            "slots": EXPECTED,
            "sampling": "cell center",
        }
        path = OUTPUT / (obj.name + ".json")
        path.write_text(
            json.dumps(record, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(json.dumps({
        "output": str(OUTPUT),
        "models": [obj.name for obj, _ in models],
        "triangles": [record["triangles"] for record in records],
        "preview": preview["file"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
