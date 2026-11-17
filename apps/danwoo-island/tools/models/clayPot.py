"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/clayPot.py
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
OUTPUT = WORK / "props"

NAME = "clayPot"
TARGET = Vector((1.85, 1.85, 0.95))
EPSILON = 1e-5
PANEL_WIDTH = 1000
PANEL_HEIGHT = 1100

SLOTS = {
    "clay": 14,
    "coral": 10,
    "mango": 18,
    "basalt": 5,
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
    assert slot in set(SLOTS.values())
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
        assert len(faces) == len(slots)
        assert set(slots) <= set(SLOTS.values())

        first = len(self.vertices)
        part_id = len(self.parts) + 1

        self.parts.append({
            "id": part_id,
            "name": name,
            "start": first,
            "count": len(vertices),
        })
        self.vertices.extend(tuple(point) for point in vertices)

        for face, slot in zip(faces, slots, strict=True):
            assert len(face) >= 3
            assert len(set(face)) == len(face)
            assert min(face) >= 0 and max(face) < len(vertices)

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
                (point[axis] - center[axis]) * factor[axis]
                for axis in range(3)
            )
            for point in self.vertices
        ]


def add_rings(builder, name, rings, side_slots, cap_slots):
    count = len(rings[0])
    assert len(rings) >= 2 and count >= 3
    assert all(len(ring) == count for ring in rings)
    assert len(side_slots) == len(rings) - 1

    vertices = [point for ring in rings for point in ring]
    faces = [tuple(reversed(range(count)))]
    slots = [cap_slots[0]]

    for row, slot in enumerate(side_slots):
        for index in range(count):
            following = (index + 1) % count
            faces.append((
                row * count + index,
                row * count + following,
                (row + 1) * count + following,
                (row + 1) * count + index,
            ))
            slots.append(slot)

    faces.append(tuple(
        (len(rings) - 1) * count + index
        for index in range(count)
    ))
    slots.append(cap_slots[1])

    builder.component(name, vertices, faces, slots)


def lathe(builder, name, profile, slot, segments=32):
    assert all(radius > 0 for radius, _ in profile)

    rings = [
        [
            (
                radius * math.cos(index * math.tau / segments),
                radius * math.sin(index * math.tau / segments),
                z,
            )
            for index in range(segments)
        ]
        for radius, z in profile
    ]

    add_rings(
        builder,
        name,
        rings,
        [slot] * (len(rings) - 1),
        (slot, slot),
    )


def body_radius(z):
    profile = (
        (0.195, 0.430),
        (0.215, 0.570),
        (0.260, 0.720),
        (0.325, 0.830),
        (0.355, 0.875),
        (0.430, 0.920),
        (0.520, 0.925),
        (0.570, 0.900),
        (0.630, 0.850),
        (0.690, 0.765),
    )

    for (z0, r0), (z1, r1) in zip(profile, profile[1:]):
        if z0 <= z <= z1:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)

    raise ValueError(z)


def add_body(builder):
    segments = 32
    rings = []

    for row in range(18):
        ring = []

        for index in range(segments):
            theta = index * math.tau / segments
            wave = -0.031 * math.cos(6 * (theta + math.pi / 2))

            if row < 5:
                z = (0.195, 0.215, 0.260, 0.325, 0.355)[row]
                radius = body_radius(z)
            elif row < 9:
                z = (0.397, 0.403, 0.471, 0.477)[row - 5] + wave
                radius = body_radius(z) + (
                    0.004 if row in (6, 7) else 0
                )
            else:
                radius, z = (
                    (0.925, 0.520),
                    (0.900, 0.570),
                    (0.850, 0.630),
                    (0.765, 0.690),
                    (0.750, 0.715),
                    (0.790, 0.720),
                    (0.815, 0.735),
                    (0.815, 0.755),
                    (0.795, 0.770),
                )[row - 9]

            ring.append((
                radius * math.cos(theta),
                radius * math.sin(theta),
                z,
            ))

        rings.append(ring)

    # 몸통과 정점을 공유해 물결 띠의 틈과 겹침을 없앤다.
    side_slots = [
        SLOTS["coral"] if row in (5, 6, 7) else SLOTS["clay"]
        for row in range(len(rings) - 1)
    ]

    add_rings(
        builder,
        "clay-body",
        rings,
        side_slots,
        (SLOTS["clay"], SLOTS["clay"]),
    )


