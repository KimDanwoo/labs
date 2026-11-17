"""
Blender 5.3

실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/islandBridge.py

판자 피치 0.60m = 판자 0.55m + 틈 0.05m.
양 끝 0.025m 여유를 합쳐 타일 경계에서도 같은 틈을 유지한다.
들보와 밧줄의 타일 끝은 열린 단면이며 위치·색·법선이 일치한다.
충돌체는 만들지 않는다. 차량 통과 영역의 판자 상면은 Z=0.12이다.
원본 .blend는 읽지 않는다. GLB의 원점·회전·스케일을 유지한다.

메시와 GLB 검증은 Blender 5.3에서 메모리 내 실행으로 확인했다.
Workbench 렌더에는 Blender에서 사용할 수 있는 GPU가 필요하다.
"""

import json
import math
import struct
import sys
import zlib
from collections import Counter, defaultdict
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
OUTPUT = ROOT / "codex-work/bridge"

EPS = 1e-6
LENGTH = 2.4
HALF_LENGTH = LENGTH / 2
TOP = .12
PLANK_CENTERS = (-.9, -.3, .3, .9)

EXPECTED = {
    1: "#EBD1A3",
    2: "#574E37",
    8: "#E4A90C",
    11: "#988165",
    13: "#A49876",
    14: "#B36D45",
}

PART_SLOTS = {
    "planks": {2, 11, 14},
    "beams": {2, 14},
    "posts": {14},
    "ropes": {13},
    "wraps": {13},
    "sand": {1},
}

BUDGETS = {
    "bridgeDeck": (400, 1500),
    "bridgeEnd": (200, 800),
}


def bounds(points):
    points = list(points)
    assert points, "빈 메시"

    return tuple(
        Vector(tuple(fn(point[axis] for point in points) for axis in range(3)))
        for fn in (min, max)
    )


def palette_colors(image):
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)
    colors = {}

    for slot, expected in EXPECTED.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        rgb = [
            round(pixels[offset + channel] * 255)
            for channel in range(3)
        ]
        actual = "#" + "".join(f"{channel:02X}" for channel in rgb)

        assert actual == expected, (slot, actual, expected)
        assert pixels[offset + 3] > .999

        colors[slot] = actual

    return colors


def make_material():
    assert PALETTE.is_file(), str(PALETTE)
    assert bpy.data.materials.get("palette") is None

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    colors = palette_colors(image)
    image.pack()

    material = bpy.data.materials.new("palette")
    material.use_nodes = True
    material.diffuse_color = (1, 1, 1, 1)

    nodes = material.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")

    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    nodes.active = texture

    shader.inputs["Metallic"].default_value = 0
    shader.inputs["Roughness"].default_value = 1

    material.node_tree.links.new(
        texture.outputs["Color"],
        shader.inputs["Base Color"],
    )
    material.node_tree.links.new(
        shader.outputs["BSDF"],
        output.inputs["Surface"],
    )

    return colors


