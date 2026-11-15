"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/waterfallJungle.py
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
from mathutils.geometry import tessellate_polygon


ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/props"

NAME = "waterfallJungle"
TARGET = Vector((2.80, 2.60, 1.90))
TRIANGLE_MIN = 1200
TRIANGLE_MAX = 3500
EPSILON = 1e-5
PANEL_WIDTH = 1000
PANEL_HEIGHT = 1100

SLOTS = {
    "basalt": 5,
    "leaf": 9,
    "rib": 12,
    "flower": 10,
    "pollen": 18,
}
ALLOWED_SLOTS = frozenset(SLOTS.values())

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

MONSTERA_SIDE = [
    (0, 0),
    (0.18, -0.03),
    (0.38, 0.02),
    (0.51, 0.10),
    (0.57, 0.23),
    (0.54, 0.31),
    (0.23, 0.28),
    (0.19, 0.33),
    (0.59, 0.42),
    (0.63, 0.52),
    (0.60, 0.63),
    (0.53, 0.67),
    (0.21, 0.51),
    (0.18, 0.56),
    (0.52, 0.79),
    (0.46, 0.91),
    (0.37, 0.99),
    (0.16, 0.78),
    (0.13, 0.83),
    (0.28, 1.10),
    (0.15, 1.20),
    (0, 1.28),
]


def bounds(points):
    points = list(points)
    if not points:
        raise RuntimeError("빈 형상입니다.")

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
        offset += size + 12

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
    raw = zlib.decompress(b"".join(
        payload for kind, payload in chunks if kind == b"IDAT"
    ))
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
    shader.inputs["Roughness"].default_value = 0.83
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
    assert slot in ALLOWED_SLOTS
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7

    return slot


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.face_parts = []
        self.parts = []

    def component(self, name, vertices, faces, slot):
        assert name not in {part["name"] for part in self.parts}
        assert slot in ALLOWED_SLOTS

        first = len(self.vertices)
        part_id = len(self.parts) + 1
        vertices = [tuple(point) for point in vertices]

        assert all(
            math.isfinite(coordinate)
            for point in vertices
            for coordinate in point
        )

        self.vertices.extend(vertices)
        self.parts.append({
            "id": part_id,
            "name": name,
            "slot": slot,
            "start": first,
            "count": len(vertices),
        })

        for face in faces:
            assert len(face) >= 3
            assert len(face) == len(set(face))
            assert all(0 <= index < len(vertices) for index in face)

            self.faces.append(tuple(first + index for index in face))
            self.slots.append(slot)
            self.face_parts.append(part_id)

    def fit(self):
        lower, upper = bounds(self.vertices)
        center = (lower + upper) / 2
        factor = Vector(tuple(
            TARGET[axis] / (upper[axis] - lower[axis])
            for axis in range(3)
        ))

        self.vertices = [
            tuple(
                (Vector(point) - center)[axis] * factor[axis]
                for axis in range(3)
            )
            for point in self.vertices
        ]


def rings_faces(count, layers):
    faces = [tuple(reversed(range(count)))]

    faces.extend(
        (
            row * count + i,
            row * count + (i + 1) % count,
            (row + 1) * count + (i + 1) % count,
            (row + 1) * count + i,
        )
        for row in range(layers - 1)
        for i in range(count)
    )
    faces.append(tuple(
        (layers - 1) * count + i for i in range(count)
    ))

    return faces


