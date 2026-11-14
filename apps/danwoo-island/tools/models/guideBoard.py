"""
Blender 5.3
실행: Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/guide_board.py

메시·GLB 직렬화 메모리 검증 통과: 1,920삼각형.
파일 저장은 실행하지 않았으며, 비교 렌더는 검증 환경의 Metal 장치 부재로 미완료.
"""
import argparse
import json
import math
import struct
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
SOURCE = ROOT / "upstream-blend/folio-2025.blend"
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/island2"
NAME = "guideBoard"
TARGET = Vector((3.11, 0.53, 3.46))
EPSILON = 1e-5

MAP_Y = -0.10
MAP_WIDTH = 2.10
MAP_HEIGHT = 1.50
MAP_CENTER_Z = -0.035

SLOTS = {
    "sand": 1,
    "green": 9,
    "wood": 14,
    "light_wood": 18,
}

REFERENCE_NAMES = {
    "statue": "refStatuePhysicalDynamic",
    "anvil": "Cube.094",
    "cauldron": "body.001",
    "lantern": "base",
    "bench": "benchPhysicalDynamic",
    "hut": "wood.002",
    "jukebox": "refJukeboxPhysicalDynamic",
}


def bounds(points):
    points = list(points)
    if not points:
        raise RuntimeError("Empty geometry")

    return (
        Vector(tuple(min(point[axis] for point in points) for axis in range(3))),
        Vector(tuple(max(point[axis] for point in points) for axis in range(3))),
    )


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)

    assert 0 <= slot < 32
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7


def load_source():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3 is required")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("Start Blender with --disable-autoexec")

    for path in (SOURCE, PALETTE):
        if not path.is_file():
            raise FileNotFoundError(path)

    bpy.ops.wm.open_mainfile(
        filepath=str(SOURCE),
        load_ui=False,
        use_scripts=False,
    )

    references = {}

    for label, name in REFERENCE_NAMES.items():
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != "MESH":
            raise RuntimeError("Missing source reference: " + name)

        obj.data.calc_loop_triangles()
        references[label] = obj

        print(json.dumps({
            "reference": label,
            "object": name,
            "triangles": len(obj.data.loop_triangles),
            "smooth_faces": sum(face.use_smooth for face in obj.data.polygons),
            "faces": len(obj.data.polygons),
            "bevels": [
                {"width": modifier.width, "segments": modifier.segments}
                for modifier in obj.modifiers
                if modifier.type == "BEVEL"
            ],
        }, ensure_ascii=False))

    material = bpy.data.materials.get("palette")
    if material is None or material.node_tree is None:
        raise RuntimeError("Missing source palette material")

    textures = [
        node for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    if len(textures) != 1:
        raise RuntimeError("Expected one palette image texture")

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)
    colors = [
        tuple(
            pixels[4 * (2 * 128 + index * 4 + 2) + channel]
            for channel in range(3)
        )
        for index in range(32)
    ]

    for label, slot in SLOTS.items():
        assert 0 <= slot < 32
        assert pixels[4 * (2 * 128 + slot * 4 + 2) + 3] > 0.999

        print(json.dumps({
            "color": label,
            "slot": slot,
            "actual": "#" + "".join(
                f"{round(value * 255):02X}" for value in colors[slot]
            ),
        }, ensure_ascii=False))

    texture = textures[0]
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    texture.mute = False
    material.node_tree.nodes.active = texture
    image.pack()

    return references


def clip_map_polygon(points):
    polygon = [Vector(point) for point in points]
    limits = (
        (0, -MAP_WIDTH / 2, 1),
        (0, MAP_WIDTH / 2, -1),
        (2, MAP_CENTER_Z - MAP_HEIGHT / 2, 1),
        (2, MAP_CENTER_Z + MAP_HEIGHT / 2, -1),
    )

    for axis, boundary, sign in limits:
        if not polygon:
            break

        clipped = []
        previous = polygon[-1]
        previous_distance = sign * (previous[axis] - boundary)

        for current in polygon:
            distance = sign * (current[axis] - boundary)

            if (distance >= 0) != (previous_distance >= 0):
                t = previous_distance / (previous_distance - distance)
                clipped.append(previous.lerp(current, t))

            if distance >= 0:
                clipped.append(current)

            previous = current
            previous_distance = distance

        polygon = clipped

    return polygon