class Builder:
    def __init__(self, name):
        self.name = name
        self.vertices = []
        self.normals = []
        self.faces = []
        self.tags = []
        self.roles = []

    def ring(self, points, normals=None):
        points = list(points)
        start = len(self.vertices)

        self.vertices.extend(tuple(point) for point in points)
        self.normals.extend(
            list(normals) if normals is not None else [None] * len(points)
        )

        return list(range(start, len(self.vertices)))

    def face(self, indices, slot, part):
        indices = tuple(indices)

        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)
        assert slot in PART_SLOTS[part]

        if part not in self.roles:
            self.roles.append(part)

        self.faces.append(indices)
        self.tags.append((slot, self.roles.index(part)))

    def bridge(self, first, second, slot, part):
        assert len(first) == len(second)

        for i in range(len(first)):
            j = (i + 1) % len(first)
            color = slot[i] if isinstance(slot, (list, tuple)) else slot

            self.face(
                (first[i], first[j], second[j], second[i]),
                color,
                part,
            )

    def finish(self):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate()

        bm = bmesh.new()

        try:
            bm.from_mesh(mesh)

            color = bm.faces.layers.int.new("palette_slot")
            role = bm.faces.layers.int.new("part_id")

            for face, (slot, part) in zip(bm.faces, self.tags, strict=True):
                face[color] = slot
                face[role] = part

            bmesh.ops.triangulate(
                bm,
                faces=list(bm.faces),
                quad_method="FIXED",
                ngon_method="EAR_CLIP",
            )
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

            pending = set(bm.faces)
            components = 0

            while pending:
                component = {pending.pop()}
                stack = list(component)

                while stack:
                    face = stack.pop()

                    for edge in face.edges:
                        for neighbor in edge.link_faces:
                            if neighbor in pending:
                                pending.remove(neighbor)
                                component.add(neighbor)
                                stack.append(neighbor)

                volume = sum(
                    face.verts[0].co.dot(
                        face.verts[1].co.cross(face.verts[2].co)
                    )
                    for face in component
                ) / 6

                assert abs(volume) > 1e-10

                if volume < 0:
                    bmesh.ops.reverse_faces(bm, faces=list(component))

                components += 1

            for edge in bm.edges:
                if edge.is_boundary:
                    assert self.name == "bridgeDeck"

                    assert all(
                        abs(vertex.co.y - edge.verts[0].co.y) < EPS
                        and abs(abs(vertex.co.y) - HALF_LENGTH) < EPS
                        for vertex in edge.verts
                    ), "열린 경계는 타일 끝 단면에만 허용합니다"

                    assert all(
                        self.roles[face[role]] in {"beams", "ropes"}
                        for face in edge.link_faces
                    )
                else:
                    assert edge.is_manifold and edge.is_contiguous

            assert all(face.calc_area() > 1e-10 for face in bm.faces)

            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.materials.append(bpy.data.materials["palette"])

        uv = mesh.uv_layers.new(name="UVMap")
        slots = mesh.attributes["palette_slot"].data
        parts = mesh.attributes["part_id"].data

        for face in mesh.polygons:
            face.use_smooth = self.roles[parts[face.index].value] == "ropes"

            for index in face.loop_indices:
                uv.data[index].uv = (
                    (slots[face.index].value + .5) / 32,
                    .5,
                )

        mesh.update()

        assert len(mesh.vertices) == len(self.vertices)

        for vertex, original in zip(
            mesh.vertices,
            self.vertices,
            strict=True,
        ):
            assert (vertex.co - Vector(original)).length < EPS

        custom_normals = [None] * len(mesh.loops)

        for face in mesh.polygons:
            for index in face.loop_indices:
                vertex_index = mesh.loops[index].vertex_index
                normal = self.normals[vertex_index]

                custom_normals[index] = (
                    normal if normal is not None else tuple(face.normal)
                )

        # 열린 밧줄 끝에도 주기적 법선을 지정해 반복 경계의 음영을 맞춘다.
        mesh.normals_split_custom_set(custom_normals)
        mesh.update()
        mesh.calc_loop_triangles()

        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)

        return obj, self.roles, components


def loft(builder, rings, slot, part, caps=True):
    indices = [builder.ring(points) for points in rings]

    if caps:
        builder.face(reversed(indices[0]), slot, part)

    for first, second in zip(indices, indices[1:]):
        builder.bridge(first, second, slot, part)

    if caps:
        builder.face(indices[-1], slot, part)


def ellipse_ring(cx, cy, z, rx, ry, count=8):
    return [
        (
            cx + rx * math.cos(math.tau * i / count),
            cy + ry * math.sin(math.tau * i / count),
            z,
        )
        for i in range(count)
    ]


def plank_outline(left, right, cy, z, inset_x, inset_y, variant):
    left += inset_x
    right -= inset_x

    bottom = cy - .275 + inset_y
    top = cy + .275 - inset_y
    a = .07 + variant * .009
    b = .10 - variant * .008

    return [
        (left + a, bottom, z),
        (right - b, bottom, z),
        (right, bottom + .055, z),
        (right - .012, top - .065, z),
        (right - .012 - a, top, z),
        (left + b + .012, top, z),
        (left + .012, top - .055, z),
        (left, bottom + .065, z),
    ]