def add_stone(builder, name, center, radii, seed):
    cx, cy = center
    rx, ry = radii
    rings = []

    for row, (scale, z) in enumerate((
        (0.78, 0.000),
        (1.00, 0.035),
        (0.88, 0.165),
        (0.55, 0.245),
    )):
        ring = []

        for index in range(8):
            theta = index * math.tau / 8 + seed * 0.19
            variation = 1 + 0.07 * math.sin(index * 2.17 + seed)
            dz = (
                0 if row == 0
                else 0.009 * math.sin(index * 1.73 + seed)
            )

            ring.append((
                cx
                + rx * scale * variation * math.cos(theta)
                + row * 0.006,
                cy
                + ry * scale * variation * math.sin(theta)
                - row * 0.004,
                z + dz,
            ))

        rings.append(ring)

    slot = SLOTS["basalt"]
    add_rings(builder, name, rings, [slot] * 3, (slot, slot))


def build_geometry():
    builder = Builder()
    add_body(builder)

    lathe(
        builder,
        "mango-lid",
        (
            (0.600, 0.751),
            (0.700, 0.756),
            (0.750, 0.767),
            (0.742, 0.788),
            (0.690, 0.824),
            (0.580, 0.858),
            (0.420, 0.884),
            (0.210, 0.897),
            (0.090, 0.900),
        ),
        SLOTS["mango"],
    )
    lathe(
        builder,
        "mango-knob",
        (
            (0.095, 0.886),
            (0.140, 0.897),
            (0.165, 0.915),
            (0.150, 0.937),
            (0.100, 0.950),
        ),
        SLOTS["mango"],
        segments=16,
    )

    for name, center, radii, seed in (
        ("stone-left", (-0.60, 0.17), (0.29, 0.30), 1),
        ("stone-right", (0.60, 0.17), (0.29, 0.30), 3),
        ("stone-front", (0.00, -0.61), (0.30, 0.30), 5),
    ):
        add_stone(builder, name, center, radii, seed)

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
        part_ids = set()

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

            ids = {face[part_layer] for face in component}
            assert len(ids) == 1 and not ids & part_ids
            part_ids.update(ids)

            volume = sum(
                face.verts[0].co.dot(
                    face.verts[1].co.cross(face.verts[2].co)
                ) / 6
                for face in component
            )
            assert abs(volume) > 1e-10

            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(component))

        assert part_ids == {part["id"] for part in builder.parts}
        assert len(part_ids) == 6

        bm.to_mesh(mesh)

    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()

    assert 800 <= len(mesh.loop_triangles) <= 2400

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
    audit = {}
    allowed = {
        "clay-body": {SLOTS["clay"], SLOTS["coral"]},
        "mango-lid": {SLOTS["mango"]},
        "mango-knob": {SLOTS["mango"]},
        "stone-left": {SLOTS["basalt"]},
        "stone-right": {SLOTS["basalt"]},
        "stone-front": {SLOTS["basalt"]},
    }

    for face in mesh.polygons:
        assert len(face.vertices) == 3
        face.use_smooth = False

        slot = slots.data[face.index].value
        name = names[parts.data[face.index].value]
        assert slot in allowed[name]

        used.add(slot)
        record = audit.setdefault(name, {
            "triangles": 0,
            "slots": set(),
        })
        record["triangles"] += 1
        record["slots"].add(slot)

        for index in face.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert used == set(SLOTS.values())
    assert {
        name: value["slots"] for name, value in audit.items()
    } == allowed
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
    assert (obj.dimensions - TARGET).length < EPSILON

    return obj, {
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "bbox_center": list((lower + upper) / 2),
        "blender_dimensions": list(upper - lower),
        "slots_used": sorted(used),
        "closed_components": len(builder.parts),
        "parts": {
            name: {
                "triangles": value["triangles"],
                "slots": sorted(value["slots"]),
            }
            for name, value in audit.items()
        },
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
    assert 800 <= triangles <= 2400
    assert triangles == len(source.loop_triangles)
    assert sorted({
        key[0] for key in actual
    }) == metadata["slots_used"]

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
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

    clone = bpy.data.objects.new(
        NAME + "-preview", obj.data.copy(),
    )
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
        prefix="clayPot-preview-",
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
