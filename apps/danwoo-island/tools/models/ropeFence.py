"""
Blender 5.3
실행: blender -b --factory-startup --disable-autoexec --python /absolute/path/to/rope_fence.py
기본 실행은 ropeFence.glb와 원작 소품 비교 ropeFence.png를 저장한다.
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
NAME = "ropeFence"
TARGET = Vector((2.16, 0.20, 1.26))
EPSILON = 1e-5
POST_X = 1.04
SLOTS = {
    "sand": 1,
    "coral": 10,
    "wood": 14,
    "light_wood": 18,
    "white": 23,
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

    for label, slot in SLOTS.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        rgb = pixels[offset:offset + 3]

        print(json.dumps({
            "color": label,
            "slot": slot,
            "actual": "#" + "".join(
                f"{round(channel * 255):02X}"
                for channel in rgb
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

        for i in range(len(first)):
            j = (i + 1) % len(first)
            slot = slots[i] if isinstance(slots, (tuple, list)) else slots

            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
            )

    def tube(self, points, radii, slot, n=8, cyclic=False, twist=0):
        points = [Vector(point) for point in points]
        count = len(points)

        assert count >= 3
        assert len(radii) == count

        rings = []
        reference = Vector((0, 0, 1) if cyclic else (0, 1, 0))

        for i, (point, radius) in enumerate(zip(points, radii, strict=True)):
            previous = (
                points[(i - 1) % count]
                if cyclic
                else points[max(0, i - 1)]
            )
            following = (
                points[(i + 1) % count]
                if cyclic
                else points[min(count - 1, i + 1)]
            )
            tangent = (following - previous).normalized()
            side = reference - tangent * reference.dot(tangent)

            assert side.length > EPSILON

            side.normalize()
            up = tangent.cross(side).normalized()

            rings.append(self.ring([
                point + radius * (
                    side * math.cos(j * math.tau / n + twist * i)
                    + up * math.sin(j * math.tau / n + twist * i)
                )
                for j in range(n)
            ]))

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)

        if cyclic:
            self.bridge(rings[-1], rings[0], slot)
        else:
            self.face(reversed(rings[0]), slot)
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

        for polygon, slot in zip(mesh.polygons, self.slots, strict=True):
            polygon.use_smooth = False

            for loop_index in polygon.loop_indices:
                uv.data[loop_index].uv = ((slot + 0.5) / 32, 0.5)

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)

        assert (upper - lower - TARGET).length < EPSILON
        assert abs(lower.z) < EPSILON

        center = (lower + upper) / 2

        for vertex in mesh.vertices:
            vertex.co -= center

        bm = bmesh.new()
        component_count = 0

        try:
            bm.from_mesh(mesh)

            bmesh.ops.recalc_face_normals(
                bm,
                faces=list(bm.faces),
            )
            bmesh.ops.triangulate(
                bm,
                faces=list(bm.faces),
                quad_method="BEAUTY",
                ngon_method="EAR_CLIP",
            )
            bmesh.ops.recalc_face_normals(
                bm,
                faces=list(bm.faces),
            )

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

                component_count += 1

            assert component_count == 10

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

        ground = [
            vertex.co
            for vertex in mesh.vertices
            if abs(vertex.co.z - lower.z) < EPSILON
        ]

        assert len(ground) == 16
        assert sum(point.x < 0 for point in ground) == 8
        assert sum(point.x > 0 for point in ground) == 8
        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used_slots = set()

        for polygon in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[i].uv)
                for i in polygon.loop_indices
            ]

            for value in values:
                check_uv(value)
                used_slots.add(round(value[0] * 32 - 0.5))

            assert all(value == values[0] for value in values)

        assert used_slots == set(SLOTS.values())

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)

        print(json.dumps({
            "closed_components": component_count,
            "triangles": len(mesh.loop_triangles),
            "palette_slots": sorted(used_slots),
        }))

        return obj, center


def build_post(builder, sign):
    # 바깥 치수를 유지하면서 안쪽 굴곡으로 유목의 비대칭을 만든다.
    profile = (
        (0.000, 0.000, 0.026, 0.073),
        (0.028, 0.000, 0.038, 0.095),
        (0.100, 0.000, 0.040, 0.100),
        (0.380, 0.015, 0.050, 0.094),
        (0.700, 0.022, 0.058, 0.090),
        (1.080, 0.013, 0.047, 0.086),
        (1.225, 0.000, 0.035, 0.075),
        (1.260, 0.000, 0.022, 0.056),
    )

    rings = [
        builder.ring([
            (
                sign * (POST_X - inset) + rx * math.cos(i * math.tau / 8),
                ry * math.sin(i * math.tau / 8),
                z,
            )
            for i in range(8)
        ])
        for z, inset, rx, ry in profile
    ]

    side_slots = [
        SLOTS["light_wood"] if i in (4, 5) else SLOTS["wood"]
        for i in range(8)
    ]

    builder.face(reversed(rings[0]), SLOTS["wood"])

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, side_slots)

    builder.face(rings[-1], SLOTS["light_wood"])


def build_rope(builder, anchor_z, sag, phase):
    points = []
    radii = []

    for i in range(21):
        t = i / 20
        bow = 4 * t * (1 - t)

        points.append((
            -POST_X + 2 * POST_X * t,
            -0.065 + 0.041 * bow,
            anchor_z - sag * bow,
        ))
        radii.append(
            0.027 * (1 + 0.035 * math.sin(i * 1.7 + phase))
        )

    builder.tube(
        points,
        radii,
        SLOTS["sand"],
        n=8,
        twist=0.14,
    )

    for sign in (-1, 1):
        points = [
            (
                sign * 1.024 + 0.042 * math.cos(i * math.tau / 10),
                0.085 * math.sin(i * math.tau / 10),
                anchor_z + 0.003 * math.sin(i * math.tau / 10),
            )
            for i in range(10)
        ]

        builder.tube(
            points,
            [0.012] * 10,
            SLOTS["sand"],
            n=6,
            cyclic=True,
        )


def build_buoy(builder):
    profile = (
        (0.540, 0.030, "coral"),
        (0.556, 0.060, "coral"),
        (0.600, 0.090, "coral"),
        (0.636, 0.098, "coral"),
        (0.672, 0.094, "white"),
        (0.720, 0.072, "coral"),
        (0.760, 0.036, "coral"),
        (0.782, 0.022, "coral"),
    )

    rings = [
        builder.ring([
            (
                radius * math.cos(i * math.tau / 12),
                -0.018 + radius * 0.70 * math.sin(i * math.tau / 12),
                z,
            )
            for i in range(12)
        ])
        for z, radius, color in profile
    ]

    builder.face(reversed(rings[0]), SLOTS["coral"])

    for i in range(1, len(rings)):
        builder.bridge(
            rings[i - 1],
            rings[i],
            SLOTS[profile[i][2]],
        )

    builder.face(rings[-1], SLOTS["coral"])

    builder.tube(
        [
            (0, -0.024, 0.845),
            (0, -0.021, 0.812),
            (0, -0.018, 0.774),
        ],
        [0.014, 0.013, 0.014],
        SLOTS["sand"],
        n=6,
    )


def build_fence():
    builder = Builder()

    for sign in (-1, 1):
        build_post(builder, sign)

    build_rope(builder, 1.035, 0.190, 0)
    build_rope(builder, 0.600, 0.180, 1.1)
    build_buoy(builder)

    obj, center = builder.finish()

    markers = {
        "front": (0, -1, 0),
        "buoy": tuple(Vector((0, -0.018, 0.65)) - center),
        "post_x": [-POST_X, POST_X],
    }

    return obj, markers


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
    start = (
        view.get("byteOffset", 0)
        + accessor.get("byteOffset", 0)
    )

    assert accessor["count"] > 0
    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_glb(path, obj, markers):
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

    assert {
        "POSITION",
        "NORMAL",
        "TEXCOORD_0",
    }.issubset(attributes)

    assert not any(
        key.startswith("COLOR_")
        for key in attributes
    )

    points = [
        Vector(row)
        for row in accessor_rows(
            document,
            binary,
            attributes["POSITION"],
        )
    ]
    normals = accessor_rows(
        document,
        binary,
        attributes["NORMAL"],
    )
    uvs = accessor_rows(
        document,
        binary,
        attributes["TEXCOORD_0"],
    )

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

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

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

    lower, upper = bounds(points)

    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON
    assert abs(lower.y + TARGET.z / 2) < EPSILON

    # export_yup: Blender (X,Y,Z) → glTF (X,Z,−Y).
    def yup(point):
        x, y, z = point
        return Vector((x, z, -y))

    assert yup(markers["front"]).z == 1
    assert yup(markers["buoy"]).z > 0
    assert markers["post_x"] == [-1.04, 1.04]

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
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    return {
        "file": str(path),
        "triangles": triangles,
        "blender_dimensions": tuple(TARGET),
        "glb_dimensions": tuple(upper - lower),
        "front_blender": "-Y",
        "front_glb": "+Z",
    }


def export_glb(obj, markers):
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

    return verify_glb(path, obj, markers)


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
        "COMPARE: ropeFence left; original references right:",
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

    aspect = (
        scene.render.resolution_x
        / scene.render.resolution_y
    )
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

    obj, markers = build_fence()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, markers)

    if not args.skip_render:
        render_comparison(obj, references)
        result["comparison"] = str(OUTPUT / (NAME + ".png"))

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
