"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/beachCanopy.py

지붕만 생성한다. 기둥·바닥·받침은 GLB에 포함하지 않는다.
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

NAME = "beachCanopy"
TARGET = Vector((3.60, 3.60, 1.40))
EPSILON = 1e-5
PANEL_WIDTH = 1000
PANEL_HEIGHT = 1100

STRIPE_COUNT = 12
SAMPLES_PER_STRIPE = 8
PERIMETER_COUNT = STRIPE_COUNT * SAMPLES_PER_STRIPE
HALF_WIDTH = 1.80
CORNER_CHAMFER = 0.03
EAVE_Z = -0.35
SCALLOP_DROP = 0.35
SHELL_THICKNESS = 0.055

SLOTS = {
    "sand_bamboo": 1,
    "cream": 23,
    "coral": 10,
    "teal": 3,
    "mango": 18,
    "green": 9,
    "leaf_rib": 12,
    "wood": 14,
    "wood_light": 11,
    "basalt": 5,
    "pink": 17,
}
STRIPE_SLOTS = (SLOTS["teal"], SLOTS["cream"])
USED_SLOTS = set(STRIPE_SLOTS) | {SLOTS["mango"]}
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

    assert all(
        math.isfinite(coordinate)
        for point in points
        for coordinate in point
    )

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
    shader.inputs["Roughness"].default_value = 0.80
    shader.inputs["Metallic"].default_value = 0.0

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
    assert slot in USED_SLOTS
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7
    return slot


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.stripes = []
        self.face_parts = []
        self.parts = []

    def component(self, name, vertices, faces):
        assert name not in {part["name"] for part in self.parts}
        first = len(self.vertices)
        part_id = len(self.parts) + 1

        self.vertices.extend(tuple(point) for point in vertices)
        self.parts.append({
            "id": part_id,
            "name": name,
            "start": first,
            "count": len(vertices),
        })

        for indices, slot, stripe in faces:
            assert len(indices) >= 3
            assert len(set(indices)) == len(indices)
            assert all(0 <= index < len(vertices) for index in indices)
            assert slot in USED_SLOTS

            if name == "canopy-shell":
                assert 0 <= stripe < STRIPE_COUNT
                assert slot == STRIPE_SLOTS[stripe % 2]
            else:
                assert name == "mango-finial"
                assert stripe == -1 and slot == SLOTS["mango"]

            self.faces.append(tuple(first + index for index in indices))
            self.slots.append(slot)
            self.stripes.append(stripe)
            self.face_parts.append(part_id)

    def fit(self):
        lower, upper = bounds(self.vertices)
        assert (upper - lower - TARGET).length < EPSILON

        center = (lower + upper) / 2
        self.vertices = [
            tuple(Vector(point) - center)
            for point in self.vertices
        ]

        lower, upper = bounds(self.vertices)
        assert (upper - lower - TARGET).length < EPSILON
        assert ((lower + upper) / 2).length < EPSILON


def square_outline(index):
    samples_per_side = PERIMETER_COUNT // 4
    side, step = divmod(index, samples_per_side)
    t = step / samples_per_side

    points = (
        (-1 + 2 * t, -1),
        (1, -1 + 2 * t),
        (1 - 2 * t, 1),
        (-1, 1 - 2 * t),
    )
    x, y = points[side]

    if step == 0:
        corner_scale = 1 - CORNER_CHAMFER / HALF_WIDTH
        x *= corner_scale
        y *= corner_scale

    return Vector((HALF_WIDTH * x, HALF_WIDTH * y, 0))


def roof_height(radius):
    return (
        0.65 - radius
        - 0.015 * math.sin(math.pi * (radius - 0.09) / 0.91)
    )


def scallop_depth(index):
    t = (index % SAMPLES_PER_STRIPE) / SAMPLES_PER_STRIPE
    rounded_arc = math.sqrt(max(0.0, 1 - (2 * t - 1) ** 2))
    return 0.08 + (SCALLOP_DROP - 0.08) * rounded_arc


def profile_height(kind, radius, index):
    depth = scallop_depth(index)

    if kind == "roof":
        return roof_height(radius)
    if kind == "eave":
        return EAVE_Z
    if kind == "curtain":
        return EAVE_Z - 0.40 * depth
    if kind == "hem-outer":
        return EAVE_Z - depth + 0.023
    if kind == "hem-bottom":
        return EAVE_Z - depth
    if kind == "hem-inner":
        return EAVE_Z - depth + 0.020
    if kind == "lining-top":
        return EAVE_Z - 0.040
    assert kind == "under"
    return roof_height(radius) - SHELL_THICKNESS


