"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python-exit-code 1 --python /absolute/path/to/ukuleleTable.py

형상 메모리 검증: 삼각형 1,976개, 닫힌 부품 59개, 치수·원점 중심 검사 통과.
파일 저장과 실제 렌더는 이 응답 작성 중 실행하지 않았습니다.
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

NAME = "ukuleleTable"
TARGET = Vector((1.20, 1.20, 0.55))
EPSILON = 1e-5
MIN_TRIANGLES = 800
MAX_TRIANGLES = 2400
PANEL_WIDTH = 1000
PANEL_HEIGHT = 1100

SLOTS = {
    "bamboo": 1,
    "wood": 14,
    "basalt": 5,
    "cream": 23,
}
USED_SLOTS = set(SLOTS.values())

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
        color = tuple(rows[2][offset:offset + 3])
        colors.append(color)



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
        vertices = [tuple(point) for point in vertices]
        assert vertices
        assert all(
            math.isfinite(coordinate)
            for point in vertices for coordinate in point
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
            assert len(set(face)) == len(face)
            assert min(face) >= 0 and max(face) < len(vertices)

            self.faces.append(tuple(first + index for index in face))
            self.slots.append(slot)
            self.face_parts.append(part_id)

    def fit(self):
        lower, upper = bounds(self.vertices)
        span = upper - lower
        assert min(span) > 0
        center = (lower + upper) / 2
        factor = Vector(tuple(TARGET[axis] / span[axis] for axis in range(3)))

        self.vertices = [
            tuple(
                (Vector(point) - center)[axis] * factor[axis]
                for axis in range(3)
            )
            for point in self.vertices
        ]


def box(builder, name, center, size, slot, bevel=0.025):
    center = Vector(center)
    size = Vector(size)
    assert min(size) > 0

    bm = bmesh.new()

    try:
        bmesh.ops.create_cube(bm, size=1.0)

        for vertex in bm.verts:
            vertex.co = Vector(tuple(
                vertex.co[axis] * size[axis] for axis in range(3)
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
            [tuple(vertex.co + center) for vertex in bm.verts],
            [tuple(vertex.index for vertex in face.verts) for face in bm.faces],
            slot,
        )
    finally:
        bm.free()


def cylinder(builder, name, start, end, radii, slot, segments=8, bevel=0.0):
    start, end = Vector(start), Vector(end)
    axis = end - start
    length = axis.length
    rx, ry = radii
    assert length > 0 and min(rx, ry) > 0 and segments >= 4
    rotation = axis.to_track_quat("Z", "Y").to_matrix()

    if bevel:
        bevel = min(bevel, min(rx, ry) * 0.35, length * 0.24)
        rings = (
            (0, rx - bevel, ry - bevel),
            (bevel, rx, ry),
            (length - bevel, rx, ry),
            (length, rx - bevel, ry - bevel),
        )
    else:
        rings = ((0, rx, ry), (length, rx, ry))

    vertices = [
        tuple(start + rotation @ Vector((
            a * math.cos(i * math.tau / segments),
            b * math.sin(i * math.tau / segments),
            z,
        )))
        for z, a, b in rings for i in range(segments)
    ]
    faces = [tuple(reversed(range(segments)))]

    for row in range(len(rings) - 1):
        for i in range(segments):
            j = (i + 1) % segments
            faces.append((
                row * segments + i,
                row * segments + j,
                (row + 1) * segments + j,
                (row + 1) * segments + i,
            ))

    faces.append(tuple(
        (len(rings) - 1) * segments + i for i in range(segments)
    ))
    builder.component(name, vertices, faces, slot)


def slab(builder, name, profile, bottom, top, slot, bevel=0.0):
    assert bottom < top
    center = Vector((
        sum(x for x, y in profile) / len(profile),
        sum(y for x, y in profile) / len(profile),
    ))
    lower, upper = bounds((x, y, 0) for x, y in profile)
    span = upper - lower

    if bevel:
        assert bevel * 2 < min(span.x, span.y, top - bottom)
        inner = [
            tuple(center + Vector((
                (x - center.x) * (1 - 2 * bevel / span.x),
                (y - center.y) * (1 - 2 * bevel / span.y),
            )))
            for x, y in profile
        ]
        rings = (
            (inner, bottom),
            (profile, bottom + bevel),
            (profile, top - bevel),
            (inner, top),
        )
    else:
        rings = ((profile, bottom), (profile, top))

    count = len(profile)
    vertices = [(x, y, z) for ring, z in rings for x, y in ring]
    faces = [tuple(reversed(range(count)))]

    for row in range(len(rings) - 1):
        for i in range(count):
            j = (i + 1) % count
            faces.append((
                row * count + i,
                row * count + j,
                (row + 1) * count + j,
                (row + 1) * count + i,
            ))

    faces.append(tuple(
        (len(rings) - 1) * count + i for i in range(count)
    ))
    builder.component(name, vertices, faces, slot)


def rosette(builder):
    vertices = []

    for i in range(12):
        angle = math.tau * i / 12

        for j in range(4):
            cross = math.tau * j / 4
            radius = 0.052 + 0.004 * math.cos(cross)
            vertices.append((
                radius * math.cos(angle),
                0.045 + radius * math.sin(angle),
                0.519 + 0.003 * math.sin(cross),
            ))

    faces = []

    for i in range(12):
        for j in range(4):
            faces.append((
                i * 4 + j,
                ((i + 1) % 12) * 4 + j,
                ((i + 1) % 12) * 4 + (j + 1) % 4,
                i * 4 + (j + 1) % 4,
            ))

    builder.component("ukulele-rosette", vertices, faces, 1)


def populate(builder):
    for i in range(7):
        x = (i - 3) * 0.1715
        cylinder(
            builder, f"table-slat-{i}",
            (x, -0.60, 0.395), (x, 0.60, 0.395),
            (0.082, 0.047), 1, bevel=0.012,
        )

    corners = (
        (-0.45, -0.45),
        (0.45, -0.45),
        (-0.45, 0.45),
        (0.45, 0.45),
    )

    for i, (x, y) in enumerate(corners):
        cylinder(
            builder, f"table-leg-{i}",
            (x, y, 0), (x, y, 0.375),
            (0.069, 0.069), 1, bevel=0.014,
        )

        for j, z in enumerate((0.105, 0.321)):
            cylinder(
                builder, f"leg-node-{i}-{j}",
                (x, y, z - 0.013), (x, y, z + 0.013),
                (0.078, 0.078), 1,
            )

        outside_y = y + math.copysign(0.077, y)

        for j, sign in enumerate((-1, 1)):
            cylinder(
                builder, f"rope-x-{i}-{j}",
                (x - 0.055, outside_y, 0.277 if sign < 0 else 0.366),
                (x + 0.055, outside_y, 0.366 if sign < 0 else 0.277),
                (0.012, 0.012), 14, segments=5,
            )

        cylinder(
            builder, f"rope-knot-{i}",
            (x, outside_y - 0.013, 0.322),
            (x, outside_y + 0.013, 0.322),
            (0.020, 0.020), 14, segments=6,
        )

    for i, y in enumerate((-0.45, 0.45)):
        cylinder(
            builder, f"apron-x-{i}",
            (-0.47, y, 0.337), (0.47, y, 0.337),
            (0.038, 0.038), 1,
        )

    for i, x in enumerate((-0.45, 0.45)):
        cylinder(
            builder, f"apron-y-{i}",
            (x, -0.47, 0.337), (x, 0.47, 0.337),
            (0.038, 0.038), 1,
        )

    first = len(builder.vertices)
    profile = [
        (0, -0.340),
        (0.080, -0.329),
        (0.140, -0.297),
        (0.170, -0.244),
        (0.174, -0.190),
        (0.155, -0.132),
        (0.112, -0.080),
        (0.087, -0.031),
        (0.100, 0.014),
        (0.127, 0.058),
        (0.123, 0.104),
        (0.080, 0.151),
        (0, 0.166),
        (-0.080, 0.151),
        (-0.123, 0.104),
        (-0.127, 0.058),
        (-0.100, 0.014),
        (-0.087, -0.031),
        (-0.112, -0.080),
        (-0.155, -0.132),
        (-0.174, -0.190),
        (-0.170, -0.244),
        (-0.140, -0.297),
        (-0.080, -0.329),
    ]

    slab(
        builder, "ukulele-body",
        profile, 0.444, 0.516, 14, 0.012,
    )
    box(
        builder, "ukulele-neck",
        (0, 0.270, 0.493), (0.075, 0.332, 0.047),
        14, 0.008,
    )
    box(
        builder, "ukulele-fretboard",
        (0, 0.270, 0.521), (0.067, 0.326, 0.012),
        5, 0.002,
    )
    slab(
        builder, "ukulele-headstock",
        [
            (-0.039, 0.412),
            (0.039, 0.412),
            (0.061, 0.525),
            (0.045, 0.558),
            (-0.045, 0.558),
            (-0.061, 0.525),
        ],
        0.488, 0.525, 14, 0.006,
    )

    # 구멍은 얇은 닫힌 현무암색 볼륨으로 표현한다.
    cylinder(
        builder, "ukulele-soundhole",
        (0, 0.045, 0.5165), (0, 0.045, 0.5185),
        (0.049, 0.049), 5, segments=12,
    )
    rosette(builder)

    box(
        builder, "ukulele-bridge",
        (0, -0.209, 0.525), (0.131, 0.035, 0.021),
        14, 0.004,
    )
    box(
        builder, "ukulele-saddle",
        (0, -0.209, 0.537), (0.088, 0.008, 0.006),
        23, 0,
    )
    box(
        builder, "ukulele-nut",
        (0, 0.419, 0.531), (0.074, 0.010, 0.009),
        23, 0,
    )

    for i in range(6):
        y = 0.149 + i * 0.044
        box(
            builder, f"ukulele-fret-{i}",
            (0, y, 0.528), (0.066, 0.0035, 0.003),
            23, 0,
        )

    for i, x in enumerate((-0.024, -0.008, 0.008, 0.024)):
        cylinder(
            builder, f"ukulele-string-{i}",
            (x, -0.223, 0.541), (x, 0.513, 0.537),
            (0.0016, 0.0016), 23, segments=4,
        )

    tuners = (
        (-1, 0.465),
        (1, 0.465),
        (-1, 0.518),
        (1, 0.518),
    )

    for i, (side, y) in enumerate(tuners):
        cylinder(
            builder, f"ukulele-tuner-{i}",
            (side * 0.047, y, 0.507),
            (side * 0.080, y, 0.507),
            (0.012, 0.017), 23, segments=6,
        )

    angle = math.radians(-42)

    for i in range(first, len(builder.vertices)):
        x, y, z = builder.vertices[i]
        builder.vertices[i] = (
            math.cos(angle) * x - math.sin(angle) * y - 0.08,
            math.sin(angle) * x + math.cos(angle) * y - 0.04,
            z,
        )

    box(
        builder, "surf-wax",
        (0.365, -0.285, 0.477), (0.153, 0.133, 0.068),
        23, 0.013,
    )


def build_geometry():
    builder = Builder()
    populate(builder)
    builder.fit()

    names = [part["name"] for part in builder.parts]
    assert sum(name.startswith("table-leg-") for name in names) == 4
    assert sum(name.startswith("ukulele-string-") for name in names) == 4
    assert sum(name.startswith("rope-x-") for name in names) == 8
    assert names.count("surf-wax") == 1

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
            bm.faces, builder.face_parts, builder.slots, strict=True,
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

        assert all(edge.is_manifold and edge.is_contiguous for edge in bm.edges)
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

            assert len({face[part_layer] for face in component}) == 1
            assert len({face[slot_layer] for face in component}) == 1

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
    assert MIN_TRIANGLES <= len(mesh.loop_triangles) <= MAX_TRIANGLES

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    return mesh, builder, volumes


def finish_object(mesh, builder, volumes, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")
    slot_attribute = mesh.attributes["palette_slot"]
    part_attribute = mesh.attributes["part_id"]
    parts = {part["id"]: part for part in builder.parts}

    used = set()
    triangles_by_part = Counter()

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False

        slot = slot_attribute.data[polygon.index].value
        part_id = part_attribute.data[polygon.index].value
        part = parts[part_id]

        assert slot == part["slot"]
        used.add(slot)
        triangles_by_part[part["name"]] += 1

        for index in polygon.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert used == USED_SLOTS
    assert set(triangles_by_part) == {part["name"] for part in builder.parts}
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert obj.location.length == 0
    assert obj.rotation_euler.to_matrix().is_identity
    assert tuple(obj.scale) == (1, 1, 1)
    assert not obj.modifiers
    assert len(bpy.context.scene.objects) == 1
    assert obj.type == "MESH"

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    assert (obj.dimensions - TARGET).length < EPSILON

    return obj, {
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "blender_dimensions": list(upper - lower),
        "bbox_center": list((lower + upper) / 2),
        "slots_used": sorted(used),
        "closed_components": len(volumes),
        "minimum_component_volume": min(volumes),
        "table_legs": 4,
        "ukulele_strings": 4,
        "ukulele_rotation_z_degrees": -42,
        "triangles_by_part": dict(sorted(triangles_by_part.items())),
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
        + formats[accessor["componentType"]] * widths[accessor["type"]]
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
    assert set(attributes) == {"POSITION", "NORMAL", "TEXCOORD_0"}

    points = [
        Vector(point)
        for point in accessor_rows(document, binary, attributes["POSITION"])
    ]
    normals = accessor_rows(document, binary, attributes["NORMAL"])
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])

    assert len(points) == len(normals) == len(uvs)
    assert all(
        math.isfinite(coordinate)
        for point in points for coordinate in point
    )
    assert all(abs(Vector(normal).length - 1) < 1e-4 for normal in normals)

    for uv in uvs:
        uv_slot(uv)

    indices = [
        row[0] for row in accessor_rows(document, binary, primitive["indices"])
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

    expected = Counter()
    source = obj.data

    for face in source.polygons:
        slot = uv_slot(source.uv_layers.active.data[face.loop_start].uv)
        expected[triangle_key(
            slot,
            (to_yup(source.vertices[index].co) for index in face.vertices),
        )] += 1

    assert actual == expected

    triangles = len(indices) // 3
    assert MIN_TRIANGLES <= triangles <= MAX_TRIANGLES
    assert triangles == len(source.loop_triangles)
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]

    lower, upper = bounds(points)
    yup_dimensions = Vector((TARGET.x, TARGET.z, TARGET.y))
    assert (upper - lower - yup_dimensions).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    assert (
        to_yup(Vector(metadata["front_blender"])) - Vector((0, 0, 1))
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
            str(slot): "#" + "".join(f"{channel:02X}" for channel in colors[slot])
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

        camera = bpy.data.objects.new(label, bpy.data.cameras.new(label))
        scene.collection.objects.link(camera)
        camera.data.type = "ORTHO"
        camera.data.clip_start = 0.01
        camera.data.clip_end = 100
        camera.data.ortho_scale = 1
        camera.location = target + direction * 12
        camera.rotation_euler = rotation.to_euler()

        frame_lower, frame_upper = bounds(camera.data.view_frame(scene=scene))
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
        cameras[0].data.ortho_scale - cameras[1].data.ortho_scale
    ) < EPSILON

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
        for left_row, right_row in zip(left_rows, right_rows, strict=True)
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
    parser.add_argument("--samples", type=int, default=32)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)

    if args.samples < 1:
        parser.error("--samples는 양수여야 합니다.")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = NAME + "-export"

    material, colors = load_palette()
    mesh, builder, volumes = build_geometry()
    obj, metadata = finish_object(mesh, builder, volumes, material)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, metadata, colors)
    result["comparison"] = render_comparison(obj, args.samples)

    assert (OUTPUT / "ukuleleTable.glb").is_file()
    assert (OUTPUT / "ukuleleTable.png").is_file()

    print(json.dumps(result, ensure_ascii=False, allow_nan=False))


if __name__ == "__main__":
    main()
