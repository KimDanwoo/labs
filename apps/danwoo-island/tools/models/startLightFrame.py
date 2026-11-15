"""
Blender 5.3

실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/startLightFrame.py

기본 실행은 startLightFrame.glb와 정면/정면 위 45도 비교 PNG를 생성한다.
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

NAME = "startLightFrame"
TARGET = Vector((5.60, 1.60, 2.80))
EPSILON = 1e-5
PANEL_WIDTH = 1200
PANEL_HEIGHT = 900

# Y 전체에 걸친 금지 영역: X 최소/최대, Z 최소/최대.
OPENING = (-1.95, 1.95, -1.20, 0.30)

SLOTS = {
    "bamboo": 1,
    "cream": 23,
    "coral": 10,
    "teal": 3,
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
    3: (61, 187, 231),
    5: (74, 65, 60),
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
    if not points:
        raise RuntimeError("빈 형상입니다.")

    return (
        Vector(tuple(min(point[axis] for point in points) for axis in range(3))),
        Vector(tuple(max(point[axis] for point in points) for axis in range(3))),
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

    chunks = []
    offset = 8
    ended = False

    while offset < len(data):
        assert offset + 12 <= len(data)

        size, kind = struct.unpack_from(">I4s", data, offset)
        assert offset + size + 12 <= len(data)

        payload = data[offset + 8:offset + 8 + size]
        crc = struct.unpack_from(">I", data, offset + 8 + size)[0]
        assert zlib.crc32(kind + payload) & 0xFFFFFFFF == crc

        chunks.append((kind, payload))
        offset += 12 + size

        if kind == b"IEND":
            assert size == 0 and offset == len(data)
            ended = True
            break

    assert ended and chunks[0][0] == b"IHDR"

    width, height, depth, color, compression, filtering, interlace = (
        struct.unpack(">IIBBBBB", chunks[0][1])
    )
    assert width > 0 and height > 0
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
                predictor = (left, above, corner)[
                    distances.index(min(distances))
                ]

            row[x] = (row[x] + predictor) & 255

        rows.append(bytes(row))
        previous = row

    return width, height, channels, rows, chunks


def palette_colors(data):
    width, height, channels, rows, _ = read_png(data)
    assert (width, height) == (128, 4)

    colors = []

    for slot in range(32):
        offset = (slot * 4 + 2) * channels
        colors.append(tuple(rows[2][offset:offset + 3]))

        if channels == 4:
            assert rows[2][offset + 3] == 255

    return colors


def load_palette():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3이 필요합니다.")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("--disable-autoexec 옵션으로 실행하세요.")

    if not PALETTE.is_file():
        raise FileNotFoundError(PALETTE)

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

    nodes = material.node_tree.nodes
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

    links = material.node_tree.links
    links.new(uv.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    nodes.active = texture

    return material, colors


def uv_slot(value):
    u, v = value
    assert math.isfinite(u) and math.isfinite(v)

    slot = round(u * 32 - 0.5)
    assert slot in set(SLOTS.values())
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7

    return slot


def opening_clearance(points):
    lower, upper = bounds(points)
    x0, x1, z0, z1 = OPENING

    # 부품 전체의 AABB를 분리하므로 면과 내부 체적까지 금지 영역에서 제외된다.
    return max(
        x0 - upper.x,
        lower.x - x1,
        z0 - upper.z,
        lower.z - z1,
    )


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.face_parts = []
        self.parts = []

    def component(self, name, vertices, faces, slot, face_slots=None):
        vertices = [tuple(point) for point in vertices]
        faces = [tuple(face) for face in faces]

        assert name not in {part["name"] for part in self.parts}
        clearance = opening_clearance(vertices)
        assert clearance > EPSILON, (name, clearance)

        assigned = (
            [slot] * len(faces)
            if face_slots is None
            else list(face_slots)
        )
        assert len(assigned) == len(faces)
        assert set(assigned) <= set(SLOTS.values())

        first = len(self.vertices)
        part_id = len(self.parts) + 1

        self.vertices.extend(vertices)
        self.parts.append({
            "id": part_id,
            "name": name,
            "start": first,
            "count": len(vertices),
            "clearance": clearance,
        })

        for face, face_slot in zip(faces, assigned, strict=True):
            assert len(face) >= 3
            assert len(set(face)) == len(face)
            assert min(face) >= 0
            assert max(face) < len(vertices)

            self.faces.append(tuple(first + index for index in face))
            self.slots.append(face_slot)
            self.face_parts.append(part_id)


def solid(builder, name, profile, front, back, slot, bevel=0.0):
    assert front < back

    profile = [Vector(point) for point in profile]
    lower = Vector((
        min(point.x for point in profile),
        min(point.y for point in profile),
    ))
    upper = Vector((
        max(point.x for point in profile),
        max(point.y for point in profile),
    ))
    center = (lower + upper) / 2
    span = upper - lower

    if bevel:
        assert 0 < 2 * bevel < min(span.x, span.y, back - front)

        inset = [
            center + Vector((
                (point.x - center.x) * (1 - 2 * bevel / span.x),
                (point.y - center.y) * (1 - 2 * bevel / span.y),
            ))
            for point in profile
        ]
        layers = (
            (inset, front),
            (profile, front + bevel),
            (profile, back - bevel),
            (inset, back),
        )
    else:
        layers = ((profile, front), (profile, back))

    vertices = [
        (point.x, y, point.y)
        for ring, y in layers
        for point in ring
    ]
    count = len(profile)
    faces = [tuple(reversed(range(count)))]

    for row in range(len(layers) - 1):
        for index in range(count):
            following = (index + 1) % count
            faces.append((
                row * count + index,
                row * count + following,
                (row + 1) * count + following,
                (row + 1) * count + index,
            ))

    faces.append(tuple(
        (len(layers) - 1) * count + index
        for index in range(count)
    ))

    builder.component(name, vertices, faces, slot)


def box(builder, name, center, size, slot, bevel=0.025):
    center = Vector(center)
    size = Vector(size)
    assert min(size) > 0

    bm = bmesh.new()

    try:
        bmesh.ops.create_cube(bm, size=1.0)

        for vertex in bm.verts:
            vertex.co = Vector(tuple(
                vertex.co[axis] * size[axis]
                for axis in range(3)
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

        vertices = [tuple(vertex.co + center) for vertex in bm.verts]
        faces = [
            tuple(vertex.index for vertex in face.verts)
            for face in bm.faces
        ]
        builder.component(name, vertices, faces, slot)

    finally:
        bm.free()


def lathe(
    builder,
    name,
    start,
    end,
    rings,
    slot,
    segments=10,
    cap_slots=None,
):
    start = Vector(start)
    end = Vector(end)
    assert (end - start).length > 0

    axis = (end - start).normalized()
    assert abs(rings[0][0]) < EPSILON
    assert abs(rings[-1][0] - (end - start).length) < EPSILON

    seed = (
        Vector((1, 0, 0))
        if abs(axis.x) < 0.8
        else Vector((0, 1, 0))
    )
    u = (seed - axis * seed.dot(axis)).normalized()
    v = axis.cross(u).normalized()

    vertices = []

    for distance, radius in rings:
        for index in range(segments):
            angle = index * math.tau / segments
            vertices.append(tuple(
                start
                + axis * distance
                + radius * (
                    u * math.cos(angle)
                    + v * math.sin(angle)
                )
            ))

    faces = [tuple(reversed(range(segments)))]
    slots = [cap_slots[0] if cap_slots else slot]

    for row in range(len(rings) - 1):
        for index in range(segments):
            following = (index + 1) % segments
            faces.append((
                row * segments + index,
                row * segments + following,
                (row + 1) * segments + following,
                (row + 1) * segments + index,
            ))
            slots.append(slot)

    faces.append(tuple(
        (len(rings) - 1) * segments + index
        for index in range(segments)
    ))
    slots.append(cap_slots[1] if cap_slots else slot)

    builder.component(name, vertices, faces, slot, slots)


def tube(
    builder,
    name,
    path,
    radius,
    slot,
    segments=6,
    closed=False,
):
    path = [Vector(point) for point in path]
    assert len(path) >= 3
    assert radius > 0

    vertices = []

    for row, point in enumerate(path):
        if closed:
            tangent = (
                path[(row + 1) % len(path)]
                - path[(row - 1) % len(path)]
            )
        elif row == 0:
            tangent = path[1] - point
        elif row == len(path) - 1:
            tangent = point - path[row - 1]
        else:
            tangent = path[row + 1] - path[row - 1]

        assert tangent.length > 1e-8
        basis = tangent.to_track_quat("Z", "Y").to_matrix()

        for index in range(segments):
            angle = index * math.tau / segments
            vertices.append(tuple(
                point + basis @ Vector((
                    radius * math.cos(angle),
                    radius * math.sin(angle),
                    0,
                ))
            ))

    faces = []
    row_count = len(path) if closed else len(path) - 1

    for row in range(row_count):
        following_row = (row + 1) % len(path)

        for index in range(segments):
            following = (index + 1) % segments
            faces.append((
                row * segments + index,
                row * segments + following,
                following_row * segments + following,
                following_row * segments + index,
            ))

    if not closed:
        faces.extend((
            tuple(reversed(range(segments))),
            tuple(
                (len(path) - 1) * segments + index
                for index in range(segments)
            ),
        ))

    builder.component(name, vertices, faces, slot)


def ellipse(
    builder,
    name,
    center,
    radii,
    depth,
    slot,
    segments=8,
):
    x, y, z = center
    rx, rz = radii

    profile = [
        (
            x + rx * math.cos(index * math.tau / segments),
            z + rz * math.sin(index * math.tau / segments),
        )
        for index in range(segments)
    ]
    solid(
        builder,
        name,
        profile,
        y - depth / 2,
        y + depth / 2,
        slot,
    )


def clip_convex(subject, boundary):
    result = [Vector(point) for point in subject]
    boundary = [Vector(point) for point in boundary]

    for a, b in zip(
        boundary,
        boundary[1:] + boundary[:1],
        strict=True,
    ):
        edge = b - a

        def distance(point):
            relative = point - a
            return edge.x * relative.y - edge.y * relative.x

        previous_result = result
        result = []

        if not previous_result:
            break

        for previous, current in zip(
            previous_result[-1:] + previous_result[:-1],
            previous_result,
            strict=True,
        ):
            dp = distance(previous)
            dc = distance(current)

            if (dp >= 0) != (dc >= 0):
                result.append(
                    previous
                    + (current - previous) * (dp / (dp - dc))
                )

            if dc >= 0:
                result.append(current)

    unique = []

    for point in result:
        if not unique or (point - unique[-1]).length > 1e-8:
            unique.append(point)

    if len(unique) > 1 and (unique[0] - unique[-1]).length < 1e-8:
        unique.pop()

    assert len(unique) >= 3
    return [tuple(point) for point in unique]


def flower(builder, name, center, radius, slot, core_slot):
    x, y, z = center
    petal = [
        (0.06, -0.07),
        (0.42, -0.31),
        (0.84, -0.40),
        (1.00, -0.16),
        (0.94, 0.00),
        (1.00, 0.16),
        (0.84, 0.40),
        (0.42, 0.31),
        (0.06, 0.07),
    ]

    for index in range(5):
        angle = math.pi / 2 + index * math.tau / 5
        radial = Vector((math.cos(angle), math.sin(angle)))
        tangent = Vector((-radial.y, radial.x))

        profile = [
            tuple(
                Vector((x, z))
                + radius * (radial * along + tangent * across)
            )
            for along, across in petal
        ]
        solid(
            builder,
            f"{name}-petal-{index}",
            profile,
            y - 0.014 - index * 0.0007,
            y + 0.014 - index * 0.0007,
            slot,
        )

    ellipse(
        builder,
        name + "-core",
        (x, y - 0.028, z),
        (radius * 0.21, radius * 0.21),
        0.022,
        core_slot,
    )
    tube(
        builder,
        name + "-stamen",
        [
            (x, y - 0.042, z),
            (
                x + radius * 0.17,
                y - 0.050,
                z + radius * 0.30,
            ),
            (
                x + radius * 0.34,
                y - 0.061,
                z + radius * 0.55,
            ),
        ],
        radius * 0.045,
        SLOTS["cream"],
        segments=5,
    )
    ellipse(
        builder,
        name + "-pollen",
        (
            x + radius * 0.34,
            y - 0.067,
            z + radius * 0.55,
        ),
        (radius * 0.09, radius * 0.08),
        0.017,
        SLOTS["mango"],
        segments=6,
    )


def add_board(builder, side):
    label = "left" if side < 0 else "right"
    shape = [
        (0.00, 0.84),
        (-0.13, 0.69),
        (-0.235, 0.37),
        (-0.30, -0.04),
        (-0.30, -0.38),
        (-0.23, -0.65),
        (-0.10, -0.81),
        (0.00, -0.84),
        (0.10, -0.81),
        (0.23, -0.65),
        (0.30, -0.38),
        (0.30, -0.04),
        (0.235, 0.37),
        (0.13, 0.69),
    ]
    cream = [(x * 0.84, z * 0.955) for x, z in shape]

    def placed(profile):
        return [
            (side * (2.50 + x), z - 0.35)
            for x, z in profile
        ]

    solid(
        builder,
        "board-rail-" + label,
        placed(shape),
        -0.340,
        -0.140,
        SLOTS["teal"],
        bevel=0.032,
    )
    solid(
        builder,
        "board-cream-" + label,
        placed(cream),
        -0.378,
        -0.310,
        SLOTS["cream"],
        bevel=0.010,
    )

    for index, (slope, intercept, width, slot) in enumerate((
        (0.45, 0.30, 0.15, SLOTS["coral"]),
        (0.70, -0.10, 0.20, SLOTS["teal"]),
    )):
        stripe = [
            (-1, -slope + intercept - width / 2),
            (1, slope + intercept - width / 2),
            (1, slope + intercept + width / 2),
            (-1, -slope + intercept + width / 2),
        ]
        profile = clip_convex(stripe, cream)

        solid(
            builder,
            f"board-stripe-{label}-{index}",
            placed(profile),
            -0.392,
            -0.374,
            slot,
        )

    flower(
        builder,
        "board-flower-" + label,
        (side * 2.50, -0.414, -0.865),
        0.208,
        SLOTS["mango"],
        SLOTS["cream"],
    )

    for index, z in enumerate((-0.18, -1.075)):
        box(
            builder,
            f"board-strap-{label}-{index}",
            (side * 2.50, -0.28, z),
            (0.55, 0.35, 0.105),
            SLOTS["bamboo"],
            bevel=0.020,
        )

        x = side * 2.725
        lathe(
            builder,
            f"strap-peg-{label}-{index}",
            (x, -0.471, z),
            (x, -0.439, z),
            [
                (0.000, 0.020),
                (0.006, 0.026),
                (0.026, 0.026),
                (0.032, 0.020),
            ],
            SLOTS["basalt"],
            segments=6,
        )


def add_lashing(builder, x, label):
    template = [
        (-0.235, -0.140, 0.835),
        (-0.185, -0.265, 0.790),
        (0.170, -0.265, 0.425),
        (0.220, -0.140, 0.355),
        (0.220, 0.140, 0.355),
        (0.170, 0.235, 0.425),
        (-0.185, 0.235, 0.790),
        (-0.235, 0.140, 0.835),
    ]

    for diagonal in (-1, 1):
        for strand in (-1, 1):
            path = [
                (
                    x + diagonal * px + strand * 0.025,
                    py - (0.018 if diagonal > 0 else 0),
                    pz,
                )
                for px, py, pz in template
            ]

            tube(
                builder,
                f"rope-{label}-{diagonal}-{strand}",
                path,
                0.027,
                SLOTS["cream"],
                segments=6,
                closed=True,
            )


def add_palms(builder):
    root = Vector((0, 0.79))
    tips = [
        (-1.10, 0.92),
        (-0.84, 1.20),
        (-0.34, 1.40),
        (0.34, 1.40),
        (0.84, 1.20),
        (1.10, 0.92),
    ]
    edge_steps = [
        (0.00, 0.07),
        (0.20, 0.65),
        (0.38, 1.00),
        (0.42, 0.48),
        (0.58, 0.90),
        (0.62, 0.43),
        (0.77, 0.64),
        (0.81, 0.27),
        (0.92, 0.27),
    ]

    for index, tip in enumerate(tips):
        tip = Vector(tip)
        axis = tip - root
        tangent = Vector((-axis.y, axis.x)).normalized()
        width = 0.115 if index in (1, 4) else 0.100

        first = [
            root + axis * t + tangent * width * weight
            for t, weight in edge_steps
        ]
        last = [
            root + axis * t - tangent * width * weight
            for t, weight in reversed(edge_steps)
        ]
        profile = (
            [tuple(point) for point in first]
            + [tuple(tip)]
            + [tuple(point) for point in last]
        )

        front = -0.105 + abs(index - 2.5) * 0.018

        solid(
            builder,
            f"palm-frond-{index}",
            profile,
            front,
            front + 0.040,
            SLOTS["leaf"],
        )
        tube(
            builder,
            f"palm-rib-{index}",
            [
                (root.x, front - 0.010, root.y),
                (
                    root.x + axis.x * 0.51,
                    front - 0.012,
                    root.y + axis.y * 0.51,
                ),
                (
                    root.x + axis.x * 0.93,
                    front - 0.010,
                    root.y + axis.y * 0.93,
                ),
            ],
            0.009,
            SLOTS["rib"],
            segments=5,
        )

    flower(
        builder,
        "crown-hibiscus",
        (0, -0.265, 0.975),
        0.265,
        SLOTS["coral"],
        SLOTS["pink"],
    )


def build_geometry():
    builder = Builder()
    bamboo = SLOTS["bamboo"]
    caps = (SLOTS["wood"], SLOTS["wood_light"])

    beam_rings = [
        (0.000, 0.133),
        (0.035, 0.169),
        (0.075, 0.174),
        (0.940, 0.172),
        (0.990, 0.190),
        (1.055, 0.190),
        (1.100, 0.172),
        (2.730, 0.172),
        (2.780, 0.190),
        (2.840, 0.190),
        (2.890, 0.172),
        (4.500, 0.172),
        (4.550, 0.190),
        (4.615, 0.190),
        (4.660, 0.172),
        (5.525, 0.174),
        (5.565, 0.169),
        (5.600, 0.133),
    ]
    lathe(
        builder,
        "bamboo-crossbeam",
        (-2.8, 0, 0.57),
        (2.8, 0, 0.57),
        beam_rings,
        bamboo,
        segments=8,
        cap_slots=caps,
    )

    post_rings = [
        (0.000, 0.143),
        (0.035, 0.170),
        (0.070, 0.172),
        (0.660, 0.169),
        (0.700, 0.190),
        (0.755, 0.190),
        (0.800, 0.170),
        (1.470, 0.170),
        (1.510, 0.190),
        (1.560, 0.190),
        (1.600, 0.170),
        (2.240, 0.174),
        (2.280, 0.170),
        (2.310, 0.139),
    ]

    for side in (-1, 1):
        label = "left" if side < 0 else "right"
        x = side * 2.16

        lathe(
            builder,
            "bamboo-post-" + label,
            (x, 0, -1.40),
            (x, 0, 0.91),
            post_rings,
            bamboo,
            segments=8,
            cap_slots=caps,
        )
        box(
            builder,
            "cream-foot-" + label,
            (x, 0, -1.32),
            (0.50, 1.60, 0.16),
            SLOTS["cream"],
            bevel=0.034,
        )
        box(
            builder,
            "teal-foot-collar-" + label,
            (x, 0, -1.205),
            (0.38, 1.40, 0.070),
            SLOTS["teal"],
            bevel=0.014,
        )

        add_lashing(builder, x, label)
        add_board(builder, side)

    add_palms(builder)

    # 전체 재스케일은 개구부 좌표를 바꾸므로 설계 좌표 자체를 검사한다.
    lower, upper = bounds(builder.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    mesh = bpy.data.meshes.new(NAME)
    mesh.from_pydata(builder.vertices, [], builder.faces)
    mesh.update()
    assert not mesh.validate(verbose=False)

    bm = bmesh.new()
    volumes = []

    try:
        bm.from_mesh(mesh)
        bm.faces.ensure_lookup_table()

        part_layer = bm.faces.layers.int.new("part_id")
        slot_layer = bm.faces.layers.int.new("palette_slot")

        for face, part, slot in zip(
            bm.faces,
            builder.face_parts,
            builder.slots,
            strict=True,
        ):
            face[part_layer] = part
            face[slot_layer] = slot

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
                face = pending.pop()

                for edge in face.edges:
                    for neighbor in edge.link_faces:
                        if neighbor in remaining:
                            remaining.remove(neighbor)
                            component.add(neighbor)
                            pending.append(neighbor)

            part_ids = {face[part_layer] for face in component}
            assert len(part_ids) == 1

            assert opening_clearance(
                vertex.co
                for face in component
                for vertex in face.verts
            ) > EPSILON

            volume = sum(
                face.verts[0].co.dot(
                    face.verts[1].co.cross(face.verts[2].co)
                ) / 6
                for face in component
            )
            assert abs(volume) > 1e-10, part_ids

            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(component))

            volumes.append(abs(volume))

        assert len(volumes) == len(builder.parts)
        bm.to_mesh(mesh)

    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()

    assert 1500 <= len(mesh.loop_triangles) <= 4000
    assert len(mesh.loop_triangles) == 3806

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return mesh, builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")

    slot_attribute = mesh.attributes["palette_slot"]
    part_attribute = mesh.attributes["part_id"]
    used = set()
    audits = {}

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False

        slot = slot_attribute.data[polygon.index].value
        part_id = part_attribute.data[polygon.index].value
        assert 1 <= part_id <= len(builder.parts)

        used.add(slot)
        audits[part_id] = audits.get(part_id, 0) + 1

        assert opening_clearance(
            mesh.vertices[index].co
            for index in polygon.vertices
        ) > EPSILON

        for index in polygon.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert used == set(SLOTS.values())
    assert len(audits) == len(builder.parts)
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert obj.location.length == 0
    assert obj.rotation_euler.to_matrix().is_identity
    assert tuple(obj.scale) == (1, 1, 1)
    assert (obj.dimensions - TARGET).length < EPSILON

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return obj, {
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "bbox_center": list((lower + upper) / 2),
        "blender_dimensions": list(upper - lower),
        "opening_blender_xz": list(OPENING),
        "opening_through_all_y": True,
        "opening_min_clearance": min(
            part["clearance"] for part in builder.parts
        ),
        "slots_used": sorted(used),
        "closed_components": len(builder.parts),
        "part_audit": [
            {
                "name": part["name"],
                "triangles": audits[part["id"]],
                "opening_clearance": part["clearance"],
            }
            for part in builder.parts
        ],
    }


def to_yup(point):
    return Vector((point.x, point.z, -point.y))


def to_blender(point):
    return Vector((point.x, -point.z, point.y))


def triangle_key(slot, points):
    return slot, tuple(sorted(
        tuple(round(coordinate, 6) for coordinate in point)
        for point in points
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
        struct.unpack_from(fmt, binary, start + row * stride)
        for row in range(count)
    ]


def verify_glb(path, obj, metadata, colors):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (
        b"glTF", 2, len(data),
    )

    offset = 12
    chunks = {}

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

    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    buffer, = document["buffers"]
    assert "uri" not in buffer
    assert buffer["byteLength"] <= len(binary)

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]
    scene, = document["scenes"]

    assert scene["nodes"] == [0]
    assert mesh["name"] == node["name"] == NAME
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert not node.get("children")
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert not document.get("animations")
    assert not document.get("skins")
    assert not document.get("cameras")

    assert material["name"] == "palette"
    assert material.get("alphaMode", "OPAQUE") == "OPAQUE"

    primitive, = mesh["primitives"]
    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]
    assert set(attributes) == {
        "POSITION", "NORMAL", "TEXCOORD_0",
    }

    points = [
        Vector(point)
        for point in accessor_rows(
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
    assert all(
        abs(Vector(normal).length - 1) < 1e-4
        for normal in normals
    )

    for uv in uvs:
        uv_slot(uv)

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"],
        )
    ]
    assert len(indices) % 3 == 0

    actual = Counter()
    exported_clearances = []

    for start in range(0, len(indices), 3):
        ids = indices[start:start + 3]

        assert len(set(ids)) == 3
        assert min(ids) >= 0
        assert max(ids) < len(points)

        a, b, c = (points[index] for index in ids)
        normal = (b - a).cross(c - a)

        assert normal.length > 2e-10
        assert all(
            normal.dot(Vector(normals[index])) > 0
            for index in ids
        )

        slot = uv_slot(uvs[ids[0]])
        assert all(uv_slot(uvs[index]) == slot for index in ids)

        clearance = opening_clearance(
            to_blender(points[index])
            for index in ids
        )
        assert clearance > EPSILON
        exported_clearances.append(clearance)

        actual[triangle_key(slot, (a, b, c))] += 1

    source = obj.data
    expected = Counter()

    for face in source.polygons:
        slot = uv_slot(
            source.uv_layers.active.data[face.loop_start].uv
        )
        expected[triangle_key(
            slot,
            (
                to_yup(source.vertices[index].co)
                for index in face.vertices
            ),
        )] += 1

    assert actual == expected

    triangles = len(indices) // 3
    assert 1500 <= triangles <= 4000
    assert triangles == len(source.loop_triangles)
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]

    lower, upper = bounds(points)
    yup_target = Vector((TARGET.x, TARGET.z, TARGET.y))

    assert (upper - lower - yup_target).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    assert (
        to_yup(Vector(metadata["front_blender"]))
        - Vector((0, 0, 1))
    ).length < EPSILON

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0

    pbr = material["pbrMetallicRoughness"]
    assert pbr["baseColorTexture"]["index"] == 0
    assert pbr.get(
        "baseColorFactor", [1, 1, 1, 1],
    ) == [1, 1, 1, 1]

    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]
    assert palette_colors(png) == colors

    sampler = document["samplers"][texture["sampler"]]
    assert sampler["magFilter"] == 9728
    assert sampler["minFilter"] in (9728, 9984)
    assert sampler["wrapS"] == sampler["wrapT"] == 33071

    return {
        "file": str(path),
        "triangles": triangles,
        "glb_dimensions": list(upper - lower),
        "glb_bbox_center": list((lower + upper) / 2),
        "glb_opening_min_triangle_clearance": min(exported_clearances),
        "palette_rgb": {
            str(slot): "#" + "".join(
                f"{channel:02X}" for channel in colors[slot]
            )
            for slot in metadata["slots_used"]
        },
        **metadata,
    }


def export_glb(obj, metadata, colors):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    assert [
        item for item in bpy.context.scene.objects
        if item.type == "MESH"
    ] == [obj]

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
    assert result == {"FINISHED"}
    assert path.is_file()

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
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.78, 0.76, 0.70, 1)
    background.inputs["Strength"].default_value = 0.7
    scene.world = world

    clone = bpy.data.objects.new(NAME + "-preview", obj.data.copy())
    scene.collection.objects.link(clone)

    lower, upper = bounds(
        vertex.co for vertex in clone.data.vertices
    )
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

    floor = bpy.data.objects.new("preview-floor", floor_mesh)
    scene.collection.objects.link(floor)

    ground = bpy.data.materials.new("preview-ground")
    ground.use_nodes = True
    shader = ground.node_tree.nodes.get("Principled BSDF")
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

    points = [
        vertex.co.copy()
        for vertex in clone.data.vertices
    ]
    pivot = (lower + upper) / 2
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
        camera.data.clip_end = 100
        camera.data.ortho_scale = 1
        camera.location = target + direction * 12
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

    assert abs(
        cameras[0].data.ortho_scale
        - cameras[1].data.ortho_scale
    ) < EPSILON

    return scene, cameras


def combine_png(left, right, output):
    left_width, left_height, left_channels, left_rows, left_chunks = (
        read_png(left.read_bytes())
    )
    right_width, right_height, right_channels, right_rows, _ = (
        read_png(right.read_bytes())
    )

    assert (
        left_width, left_height, left_channels,
    ) == (PANEL_WIDTH, PANEL_HEIGHT, 4)
    assert (
        right_width, right_height, right_channels,
    ) == (PANEL_WIDTH, PANEL_HEIGHT, 4)

    data = bytearray(b"\x89PNG\r\n\x1a\n")
    data.extend(png_chunk(
        b"IHDR",
        struct.pack(
            ">IIBBBBB",
            left_width + right_width,
            left_height,
            8, 6, 0, 0, 0,
        ),
    ))

    for kind, payload in left_chunks:
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

    width, height, channels, _, _ = read_png(output.read_bytes())
    assert (width, height, channels) == (
        2 * PANEL_WIDTH, PANEL_HEIGHT, 4,
    )


def render_comparison(obj, samples):
    scene, cameras = make_render_scene(obj, samples)
    output = OUTPUT / (NAME + ".png")

    with tempfile.TemporaryDirectory(
        prefix=NAME + "-preview-",
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
            assert path.is_file()
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
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1

    material, colors = load_palette()
    mesh, builder = build_geometry()
    obj, metadata = finish_object(mesh, builder, material)

    OUTPUT.mkdir(parents=True, exist_ok=True)

    result = export_glb(obj, metadata, colors)
    result["comparison"] = (
        render_comparison(obj, args.samples)
        if not args.skip_render
        else None
    )

    print(json.dumps(
        result,
        ensure_ascii=False,
        allow_nan=False,
    ))


if __name__ == "__main__":
    main()
