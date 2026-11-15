"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python-exit-code 1 --python /absolute/path/to/tikiTotem.py

Blender 5.3 메모리 검증: 3,276개 삼각형, 71개 닫힌 부품.
GLB 내보내기와 비교 렌더의 파일 검사는 스크립트 실행 시 수행한다.
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

NAME = "tikiTotem"
TARGET = Vector((0.90, 0.90, 3.20))
EPSILON = 1e-5
PANEL_WIDTH = 1000
PANEL_HEIGHT = 1100

USED_SLOTS = {1, 3, 5, 9, 10, 11, 12, 14, 17, 18, 23}
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
        raise RuntimeError("빈 형상입니다.")

    return (
        Vector(tuple(min(point[i] for point in points) for i in range(3))),
        Vector(tuple(max(point[i] for point in points) for i in range(3))),
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
    raw = zlib.decompress(
        b"".join(payload for kind, payload in chunks if kind == b"IDAT")
    )
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
        # 칸 경계의 혼색을 피하기 위해 중앙 픽셀만 읽는다.
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
    material.use_backface_culling = True

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
        self.face_parts = []
        self.parts = []

    def component(self, name, vertices, faces, slot):
        assert name not in {part["name"] for part in self.parts}
        assert slot in USED_SLOTS

        first = len(self.vertices)
        part_id = len(self.parts) + 1
        self.vertices.extend(tuple(point) for point in vertices)
        self.parts.append({"id": part_id, "name": name, "slot": slot})

        for face in faces:
            assert len(face) >= 3
            assert len(set(face)) == len(face)
            assert all(0 <= index < len(vertices) for index in face)

            self.faces.append(tuple(first + index for index in face))
            self.slots.append(slot)
            self.face_parts.append(part_id)

    def fit(self):
        lower, upper = bounds(self.vertices)
        center = (lower + upper) / 2
        factor = Vector(tuple(
            TARGET[i] / (upper[i] - lower[i])
            for i in range(3)
        ))

        self.vertices = [
            tuple(
                (point[i] - center[i]) * factor[i]
                for i in range(3)
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
        for i in range(count):
            j = (i + 1) % count
            faces.append((
                layer * count + i,
                layer * count + j,
                (layer + 1) * count + j,
                (layer + 1) * count + i,
            ))

    faces.append(tuple(
        (len(layers) - 1) * count + i
        for i in range(count)
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
                vertex.co[i] * size[i]
                for i in range(3)
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

    for i in range(first, len(builder.vertices)):
        builder.vertices[i] = tuple(
            rotation @ Vector(builder.vertices[i]) + center
        )


def ellipse(builder, name, center, radii, depth, slot, segments=20):
    x, y, z = center
    rx, rz = radii
    profile = [
        (
            x + rx * math.cos(i * math.tau / segments),
            z + rz * math.sin(i * math.tau / segments),
        )
        for i in range(segments)
    ]
    solid(builder, name, profile, y - depth / 2, y + depth / 2, slot)


def drum(builder, name, center_z, width, depth, height, slot):
    x, y = width / 2, depth / 2
    cut = min(width, depth) * 0.19
    outline = [
        (-x + cut, -y),
        (x - cut, -y),
        (x, -y + cut),
        (x, y - cut),
        (x - cut, y),
        (-x + cut, y),
        (-x, y - cut),
        (-x, -y + cut),
    ]

    bevel = min(0.045, height * 0.21)
    layers = [
        (-height / 2, 0.91),
        (-height / 2 + bevel, 1.0),
        (0, 1.012),
        (height / 2 - bevel, 0.98),
        (height / 2, 0.89),
    ]

    vertices = [
        (px * scale, py * scale, center_z + z)
        for z, scale in layers
        for px, py in outline
    ]
    faces = [tuple(reversed(range(8)))]

    for row in range(len(layers) - 1):
        for i in range(8):
            j = (i + 1) % 8
            faces.append((
                row * 8 + i,
                row * 8 + j,
                (row + 1) * 8 + j,
                (row + 1) * 8 + i,
            ))

    faces.append(tuple(
        (len(layers) - 1) * 8 + i
        for i in range(8)
    ))
    builder.component(name, vertices, faces, slot)


def face_parts(builder, tier, z):
    label = ("smile", "surprised", "tongue")[tier]
    prefix = f"face-{tier}-{label}"

    for side in (-1, 1):
        suffix = "left" if side < 0 else "right"
        x = side * 0.155

        if tier == 0:
            beam(
                builder,
                prefix + "-brow-" + suffix,
                (side * 0.065, -0.363, z + 0.17),
                (side * 0.255, -0.363, z + 0.21),
                0.070, 0.075, 11,
            )

            for k, (a, b) in enumerate((
                ((x - 0.065, z + 0.045), (x, z + 0.095)),
                ((x, z + 0.095), (x + 0.065, z + 0.045)),
            )):
                beam(
                    builder,
                    prefix + f"-eye-{suffix}-{k}",
                    (a[0], -0.377, a[1]),
                    (b[0], -0.377, b[1]),
                    0.031, 0.040, 5,
                )
        else:
            beam(
                builder,
                prefix + "-brow-" + suffix,
                (
                    side * 0.070,
                    -0.365,
                    z + (0.26 if tier == 1 else 0.24),
                ),
                (
                    side * 0.255,
                    -0.365,
                    z + (0.23 if tier == 1 else 0.17),
                ),
                0.065, 0.075, 11,
            )
            ellipse(
                builder,
                prefix + "-socket-" + suffix,
                (x, -0.350, z + 0.080),
                (0.092, 0.105), 0.065, 11, 12,
            )
            ellipse(
                builder,
                prefix + "-eye-" + suffix,
                (x, -0.389, z + 0.080),
                (0.059, 0.073 if tier == 1 else 0.057),
                0.032, 5, 12,
            )

            if tier == 2:
                ellipse(
                    builder,
                    prefix + "-glint-" + suffix,
                    (x - 0.013, -0.410, z + 0.098),
                    (0.018, 0.022), 0.015, 23, 8,
                )

        solid(
            builder,
            prefix + "-cheek-" + suffix,
            [
                (side * 0.265, z - 0.015),
                (side * 0.305, z - 0.065),
                (side * 0.265, z - 0.110),
                (side * 0.225, z - 0.065),
            ],
            -0.348, -0.303, 11, 0.006,
        )

    solid(
        builder,
        prefix + "-nose",
        [
            (-0.068, z - 0.035),
            (0.068, z - 0.035),
            (0.047, z + 0.105),
            (0, z + 0.151),
            (-0.047, z + 0.105),
        ],
        -0.465, -0.305, 11, 0.018,
    )

    if tier == 0:
        outer = [
            (-0.231, -0.105),
            (-0.188, -0.230),
            (-0.101, -0.289),
            (0, -0.303),
            (0.101, -0.289),
            (0.188, -0.230),
            (0.231, -0.105),
            (0.128, -0.135),
            (0, -0.148),
            (-0.128, -0.135),
        ]
        inner = [
            (-0.181, -0.147),
            (-0.136, -0.226),
            (0, -0.262),
            (0.136, -0.226),
            (0.181, -0.147),
            (0, -0.174),
        ]

        solid(
            builder,
            prefix + "-mouth-coral",
            [(x, z + h) for x, h in outer],
            -0.383, -0.310, 10, 0.009,
        )
        solid(
            builder,
            prefix + "-mouth-shadow",
            [(x, z + h) for x, h in inner],
            -0.397, -0.375, 5,
        )

        for i, x in enumerate((-0.044, 0.044)):
            box(
                builder,
                prefix + f"-tooth-{i}",
                (x, -0.414, z - 0.185),
                (0.075, 0.030, 0.055), 23, 0.008,
            )

    elif tier == 1:
        ellipse(
            builder,
            prefix + "-mouth-coral",
            (0, -0.353, z - 0.191),
            (0.123, 0.148), 0.090, 10, 16,
        )
        ellipse(
            builder,
            prefix + "-mouth-shadow",
            (0, -0.405, z - 0.191),
            (0.077, 0.105), 0.022, 5, 16,
        )

    else:
        ellipse(
            builder,
            prefix + "-mouth-coral",
            (0, -0.359, z - 0.153),
            (0.205, 0.119), 0.090, 10, 16,
        )
        ellipse(
            builder,
            prefix + "-mouth-shadow",
            (0, -0.410, z - 0.148),
            (0.157, 0.075), 0.026, 5, 16,
        )

        tongue = [
            (-0.090, z - 0.170),
            (0.090, z - 0.170),
            (0.085, z - 0.292),
            (0.049, z - 0.334),
            (-0.049, z - 0.334),
            (-0.085, z - 0.292),
        ]
        solid(
            builder,
            prefix + "-tongue",
            tongue,
            -0.487, -0.396, 10, 0.012,
        )
        beam(
            builder,
            prefix + "-tongue-crease",
            (0, -0.497, z - 0.207),
            (0, -0.497, z - 0.287),
            0.012, 0.016, 17,
        )


def palm_leaf(builder, index, angle, length, lift):
    radial = Vector((math.cos(angle), math.sin(angle), 0))
    tangent = Vector((-radial.y, radial.x, 0))
    root = Vector((0, 0, 2.665))

    path = [
        (0, 0.027, 0.0),
        (0.24, 0.090, 0.25),
        (0.52, 0.105, 0.43),
        (0.79, 0.062, 0.36),
        (1, 0.006, 0.20),
    ]

    def strip(name, slot, width_scale, offset):
        vertices = []

        for t, width, rise in path:
            point = (
                root
                + radial * (t * length)
                + Vector((0, 0, rise * lift + offset))
            )
            vertices.extend((
                tuple(point - tangent * width * width_scale),
                tuple(point + Vector((0, 0, 0.027 * width_scale))),
                tuple(point + tangent * width * width_scale),
                tuple(point - Vector((0, 0, 0.019 * width_scale))),
            ))

        faces = [(3, 2, 1, 0)]

        for row in range(len(path) - 1):
            for i in range(4):
                j = (i + 1) % 4
                faces.append((
                    row * 4 + i,
                    row * 4 + j,
                    (row + 1) * 4 + j,
                    (row + 1) * 4 + i,
                ))

        faces.append(tuple(
            (len(path) - 1) * 4 + i
            for i in range(4)
        ))
        builder.component(name, vertices, faces, slot)

    strip(f"crown-leaf-{index}", 9, 1.0, 0)
    strip(f"crown-rib-{index}", 12, 0.12, 0.028)


def crown_flower(builder):
    center = Vector((0.10, 2.84))

    for i in range(5):
        angle = math.pi / 2 + i * math.tau / 5
        radial = Vector((math.cos(angle), math.sin(angle)))
        tangent = Vector((-radial.y, radial.x))
        shape = [
            (0.024, -0.024),
            (0.100, -0.071),
            (0.173, -0.052),
            (0.198, 0),
            (0.173, 0.052),
            (0.100, 0.071),
            (0.024, 0.024),
        ]
        profile = [
            tuple(center + radial * along + tangent * across)
            for along, across in shape
        ]

        solid(
            builder,
            f"flower-mango-petal-{i}",
            profile,
            -0.385 - 0.002 * i,
            -0.333 - 0.002 * i,
            18, 0.008,
        )

    ellipse(
        builder,
        "flower-center",
        (center.x, -0.420, center.y),
        (0.047, 0.048), 0.045, 1, 12,
    )


def make_parts():
    builder = Builder()

    drum(builder, "wood-plinth", 0.105, 0.79, 0.73, 0.21, 14)

    for tier, z in enumerate((0.56, 1.40, 2.24)):
        drum(
            builder,
            f"wood-head-{tier}",
            z, 0.73, 0.64, 0.83, 14,
        )
        drum(
            builder,
            f"turquoise-band-{tier}",
            z - 0.363, 0.753, 0.665, 0.085, 3,
        )
        face_parts(builder, tier, z)

    for i, z in enumerate((0.985, 1.825, 2.665)):
        drum(
            builder,
            f"wood-collar-{i}",
            z, 0.775, 0.69, 0.095, 11,
        )

    lengths = (0.43, 0.46, 0.47, 0.44, 0.43, 0.46, 0.47, 0.44)
    lifts = (1.04, 0.90, 1.08, 0.97, 1.12, 0.95, 1.03, 0.92)

    for i in range(8):
        palm_leaf(
            builder,
            i,
            -math.pi / 2 + i * math.tau / 8,
            lengths[i],
            lifts[i],
        )

    crown_flower(builder)
    builder.fit()
    return builder


def assemble(builder):
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
        seen_parts = set()

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

            part, = {face[part_layer] for face in component}
            assert part not in seen_parts
            seen_parts.add(part)

            volume = sum(
                face.verts[0].co.dot(
                    face.verts[1].co.cross(face.verts[2].co)
                ) / 6
                for face in component
            )
            assert abs(volume) > 1e-10

            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(component))

        assert seen_parts == {part["id"] for part in builder.parts}
        bm.to_mesh(mesh)
    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()

    assert 1500 <= len(mesh.loop_triangles) <= 4000, len(mesh.loop_triangles)

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert (upper - lower - TARGET).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    return mesh


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")

    slot_attribute = mesh.attributes["palette_slot"]
    part_attribute = mesh.attributes["part_id"]
    parts = {part["id"]: part for part in builder.parts}
    audits = {
        part["id"]: {
            "name": part["name"],
            "slot": part["slot"],
            "triangles": 0,
            "min_z": float("inf"),
            "max_z": -float("inf"),
        }
        for part in builder.parts
    }

    used = set()
    face_ranges = [
        [float("inf"), -float("inf")]
        for _ in range(3)
    ]
    leaf_minimum = float("inf")

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False
        assert polygon.material_index == 0

        slot = slot_attribute.data[polygon.index].value
        part_id = part_attribute.data[polygon.index].value
        part = parts[part_id]
        assert slot == part["slot"]
        used.add(slot)

        points = [mesh.vertices[i].co for i in polygon.vertices]
        minimum = min(point.z for point in points)
        maximum = max(point.z for point in points)

        audit = audits[part_id]
        audit["triangles"] += 1
        audit["min_z"] = min(audit["min_z"], minimum)
        audit["max_z"] = max(audit["max_z"], maximum)

        if part["name"].startswith("face-"):
            tier = int(part["name"].split("-")[1])
            face_ranges[tier][0] = min(face_ranges[tier][0], minimum)
            face_ranges[tier][1] = max(face_ranges[tier][1], maximum)
            assert all(point.y < -0.15 for point in points)

        if part["name"].startswith("crown-leaf-"):
            leaf_minimum = min(leaf_minimum, minimum)

        for i in polygon.loop_indices:
            uv.data[i].uv = ((slot + 0.5) / 32, 0.5)
            assert uv_slot(uv.data[i].uv) == slot

    assert used == USED_SLOTS
    assert all(audit["triangles"] > 0 for audit in audits.values())
    assert (
        face_ranges[0][1]
        < face_ranges[1][0]
        < face_ranges[1][1]
        < face_ranges[2][0]
    )
    assert leaf_minimum > face_ranges[2][1]
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
        "slots_used": sorted(used),
        "closed_components": len(builder.parts),
        "face_order_bottom_to_top": ["smile", "surprised", "tongue"],
        "face_z_ranges": face_ranges,
        "parts": list(audits.values()),
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
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(count)
    ]


def verify_glb(path, obj, metadata, colors):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (b"glTF", 2, len(data))

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
    assert not primitive.get("targets")
    assert not primitive.get("extensions")

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
        for point in points
        for coordinate in point
    )
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

        a, b, c = (points[i] for i in ids)
        normal = (b - a).cross(c - a)
        assert normal.length > 2e-10
        assert all(normal.dot(Vector(normals[i])) > 0 for i in ids)

        slot = uv_slot(uvs[ids[0]])
        assert all(uv_slot(uvs[i]) == slot for i in ids)
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
                to_yup(source.vertices[i].co)
                for i in face.vertices
            ),
        )] += 1

    assert actual == expected

    triangles = len(indices) // 3
    assert 1500 <= triangles <= 4000
    assert triangles == len(source.loop_triangles)
    assert sorted({key[0] for key in actual}) == metadata["slots_used"]

    lower, upper = bounds(points)
    yup_dimensions = Vector((TARGET.x, TARGET.z, TARGET.y))
    assert (upper - lower - yup_dimensions).length < EPSILON
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
    assert abs(pbr.get("roughnessFactor", 1) - 0.80) < EPSILON

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
    assert [
        item for item in bpy.context.scene.objects
        if item.type == "MESH"
    ] == [obj]

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
            left_rows,
            right_rows,
            strict=True,
        )
    )
    data.extend(png_chunk(b"IDAT", zlib.compress(raw, 6)))
    data.extend(png_chunk(b"IEND", b""))
    output.write_bytes(data)

    width, height, channels, rows, _ = read_png(output.read_bytes())
    assert (width, height, channels) == (
        2 * PANEL_WIDTH, PANEL_HEIGHT, 4,
    )

    panel_stride = PANEL_WIDTH * 4
    assert all(
        row[:panel_stride] == left_row
        and row[panel_stride:] == right_row
        for row, left_row, right_row in zip(
            rows, left_rows, right_rows, strict=True,
        )
    )


def render_comparison(obj, samples):
    scene, cameras = make_render_scene(obj, samples)
    output = OUTPUT / (NAME + ".png")

    with tempfile.TemporaryDirectory(
        prefix=NAME + "-preview-",
        dir=OUTPUT,
    ) as directory:
        paths = []

        for i, camera in enumerate(cameras):
            scene.camera = camera
            path = Path(directory) / f"panel-{i}.png"
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
    builder = make_parts()
    mesh = assemble(builder)
    obj, metadata = finish_object(mesh, builder, material)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, metadata, colors)
    result["comparison"] = render_comparison(obj, args.samples)

    print(json.dumps(
        result,
        ensure_ascii=False,
        allow_nan=False,
    ))


if __name__ == "__main__":
    main()
