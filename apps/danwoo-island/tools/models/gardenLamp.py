"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/gardenLamp.py

형상·UV·카메라 구성은 Blender 5.3 메모리 검사로 확인했습니다.
GLB 출력과 실제 비교 렌더는 스크립트 실행 시 수행합니다.
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
from mathutils.bvhtree import BVHTree


ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/props"

NAME = "gardenLamp"
TARGET = Vector((0.90, 0.90, 1.26))
GLASS_CENTER = Vector((0, 0, 0.21))
GLASS_SIZE = Vector((0.30, 0.30, 0.22))
GLASS_MIN = GLASS_CENTER - GLASS_SIZE / 2
GLASS_MAX = GLASS_CENTER + GLASS_SIZE / 2

EPSILON = 1e-5
PANEL_WIDTH = 1000
PANEL_HEIGHT = 1100

SLOTS = {
    "sand": 1,
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
    assert set(EXPECTED_RGB) == set(SLOTS.values())

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
    assert slot in SLOTS.values()
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
        vertices, faces = list(vertices), list(faces)
        slots = [slots] * len(faces) if isinstance(slots, int) else list(slots)
        assert len(faces) == len(slots)
        assert all(
            len(point) == 3 and all(math.isfinite(value) for value in point)
            for point in vertices
        )

        first = len(self.vertices)
        part_id = len(self.parts) + 1

        self.vertices.extend(tuple(point) for point in vertices)
        self.parts.append({
            "id": part_id,
            "name": name,
            "start": first,
            "count": len(vertices),
        })

        for face, slot in zip(faces, slots, strict=True):
            assert len(face) >= 3 and len(set(face)) == len(face)
            assert all(0 <= index < len(vertices) for index in face)
            assert slot in SLOTS.values()

            self.faces.append(tuple(first + index for index in face))
            self.slots.append(slot)
            self.face_parts.append(part_id)


def box(builder, name, center, size, slot, bevel=0.025):
    center, size = Vector(center), Vector(size)
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


def beam(builder, name, start, end, width, depth, slot):
    start, end = Vector(start), Vector(end)
    axis = end - start
    assert axis.length > 0

    center = (start + end) / 2
    rotation = axis.to_track_quat("Z", "Y").to_matrix()
    first = len(builder.vertices)

    box(
        builder, name, (0, 0, 0),
        (width, depth, axis.length), slot,
        min(width, depth) * 0.18,
    )
    for index in range(first, len(builder.vertices)):
        builder.vertices[index] = tuple(
            rotation @ Vector(builder.vertices[index]) + center
        )


def lathe(builder, name, center, rings, sides, slot):
    cx, cy = center
    assert sides >= 3 and len(rings) >= 2
    assert all(rx > 0 and ry > 0 for _, rx, ry in rings)
    assert all(a[0] < b[0] for a, b in zip(rings, rings[1:]))

    vertices = [
        (
            cx + rx * math.cos(index * math.tau / sides),
            cy + ry * math.sin(index * math.tau / sides),
            z,
        )
        for z, rx, ry in rings
        for index in range(sides)
    ]
    faces = [tuple(reversed(range(sides)))]

    for row in range(len(rings) - 1):
        for index in range(sides):
            following = (index + 1) % sides
            faces.append((
                row * sides + index,
                row * sides + following,
                (row + 1) * sides + following,
                (row + 1) * sides + index,
            ))

    faces.append(tuple(
        (len(rings) - 1) * sides + index for index in range(sides)
    ))
    builder.component(name, vertices, faces, slot)


def pebble(builder, name, center, size, slot):
    bm = bmesh.new()
    try:
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1)
        bm.verts.index_update()
        vertices = [
            tuple(Vector(center) + Vector(tuple(
                vertex.co[axis] * size[axis] / 2 for axis in range(3)
            )))
            for vertex in bm.verts
        ]
        faces = [
            tuple(vertex.index for vertex in face.verts) for face in bm.faces
        ]
        builder.component(name, vertices, faces, slot)
    finally:
        bm.free()