def add_plank(builder, index, cy):
    left = (-2.50, -2.47, -2.49, -2.46)[index]
    right = (2.47, 2.50, 2.46, 2.49)[index]

    rings = [
        builder.ring(
            plank_outline(left, right, cy, z, dx, dy, index)
        )
        for z, dx, dy in (
            (-.06, .035, .014),
            (-.035, 0, 0),
            (.112, 0, 0),
            (TOP, .02, .008),
        )
    ]

    slot = 14 if index % 2 == 0 else 11

    builder.face(reversed(rings[0]), 2, "planks")

    for level, (first, second) in enumerate(zip(rings, rings[1:])):
        builder.bridge(
            first,
            second,
            2 if level == 0 else slot,
            "planks",
        )

    builder.face(rings[-1], slot, "planks")


def add_beam(builder, x, slot):
    cross_section = [
        (-.14, -.25),
        (.14, -.25),
        (.18, -.22),
        (.18, -.085),
        (.145, -.06),
        (-.145, -.06),
        (-.18, -.085),
        (-.18, -.22),
    ]

    loft(
        builder,
        [
            [(x + dx, y, z) for dx, z in cross_section]
            for y in (-HALF_LENGTH, HALF_LENGTH)
        ],
        slot,
        "beams",
        caps=False,
    )


def add_post(builder, x, is_end):
    profiles = (
        [
            (0, .125),
            (.025, .15),
            (1.13, .15),
            (1.22, .14),
            (1.275, .105),
            (1.3, .045),
        ]
        if is_end else
        [
            (.12, .073),
            (.14, .08),
            (.91, .08),
            (.96, .073),
            (.99, .05),
            (1.0, .02),
        ]
    )

    loft(
        builder,
        [
            ellipse_ring(x, 0, z, radius, radius)
            for z, radius in profiles
        ],
        14,
        "posts",
    )


def rope_height(y, height):
    return height - .06 * (
        1 - math.cos(math.pi * y / HALF_LENGTH)
    ) / 2


def add_rope(builder, x, height):
    rings = []

    for step in range(13):
        y = -HALF_LENGTH + LENGTH * step / 12
        z = rope_height(y, height)
        slope = (
            -.03 * math.pi / HALF_LENGTH
            * math.sin(math.pi * y / HALF_LENGTH)
        )

        points = []
        normals = []

        for side in range(6):
            angle = math.tau * side / 6
            cosine = math.cos(angle)
            sine = math.sin(angle)

            points.append((
                x + .045 * cosine,
                y,
                z + .045 * sine,
            ))
            normals.append(tuple(
                Vector((cosine, -slope * sine, sine)).normalized()
            ))

        rings.append(builder.ring(points, normals))

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, 13, "ropes")


def add_wrap(builder, x, z):
    rings = []

    for step in range(12):
        theta = math.tau * step / 12

        rings.append(builder.ring([
            (
                x
                + (.153 + .022 * math.cos(math.tau * side / 5))
                * math.cos(theta),
                (.153 + .022 * math.cos(math.tau * side / 5))
                * math.sin(theta),
                z + .022 * math.sin(math.tau * side / 5),
            )
            for side in range(5)
        ]))

    for step in range(12):
        builder.bridge(
            rings[step],
            rings[(step + 1) % 12],
            13,
            "wraps",
        )


def make_deck():
    builder = Builder("bridgeDeck")

    for index, cy in enumerate(PLANK_CENTERS):
        add_plank(builder, index, cy)

    for x, slot in ((-2, 2), (2, 14)):
        add_beam(builder, x, slot)

    for x in (-2.35, 2.35):
        add_post(builder, x, False)

        for height in (.95, .55):
            add_rope(builder, x, height)

    return builder


def make_end():
    builder = Builder("bridgeEnd")

    for x in (-2.5, 2.5):
        add_post(builder, x, True)

        for z in (1.055, 1.105):
            add_wrap(builder, x, z)

        loft(
            builder,
            [
                ellipse_ring(x, 0, z, rx, ry)
                for z, rx, ry in (
                    (-.04, .15, .20),
                    (0, .19, .25),
                    (.055, .12, .16),
                )
            ],
            1,
            "sand",
        )

    return builder


def clip_plane(points, axis, boundary, sign):
    result = []

    if not points:
        return result

    for first, second in zip(points, points[1:] + points[:1]):
        da = sign * (first[axis] - boundary)
        db = sign * (second[axis] - boundary)

        if da >= 0:
            result.append(first)

        if (da >= 0) != (db >= 0):
            result.append(first.lerp(second, da / (da - db)))

    return result


