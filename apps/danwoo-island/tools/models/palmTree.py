"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/palmTree.py
"""

import argparse
import json
import math
import struct
import sys
import tempfile
import zlib
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
OUTPUT = ROOT / "codex-work/palm"

NAME = "palmTree"
TARGET = Vector((4.8, 4.6, 6.4))
BASE = Vector((-0.9, 0.0, 0.0))
CROWN = Vector((0.02, 0.0, 5.0))
EPSILON = 1e-5

SLOTS = {
    "leaf": 9,
    "rib": 12,
    "wood": 14,
    "ring": 11,
    "coconut": 5,
}
EXPECTED = {
    9: "#91AD78",
    12: "#ABAE2B",
    14: "#B36D45",
    11: "#988165",
    5: "#4A413C",
}


def bounds(points):
    points = list(points)
    if not points:
        raise RuntimeError("Empty geometry")

    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)
    assert slot in SLOTS.values()
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

    collection = bpy.data.collections.get("visual.005")
    if collection is None:
        raise RuntimeError(
            "Missing cherryTrees reference collection: visual.005"
        )

    depsgraph = bpy.context.evaluated_depsgraph_get()
    references = []

    for obj in sorted(collection.all_objects, key=lambda item: item.name):
        if obj.type != "MESH":
            continue

        evaluated = obj.evaluated_get(depsgraph)
        mesh = bpy.data.meshes.new_from_object(
            evaluated,
            preserve_all_data_layers=True,
            depsgraph=depsgraph,
        )
        snapshot = bpy.data.objects.new("reference-" + obj.name, mesh)
        snapshot.matrix_world = evaluated.matrix_world.copy()
        references.append(snapshot)

    assert len(references) == 7
    assert any(
        obj.name == "reference-treeBody.015"
        for obj in references
    )

    material = bpy.data.materials.get("palette")
    if material is None or material.node_tree is None:
        raise RuntimeError("Missing palette material")

    textures = [
        node for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    assert len(textures) == 1

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)
    image.colorspace_settings.name = "sRGB"

    pixels = list(image.pixels)

    for slot, expected in EXPECTED.items():
        rgb = tuple(
            round(pixels[4 * (2 * 128 + slot * 4 + 2) + channel] * 255)
            for channel in range(3)
        )
        actual = "#" + "".join(f"{channel:02X}" for channel in rgb)
        assert actual == expected, (slot, actual, expected)

        print(json.dumps({
            "palette_slot": slot,
            "actual": actual,
        }))

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

    def ring(self, points):
        first = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        return list(range(first, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)
        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)

        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, first, second, slots):
        assert len(first) == len(second)

        for i in range(len(first)):
            j = (i + 1) % len(first)
            slot = slots[i] if isinstance(slots, (tuple, list)) else slots
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
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

        for polygon, slot in zip(
            mesh.polygons, self.slots, strict=True,
        ):
            polygon.use_smooth = False
            for index in polygon.loop_indices:
                uv.data[index].uv = ((slot + 0.5) / 32, 0.5)

        bm = bmesh.new()
        volumes = []

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
                    bmesh.ops.reverse_faces(bm, faces=list(component))

                volumes.append(abs(volume))

            assert len(volumes) == 14  # 줄기 1 + 닫힌 잎 9 + 코코넛 4
            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert 1500 <= len(mesh.loop_triangles) <= 3500

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        assert (upper - lower - TARGET).length < EPSILON
        assert abs(lower.z) < EPSILON

        base = [
            vertex.co for vertex in mesh.vertices
            if abs(vertex.co.z) < EPSILON
        ]
        assert len(base) == 12

        center = sum(base, Vector()) / len(base)
        assert (center - BASE).length < EPSILON
        assert all(
            abs((point - BASE).length - 0.21) < EPSILON
            for point in base
        )

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

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)

        return obj, center


def palm_center(t):
    return Vector((
        BASE.x + (CROWN.x - BASE.x) * t * t,
        0.025 * math.sin(math.pi * t),
        CROWN.z * t,
    ))


def add_palm(builder):
    profile = [(0.0, 0.21, SLOTS["wood"])]

    for index in range(1, 13):
        for offset, bulge, slot in (
            (-0.18, 0.97, SLOTS["wood"]),
            (-0.08, 1.025, SLOTS["ring"]),
            (0.0, 1.0, SLOTS["ring"]),
        ):
            t = (index + offset) / 12
            profile.append((
                t,
                (0.21 - 0.08 * t) * bulge,
                slot,
            ))

    rings = []

    for t, radius, slot in profile:
        center = palm_center(t)

        if t == 0:
            side = Vector((1, 0, 0))
            up = Vector((0, 1, 0))
        else:
            tangent = Vector((
                2 * (CROWN.x - BASE.x) * t,
                0.025 * math.pi * math.cos(math.pi * t),
                CROWN.z,
            )).normalized()
            side = Vector((0, 1, 0)).cross(tangent).normalized()
            up = tangent.cross(side).normalized()

        rings.append(builder.ring([
            center + radius * (
                side * math.cos(j * math.tau / 12)
                + up * math.sin(j * math.tau / 12)
            )
            for j in range(12)
        ]))

    builder.face(reversed(rings[0]), SLOTS["wood"])

    for index in range(1, len(rings)):
        builder.bridge(
            rings[index - 1],
            rings[index],
            profile[index][2],
        )

    builder.face(rings[-1], SLOTS["wood"])


def add_frond(builder, angle, reach, rise, drop, width, upright=False):
    along = Vector((math.cos(angle), math.sin(angle), 0))
    across = Vector((-math.sin(angle), math.cos(angle), 0))

    def axis(t):
        height = (
            rise * math.sin(math.pi * 0.75 * t)
            if upright
            else rise * math.sin(math.pi * t) - drop * t * t
        )
        return (
            CROWN
            + along * (reach * t)
            + Vector((0, 0, height))
        )

    rings = []
    axis_points = []

    for index, t in enumerate((
        0, .08, .15, .22, .29, .36, .43,
        .50, .57, .64, .71, .78, .85, .92,
    )):
        center = axis(t)
        axis_points.append(center)

        envelope = math.sin(math.pi * (0.06 + 0.90 * t)) ** 0.75
        tooth = 1.0 if index % 2 else 0.42
        half = max(0.026, width * envelope * tooth)

        left = half * (1.0 + 0.06 * math.sin(index))
        right = half
        rib = min(0.026, half * 0.30)
        ridge = 0.036 * (1 - 0.65 * t)
        thickness = 0.014 * (1 - 0.45 * t)

        rings.append(builder.ring([
            center - across * left
            + Vector((0, 0, thickness)),
            center - across * rib
            + Vector((0, 0, ridge + thickness)),
            center + across * rib
            + Vector((0, 0, ridge + thickness)),
            center + across * right
            + Vector((0, 0, thickness)),
            center + across * right
            - Vector((0, 0, thickness)),
            center + across * rib
            - Vector((0, 0, thickness + ridge * .35)),
            center - across * rib
            - Vector((0, 0, thickness + ridge * .35)),
            center - across * left
            - Vector((0, 0, thickness)),
        ]))

    colors = [
        SLOTS[key]
        for key in (
            "leaf", "rib", "leaf", "rib",
            "leaf", "rib", "leaf", "rib",
        )
    ]

    builder.face(reversed(rings[0]), SLOTS["rib"])

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, colors)

    tip = builder.ring([axis(1.0)])[0]
    axis_points.append(axis(1.0))

    for j in range(8):
        builder.face(
            (rings[-1][j], rings[-1][(j + 1) % 8], tip),
            colors[j],
        )

    return {
        "axis": axis_points,
        "tip_index": tip,
        "upright": upright,
    }


def add_coconut(builder, center, radii, phase):
    center = Vector(center)
    bottom = builder.ring([
        center - Vector((0, 0, radii[2])),
    ])[0]
    rings = []

    for latitude in range(1, 4):
        phi = math.pi * latitude / 4
        rings.append(builder.ring([
            center + Vector((
                radii[0] * math.sin(phi)
                * math.cos(j * math.tau / 8 + phase),
                radii[1] * math.sin(phi)
                * math.sin(j * math.tau / 8 + phase),
                -radii[2] * math.cos(phi),
            ))
            for j in range(8)
        ]))

    slot = SLOTS["coconut"]

    for j in range(8):
        builder.face(
            (bottom, rings[0][(j + 1) % 8], rings[0][j]),
            slot,
        )

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, slot)

    top = builder.ring([
        center + Vector((0, 0, radii[2])),
    ])[0]

    for j in range(8):
        builder.face(
            (rings[-1][j], rings[-1][(j + 1) % 8], top),
            slot,
        )


def build_tree():
    builder = Builder()
    add_palm(builder)

    first_leaf = len(builder.vertices)
    fronds = []

    for index, (degrees, reach, rise, drop, width) in enumerate((
        (1, 2.40, .27, .30, .32),
        (43, 2.28, .36, .34, .34),
        (82, 2.32, .30, .28, .31),
        (123, 2.22, .41, .32, .35),
        (164, 2.40, .26, .33, .33),
        (203, 2.26, .36, .34, .32),
        (243, 2.32, .30, .30, .34),
        (282, 2.30, .39, .34, .31),
        (323, .97, 1.40, 0.0, .22),
    )):
        fronds.append(add_frond(
            builder,
            math.radians(degrees),
            reach,
            rise,
            drop,
            width,
            upright=index == 8,
        ))

    last_leaf = len(builder.vertices)
    lower, upper = bounds(builder.vertices[first_leaf:last_leaf])

    sx = TARGET.x / (upper.x - lower.x)
    sy = TARGET.y / (upper.y - lower.y)
    sz = (TARGET.z - CROWN.z) / (upper.z - CROWN.z)

    # 수관만 변형해 바닥 링과 줄기의 지름·곡선을 보존한다.
    def fit(point):
        point = Vector(point)
        return CROWN + Vector((
            (point.x - CROWN.x) * sx,
            (point.y - CROWN.y) * sy,
            (point.z - CROWN.z) * sz,
        ))

    for index in range(first_leaf, last_leaf):
        builder.vertices[index] = tuple(fit(builder.vertices[index]))

    records = []

    for frond in fronds:
        axis = [fit(point) for point in frond["axis"]]
        length = sum(
            (second - first).length
            for first, second in zip(axis, axis[1:])
        )
        tip = Vector(builder.vertices[frond["tip_index"]])

        assert 2.0 <= length <= 2.6, length
        assert tip.z >= 3.6, tuple(tip)

        records.append({
            "length": length,
            "tip": tuple(tip),
        })

    assert min(
        point[2]
        for point in builder.vertices[first_leaf:last_leaf]
    ) >= 3.6

    for index, (dx, dy, dz, size) in enumerate((
        (-.19, -.13, -.21, 1.0),
        (.17, -.14, -.26, 1.06),
        (-.12, .17, -.29, .93),
        (.17, .16, -.20, .96),
    )):
        add_coconut(
            builder,
            CROWN + Vector((dx, dy, dz)),
            (.18 * size, .17 * size, .22 * size),
            index * .31,
        )

    obj, base = builder.finish()

    return obj, {
        "trunk_base": tuple(round(value, 6) for value in base),
        "front_blender": (0, -1, 0),
        "crown": tuple(CROWN),
        "fronds": records,
    }


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

    assert accessor["count"] > 0
    assert stride >= size
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_glb(path, obj, metadata):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (
        b"glTF", 2, len(data),
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

    buffer, = document["buffers"]
    assert "uri" not in buffer

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]

    assert mesh["name"] == node["name"] == NAME
    assert material["name"] == "palette"
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
    assert not any(
        key.startswith("COLOR_")
        for key in attributes
    )

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

    for normal in normals:
        assert abs(Vector(normal).length - 1) < 1e-4

    for uv in uvs:
        check_uv(uv)

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"],
        )
    ]
    assert len(indices) % 3 == 0

    for index in range(0, len(indices), 3):
        a, b, c = indices[index:index + 3]

        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a]).cross(points[c] - points[a]).length
            > 2e-10
        )
        assert all(
            abs(uvs[a][axis] - uvs[vertex][axis]) < 1e-7
            for vertex in (b, c)
            for axis in range(2)
        )

    triangles = len(indices) // 3
    assert 1500 <= triangles <= 3500
    assert triangles == len(obj.data.loop_triangles)

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((4.8, 6.4, 4.6))
    ).length < EPSILON
    assert abs(lower.y) < EPSILON

    base = {
        tuple(point)
        for point in points
        if abs(point.y) < EPSILON
    }
    assert len(base) == 12

    base_center = sum(
        (Vector(point) for point in base),
        Vector(),
    ) / len(base)

    assert (
        base_center - Vector((BASE.x, 0, 0))
    ).length < EPSILON
    assert all(
        abs((Vector(point) - base_center).length - .21) < EPSILON
        for point in base
    )

    front = Vector(metadata["front_blender"])
    front_yup = Vector((front.x, front.z, -front.y))
    assert (front_yup - Vector((0, 0, 1))).length < EPSILON

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0
    assert (
        material["pbrMetallicRoughness"]["baseColorTexture"]["index"]
        == 0
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
        **metadata,
    }


def export_glb(obj, metadata):
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

    return verify_glb(path, obj, metadata)


def clone_group(scene, sources, position, scale=1.0):
    points = [
        source.matrix_world @ vertex.co
        for source in sources
        for vertex in source.data.vertices
    ]
    lower, upper = bounds(points)
    origin = Vector((
        (lower.x + upper.x) / 2,
        (lower.y + upper.y) / 2,
        lower.z,
    ))

    clones = []

    for source in sources:
        mesh = source.data.copy()

        for vertex in mesh.vertices:
            vertex.co = (
                (source.matrix_world @ vertex.co - origin) * scale
                + position
            )

        mesh.update()

        clone = bpy.data.objects.new("preview-" + source.name, mesh)
        scene.collection.objects.link(clone)
        clones.append(clone)

    return clones


def make_render_scene(obj, references, samples):
    scene = bpy.data.scenes.new(NAME + "-compare")

    # CPU 렌더로 Metal/GPU 장치에 대한 의존성을 없앤다.
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False

    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1300
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
    background.inputs["Color"].default_value = (.78, .82, .87, 1)
    background.inputs["Strength"].default_value = .7
    scene.world = world

    clones = clone_group(
        scene,
        [obj],
        Vector((-3.3, 0, 0)),
    )

    lower, upper = bounds(
        source.matrix_world @ vertex.co
        for source in references
        for vertex in source.data.vertices
    )
    reference_scale = TARGET.z / (upper.z - lower.z)

    clones += clone_group(
        scene,
        references,
        Vector((3.3, 0, 0)),
        reference_scale,
    )

    floor_mesh = bpy.data.meshes.new("preview-floor")
    floor_mesh.from_pydata(
        [
            (-200, -200, -.025),
            (200, -200, -.025),
            (200, 200, -.025),
            (-200, 200, -.025),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    floor_mesh.update()

    floor = bpy.data.objects.new("preview-floor", floor_mesh)
    scene.collection.objects.link(floor)

    material = bpy.data.materials.new("preview-ground")
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (.68, .65, .57, 1)
    shader.inputs["Roughness"].default_value = 1
    floor_mesh.materials.append(material)

    for name, position, energy, size in (
        ("key", (-4, -5, 11), 1500, 7),
        ("fill", (6, 2, 9), 900, 6),
    ):
        light = bpy.data.lights.new("preview-" + name, "AREA")
        light.energy = energy
        light.shape = "DISK"
        light.size = size

        lamp = bpy.data.objects.new("preview-" + name, light)
        scene.collection.objects.link(lamp)
        lamp.location = position
        lamp.rotation_euler = (
            Vector((0, 0, 3)) - lamp.location
        ).to_track_quat("-Z", "Y").to_euler()

    points = [
        vertex.co.copy()
        for clone in clones
        for vertex in clone.data.vertices
    ]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2

    cameras = []
    scales = []

    for label, direction in (
        ("front", (0, -1, 0)),
        ("front-45", (0, -1, 1)),
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
        camera.data.clip_start = .01
        camera.data.clip_end = 400
        camera.location = target + direction * 35
        camera.rotation_euler = rotation.to_euler()
        camera.data.ortho_scale = 1

        frame_lower, frame_upper = bounds(
            camera.data.view_frame(scene=scene)
        )

        scales.append(max(
            (screen_upper.x - screen_lower.x)
            / (frame_upper.x - frame_lower.x),
            (screen_upper.y - screen_lower.y)
            / (frame_upper.y - frame_lower.y),
        ) * 1.14)

        cameras.append(camera)

    for camera in cameras:
        camera.data.ortho_scale = max(scales)

    return scene, cameras, reference_scale


def png_chunks(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    offset = 8

    while offset < len(data):
        size = struct.unpack_from(">I", data, offset)[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + size]
        crc = struct.unpack_from(">I", data, offset + 8 + size)[0]

        assert zlib.crc32(kind + payload) & 0xffffffff == crc

        yield kind, payload

        offset += 12 + size

        if kind == b"IEND":
            assert offset == len(data)
            break


def read_render_png(path):
    chunks = list(png_chunks(path.read_bytes()))
    header, = [
        payload for kind, payload in chunks
        if kind == b"IHDR"
    ]

    (
        width,
        height,
        depth,
        color,
        compression,
        filtering,
        interlace,
    ) = struct.unpack(">IIBBBBB", header)

    assert (
        depth, color, compression, filtering, interlace
    ) == (8, 6, 0, 0, 0)

    raw = zlib.decompress(b"".join(
        payload for kind, payload in chunks
        if kind == b"IDAT"
    ))

    stride = width * 4
    assert len(raw) == height * (stride + 1)

    previous = bytearray(stride)
    rows = []

    for y in range(height):
        start = y * (stride + 1)
        filter_type = raw[start]
        row = bytearray(raw[start + 1:start + stride + 1])

        assert 0 <= filter_type <= 4

        for x in range(stride):
            left = row[x - 4] if x >= 4 else 0
            above = previous[x]
            upper_left = previous[x - 4] if x >= 4 else 0

            if filter_type == 0:
                predictor = 0
            elif filter_type == 1:
                predictor = left
            elif filter_type == 2:
                predictor = above
            elif filter_type == 3:
                predictor = (left + above) // 2
            else:
                p = left + above - upper_left
                distances = (
                    abs(p - left),
                    abs(p - above),
                    abs(p - upper_left),
                )
                predictor = (
                    left, above, upper_left,
                )[distances.index(min(distances))]

            row[x] = (row[x] + predictor) & 255

        rows.append(bytes(row))
        previous = row

    return width, height, rows, chunks


def combine_png(left, right, output):
    left_width, left_height, left_rows, chunks = read_render_png(left)
    right_width, right_height, right_rows, _ = read_render_png(right)

    assert left_height == right_height

    def chunk(kind, payload):
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(
                ">I",
                zlib.crc32(kind + payload) & 0xffffffff,
            )
        )

    data = bytearray(b"\x89PNG\r\n\x1a\n")
    data.extend(chunk(
        b"IHDR",
        struct.pack(
            ">IIBBBBB",
            left_width + right_width,
            left_height,
            8, 6, 0, 0, 0,
        ),
    ))

    for kind, payload in chunks:
        if kind in (b"gAMA", b"cHRM", b"sRGB", b"iCCP"):
            data.extend(chunk(kind, payload))

    raw = b"".join(
        b"\x00" + left_row + right_row
        for left_row, right_row in zip(
            left_rows, right_rows, strict=True,
        )
    )

    data.extend(chunk(b"IDAT", zlib.compress(raw, 6)))
    data.extend(chunk(b"IEND", b""))
    output.write_bytes(data)

    assert struct.unpack_from(
        ">II", output.read_bytes(), 16,
    ) == (2800, 1300)


def render_comparison(obj, references, samples):
    scene, cameras, reference_scale = make_render_scene(
        obj, references, samples,
    )
    output = OUTPUT / (NAME + ".png")

    with tempfile.TemporaryDirectory(
        prefix="palm-preview-",
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
        "view_directions": [(0, -1, 0), (0, -1, 1)],
        "objects_in_each_panel": [
            "palmTree (left)",
            "visual.005 (right)",
        ],
        "reference_common_scale": reference_scale,
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
        parser.error("--samples must be positive")

    references = load_source()

    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene

    obj, metadata = build_tree()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, metadata)

    result["comparison"] = (
        render_comparison(obj, references, args.samples)
        if not args.skip_render
        else None
    )

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
