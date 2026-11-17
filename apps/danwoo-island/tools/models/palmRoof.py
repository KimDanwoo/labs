"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/palmRoof.py

기본 출력:
  codex-work/props/palmRoof.glb
  codex-work/props/palmRoof.png
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

NAME = "palmRoof"
TARGET = Vector((6.40, 2.40, 1.30))
EPSILON = 1e-5
TRIANGLE_MIN = 1200
TRIANGLE_MAX = 3500
PANEL_WIDTH = 1200
PANEL_HEIGHT = 620

SLOTS = {
    "bamboo": 1,
    "leaf": 9,
    "rib": 12,
    "rope": 14,
    "dry": 18,
}
USED_SLOTS = frozenset(SLOTS.values())

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

    rows = []
    previous = bytearray(stride)

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

    def component(self, name, vertices, faces, slot):
        assert name not in {part["name"] for part in self.parts}
        assert slot in USED_SLOTS

        offset = len(self.vertices)
        part_id = len(self.parts) + 1
        self.vertices.extend(tuple(point) for point in vertices)
        self.parts.append({
            "id": part_id,
            "name": name,
            "slot": slot,
        })

        for face in faces:
            assert len(face) >= 3 and len(set(face)) == len(face)
            assert all(0 <= index < len(vertices) for index in face)
            self.faces.append(tuple(offset + index for index in face))
            self.slots.append(slot)
            self.face_parts.append(part_id)

    def fit(self):
        lower, upper = bounds(self.vertices)
        center = (lower + upper) / 2
        span = upper - lower
        assert min(span) > 0

        self.vertices = [
            tuple(
                (point[axis] - center[axis]) * TARGET[axis] / span[axis]
                for axis in range(3)
            )
            for point in self.vertices
        ]


def loft(builder, name, rings, slot):
    count = len(rings[0])
    assert count >= 3 and len(rings) >= 2
    assert all(len(ring) == count for ring in rings)

    vertices = [tuple(point) for ring in rings for point in ring]
    faces = [tuple(reversed(range(count)))]

    for row in range(len(rings) - 1):
        for index in range(count):
            following = (index + 1) % count
            faces.append((
                row * count + index,
                row * count + following,
                (row + 1) * count + following,
                (row + 1) * count + index,
            ))

    faces.append(tuple(
        (len(rings) - 1) * count + index
        for index in range(count)
    ))
    builder.component(name, vertices, faces, slot)


def add_leaf(builder, name, root, direction, length, width, slot, phase):
    root = Vector(root)
    axis = Vector((direction[0], direction[1], 0)).normalized()
    across = Vector((-axis.y, axis.x, 0))
    up = Vector((0, 0, 1))
    height = 0.078
    thickness = 0.054

    def center(t):
        sway = 0.055 * math.sin(math.pi * t) * math.sin(phase)
        drop = 0.12 * t + 0.28 * t * t + 0.12 * t ** 4
        return (
            root
            + axis * (length * t)
            + across * sway
            - up * drop
        )

    sections = (
        (0, 0.18),
        (0.24, 0.80),
        (0.53, 1.0),
        (0.80, 0.82),
        (1, 0.14),
    )
    rings = []

    for t, spread in sections:
        taper = 0.36 + 0.64 * spread
        twist = 0.022 * math.sin(phase + t * 2.1)
        cross_section = (
            (-1, 0),
            (-0.84, 0.027 * taper),
            (0, height * taper),
            (0.84, 0.027 * taper),
            (1, 0),
            (0, -thickness * taper),
        )
        rings.append([
            center(t)
            + across * (side * width * spread)
            + up * (z + twist * side)
            for side, z in cross_section
        ])

    loft(builder, name, rings, slot)

    rib_rings = []
    for t in (0.12, 0.42, 0.73):
        spread = next(
            a_spread
            + (b_spread - a_spread) * (t - a_t) / (b_t - a_t)
            for (a_t, a_spread), (b_t, b_spread) in zip(
                sections[:-1], sections[1:], strict=True,
            )
            if a_t <= t <= b_t
        )
        peak = (
            center(t)
            + up * (height * (0.36 + 0.64 * spread) - 0.003)
        )
        rib_width = 0.012 * (1 - 0.55 * t)

        rib_rings.append([
            peak
            + across * (
                rib_width * math.cos(index * math.tau / 4)
            )
            + up * (
                0.012 * math.sin(index * math.tau / 4)
            )
            for index in range(4)
        ])

    loft(builder, name + "-rib", rib_rings, SLOTS["rib"])