def verify_map_surface(points, triangles):
    covered_area = 0.0

    for indices in triangles:
        vertices = [points[index] for index in indices]
        clipped = clip_map_polygon(vertices)
        if len(clipped) < 3:
            continue

        area = abs(sum(
            point.x * clipped[(index + 1) % len(clipped)].z
            - clipped[(index + 1) % len(clipped)].x * point.z
            for index, point in enumerate(clipped)
        )) / 2

        if area < 1e-10:
            continue

        assert min(point.y for point in clipped) >= MAP_Y - EPSILON, (
            "Geometry obstructs the map rectangle"
        )

        if all(abs(point.y - MAP_Y) < EPSILON for point in clipped):
            normal = (vertices[1] - vertices[0]).cross(
                vertices[2] - vertices[0]
            )
            assert normal.normalized().dot(Vector((0, -1, 0))) > 1 - EPSILON
            covered_area += area

    assert abs(covered_area - MAP_WIDTH * MAP_HEIGHT) < EPSILON, (
        "Map rectangle is not a complete flat front surface",
        covered_area,
    )


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.smoothing = []

    def ring(self, points):
        first = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        return list(range(first, len(self.vertices)))

    def face(self, indices, slot, smooth=False):
        indices = tuple(indices)
        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)

        self.faces.append(indices)
        self.slots.append(slot)
        self.smoothing.append(smooth)

    def bridge(self, first, second, slot, smooth=False):
        assert len(first) == len(second)

        for index in range(len(first)):
            following = (index + 1) % len(first)
            color = slot[index] if isinstance(slot, (list, tuple)) else slot

            self.face(
                (
                    first[index],
                    first[following],
                    second[following],
                    second[index],
                ),
                color,
                smooth,
            )

    def bevel_box(self, center, size, bevel, slot):
        cx, cy, cz = center
        sx, sy, sz = size
        assert 0 < bevel < min(size) / 2

        def outline(hx, hz, cut, y):
            return self.ring([
                (cx + x, y, cz + z)
                for x, z in (
                    (-hx + cut, -hz),
                    (hx - cut, -hz),
                    (hx, -hz + cut),
                    (hx, hz - cut),
                    (hx - cut, hz),
                    (-hx + cut, hz),
                    (-hx, hz - cut),
                    (-hx, -hz + cut),
                )
            ])

        front, back = cy - sy / 2, cy + sy / 2
        rings = [
            outline(
                sx / 2 - bevel,
                sz / 2 - bevel,
                bevel * 0.55,
                front,
            ),
            outline(sx / 2, sz / 2, bevel, front + bevel),
            outline(sx / 2, sz / 2, bevel, back - bevel),
            outline(
                sx / 2 - bevel,
                sz / 2 - bevel,
                bevel * 0.55,
                back,
            ),
        ]

        self.face(rings[0], slot)
        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)
        self.face(reversed(rings[-1]), slot)

    def post(self, sign):
        center_x = sign * 0.4 * TARGET.x
        profile = (
            (-1.730, 0.000, 0.000, 0.115, 0.118),
            (-1.675, -0.005, 0.000, 0.145, 0.142),
            (-1.130, 0.014, -0.012, 0.139, 0.135),
            (-0.300, 0.022, 0.008, 0.132, 0.130),
            (0.560, -0.012, -0.006, 0.123, 0.128),
            (1.240, 0.012, 0.000, 0.115, 0.123),
            (1.300, 0.012, 0.000, 0.095, 0.103),
        )

        rings = [
            self.ring([
                (
                    center_x + sign * dx
                    + rx * math.cos(index * math.tau / 8),
                    0.055 + dy
                    + ry * math.sin(index * math.tau / 8),
                    z,
                )
                for index in range(8)
            ])
            for z, dx, dy, rx, ry in profile
        ]

        self.face(reversed(rings[0]), SLOTS["wood"])
        colors = [
            SLOTS["light_wood"] if index == 5 else SLOTS["wood"]
            for index in range(8)
        ]

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, colors)
        self.face(rings[-1], SLOTS["light_wood"])

    def binding(self, sign):
        center_x = sign * 0.4 * TARGET.x
        rings = [
            self.ring([
                (
                    center_x + radius * math.cos(index * math.tau / 8),
                    0.055 + radius * math.sin(index * math.tau / 8),
                    z,
                )
                for index in range(8)
            ])
            for z, radius in (
                (0.98, 0.118),
                (0.98, 0.151),
                (1.09, 0.151),
                (1.09, 0.118),
            )
        ]

        for index in range(4):
            self.bridge(
                rings[index],
                rings[(index + 1) % 4],
                SLOTS["sand"],
            )

    def peg(self, x):
        rings = [
            self.ring([
                (
                    x + radius * math.cos(index * math.tau / 6),
                    y,
                    MAP_CENTER_Z
                    + radius * math.sin(index * math.tau / 6),
                )
                for index in range(6)
            ])
            for y, radius in (
                (-0.145, 0.020),
                (-0.133, 0.030),
                (-0.095, 0.030),
            )
        ]

        self.face(rings[0], SLOTS["wood"])
        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, SLOTS["wood"])
        self.face(reversed(rings[-1]), SLOTS["wood"])

    def canopy(self):
        rings = [
            self.ring([
                (x, y, roof_height(x) + dz)
                for y, dz in (
                    (-0.238, -0.485),
                    (-0.238, -0.435),
                    (0, 0),
                    (0.238, -0.435),
                    (0.238, -0.485),
                    (0, -0.060),
                )
            ])
            for x in (-1.49, -1.0, -0.5, 0.0, 0.5, 1.0, 1.49)
        ]

        self.face(reversed(rings[0]), SLOTS["green"])
        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, SLOTS["green"])
        self.face(rings[-1], SLOTS["green"])

    def ridge(self):
        rings = [
            self.ring([
                (
                    x,
                    0.05 * math.cos(index * math.tau / 8),
                    roof_height(x)
                    + 0.05 * math.sin(index * math.tau / 8),
                )
                for index in range(8)
            ])
            for x in (-1.48, -0.98, -0.49, 0.0, 0.49, 0.98, 1.48)
        ]

        self.face(reversed(rings[0]), SLOTS["sand"])
        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, SLOTS["sand"])
        self.face(rings[-1], SLOTS["sand"])

    def palm_thatch(self, center_x, sign, slot):
        top, bottom = [], []
        sway = 0.018 * (1 - abs(center_x) / 1.425)

        for t, width in (
            (0.0, 0.40),
            (0.30, 0.94),
            (0.70, 1.00),
            (1.0, 0.25),
        ):
            upper, lower = [], []

            for across in (-1, 0, 1):
                x = (
                    center_x
                    + sway * math.sin(math.pi * t)
                    + across * 0.13 * width
                )
                y = sign * 0.265 * t
                z = (
                    roof_height(x)
                    - 0.46 * t
                    + 0.015 * math.sin(math.pi * t)
                )
                rib = (
                    0.024 * math.sin(math.pi * (0.10 + 0.80 * t))
                    if across == 0
                    else 0
                )

                upper.append((x, y, z + rib))
                lower.append((
                    x,
                    y,
                    z - 0.034 - (0.008 if across == 0 else 0),
                ))

            top.append(self.ring(upper))
            bottom.append(self.ring(lower))

        for row in range(3):
            for column in range(2):
                self.face((
                    top[row][column],
                    top[row][column + 1],
                    top[row + 1][column + 1],
                    top[row + 1][column],
                ), slot)

                self.face((
                    bottom[row + 1][column],
                    bottom[row + 1][column + 1],
                    bottom[row][column + 1],
                    bottom[row][column],
                ), slot)

        def perimeter(rows):
            return [
                rows[0][0],
                rows[0][1],
                rows[0][2],
                rows[1][2],
                rows[2][2],
                rows[3][2],
                rows[3][1],
                rows[3][0],
                rows[2][0],
                rows[1][0],
            ]

        self.bridge(perimeter(bottom), perimeter(top), slot)

    def finish(self):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Object name already exists: " + NAME)

        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate(verbose=False)

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for face, slot, smooth in zip(
            mesh.polygons,
            self.slots,
            self.smoothing,
            strict=True,
        ):
            face.use_smooth = smooth
            for index in face.loop_indices:
                uv.data[index].uv = ((slot + 0.5) / 32, 0.5)

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        assert (upper - lower - TARGET).length < EPSILON

        center = (lower + upper) / 2
        for vertex in mesh.vertices:
            vertex.co -= center

        bm = bmesh.new()

        try:
            bm.from_mesh(mesh)
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

                volume = sum(
                    face.verts[0].co.dot(
                        face.verts[1].co.cross(face.verts[2].co)
                    ) / 6
                    for face in component
                )

                assert abs(volume) > 1e-10

                if volume < 0:
                    bmesh.ops.reverse_faces(
                        bm,
                        faces=list(component),
                    )

            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert 600 <= len(mesh.loop_triangles) <= 2000

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        assert (upper - lower - TARGET).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert abs(lower.z + TARGET.z / 2) < EPSILON
        assert sum(
            abs(vertex.co.z - lower.z) < EPSILON
            for vertex in mesh.vertices
        ) >= 16

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        for polygon in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[index].uv)
                for index in polygon.loop_indices
            ]
            for value in values:
                check_uv(value)
            assert all(value == values[0] for value in values)

        assert len({
            round(mesh.uv_layers.active.data[face.loop_start].uv.x * 32 - 0.5)
            for face in mesh.polygons
        }) == 4

        verify_map_surface(
            [vertex.co.copy() for vertex in mesh.vertices],
            [tuple(triangle.vertices) for triangle in mesh.loop_triangles],
        )

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)

        return obj