def check_clearance(name, triangle):
    clipped = clip_plane(list(triangle), 0, -2.2 + EPS, 1)
    clipped = clip_plane(clipped, 0, 2.2 - EPS, -1)

    if name == "bridgeDeck":
        clipped = clip_plane(clipped, 2, TOP + EPS, 1)

    assert len(clipped) < 3, (
        name,
        "차량 통과 영역에 형상이 있습니다",
        clipped,
    )


def check_bounds(name, points):
    lower, upper = bounds(points)
    width = 2.5 if name == "bridgeDeck" else 2.7

    assert lower.x >= -width - EPS
    assert upper.x <= width + EPS

    if name == "bridgeDeck":
        assert abs(lower.y + HALF_LENGTH) < EPS
        assert abs(upper.y - HALF_LENGTH) < EPS
        assert abs(lower.z + .25) < EPS
        assert abs(upper.z - 1) < EPS
        assert abs(lower.x + 2.5) < EPS
        assert abs(upper.x - 2.5) < EPS
    else:
        assert lower.y >= -.25 - EPS
        assert upper.y <= .25 + EPS
        assert abs(lower.z + .04) < EPS
        assert abs(upper.z - 1.3) < EPS

    return lower, upper


def slot_from_uv(uv):
    u, v = uv
    slot = round(u * 32 - .5)

    assert slot in EXPECTED
    assert abs(u - (slot + .5) / 32) < 1e-7
    assert abs(v - .5) < 1e-7

    return slot


def check_seam(points, normals, slots):
    ends = [defaultdict(list), defaultdict(list)]

    for point, normal, slot in zip(
        points,
        normals,
        slots,
        strict=True,
    ):
        for side, y in enumerate((-HALF_LENGTH, HALF_LENGTH)):
            if abs(point.y - y) < EPS:
                key = (
                    round(point.x, 6),
                    round(point.z, 6),
                    slot,
                )
                ends[side][key].append(Vector(normal))

    assert ends[0].keys() == ends[1].keys()
    assert len(ends[0]) == 40, ("타일 단면 정점 수", len(ends[0]))

    for key in ends[0]:
        for first, second in (
            (ends[0][key], ends[1][key]),
            (ends[1][key], ends[0][key]),
        ):
            assert all(
                any(
                    (normal - other).length < .001
                    for other in second
                )
                for normal in first
            ), ("타일 끝 법선 불일치", key)


def check_road(points, triangles):
    tree = BVHTree.FromPolygons(
        points,
        triangles,
        all_triangles=True,
    )
    samples = 0

    for cy in PLANK_CENTERS:
        for iy in range(11):
            y = cy - .26 + .52 * iy / 10

            for ix in range(45):
                x = -2.2 + 4.4 * ix / 44

                hit, normal, _, _ = tree.ray_cast(
                    Vector((x, y, 2)),
                    Vector((0, 0, -1)),
                    3,
                )

                assert hit is not None, ("판자 상면 누락", x, y)
                assert abs(hit.z - TOP) <= .01 + EPS, (
                    "상면 높이",
                    tuple(hit),
                )
                assert normal.z > .99, (
                    "평평하지 않은 상면",
                    tuple(hit),
                    tuple(normal),
                )

                samples += 1

    for y in (-1.2, -.6, 0, .6, 1.2):
        hit, _, _, _ = tree.ray_cast(
            Vector((0, y, 2)),
            Vector((0, 0, -1)),
            3,
        )

        assert hit is None, ("판자 간 틈이 막혔습니다", y)

    return samples


def triangle_key(points, slot):
    return (
        slot,
        tuple(sorted(
            tuple(round(value, 6) for value in point)
            for point in points
        )),
    )


def model_keys(obj):
    mesh = obj.data
    slots = mesh.attributes["palette_slot"].data

    return Counter(
        triangle_key(
            [mesh.vertices[i].co for i in face.vertices],
            slots[face.index].value,
        )
        for face in mesh.polygons
    )