def add_canopy(builder):
    profiles = [
        ("roof", radius) for radius in (0.09, 0.36, 0.67, 0.96)
    ]
    profiles.extend((
        ("eave", 1.000),
        ("curtain", 1.000),
        ("hem-outer", 0.997),
        ("hem-bottom", 0.990),
        ("hem-inner", 0.974),
        ("lining-top", 0.970),
    ))
    profiles.extend(
        ("under", radius) for radius in (0.94, 0.76, 0.51, 0.26, 0.09)
    )

    vertices = []
    faces = []

    for kind, radius in profiles:
        for index in range(PERIMETER_COUNT):
            point = square_outline(index) * radius
            vertices.append((
                point.x,
                point.y,
                profile_height(kind, radius, index),
            ))

    for row in range(len(profiles) - 1):
        for index in range(PERIMETER_COUNT):
            following = (index + 1) % PERIMETER_COUNT
            stripe = index // SAMPLES_PER_STRIPE
            faces.append((
                (
                    row * PERIMETER_COUNT + index,
                    row * PERIMETER_COUNT + following,
                    (row + 1) * PERIMETER_COUNT + following,
                    (row + 1) * PERIMETER_COUNT + index,
                ),
                STRIPE_SLOTS[stripe % 2],
                stripe,
            ))

    for row, height in (
        (0, roof_height(0.09)),
        (len(profiles) - 1, roof_height(0.09) - SHELL_THICKNESS),
    ):
        center = len(vertices)
        vertices.append((0, 0, height))

        for index in range(PERIMETER_COUNT):
            stripe = index // SAMPLES_PER_STRIPE
            faces.append((
                (
                    center,
                    row * PERIMETER_COUNT + index,
                    row * PERIMETER_COUNT
                    + (index + 1) % PERIMETER_COUNT,
                ),
                STRIPE_SLOTS[stripe % 2],
                stripe,
            ))

    bottom_row = next(
        row for row, (kind, _) in enumerate(profiles)
        if kind == "hem-bottom"
    )

    for stripe in range(STRIPE_COUNT):
        midpoint = stripe * SAMPLES_PER_STRIPE + SAMPLES_PER_STRIPE // 2
        bottom = vertices[bottom_row * PERIMETER_COUNT + midpoint][2]
        assert abs(EAVE_Z - bottom - SCALLOP_DROP) < EPSILON

    assert len(profiles) == 15
    builder.component("canopy-shell", vertices, faces)


def add_finial(builder):
    bm = bmesh.new()
    try:
        bmesh.ops.create_cube(bm, size=1.0)

        size = Vector((0.39, 0.39, 0.165))
        center = Vector((0, 0, 0.6175))

        for vertex in bm.verts:
            vertex.co = Vector(tuple(
                vertex.co[axis] * size[axis]
                for axis in range(3)
            ))

        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=0.025,
            segments=1,
            affect="EDGES",
            profile=0.5,
        )

        bm.verts.index_update()
        vertices = [tuple(vertex.co + center) for vertex in bm.verts]
        faces = [
            (
                tuple(vertex.index for vertex in face.verts),
                SLOTS["mango"],
                -1,
            )
            for face in bm.faces
        ]
        builder.component("mango-finial", vertices, faces)
    finally:
        bm.free()


def build_geometry():
    builder = Builder()
    add_canopy(builder)
    add_finial(builder)
    builder.fit()

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
        stripe_layer = bm.faces.layers.int.new("stripe_id")

        for face, part, slot, stripe in zip(
            bm.faces,
            builder.face_parts,
            builder.slots,
            builder.stripes,
            strict=True,
        ):
            face[part_layer] = part
            face[slot_layer] = slot
            face[stripe_layer] = stripe

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
        assert all(len(face.verts) == 3 for face in bm.faces)
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

            volume = sum(
                face.verts[0].co.dot(
                    face.verts[1].co.cross(face.verts[2].co)
                ) / 6
                for face in component
            )
            assert abs(volume) > 1e-10

            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(component))

            vertices = {vertex for face in component for vertex in face.verts}
            edges = {edge for face in component for edge in face.edges}
            assert len(vertices) - len(edges) + len(component) == 2

            volumes.append({
                "part_id": next(iter(part_ids)),
                "volume": abs(volume),
                "triangles": len(component),
            })

        assert len(volumes) == len(builder.parts) == 2
        assert sorted(record["triangles"] for record in volumes) == [44, 2880]
        bm.to_mesh(mesh)
    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()

    assert 1000 <= len(mesh.loop_triangles) <= 3000
    assert len(mesh.loop_triangles) == 2924

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return mesh, builder, volumes