def add_ridge(builder):
    # 엇갈린 잎의 가느다란 뿌리 사이로 용마루가 비지 않게 겹침을 보강한다.
    rings = []
    for x, z, width in (
        (-3.08, 0.73, 0.11),
        (-2.70, 0.85, 0.30),
        (-1.45, 0.91, 0.35),
        (0, 0.93, 0.36),
        (1.45, 0.91, 0.35),
        (2.70, 0.85, 0.30),
        (3.08, 0.73, 0.11),
    ):
        rings.append([
            (x, width * side, z + height)
            for side, height in (
                (-1, 0),
                (-0.80, 0.035),
                (0, 0.065),
                (0.80, 0.035),
                (1, 0),
                (0, -0.060),
            )
        ])

    loft(builder, "ridge-overlap", rings, SLOTS["leaf"])


def add_bamboo(builder, index):
    angle = index * math.tau / 3 + math.pi / 6
    radial = Vector((math.cos(angle), math.sin(angle), 0))
    base = radial * 0.12 + Vector((0, 0, 0.985))
    axis = (radial * 0.16 + Vector((0, 0, 1))).normalized()
    rotation = axis.to_track_quat("Z", "Y").to_matrix()

    # 안쪽 바닥까지 이어진 단면으로 속이 살짝 파인 닫힌 대나무를 만든다.
    profile = (
        (0.105, 0.0),
        (0.124, 0.025),
        (0.142, 0.27),
        (0.160, 0.32),
        (0.137, 0.345),
        (0.104, 0.325),
        (0.098, 0.245),
    )
    rings = [
        [
            base + rotation @ Vector((
                radius * math.cos(vertex * math.tau / 8),
                radius * math.sin(vertex * math.tau / 8),
                z + 0.012 * math.sin(index * 1.7),
            ))
            for vertex in range(8)
        ]
        for radius, z in profile
    ]

    loft(builder, "bamboo-" + str(index), rings, SLOTS["bamboo"])


def add_rope(builder, index):
    major_segments = 12
    minor_segments = 4
    radius = 0.262
    thickness = 0.041
    vertices = []

    for major in range(major_segments):
        theta = major * math.tau / major_segments
        for minor in range(minor_segments):
            phi = minor * math.tau / minor_segments
            r = radius + thickness * math.cos(phi)
            vertices.append((
                r * math.cos(theta),
                r * math.sin(theta),
                1.015
                + 0.082 * index
                + thickness * math.sin(phi)
                + 0.008 * math.sin(theta * 2 + index),
            ))

    faces = []
    for major in range(major_segments):
        following = (major + 1) % major_segments
        for minor in range(minor_segments):
            next_minor = (minor + 1) % minor_segments
            faces.append((
                major * minor_segments + minor,
                following * minor_segments + minor,
                following * minor_segments + next_minor,
                major * minor_segments + next_minor,
            ))

    builder.component(
        "rope-" + str(index), vertices, faces, SLOTS["rope"],
    )