def check_model(obj, roles, components):
    mesh = obj.data

    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert not obj.modifiers
    assert tuple(obj.location) == (0, 0, 0)
    assert tuple(obj.rotation_euler) == (0, 0, 0)
    assert tuple(obj.scale) == (1, 1, 1)

    points = [vertex.co.copy() for vertex in mesh.vertices]
    lower, upper = check_bounds(obj.name, points)

    slots = mesh.attributes["palette_slot"].data
    parts = mesh.attributes["part_id"].data
    counts = Counter()
    by_part = defaultdict(Counter)
    triangles = []

    for face in mesh.polygons:
        assert len(face.vertices) == 3
        assert face.area > 1e-10
        assert face.material_index == 0

        slot = slots[face.index].value
        part = roles[parts[face.index].value]

        assert slot in PART_SLOTS[part]

        triangle = [points[i] for i in face.vertices]
        check_clearance(obj.name, triangle)

        assert all(
            slot_from_uv(mesh.uv_layers.active.data[i].uv) == slot
            for i in face.loop_indices
        )

        counts[slot] += 1
        by_part[part][slot] += 1
        triangles.append(tuple(face.vertices))

    count = len(triangles)

    assert BUDGETS[obj.name][0] <= count <= BUDGETS[obj.name][1], (
        obj.name,
        count,
    )
    assert components == (
        12 if obj.name == "bridgeDeck" else 8
    ), components

    samples = 0

    if obj.name == "bridgeDeck":
        samples = check_road(points, triangles)

        check_seam(
            [points[loop.vertex_index] for loop in mesh.loops],
            [normal.vector for normal in mesh.corner_normals],
            [
                slot_from_uv(item.uv)
                for item in mesh.uv_layers.active.data
            ],
        )

    return {
        "name": obj.name,
        "triangles": count,
        "components": components,
        "triangles_by_slot": dict(sorted(counts.items())),
        "parts": {
            part: dict(sorted(data.items()))
            for part, data in by_part.items()
        },
        "blender_bounds": {
            "min": list(lower),
            "max": list(upper),
        },
        "origin_blender": [0, 0, 0],
        "axis_length_blender": [0, 1, 0],
        "axis_length_gltf": [0, 0, -1],
        "collision_mesh": False,
        "checks": {
            "bounds": True,
            "triangle_budget": True,
            "nondegenerate_triangles": True,
            "palette_uv": True,
            "forbidden_triangle_clipping": True,
            "raycast_samples": samples,
            "periodic_end_positions_and_normals": (
                obj.name == "bridgeDeck"
            ),
        },
    }


def read_glb(path):
    data = path.read_bytes()

    assert struct.unpack_from("<4sII", data) == (
        b"glTF",
        2,
        len(data),
    )

    offset = 12
    chunks = {}

    while offset < len(data):
        size, kind = struct.unpack_from("<I4s", data, offset)

        assert size % 4 == 0
        assert kind not in chunks
        assert offset + 8 + size <= len(data)

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)
    assert set(chunks) == {b"JSON", b"BIN\x00"}

    return json.loads(chunks[b"JSON"]), chunks[b"BIN\x00"]


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

    assert accessor["count"] > 0
    assert stride >= size
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    ) <= len(binary)

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def check_png_palette(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n"

    offset = 8
    compressed = bytearray()
    header = None

    while offset < len(data):
        size, kind = struct.unpack_from(">I4s", data, offset)
        payload = data[offset + 8:offset + 8 + size]
        crc, = struct.unpack_from(">I", data, offset + 8 + size)

        assert zlib.crc32(kind + payload) & 0xFFFFFFFF == crc

        if kind == b"IHDR":
            header = struct.unpack(">IIBBBBB", payload)
        elif kind == b"IDAT":
            compressed.extend(payload)

        offset += 12 + size

        if kind == b"IEND":
            break

    assert header is not None
    assert offset == len(data)

    (
        width,
        height,
        depth,
        color_type,
        compression,
        filtering,
        interlace,
    ) = header

    assert (width, height, depth) == (128, 4, 8)
    assert color_type in (2, 6)
    assert (compression, filtering, interlace) == (0, 0, 0)

    channels = 3 if color_type == 2 else 4
    stride = width * channels
    raw = zlib.decompress(compressed)

    assert len(raw) == height * (stride + 1)

    rows = []
    previous = bytearray(stride)

    for y in range(height):
        start = y * (stride + 1)
        method = raw[start]
        row = bytearray(raw[start + 1:start + 1 + stride])

        assert 0 <= method <= 4

        for i in range(stride):
            left = row[i - channels] if i >= channels else 0
            above = previous[i]
            diagonal = (
                previous[i - channels] if i >= channels else 0
            )

            prediction = left + above - diagonal
            distances = (
                abs(prediction - left),
                abs(prediction - above),
                abs(prediction - diagonal),
            )
            paeth = (
                left,
                above,
                diagonal,
            )[distances.index(min(distances))]

            predictors = (
                0,
                left,
                above,
                (left + above) // 2,
                paeth,
            )
            row[i] = (row[i] + predictors[method]) & 255

        rows.append(row)
        previous = row

    for slot, expected in EXPECTED.items():
        start = (slot * 4 + 2) * channels

        # PNG는 위에서, Blender pixels는 아래에서 행을 센다.
        pixel = rows[height - 1 - 2][start:start + channels]
        actual = "#" + "".join(f"{value:02X}" for value in pixel[:3])

        assert actual == expected, (
            "GLB 내장 팔레트",
            slot,
            actual,
        )
        assert channels == 3 or pixel[3] == 255


def verify_embedded_palette(document, binary):
    material, = document["materials"]
    texture, = document["textures"]
    image, = document["images"]

    assert material["name"] == "palette"
    assert (
        material["pbrMetallicRoughness"]["baseColorTexture"]["index"]
        == 0
    )
    assert texture["source"] == 0
    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)

    check_png_palette(binary[start:start + view["byteLength"]])