def finish_object(mesh, builder, material, volumes):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")

    slot_attribute = mesh.attributes["palette_slot"]
    part_attribute = mesh.attributes["part_id"]
    stripe_attribute = mesh.attributes["stripe_id"]
    part_names = {
        part["id"]: part["name"]
        for part in builder.parts
    }

    used = set()
    stripe_audit = {}

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False
        polygon.material_index = 0

        slot = slot_attribute.data[polygon.index].value
        part = part_names[part_attribute.data[polygon.index].value]
        stripe = stripe_attribute.data[polygon.index].value

        if part == "canopy-shell":
            assert 0 <= stripe < STRIPE_COUNT
            assert slot == STRIPE_SLOTS[stripe % 2]

            record = stripe_audit.setdefault(stripe, {
                "stripe": stripe,
                "slot": slot,
                "triangles": 0,
                "min_z": float("inf"),
                "max_z": float("-inf"),
            })
            record["triangles"] += 1

            for index in polygon.vertices:
                z = mesh.vertices[index].co.z
                record["min_z"] = min(record["min_z"], z)
                record["max_z"] = max(record["max_z"], z)
        else:
            assert part == "mango-finial"
            assert stripe == -1
            assert slot == SLOTS["mango"]

        used.add(slot)
        for index in polygon.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert set(stripe_audit) == set(range(STRIPE_COUNT))
    assert used == USED_SLOTS
    assert all(record["triangles"] == 240 for record in stripe_audit.values())
    assert all(
        abs(record["min_z"] - (EAVE_Z - SCALLOP_DROP)) < EPSILON
        for record in stripe_audit.values()
    )
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert obj.location.length == 0
    assert obj.rotation_euler.to_matrix().is_identity
    assert tuple(obj.scale) == (1, 1, 1)
    assert len(bpy.context.scene.objects) == 1

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    assert (obj.dimensions - TARGET).length < EPSILON

    return obj, {
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "blender_dimensions": list(upper - lower),
        "bbox_center": list((lower + upper) / 2),
        "mesh_objects": 1,
        "material": "palette",
        "slots_used": sorted(used),
        "stripe_count": STRIPE_COUNT,
        "stripe_audit": [
            stripe_audit[index] for index in range(STRIPE_COUNT)
        ],
        "eave_z": EAVE_Z,
        "scallop_drop": SCALLOP_DROP,
        "shell_thickness_vertical": SHELL_THICKNESS,
        "closed_components": len(volumes),
        "component_audit": sorted(
            volumes, key=lambda record: record["part_id"]
        ),
        "contains_posts": False,
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

    assert document.get("scene", 0) == 0
    assert scene["nodes"] == [0]
    assert node["mesh"] == 0
    assert mesh["name"] == node["name"] == NAME
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
    assert not primitive.get("targets")

    attributes = primitive["attributes"]
    assert set(attributes) == {"POSITION", "NORMAL", "TEXCOORD_0"}

    points = [
        Vector(point)
        for point in accessor_rows(document, binary, attributes["POSITION"])
    ]
    normals = accessor_rows(document, binary, attributes["NORMAL"])
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])

    assert len(points) == len(normals) == len(uvs)
    assert all(
        abs(Vector(normal).length - 1) < 1e-4
        for normal in normals
    )

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
    assert 1000 <= triangles <= 3000
    assert triangles == len(source.loop_triangles) == 2924
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    assert (
        to_yup(Vector(metadata["front_blender"]))
        - Vector(metadata["front_yup"])
    ).length < EPSILON

    texture, = document["textures"]
    image, = document["images"]
    assert texture["source"] == 0

    pbr = material["pbrMetallicRoughness"]
    assert pbr["baseColorTexture"]["index"] == 0
    assert pbr["baseColorTexture"].get("texCoord", 0) == 0
    assert pbr.get("baseColorFactor", [1, 1, 1, 1]) == [1, 1, 1, 1]
    assert pbr.get("metallicFactor", 1) == 0

    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    assert view.get("buffer", 0) == 0
    start = view.get("byteOffset", 0)
    assert start + view["byteLength"] <= len(binary)
    png = binary[start:start + view["byteLength"]]
    assert palette_colors(png) == colors

    sampler = document["samplers"][texture["sampler"]]
    assert sampler["magFilter"] == 9728
    assert sampler["minFilter"] in (9728, 9984)
    assert sampler["wrapS"] == sampler["wrapT"] == 33071

    return {
        **metadata,
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
        "palette_asserted_slots": sorted(EXPECTED_RGB),
    }


def export_glb(obj, metadata, colors):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    assert len(bpy.context.scene.objects) == 1
    assert list(bpy.context.selected_objects) == [obj]

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
    floor_z = lower.z - 0.08

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
            basis.transposed() @ (point - pivot)
            for point in points
        )
        target = pivot + basis @ Vector((
            (screen_lower.x + screen_upper.x) / 2,
            (screen_lower.y + screen_upper.y) / 2,
            0,
        ))

        camera = bpy.data.objects.new(label, bpy.data.cameras.new(label))
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

    assert cameras[0].data.ortho_scale == cameras[1].data.ortho_scale
    return scene, cameras


def combine_png(left, right, output):
    left_width, left_height, left_channels, left_rows, left_chunks = (
        read_png(left.read_bytes())
    )
    right_width, right_height, right_channels, right_rows, _ = (
        read_png(right.read_bytes())
    )

    assert (left_width, left_height, left_channels) == (
        PANEL_WIDTH, PANEL_HEIGHT, 4,
    )
    assert (right_width, right_height, right_channels) == (
        PANEL_WIDTH, PANEL_HEIGHT, 4,
    )

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
            left_rows, right_rows, strict=True
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
    mesh, builder, volumes = build_geometry()
    obj, metadata = finish_object(mesh, builder, material, volumes)

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
