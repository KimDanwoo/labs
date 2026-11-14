"""
Blender 5.3
실행:
Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/lamp_post.py

동일 형상의 메시·GLB 직렬화를 메모리에서 검증했다: 1,388 triangles.
파일 저장과 비교 렌더는 이 스크립트 실행 시 수행한다.
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

NAME = "lampPost"
TARGET = Vector((1.01, 0.40, 3.50))
GLASS_CENTER = Vector((0.315, 0, 1.03))
GLASS_SIZE = Vector((0.34, 0.34, 0.42))
GLASS_MIN = GLASS_CENTER - GLASS_SIZE / 2
GLASS_MAX = GLASS_CENTER + GLASS_SIZE / 2
POLE_X = -0.305
EPSILON = 1e-5
GLASS_CLEARANCE = 1e-4

SLOTS = {
    "rope": 1,
    "basalt": 5,
    "coral": 10,
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


def outside_glass(points):
    lower, upper = bounds(points)

    return any(
        upper[axis] <= GLASS_MIN[axis] - GLASS_CLEARANCE
        or lower[axis] >= GLASS_MAX[axis] + GLASS_CLEARANCE
        for axis in range(3)
    )


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)

    assert slot in SLOTS.values()
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7

    return slot


def yup(point):
    x, y, z = point
    return Vector((x, z, -y))


def from_yup(point):
    x, y, z = point
    return Vector((x, -z, y))


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
                {
                    "width": modifier.width,
                    "segments": modifier.segments,
                }
                for modifier in obj.modifiers
                if modifier.type == "BEVEL"
            ],
        }, ensure_ascii=False))

    material = bpy.data.materials.get("palette")

    if material is None or material.node_tree is None:
        raise RuntimeError("Missing source palette material")

    textures = [
        node
        for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]

    if len(textures) != 1:
        raise RuntimeError("Expected one palette image texture")

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    for label, slot in SLOTS.items():
        color = tuple(
            pixels[4 * (2 * 128 + slot * 4 + 2) + channel]
            for channel in range(3)
        )

        print(json.dumps({
            "color": label,
            "slot": slot,
            "actual": "#" + "".join(
                f"{round(channel * 255):02X}"
                for channel in color
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


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.parts = []

    def ring(self, points):
        first = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)

        return list(range(first, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)

        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)
        assert slot in SLOTS.values()

        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, first, second, slots):
        assert len(first) == len(second)

        for index in range(len(first)):
            following = (index + 1) % len(first)
            slot = (
                slots[index]
                if isinstance(slots, (tuple, list))
                else slots
            )

            self.face(
                (
                    first[index],
                    first[following],
                    second[following],
                    second[index],
                ),
                slot,
            )

    def finish_part(self, first):
        last = len(self.vertices)

        # 部品全体の AABB を分離し、面の横断や内部の充填も排除する。
        assert outside_glass(self.vertices[first:last])
        self.parts.append((first, last))

    def box(self, center, size, bevel, slot):
        first = len(self.vertices)
        center = Vector(center)
        half_x, half_y, half_z = (value / 2 for value in size)

        assert 0 < bevel < min(half_x, half_y, half_z)

        rings = []

        for z, inset in (
            (-half_z, bevel),
            (-half_z + bevel, 0),
            (half_z - bevel, 0),
            (half_z, bevel),
        ):
            x = half_x - inset
            y = half_y - inset
            corner = bevel * 0.5 if inset else bevel

            outline = (
                (x - corner, -y),
                (x, -y + corner),
                (x, y - corner),
                (x - corner, y),
                (-x + corner, y),
                (-x, y - corner),
                (-x, -y + corner),
                (-x + corner, -y),
            )

            rings.append(self.ring([
                center + Vector((px, py, z))
                for px, py in outline
            ]))

        self.face(reversed(rings[0]), slot)

        for lower, upper in zip(rings, rings[1:]):
            self.bridge(lower, upper, slot)

        self.face(rings[-1], slot)
        self.finish_part(first)

    def tube(self, points, radii, slot, n=8, side_slots=None):
        first = len(self.vertices)
        points = [Vector(point) for point in points]

        assert len(points) == len(radii)
        assert len(points) >= 2
        assert n >= 3

        if side_slots is not None:
            assert len(side_slots) == n

        rings = []
        previous_side = None

        for index, (point, radius) in enumerate(
            zip(points, radii, strict=True)
        ):
            tangent = (
                points[min(index + 1, len(points) - 1)]
                - points[max(index - 1, 0)]
            )

            assert tangent.length > EPSILON
            assert radius > 0

            tangent.normalize()

            side = (
                previous_side.copy()
                if previous_side is not None
                else Vector((1, 0, 0))
            )
            side -= tangent * side.dot(tangent)

            if side.length < EPSILON:
                side = tangent.cross(Vector((0, 1, 0)))

            side.normalize()
            previous_side = side.copy()
            up = tangent.cross(side).normalized()

            rings.append(self.ring([
                point + radius * (
                    side * math.cos(j * math.tau / n)
                    + up * math.sin(j * math.tau / n)
                )
                for j in range(n)
            ]))

        self.face(reversed(rings[0]), slot)

        for lower, upper in zip(rings, rings[1:]):
            self.bridge(
                lower,
                upper,
                side_slots if side_slots is not None else slot,
            )

        self.face(rings[-1], slot)
        self.finish_part(first)

    def rope(self, lower_z, upper_z, radius):
        segments = 30
        turns = 2.5

        points = [
            (
                POLE_X + radius * math.cos(
                    -math.pi / 2 + turns * math.tau * index / segments
                ),
                radius * math.sin(
                    -math.pi / 2 + turns * math.tau * index / segments
                ),
                lower_z + (upper_z - lower_z) * index / segments,
            )
            for index in range(segments + 1)
        ]

        self.tube(
            points,
            [0.011] * len(points),
            SLOTS["rope"],
            n=5,
        )

    def finish(self):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Object name already exists: " + NAME)

        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate(verbose=False)

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for face, slot in zip(mesh.polygons, self.slots, strict=True):
            face.use_smooth = False

            for loop_index in face.loop_indices:
                uv.data[loop_index].uv = ((slot + 0.5) / 32, 0.5)

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        center = (lower + upper) / 2

        assert (upper - lower - TARGET).length < EPSILON
        assert center.length < EPSILON

        for vertex in mesh.vertices:
            vertex.co -= center

        for first, last in self.parts:
            assert outside_glass(
                mesh.vertices[index].co
                for index in range(first, last)
            )

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
            component_count = 0

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

                assert outside_glass(
                    vertex.co
                    for face in component
                    for vertex in face.verts
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

                component_count += 1

            assert component_count == len(self.parts)
            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert 600 <= len(mesh.loop_triangles) <= 2000

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)

        assert (upper - lower - TARGET).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert abs(lower.z + 1.75) < EPSILON
        assert abs(upper.z - 1.75) < EPSILON
        assert sum(
            abs(vertex.co.z - lower.z) < EPSILON
            for vertex in mesh.vertices
        ) >= 8

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used_slots = set()

        for polygon in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[index].uv)
                for index in polygon.loop_indices
            ]

            for value in values:
                used_slots.add(check_uv(value))

            assert all(value == values[0] for value in values)
            assert outside_glass(
                mesh.vertices[index].co
                for index in polygon.vertices
            )

        assert used_slots == set(SLOTS.values())

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)
        assert obj.rotation_euler.to_matrix().is_identity

        return obj


def build_lamp_post():
    builder = Builder()

    wood = SLOTS["wood"]
    light_wood = SLOTS["light_wood"]
    basalt = SLOTS["basalt"]
    coral = SLOTS["coral"]

    wood_sides = [
        light_wood if index in (4, 5) else wood
        for index in range(8)
    ]

    builder.box(
        (POLE_X, 0, -1.675),
        (0.40, 0.40, 0.15),
        0.025,
        basalt,
    )

    pole_profile = (
        (-1.63, 0.100),
        (-1.48, 0.096),
        (-0.95, 0.092),
        (-0.25, 0.085),
        (0.50, 0.083),
        (1.10, 0.078),
        (1.48, 0.075),
        (1.75, 0.060),
    )

    builder.tube(
        [(POLE_X, 0, z) for z, radius in pole_profile],
        [radius for z, radius in pole_profile],
        wood,
        side_slots=wood_sides,
    )

    builder.tube(
        [
            (POLE_X, 0, 1.54),
            (-0.18, 0, 1.62),
            (0.02, 0, 1.64),
            (0.21, 0, 1.61),
            (0.335, 0, 1.55),
        ],
        [0.073, 0.070, 0.065, 0.055, 0.045],
        wood,
        side_slots=wood_sides,
    )

    builder.tube(
        [
            (POLE_X, 0, 1.10),
            (-0.17, 0, 1.35),
            (0.10, 0, 1.59),
        ],
        [0.043, 0.040, 0.035],
        wood,
        n=6,
    )

    builder.rope(-0.95, -0.75, 0.100)
    builder.rope(1.31, 1.53, 0.084)

    builder.tube(
        [
            (POLE_X, -0.099, 1.36),
            (-0.285, -0.108, 1.32),
            (-0.295, -0.104, 1.265),
        ],
        [0.017, 0.015, 0.009],
        SLOTS["rope"],
        n=6,
    )

    builder.box(
        (0.315, 0, 0.7875),
        (0.38, 0.40, 0.061),
        0.010,
        light_wood,
    )

    builder.box(
        (0.315, 0, 1.2925),
        (0.38, 0.40, 0.093),
        0.014,
        coral,
    )

    builder.box(
        (0.315, 0, 1.354),
        (0.28, 0.30, 0.040),
        0.008,
        coral,
    )

    for x in (0.1345, 0.4955):
        for y in (-0.1805, 0.1805):
            builder.box(
                (x, y, 1.03),
                (0.018, 0.018, 0.472),
                0.003,
                basalt,
            )

    builder.tube(
        [
            (0.315, 0, 1.59),
            (0.315, 0, 1.43),
            (0.315, 0, 1.368),
        ],
        [0.018, 0.018, 0.019],
        basalt,
        n=6,
    )

    obj = builder.finish()

    print(json.dumps({
        "object": NAME,
        "pole_axis": [POLE_X, 0],
        "glass_center": tuple(GLASS_CENTER),
        "glass_size": tuple(GLASS_SIZE),
        "front_blender": [0, -1, 0],
        "front_glb": tuple(yup((0, -1, 0))),
        "closed_parts": len(builder.parts),
        "triangles": len(obj.data.loop_triangles),
    }, ensure_ascii=False))

    return obj


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
    assert accessor["count"] > 0

    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    assert stride >= size
    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
    )
    assert view.get("byteOffset", 0) + view["byteLength"] <= len(binary)

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

        assert size % 4 == 0
        assert offset + 8 + size <= len(data)
        assert kind not in chunks

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
            document, binary, attributes["POSITION"]
        )
    ]
    normals = accessor_rows(
        document, binary, attributes["NORMAL"]
    )
    uvs = accessor_rows(
        document, binary, attributes["TEXCOORD_0"]
    )

    assert len(points) == len(normals) == len(uvs)

    used_slots = {check_uv(uv) for uv in uvs}
    assert used_slots == set(SLOTS.values())

    for normal in normals:
        assert abs(Vector(normal).length - 1) < 1e-4

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"]
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

        assert outside_glass(
            from_yup(points[vertex])
            for vertex in (a, b, c)
        )

    triangles = len(indices) // 3

    assert triangles == len(obj.data.loop_triangles)
    assert 600 <= triangles <= 2000

    lower, upper = bounds(points)

    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON

    blender_lower, blender_upper = bounds(
        from_yup(point) for point in points
    )

    assert (blender_upper - blender_lower - TARGET).length < EPSILON
    assert abs(blender_lower.z + 1.75) < EPSILON
    assert abs(blender_upper.z - 1.75) < EPSILON

    # Blender −Y 정면은 Y-up GLB의 +Z 정면이다.
    assert (yup((0, -1, 0)) - Vector((0, 0, 1))).length < EPSILON
    assert (
        yup(GLASS_CENTER) - Vector((0.315, 1.03, 0))
    ).length < EPSILON

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0
    assert (
        material["pbrMetallicRoughness"]
        ["baseColorTexture"]["index"] == 0
    )
    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)

    assert start + view["byteLength"] <= len(binary)

    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    return {
        "file": str(path),
        "triangles": triangles,
        "blender_dimensions": tuple(TARGET),
        "glb_dimensions": tuple(upper - lower),
        "glass_center_blender": tuple(GLASS_CENTER),
        "glass_size_blender": tuple(GLASS_SIZE),
        "palette_slots": sorted(used_slots),
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
    clone = bpy.data.objects.new(
        "preview-" + source.name,
        mesh,
    )
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
        position += Vector((
            0,
            0,
            1.7 if row == 0 else 0,
        ))

        clones.append(clone_for_preview(
            scene,
            references[label],
            position,
            1.35,
        ))

    print(
        "COMPARE: lampPost left; original references right:",
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

    result = bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )

    assert result == {"FINISHED"}
    assert (OUTPUT / (NAME + ".png")).is_file()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    references = load_source()

    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene

    obj = build_lamp_post()
    bpy.context.view_layer.update()

    assert len(scene.objects) == 1
    assert (obj.dimensions - TARGET).length < EPSILON

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj)

    if not args.skip_render:
        render_comparison(obj, references)
        result["comparison"] = str(OUTPUT / (NAME + ".png"))

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