def verify_glb(path, obj, metadata):
    document, binary = read_glb(path)

    buffer, = document["buffers"]

    assert "uri" not in buffer
    assert 0 <= len(binary) - buffer["byteLength"] <= 3

    mesh, = document["meshes"]
    node, = document["nodes"]
    scene, = document["scenes"]

    assert mesh["name"] == node["name"] == obj.name
    assert scene["nodes"] == [0]
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]

    primitive, = mesh["primitives"]

    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]

    assert {"POSITION", "NORMAL", "TEXCOORD_0"} <= attributes.keys()
    assert not any(key.startswith("COLOR_") for key in attributes)

    gltf_points = [
        Vector(point)
        for point in accessor_rows(
            document,
            binary,
            attributes["POSITION"],
        )
    ]
    gltf_normals = [
        Vector(normal)
        for normal in accessor_rows(
            document,
            binary,
            attributes["NORMAL"],
        )
    ]
    uvs = accessor_rows(
        document,
        binary,
        attributes["TEXCOORD_0"],
    )

    assert len(gltf_points) == len(gltf_normals) == len(uvs)
    assert all(
        abs(normal.length - 1) < 1e-4
        for normal in gltf_normals
    )

    # export_yup=True: Blender (x, y, z) → glTF (x, z, -y).
    points = [
        Vector((point.x, -point.z, point.y))
        for point in gltf_points
    ]
    normals = [
        Vector((normal.x, -normal.z, normal.y))
        for normal in gltf_normals
    ]
    slots = [slot_from_uv(uv) for uv in uvs]

    check_bounds(obj.name, points)

    indices = [
        row[0]
        for row in accessor_rows(
            document,
            binary,
            primitive["indices"],
        )
    ]

    assert len(indices) % 3 == 0

    counts = Counter()
    exported_keys = Counter()
    triangles = []

    for offset in range(0, len(indices), 3):
        a, b, c = indices[offset:offset + 3]

        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert slots[a] == slots[b] == slots[c]

        triangle = [points[a], points[b], points[c]]

        assert (
            (triangle[1] - triangle[0])
            .cross(triangle[2] - triangle[0])
            .length
            > 2e-10
        )

        check_clearance(obj.name, triangle)

        counts[slots[a]] += 1
        exported_keys[triangle_key(triangle, slots[a])] += 1
        triangles.append((a, b, c))

    assert len(triangles) == metadata["triangles"]
    assert dict(counts) == metadata["triangles_by_slot"]
    assert exported_keys == model_keys(obj), (
        "GLB 삼각형 위치 또는 색 슬롯이 원본과 다릅니다"
    )

    if obj.name == "bridgeDeck":
        check_seam(points, normals, slots)

        assert check_road(points, triangles) == (
            metadata["checks"]["raycast_samples"]
        )

    verify_embedded_palette(document, binary)

    lower, upper = bounds(gltf_points)

    return {
        "file": str(path),
        "glb_verified": True,
        "export_yup": True,
        "mesh_count": 1,
        "primitive_count": 1,
        "material": "palette",
        "embedded_palette_verified": True,
        "glb_bounds": {
            "min": list(lower),
            "max": list(upper),
        },
        "glb_dimensions": list(upper - lower),
        "glb_triangles_by_slot": dict(sorted(counts.items())),
    }


