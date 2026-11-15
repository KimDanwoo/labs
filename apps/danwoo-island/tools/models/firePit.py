"""
Blender 5.3

실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/firePit.py

출력:
  codex-work/props/firePit.glb
  codex-work/props/firePit.png
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

NAME = "firePit"
TARGET = Vector((1.00, 0.70, 0.55))
EPSILON = 1e-5
PANEL_WIDTH = 1000
PANEL_HEIGHT = 900
EMISSION_STRENGTH = 1.6

SLOTS = {
    "sand": 1,
    "cream": 23,
    "coral": 10,
    "teal": 3,
    "mango": 18,
    "green": 9,
    "vein": 12,
    "wood": 14,
    "wood_light": 11,
    "basalt": 5,
    "pink": 17,
}
USED_SLOTS = {1, 5, 10, 14, 18}
GLOW_SLOTS = {10, 18}
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
    assert points, "Empty geometry"
    return (
        Vector(tuple(min(p[axis] for p in points) for axis in range(3))),
        Vector(tuple(max(p[axis] for p in points) for axis in range(3))),
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


def rgba_png(width, height, rows):
    assert len(rows) == height
    assert all(len(row) == width * 4 for row in rows)
    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(
            b"IHDR",
            struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0),
        )
        + png_chunk(
            b"IDAT",
            zlib.compress(b"".join(b"\x00" + row for row in rows), 6),
        )
        + png_chunk(b"IEND", b"")
    )


def emission_png(colors):
    # 추가 재질 없이 숯의 두 칸만 발광하도록 같은 UV의 발광 아틀라스를 쓴다.
    row = b"".join(
        bytes((
            *(colors[x // 4] if x // 4 in GLOW_SLOTS else (0, 0, 0)),
            255,
        ))
        for x in range(128)
    )
    return rgba_png(128, 4, [row] * 4)


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

    data = emission_png(colors)
    emission = bpy.data.images.new("firePit-emission", width=128, height=4)
    emission.source = "FILE"
    emission.filepath = "//firePit-emission.png"
    emission.colorspace_settings.name = "sRGB"
    emission.pack(data=data, data_len=len(data))
    assert palette_colors(bytes(emission.packed_file.data)) == [
        color if slot in GLOW_SLOTS else (0, 0, 0)
        for slot, color in enumerate(colors)
    ]

    material = bpy.data.materials.new("palette")
    assert material.name == "palette"
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.84
    shader.inputs["Metallic"].default_value = 0
    shader.inputs["Emission Strength"].default_value = EMISSION_STRENGTH

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"
    links = material.node_tree.links

    for source, socket in (
        (image, "Base Color"),
        (emission, "Emission Color"),
    ):
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = source
        texture.interpolation = "Closest"
        texture.extension = "EXTEND"
        links.new(uv.outputs["UV"], texture.inputs["Vector"])
        links.new(texture.outputs["Color"], shader.inputs[socket])
        if socket == "Base Color":
            nodes.active = texture

    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material, colors


def uv_slot(value):
    u, v = value
    assert math.isfinite(u) and math.isfinite(v)
    slot = round(u * 32 - 0.5)
    assert slot in USED_SLOTS
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

    def component(self, name, vertices, faces, slots):
        assert name not in {part["name"] for part in self.parts}
        first = len(self.vertices)
        part_id = len(self.parts) + 1

        if isinstance(slots, int):
            slots = [slots] * len(faces)

        assert len(slots) == len(faces)
        self.vertices.extend(tuple(point) for point in vertices)
        self.parts.append({"id": part_id, "name": name})

        for face, slot in zip(faces, slots, strict=True):
            assert slot in USED_SLOTS
            assert len(face) >= 3 and len(set(face)) == len(face)
            assert all(0 <= index < len(vertices) for index in face)
            self.faces.append(tuple(first + index for index in face))
            self.slots.append(slot)
            self.face_parts.append(part_id)

    def fit(self):
        lower, upper = bounds(self.vertices)
        center = (lower + upper) / 2
        scale = Vector(tuple(
            TARGET[axis] / (upper[axis] - lower[axis])
            for axis in range(3)
        ))
        self.vertices = [
            tuple(
                (point[axis] - center[axis]) * scale[axis]
                for axis in range(3)
            )
            for point in self.vertices
        ]


def coconut_shell(builder):
    segments = 24
    # 외피에서 둥근 절단면을 거쳐 내벽으로 이어지는 닫힌 껍데기 단면.
    profile = (
        (0.180, 0.170), (0.400, 0.183),
        (0.640, 0.218), (0.830, 0.278),
        (0.950, 0.350), (1.000, 0.414),
        (0.998, 0.431), (0.963, 0.440),
        (0.909, 0.437), (0.882, 0.419),
        (0.838, 0.364), (0.711, 0.299),
        (0.500, 0.257), (0.220, 0.242),
    )
    vertices = []

    for radius, z in profile:
        for index in range(segments):
            angle = math.tau * index / segments
            wobble = 1 + 0.009 * math.sin(5 * angle + 0.8)
            wobble += 0.006 * math.cos(9 * angle + 0.6)
            vertices.append((
                0.500 * radius * wobble * math.cos(angle),
                0.345 * radius * wobble * math.sin(angle),
                z + 0.0025 * radius * math.sin(3 * angle + 0.4),
            ))

    bottom = len(vertices)
    vertices.append((0, 0, 0.166))
    inside = len(vertices)
    vertices.append((0, 0, 0.239))
    faces = []
    slots = []

    for index in range(segments):
        following = (index + 1) % segments
        faces.append((bottom, following, index))
        slots.append(SLOTS["wood"])

    for row in range(len(profile) - 1):
        for index in range(segments):
            following = (index + 1) % segments
            faces.append((
                row * segments + index,
                row * segments + following,
                (row + 1) * segments + following,
                (row + 1) * segments + index,
            ))
            slots.append(
                SLOTS["wood"] if row < 5 else SLOTS["sand"]
            )

    last = (len(profile) - 1) * segments
    for index in range(segments):
        faces.append((
            last + index,
            last + (index + 1) % segments,
            inside,
        ))
        slots.append(SLOTS["sand"])

    builder.component("coconut-shell", vertices, faces, slots)


def lump(builder, name, center, size, phase, segments=10, glowing=False):
    cx, cy, cz = center
    sx, sy, sz = size
    profile = (
        (0.70, -0.50),
        (1.00, -0.22),
        (0.94, 0.28),
        (0.54, 0.50),
    )
    vertices = []

    for radius, height in profile:
        for index in range(segments):
            angle = phase + math.tau * index / segments
            wobble = 1 + 0.055 * math.sin(index * 2.1 + phase)
            vertices.append((
                cx + sx * 0.5 * radius * wobble * math.cos(angle),
                cy + sy * 0.5 * radius * wobble * math.sin(angle),
                cz + sz * height,
            ))

    faces = [tuple(reversed(range(segments)))]
    slots = [SLOTS["basalt"]]

    for row in range(len(profile) - 1):
        for index in range(segments):
            following = (index + 1) % segments
            faces.append((
                row * segments + index,
                row * segments + following,
                (row + 1) * segments + following,
                (row + 1) * segments + index,
            ))
            slot = SLOTS["basalt"]

            if glowing:
                if row == 0 or (row == 2 and index % 3 == 0):
                    slot = SLOTS["basalt"]
                elif row == 2 and index % 3 == 1:
                    slot = SLOTS["mango"]
                else:
                    slot = SLOTS["coral"]

            slots.append(slot)

    faces.append(tuple(
        (len(profile) - 1) * segments + index
        for index in range(segments)
    ))
    slots.append(SLOTS["mango"] if glowing else SLOTS["basalt"])
    builder.component(name, vertices, faces, slots)


def face_components(bm):
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

        yield component


def signed_volume(faces):
    return sum(
        face.verts[0].co.dot(
            face.verts[1].co.cross(face.verts[2].co)
        ) / 6
        for face in faces
    )


def validate_closed_mesh(mesh, expected_parts):
    bm = bmesh.new()
    try:
        bm.from_mesh(mesh)
        assert all(
            edge.is_manifold and edge.is_contiguous
            for edge in bm.edges
        )
        assert all(vertex.is_manifold for vertex in bm.verts)
        assert all(
            len(face.verts) == 3 and face.calc_area() > 1e-10
            for face in bm.faces
        )

        part_layer = bm.faces.layers.int["part_id"]
        parts = set()

        for component in face_components(bm):
            identities = {face[part_layer] for face in component}
            assert len(identities) == 1
            part_id = identities.pop()
            assert part_id not in parts
            parts.add(part_id)
            volume = signed_volume(component)
            assert volume > 1e-10, (part_id, volume)

        assert len(parts) == expected_parts
    finally:
        bm.free()


def build_geometry():
    builder = Builder()
    coconut_shell(builder)

    stones = (
        ((-0.335, -0.025, 0.105), (0.310, 0.290, 0.210), 0.16),
        ((0.335, 0.025, 0.105), (0.310, 0.290, 0.210), -0.12),
        ((0, -0.225, 0.095), (0.340, 0.250, 0.190), 0.35),
        ((0, 0.215, 0.095), (0.320, 0.240, 0.190), -0.23),
    )
    for index, (center, size, phase) in enumerate(stones):
        lump(builder, f"support-stone-{index}", center, size, phase)

    lump(
        builder, "charcoal-bed",
        (0, 0, 0.320), (0.690, 0.440, 0.130),
        0.12, segments=12,
    )

    for index, (center, size, phase) in enumerate((
        ((-0.255, 0.065, 0.370), (0.160, 0.150, 0.100), 0.4),
        ((0.085, 0.190, 0.380), (0.180, 0.130, 0.110), 0.1),
        ((0.270, -0.105, 0.365), (0.140, 0.160, 0.100), -0.2),
        ((-0.070, -0.190, 0.360), (0.180, 0.100, 0.100), 0.7),
    )):
        lump(
            builder, f"charcoal-{index}",
            center, size, phase, segments=8,
        )

    for index, (center, size, phase) in enumerate((
        ((-0.060, 0.120, 0.453), (0.230, 0.180, 0.185), 0.12),
        ((-0.200, -0.095, 0.398), (0.190, 0.180, 0.140), -0.1),
        ((0.190, -0.050, 0.415), (0.220, 0.180, 0.160), 0.3),
        ((0.200, 0.145, 0.419), (0.180, 0.160, 0.135), 0.7),
        ((0.015, -0.130, 0.400), (0.190, 0.150, 0.115), 0.2),
    )):
        lump(
            builder, f"ember-{index}",
            center, size, phase, segments=8, glowing=True,
        )

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
            bm.faces, builder.face_parts, builder.slots, strict=True
        ):
            face[part_layer] = part
            face[slot_layer] = slot

        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bmesh.ops.triangulate(
            bm, faces=list(bm.faces),
            quad_method="BEAUTY", ngon_method="EAR_CLIP",
        )
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

        for component in face_components(bm):
            volume = signed_volume(component)
            assert abs(volume) > 1e-10
            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(component))

        bm.to_mesh(mesh)
    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()
    validate_closed_mesh(mesh, len(builder.parts))
    assert 600 <= len(mesh.loop_triangles) <= 2000
    assert len(mesh.loop_triangles) == 1608

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    return mesh, builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")
    slot_attribute = mesh.attributes["palette_slot"]
    part_attribute = mesh.attributes["part_id"]
    parts = {part["id"]: part["name"] for part in builder.parts}
    used = set()

    for polygon in mesh.polygons:
        polygon.use_smooth = False
        assert len(polygon.vertices) == 3
        slot = slot_attribute.data[polygon.index].value
        part = parts[part_attribute.data[polygon.index].value]

        if slot in GLOW_SLOTS:
            assert part.startswith("ember-")
        if part == "coconut-shell":
            assert slot in {SLOTS["wood"], SLOTS["sand"]}
        if part.startswith("support-stone-") or part.startswith("charcoal"):
            assert slot == SLOTS["basalt"]

        used.add(slot)
        for index in polygon.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert used == USED_SLOTS
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert len(mesh.uv_layers) == 1
    assert sum(
        part["name"].startswith("support-stone-")
        for part in builder.parts
    ) == 4

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert obj.location.length == 0
    assert obj.rotation_euler.to_matrix().is_identity
    assert tuple(obj.scale) == (1, 1, 1)
    assert len([
        item for item in bpy.context.scene.objects
        if item.type == "MESH"
    ]) == 1

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return obj, {
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "blender_dimensions": list(upper - lower),
        "bbox_center": list((lower + upper) / 2),
        "slots_used": sorted(used),
        "closed_components": len(builder.parts),
        "support_stones": 4,
        "emissive_slots": sorted(GLOW_SLOTS),
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

    formats = {5121: "B", 5123: "H", 5125: "I", 5126: "f"}
    widths = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
    fmt = "<" + formats[accessor["componentType"]] * widths[accessor["type"]]
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
    assert struct.unpack_from("<4sII", data) == (b"glTF", 2, len(data))
    chunks = {}
    offset = 12

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
    assert node["mesh"] == 0 and "matrix" not in node
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
    assert set(attributes) == {"POSITION", "NORMAL", "TEXCOORD_0"}

    points = [
        Vector(point)
        for point in accessor_rows(document, binary, attributes["POSITION"])
    ]
    normals = accessor_rows(document, binary, attributes["NORMAL"])
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])
    assert len(points) == len(normals) == len(uvs)
    assert all(abs(Vector(normal).length - 1) < 1e-4 for normal in normals)
    for uv in uvs:
        uv_slot(uv)

    indices = [
        row[0]
        for row in accessor_rows(document, binary, primitive["indices"])
    ]
    assert len(indices) % 3 == 0
    actual = Counter()

    for start in range(0, len(indices), 3):
        ids = indices[start:start + 3]
        assert len(set(ids)) == 3
        assert min(ids) >= 0 and max(ids) < len(points)
        a, b, c = (points[index] for index in ids)
        normal = (b - a).cross(c - a)
        assert normal.length > 2e-10
        assert all(normal.dot(Vector(normals[index])) > 0 for index in ids)
        slot = uv_slot(uvs[ids[0]])
        assert all(uv_slot(uvs[index]) == slot for index in ids)
        actual[triangle_key(slot, (a, b, c))] += 1

    source = obj.data
    expected = Counter()

    for face in source.polygons:
        slot = uv_slot(source.uv_layers.active.data[face.loop_start].uv)
        expected[triangle_key(slot, (
            to_yup(source.vertices[index].co)
            for index in face.vertices
        ))] += 1

    assert actual == expected
    triangles = len(indices) // 3
    assert 600 <= triangles <= 2000
    assert triangles == len(source.loop_triangles)
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    assert (
        to_yup(Vector(metadata["front_blender"])) - Vector((0, 0, 1))
    ).length < EPSILON

    pbr = material["pbrMetallicRoughness"]
    assert pbr.get("baseColorFactor", [1, 1, 1, 1]) == [1, 1, 1, 1]
    assert len(document["textures"]) == len(document["images"]) == 2
    images_used = set()

    for info, expected_colors in (
        (pbr["baseColorTexture"], colors),
        (material["emissiveTexture"], [
            color if slot in GLOW_SLOTS else (0, 0, 0)
            for slot, color in enumerate(colors)
        ]),
    ):
        assert info.get("texCoord", 0) == 0
        texture = document["textures"][info["index"]]
        image = document["images"][texture["source"]]
        images_used.add(texture["source"])
        assert image["mimeType"] == "image/png"
        assert "uri" not in image

        view = document["bufferViews"][image["bufferView"]]
        start = view.get("byteOffset", 0)
        embedded = binary[start:start + view["byteLength"]]
        assert palette_colors(embedded) == expected_colors

        sampler = document["samplers"][texture["sampler"]]
        assert sampler["magFilter"] == 9728
        assert sampler["minFilter"] in (9728, 9984)
        assert sampler["wrapS"] == sampler["wrapT"] == 33071

    assert len(images_used) == 2
    strength = material.get("extensions", {}).get(
        "KHR_materials_emissive_strength", {}
    ).get("emissiveStrength", 1)
    assert all(
        abs(factor * strength - EMISSION_STRENGTH) < 1e-5
        for factor in material["emissiveFactor"]
    )
    validate_closed_mesh(source, metadata["closed_components"])

    return {
        "file": str(path),
        "triangles": triangles,
        "glb_dimensions": list(upper - lower),
        "glb_bbox_center": list((lower + upper) / 2),
        "palette_rgb": {
            str(slot): list(colors[slot]) for slot in sorted(USED_SLOTS)
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
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.78, 0.76, 0.70, 1)
    background.inputs["Strength"].default_value = 0.7
    scene.world = world

    clone = bpy.data.objects.new(NAME + "-preview", obj.data.copy())
    scene.collection.objects.link(clone)
    lower, upper = bounds(vertex.co for vertex in clone.data.vertices)
    floor_z = lower.z - 0.006

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
            basis.transposed() @ (point - pivot) for point in points
        )
        target = pivot + basis @ Vector((
            (screen_lower.x + screen_upper.x) / 2,
            (screen_lower.y + screen_upper.y) / 2,
            0,
        ))

        camera = bpy.data.objects.new(
            label, bpy.data.cameras.new(label)
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
        basis = camera.rotation_euler.to_matrix()
        screen_lower, screen_upper = bounds(
            basis.transposed() @ (point - camera.location)
            for point in points
        )
        frame_lower, frame_upper = bounds(
            camera.data.view_frame(scene=scene)
        )
        assert frame_lower.x < screen_lower.x < screen_upper.x < frame_upper.x
        assert frame_lower.y < screen_lower.y < screen_upper.y < frame_upper.y

    return scene, cameras


def combine_png(left, right, output):
    lw, lh, lc, left_rows, left_chunks = read_png(left.read_bytes())
    rw, rh, rc, right_rows, _ = read_png(right.read_bytes())
    assert (lw, lh, lc) == (PANEL_WIDTH, PANEL_HEIGHT, 4)
    assert (rw, rh, rc) == (PANEL_WIDTH, PANEL_HEIGHT, 4)

    data = bytearray(b"\x89PNG\r\n\x1a\n")
    data.extend(png_chunk(
        b"IHDR",
        struct.pack(">IIBBBBB", lw + rw, lh, 8, 6, 0, 0, 0),
    ))

    for kind, payload in left_chunks:
        if kind in (b"gAMA", b"cHRM", b"sRGB", b"iCCP"):
            data.extend(png_chunk(kind, payload))

    raw = b"".join(
        b"\x00" + left_row + right_row
        for left_row, right_row in zip(
            left_rows, right_rows, strict=True
        )
    )
    data.extend(png_chunk(b"IDAT", zlib.compress(raw, 6)))
    data.extend(png_chunk(b"IEND", b""))
    output.write_bytes(data)

    width, height, channels, _, _ = read_png(output.read_bytes())
    assert (width, height, channels) == (
        2 * PANEL_WIDTH, PANEL_HEIGHT, 4
    )


def render_comparison(obj, samples):
    scene, cameras = make_render_scene(obj, samples)
    output = OUTPUT / (NAME + ".png")

    with tempfile.TemporaryDirectory(
        prefix="firePit-preview-", dir=OUTPUT
    ) as directory:
        paths = []

        for index, camera in enumerate(cameras):
            scene.camera = camera
            path = Path(directory) / f"panel-{index}.png"
            scene.render.filepath = str(path)
            result = bpy.ops.render.render(
                write_still=True, scene=scene.name
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
        if "--" in sys.argv else []
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
        if not args.skip_render else None
    )
    print(json.dumps(
        result, ensure_ascii=False, allow_nan=False
    ))


if __name__ == "__main__":
    main()