def roof_height(x):
    return 1.68 - 0.16 * (x / 1.555) ** 2


def build_board():
    builder = Builder()

    for sign in (-1, 1):
        builder.post(sign)
        builder.binding(sign)
        builder.peg(sign * 1.115)

    builder.bevel_box(
        (0, 0.025, MAP_CENTER_Z),
        (2.38, 0.25, 1.80),
        0.055,
        SLOTS["light_wood"],
    )

    for z in (-0.93, 0.86):
        builder.bevel_box(
            (0, 0.1725, z),
            (2.73, 0.105, 0.16),
            0.03,
            SLOTS["wood"],
        )

    builder.canopy()

    for sign in (-1, 1):
        for index in range(13):
            x = -1.425 + 2.85 * index / 12
            is_dry = index in ((2, 10) if sign == -1 else (5,))

            builder.palm_thatch(
                x,
                sign,
                SLOTS["sand"] if is_dry else SLOTS["green"],
            )

    builder.ridge()
    return builder.finish()


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]
    assert "sparse" not in accessor

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

    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + index * stride)
        for index in range(accessor["count"])
    ]


def verify_glb(path, obj):
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
        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)

    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    assert len(document["buffers"]) == 1
    assert "uri" not in document["buffers"][0]

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]

    assert mesh["name"] == NAME
    assert material["name"] == "palette"
    assert node["name"] == NAME
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]

    primitive, = mesh["primitives"]
    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]
    assert {"POSITION", "NORMAL", "TEXCOORD_0"}.issubset(attributes)
    assert not any(key.startswith("COLOR_") for key in attributes)

    points = [
        Vector(point)
        for point in accessor_rows(
            document,
            binary,
            attributes["POSITION"],
        )
    ]
    normals = accessor_rows(document, binary, attributes["NORMAL"])
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])

    assert len(points) == len(normals) == len(uvs)

    for uv in uvs:
        check_uv(uv)

    indices = [
        row[0]
        for row in accessor_rows(
            document,
            binary,
            primitive["indices"],
        )
    ]
    assert len(indices) % 3 == 0

    for index in range(0, len(indices), 3):
        a, b, c = indices[index:index + 3]

        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a])
            .cross(points[c] - points[a])
            .length > 2e-10
        )
        assert all(
            abs(uvs[a][axis] - uvs[vertex][axis]) < 1e-7
            for vertex in (b, c)
            for axis in range(2)
        )

    triangles = len(indices) // 3
    assert triangles == len(obj.data.loop_triangles)
    assert 600 <= triangles <= 2000
    assert len({round(uv[0] * 32 - 0.5) for uv in uvs}) == 4

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON

    # Blender −Y는 Y-up GLB의 +Z로 변환된다.
    verify_map_surface(
        [Vector((point.x, -point.z, point.y)) for point in points],
        [
            tuple(indices[index:index + 3])
            for index in range(0, len(indices), 3)
        ],
    )

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0
    assert (
        material["pbrMetallicRoughness"]["baseColorTexture"]["index"] == 0
    )
    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    return {
        "file": str(path),
        "triangles": triangles,
        "blender_dimensions": tuple(TARGET),
        "glb_dimensions": tuple(upper - lower),
        "map_front_blender_y": MAP_Y,
        "map_center_blender_z": MAP_CENTER_Z,
        "map_size": (MAP_WIDTH, MAP_HEIGHT),
    }