def export_glb(obj, metadata):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    path = OUTPUT / f"{obj.name}.glb"

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

    return verify_glb(path, obj, metadata)


def preview_clone(scene, source, name, position):
    obj = bpy.data.objects.new(name, source.data)
    scene.collection.objects.link(obj)
    obj.location = position

    return obj


def make_preview_bank(scene, y, index):
    rings = [
        ellipse_ring(0, y, z, rx, ry, 16)
        for z, rx, ry in (
            (-.52, 3.95, 1.7),
            (-.20, 3.8, 1.6),
            (-.04, 3.65, 1.5),
        )
    ]

    vertices = [point for ring in rings for point in ring]
    faces = []

    for level in range(2):
        for i in range(16):
            j = (i + 1) % 16

            faces.append((
                level * 16 + i,
                level * 16 + j,
                (level + 1) * 16 + j,
                (level + 1) * 16 + i,
            ))

    faces.append(tuple(range(32, 48)))

    mesh = bpy.data.meshes.new(f"preview-bank-{index}")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(bpy.data.materials["palette"])

    uv = mesh.uv_layers.new(name="UVMap")

    for item in uv.data:
        item.uv = (1.5 / 32, .5)

    mesh.update()

    obj = bpy.data.objects.new(mesh.name, mesh)
    scene.collection.objects.link(obj)

    return obj


def make_preview_scene(objects):
    scene = bpy.data.scenes.new("bridge-comparison")
    bpy.context.window.scene = scene

    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.show_shadows = True
    shading.shadow_intensity = .3
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.cavity_ridge_factor = 1.15
    shading.cavity_valley_factor = 1.1
    shading.curvature_ridge_factor = 1.15
    shading.curvature_valley_factor = 1.1
    shading.show_object_outline = False
    shading.show_specular_highlight = False
    shading.background_type = "WORLD"

    world = bpy.data.worlds.new("bridge-preview-world")
    world.color = (.04, .47, .52)
    scene.world = world

    clones = [
        preview_clone(
            scene,
            objects["bridgeDeck"],
            f"preview-deck-{i}",
            (0, (i - 1.5) * LENGTH, 0),
        )
        for i in range(4)
    ]

    for side in (-1, 1):
        clones.append(preview_clone(
            scene,
            objects["bridgeEnd"],
            f"preview-end-{side}",
            (0, side * 4.8, 0),
        ))
        make_preview_bank(scene, side * 6.15, side)

    water_mesh = bpy.data.meshes.new("preview-water")
    water_mesh.from_pydata(
        [
            (-40, -40, -.55),
            (40, -40, -.55),
            (40, 40, -.55),
            (-40, 40, -.55),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    water_mesh.update()

    water_material = bpy.data.materials.new("preview-water-material")
    water_material.diffuse_color = (.015, .52, .58, 1)
    water_mesh.materials.append(water_material)

    water = bpy.data.objects.new("preview-water", water_mesh)
    scene.collection.objects.link(water)

    scene.view_layers[0].update()

    points = [
        clone.matrix_world @ vertex.co
        for clone in clones
        for vertex in clone.data.vertices
    ]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2

    elevation = math.radians(35)
    direction = Vector((
        .8 * math.cos(elevation),
        -.6 * math.cos(elevation),
        math.sin(elevation),
    ))
    orientation = (-direction).to_track_quat("-Z", "Y")
    basis = orientation.to_matrix()

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
        "bridge-preview-camera",
        bpy.data.cameras.new("bridge-preview-camera"),
    )
    scene.collection.objects.link(camera)

    camera.data.type = "ORTHO"
    camera.data.clip_start = .01
    camera.data.clip_end = 200
    camera.data.ortho_scale = 1
    camera.location = target + direction * 30
    camera.rotation_euler = orientation.to_euler()

    frame_lower, frame_upper = bounds(
        camera.data.view_frame(scene=scene)
    )
    camera.data.ortho_scale = 1.2 * max(
        (screen_upper.x - screen_lower.x)
        / (frame_upper.x - frame_lower.x),
        (screen_upper.y - screen_lower.y)
        / (frame_upper.y - frame_lower.y),
    )

    scene.camera = camera
    scene.view_layers[0].update()

    assert scene.render.engine == "BLENDER_WORKBENCH"
    assert shading.color_type == "TEXTURE"

    return scene


def render_comparison(objects):
    scene = make_preview_scene(objects)
    path = OUTPUT / "bridge.png"
    scene.render.filepath = str(path)

    result = bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )

    assert result == {"FINISHED"}
    assert path.is_file()
    assert path.stat().st_size > 1024

    data = path.read_bytes()

    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", data, 16) == (1600, 1100)

    rendered = bpy.data.images.load(str(path), check_existing=False)

    assert tuple(rendered.size) == (1600, 1100)

    pixels = list(rendered.pixels)
    samples = [
        pixels[offset + channel]
        for offset in range(0, len(pixels), 4 * 97)
        for channel in range(3)
    ]

    assert max(samples) - min(samples) > .05

    return {
        "file": str(path),
        "render_verified": True,
        "engine": "BLENDER_WORKBENCH",
        "color_type": "TEXTURE",
        "camera_elevation_degrees": 35,
        "deck_tiles": 4,
        "deck_centers_y": [-3.6, -1.2, 1.2, 3.6],
        "end_centers_y": [-4.8, 4.8],
        "bridge_length_m": 9.6,
        "export_origins_unchanged": True,
        "water_and_banks_preview_only": True,
    }


