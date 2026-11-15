"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/bambooBucket.py

메모리 내 검증: 1,856삼각형, 닫힌 구성 요소 25개, GLB 직렬화·재검사 통과.
비교 렌더는 실행 시 생성한다.
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

NAME = "bambooBucket"
TARGET = Vector((0.70, 0.70, 0.80))
EPSILON = 1e-5
PANEL_WIDTH = 1000
PANEL_HEIGHT = 1100
STAVE_COUNT = 16
USED_SLOTS = {1, 3, 14}

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

        first = len(self.vertices)
        part_id = len(self.parts) + 1

        self.vertices.extend(tuple(point) for point in vertices)
        self.parts.append({
            "id": part_id,
            "name": name,
            "slot": slot,
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
        scale = [
            TARGET[axis] / (upper[axis] - lower[axis])
            for axis in range(3)
        ]

        self.vertices = [
            tuple(
                (point[axis] - center[axis]) * scale[axis]
                for axis in range(3)
            )
            for point in self.vertices
        ]


def revolve(
    builder,
    name,
    profile,
    slot,
    segments=12,
    center=(0, 0, 0),
    closed=False,
):
    center = Vector(center)
    assert segments >= 6 and len(profile) >= 2

    vertices = []
    rings = []
    faces = []

    for radius, height in profile:
        assert radius >= 0

        if radius == 0:
            rings.append([len(vertices)])
            vertices.append(tuple(center + Vector((0, 0, height))))
        else:
            ring = []

            for index in range(segments):
                angle = index * math.tau / segments
                ring.append(len(vertices))
                vertices.append(tuple(center + Vector((
                    radius * math.cos(angle),
                    radius * math.sin(angle),
                    height,
                ))))

            rings.append(ring)

    count = len(rings) if closed else len(rings) - 1

    for row in range(count):
        first = rings[row]
        second = rings[(row + 1) % len(rings)]
        assert not (len(first) == len(second) == 1)

        for index in range(segments):
            following = (index + 1) % segments

            if len(first) == 1:
                faces.append((first[0], second[following], second[index]))
            elif len(second) == 1:
                faces.append((first[index], first[following], second[0]))
            else:
                faces.append((
                    first[index],
                    first[following],
                    second[following],
                    second[index],
                ))

    if not closed:
        if len(rings[0]) > 1:
            faces.append(tuple(reversed(rings[0])))

        if len(rings[-1]) > 1:
            faces.append(tuple(rings[-1]))

    builder.component(name, vertices, faces, slot)


def stave(builder, index):
    angle = math.tau * index / STAVE_COUNT
    half = math.pi / STAVE_COUNT - 0.004
    top = 0.418 + 0.002 * math.sin(index * 2.31)

    vertices = []

    for z, inner, outer in (
        (0.024, 0.265, 0.318),
        (top, 0.282, 0.334),
    ):
        for radius, theta in (
            (outer, angle - half),
            (outer, angle + half),
            (inner, angle + half),
            (inner, angle - half),
        ):
            vertices.append((
                radius * math.cos(theta),
                radius * math.sin(theta),
                z,
            ))

    faces = [(3, 2, 1, 0), (4, 5, 6, 7)]
    faces.extend(
        (
            side,
            (side + 1) % 4,
            (side + 1) % 4 + 4,
            side + 4,
        )
        for side in range(4)
    )

    bm = bmesh.new()

    try:
        verts = [bm.verts.new(vertex) for vertex in vertices]

        for face in faces:
            bm.faces.new([verts[vertex] for vertex in face])

        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=0.005,
            segments=1,
            affect="EDGES",
            profile=0.5,
        )
        bm.verts.index_update()

        builder.component(
            f"bamboo-stave-{index:02d}",
            [tuple(vertex.co) for vertex in bm.verts],
            [
                tuple(vertex.index for vertex in face.verts)
                for face in bm.faces
            ],
            1,
        )

    finally:
        bm.free()


def tube(builder, name, path, radii, slot, segments=6):
    assert len(path) == len(radii) and len(path) >= 2

    points = [Vector(point) for point in path]
    vertices = []

    for row, (point, radius) in enumerate(zip(points, radii, strict=True)):
        tangent = (
            points[min(row + 1, len(points) - 1)]
            - points[max(row - 1, 0)]
        )
        tangent.normalize()

        side = Vector((0, 1, 0))
        side -= tangent * side.dot(tangent)
        assert side.length > 0.1
        side.normalize()

        normal = tangent.cross(side).normalized()

        for index in range(segments):
            angle = index * math.tau / segments
            vertices.append(tuple(
                point
                + radius * (
                    math.cos(angle) * side
                    + math.sin(angle) * normal
                )
            ))

    faces = [tuple(reversed(range(segments)))]

    for row in range(len(path) - 1):
        for index in range(segments):
            following = (index + 1) % segments
            faces.append((
                row * segments + index,
                row * segments + following,
                (row + 1) * segments + following,
                (row + 1) * segments + index,
            ))

    faces.append(tuple(
        (len(path) - 1) * segments + index
        for index in range(segments)
    ))

    builder.component(name, vertices, faces, slot)


def build_geometry():
    builder = Builder()

    for index in range(STAVE_COUNT):
        stave(builder, index)

    revolve(
        builder,
        "bucket-bottom",
        [
            (0, 0.018),
            (0.305, 0.018),
            (0.316, 0.028),
            (0.313, 0.057),
            (0, 0.057),
        ],
        1,
    )

    for name, z, inner, outer in (
        ("lower-wood-hoop", 0.103, 0.307, 0.338),
        ("upper-wood-hoop", 0.327, 0.320, 0.350),
    ):
        revolve(
            builder,
            name,
            [
                (inner, z - 0.028),
                (outer - 0.008, z - 0.028),
                (outer, z - 0.020),
                (outer, z + 0.020),
                (outer - 0.008, z + 0.028),
                (inner, z + 0.028),
            ],
            14,
            segments=16,
            closed=True,
        )

    pole_profile = [
        (0.027, 0.354),
        (0.036, 0.367),
        (0.036, 0.388),
        (0.028, 0.400),
        (0.028, 0.545),
        (0.035, 0.550),
        (0.035, 0.563),
        (0.027, 0.570),
        (0.027, 0.715),
        (0.037, 0.724),
        (0.037, 0.775),
        (0.030, 0.791),
        (0.020, 0.793),
    ]

    for label, x in (("left", -0.247), ("right", 0.247)):
        revolve(
            builder,
            "bamboo-handle-" + label,
            pole_profile,
            1,
            segments=8,
            center=(x, 0.040, 0),
        )

    tube(
        builder,
        "bamboo-handle-crossbar",
        [
            (-0.250, 0.040, 0.754),
            (-0.125, 0.040, 0.768),
            (0, 0.040, 0.772),
            (0.125, 0.040, 0.768),
            (0.250, 0.040, 0.754),
        ],
        [0.024, 0.026, 0.026, 0.026, 0.024],
        1,
    )

    revolve(
        builder,
        "water",
        [
            (0, 0.361),
            (0.279, 0.361),
            (0.279, 0.377),
            (0, 0.377),
        ],
        3,
    )

    revolve(
        builder,
        "ladle-cup",
        [
            (0, 0.383),
            (0.072, 0.383),
            (0.086, 0.392),
            (0.094, 0.479),
            (0.089, 0.501),
            (0.071, 0.501),
            (0.067, 0.486),
            (0.061, 0.414),
            (0, 0.414),
        ],
        1,
        segments=10,
        center=(0.045, -0.090, 0),
    )

    start = Vector((-0.235, -0.278, 0.414))
    end = Vector((0.320, -0.070, 0.555))
    direction = (end - start).normalized()

    tube(
        builder,
        "ladle-shaft",
        [
            start,
            start + direction * 0.009,
            end - direction * 0.009,
            end,
        ],
        [0.014, 0.021, 0.021, 0.014],
        1,
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

    assert 600 <= len(mesh.loop_triangles) <= 2000

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return mesh, builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")

    slots = mesh.attributes["palette_slot"]
    parts = mesh.attributes["part_id"]
    part_by_id = {
        part["id"]: part
        for part in builder.parts
    }

    used = set()
    counts = Counter()

    for face in mesh.polygons:
        assert len(face.vertices) == 3
        face.use_smooth = False

        slot = slots.data[face.index].value
        part = part_by_id[parts.data[face.index].value]

        assert slot == part["slot"]
        assert (slot == 3) == (part["name"] == "water")
        assert (slot == 14) == part["name"].endswith("-wood-hoop")

        counts[part["name"]] += 1
        used.add(slot)

        for index in face.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert used == USED_SLOTS
    assert len(counts) == len(builder.parts) == 25
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert len([
        item for item in bpy.context.scene.objects
        if item.type == "MESH"
    ]) == 1
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
        "slots_used": sorted(used),
        "closed_components": len(builder.parts),
        "triangles_by_part": dict(counts),
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
    assert 600 <= triangles <= 2000
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
        prefix="bambooBucket-preview-",
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
