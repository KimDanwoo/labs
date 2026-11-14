"""
Blender 5.3
실행: Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/beach_bench.py
출력: beachBench.glb, beachBench.png(원작 소품 비교 렌더).
메시·GLB 직렬화는 메모리에서 검증했다(1,724삼각형). 렌더·파일 저장은 실행하지 않았다.
"""
import argparse
import json
import math
import struct
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Vector

ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
SOURCE = ROOT / "upstream-blend/folio-2025.blend"
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/island2"
NAME = "beachBench"
TARGET = Vector((2.56, 1.95, 1.21))
EPSILON = 1e-5
SEAT_HEIGHT = TARGET.z * 0.45

SLOTS = {
    "wood": 14,
    "light_wood": 18,
    "coral": 10,
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
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)
    assert slot in SLOTS.values()
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7
    return slot


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
            "smooth_faces": sum(p.use_smooth for p in obj.data.polygons),
            "faces": len(obj.data.polygons),
            "bevels": [
                {"width": m.width, "segments": m.segments}
                for m in obj.modifiers if m.type == "BEVEL"
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
        start = 4 * (2 * 128 + slot * 4 + 2)
        rgb = pixels[start:start + 3]
        print(json.dumps({
            "color": label,
            "slot": slot,
            "actual": "#" + "".join(f"{round(c * 255):02X}" for c in rgb),
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
        self.parts = {}
        self.center = Vector((0, 0, 0))

    def box(
        self, name, *, center, size, slot, bevel=0.025,
        segments=1, rotation=(0, 0, 0), stripe_slots=(),
    ):
        assert name not in self.parts
        assert 0 < bevel < min(size) / 2

        bm = bmesh.new()
        try:
            bmesh.ops.create_cube(bm, size=1.0)
            for vertex in bm.verts:
                vertex.co = Vector(tuple(
                    vertex.co[a] * size[a] for a in range(3)
                ))

            bmesh.ops.bevel(
                bm,
                geom=list(bm.edges),
                offset=bevel,
                segments=segments,
                profile=0.5,
                affect="EDGES",
                clamp_overlap=True,
            )

            # 줄무늬 경계만 분할해 내부 중복 면과 틈을 만들지 않는다.
            for i in range(1, len(stripe_slots)):
                bmesh.ops.bisect_plane(
                    bm,
                    geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
                    dist=1e-7,
                    plane_co=(
                        -size[0] / 2 + size[0] * i / len(stripe_slots),
                        0,
                        0,
                    ),
                    plane_no=(1, 0, 0),
                    clear_inner=False,
                    clear_outer=False,
                )

            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            assert all(
                edge.is_manifold and edge.is_contiguous
                for edge in bm.edges
            )

            bm.verts.ensure_lookup_table()
            bm.verts.index_update()
            first = len(self.vertices)
            transform = Euler(rotation, "XYZ").to_matrix()
            origin = Vector(center)

            self.vertices.extend(
                tuple(transform @ vertex.co + origin)
                for vertex in bm.verts
            )

            for face in bm.faces:
                color = slot
                if stripe_slots:
                    t = face.calc_center_median().x / size[0] + 0.5
                    band = min(
                        len(stripe_slots) - 1,
                        max(0, math.floor(t * len(stripe_slots))),
                    )
                    color = stripe_slots[band]

                self.faces.append(tuple(
                    first + vertex.index for vertex in face.verts
                ))
                self.slots.append(color)

            self.parts[name] = (first, len(self.vertices))
        finally:
            bm.free()

    def part_bounds(self, name):
        first, last = self.parts[name]
        return bounds(self.vertices[first:last])

    def finish(self):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Object name already exists: " + NAME)

        lower, upper = bounds(self.vertices)
        assert (
            lower - Vector((-TARGET.x / 2, -TARGET.y / 2, 0))
        ).length < EPSILON
        assert (
            upper - Vector((TARGET.x / 2, TARGET.y / 2, TARGET.z))
        ).length < EPSILON

        self.center = (lower + upper) / 2
        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(
            [Vector(vertex) - self.center for vertex in self.vertices],
            [],
            self.faces,
        )
        mesh.update()
        assert not mesh.validate(verbose=False)

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")
        for face, slot in zip(mesh.polygons, self.slots, strict=True):
            face.use_smooth = False
            for index in face.loop_indices:
                uv.data[index].uv = ((slot + 0.5) / 32, 0.5)

        bm = bmesh.new()
        component_count = 0
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
        assert abs(lower.z + TARGET.z / 2) < EPSILON

        floor_points = [
            vertex.co for vertex in mesh.vertices
            if abs(vertex.co.z - lower.z) < EPSILON
        ]
        assert len(floor_points) >= 16
        for x_sign in (-1, 1):
            for y_sign in (-1, 1):
                assert sum(
                    point.x * x_sign > 0 and point.y * y_sign > 0
                    for point in floor_points
                ) >= 4

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used_slots = set()
        for face in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[index].uv)
                for index in face.loop_indices
            ]
            used_slots.update(check_uv(value) for value in values)
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
        return obj


def build_bench():
    builder = Builder()
    wood, light, coral, white = (
        SLOTS[key] for key in ("wood", "light_wood", "coral", "white")
    )

    for i, (x, y) in enumerate(
        (x, y) for x in (-1.075, 1.075) for y in (-0.735, 0.735)
    ):
        builder.box(
            f"leg-{i}",
            center=(x, y, 0.195),
            size=(0.205, 0.205, 0.39),
            slot=wood,
            bevel=0.025,
        )

    for i, y in enumerate((-0.785, 0.785)):
        builder.box(
            f"long-apron-{i}",
            center=(0, y, 0.3025),
            size=(2.36, 0.14, 0.165),
            slot=wood,
        )
    for i, x in enumerate((-1.11, 1.11)):
        builder.box(
            f"short-apron-{i}",
            center=(x, 0, 0.3025),
            size=(0.14, 1.64, 0.165),
            slot=wood,
        )

    plank_count, gap = 7, 0.019
    plank_width = (TARGET.y - gap * (plank_count - 1)) / plank_count
    for i in range(plank_count):
        y = -TARGET.y / 2 + plank_width / 2 + i * (plank_width + gap)
        builder.box(
            f"deck-{i}",
            center=(0, y, 0.3575),
            size=(TARGET.x, plank_width, 0.095),
            slot=light,
            bevel=0.018,
        )

    for i, x in enumerate((-1.13, 0, 1.13)):
        builder.box(
            f"back-post-{i}",
            center=(x, 0.865, 0.78),
            size=(0.145, 0.145, 0.78),
            slot=wood,
        )
    builder.box(
        "back-top",
        center=(0, 0.865, 1.145),
        size=(2.45, 0.19, 0.13),
        slot=light,
        bevel=0.03,
    )
    builder.box(
        "back-middle",
        center=(0, 0.865, 0.865),
        size=(2.33, 0.12, 0.13),
        slot=wood,
    )
    builder.box(
        "arm-front-post",
        center=(-1.165, -0.82, 0.64),
        size=(0.145, 0.145, 0.50),
        slot=wood,
    )
    builder.box(
        "arm-top",
        center=(-1.165, -0.005, 0.895),
        size=(0.17, 1.80, 0.13),
        slot=light,
        bevel=0.03,
    )

    builder.box(
        "mattress",
        center=(0.06, -0.07, SEAT_HEIGHT - 0.075),
        size=(2.19, 1.62, 0.15),
        slot=coral,
        bevel=0.065,
        segments=2,
        stripe_slots=tuple(
            coral if i % 2 == 0 else white for i in range(11)
        ),
    )
    for i, (x, yaw) in enumerate(((-0.49, -4), (0.53, 4))):
        builder.box(
            f"pillow-{i}",
            center=(x, 0.64, 0.782),
            size=(0.69, 0.27, 0.48),
            slot=white,
            bevel=0.115,
            segments=2,
            rotation=(math.radians(-13), 0, math.radians(yaw)),
            stripe_slots=(white, white, coral, white, white),
        )

    mattress_lower, mattress_upper = builder.part_bounds("mattress")
    assert abs(mattress_upper.z / TARGET.z - 0.45) < EPSILON
    assert mattress_lower.z < 0.405 < mattress_upper.z

    back_lower, back_upper = builder.part_bounds("back-top")
    arm_lower, arm_upper = builder.part_bounds("arm-top")
    assert back_lower.y > 0
    assert back_upper.x - back_lower.x > TARGET.x * 0.9
    assert arm_upper.x < 0
    assert arm_upper.y - arm_lower.y > TARGET.y * 0.9

    for i in range(4):
        foot_lower, _ = builder.part_bounds(f"leg-{i}")
        assert abs(foot_lower.z) < EPSILON

    obj = builder.finish()
    markers = {
        "front": (0, -1, 0),
        "back": tuple((back_lower + back_upper) / 2 - builder.center),
        "arm": tuple((arm_lower + arm_upper) / 2 - builder.center),
        "seat": tuple(
            Vector((0.06, -0.07, SEAT_HEIGHT)) - builder.center
        ),
    }
    print("DIRECTION", json.dumps(markers))
    return obj, markers


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]
    assert "sparse" not in accessor
    formats = {5121: "B", 5123: "H", 5125: "I", 5126: "f"}
    widths = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
    fmt = "<" + formats[accessor["componentType"]] * widths[accessor["type"]]
    size = struct.calcsize(fmt)
    view = document["bufferViews"][accessor["bufferView"]]
    assert view.get("buffer", 0) == 0

    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    assert stride >= size and accessor["count"] > 0
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
    assert struct.unpack_from("<4sII", data) == (b"glTF", 2, len(data))

    offset, chunks = 12, {}
    while offset < len(data):
        size, kind = struct.unpack_from("<I4s", data, offset)
        assert size % 4 == 0 and offset + 8 + size <= len(data)
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
    assert mesh["name"] == NAME and node["name"] == NAME
    assert material["name"] == "palette" and node["mesh"] == 0
    assert "matrix" not in node and "children" not in node
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
    assert {check_uv(uv) for uv in uvs} == set(SLOTS.values())

    indices = [
        row[0]
        for row in accessor_rows(document, binary, primitive["indices"])
    ]
    assert len(indices) % 3 == 0

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]
        assert min(a, b, c) >= 0 and max(a, b, c) < len(points)
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
    assert triangles == len(obj.data.loop_triangles)
    assert 600 <= triangles <= 2000

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON

    # Blender -Y 정면은 Y-up GLB의 +Z, 바닥은 GLB -Y다.
    def yup(point):
        x, y, z = point
        return Vector((x, z, -y))

    assert yup(markers["front"]).z == 1
    assert yup(markers["back"]).z < 0
    assert yup(markers["arm"]).x < 0
    assert abs(
        (yup(markers["seat"]).y - lower.y) / TARGET.z - 0.45
    ) < EPSILON
    assert abs(lower.y + TARGET.z / 2) < EPSILON

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
        "seat_height_ratio": 0.45,
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
        column, row = index % 4, index // 4
        position = screen_right * (-0.1 + column * 1.5)
        position += Vector((0, 0, 1.7 if row == 0 else 0))
        clones.append(clone_for_preview(
            scene, references[label], position, 1.35,
        ))

    print(
        "COMPARE: beachBench left; original references right:",
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
    bpy.ops.render.render(write_still=True, scene=scene.name)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)

    references = load_source()
    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene
    obj, markers = build_bench()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, markers)
    if not args.skip_render:
        render_comparison(obj, references)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