def add_rock(builder, name, center, size, phase):
    center = Vector(center)
    size = Vector(size)
    count = 9
    outline = []

    for i in range(count):
        angle = math.tau * i / count + phase
        jitter = 1 + 0.07 * math.sin(i * 2.7 + phase)
        outline.append(Vector((
            0.5 * size.x * math.cos(angle) * jitter,
            0.5 * size.y * math.sin(angle) * jitter,
            0,
        )))

    levels = (
        (0.78, 0.0),
        (1.00, 0.15),
        (0.94, 0.73),
        (0.64, 1.00),
    )
    vertices = [
        tuple(center + Vector((
            point.x * radius,
            point.y * radius,
            height * size.z,
        )))
        for radius, height in levels
        for point in outline
    ]

    bm = bmesh.new()

    try:
        bm_vertices = [bm.verts.new(point) for point in vertices]

        for face in rings_faces(count, len(levels)):
            bm.faces.new([bm_vertices[i] for i in face])

        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=0.025,
            segments=1,
            affect="EDGES",
            profile=0.5,
        )
        bm.verts.index_update()

        builder.component(
            name,
            [tuple(vertex.co) for vertex in bm.verts],
            [
                tuple(vertex.index for vertex in face.verts)
                for face in bm.faces
            ],
            SLOTS["basalt"],
        )

    finally:
        bm.free()

    outer = [
        0.77 + 0.14 * (0.5 + 0.5 * math.sin(i * 2.3 + phase))
        for i in range(count)
    ]

    top = [
        center + Vector((
            point.x * 0.64,
            point.y * 0.64,
            size.z + 0.016,
        ))
        for point in outline
    ] + [
        center + Vector((
            point.x * radius,
            point.y * radius,
            size.z * (1 - (radius - 0.64) / 0.30 * 0.27) + 0.014,
        ))
        for point, radius in zip(outline, outer, strict=True)
    ]

    vertices = (
        [tuple(point) for point in top]
        + [tuple(point - Vector((0, 0, 0.040))) for point in top]
    )
    faces = [tuple(reversed(range(count)))]

    for i in range(count):
        following = (i + 1) % count
        faces.extend((
            (i, following, count + following, count + i),
            (
                2 * count + following,
                2 * count + i,
                3 * count + i,
                3 * count + following,
            ),
            (
                count + i,
                count + following,
                3 * count + following,
                3 * count + i,
            ),
        ))

    faces.append(tuple(2 * count + i for i in range(count)))

    builder.component(
        "moss-" + name,
        vertices,
        faces,
        SLOTS["leaf"],
    )


def tube(builder, name, points, radius, slot, sides=5):
    points = [Vector(point) for point in points]
    assert len(points) >= 2 and radius > 0

    vertices = []
    previous = None

    for row, point in enumerate(points):
        tangent = (
            points[min(row + 1, len(points) - 1)]
            - points[max(0, row - 1)]
        )
        assert tangent.length > 1e-8
        tangent.normalize()

        if previous is None:
            reference = (
                Vector((1, 0, 0))
                if abs(tangent.x) < 0.85
                else Vector((0, 1, 0))
            )
            across = tangent.cross(reference).normalized()
        else:
            across = (
                previous - tangent * previous.dot(tangent)
            ).normalized()

        other = tangent.cross(across).normalized()
        previous = across

        for i in range(sides):
            angle = math.tau * i / sides
            vertices.append(tuple(
                point
                + radius * (
                    across * math.cos(angle)
                    + other * math.sin(angle)
                )
            ))

    builder.component(
        name,
        vertices,
        rings_faces(sides, len(points)),
        slot,
    )


def frame(direction, normal=(0, -1, 0)):
    along = Vector(direction).normalized()
    normal = Vector(normal)
    normal = (normal - along * normal.dot(along)).normalized()
    across = along.cross(normal).normalized()

    return across, along, normal


def leaf_shell(builder, name, outline, mapper, thickness, slot):
    planar = [Vector((x, y, 0)) for x, y in outline]

    # Blender 5.3은 삼각형의 정점 인덱스를 반환한다.
    triangles = [
        tuple(triangle)
        for triangle in tessellate_polygon([planar])
    ]
    count = len(planar)
    assert len(triangles) == count - 2

    top = [Vector(mapper(x, y)) for x, y in outline]
    vertices = (
        [tuple(point) for point in top]
        + [tuple(point - thickness) for point in top]
    )

    faces = list(triangles)
    faces.extend(
        tuple(count + i for i in reversed(triangle))
        for triangle in triangles
    )
    faces.extend(
        (
            i,
            (i + 1) % count,
            (i + 1) % count + count,
            i + count,
        )
        for i in range(count)
    )

    builder.component(name, vertices, faces, slot)


def monstera(
    builder,
    name,
    base,
    direction,
    length,
    width,
    normal=(0, -1, 0),
):
    base = Vector(base)
    across, along, normal = frame(direction, normal)

    def surface(x, t):
        return (
            base
            + across * x * width / 1.26
            + along * t * length / 1.28
            + normal * (
                0.065 * math.sin(math.pi * t / 1.28)
                + 0.022 * (x / 0.63) ** 2
            )
        )

    outline = MONSTERA_SIDE + [
        (-x, t) for x, t in reversed(MONSTERA_SIDE[1:-1])
    ]

    leaf_shell(
        builder,
        name,
        outline,
        surface,
        normal * 0.025,
        SLOTS["leaf"],
    )

    tube(
        builder,
        name + "-midrib",
        [
            surface(0, t) + normal * 0.006
            for t in (0, 0.30, 0.62, 0.95, 1.24)
        ],
        0.010,
        SLOTS["rib"],
        5,
    )

    for i, (start, finish, x) in enumerate((
        (0.19, 0.20, 0.44),
        (0.42, 0.49, 0.49),
        (0.69, 0.85, 0.37),
    )):
        for sign in (-1, 1):
            tube(
                builder,
                f"{name}-rib-{i}-{sign}",
                [
                    surface(0, start) + normal * 0.004,
                    surface(sign * x, finish) + normal * 0.004,
                ],
                0.006,
                SLOTS["rib"],
                4,
            )

    tube(
        builder,
        name + "-stem",
        [base - along * 0.16, base + along * 0.05],
        0.018,
        SLOTS["leaf"],
        5,
    )