def leaf(builder, name, center, angle):
    outline = [
        (0, -0.105),
        (0.055, -0.045),
        (0.072, 0.025),
        (0, 0.135),
        (-0.072, 0.025),
        (-0.055, -0.045),
    ]
    cx, cy, cz = center
    vertices = []

    for dz in (-0.010, 0.010):
        for x, y in outline:
            vertices.append((
                cx + x * math.cos(angle) - y * math.sin(angle),
                cy + x * math.sin(angle) + y * math.cos(angle),
                cz + dz,
            ))

    count = len(outline)
    faces = [
        tuple(reversed(range(count))),
        tuple(range(count, 2 * count)),
    ]
    faces += [
        (
            index,
            (index + 1) % count,
            (index + 1) % count + count,
            index + count,
        )
        for index in range(count)
    ]
    builder.component(name, vertices, faces, SLOTS["leaf"])

    beam(
        builder, name + "-vein",
        (
            cx + 0.070 * math.sin(angle),
            cy - 0.070 * math.cos(angle),
            cz + 0.015,
        ),
        (
            cx - 0.090 * math.sin(angle),
            cy + 0.090 * math.cos(angle),
            cz + 0.015,
        ),
        0.014, 0.012, SLOTS["rib"],
    )


def shell(builder):
    sectors = 40
    radii = (0.14, 0.34, 0.56, 0.76, 0.93, 1.0)
    vertices = [(0, 0.45, 0.415)]

    for radius in radii:
        for index in range(sectors + 1):
            angle = -math.pi / 2 + math.pi * index / sectors
            ridge = math.sin(math.pi * (index % 4) / 4) ** 2
            scalloped_radius = radius * (
                1 - 0.034 * (1 - ridge) * radius ** 3
            )
            vertices.append((
                0.45 * scalloped_radius * math.sin(angle),
                0.45 - 0.90 * scalloped_radius * math.cos(angle),
                0.412
                + 0.15 * math.sin(math.pi * radius * 0.82)
                + 0.045 * radius * math.cos(angle)
                + 0.027 * radius * ridge,
            ))

    upper_count = len(vertices)
    vertices += [
        (x, y, z - (0.034 + 0.009 * (1 - (y + 0.45) / 0.90)))
        for x, y, z in vertices[:upper_count]
    ]

    # 조개만 맞추므로 유리용 공간과 프레임 좌표는 변하지 않습니다.
    lower, upper = bounds(vertices)
    vertices = [
        (
            (x - (lower.x + upper.x) / 2) * 0.90 / (upper.x - lower.x),
            (y - (lower.y + upper.y) / 2) * 0.90 / (upper.y - lower.y),
            0.383 + (z - lower.z) * (0.630 - 0.383) / (upper.z - lower.z),
        )
        for x, y, z in vertices
    ]

    def vertex_id(row, column):
        return 1 + row * (sectors + 1) + column

    bands = (
        SLOTS["cream"], SLOTS["coral"], SLOTS["cream"],
        SLOTS["mango"], SLOTS["cream"], SLOTS["cream"],
        SLOTS["mango"], SLOTS["cream"], SLOTS["coral"], SLOTS["cream"],
    )
    faces, slots = [], []

    for index in range(sectors):
        faces.append((0, vertex_id(0, index), vertex_id(0, index + 1)))
        slots.append(bands[index // 4])

    for row in range(len(radii) - 1):
        for index in range(sectors):
            faces.append((
                vertex_id(row, index),
                vertex_id(row + 1, index),
                vertex_id(row + 1, index + 1),
                vertex_id(row, index + 1),
            ))
            slots.append(
                SLOTS["teal"] if row == len(radii) - 2
                else bands[index // 4]
            )

    upper_faces = list(faces)
    faces += [
        tuple(index + upper_count for index in reversed(face))
        for face in upper_faces
    ]
    slots += [SLOTS["cream"]] * len(upper_faces)

    boundary = (
        [0]
        + [vertex_id(row, 0) for row in range(len(radii))]
        + [
            vertex_id(len(radii) - 1, index)
            for index in range(1, sectors + 1)
        ]
        + [
            vertex_id(row, sectors)
            for row in reversed(range(len(radii) - 1))
        ]
    )
    for index, first in enumerate(boundary):
        second = boundary[(index + 1) % len(boundary)]
        faces.append((
            first, second, second + upper_count, first + upper_count,
        ))
        slots.append(SLOTS["teal"])

    builder.component("scallop-roof", vertices, faces, slots)


def compose_geometry():
    builder = Builder()

    lathe(
        builder, "basalt-foot", (0, 0),
        [
            (-0.630, 0.305, 0.290),
            (-0.590, 0.375, 0.350),
            (-0.440, 0.390, 0.370),
            (-0.300, 0.330, 0.310),
            (-0.255, 0.230, 0.215),
        ],
        16, SLOTS["basalt"],
    )
    lathe(
        builder, "wood-plinth", (0, 0),
        [
            (-0.285, 0.170, 0.155),
            (-0.263, 0.190, 0.175),
            (-0.192, 0.180, 0.165),
            (-0.172, 0.155, 0.145),
        ],
        12, SLOTS["wood"],
    )
    lathe(
        builder, "bamboo-stem", (0, 0),
        [
            (-0.195, 0.090, 0.085),
            (-0.175, 0.104, 0.098),
            (0.025, 0.093, 0.088),
            (0.046, 0.082, 0.078),
        ],
        10, SLOTS["sand"],
    )

    for label, z in (("lower", -0.155), ("upper", 0.006)):
        lathe(
            builder, "cream-binding-" + label, (0, 0),
            [
                (z - 0.021, 0.093, 0.088),
                (z - 0.014, 0.112, 0.106),
                (z + 0.014, 0.112, 0.106),
                (z + 0.021, 0.093, 0.088),
            ],
            10, SLOTS["cream"],
        )

    for index, (center, size, slot) in enumerate((
        ((-0.255, -0.168, -0.320), (0.115, 0.095, 0.078), SLOTS["cream"]),
        ((0.258, -0.141, -0.330), (0.105, 0.088, 0.070), SLOTS["cream"]),
        ((0.135, 0.252, -0.332), (0.095, 0.075, 0.065), SLOTS["cream"]),
        ((-0.155, -0.277, -0.367), (0.081, 0.068, 0.055), SLOTS["pink"]),
    )):
        pebble(builder, "embedded-pebble-" + str(index), center, size, slot)

    leaf(builder, "left-leaf", (-0.190, 0.080, -0.241), -0.95)
    leaf(builder, "right-leaf", (0.185, 0.105, -0.242), 0.95)

    box(
        builder, "lower-plate",
        (0, 0, 0.060), (0.450, 0.450, 0.060), SLOTS["wood"], 0.012,
    )
    box(
        builder, "upper-plate",
        (0, 0, 0.357), (0.460, 0.460, 0.054), SLOTS["wood_light"], 0.010,
    )

    for ix, x in enumerate((-0.180, 0.180)):
        for iy, y in enumerate((-0.180, 0.180)):
            label = str(ix) + str(iy)
            box(
                builder, "corner-post-" + label,
                (x, y, 0.211), (0.038, 0.038, 0.286),
                SLOTS["sand"], 0.006,
            )
            for tag, z in (("bottom", 0.088), ("top", 0.333)):
                box(
                    builder, "corner-collar-" + label + "-" + tag,
                    (x, y, z), (0.055, 0.055, 0.024),
                    SLOTS["wood_light"], 0.004,
                )

    box(
        builder, "roof-crown-support",
        (0, 0, 0.480), (0.150, 0.150, 0.212),
        SLOTS["wood_light"], 0.015,
    )
    shell(builder)
    return builder


def check_clearance(points):
    lower, upper = bounds(points)
    # 구성요소 전체가 한 분리 평면 밖에 있어 내부 부피까지 비웁니다.
    assert any(
        upper[axis] < GLASS_MIN[axis] - EPSILON
        or lower[axis] > GLASS_MAX[axis] + EPSILON
        for axis in range(3)
    ), ("유리 공간 침범", tuple(lower), tuple(upper))


def check_roof_contact(mesh, builder):
    part_attribute = mesh.attributes["part_id"]
    trees = {}

    for name in ("roof-crown-support", "scallop-roof"):
        part = next(part for part in builder.parts if part["name"] == name)
        faces = [
            tuple(polygon.vertices)
            for polygon in mesh.polygons
            if part_attribute.data[polygon.index].value == part["id"]
        ]
        trees[name] = BVHTree.FromPolygons(
            [vertex.co for vertex in mesh.vertices],
            faces,
            all_triangles=True,
        )

    assert trees["roof-crown-support"].overlap(trees["scallop-roof"])


def build_geometry():
    builder = compose_geometry()

    for part in builder.parts:
        check_clearance(
            builder.vertices[part["start"]:part["start"] + part["count"]]
        )

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
            bm.faces, builder.face_parts, builder.slots, strict=True,
        ):
            face[part_layer] = part
            face[slot_layer] = slot

        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bmesh.ops.triangulate(
            bm, faces=list(bm.faces),
            quad_method="BEAUTY", ngon_method="EAR_CLIP",
        )
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

        assert all(
            edge.is_manifold and edge.is_contiguous for edge in bm.edges
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

            assert len({face[part_layer] for face in component}) == 1
            check_clearance(
                vertex.co for face in component for vertex in face.verts
            )

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
    assert 800 <= len(mesh.loop_triangles) <= 2400

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON

    floor_vertices = [
        vertex.co for vertex in mesh.vertices
        if abs(vertex.co.z + 0.630) < EPSILON
    ]
    assert len(floor_vertices) == 16
    floor_faces = [
        polygon for polygon in mesh.polygons
        if all(
            abs(mesh.vertices[index].co.z + 0.630) < EPSILON
            for index in polygon.vertices
        )
    ]
    assert len(floor_faces) == 14
    assert all(polygon.normal.z < -0.999 for polygon in floor_faces)

    check_roof_contact(mesh, builder)
    return mesh, builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")
    used = set()

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False
        polygon.material_index = 0
        slot = mesh.attributes["palette_slot"].data[polygon.index].value
        used.add(slot)

        for index in polygon.loop_indices:
            uv.data[index].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[index].uv) == slot

    assert used == set(SLOTS.values())
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
        "glass_center": list(GLASS_CENTER),
        "glass_size": list(GLASS_SIZE),
        "glass_clearance_checked": True,
        "flat_bottom_z": float(lower.z),
        "roof_support_contact_checked": True,
    }


def to_yup(point):
    return Vector((point.x, point.z, -point.y))


def from_yup(point):
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

    formats = {5121: "B", 5123: "H", 5125: "I", 5126: "f"}
    widths = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
    fmt = (
        "<" + formats[accessor["componentType"]] * widths[accessor["type"]]
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
        offset += size + 8

    assert offset == len(data)
    assert set(chunks) == {b"JSON", b"BIN\x00"}

    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    buffer, = document["buffers"]
    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]
    scene, = document["scenes"]

    assert "uri" not in buffer
    assert buffer["byteLength"] <= len(binary)
    assert scene["nodes"] == [0]
    assert document.get("scene", 0) == 0
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
        abs(Vector(normal).length - 1) < 1e-4 for normal in normals
    )
    for uv in uvs:
        uv_slot(uv)

    indices = [
        row[0] for row in accessor_rows(
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
            normal.dot(Vector(normals[index])) > 0 for index in ids
        )

        slot = uv_slot(uvs[ids[0]])
        assert all(uv_slot(uvs[index]) == slot for index in ids)
        check_clearance(from_yup(points[index]) for index in ids)
        actual[triangle_key(slot, (a, b, c))] += 1

    source = obj.data
    expected = Counter()

    for face in source.polygons:
        slot = uv_slot(source.uv_layers.active.data[face.loop_start].uv)
        expected[triangle_key(
            slot,
            (to_yup(source.vertices[index].co) for index in face.vertices),
        )] += 1

    assert actual == expected

    triangles = len(indices) // 3
    assert 800 <= triangles <= 2400
    assert triangles == len(source.loop_triangles)
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]

    lower, upper = bounds(points)
    assert (upper - lower - Vector((0.90, 1.26, 0.90))).length < EPSILON
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
    assert image["mimeType"] == "image/png" and "uri" not in image

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

    selected, = bpy.context.selected_objects
    assert selected == obj and selected.type == "MESH"
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
        export_extras=False,
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
    cameras, scales = [], []

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
        prefix="gardenLamp-preview-", dir=OUTPUT,
    ) as directory:
        paths = []
        for index, camera in enumerate(cameras):
            scene.camera = camera
            path = Path(directory) / f"panel-{index}.png"
            scene.render.filepath = str(path)
            result = bpy.ops.render.render(
                write_still=True, scene=scene.name,
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
    parser.add_argument("--samples", type=int, default=32)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    if args.samples < 1:
        parser.error("--samples는 양수여야 합니다.")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = NAME + "-export"

    material, colors = load_palette()
    mesh, builder = build_geometry()
    obj, metadata = finish_object(mesh, builder, material)

    assert len([
        item for item in bpy.context.scene.objects if item.type == "MESH"
    ]) == 1

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, metadata, colors)
    result["comparison"] = render_comparison(obj, args.samples)
    print(json.dumps(result, ensure_ascii=False, allow_nan=False))


if __name__ == "__main__":
    main()
