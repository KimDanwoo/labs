"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python-exit-code 1 --python tools/models/waterfallBasin.py

원점: 폭포 lip 바로 아래 지면. Blender X 오른쪽, Y 뒤, 정면 -Y, Z 위.
재중심화하지 않는다. 물 메시는 생성하지 않는다.
메모리 내 검증: 2,946개 삼각형, 65개 닫힌 덩어리, 수면 침범 검사 통과.
GLB 파일 검사와 비교 렌더는 스크립트 실행 시 수행한다.
"""

import argparse
import json
import math
import random
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

NAME = "waterfallBasin"
PANEL_WIDTH = PANEL_HEIGHT = 1024
EPSILON = 1e-5

BASALT = 5
GRAY = 6
GREEN = 9
CORAL = 10
VEIN = 12

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

OUTER = [
    (-1.37, 0.01),
    (-1.37, -2.68),
    (-3.0, -2.68),
    (-3.0, -6.83),
    (-1.9, -7.94),
    (1.88, -7.94),
    (2.99, -6.83),
    (2.99, -2.68),
    (1.36, -2.68),
    (1.36, 0.01),
]

ISLAND = [
    (-1.17, -3.95),
    (1.17, -3.95),
    (1.17, -6.16),
    (1.07, -6.27),
    (-1.07, -6.27),
    (-1.17, -6.16),
]

# 오목한 바깥 윤곽을 정확히 덮는 두 볼록 영역이다.
POOL = [OUTER[i] for i in (2, 3, 4, 5, 6, 7)]
CHANNEL = [
    (-1.37, -2.68),
    (1.36, -2.68),
    (1.36, 0.01),
    (-1.37, 0.01),
]

PAD_SPECS = [
    (-2.31, -3.50, 0.235, 0.55),
    (2.26, -4.10, 0.215, 2.65),
    (-2.19, -5.66, 0.240, -0.55),
    (2.22, -6.27, 0.220, 1.15),
    (-1.47, -7.23, 0.205, 2.15),
    (0.84, -7.30, 0.245, -1.10),
]


def bounds(points):
    points = list(points)
    assert points
    return (
        Vector(tuple(min(p[i] for p in points) for i in range(3))),
        Vector(tuple(max(p[i] for p in points) for i in range(3))),
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

    while offset < len(data):
        assert offset + 12 <= len(data)
        size, kind = struct.unpack_from(">I4s", data, offset)
        assert offset + size + 12 <= len(data)

        payload = data[offset + 8:offset + 8 + size]
        checksum = struct.unpack_from(">I", data, offset + 8 + size)[0]
        assert zlib.crc32(kind + payload) & 0xFFFFFFFF == checksum

        chunks.append((kind, payload))
        offset += size + 12

        if kind == b"IEND":
            assert size == 0
            break

    assert offset == len(data)
    assert chunks[0][0] == b"IHDR"
    assert chunks[-1][0] == b"IEND"

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

    previous = bytearray(stride)
    rows = []

    for y in range(height):
        start = y * (stride + 1)
        mode = raw[start]
        assert 0 <= mode <= 4
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
                predictor = (left, above, corner)[distances.index(min(distances))]

            row[x] = (row[x] + predictor) & 255

        rows.append(bytes(row))
        previous = row

    return width, height, channels, rows, chunks


def palette_colors(data):
    width, height, channels, rows, _ = read_png(data)
    assert (width, height) == (128, 4)
    colors = []

    # 칸 경계의 혼색은 허용하고 중앙 픽셀만 검증한다.
    for slot in range(32):
        offset = (slot * 4 + 2) * channels
        colors.append(tuple(rows[2][offset:offset + 3]))

        if channels == 4:
            assert rows[2][offset + 3] == 255

    return colors


def load_palette():
    colors = palette_colors(PALETTE.read_bytes())

    for slot, expected in EXPECTED_RGB.items():
        assert colors[slot] == expected, (slot, colors[slot], expected)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
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

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"

    links = material.node_tree.links
    links.new(uv.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    nodes.active = texture

    return material, colors


def cross2(a, b):
    return a[0] * b[1] - a[1] * b[0]


def ccw(points):
    points = [Vector(p) for p in points]
    area = sum(
        cross2(a, b)
        for a, b in zip(points, points[1:] + points[:1])
    )
    return points if area > 0 else list(reversed(points))


def inside(point, polygon):
    ring = ccw(polygon)
    return all(
        cross2(b - a, Vector(point[:2]) - a) >= -EPSILON
        for a, b in zip(ring, ring[1:] + ring[:1])
    )


def clip_plane(points, value):
    if not points:
        return []

    result = []
    a = points[-1]
    da = value(a)

    for b in points:
        db = value(b)

        if (da >= 0) != (db >= 0):
            result.append(a.lerp(b, da / (da - db)))

        if db >= 0:
            result.append(b)

        a, da = b, db

    return result


def clip_polygon(points, polygon):
    ring = ccw(polygon)

    for a, b in zip(ring, ring[1:] + ring[:1]):
        edge = b - a
        points = clip_plane(
            points,
            lambda p: cross2(edge, Vector(p[:2]) - a),
        )

        if not points:
            break

    return points


def check_triangle(points, role):
    assert all(
        all(math.isfinite(value) for value in point)
        for point in points
    )

    if role in ("lily", "flower"):
        for point in points:
            assert inside(point, POOL) or inside(point, CHANNEL), (
                role, "outside-water", tuple(point)
            )
            assert not inside(point, ISLAND), (
                role, "inside-island", tuple(point)
            )

            if role == "lily":
                assert 0.31 - EPSILON <= point.z <= 0.33 + EPSILON

        return

    assert role in ("rim", "island")

    for point in points:
        maximum = 0.48 if role == "rim" else 0.42
        assert -EPSILON <= point.z <= maximum + EPSILON

        if role == "island":
            assert inside(point, ISLAND)

    # 頂点だけでなく、Z閾値で切った三角形全体を水域と交差検査する。
    # XY投影が線分になる垂直面も、面積による判定を使わず検査する。
    above = clip_plane(list(points), lambda p: p.z - 0.29000001)

    assert not clip_polygon(above, CHANNEL), (
        "channel-intrusion", role
    )

    intersection = clip_polygon(above, POOL)
    assert all(inside(point, ISLAND) for point in intersection), (
        "water-intrusion",
        role,
        [tuple(point) for point in intersection],
    )


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.face_parts = []
        self.parts = []

    def component(self, name, vertices, faces, slots, role):
        assert all(part["name"] != name for part in self.parts)

        first = len(self.vertices)
        part_id = len(self.parts)
        vertices = list(vertices)
        faces = list(faces)
        colors = (
            [slots] * len(faces)
            if isinstance(slots, int)
            else list(slots)
        )

        assert len(colors) == len(faces)
        assert all(
            slot in (BASALT, GRAY, GREEN, CORAL, VEIN)
            for slot in colors
        )

        self.vertices.extend(tuple(vertex) for vertex in vertices)
        self.faces.extend(
            tuple(first + index for index in face)
            for face in faces
        )
        self.slots.extend(colors)
        self.face_parts.extend([part_id] * len(faces))
        self.parts.append({
            "id": part_id,
            "name": name,
            "role": role,
            "start": first,
            "count": len(vertices),
        })


def layered_rock(builder, name, outline, layers, seed, role):
    ring = ccw(outline)
    count = len(ring)
    center = sum(ring, Vector((0, 0))) / count

    vertices = [
        (*(center + (point - center) * scale), z)
        for scale, z in layers
        for point in ring
    ]
    faces = [tuple(reversed(range(count)))]
    slots = [BASALT]

    for layer in range(len(layers) - 1):
        for i in range(count):
            j = (i + 1) % count
            faces.append((
                layer * count + i,
                layer * count + j,
                (layer + 1) * count + j,
                (layer + 1) * count + i,
            ))

            slot = (
                GRAY
                if (seed + i * 3 + layer) % 7 < 2
                else BASALT
            )

            if layer == len(layers) - 2 and (seed + i) % 5 == 0:
                slot = GREEN

            slots.append(slot)

    vertices.append((*center, layers[-1][1]))
    top = (len(layers) - 1) * count

    for i in range(count):
        faces.append((
            top + i,
            top + (i + 1) % count,
            len(vertices) - 1,
        ))

        slots.append(
            BASALT if role == "island"
            else GREEN if (seed + i) % 9 in (0, 1)
            else GRAY if (seed + i) % 7 == 0
            else BASALT
        )

    builder.component(name, vertices, faces, slots, role)


def build_rim(builder):
    path = [Vector(point) for point in OUTER[1:9]]
    directions = [
        (b - a).normalized()
        for a, b in zip(path, path[1:])
    ]
    normals = [Vector((d.y, -d.x)) for d in directions]
    offsets = []
    width = 0.53

    for i, point in enumerate(path):
        if i == 0:
            offset = normals[0] * width
        elif i == len(path) - 1:
            offset = normals[-1] * width
        else:
            joint = (normals[i - 1] + normals[i]).normalized()
            offset = joint * (width / joint.dot(normals[i]))

        offsets.append(point + offset)

    rng = random.Random(731)
    serial = 0

    for edge_index, (a, b) in enumerate(zip(path, path[1:])):
        length = (b - a).length
        count = max(2, round(length / 0.65))
        weights = [rng.uniform(0.83, 1.17) for _ in range(count)]
        total = sum(weights)
        cuts = [0]

        for weight in weights:
            cuts.append(cuts[-1] + weight / total)

        cuts[-1] = 1

        for start, end in zip(cuts, cuts[1:]):
            gap = 0.004 / length
            lo, hi = start + gap, end - gap
            normal = normals[edge_index]

            # 각 돌의 볼록한 발자국 전체를 수면 바깥에 둔다.
            quad = [
                a.lerp(b, lo) + normal * 0.006,
                a.lerp(b, hi) + normal * 0.006,
                offsets[edge_index].lerp(
                    offsets[edge_index + 1], hi,
                ),
                offsets[edge_index].lerp(
                    offsets[edge_index + 1], lo,
                ),
            ]
            quad = ccw(quad)
            outline = []

            for i, point in enumerate(quad):
                before = quad[(i - 1) % 4]
                after = quad[(i + 1) % 4]
                cut = rng.uniform(0.10, 0.17)
                outline.extend((
                    point.lerp(before, cut),
                    point.lerp(after, cut),
                ))

            height = rng.uniform(0.365, 0.475)

            layered_rock(
                builder,
                f"rim-stone-{serial:02d}",
                outline,
                (
                    (0.86, 0),
                    (1, 0.065),
                    (1, height - 0.072),
                    (0.83, height),
                ),
                serial + 91,
                "rim",
            )
            serial += 1


def build_island(builder):
    # 윗면 두 링과 중심은 모두 Z=0.42이며 이끼도 면 색으로 처리한다.
    layered_rock(
        builder,
        "island-foundation",
        ISLAND,
        (
            (0.94, 0),
            (1, 0.065),
            (1, 0.32),
            (0.955, 0.42),
            (0.66, 0.42),
        ),
        206,
        "island",
    )


def tube(builder, name, start, end, radius, slot, role):
    start = Vector(start)
    end = Vector(end)
    sides = 5
    rotation = (end - start).to_track_quat("Z", "Y").to_matrix()

    vertices = [
        point + rotation @ Vector((
            radius * math.cos(i * math.tau / sides),
            radius * math.sin(i * math.tau / sides),
            0,
        ))
        for point in (start, end)
        for i in range(sides)
    ]

    faces = [
        tuple(reversed(range(sides))),
        tuple(range(sides, sides * 2)),
    ]
    faces += [
        (
            i,
            (i + 1) % sides,
            (i + 1) % sides + sides,
            i + sides,
        )
        for i in range(sides)
    ]

    builder.component(name, vertices, faces, slot, role)


def lily(builder, index, spec):
    x, y, radius, rotation = spec

    def point(px, py, z):
        return Vector((
            x + px * math.cos(rotation) - py * math.sin(rotation),
            y + px * math.sin(rotation) + py * math.cos(rotation),
            z,
        ))

    outline = [(radius * 0.13, 0)]
    outline += [
        (radius * math.cos(angle), radius * math.sin(angle))
        for angle in [
            0.15 + (math.tau - 0.30) * i / 16
            for i in range(17)
        ]
    ]

    n = len(outline)
    vertices = [
        point(px, py, z)
        for z in (0.312, 0.322)
        for px, py in outline
    ]
    vertices += [
        point(0, 0, 0.312),
        point(0, 0, 0.328),
    ]
    faces = []

    for i in range(n):
        j = (i + 1) % n
        faces.extend((
            (i, 2 * n, j),
            (n + i, n + j, 2 * n + 1),
            (i, j, n + j, n + i),
        ))

    builder.component(
        f"lily-{index}",
        vertices,
        faces,
        GREEN,
        "lily",
    )

    for j, angle in enumerate((0.85, 2.5, 4.25)):
        tube(
            builder,
            f"lily-{index}-vein-{j}",
            point(0, 0, 0.327),
            point(
                radius * 0.68 * math.cos(angle),
                radius * 0.68 * math.sin(angle),
                0.3245,
            ),
            0.0017,
            VEIN,
            "lily",
        )


def petal(builder, name, center, radii, angle, slot):
    cx, cy, cz = center
    vertices = [(0, 0, -radii[2])]
    segments = 6

    for level in (-0.65, 0, 0.65):
        r = math.sqrt(1 - level * level)
        vertices += [
            (
                radii[0] * r * math.cos(i * math.tau / segments),
                radii[1] * r * math.sin(i * math.tau / segments),
                radii[2] * level,
            )
            for i in range(segments)
        ]

    vertices.append((0, 0, radii[2]))
    faces = []

    for i in range(segments):
        j = (i + 1) % segments
        faces.append((0, j + 1, i + 1))

        for layer in range(2):
            first = 1 + layer * segments
            faces.append((
                first + i,
                first + j,
                first + segments + j,
                first + segments + i,
            ))

        first = 1 + 2 * segments
        faces.append((
            first + i,
            first + j,
            len(vertices) - 1,
        ))

    vertices = [
        (
            cx + px * math.cos(angle) - py * math.sin(angle),
            cy + px * math.sin(angle) + py * math.cos(angle),
            cz + pz,
        )
        for px, py, pz in vertices
    ]

    builder.component(
        name, vertices, faces, slot, "flower",
    )


def flower(builder, index):
    x, y, radius, angle = PAD_SPECS[index]
    x, y = x - 0.015, y + 0.01

    for i in range(5):
        a = angle + math.tau * i / 5
        petal(
            builder,
            f"flower-{index}-petal-{i}",
            (
                x + math.cos(a) * 0.052,
                y + math.sin(a) * 0.052,
                0.355,
            ),
            (0.083, 0.044, 0.027),
            a,
            CORAL,
        )

    petal(
        builder,
        f"flower-{index}-heart",
        (x, y, 0.378),
        (0.033, 0.033, 0.025),
        0,
        VEIN,
    )


def build_geometry():
    builder = Builder()
    build_rim(builder)
    build_island(builder)

    for i, spec in enumerate(PAD_SPECS):
        lily(builder, i, spec)

    for i in (0, 3):
        flower(builder, i)

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
        components = 0

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
                face[part_layer]
                for face in component
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

            components += 1

        # 덩어리별 닫힘을 유지하며 Boolean 합집합은 하지 않는다.
        assert components == len(builder.parts)

        for face in bm.faces:
            check_triangle(
                [vertex.co for vertex in face.verts],
                builder.parts[face[part_layer]]["role"],
            )

        bm.to_mesh(mesh)

    finally:
        bm.free()

    mesh.update()
    mesh.calc_loop_triangles()

    assert 1500 <= len(mesh.loop_triangles) <= 5000
    return mesh, builder


def finish_object(mesh, builder, material):
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")
    slots = mesh.attributes["palette_slot"]
    used = set()

    for polygon in mesh.polygons:
        assert len(polygon.vertices) == 3
        polygon.use_smooth = False

        slot = slots.data[polygon.index].value
        used.add(slot)

        for loop in polygon.loop_indices:
            uv.data[loop].uv = ((slot + 0.5) / 32, 0.5)

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    assert obj.location.length == 0
    assert tuple(obj.scale) == (1, 1, 1)
    assert obj.rotation_euler.to_matrix().is_identity
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert len([
        item for item in bpy.context.scene.objects
        if item.type == "MESH"
    ]) == 1
    assert used == {BASALT, GRAY, GREEN, CORAL, VEIN}

    # 볼록한 평탄면 경계까지의 거리로 반경 전체의 수용을 검증한다.
    ring = ccw(ISLAND)
    center = sum(ring, Vector((0, 0))) / len(ring)
    plateau = [
        center + (point - center) * 0.955
        for point in ring
    ]
    totem = Vector((0, -5.1))

    for a, b in zip(plateau, plateau[1:] + plateau[:1]):
        assert cross2(b - a, totem - a) / (b - a).length > 0.5

    assert sum(
        part["name"].startswith("lily-")
        and "-vein-" not in part["name"]
        for part in builder.parts
    ) == 6
    assert sum(
        part["name"].endswith("-heart")
        for part in builder.parts
    ) == 2

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)

    metadata = {
        "name": NAME,
        "origin_blender": [0, 0, 0],
        "origin_definition": "폭포 lip 바로 아래 지면; 재중심화 없음",
        "front_blender": [0, -1, 0],
        "front_yup": [0, 0, 1],
        "bbox_blender": {
            "min": list(lower),
            "max": list(upper),
        },
        "triangles": len(mesh.loop_triangles),
        "closed_parts": len(builder.parts),
        "mesh_objects": 1,
        "material": "palette",
        "slots_used": sorted(used),
        "water_z": 0.30,
        "water_clearance_above_z": 0.29,
        "totem_clearance": {
            "center": [0, -5.1],
            "radius": 0.5,
            "flat_z": 0.42,
        },
        "lilies": 6,
        "flowers": 2,
        "clearance_checks_passed": True,
    }

    return obj, metadata


def to_yup(point):
    return Vector((point.x, point.z, -point.y))


def accessor_rows(document, binary, index, width):
    accessor = document["accessors"][index]
    assert "sparse" not in accessor

    code = {
        5121: "B",
        5123: "H",
        5125: "I",
        5126: "f",
    }[accessor["componentType"]]
    assert accessor["type"] == {
        1: "SCALAR",
        2: "VEC2",
        3: "VEC3",
    }[width]

    view = document["bufferViews"][accessor["bufferView"]]
    fmt = "<" + code * width
    size = struct.calcsize(fmt)
    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    assert stride >= size
    assert accessor["count"] > 0
    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + row * stride)
        for row in range(accessor["count"])
    ]


def triangle_key(points, slot):
    return (
        slot,
        tuple(sorted(
            tuple(round(value, 5) for value in point)
            for point in points
        )),
    )


def verify_glb(path, obj, builder, metadata, colors):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (
        b"glTF", 2, len(data),
    )

    offset = 12
    chunks = {}

    while offset < len(data):
        assert offset + 8 <= len(data)
        size, kind = struct.unpack_from("<I4s", data, offset)
        assert kind not in chunks
        assert offset + 8 + size <= len(data)

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += size + 8

    assert offset == len(data)
    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]
    primitive, = mesh["primitives"]

    assert mesh["name"] == node["name"] == NAME
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert material["name"] == "palette"
    assert primitive["material"] == 0
    assert primitive.get("mode", 4) == 4

    attributes = primitive["attributes"]
    assert not any(
        name.startswith("COLOR_")
        for name in attributes
    )

    points = [
        Vector(row)
        for row in accessor_rows(
            document, binary, attributes["POSITION"], 3,
        )
    ]
    blender_points = [
        Vector((point.x, -point.z, point.y))
        for point in points
    ]
    uvs = accessor_rows(
        document, binary, attributes["TEXCOORD_0"], 2,
    )
    normals = accessor_rows(
        document, binary, attributes["NORMAL"], 3,
    )

    assert len(points) == len(uvs) == len(normals)

    uv_slots = []

    for u, v in uvs:
        slot = round(u * 32 - 0.5)
        assert slot in metadata["slots_used"]
        assert abs(u - (slot + 0.5) / 32) < 1e-7
        assert abs(v - 0.5) < 1e-7
        uv_slots.append(slot)

    assert all(
        abs(Vector(normal).length - 1) < EPSILON
        for normal in normals
    )

    source = Counter()
    roles = {}
    slots = obj.data.attributes["palette_slot"]
    parts = obj.data.attributes["part_id"]

    for polygon in obj.data.polygons:
        tri = [
            obj.data.vertices[index].co
            for index in polygon.vertices
        ]
        slot = slots.data[polygon.index].value
        key = triangle_key(tri, slot)
        role = builder.parts[
            parts.data[polygon.index].value
        ]["role"]

        assert key not in roles or roles[key] == role
        source[key] += 1
        roles[key] = role

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"], 1,
        )
    ]

    assert len(indices) == metadata["triangles"] * 3
    assert all(0 <= index < len(points) for index in indices)

    exported = Counter()

    for i in range(0, len(indices), 3):
        ids = indices[i:i + 3]
        assert len({uv_slots[index] for index in ids}) == 1

        tri = [blender_points[index] for index in ids]
        key = triangle_key(tri, uv_slots[ids[0]])
        assert key in roles, ("changed-triangle", key)

        check_triangle(tri, roles[key])
        exported[key] += 1

    # 내보낸 삼각형 전체가 검사한 원본과 일치해야 한다.
    assert exported == source

    lower, upper = bounds(points)
    expected_lower, expected_upper = bounds(
        to_yup(vertex.co)
        for vertex in obj.data.vertices
    )
    assert (lower - expected_lower).length < EPSILON
    assert (upper - expected_upper).length < EPSILON

    image, = document["images"]
    assert image["mimeType"] == "image/png"

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    assert palette_colors(
        binary[start:start + view["byteLength"]]
    ) == colors

    metadata["glb_file"] = str(path)
    metadata["bbox_yup"] = {
        "min": list(lower),
        "max": list(upper),
    }
    metadata["palette_rgb"] = {
        str(slot): list(colors[slot])
        for slot in metadata["slots_used"]
    }
    metadata["glb_verified"] = True


def export_glb(obj, builder, metadata, colors):
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

    assert result == {"FINISHED"}
    assert path.is_file()
    verify_glb(path, obj, builder, metadata, colors)


def make_render_scene(obj, samples):
    scene = bpy.data.scenes.new(NAME + "-comparison")
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

    world = bpy.data.worlds.new(NAME + "-preview-world")
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.78, 0.73, 0.64, 1)
    background.inputs["Strength"].default_value = 0.65
    scene.world = world

    clone = bpy.data.objects.new(NAME + "-preview", obj.data.copy())
    scene.collection.objects.link(clone)

    points = [vertex.co.copy() for vertex in clone.data.vertices]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2
    z = lower.z - 0.025

    # 바닥과 조명은 비교 장면에만 있으며 GLB에는 포함되지 않는다.
    floor_mesh = bpy.data.meshes.new("preview-floor")
    floor_mesh.from_pydata(
        [
            (-200, -200, z),
            (200, -200, z),
            (200, 200, z),
            (-200, 200, z),
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
    shader.inputs["Base Color"].default_value = (0.72, 0.58, 0.38, 1)
    shader.inputs["Roughness"].default_value = 1
    floor_mesh.materials.append(ground)

    for label, position, energy, size in (
        ("key", (-6, -9, 13), 1900, 7),
        ("fill", (8, -1, 9), 1100, 6),
        ("rim", (1, 7, 12), 1800, 5),
    ):
        light = bpy.data.lights.new("preview-" + label, "AREA")
        light.energy = energy
        light.shape = "DISK"
        light.size = size

        lamp = bpy.data.objects.new(light.name, light)
        scene.collection.objects.link(lamp)
        lamp.location = position
        lamp.rotation_euler = (
            pivot - lamp.location
        ).to_track_quat("-Z", "Y").to_euler()

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
        camera.data.clip_end = 200
        camera.data.ortho_scale = 1
        camera.location = target + direction * 24
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
    lw, lh, lc, left_rows, chunks = read_png(left.read_bytes())
    rw, rh, rc, right_rows, _ = read_png(right.read_bytes())

    assert (lw, lh, lc) == (rw, rh, rc) == (
        PANEL_WIDTH, PANEL_HEIGHT, 4,
    )

    data = bytearray(b"\x89PNG\r\n\x1a\n")
    data.extend(png_chunk(
        b"IHDR",
        struct.pack(">IIBBBBB", lw + rw, lh, 8, 6, 0, 0, 0),
    ))

    for kind, payload in chunks:
        if kind in (b"gAMA", b"cHRM", b"sRGB", b"iCCP"):
            data.extend(png_chunk(kind, payload))

    raw = b"".join(
        b"\x00" + a + b
        for a, b in zip(left_rows, right_rows, strict=True)
    )
    data.extend(png_chunk(b"IDAT", zlib.compress(raw, 6)))
    data.extend(png_chunk(b"IEND", b""))
    output.write_bytes(data)


def render_comparison(obj, samples):
    scene, cameras = make_render_scene(obj, samples)
    output = OUTPUT / (NAME + ".png")

    with tempfile.TemporaryDirectory(
        prefix="basin-preview-",
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
            paths.append(path)

        combine_png(paths[0], paths[1], output)

    width, height, channels, _, _ = read_png(output.read_bytes())
    assert (width, height, channels) == (
        PANEL_WIDTH * 2, PANEL_HEIGHT, 4,
    )

    return {
        "file": str(output),
        "panel_order": ["front", "front_above_45"],
        "view_directions": [[0, -1, 0], [0, -1, 1]],
        "dimensions": [width, height],
        "same_orthographic_scale": True,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")
    parser.add_argument("--samples", type=int, default=32)
    args = parser.parse_args(
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )

    if args.samples < 1:
        parser.error("--samples는 양수여야 합니다.")

    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3이 필요합니다.")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("--disable-autoexec 옵션으로 실행하세요.")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = NAME + "-export"

    material, colors = load_palette()
    mesh, builder = build_geometry()
    obj, metadata = finish_object(mesh, builder, material)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    export_glb(obj, builder, metadata, colors)

    metadata["comparison"] = (
        None
        if args.skip_render
        else render_comparison(obj, args.samples)
    )

    print(json.dumps(
        metadata,
        ensure_ascii=False,
        indent=2,
        allow_nan=False,
    ))


if __name__ == "__main__":
    main()