def fern(builder, name, base, direction, length):
    base = Vector(base)
    across, along, normal = frame(direction, (0, -1, 0.45))

    def spine(t):
        return (
            base
            + along * length * t
            + normal * (0.07 * math.sin(math.pi * t))
        )

    tube(
        builder,
        name + "-stem",
        [spine(t) for t in (0, 0.25, 0.5, 0.75, 1)],
        0.012,
        SLOTS["rib"],
        5,
    )

    shape = [
        (0, 0),
        (0.25, -0.14),
        (0.68, -0.12),
        (1, 0),
        (0.79, 0.13),
        (0.40, 0.16),
        (0.10, 0.07),
    ]

    for row, t in enumerate((0.19, 0.35, 0.51, 0.67, 0.82)):
        span = length * (0.32 - 0.18 * t)

        for sign in (-1, 1):
            start = spine(t)
            axis = (across * sign + along * 0.38).normalized()
            cross = normal.cross(axis).normalized()

            def mapper(x, y):
                return (
                    start
                    + axis * x * span
                    + cross * y * length
                    + normal * (0.026 * math.sin(math.pi * x))
                )

            leaf_shell(
                builder,
                f"{name}-pinna-{row}-{sign}",
                shape,
                mapper,
                normal * 0.018,
                SLOTS["leaf"],
            )


def pebble(builder, name, center, radius, slot):
    bm = bmesh.new()

    try:
        bmesh.ops.create_icosphere(
            bm,
            subdivisions=1,
            radius=radius,
        )

        for vertex in bm.verts:
            vertex.co += Vector(center)

        bm.verts.index_update()

        builder.component(
            name,
            [tuple(vertex.co) for vertex in bm.verts],
            [
                tuple(vertex.index for vertex in face.verts)
                for face in bm.faces
            ],
            slot,
        )

    finally:
        bm.free()


def flower(builder, name, center, radius, rotation=0):
    center = Vector(center)
    across, along, normal = frame((0, 0.24, 1), (0, -1, 0.3))

    tube(
        builder,
        name + "-flower-stem",
        [
            center + Vector((0, 0.28, -0.12)),
            center + normal * 0.03,
        ],
        0.030,
        SLOTS["leaf"],
        5,
    )

    profile = [
        (0.02, -0.02),
        (0.25, -0.30),
        (0.70, -0.49),
        (0.99, -0.32),
        (1.08, -0.04),
        (0.99, 0.28),
        (0.72, 0.46),
        (0.30, 0.29),
    ]

    for i in range(5):
        angle = rotation + math.tau * i / 5
        radial = across * math.cos(angle) + along * math.sin(angle)
        tangent = -across * math.sin(angle) + along * math.cos(angle)

        def mapper(x, y):
            return (
                center
                + radial * radius * x
                + tangent * radius * y
                + normal * (
                    0.025
                    + 0.055 * x * x
                    + 0.045 * (y / 0.49) ** 2
                )
            )

        leaf_shell(
            builder,
            f"{name}-petal-{i}",
            profile,
            mapper,
            normal * 0.035,
            SLOTS["flower"],
        )

    pebble(
        builder,
        name + "-throat",
        center + normal * 0.045,
        radius * 0.22,
        SLOTS["pollen"],
    )

    tip = (
        center
        + normal * 0.22
        + along * 0.15
        + across * 0.045
    )

    tube(
        builder,
        name + "-stamen",
        [
            center + normal * 0.035,
            (center + tip) / 2 + along * 0.01,
            tip,
        ],
        0.018,
        SLOTS["pollen"],
        6,
    )

    for i in range(4):
        angle = i * math.tau / 4
        pebble(
            builder,
            f"{name}-pollen-{i}",
            (
                tip
                + across * (0.026 * math.cos(angle))
                + along * (0.026 * math.sin(angle))
            ),
            0.024,
            SLOTS["pollen"],
        )