def build_geometry():
    builder = Builder()
    tiers = (
        (
            "lower", SLOTS["leaf"],
            (-2.30, -1.15, 0, 1.15, 2.30),
            0.64, 1.30, 0.73,
        ),
        (
            "dry", SLOTS["dry"],
            (-1.91, -0.64, 0.64, 1.91),
            0.81, 1.15, 0.79,
        ),
        (
            "upper", SLOTS["leaf"],
            (-2.02, -0.67, 0.67, 2.02),
            0.98, 0.96, 0.85,
        ),
    )

    for tier_index, (
        label, slot, centers, z, length, width,
    ) in enumerate(tiers):
        for side in (-1, 1):
            for index, x in enumerate(centers):
                phase = (
                    index * 1.91
                    + tier_index * 0.81
                    + side * 0.36
                )
                add_leaf(
                    builder,
                    f"{label}-{side}-{index}",
                    (
                        x,
                        side * 0.055,
                        z - 0.11 * (x / 2.7) ** 2,
                    ),
                    (0.11 * x / 2.7, side),
                    length * (1 + 0.035 * math.sin(phase)),
                    width,
                    slot,
                    phase,
                )

        for side in (-1, 1):
            offsets = (-0.28, 0.28) if tier_index == 0 else (0,)
            for index, offset in enumerate(offsets):
                add_leaf(
                    builder,
                    f"{label}-hip-{side}-{index}",
                    (side * 2.25, offset, z - 0.09),
                    (side, offset * 1.4),
                    0.94 - 0.12 * tier_index,
                    0.55 - 0.02 * tier_index,
                    slot,
                    2.1 + side + tier_index + index,
                )

    add_ridge(builder)

    for index in range(3):
        add_bamboo(builder, index)
    for index in range(2):
        add_rope(builder, index)

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
        component_ids = set()

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
            part_id = part_ids.pop()
            assert part_id not in component_ids
            component_ids.add(part_id)

            volume = sum(
                face.verts[0].co.dot(
                    face.verts[1].co.cross(face.verts[2].co)
                ) / 6
                for face in component
            )
            assert abs(volume) > 1e-10

            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(component))

        assert component_ids == {
            part["id"] for part in builder.parts
        }
        bm.to_mesh(mesh)
    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()

    assert TRIANGLE_MIN <= len(mesh.loop_triangles) <= TRIANGLE_MAX
    assert len(mesh.loop_triangles) == 3180

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return mesh, builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")

    slot_attribute = mesh.attributes["palette_slot"]
    part_attribute = mesh.attributes["part_id"]
    parts = {part["id"]: part for part in builder.parts}
    used = set()
    part_triangles = Counter()

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False
        polygon.material_index = 0

        slot = slot_attribute.data[polygon.index].value
        part_id = part_attribute.data[polygon.index].value
        assert parts[part_id]["slot"] == slot

        used.add(slot)
        part_triangles[part_id] += 1

        for index in polygon.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert used == USED_SLOTS
    assert set(part_triangles) == set(parts)
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"

    leaf_parts = [
        part for part in builder.parts
        if part["name"].startswith(("lower-", "dry-", "upper-"))
        and not part["name"].endswith("-rib")
    ]
    assert len(leaf_parts) == 34
    assert sum(
        part["name"].endswith("-rib") for part in builder.parts
    ) == 34
    assert len(builder.parts) == 74

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
        "bbox_center": list((lower + upper) / 2),
        "blender_dimensions": list(upper - lower),
        "slots_used": sorted(used),
        "leaf_count": len(leaf_parts),
        "closed_components": len(builder.parts),
        "part_audit": [
            {
                **part,
                "triangles": part_triangles[part["id"]],
            }
            for part in builder.parts
        ],
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
        offset += size + 8

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
        math.isfinite(coordinate)
        for point in points for coordinate in point
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
    assert TRIANGLE_MIN <= triangles <= TRIANGLE_MAX
    assert triangles == len(source.loop_triangles) == 3180
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]

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
    assert pbr["baseColorTexture"].get("texCoord", 0) == 0
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
    shader = ground.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (0.72, 0.59, 0.40, 1)
    shader.inputs["Roughness"].default_value = 1
    floor_mesh.materials.append(ground)

    for label, position, energy, size in (
        ("key", (-4, -5, 7), 1100, 5),
        ("fill", (5, -2, 4), 600, 4),
        ("rim", (-2, 4, 6), 900, 4),
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
        vertex.co.copy() for vertex in clone.data.vertices
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
        prefix="palmRoof-preview-",
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