def export_glb(obj):
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
    return verify_glb(path, obj)


def clone_for_preview(scene, source, position, height):
    mesh = source.data.copy()
    clone = bpy.data.objects.new("preview-" + source.name, mesh)
    scene.collection.objects.link(clone)

    points = [
        source.matrix_world @ vertex.co
        for vertex in source.data.vertices
    ]
    lower, upper = bounds(points)

    center = Vector((
        (lower.x + upper.x) / 2,
        (lower.y + upper.y) / 2,
        lower.z,
    ))
    scale = height / max(upper - lower)

    for vertex, point in zip(mesh.vertices, points, strict=True):
        vertex.co = (point - center) * scale + position

    mesh.update()
    return clone


def make_render_scene(obj, references):
    scene = bpy.data.scenes.new(NAME + "-compare")
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 2400
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"
    scene.world = bpy.data.worlds.new(NAME + "-world")
    scene.world.color = (0.045, 0.045, 0.045)

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "WORLD"
    shading.show_shadows = True
    shading.show_cavity = False

    direction = Vector((0.52, -0.82, 0.48)).normalized()
    rotation = (-direction).to_track_quat("-Z", "Y")
    basis = rotation.to_matrix()
    screen_right = basis @ Vector((1, 0, 0))

    clones = [
        clone_for_preview(
            scene,
            obj,
            screen_right * -3.0,
            3.4,
        )
    ]
    labels = list(REFERENCE_NAMES)

    for index, label in enumerate(labels):
        column = index % 4
        row = index // 4

        position = screen_right * (-0.1 + column * 1.5)
        position += Vector((0, 0, 1.7 if row == 0 else 0))

        clones.append(clone_for_preview(
            scene,
            references[label],
            position,
            1.35,
        ))

    print(
        "COMPARE: guideBoard left; original references right:",
        ", ".join(labels),
    )
    print(
        "COMPARE: display sizes normalized separately; "
        "GLB dimensions are unchanged."
    )

    camera = bpy.data.objects.new(
        NAME + "-camera",
        bpy.data.cameras.new(NAME + "-camera"),
    )
    scene.collection.objects.link(camera)
    scene.camera = camera

    camera.data.type = "ORTHO"
    camera.data.clip_start = 0.01
    camera.data.clip_end = 100

    points = [
        vertex.co.copy()
        for clone in clones
        for vertex in clone.data.vertices
    ]
    lower, upper = bounds(points)
    center = (lower + upper) / 2

    view_points = [
        basis.transposed() @ (point - center)
        for point in points
    ]
    screen_lower, screen_upper = bounds(view_points)

    center += basis @ Vector((
        (screen_lower.x + screen_upper.x) / 2,
        (screen_lower.y + screen_upper.y) / 2,
        0,
    ))

    camera.location = center + direction * 20
    camera.rotation_euler = rotation.to_euler()

    aspect = scene.render.resolution_x / scene.render.resolution_y
    camera.data.ortho_scale = max(
        screen_upper.x - screen_lower.x,
        (screen_upper.y - screen_lower.y) * aspect,
    ) * 1.12

    return scene


def render_comparison(obj, references):
    scene = make_render_scene(obj, references)
    scene.render.filepath = str(OUTPUT / (NAME + ".png"))

    bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)

    references = load_source()
    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene

    obj = build_board()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj)

    if not args.skip_render:
        render_comparison(obj, references)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