def compose():
    builder = Builder()

    for name, center, size, phase in (
        (
            "rock-left",
            (-0.50, 0.12, 0),
            (1.65, 1.55, 0.98),
            0.11,
        ),
        (
            "rock-right",
            (0.62, 0.25, 0),
            (1.38, 1.48, 0.92),
            0.32,
        ),
        (
            "rock-crown",
            (0.20, 0.58, 0.69),
            (1.60, 1.45, 0.84),
            0.23,
        ),
        (
            "rock-front",
            (0.05, -0.60, 0),
            (1.26, 0.98, 0.66),
            0.41,
        ),
    ):
        add_rock(builder, name, center, size, phase)

    monstera(
        builder,
        "monstera-left",
        (-0.38, 0.17, 1.17),
        (-0.55, 0.05, 0.84),
        1.00,
        0.98,
    )
    monstera(
        builder,
        "monstera-crown",
        (0.18, 0.47, 1.35),
        (0.68, 0.04, 0.73),
        0.84,
        0.82,
        (0.12, -1, 0.25),
    )
    monstera(
        builder,
        "monstera-right",
        (0.64, -0.40, 0.56),
        (0.50, -0.06, 0.86),
        0.89,
        0.88,
    )

    fern(
        builder,
        "fern-left",
        (-0.70, -0.15, 0.55),
        (-0.75, -0.04, 0.66),
        0.88,
    )
    fern(
        builder,
        "fern-back",
        (0.59, 0.69, 1.09),
        (0.45, 0.40, 0.76),
        0.65,
    )

    flower(
        builder,
        "hibiscus-left",
        (-0.68, -0.76, 0.72),
        0.28,
        0.18,
    )
    flower(
        builder,
        "hibiscus-front",
        (-0.17, -0.91, 0.48),
        0.24,
        -0.15,
    )

    builder.fit()
    return builder


def build_geometry():
    builder = compose()
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
        volumes = []

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

            assert len({
                face[part_layer] for face in component
            }) == 1

            volume = sum(
                face.verts[0].co.dot(
                    face.verts[1].co.cross(face.verts[2].co)
                ) / 6
                for face in component
            )
            assert abs(volume) > 1e-10

            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(component))

            volumes.append(abs(volume))

        assert len(volumes) == len(builder.parts)
        bm.to_mesh(mesh)

    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()

    assert TRIANGLE_MIN <= len(mesh.loop_triangles) <= TRIANGLE_MAX

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return mesh, builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")

    slots = mesh.attributes["palette_slot"]
    parts = mesh.attributes["part_id"]
    names = {part["id"]: part["name"] for part in builder.parts}

    used = set()
    triangles_by_part = Counter()

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False

        slot = slots.data[polygon.index].value
        name = names[parts.data[polygon.index].value]
        used.add(slot)
        triangles_by_part[name] += 1

        for index in polygon.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert used == ALLOWED_SLOTS
    assert 3 not in used
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"

    assert sum(
        part["name"].startswith("rock-") for part in builder.parts
    ) == 4
    assert sum(
        part["name"] in (
            "monstera-left",
            "monstera-crown",
            "monstera-right",
        )
        for part in builder.parts
    ) == 3
    assert sum(
        part["name"].endswith("-petal-0") for part in builder.parts
    ) == 2

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    support = [
        polygon
        for polygon in mesh.polygons
        if all(
            abs(mesh.vertices[index].co.z - lower.z) < EPSILON
            for index in polygon.vertices
        )
    ]
    support_area = sum(polygon.area for polygon in support)

    assert support_area > 0.8
    assert all(polygon.normal.z < -0.99 for polygon in support)

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert obj.location.length == 0
    assert obj.rotation_euler.to_matrix().is_identity
    assert tuple(obj.scale) == (1, 1, 1)
    assert (obj.dimensions - TARGET).length < EPSILON
    assert [
        item for item in bpy.context.scene.objects
        if item.type == "MESH"
    ] == [obj]

    return obj, {
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "bbox_center": list((lower + upper) / 2),
        "blender_dimensions": list(upper - lower),
        "slots_used": sorted(used),
        "closed_components": len(builder.parts),
        "flat_support_area": support_area,
        "water": False,
        "part_triangles": dict(sorted(triangles_by_part.items())),
    }


def to_yup(point):
    return Vector((point.x, point.z, -point.y))


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
        all(math.isfinite(value) for value in point)
        for point in points
    )
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
    assert TRIANGLE_MIN <= triangles <= TRIANGLE_MAX
    assert triangles == len(source.loop_triangles)
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]
    assert 3 not in metadata["slots_used"]

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((2.80, 1.90, 2.60))
    ).length < EPSILON
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
    assert pbr.get("baseColorFactor", [1, 1, 1, 1]) == [1, 1, 1, 1]
    assert pbr.get("metallicFactor", 1) == 0

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

    lower, upper = bounds(vertex.co for vertex in clone.data.vertices)
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

    points = [vertex.co.copy() for vertex in clone.data.vertices]
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
