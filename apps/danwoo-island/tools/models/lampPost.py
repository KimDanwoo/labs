"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/lampPost.py

Blender 5.3 메모리상 형상 생성·GLB 검증 통과: 2,944삼각형.
파일 저장·비교 렌더는 실행하지 않았습니다.
"""
import argparse
import json
import math
import struct
import sys
import tempfile
import zlib
from collections import Counter
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/props"
NAME = "lampPost"
TARGET = Vector((0.62, 0.62, 3.50))
GLASS_CENTER = Vector((0, 0, 1.42))
GLASS_SIZE = Vector((0.34, 0.34, 0.40))
GLASS_MIN = GLASS_CENTER - GLASS_SIZE / 2
GLASS_MAX = GLASS_CENTER + GLASS_SIZE / 2
EPSILON = 1e-5
PANEL_WIDTH, PANEL_HEIGHT = 700, 1200
TRIANGLE_MIN, TRIANGLE_MAX = 1200, 3000

SLOTS = {
    "bamboo": 1,
    "cream": 23,
    "coral": 10,
    "turquoise": 3,
    "mango": 18,
    "leaf": 9,
    "rib": 12,
    "wood": 14,
    "wood_light": 11,
    "basalt": 5,
    "pink": 17,
}
EXPECTED_RGB = {
    1: (235, 209, 163),
    23: (255, 242, 232),
    10: (228, 154, 120),
    3: (61, 187, 231),
    18: (248, 166, 88),
    9: (145, 173, 120),
    12: (171, 174, 43),
    14: (179, 109, 69),
    11: (152, 129, 101),
    5: (74, 65, 60),
    17: (253, 230, 226),
}


def bounds(points):
    points = list(points)
    assert points

    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
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

    offset, chunks = 8, []

    while offset < len(data):
        assert offset + 12 <= len(data)

        size, kind = struct.unpack_from(">I4s", data, offset)
        assert offset + size + 12 <= len(data)

        payload = data[offset + 8:offset + 8 + size]
        crc, = struct.unpack_from(">I", data, offset + 8 + size)
        assert zlib.crc32(kind + payload) & 0xFFFFFFFF == crc

        chunks.append((kind, payload))
        offset += size + 12

        if kind == b"IEND":
            assert size == 0 and offset == len(data)
            break

    assert chunks[0][0] == b"IHDR" and chunks[-1][0] == b"IEND"

    w, h, depth, color, compression, filtering, interlace = struct.unpack(
        ">IIBBBBB", chunks[0][1]
    )

    assert w > 0 and h > 0
    assert (depth, compression, filtering, interlace) == (8, 0, 0, 0)
    assert color in (2, 6)

    channels = 3 if color == 2 else 4
    stride = w * channels
    raw = zlib.decompress(b"".join(p for k, p in chunks if k == b"IDAT"))
    assert len(raw) == h * (stride + 1)

    previous, rows = bytearray(stride), []

    for y in range(h):
        start = y * (stride + 1)
        mode = raw[start]
        assert mode in range(5)

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

    return w, h, channels, rows, chunks


def palette_colors(data):
    w, h, channels, rows, _ = read_png(data)
    assert (w, h) == (128, 4)

    colors = []

    for slot in range(32):
        offset = (slot * 4 + 2) * channels
        colors.append(tuple(rows[2][offset:offset + 3]))

        if channels == 4:
            assert rows[2][offset + 3] == 255

    return colors


def load_palette():
    assert bpy.app.version[:2] == (5, 3), "Blender 5.3이 필요합니다."
    assert "--disable-autoexec" in sys.argv, "--disable-autoexec 옵션이 필요합니다."

    colors = palette_colors(PALETTE.read_bytes())

    for slot, expected in EXPECTED_RGB.items():
        assert colors[slot] == expected, (slot, colors[slot], expected)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    image.pack()

    material = bpy.data.materials.new("palette")
    assert material.name == "palette"
    material.use_nodes = True

    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.82
    shader.inputs["Metallic"].default_value = 0

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"

    links.new(uv.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    nodes.active = texture

    return material, colors


def uv_slot(value):
    u, v = value
    assert math.isfinite(u) and math.isfinite(v)

    slot = round(u * 32 - 0.5)
    assert slot in SLOTS.values()
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7

    return slot


class Builder:
    def __init__(self):
        self.vertices, self.faces, self.slots = [], [], []
        self.face_parts, self.parts = [], []

    def component(self, name, vertices, faces, slot):
        assert name not in {p["name"] for p in self.parts}
        assert slot in SLOTS.values()

        start, part_id = len(self.vertices), len(self.parts) + 1
        vertices = [tuple(p) for p in vertices]
        assert all(math.isfinite(c) for p in vertices for c in p)

        self.vertices.extend(vertices)
        self.parts.append({
            "id": part_id,
            "name": name,
            "slot": slot,
            "start": start,
            "count": len(vertices),
        })

        for face in faces:
            assert len(face) >= 3 and len(set(face)) == len(face)
            assert all(0 <= i < len(vertices) for i in face)

            self.faces.append(tuple(start + i for i in face))
            self.slots.append(slot)
            self.face_parts.append(part_id)


def radial_solid(builder, name, profile, slot, segments=16):
    assert len(profile) >= 2 and all(r > 0 for r, _ in profile)

    vertices = [
        (
            r * math.cos(i * math.tau / segments),
            r * math.sin(i * math.tau / segments),
            z,
        )
        for r, z in profile
        for i in range(segments)
    ]

    faces = [tuple(reversed(range(segments)))]

    for j in range(len(profile) - 1):
        for i in range(segments):
            k = (i + 1) % segments
            faces.append((
                j * segments + i,
                j * segments + k,
                (j + 1) * segments + k,
                (j + 1) * segments + i,
            ))

    faces.append(tuple(
        (len(profile) - 1) * segments + i
        for i in range(segments)
    ))

    builder.component(name, vertices, faces, slot)


def solid(builder, name, profile, front, back, slot):
    assert front < back and len(profile) >= 3

    n = len(profile)
    vertices = [
        (x, y, z)
        for y in (front, back)
        for x, z in profile
    ]
    faces = [
        tuple(reversed(range(n))),
        tuple(range(n, 2 * n)),
    ]
    faces.extend(
        (i, (i + 1) % n, (i + 1) % n + n, i + n)
        for i in range(n)
    )

    builder.component(name, vertices, faces, slot)


def box(builder, name, center, size, slot, bevel=0.005):
    bm = bmesh.new()

    try:
        bmesh.ops.create_cube(bm, size=1)

        for v in bm.verts:
            v.co = Vector(tuple(v.co[a] * size[a] for a in range(3)))

        if bevel:
            bmesh.ops.bevel(
                bm,
                geom=list(bm.edges),
                offset=min(bevel, min(size) * 0.22),
                segments=1,
                affect="EDGES",
                profile=0.5,
            )

        bm.verts.index_update()

        builder.component(
            name,
            [v.co + Vector(center) for v in bm.verts],
            [tuple(v.index for v in f.verts) for f in bm.faces],
            slot,
        )

    finally:
        bm.free()


def tube(builder, name, path, radius, slot, sides=6):
    path = [Vector(p) for p in path]
    vertices = []

    for i, p in enumerate(path):
        tangent = (
            path[min(i + 1, len(path) - 1)]
            - path[max(i - 1, 0)]
        )
        tangent.normalize()

        reference = Vector((0, 1, 0))

        if abs(tangent.dot(reference)) > 0.95:
            reference = Vector((1, 0, 0))

        normal = tangent.cross(reference).normalized()
        other = tangent.cross(normal).normalized()

        vertices.extend(
            p + radius * (
                normal * math.cos(j * math.tau / sides)
                + other * math.sin(j * math.tau / sides)
            )
            for j in range(sides)
        )

    faces = [tuple(reversed(range(sides)))]

    for i in range(len(path) - 1):
        for j in range(sides):
            k = (j + 1) % sides
            faces.append((
                i * sides + j,
                i * sides + k,
                (i + 1) * sides + k,
                (i + 1) * sides + j,
            ))

    faces.append(tuple(
        (len(path) - 1) * sides + j
        for j in range(sides)
    ))

    builder.component(name, vertices, faces, slot)


CUP_PROFILE = (
    (0.154, 0.670),
    (0.181, 0.700),
    (0.214, 0.850),
    (0.233, 1.110),
    (0.242, 1.153),
    (0.237, 1.180),
)


def cup_radius(z):
    for (ra, za), (rb, zb) in zip(CUP_PROFILE, CUP_PROFILE[1:]):
        if za <= z <= zb:
            return ra + (rb - ra) * (z - za) / (zb - za)

    raise ValueError(("컵 표면 범위 초과", z))


def face_y(x, z):
    r = cup_radius(z)
    assert abs(x) < r
    return -math.sqrt(r * r - x * x)


def relief(builder, name, profile, slot, depth=0.012):
    start = len(builder.vertices)
    solid(builder, name, profile, 0, depth, slot)

    for i in range(start, len(builder.vertices)):
        x, y, z = builder.vertices[i]
        builder.vertices[i] = (
            x,
            face_y(x, z) - depth + y + 0.002,
            z,
        )


def radial_patch(builder, name, points, radius, slot, depth=0.009):
    n = len(points)
    vertices = [
        (r * math.sin(angle), -r * math.cos(angle), z)
        for r in (radius - 0.003, radius + depth)
        for angle, z in points
    ]
    faces = [
        tuple(reversed(range(n))),
        tuple(range(n, 2 * n)),
    ]
    faces.extend(
        (i, (i + 1) % n, (i + 1) % n + n, i + n)
        for i in range(n)
    )

    builder.component(name, vertices, faces, slot)


def add_base(builder):
    radial_solid(builder, "basalt-foot", (
        (0.285, -1.750),
        (0.310, -1.733),
        (0.310, -1.700),
        (0.283, -1.682),
    ), SLOTS["basalt"])

    radial_solid(builder, "base-bottom-wood", (
        (0.285, -1.721),
        (0.310, -1.704),
        (0.310, -1.658),
        (0.284, -1.641),
    ), SLOTS["wood"])

    radial_solid(builder, "woven-base-core", (
        (0.281, -1.666),
        (0.267, -1.630),
        (0.250, -1.457),
        (0.226, -1.414),
    ), SLOTS["bamboo"])

    for i in range(12):
        angle = i * math.tau / 12

        for direction in (-1, 1):
            radial_patch(builder, f"weave-{i}-{direction}", (
                (angle - 0.22 * direction - 0.045, -1.642),
                (angle - 0.22 * direction + 0.045, -1.642),
                (angle + 0.22 * direction + 0.045, -1.455),
                (angle + 0.22 * direction - 0.045, -1.455),
            ), 0.268, SLOTS["wood_light"], 0.008)

    for i in range(6):
        angle = i * math.tau / 6

        radial_patch(builder, f"turquoise-base-diamond-{i}", (
            (angle, -1.611),
            (angle + 0.115, -1.550),
            (angle, -1.489),
            (angle - 0.115, -1.550),
        ), 0.278, SLOTS["turquoise"], 0.007)

    radial_solid(builder, "base-top-wood", (
        (0.238, -1.452),
        (0.258, -1.433),
        (0.258, -1.389),
        (0.232, -1.370),
    ), SLOTS["wood"])


def add_bamboo(builder):
    radial_solid(builder, "bamboo-axis", (
        (0.098, -1.413),
        (0.105, -1.350),
        (0.094, -1.200),
        (0.089, -0.860),
        (0.097, -0.400),
        (0.091, -0.190),
        (0.088, 0.130),
        (0.096, 0.580),
        (0.100, 0.722),
    ), SLOTS["bamboo"], 12)

    for i, center_z in enumerate((-1.276, -0.344, 0.618)):
        for j, delta in enumerate((-0.025, 0.025)):
            z = center_z + delta

            radial_solid(builder, f"rope-{i}-{j}", (
                (0.107, z - 0.023),
                (0.121, z - 0.013),
                (0.121, z + 0.013),
                (0.107, z + 0.023),
            ), SLOTS["cream"], 12)

    radial_solid(builder, "cup-wood-seat", (
        (0.103, 0.650),
        (0.153, 0.671),
        (0.155, 0.707),
    ), SLOTS["wood"], 12)


def add_face(builder):
    for side in (-1, 1):
        center_x = side * 0.082
        path = []

        for i in range(7):
            angle = math.pi * (1 - i / 6)
            x = center_x + 0.045 * math.cos(angle)
            z = 1.009 + 0.033 * math.sin(angle)
            path.append((x, face_y(x, z) - 0.009, z))

        tube(
            builder,
            f"smiling-eye-{side}",
            path,
            0.012,
            SLOTS["cream"],
        )

        relief(builder, f"cheek-{side}", [
            (center_x - 0.023, 0.979),
            (center_x - 0.014, 0.990),
            (center_x + 0.014, 0.990),
            (center_x + 0.023, 0.979),
            (center_x + 0.011, 0.970),
            (center_x - 0.011, 0.970),
        ], SLOTS["bamboo"], 0.009)

    relief(builder, "mango-nose", [
        (-0.022, 1.061),
        (0.022, 1.061),
        (0.039, 0.938),
        (0.027, 0.925),
        (-0.027, 0.925),
        (-0.039, 0.938),
    ], SLOTS["mango"], 0.033)

    relief(builder, "smile-dark-inset", [
        (-0.126, 0.911),
        (-0.079, 0.885),
        (0, 0.875),
        (0.079, 0.885),
        (0.126, 0.911),
        (0.113, 0.854),
        (0.066, 0.819),
        (0, 0.810),
        (-0.066, 0.819),
        (-0.113, 0.854),
    ], SLOTS["wood_light"], 0.009)

    relief(builder, "cream-smile", [
        (-0.123, 0.915),
        (-0.073, 0.890),
        (0, 0.881),
        (0.073, 0.890),
        (0.123, 0.915),
        (0.110, 0.864),
        (0.062, 0.839),
        (0, 0.833),
        (-0.062, 0.839),
        (-0.110, 0.864),
    ], SLOTS["cream"], 0.017)

    for side in (-1, 1):
        x = side * 0.185

        for i, z in enumerate((1.080, 0.867)):
            relief(builder, f"tiki-chevron-{side}-{i}", [
                (x - side * 0.025, z + 0.043),
                (x + side * 0.016, z + 0.026),
                (x - side * 0.008, z - 0.043),
            ], SLOTS["turquoise"], 0.008)


def add_leaf(builder, side):
    profile = [
        (0.168, 0.980),
        (0.207, 1.055),
        (0.262, 1.044),
        (0.309, 0.985),
        (0.301, 0.910),
        (0.290, 0.821),
        (0.241, 0.860),
        (0.202, 0.923),
    ]
    profile = [
        (side * x, z + (0.025 if side > 0 else 0))
        for x, z in profile
    ]

    n, vertices = len(profile), []
    vertices.extend((x, -0.078, z) for x, z in profile)
    vertices.extend((x, -0.055, z) for x, z in profile)

    center_z = 0.965 + (0.025 if side > 0 else 0)
    vertices.extend((
        (side * 0.246, -0.117, center_z),
        (side * 0.246, -0.047, center_z),
    ))

    faces = []

    for i in range(n):
        j = (i + 1) % n
        faces.extend((
            (2 * n, i, j),
            (2 * n + 1, n + j, n + i),
            (i, n + i, n + j, j),
        ))

    builder.component(
        f"palm-leaf-{side}",
        vertices,
        faces,
        SLOTS["leaf"],
    )

    dz = 0.025 if side > 0 else 0

    tube(builder, f"leaf-rib-{side}", (
        (side * 0.179, -0.085, 0.985 + dz),
        (side * 0.246, -0.119, 0.965 + dz),
        (side * 0.287, -0.087, 0.845 + dz),
    ), 0.0045, SLOTS["rib"], 5)


def ellipsoid(builder, name, center, scale, slot):
    bm = bmesh.new()

    try:
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1)
        bm.verts.index_update()

        builder.component(
            name,
            [
                Vector(center) + Vector(tuple(
                    v.co[a] * scale[a] for a in range(3)
                ))
                for v in bm.verts
            ],
            [tuple(v.index for v in f.verts) for f in bm.faces],
            slot,
        )

    finally:
        bm.free()


def add_flower(builder):
    cx, cy, cz = 0.187, -0.158, 0.733

    for i in range(5):
        angle = math.pi / 2 + i * math.tau / 5
        radial = Vector((math.cos(angle), math.sin(angle)))
        tangent = Vector((-radial.y, radial.x))
        profile = []

        for along, across in (
            (0.009, -0.012),
            (0.039, -0.031),
            (0.067, -0.027),
            (0.078, -0.009),
            (0.076, 0.015),
            (0.052, 0.033),
            (0.027, 0.024),
            (0.009, 0.012),
        ):
            p = (
                Vector((cx, cz))
                + radial * along
                + tangent * across
            )
            profile.append(tuple(p))

        solid(
            builder,
            f"hibiscus-petal-{i}",
            profile,
            cy - 0.026 - i * 0.0005,
            cy + 0.002 - i * 0.0005,
            SLOTS["coral"],
        )

    ellipsoid(
        builder,
        "hibiscus-pink-heart",
        (cx, cy - 0.033, cz),
        (0.027, 0.013, 0.027),
        SLOTS["pink"],
    )

    tube(builder, "hibiscus-stamen", (
        (cx, cy - 0.042, cz),
        (cx + 0.022, cy - 0.059, cz + 0.044),
    ), 0.006, SLOTS["mango"])

    for i, (dx, dz) in enumerate((
        (0.014, 0.047),
        (0.027, 0.045),
        (0.024, 0.055),
    )):
        ellipsoid(
            builder,
            f"pollen-{i}",
            (cx + dx, cy - 0.061, cz + dz),
            (0.007, 0.006, 0.007),
            SLOTS["cream"],
        )


def add_lantern(builder):
    radial_solid(builder, "cup-upper-rim", (
        (0.237, 1.133),
        (0.260, 1.147),
        (0.260, 1.192),
        (0.239, 1.208),
    ), SLOTS["wood"])

    for x in (-0.194, 0.194):
        for y in (-0.194, 0.194):
            box(
                builder,
                f"lantern-corner-{x}-{y}",
                (x, y, 1.420),
                (0.036, 0.036, 0.460),
                SLOTS["wood"],
                0.006,
            )

    box(
        builder,
        "lantern-lid",
        (0, 0, 1.686),
        (0.478, 0.478, 0.128),
        SLOTS["wood"],
        0.018,
    )

    box(
        builder,
        "lid-light-wood-inlay",
        (0, 0, 1.742),
        (0.386, 0.386, 0.016),
        SLOTS["wood_light"],
        0.005,
    )


def triangle_hits_box(points, lower, upper):
    center, half = (lower + upper) / 2, (upper - lower) / 2
    points = [Vector(p) - center for p in points]
    edges = [
        points[(i + 1) % 3] - points[i]
        for i in range(3)
    ]
    axes = [
        Vector((1, 0, 0)),
        Vector((0, 1, 0)),
        Vector((0, 0, 1)),
    ]
    tests = axes + [edges[0].cross(edges[1])]
    tests.extend(
        edge.cross(axis)
        for edge in edges
        for axis in axes
    )

    for axis in tests:
        if axis.length_squared < 1e-20:
            continue

        projections = [axis.dot(p) for p in points]
        radius = sum(half[a] * abs(axis[a]) for a in range(3))

        if min(projections) > radius or max(projections) < -radius:
            return False

    return True


def assert_glass_empty(vertices, faces):
    vertices = [Vector(v) for v in vertices]

    for face in faces:
        assert not triangle_hits_box(
            [vertices[i] for i in face],
            GLASS_MIN,
            GLASS_MAX,
        ), ("유리 영역과 삼각형이 교차합니다.", face)

    # 표면 교차 없이 유리 영역 전체를 감싸는 닫힌 부품도 검출한다.
    solid_angle = 0.0

    for face in faces:
        a, b, c = [vertices[i] - GLASS_CENTER for i in face]
        numerator = a.dot(b.cross(c))
        denominator = (
            a.length * b.length * c.length
            + a.dot(b) * c.length
            + b.dot(c) * a.length
            + c.dot(a) * b.length
        )
        solid_angle += 2 * math.atan2(numerator, denominator)

    assert abs(solid_angle) < 1e-4, (
        "유리 중심이 닫힌 형상 안에 있습니다.",
        solid_angle,
    )


def make_mesh(builder):
    mesh = bpy.data.meshes.new(NAME)
    mesh.from_pydata(builder.vertices, [], builder.faces)
    mesh.update()
    assert not mesh.validate(verbose=False)

    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)
        bm.faces.ensure_lookup_table()

        part_layer = bm.faces.layers.int.new("part_id")
        slot_layer = bm.faces.layers.int.new("palette_slot")

        for f, p, s in zip(
            bm.faces,
            builder.face_parts,
            builder.slots,
            strict=True,
        ):
            f[part_layer], f[slot_layer] = p, s

        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bmesh.ops.triangulate(
            bm,
            faces=list(bm.faces),
            quad_method="BEAUTY",
            ngon_method="EAR_CLIP",
        )
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

        assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
        assert all(v.is_manifold for v in bm.verts)
        assert all(f.calc_area() > 1e-10 for f in bm.faces)

        remaining, parts_seen = set(bm.faces), set()

        while remaining:
            component = {remaining.pop()}
            pending = list(component)

            while pending:
                f = pending.pop()

                for e in f.edges:
                    for neighbor in e.link_faces:
                        if neighbor in remaining:
                            remaining.remove(neighbor)
                            component.add(neighbor)
                            pending.append(neighbor)

            ids = {f[part_layer] for f in component}
            assert len(ids) == 1 and not (ids & parts_seen)
            parts_seen.update(ids)

            volume = sum(
                f.verts[0].co.dot(
                    f.verts[1].co.cross(f.verts[2].co)
                ) / 6
                for f in component
            )
            assert abs(volume) > 1e-10, ids

            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(component))

        assert parts_seen == {p["id"] for p in builder.parts}
        bm.to_mesh(mesh)

    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()

    assert TRIANGLE_MIN <= len(mesh.loop_triangles) <= TRIANGLE_MAX, (
        len(mesh.loop_triangles)
    )

    lower, upper = bounds(v.co for v in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON, (lower[:], upper[:])
    assert ((lower + upper) / 2).length < EPSILON

    assert_glass_empty(
        [v.co for v in mesh.vertices],
        [tuple(f.vertices) for f in mesh.polygons],
    )

    return mesh


def build_geometry():
    builder = Builder()

    add_base(builder)
    add_bamboo(builder)
    radial_solid(builder, "tiki-cup", CUP_PROFILE, SLOTS["wood"])
    add_face(builder)
    add_leaf(builder, -1)
    add_leaf(builder, 1)
    add_flower(builder)
    add_lantern(builder)

    return make_mesh(builder), builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")
    slots = mesh.attributes["palette_slot"]
    part_ids = mesh.attributes["part_id"]
    used, part_counts = set(), Counter()

    for face in mesh.polygons:
        assert len(face.vertices) == 3
        face.use_smooth = False

        slot = slots.data[face.index].value
        part_counts[part_ids.data[face.index].value] += 1
        used.add(slot)

        for loop in face.loop_indices:
            uv.data[loop].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[loop].uv) == slot

    assert used == set(SLOTS.values())
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1 and mesh.materials[0].name == "palette"

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert obj.location.length == 0
    assert obj.rotation_euler.to_matrix().is_identity
    assert tuple(obj.scale) == (1, 1, 1)
    assert (obj.dimensions - TARGET).length < EPSILON
    assert len([
        o for o in bpy.context.scene.objects
        if o.type == "MESH"
    ]) == 1

    bamboo = next(
        p for p in builder.parts
        if p["name"] == "bamboo-axis"
    )
    lower, upper = bounds(
        mesh.vertices[i].co
        for i in range(
            bamboo["start"],
            bamboo["start"] + bamboo["count"],
        )
    )

    assert abs(lower.x + upper.x) < EPSILON
    assert abs(lower.y + upper.y) < EPSILON

    return obj, {
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "blender_dimensions": list(obj.dimensions),
        "bbox_center": [0, 0, 0],
        "glass_center_blender": list(GLASS_CENTER),
        "glass_size_blender": list(GLASS_SIZE),
        "glass_region_empty": True,
        "slots_used": sorted(used),
        "closed_components": len(builder.parts),
        "parts": [
            {
                "name": p["name"],
                "slot": p["slot"],
                "triangles": part_counts[p["id"]],
            }
            for p in builder.parts
        ],
    }


def to_yup(point):
    return Vector((point[0], point[2], -point[1]))


def from_yup(point):
    return Vector((point[0], -point[2], point[1]))


def triangle_key(slot, points):
    return slot, tuple(sorted(
        tuple(round(c, 6) for c in p)
        for p in points
    ))


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
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    count = accessor["count"]

    assert count > 0 and stride >= size
    assert start >= view.get("byteOffset", 0)
    assert (
        start + (count - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
        <= len(binary)
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(count)
    ]


def verify_glb(path, obj, metadata, colors):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (
        b"glTF",
        2,
        len(data),
    )

    offset, chunks = 12, {}

    while offset < len(data):
        assert offset + 8 <= len(data)

        size, kind = struct.unpack_from("<I4s", data, offset)
        assert size % 4 == 0
        assert offset + 8 + size <= len(data)
        assert kind not in chunks

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)
    assert set(chunks) == {b"JSON", b"BIN\x00"}

    doc, binary = json.loads(chunks[b"JSON"]), chunks[b"BIN\x00"]

    buffer, = doc["buffers"]
    assert "uri" not in buffer
    assert buffer["byteLength"] <= len(binary)

    mesh, = doc["meshes"]
    material, = doc["materials"]
    node, = doc["nodes"]
    scene, = doc["scenes"]

    assert scene["nodes"] == [0] and node["mesh"] == 0
    assert mesh["name"] == node["name"] == NAME
    assert "matrix" not in node and not node.get("children")
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert material["name"] == "palette"
    assert material.get("alphaMode", "OPAQUE") == "OPAQUE"

    primitive, = mesh["primitives"]
    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attrs = primitive["attributes"]
    assert set(attrs) == {"POSITION", "NORMAL", "TEXCOORD_0"}

    points = [
        Vector(p)
        for p in accessor_rows(doc, binary, attrs["POSITION"])
    ]
    normals = accessor_rows(doc, binary, attrs["NORMAL"])
    uvs = accessor_rows(doc, binary, attrs["TEXCOORD_0"])

    assert len(points) == len(normals) == len(uvs)
    assert all(abs(Vector(n).length - 1) < 1e-4 for n in normals)

    for uv in uvs:
        uv_slot(uv)

    indices = [
        r[0]
        for r in accessor_rows(doc, binary, primitive["indices"])
    ]
    assert len(indices) % 3 == 0

    actual, triangles = Counter(), []

    for start in range(0, len(indices), 3):
        ids = indices[start:start + 3]
        assert len(set(ids)) == 3
        assert min(ids) >= 0 and max(ids) < len(points)

        a, b, c = (points[i] for i in ids)
        normal = (b - a).cross(c - a)

        assert normal.length > 2e-10
        assert all(
            normal.dot(Vector(normals[i])) > 0
            for i in ids
        )

        slot = uv_slot(uvs[ids[0]])
        assert all(uv_slot(uvs[i]) == slot for i in ids)

        actual[triangle_key(slot, (a, b, c))] += 1
        triangles.append(ids)

    source, expected = obj.data, Counter()

    for f in source.polygons:
        slot = uv_slot(
            source.uv_layers.active.data[f.loop_start].uv
        )
        expected[triangle_key(
            slot,
            (
                to_yup(source.vertices[i].co)
                for i in f.vertices
            ),
        )] += 1

    assert actual == expected

    count = len(indices) // 3
    assert TRIANGLE_MIN <= count <= TRIANGLE_MAX
    assert count == len(source.loop_triangles)
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((0.62, 3.50, 0.62))
    ).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    assert (
        to_yup(metadata["front_blender"])
        - Vector((0, 0, 1))
    ).length < EPSILON

    assert_glass_empty(
        [from_yup(p) for p in points],
        triangles,
    )

    texture, = doc["textures"]
    image, = doc["images"]
    assert texture["source"] == 0

    pbr = material["pbrMetallicRoughness"]
    assert pbr["baseColorTexture"]["index"] == 0
    assert pbr.get(
        "baseColorFactor",
        [1, 1, 1, 1],
    ) == [1, 1, 1, 1]

    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = doc["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    assert palette_colors(
        binary[start:start + view["byteLength"]]
    ) == colors

    sampler = doc["samplers"][texture["sampler"]]
    assert sampler["magFilter"] == 9728
    assert sampler["minFilter"] in (9728, 9984)
    assert sampler["wrapS"] == sampler["wrapT"] == 33071

    return {
        **metadata,
        "file": str(path),
        "triangles": count,
        "glb_dimensions": list(upper - lower),
        "glb_bbox_center": list((lower + upper) / 2),
        "palette_rgb": {
            str(s): list(colors[s])
            for s in metadata["slots_used"]
        },
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
    assert result == {"FINISHED"} and path.is_file()

    return verify_glb(path, obj, metadata, colors)


def make_render_scene(obj, samples):
    scene = bpy.data.scenes.new(NAME + "-compare")
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

    world = bpy.data.worlds.new(NAME + "-world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        0.78, 0.76, 0.70, 1
    )
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.7
    scene.world = world

    clone = bpy.data.objects.new(NAME + "-preview", obj.data.copy())
    scene.collection.objects.link(clone)

    points = [v.co.copy() for v in clone.data.vertices]
    lower, upper = bounds(points)
    floor_z = lower.z - 0.012

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

    scene.collection.objects.link(
        bpy.data.objects.new("preview-floor", floor_mesh)
    )

    ground = bpy.data.materials.new("preview-ground")
    ground.use_nodes = True
    shader = ground.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (0.72, 0.59, 0.40, 1)
    shader.inputs["Roughness"].default_value = 1
    floor_mesh.materials.append(ground)

    for label, position, energy, size in (
        ("key", (-3, -4, 7), 900, 5),
        ("fill", (4, -1, 5), 500, 4),
        ("rim", (2, 4, 6), 700, 4),
    ):
        light = bpy.data.lights.new("preview-" + label, "AREA")
        light.energy = energy
        light.shape = "DISK"
        light.size = size

        lamp = bpy.data.objects.new("preview-" + label, light)
        scene.collection.objects.link(lamp)
        lamp.location = position
        lamp.rotation_euler = (
            -lamp.location
        ).to_track_quat("-Z", "Y").to_euler()

    cameras, scales = [], []
    pivot = (lower + upper) / 2

    for label, direction in (
        ("front", (0, -1, 0)),
        ("front-above-45", (0, -1, 1)),
    ):
        direction = Vector(direction).normalized()
        rotation = (-direction).to_track_quat("-Z", "Y")
        basis = rotation.to_matrix()

        lo, hi = bounds(
            basis.transposed() @ (p - pivot)
            for p in points
        )
        target = pivot + basis @ Vector((
            (lo.x + hi.x) / 2,
            (lo.y + hi.y) / 2,
            0,
        ))

        camera = bpy.data.objects.new(
            label,
            bpy.data.cameras.new(label),
        )
        scene.collection.objects.link(camera)

        camera.data.type = "ORTHO"
        camera.data.clip_start = 0.01
        camera.data.clip_end = 100
        camera.data.ortho_scale = 1
        camera.location = target + direction * 12
        camera.rotation_euler = rotation.to_euler()

        frame_lo, frame_hi = bounds(
            camera.data.view_frame(scene=scene)
        )
        scales.append(max(
            (hi.x - lo.x) / (frame_hi.x - frame_lo.x),
            (hi.y - lo.y) / (frame_hi.y - frame_lo.y),
        ) * 1.13)

        cameras.append(camera)

    for camera in cameras:
        camera.data.ortho_scale = max(scales)

    return scene, cameras


def combine_png(left, right, output):
    lw, lh, lc, lr, chunks = read_png(left.read_bytes())
    rw, rh, rc, rr, _ = read_png(right.read_bytes())

    assert (lw, lh, lc) == (PANEL_WIDTH, PANEL_HEIGHT, 4)
    assert (rw, rh, rc) == (PANEL_WIDTH, PANEL_HEIGHT, 4)

    data = bytearray(b"\x89PNG\r\n\x1a\n")
    data.extend(png_chunk(
        b"IHDR",
        struct.pack(">IIBBBBB", lw + rw, lh, 8, 6, 0, 0, 0),
    ))

    for kind, payload in chunks:
        if kind in (b"gAMA", b"cHRM", b"sRGB", b"iCCP"):
            data.extend(png_chunk(kind, payload))

    raw = b"".join(
        b"\x00" + a + b
        for a, b in zip(lr, rr, strict=True)
    )
    data.extend(png_chunk(b"IDAT", zlib.compress(raw, 6)))
    data.extend(png_chunk(b"IEND", b""))
    output.write_bytes(data)

    assert read_png(output.read_bytes())[:3] == (
        2 * PANEL_WIDTH,
        PANEL_HEIGHT,
        4,
    )


def render_comparison(obj, samples):
    scene, cameras = make_render_scene(obj, samples)
    output = OUTPUT / (NAME + ".png")

    with tempfile.TemporaryDirectory(
        prefix="lampPost-preview-",
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
            assert result == {"FINISHED"} and path.is_file()
            paths.append(path)

        combine_png(paths[0], paths[1], output)

    return {
        "file": str(output),
        "panel_order": ["front", "front_above_45"],
        "view_directions": [[0, -1, 0], [0, -1, 1]],
        "dimensions": [2 * PANEL_WIDTH, PANEL_HEIGHT],
        "same_orthographic_scale": True,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")
    parser.add_argument("--samples", type=int, default=32)

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    if args.samples < 1:
        parser.error("--samples는 양수여야 합니다.")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = NAME + "-export"

    material, colors = load_palette()
    mesh, builder = build_geometry()
    obj, metadata = finish_object(mesh, builder, material)

    OUTPUT.mkdir(parents=True, exist_ok=True)

    result = export_glb(obj, metadata, colors)
    result["comparison"] = (
        None
        if args.skip_render
        else render_comparison(obj, args.samples)
    )

    print(json.dumps(
        result,
        ensure_ascii=False,
        allow_nan=False,
    ))


if __name__ == "__main__":
    main()
