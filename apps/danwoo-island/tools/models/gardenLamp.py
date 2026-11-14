"""
Blender 5.3
실행:
Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/garden_lamp.py

1,148삼각형. 메시·GLB 직렬화는 메모리에서 검증했다.
비교 렌더 장면 구성은 확인했으며, 렌더링·파일 저장은 실행하지 않았다.
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
NAME = "gardenLamp"

TARGET = Vector((0.90, 0.90, 1.26))
GLASS_CENTER = Vector((0, 0, 0.21))
GLASS_SIZE = Vector((0.30, 0.30, 0.22))
FRONT = Vector((0, -1, 0))
EPSILON = 1e-5
CLEARANCE = 0.001

REFERENCE_NAMES = {
    "statue": "refStatuePhysicalDynamic",
    "anvil": "Cube.094",
    "cauldron": "body.001",
    "lantern": "base",
    "bench": "benchPhysicalDynamic",
    "hut": "wood.002",
    "jukebox": "refJukeboxPhysicalDynamic",
}

SLOTS = {
    "sand": 1,
    "white": 23,
    "coral": 10,
    "green": 9,
    "wood": 18,
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


def assert_clearance(points):
    lower, upper = bounds(points)
    glass_lower = GLASS_CENTER - GLASS_SIZE / 2
    glass_upper = GLASS_CENTER + GLASS_SIZE / 2

    assert any(
        upper[axis] <= glass_lower[axis] - CLEARANCE
        or lower[axis] >= glass_upper[axis] + CLEARANCE
        for axis in range(3)
    ), "Geometry enters the reserved glass region"


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

    colors = [
        tuple(
            pixels[4 * (2 * 128 + slot * 4 + 2) + channel]
            for channel in range(3)
        )
        for slot in range(32)
    ]

    for label, slot in SLOTS.items():
        print(json.dumps({
            "color": label,
            "slot": slot,
            "actual": "#" + "".join(
                f"{round(value * 255):02X}"
                for value in colors[slot]
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

    def bridge(self, first, second, slot):
        assert len(first) == len(second)

        for i in range(len(first)):
            j = (i + 1) % len(first)
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
            )

    def radial(self, profile, slot, n=12):
        rings = [
            self.ring([
                (
                    radius * math.cos(i * math.tau / n),
                    radius * math.sin(i * math.tau / n),
                    z,
                )
                for i in range(n)
            ])
            for z, radius in profile
        ]

        self.face(reversed(rings[0]), slot)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)

        self.face(rings[-1], slot)

    def pebble(self, center, size, slot, phase=0):
        center = Vector(center)
        size = Vector(size)
        n = 12
        rings = []

        for height, radius in (
            (-0.50, 0.65),
            (-0.34, 0.90),
            (-0.02, 1.00),
            (0.30, 0.86),
            (0.50, 0.45),
        ):
            points = []

            for j in range(n):
                angle = j * math.tau / n + phase
                relief = (
                    1
                    + 0.045 * math.sin(3 * angle + 0.3)
                    + 0.025 * math.cos(5 * angle - 0.4)
                )

                points.append(center + Vector((
                    math.cos(angle) * radius * relief * size.x / 2,
                    math.sin(angle) * radius * relief * size.y / 2,
                    height * size.z,
                )))

            rings.append(self.ring(points))

        self.face(reversed(rings[0]), slot)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)

        self.face(rings[-1], slot)

    def square_ring(self, center, half_size, corner):
        x, y, z = center
        hx, hy = half_size

        assert 0 < corner < min(hx, hy)

        return self.ring([
            (x - hx + corner, y - hy, z),
            (x + hx - corner, y - hy, z),
            (x + hx, y - hy + corner, z),
            (x + hx, y + hy - corner, z),
            (x + hx - corner, y + hy, z),
            (x - hx + corner, y + hy, z),
            (x - hx, y + hy - corner, z),
            (x - hx, y - hy + corner, z),
        ])

    def bevel_box(self, center, size, bevel, slot):
        x, y, z = center
        hx, hy, hz = (value / 2 for value in size)

        assert 0 < bevel < min(hx, hy, hz)

        rings = [
            self.square_ring(
                (x, y, z + height),
                (width, depth),
                corner,
            )
            for height, width, depth, corner in (
                (-hz, hx - bevel, hy - bevel, bevel * 0.55),
                (-hz + bevel, hx, hy, bevel),
                (hz - bevel, hx, hy, bevel),
                (hz, hx - bevel, hy - bevel, bevel * 0.55),
            )
        ]

        self.face(reversed(rings[0]), slot)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)

        self.face(rings[-1], slot)

    def roof(self, slot):
        rings = [
            self.square_ring((0, 0, z), (half, half), corner)
            for z, half, corner in (
                (0.365, 0.406, 0.070),
                (0.385, 0.450, 0.075),
                (0.415, 0.450, 0.075),
                (0.442, 0.414, 0.069),
                (0.604, 0.094, 0.022),
                (0.630, 0.070, 0.018),
            )
        ]

        self.face(reversed(rings[0]), slot)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)

        self.face(rings[-1], slot)

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

                assert_clearance(
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
        ) >= 12

        used_slots = {
            round(mesh.uv_layers.active.data[face.loop_start].uv.x * 32 - 0.5)
            for face in mesh.polygons
        }

        assert used_slots == set(SLOTS.values())
        assert 2 <= len(used_slots) <= 5
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

        return obj


def build_lamp():
    builder = Builder()

    for center, size, slot, phase in (
        ((0, 0, -0.540), (0.70, 0.62, 0.18), "sand", 0.05),
        ((-0.030, 0.020, -0.414), (0.52, 0.47, 0.18), "white", 0.19),
        ((0.015, -0.010, -0.315), (0.34, 0.32, 0.13), "sand", -0.13),
    ):
        builder.pebble(center, size, SLOTS[slot], phase)

    builder.radial([
        (-0.280, 0.060),
        (-0.267, 0.071),
        (-0.245, 0.076),
        (-0.160, 0.071),
        (-0.060, 0.070),
        (0.038, 0.074),
        (0.066, 0.066),
    ], SLOTS["green"])

    for z in (-0.190, -0.065):
        builder.radial([
            (z - 0.012, 0.070),
            (z - 0.007, 0.083),
            (z + 0.007, 0.083),
            (z + 0.012, 0.070),
        ], SLOTS["wood"])

    for z in (0.060, 0.350):
        builder.bevel_box(
            (0, 0, z),
            (0.445, 0.445, 0.040),
            0.008,
            SLOTS["wood"],
        )

    for x in (-0.182, 0.182):
        for y in (-0.182, 0.182):
            builder.bevel_box(
                (x, y, 0.210),
                (0.052, 0.052, 0.285),
                0.006,
                SLOTS["wood"],
            )

    builder.roof(SLOTS["coral"])

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

    fmt = "<" + formats[accessor["componentType"]] * widths[accessor["type"]]
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
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_glb(path, obj):
    data = path.read_bytes()

    assert struct.unpack_from("<4sII", data) == (b"glTF", 2, len(data))

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
        for point in accessor_rows(document, binary, attributes["POSITION"])
    ]
    normals = accessor_rows(document, binary, attributes["NORMAL"])
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])

    assert len(points) == len(normals) == len(uvs)

    for uv in uvs:
        check_uv(uv)

    indices = [
        row[0]
        for row in accessor_rows(document, binary, primitive["indices"])
    ]

    assert len(indices) % 3 == 0

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

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

    assert 600 <= triangles <= 2000
    assert triangles == len(obj.data.loop_triangles)

    lower, upper = bounds(points)

    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON

    # Blender -Y 정면은 Y-up GLB에서 +Z다.
    assert Vector((FRONT.x, FRONT.z, -FRONT.y)).z == 1

    blender_points = [
        Vector((point.x, -point.z, point.y))
        for point in points
    ]

    for i in range(0, len(indices), 3):
        assert_clearance(
            blender_points[index]
            for index in indices[i:i + 3]
        )

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0
    assert material["pbrMetallicRoughness"]["baseColorTexture"]["index"] == 0
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
        clone_for_preview(scene, obj, screen_right * -3.0, 3.4)
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
        "COMPARE: gardenLamp left; original references right:",
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

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    references = load_source()

    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene

    obj = build_lamp()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj)

    if not args.skip_render:
        render_comparison(obj, references)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
