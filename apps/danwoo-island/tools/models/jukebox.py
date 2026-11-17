"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/jukebox.py
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


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "jukebox"

NAME = "jukebox"
TARGET = Vector((2.68, 1.85, 3.36))
ARCH_SLOTS = (3, 10, 18)
EPSILON = 1e-5
PANEL_WIDTH = 1000
PANEL_HEIGHT = 1100

SLOTS = {
    "wood": 14,
    "trim": 1,
    "wood_light": 11,
    "button": 23,
    "basalt": 5,
    "panel": 1,
    "leaf": 9,
    "rib": 12,
    "flower": 17,
    "glass": 6,
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


def bounds(points):
    points = list(points)
    if not points:
        raise RuntimeError("Empty geometry")

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

    (
        width,
        height,
        depth,
        color,
        compression,
        filtering,
        interlace,
    ) = struct.unpack(">IIBBBBB", chunks[0][1])

    assert width > 0 and height > 0
    assert (depth, compression, filtering, interlace) == (8, 0, 0, 0)
    assert color in (2, 6)

    channels = 3 if color == 2 else 4
    stride = width * channels
    raw = zlib.decompress(b"".join(
        payload for kind, payload in chunks
        if kind == b"IDAT"
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
                predictor = (
                    left, above, corner,
                )[distances.index(min(distances))]

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
    glass_target = (85, 99, 111)
    glass_slot = min(
        (slot for slot in range(32) if slot not in ARCH_SLOTS),
        key=lambda slot: sum(
            (colors[slot][channel] - glass_target[channel]) ** 2
            for channel in range(3)
        ),
    )

    assert glass_slot not in ARCH_SLOTS
    assert glass_slot == 6
    assert colors[glass_slot][2] >= colors[glass_slot][0]
    SLOTS["glass"] = glass_slot

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
    shader.inputs["Roughness"].default_value = 0.80
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
    assert slot in set(SLOTS.values()) | set(ARCH_SLOTS)
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
        assert name not in [part["name"] for part in self.parts]
        assert 0 <= slot < 32
        assert (slot in ARCH_SLOTS) == name.startswith("arch-tube-")

        first = len(self.vertices)
        part_id = len(self.parts) + 1

        self.vertices.extend(tuple(point) for point in vertices)
        self.parts.append({
            "id": part_id,
            "name": name,
            "slot": slot,
            "start": first,
            "count": len(vertices),
        })

        for face in faces:
            assert len(face) >= 3
            assert len(set(face)) == len(face)

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


def solid(builder, name, profile, front, back, slot, bevel=0.0):
    assert front < back
    profile = [Vector((x, z)) for x, z in profile]

    lower, upper = bounds((point.x, 0, point.y) for point in profile)
    center = Vector((
        (lower.x + upper.x) / 2,
        (lower.z + upper.z) / 2,
    ))

    if bevel:
        span = upper - lower
        assert 2 * bevel < min(span.x, span.z, back - front)

        inset = [
            center + Vector((
                (point.x - center.x) * (1 - 2 * bevel / span.x),
                (point.y - center.y) * (1 - 2 * bevel / span.z),
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

    for layer in range(len(layers) - 1):
        for index in range(count):
            following = (index + 1) % count
            faces.append((
                layer * count + index,
                layer * count + following,
                (layer + 1) * count + following,
                (layer + 1) * count + index,
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


def beam(builder, name, start, end, width, depth, slot):
    start = Vector(start)
    end = Vector(end)
    axis = end - start
    assert axis.length > 0

    center = (start + end) / 2
    rotation = axis.to_track_quat("Z", "Y").to_matrix()
    first = len(builder.vertices)

    box(
        builder,
        name,
        (0, 0, 0),
        (width, depth, axis.length),
        slot,
        min(width, depth) * 0.18,
    )

    for index in range(first, len(builder.vertices)):
        builder.vertices[index] = tuple(
            rotation @ Vector(builder.vertices[index]) + center
        )


def ellipse(builder, name, center, radii, depth, slot, segments=20):
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


def arch_tube(builder, slot, radius, width, depth):
    center_z = 2.01
    foot_z = 1.78
    y = -0.76

    path = [(
        Vector((-radius, y, foot_z)),
        Vector((-1, 0, 0)),
    )]

    for index in range(21):
        angle = math.pi * (1 - index / 20)
        normal = Vector((math.cos(angle), 0, math.sin(angle)))
        path.append((
            Vector((
                radius * normal.x,
                y,
                center_z + radius * normal.z,
            )),
            normal,
        ))

    path.append((
        Vector((radius, y, foot_z)),
        Vector((1, 0, 0)),
    ))

    vertices = []

    for point, normal in path:
        for index in range(8):
            angle = index * math.tau / 8
            vertices.append(tuple(
                point
                + normal * (width / 2 * math.cos(angle))
                + Vector((0, depth / 2 * math.sin(angle), 0))
            ))

    faces = [tuple(reversed(range(8)))]

    for row in range(len(path) - 1):
        for index in range(8):
            following = (index + 1) % 8
            faces.append((
                row * 8 + index,
                row * 8 + following,
                (row + 1) * 8 + following,
                (row + 1) * 8 + index,
            ))

    faces.append(tuple(
        (len(path) - 1) * 8 + index
        for index in range(8)
    ))

    builder.component(
        "arch-tube-" + str(slot),
        vertices,
        faces,
        slot,
    )


def add_leaf(builder, side):
    suffix = "left" if side < 0 else "right"
    points = [
        (-0.88, 0.66),
        (-0.94, 0.78),
        (-0.94, 1.19),
        (-0.77, 1.32),
        (-0.53, 1.29),
        (-0.31, 1.12),
        (-0.40, 1.03),
        (-0.65, 1.15),
        (-0.48, 0.94),
        (-0.59, 0.85),
        (-0.78, 1.06),
        (-0.68, 0.80),
        (-0.79, 0.69),
        (-0.88, 0.96),
    ]

    def mirror(x, z):
        return x * (-side), z + (-0.025 if side > 0 else 0)

    solid(
        builder,
        "palm-leaf-" + suffix,
        [mirror(x, z) for x, z in points],
        -0.783,
        -0.757,
        SLOTS["leaf"],
    )

    for index, (start, end) in enumerate((
        ((-0.88, 1.17), (-0.68, 1.18)),
        ((-0.68, 1.18), (-0.43, 1.08)),
        ((-0.88, 1.17), (-0.81, 0.91)),
    )):
        start_x, start_z = mirror(*start)
        end_x, end_z = mirror(*end)

        beam(
            builder,
            "leaf-rib-" + suffix + "-" + str(index),
            (start_x, -0.800, start_z),
            (end_x, -0.800, end_z),
            0.016,
            0.014,
            SLOTS["rib"],
        )


def add_flower(builder):
    center_x = 0.0
    center_z = 0.70
    petal = [
        (0.025, -0.025),
        (0.12, -0.12),
        (0.27, -0.155),
        (0.35, -0.08),
        (0.325, 0),
        (0.35, 0.08),
        (0.27, 0.155),
        (0.12, 0.12),
        (0.025, 0.025),
    ]

    for index in range(5):
        angle = -math.pi / 2 + index * math.tau / 5
        radial = Vector((math.cos(angle), math.sin(angle)))
        tangent = Vector((-radial.y, radial.x))
        profile = []

        for along, across in petal:
            point = (
                Vector((center_x, center_z))
                + radial * along
                + tangent * across
            )
            profile.append(tuple(point))

        solid(
            builder,
            "hibiscus-petal-" + str(index),
            profile,
            -0.833 - index * 0.001,
            -0.805 - index * 0.001,
            SLOTS["flower"],
        )

    ellipse(
        builder,
        "hibiscus-center",
        (center_x, -0.854, center_z),
        (0.082, 0.077),
        0.028,
        SLOTS["trim"],
        12,
    )
    beam(
        builder,
        "hibiscus-stamen",
        (0, -0.880, 0.70),
        (0.17, -0.880, 1.035),
        0.031,
        0.027,
        SLOTS["trim"],
    )

    for index, (x, z) in enumerate((
        (0.135, 1.025),
        (0.185, 1.04),
        (0.16, 1.085),
    )):
        ellipse(
            builder,
            "hibiscus-pollen-" + str(index),
            (x, -0.902, z),
            (0.037, 0.034),
            0.025,
            SLOTS["trim"],
            8,
        )


def build_geometry():
    builder = Builder()
    radius = 1.275
    center_z = 2.01

    outline = [
        (-radius, 0.22),
        (radius, 0.22),
        (radius, center_z),
    ]
    outline += [
        (
            radius * math.cos(index * math.pi / 20),
            center_z + radius * math.sin(index * math.pi / 20),
        )
        for index in range(1, 21)
    ]
    solid(
        builder, "wood-body", outline,
        -0.64, 0.94, SLOTS["wood"], 0.035,
    )

    for x in (-1.035, 1.035):
        for y in (-0.43, 0.64):
            box(
                builder,
                f"foot-{x}-{y}",
                (x, y, 0.135),
                (0.34, 0.39, 0.27),
                SLOTS["basalt"],
                0.045,
            )

    box(
        builder, "wood-base",
        (0, -0.01, 0.27), (2.58, 1.75, 0.25),
        SLOTS["wood"], 0.055,
    )
    box(
        builder, "front-panel",
        (0, -0.690, 0.87), (1.96, 0.12, 1.10),
        SLOTS["panel"], 0.025,
    )

    for x in (-1.035, 1.035):
        box(
            builder, "front-pillar-" + str(x),
            (x, -0.715, 0.99), (0.18, 0.25, 1.40),
            SLOTS["trim"], 0.026,
        )
        box(
            builder, "frame-foot-" + str(x),
            (x, -0.75, 0.34), (0.30, 0.31, 0.14),
            SLOTS["trim"], 0.028,
        )
        box(
            builder, "arch-collar-" + str(x),
            (x, -0.755, 1.745), (0.55, 0.37, 0.20),
            SLOTS["trim"], 0.035,
        )
        box(
            builder, "outer-wood-post-" + str(x),
            (x * 1.183, -0.57, 0.99), (0.18, 0.26, 1.42),
            SLOTS["wood"], 0.035,
        )

    for label, z in (("bottom", 0.355), ("top", 1.405)):
        box(
            builder, "panel-frame-" + label,
            (0, -0.765, z), (1.95, 0.20, 0.105),
            SLOTS["trim"], 0.020,
        )

    box(
        builder, "control-band",
        (0, -0.685, 1.565), (2.00, 0.17, 0.36),
        SLOTS["wood"], 0.023,
    )

    for index, x in enumerate((-0.64, -0.405, -0.17, 0.065)):
        box(
            builder, "button-" + str(index),
            (x, -0.823, 1.57), (0.185, 0.13, 0.155),
            SLOTS["button"], 0.023,
        )

    box(
        builder, "coin-plate",
        (0.58, -0.818, 1.565), (0.235, 0.095, 0.30),
        SLOTS["wood_light"], 0.025,
    )
    box(
        builder, "coin-slot",
        (0.58, -0.870, 1.565), (0.039, 0.018, 0.19),
        SLOTS["basalt"], 0.004,
    )

    window_radius = 0.827
    window = [
        (-window_radius, 1.80),
        (window_radius, 1.80),
        (window_radius, center_z),
    ]
    window += [
        (
            window_radius * math.cos(index * math.pi / 20),
            center_z + window_radius * math.sin(index * math.pi / 20),
        )
        for index in range(1, 21)
    ]
    solid(
        builder, "glass-window", window,
        -0.734, -0.662, SLOTS["glass"], 0.012,
    )
    box(
        builder, "window-sill",
        (0, -0.750, 1.805), (1.76, 0.12, 0.055),
        SLOTS["wood_light"], 0.012,
    )

    ellipse(
        builder, "record",
        (0, -0.782, 1.969), (0.425, 0.105),
        0.045, SLOTS["basalt"], 24,
    )
    ellipse(
        builder, "record-label",
        (0, -0.812, 1.979), (0.130, 0.036),
        0.013, SLOTS["flower"], 16,
    )
    box(
        builder, "record-spindle",
        (0, -0.828, 2.016), (0.044, 0.036, 0.054),
        SLOTS["basalt"], 0.007,
    )
    box(
        builder, "tonearm-pivot",
        (0.53, -0.786, 2.07), (0.115, 0.095, 0.105),
        SLOTS["wood_light"], 0.012,
    )
    beam(
        builder, "tonearm",
        (0.53, -0.836, 2.09), (0.28, -0.836, 1.99),
        0.048, 0.052, SLOTS["trim"],
    )
    box(
        builder, "tonearm-head",
        (0.265, -0.849, 1.978), (0.085, 0.071, 0.068),
        SLOTS["button"], 0.012,
    )

    for slot, tube_radius, width in (
        (3, 1.245, 0.16),
        (10, 1.08, 0.17),
        (18, 0.915, 0.16),
    ):
        arch_tube(builder, slot, tube_radius, width, 0.23)

    for index, x in enumerate((-0.088, 0.088)):
        box(
            builder, "crown-keystone-" + str(index),
            (x, -0.785, 3.12), (0.170, 0.36, 0.53),
            SLOTS["trim"], 0.027,
        )

    add_leaf(builder, -1)
    add_leaf(builder, 1)
    add_flower(builder)
    builder.fit()

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

    assert 1500 <= len(mesh.loop_triangles) <= 4000

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return mesh, builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")

    slot_attribute = mesh.attributes["palette_slot"]
    part_attribute = mesh.attributes["part_id"]
    part_names = {
        part["id"]: part["name"]
        for part in builder.parts
    }

    body = builder.parts[0]
    assert body["name"] == "wood-body"

    lower, upper = bounds(
        mesh.vertices[index].co
        for index in range(body["start"], body["start"] + body["count"])
    )
    body_middle = (lower.z + upper.z) / 2

    used = set()
    arch_audit = {}

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False

        slot = slot_attribute.data[polygon.index].value
        part = part_names[part_attribute.data[polygon.index].value]
        assert (slot in ARCH_SLOTS) == part.startswith("arch-tube-")

        if slot in ARCH_SLOTS:
            assert part == "arch-tube-" + str(slot)

            minimum = min(
                mesh.vertices[index].co.z
                for index in polygon.vertices
            )
            assert minimum > body_middle + EPSILON

            record = arch_audit.setdefault(slot, {
                "slot": slot,
                "part": part,
                "triangles": 0,
                "min_z": float("inf"),
            })
            record["triangles"] += 1
            record["min_z"] = min(record["min_z"], minimum)

        used.add(slot)

        for index in polygon.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert set(arch_audit) == set(ARCH_SLOTS)
    assert used == set(SLOTS.values()) | set(ARCH_SLOTS)
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert obj.location.length == 0
    assert obj.rotation_euler.to_matrix().is_identity
    assert tuple(obj.scale) == (1, 1, 1)

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return obj, {
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "bbox_center": list((lower + upper) / 2),
        "blender_dimensions": list(upper - lower),
        "arch_slots": list(ARCH_SLOTS),
        "slots_used": sorted(used),
        "glass_slot": SLOTS["glass"],
        "body_middle_z": body_middle,
        "arch_audit": [
            arch_audit[slot] for slot in ARCH_SLOTS
        ],
        "closed_components": len(builder.parts),
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
        struct.unpack_from(fmt, binary, start + index * stride)
        for index in range(count)
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

        if slot in ARCH_SLOTS:
            assert min(
                points[index].y for index in ids
            ) > metadata["body_middle_z"] + EPSILON

        actual[triangle_key(slot, (a, b, c))] += 1

    expected = Counter()
    source = obj.data

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
    assert sorted({
        key[0] for key in actual
    }) == metadata["slots_used"]

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((2.68, 3.36, 1.85))
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
        prefix="jukebox-preview-",
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
