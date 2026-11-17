"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/waterfallCliff.py

좌표 조건 충돌: 물길 판의 Y=-0.02는 4번 금지 영역에 들어가므로
앞끝을 Y=0.0으로 설정한다. 원점은 이동하지 않는다.
샘의 청록색은 동굴 안쪽 바닥이며, 물길·폭포·웅덩이 물 메시는 생성하지 않는다.
"""

import argparse
import json
import math
import random
import struct
import sys
import tempfile
import zlib
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "props"

NAME = "waterfallCliff"
PANEL_WIDTH = 1024
PANEL_HEIGHT = 1024
EPSILON = 1e-5

BASALT = 5
GRAY = 6
GREEN = 9
CORAL = 10
VEIN = 12
MANGO = 18

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


def bounds(points):
    points = list(points)
    assert points
    return (
        Vector(tuple(min(p[i] for p in points) for i in range(3))),
        Vector(tuple(max(p[i] for p in points) for i in range(3))),
    )


def png_chunk(kind, payload):
    return (
        struct.pack(">I", len(payload))
        + kind
        + payload
        + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
    )


def read_png(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    offset = 8
    chunks = []

    while offset < len(data):
        assert offset + 12 <= len(data)
        size, kind = struct.unpack_from(">I4s", data, offset)
        assert offset + size + 12 <= len(data)

        payload = data[offset + 8:offset + 8 + size]
        checksum = struct.unpack_from(">I", data, offset + 8 + size)[0]
        assert zlib.crc32(kind + payload) & 0xFFFFFFFF == checksum

        chunks.append((kind, payload))
        offset += size + 12

        if kind == b"IEND":
            break

    assert offset == len(data)
    assert chunks[0][0] == b"IHDR"
    assert chunks[-1][0] == b"IEND"

    width, height, depth, color, compression, filtering, interlace = (
        struct.unpack(">IIBBBBB", chunks[0][1])
    )
    assert (depth, compression, filtering, interlace) == (8, 0, 0, 0)
    assert color in (2, 6)

    channels = 3 if color == 2 else 4
    stride = width * channels
    raw = zlib.decompress(
        b"".join(payload for kind, payload in chunks if kind == b"IDAT")
    )
    assert len(raw) == height * (stride + 1)

    previous = bytearray(stride)
    rows = []

    for y in range(height):
        start = y * (stride + 1)
        mode = raw[start]
        assert 0 <= mode <= 4
        row = bytearray(raw[start + 1:start + 1 + stride])

        for x in range(stride):
            left = row[x - channels] if x >= channels else 0
            above = previous[x]
            corner = previous[x - channels] if x >= channels else 0

            if mode == 0:
                predictor = 0
            elif mode == 1:
                predictor = left
            elif mode == 2:
                predictor = above
            elif mode == 3:
                predictor = (left + above) // 2
            else:
                value = left + above - corner
                distances = (
                    abs(value - left),
                    abs(value - above),
                    abs(value - corner),
                )
                predictor = (left, above, corner)[distances.index(min(distances))]

            row[x] = (row[x] + predictor) & 255

        rows.append(bytes(row))
        previous = row

    return width, height, channels, rows, chunks


def palette_colors(data):
    width, height, channels, rows, _ = read_png(data)
    assert (width, height) == (128, 4)

    colors = []

    # 경계 픽셀은 섞여 있으므로 각 칸의 중앙 픽셀만 읽는다.
    for slot in range(32):
        offset = (slot * 4 + 2) * channels
        colors.append(tuple(rows[2][offset:offset + 3]))

        if channels == 4:
            assert rows[2][offset + 3] == 255

    return colors


def load_palette():
    colors = palette_colors(PALETTE.read_bytes())

    for slot, expected in EXPECTED_RGB.items():
        assert colors[slot] == expected, (slot, colors[slot], expected)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    image.colorspace_settings.name = "sRGB"
    image.pack()

    material = bpy.data.materials.new("palette")
    material.use_nodes = True

    nodes = material.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.78
    shader.inputs["Metallic"].default_value = 0

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"

    links = material.node_tree.links
    links.new(uv.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    nodes.active = texture

    return material, colors


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.parts = []

    def component(self, name, vertices, faces, slots):
        assert name not in self.parts
        first = len(self.vertices)
        self.vertices.extend(tuple(vertex) for vertex in vertices)
        self.faces.extend(
            tuple(first + index for index in face)
            for face in faces
        )
        self.slots.extend(
            [slots] * len(faces) if isinstance(slots, int) else slots
        )
        self.parts.append(name)


def rock(builder, name, limits, seed, moss=True):
    x0, x1, y0, y1, z0, z1 = limits
    rng = random.Random(seed)

    outline = [
        (-0.68, -1),
        (0.60, -1),
        (1, -0.58),
        (1, 0.58),
        (0.56, 1),
        (-0.65, 1),
        (-1, 0.58),
        (-1, -0.62),
    ]
    outline = [
        (
            x if abs(x) == 1 else x + rng.uniform(-0.045, 0.045),
            y if abs(y) == 1 else y + rng.uniform(-0.045, 0.045),
        )
        for x, y in outline
    ]

    bevel = min(
        0.30,
        (z1 - z0) * 0.18,
        (x1 - x0) * 0.18,
        (y1 - y0) * 0.18,
    )
    vertices = []

    for layer, scale in enumerate((0.78, 1, 0.96, 0.76)):
        for index, (x, y) in enumerate(outline):
            z = (
                z0,
                z0 + bevel,
                z1 - bevel,
                z1 - (rng.uniform(0.01, 0.055) if index else 0),
            )[layer]
            vertices.append((
                (x0 + x1) / 2 + x * (x1 - x0) / 2 * scale,
                (y0 + y1) / 2 + y * (y1 - y0) / 2 * scale,
                z,
            ))

    faces = [tuple(reversed(range(8)))]
    slots = [BASALT]

    for layer in range(3):
        for index in range(8):
            following = (index + 1) % 8
            faces.append((
                layer * 8 + index,
                layer * 8 + following,
                (layer + 1) * 8 + following,
                (layer + 1) * 8 + index,
            ))

            if moss and layer == 2 and index not in (2, 6):
                slot = GREEN
            elif layer == 1 and (index + seed) % 7 == 0:
                slot = GRAY
            else:
                slot = BASALT

            slots.append(slot)

    vertices.append(((x0 + x1) / 2, (y0 + y1) / 2, z1 - 0.015))

    for index in range(8):
        faces.append((24 + index, 24 + (index + 1) % 8, 32))
        slots.append(GREEN if moss else BASALT)

    builder.component(name, vertices, faces, slots)


def box(builder, name, center, size, slot, bevel=0):
    bm = bmesh.new()

    try:
        bmesh.ops.create_cube(bm, size=1)

        for vertex in bm.verts:
            vertex.co = Vector(tuple(
                vertex.co[index] * size[index]
                for index in range(3)
            ))

        if bevel:
            bmesh.ops.bevel(
                bm,
                geom=list(bm.edges),
                offset=min(bevel, min(size) * 0.24),
                segments=1,
                affect="EDGES",
                profile=0.5,
            )

        bm.verts.index_update()
        builder.component(
            name,
            [vertex.co + Vector(center) for vertex in bm.verts],
            [
                tuple(vertex.index for vertex in face.verts)
                for face in bm.faces
            ],
            slot,
        )

    finally:
        bm.free()


def tube(builder, name, start, end, radius, slot, sides=6):
    start = Vector(start)
    end = Vector(end)
    rotation = (end - start).to_track_quat("Z", "Y").to_matrix()

    vertices = [
        point + rotation @ Vector((
            radius * math.cos(index * math.tau / sides),
            radius * math.sin(index * math.tau / sides),
            0,
        ))
        for point in (start, end)
        for index in range(sides)
    ]
    faces = [
        tuple(reversed(range(sides))),
        tuple(range(sides, 2 * sides)),
    ]
    faces += [
        (
            index,
            (index + 1) % sides,
            (index + 1) % sides + sides,
            index + sides,
        )
        for index in range(sides)
    ]
    builder.component(name, vertices, faces, slot)


def ellipsoid(
    builder, name, center, radii, slot, tilt=0, segments=8
):
    rotation = Matrix.Rotation(tilt, 3, "Y")
    vertices = [(0, 0, -radii[2])]

    for z in (-0.65, 0, 0.65):
        radius = math.sqrt(1 - z * z)
        vertices += [
            (
                radii[0] * radius * math.cos(index * math.tau / segments),
                radii[1] * radius * math.sin(index * math.tau / segments),
                radii[2] * z,
            )
            for index in range(segments)
        ]

    vertices.append((0, 0, radii[2]))
    faces = []

    for index in range(segments):
        following = (index + 1) % segments
        faces.append((0, 1 + following, 1 + index))

        for row in range(2):
            first = 1 + row * segments
            faces.append((
                first + index,
                first + following,
                first + segments + following,
                first + segments + index,
            ))

        first = 1 + 2 * segments
        faces.append((first + index, first + following, len(vertices) - 1))

    builder.component(
        name,
        [Vector(center) + rotation @ Vector(vertex) for vertex in vertices],
        faces,
        slot,
    )


def spring(builder):
    segments = 16
    vertices = []

    # 막힌 전면 대신 아치 단면을 연결해 실제 동굴 입구를 남긴다.
    for index in range(segments + 1):
        angle = index * math.pi / segments
        inner = Vector((
            0.90 * math.cos(angle),
            0,
            5.58 + 0.57 * math.sin(angle),
        ))
        outer = Vector((
            1.52 * math.cos(angle),
            0,
            5.58 + 1.22 * math.sin(angle),
        ))
        inset = inner.lerp(outer, 0.86)

        for point, y in (
            (inner, 2.16),
            (inset, 2.12),
            (outer, 2.27),
            (outer, 2.70),
            (inner, 2.70),
        ):
            vertices.append((point.x, y, point.z))

    faces = [tuple(reversed(range(5)))]
    slots = [BASALT]

    for index in range(segments):
        for edge in range(5):
            following = (edge + 1) % 5
            faces.append((
                index * 5 + edge,
                index * 5 + following,
                (index + 1) * 5 + following,
                (index + 1) * 5 + edge,
            ))
            slots.append(
                GREEN if edge == 2
                else GRAY if edge == 1 and index % 5 == 0
                else BASALT
            )

    faces.append(tuple(segments * 5 + index for index in range(5)))
    slots.append(BASALT)
    builder.component("spring-open-arch", vertices, faces, slots)

    for side in (-1, 1):
        box(
            builder,
            "spring-jamb-" + str(side),
            (side * 1.21, 2.43, 5.45),
            (0.62, 0.54, 0.34),
            BASALT,
            0.055,
        )

    box(
        builder,
        "spring-dark-back",
        (0, 2.94, 5.80),
        (2.55, 0.40, 1.03),
        BASALT,
        0.09,
    )
    box(
        builder,
        "spring-turquoise-bed",
        (0, 2.44, 5.315),
        (1.78, 0.58, 0.03),
        3,
    )

    # Y<0 금지 조건 때문에 판 앞끝은 정확히 Y=0이다.
    box(
        builder,
        "waterway-flat-floor",
        (0, 1.075, 5.265),
        (2.80, 2.15, 0.13),
        BASALT,
    )


LEAF_OUTLINE = [
    (-0.04, -0.65),
    (-0.28, -0.58),
    (-0.51, -0.43),
    (-0.58, -0.20),
    (-0.28, -0.21),
    (-0.60, -0.09),
    (-0.65, 0.12),
    (-0.58, 0.33),
    (-0.22, 0.14),
    (-0.48, 0.42),
    (-0.35, 0.58),
    (-0.12, 0.69),
    (0, 0.72),
    (0.12, 0.69),
    (0.35, 0.58),
    (0.48, 0.42),
    (0.22, 0.14),
    (0.58, 0.33),
    (0.65, 0.12),
    (0.60, -0.09),
    (0.28, -0.21),
    (0.58, -0.20),
    (0.51, -0.43),
    (0.28, -0.58),
    (0.04, -0.65),
]


def leaf(builder, name, center, scale, tilt):
    rotation = Matrix.Rotation(tilt, 3, "Y")

    def point(x, y, z):
        return Vector(center) + rotation @ Vector((
            x * scale, y * scale, z * scale,
        ))

    count = len(LEAF_OUTLINE)
    vertices = [
        point(x, y, z)
        for y in (-0.035, 0.035)
        for x, z in LEAF_OUTLINE
    ]
    faces = [
        tuple(reversed(range(count))),
        tuple(range(count, 2 * count)),
    ]
    faces += [
        (
            index,
            (index + 1) % count,
            (index + 1) % count + count,
            index + count,
        )
        for index in range(count)
    ]
    builder.component(name, vertices, faces, GREEN)

    tube(
        builder,
        name + "-midrib",
        point(0, -0.055, -0.64),
        point(0, -0.055, 0.64),
        0.014 * scale,
        VEIN,
    )

    for index, (z, side) in enumerate((
        (-0.32, -1),
        (-0.02, 1),
        (0.27, -1),
    )):
        tube(
            builder,
            name + "-vein-" + str(index),
            point(0, -0.055, z - 0.12),
            point(side * 0.40, -0.055, z + 0.12),
            0.008 * scale,
            VEIN,
            5,
        )

    tube(
        builder,
        name + "-stem",
        point(0, 0, -0.95),
        point(0, 0, -0.57),
        0.026 * scale,
        GREEN,
    )


def blade(builder, name, start, end, width):
    start = Vector(start)
    end = Vector(end)
    normal = Vector((0, -1, 0))
    across = (end - start).cross(normal).normalized() * width
    middle = start.lerp(end, 0.54)

    vertices = [
        start,
        end,
        middle + across,
        middle - across,
        middle + normal * width * 0.20,
        middle - normal * width * 0.20,
    ]
    faces = [
        (0, 2, 4),
        (2, 1, 4),
        (1, 3, 4),
        (3, 0, 4),
        (2, 0, 5),
        (1, 2, 5),
        (3, 1, 5),
        (0, 3, 5),
    ]
    builder.component(name, vertices, faces, GREEN)


def fern(builder, name, root, side, scale):
    root = Vector(root)
    path = [
        root + Vector((
            side * 0.68 * t,
            -0.10 * math.sin(t * math.pi / 2),
            0.90 * t - 0.22 * t * t,
        )) * scale
        for t in [index / 6 for index in range(7)]
    ]

    for index in range(6):
        tube(
            builder,
            name + "-stem-" + str(index),
            path[index],
            path[index + 1],
            0.016 * scale,
            VEIN,
            5,
        )

        t = (index + 1) / 7
        width = 0.32 * (1 - t * 0.70) * scale

        for sign in (-1, 1):
            start = path[index + 1]
            end = start + Vector((
                sign * width, -0.055 * scale, 0.13 * scale,
            ))
            blade(
                builder,
                name + "-pinna-" + str(index) + "-" + str(sign),
                start,
                end,
                width * 0.27,
            )


def flower(builder, name, center):
    center = Vector(center)

    for index in range(5):
        angle = index * math.tau / 5 + 0.12
        direction = Vector((math.sin(angle), 0, math.cos(angle)))
        ellipsoid(
            builder,
            name + "-petal-" + str(index),
            center + direction * 0.245,
            (0.185, 0.070, 0.285),
            CORAL,
            angle,
        )

    ellipsoid(
        builder,
        name + "-heart",
        center + Vector((0, -0.075, 0)),
        (0.12, 0.07, 0.12),
        MANGO,
    )

    end = center + Vector((0.12, -0.27, 0.30))
    tube(
        builder,
        name + "-stamen",
        center + Vector((0, -0.12, 0)),
        end,
        0.030,
        MANGO,
    )

    for index, offset in enumerate((
        (-0.045, 0, 0),
        (0.04, 0.005, 0.025),
        (0, -0.02, 0.067),
    )):
        ellipsoid(
            builder,
            name + "-pollen-" + str(index),
            end + Vector(offset),
            (0.055, 0.04, 0.052),
            MANGO,
            segments=6,
        )

    for index, (x, z, tilt) in enumerate((
        (-0.32, -0.23, -0.7),
        (0.32, -0.24, 0.7),
        (0.05, -0.43, 0.1),
    )):
        ellipsoid(
            builder,
            name + "-leaf-" + str(index),
            center + Vector((x, 0.09, z)),
            (0.23, 0.11, 0.40),
            GREEN,
            tilt,
        )


def build_geometry():
    builder = Builder()

    # 각 범위는 x0, x1, y0, y1, z0, z1이며 회전 없이 유지한다.
    rock_limits = [
        (-1.58, 1.58, 0.08, 3.25, 0.25, 1.97),
        (-1.58, 1.58, 0.06, 3.25, 1.83, 3.74),
        (-1.58, 1.58, 0.08, 3.20, 3.57, 5.29),
        (-3.80, -1.47, 0.18, 3.05, -0.10, 4.03),
        (1.47, 3.95, 0.18, 3.00, -0.10, 4.10),
        (-3.75, -1.48, 0.35, 2.85, 3.45, 6.22),
        (-2.53, -1.405, 0.06, 1.10, 4.50, 5.87),
        (-3.75, -1.45, 2.15, 3.70, 2.50, 5.84),
        (1.48, 3.70, 0.50, 2.60, 3.10, 6.00),
        (1.405, 2.65, 0.06, 1.15, 4.55, 5.80),
        (1.48, 3.70, 2.05, 3.65, 2.50, 5.76),
        (-4.05, -2.45, -1.20, 0.90, -0.10, 1.80),
        (-3.40, -1.66, -0.92, 1.15, 0.95, 3.48),
        (-4.10, -2.70, -0.30, 1.70, 1.40, 3.90),
        (-2.80, -1.65, -1.35, -0.20, 0, 1.30),
        (-4.00, -3.00, -0.95, 0.50, 0, 0.85),
        (1.66, 3.20, -1.30, 1.35, -0.10, 2.55),
        (2.40, 4.10, -0.90, 1.15, 1.65, 3.65),
        (3.40, 4.80, -0.60, 1.30, 0, 1.50),
        (1.68, 2.55, -1.40, -0.35, 0, 1.20),
        (4.10, 5.15, 0, 2.00, 0, 0.90),
        (-3.60, -1.50, 3.00, 4.55, 0, 3.30),
        (-2.40, 0, 3.35, 5.05, -0.10, 2.80),
        (-0.40, 2.05, 3.30, 5.30, -0.10, 3.15),
        (1.80, 4.00, 3.10, 5.20, -0.10, 2.90),
        (3.65, 5.20, 2.25, 4.50, -0.10, 2.15),
        (4.70, 6.20, 2.25, 4.95, -0.10, 1.38),
        (3.60, 5.50, 4.10, 5.25, -0.10, 0.98),
        (1.10, 2.90, 4.60, 5.30, -0.10, 0.82),
        (-1.55, 1.65, 2.90, 4.15, 2.65, 5.30),
        (-2.80, -0.20, 3.10, 4.30, 1.40, 4.60),
        (0.30, 3.30, 3.25, 4.60, 1.25, 4.35),
    ]

    for index, limits in enumerate(rock_limits):
        rock(
            builder,
            "basalt-mass-" + str(index),
            limits,
            47 + index,
            moss=index >= 3,
        )

    spring(builder)

    for index, (x, z, width) in enumerate((
        (-0.65, 1.88, 1.30),
        (0.61, 3.63, 1.35),
        (-0.15, 4.73, 1.12),
    )):
        box(
            builder,
            "wet-gray-seam-" + str(index),
            (x, 0.125, z),
            (width, 0.11, 0.095),
            GRAY,
            0.025,
        )

    for index, (center, scale, tilt) in enumerate((
        ((-2.72, -0.42, 3.02), 1.05, -0.30),
        ((2.74, -0.45, 2.98), 1.05, 0.38),
        ((4.26, -0.10, 1.39), 0.92, -0.65),
        ((-3.30, -0.30, 1.40), 0.76, -0.55),
        ((-2.12, 0.35, 3.24), 0.67, 0.40),
        ((2.16, 0.40, 3.28), 0.65, -0.28),
    )):
        leaf(builder, "monstera-" + str(index), center, scale, tilt)

    for index, (root, side, scale) in enumerate((
        ((-3.25, -0.45, 2.43), -1, 0.95),
        ((-2.30, -0.62, 0.80), -1, 0.85),
        ((3.35, -0.55, 0.95), 1, 1.05),
        ((4.15, 0.20, 1.15), 1, 0.85),
        ((-3.10, 1.20, 3.15), -1, 0.75),
    )):
        fern(builder, "fern-" + str(index), root, side, scale)

    for index, center in enumerate((
        (-2.62, -0.82, 2.63),
        (-3.18, -0.65, 1.94),
        (3.25, -0.55, 2.10),
    )):
        flower(builder, "hibiscus-" + str(index), center)

    mesh = bpy.data.meshes.new(NAME)
    mesh.from_pydata(builder.vertices, [], builder.faces)
    mesh.update()

    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)
        bm.faces.ensure_lookup_table()
        slot_layer = bm.faces.layers.int.new("palette_slot")

        for face, slot in zip(bm.faces, builder.slots, strict=True):
            face[slot_layer] = slot

        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bmesh.ops.triangulate(
            bm,
            faces=list(bm.faces),
            quad_method="BEAUTY",
            ngon_method="EAR_CLIP",
        )
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

        # 각 덩어리는 닫되, 겹친 덩어리의 Boolean 합집합은 만들지 않는다.
        assert all(edge.is_manifold for edge in bm.edges)
        bm.to_mesh(mesh)

    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()
    return mesh, builder


def check_clearances(points):
    for point in points:
        x, y, z = point

        assert not (
            -1.36 <= x <= 1.36
            and 0 <= y <= 2.10
            and z > 5.36
        ), ("upper-waterway", tuple(point))

        assert not (
            -1.45 <= x <= 1.45
            and z > 0.3
            and y < 0
        ), ("fall-clearance", tuple(point))


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")
    slots = mesh.attributes["palette_slot"]
    used = set()

    for polygon in mesh.polygons:
        polygon.use_smooth = False
        slot = slots.data[polygon.index].value
        used.add(slot)

        for loop_index in polygon.loop_indices:
            uv.data[loop_index].uv = ((slot + 0.5) / 32, 0.5)

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    check_clearances(vertex.co for vertex in mesh.vertices)

    assert 3000 <= len(mesh.loop_triangles) <= 8000
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert len([
        item for item in bpy.context.scene.objects
        if item.type == "MESH"
    ]) == 1
    assert obj.location.length == 0
    assert tuple(obj.scale) == (1, 1, 1)
    assert obj.rotation_euler.to_matrix().is_identity

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)

    return obj, {
        "name": NAME,
        "origin_blender": [0, 0, 0],
        "origin_definition": "lip 바로 아래 지면; bbox 재중심화 없음",
        "coordinate_resolution": (
            "판 앞끝 Y=-0.02는 4번 금지 영역과 충돌하므로 Y=0.0 사용"
        ),
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "bbox_blender": {
            "min": list(lower),
            "max": list(upper),
            "center": list((lower + upper) / 2),
        },
        "blender_dimensions": list(upper - lower),
        "triangles": len(mesh.loop_triangles),
        "mesh_objects": 1,
        "material": "palette",
        "slots_used": sorted(used),
        "parts": len(builder.parts),
        "clearance_checks_passed": True,
        "waterway_floor": {
            "x": [-1.40, 1.40],
            "y": [0, 2.15],
            "top_z": 5.33,
        },
    }


def to_yup(point):
    return Vector((point.x, point.z, -point.y))


def accessor_rows(document, binary, index, width):
    accessor = document["accessors"][index]
    assert accessor["componentType"] == 5126
    assert "sparse" not in accessor

    view = document["bufferViews"][accessor["bufferView"]]
    fmt = "<" + "f" * width
    size = struct.calcsize(fmt)
    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    return [
        struct.unpack_from(fmt, binary, start + row * stride)
        for row in range(accessor["count"])
    ]


def verify_glb(path, obj, metadata, colors):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (b"glTF", 2, len(data))

    chunks = {}
    offset = 12

    while offset < len(data):
        size, kind = struct.unpack_from("<I4s", data, offset)
        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)
    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]
    primitive, = mesh["primitives"]

    assert mesh["name"] == node["name"] == NAME
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert material["name"] == "palette"
    assert primitive["material"] == 0

    attributes = primitive["attributes"]
    points = [
        Vector(point)
        for point in accessor_rows(
            document, binary, attributes["POSITION"], 3,
        )
    ]

    check_clearances(
        Vector((point.x, -point.z, point.y))
        for point in points
    )

    for u, v in accessor_rows(
        document, binary, attributes["TEXCOORD_0"], 2,
    ):
        slot = round(u * 32 - 0.5)
        assert slot in metadata["slots_used"]
        assert abs(u - (slot + 0.5) / 32) < 1e-7
        assert abs(v - 0.5) < 1e-7

    count = document["accessors"][primitive["indices"]]["count"]
    assert count == metadata["triangles"] * 3

    lower, upper = bounds(points)
    expected_lower, expected_upper = bounds(
        to_yup(vertex.co) for vertex in obj.data.vertices
    )
    assert (lower - expected_lower).length < EPSILON
    assert (upper - expected_upper).length < EPSILON

    image, = document["images"]
    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    embedded_png = binary[start:start + view["byteLength"]]
    assert palette_colors(embedded_png) == colors

    metadata["glb_file"] = str(path)
    metadata["bbox_yup"] = {
        "min": list(lower),
        "max": list(upper),
        "center": list((lower + upper) / 2),
    }
    metadata["glb_dimensions"] = list(upper - lower)
    metadata["palette_rgb"] = {
        str(slot): list(colors[slot])
        for slot in metadata["slots_used"]
    }


def export_glb(obj, metadata, colors):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    path = OUTPUT / (NAME + ".glb")
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

    verify_glb(path, obj, metadata, colors)


def make_render_scene(obj, samples):
    scene = bpy.data.scenes.new(NAME + "-comparison")
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False

    scene.render.resolution_x = PANEL_WIDTH
    scene.render.resolution_y = PANEL_HEIGHT
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1

    world = bpy.data.worlds.new(NAME + "-preview-world")
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.78, 0.73, 0.64, 1)
    background.inputs["Strength"].default_value = 0.65
    scene.world = world

    clone = bpy.data.objects.new(NAME + "-preview", obj.data.copy())
    scene.collection.objects.link(clone)

    points = [vertex.co.copy() for vertex in clone.data.vertices]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2
    floor_z = lower.z - 0.025

    floor_mesh = bpy.data.meshes.new("preview-floor")
    floor_mesh.from_pydata(
        [
            (-200, -200, floor_z),
            (200, -200, floor_z),
            (200, 200, floor_z),
            (-200, 200, floor_z),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    floor_mesh.update()

    floor = bpy.data.objects.new("preview-floor", floor_mesh)
    scene.collection.objects.link(floor)

    ground = bpy.data.materials.new("preview-ground")
    ground.use_nodes = True
    shader = ground.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (0.72, 0.58, 0.38, 1)
    shader.inputs["Roughness"].default_value = 1
    floor_mesh.materials.append(ground)

    for label, position, energy, size in (
        ("key", (-6, -9, 13), 1900, 7),
        ("fill", (8, -1, 9), 1100, 6),
        ("rim", (1, 7, 12), 1800, 5),
    ):
        light = bpy.data.lights.new("preview-" + label, "AREA")
        light.energy = energy
        light.shape = "DISK"
        light.size = size

        lamp = bpy.data.objects.new(light.name, light)
        scene.collection.objects.link(lamp)
        lamp.location = position
        lamp.rotation_euler = (
            pivot - lamp.location
        ).to_track_quat("-Z", "Y").to_euler()

    cameras = []
    scales = []

    for label, direction in (
        ("front", (0, -1, 0)),
        ("front-above-45", (0, -1, 1)),
    ):
        direction = Vector(direction).normalized()
        rotation = (-direction).to_track_quat("-Z", "Y")
        basis = rotation.to_matrix()

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
            label, bpy.data.cameras.new(label),
        )
        scene.collection.objects.link(camera)
        camera.data.type = "ORTHO"
        camera.data.clip_start = 0.01
        camera.data.clip_end = 200
        camera.data.ortho_scale = 1
        camera.location = target + direction * 24
        camera.rotation_euler = rotation.to_euler()

        frame_lower, frame_upper = bounds(
            camera.data.view_frame(scene=scene)
        )
        scales.append(max(
            (screen_upper.x - screen_lower.x)
            / (frame_upper.x - frame_lower.x),
            (screen_upper.y - screen_lower.y)
            / (frame_upper.y - frame_lower.y),
        ) * 1.15)
        cameras.append(camera)

    for camera in cameras:
        camera.data.ortho_scale = max(scales)

    return scene, cameras


def combine_png(left, right, output):
    lw, lh, lc, left_rows, chunks = read_png(left.read_bytes())
    rw, rh, rc, right_rows, _ = read_png(right.read_bytes())
    assert (lw, lh, lc) == (rw, rh, rc) == (
        PANEL_WIDTH, PANEL_HEIGHT, 4,
    )

    data = bytearray(b"\x89PNG\r\n\x1a\n")
    data.extend(png_chunk(
        b"IHDR",
        struct.pack(">IIBBBBB", lw + rw, lh, 8, 6, 0, 0, 0),
    ))

    for kind, payload in chunks:
        if kind in (b"gAMA", b"cHRM", b"sRGB", b"iCCP"):
            data.extend(png_chunk(kind, payload))

    raw = b"".join(
        b"\x00" + left_row + right_row
        for left_row, right_row in zip(
            left_rows, right_rows, strict=True,
        )
    )
    data.extend(png_chunk(b"IDAT", zlib.compress(raw, 6)))
    data.extend(png_chunk(b"IEND", b""))
    output.write_bytes(data)


def render_comparison(obj, samples):
    scene, cameras = make_render_scene(obj, samples)
    output = OUTPUT / (NAME + ".png")

    with tempfile.TemporaryDirectory(
        prefix="waterfall-preview-",
        dir=OUTPUT,
    ) as directory:
        paths = []

        for index, camera in enumerate(cameras):
            scene.camera = camera
            path = Path(directory) / f"panel-{index}.png"
            scene.render.filepath = str(path)

            result = bpy.ops.render.render(
                write_still=True,
                scene=scene.name,
            )
            assert result == {"FINISHED"}
            paths.append(path)

        combine_png(paths[0], paths[1], output)

    return {
        "file": str(output),
        "panel_order": ["front", "front_above_45"],
        "view_directions": [[0, -1, 0], [0, -1, 1]],
        "dimensions": [PANEL_WIDTH * 2, PANEL_HEIGHT],
        "same_orthographic_scale": True,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")
    parser.add_argument("--samples", type=int, default=32)

    args = parser.parse_args(
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )

    if args.samples < 1:
        parser.error("--samples는 양수여야 합니다.")

    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3이 필요합니다.")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("--disable-autoexec 옵션으로 실행하세요.")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = NAME + "-export"

    material, colors = load_palette()
    mesh, builder = build_geometry()
    obj, metadata = finish_object(mesh, builder, material)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    export_glb(obj, metadata, colors)

    metadata["comparison"] = (
        None
        if args.skip_render
        else render_comparison(obj, args.samples)
    )

    report = json.dumps(
        metadata,
        ensure_ascii=False,
        indent=2,
        allow_nan=False,
    )
    (OUTPUT / (NAME + ".json")).write_text(
        report + "\n",
        encoding="utf-8",
    )
    print(report)


if __name__ == "__main__":
    main()