def main():
    if not __debug__:
        raise RuntimeError("assert 검사를 활성화해야 합니다")

    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError(
            f"Blender 5.3이 필요합니다: {bpy.app.version_string}"
        )

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("--disable-autoexec 옵션으로 실행하세요")

    colors = make_material()

    export_scene = bpy.data.scenes.new("bridge-export")
    export_scene.unit_settings.system = "METRIC"
    export_scene.unit_settings.scale_length = 1
    bpy.context.window.scene = export_scene

    objects = {}
    records = {}

    for make in (make_deck, make_end):
        obj, roles, components = make().finish()
        objects[obj.name] = obj
        records[obj.name] = check_model(obj, roles, components)

    records["bridgeDeck"]["tiling"] = {
        "length_m": LENGTH,
        "y_interval": [-1.2, 1.2],
        "plank_centers_y": list(PLANK_CENTERS),
        "plank_width_y": .55,
        "plank_pitch_y": .6,
        "plank_gap_y": .05,
        "end_margin_y": .025,
        "plank_top_z": TOP,
        "plank_bottom_z": -.06,
        "top_bevel_drop_m": .008,
        "beam_x": [-2, 2],
        "post_x": [-2.35, 2.35],
        "rope_radius_m": .045,
        "rope_sag_m": .06,
        "rope_center_heights_at_posts": [.95, .55],
        "rope_center_heights_at_seams": [.89, .49],
        "ends": "open_planar_beams_and_ropes",
        "float_tolerance_m": EPS,
    }
    records["bridgeEnd"]["clearance"] = {
        "x_interval": [-2.2, 2.2],
        "all_heights_empty": True,
    }

    bpy.context.view_layer.update()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for name, obj in objects.items():
        records[name].update(export_glb(obj, records[name]))

    comparison = render_comparison(objects)

    for name, record in records.items():
        record["palette"] = {
            "source": str(PALETTE),
            "size": [128, 4],
            "sample_pixel": (
                "x = slot * 4 + 2, y = 2 (Blender 하단 기준)"
            ),
            "uv": "u = (slot + 0.5) / 32, v = 0.5",
            "verified_center_colors": colors,
        }
        record["comparison"] = comparison

        path = OUTPUT / f"{name}.json"
        path.write_text(
            json.dumps(record, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        assert json.loads(
            path.read_text(encoding="utf-8")
        )["glb_verified"]

    files = [
        OUTPUT / f"{name}.{extension}"
        for name in objects
        for extension in ("glb", "json")
    ] + [OUTPUT / "bridge.png"]

    assert all(
        path.is_file() and path.stat().st_size > 0
        for path in files
    )

    print(json.dumps({
        "output": str(OUTPUT),
        "files": [str(path) for path in files],
        "triangles": {
            name: record["triangles"]
            for name, record in records.items()
        },
        "verified": True,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
