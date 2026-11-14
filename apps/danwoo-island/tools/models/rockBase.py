"""
Blender 5.3
실행: Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/rock_base.py
출력: rockBase.glb, rockBase.png(원작 소품과 비교 렌더)
860삼각형·닫힌 메시·GLB 직렬화·비교 씬 생성은 메모리 검증했다.
렌더와 파일 저장은 실행하지 않았다.
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
NAME = "rockBase"
TARGET = Vector((1.60, 1.60, 0.60))
FRONT = Vector((0, -1, 0))
EPSILON = 1e-5
SEGMENTS = 24
SLOTS = {"sand": 1, "shade": 13, "white": 23}

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
            "smooth_faces": sum(face.use_smooth for face in obj.data.polygons),
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
        rgb = [
            pixels[4 * (2 * 128 + slot * 4 + 2) + channel]
            for channel in range(3)
        ]

        print(json.dumps({
            "color": label,
            "slot": slot,
            "actual": "#" + "".join(
                f"{round(value * 255):02X}" for value in rgb
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
        assert len(first) == len(second) == len(slots)

        for index in range(len(first)):
            following = (index + 1) % len(first)

            self.face(
                (
                    first[index],
                    first[following],
                    second[following],
                    second[index],
                ),
                slots[index],
            )

    def finish(self):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Object name already exists: " + NAME)

        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate(verbose=False)

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        size = upper - lower
        center = (lower + upper) / 2

        assert min(size) > EPSILON

        # 치수 보정을 정점에 적용해 GLB 노드 변환을 항등으로 유지한다.
        for vertex in mesh.vertices:
            vertex.co = Vector(tuple(
                (vertex.co[axis] - center[axis]) * TARGET[axis] / size[axis]
                for axis in range(3)
            ))

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for face, slot in zip(mesh.polygons, self.slots, strict=True):
            face.use_smooth = False

            for index in face.loop_indices:
                uv.data[index].uv = ((slot + 0.5) / 32, 0.5)

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

            assert not remaining, "Expected one connected closed surface"
            assert len(bm.verts) - len(bm.edges) + len(bm.faces) == 2

            volume = bm.calc_volume(signed=True)
            assert abs(volume) > 1e-8

            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(bm.faces))

            assert bm.calc_volume(signed=True) > 0
            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert 600 <= len(mesh.loop_triangles) <= 2000

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)

        assert (upper - lower - TARGET).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert abs(lower.z + 0.30) < EPSILON
        assert abs(upper.z - 0.30) < EPSILON

        bottom = [
            vertex.co for vertex in mesh.vertices
            if abs(vertex.co.z - lower.z) < EPSILON
        ]
        top = [
            vertex.co for vertex in mesh.vertices
            if abs(vertex.co.z - upper.z) < EPSILON
        ]

        assert len(bottom) == len(top) == SEGMENTS

        top_lower, top_upper = bounds(top)

        assert top_upper.x - top_lower.x > TARGET.x * 0.72
        assert top_upper.y - top_lower.y > TARGET.y * 0.72

        top_area = sum(
            face.area for face in mesh.polygons
            if all(
                abs(mesh.vertices[index].co.z - upper.z) < EPSILON
                for index in face.vertices
            )
        )

        assert top_area > 1.0
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
        assert tuple(obj.rotation_euler) == (0, 0, 0)
        assert tuple(obj.scale) == (1, 1, 1)

        print(json.dumps({
            "mesh": NAME,
            "triangles": len(mesh.loop_triangles),
            "connected_components": 1,
            "flat_top_area": top_area,
            "dimensions": tuple(upper - lower),
        }, ensure_ascii=False))

        return obj


def build_rock_base():
    builder = Builder()
    sand, shade, white = (
        SLOTS[key] for key in ("sand", "shade", "white")
    )

    # 겹치는 내부 면을 피하도록 세 층을 하나의 외피로 연결한다.
    tiers = (
        {
            "radius": (0.800, 0.800),
            "center": (-0.010, 0.005),
            "phase": 0.04,
            "power": 0.78,
            "heights": (0.000, 0.028, 0.065, 0.145, 0.184, 0.215),
            "scales": (0.91, 0.98, 1.00, 1.00, 0.97, 0.94),
        },
        {
            "radius": (0.735, 0.730),
            "center": (0.014, 0.014),
            "phase": -0.08,
            "power": 0.82,
            "heights": (0.215, 0.239, 0.270, 0.335, 0.375, 0.405),
            "scales": (0.90, 0.98, 1.00, 1.00, 0.97, 0.94),
        },
        {
            "radius": (0.695, 0.690),
            "center": (-0.012, -0.006),
            "phase": 0.06,
            "power": 0.86,
            "heights": (0.405, 0.430, 0.464, 0.545, 0.577, 0.600),
            "scales": (0.88, 0.98, 1.00, 1.00, 0.975, 0.94),
        },
    )

    previous = None

    for tier_index, tier in enumerate(tiers):
        phase = tier["phase"]
        outline = []

        for index in range(SEGMENTS):
            angle = index * math.tau / SEGMENTS
            cosine, sine = math.cos(angle), math.sin(angle)

            roughness = (
                1
                + 0.025 * math.cos(3 * angle + tier_index * 0.8)
                + 0.018 * math.sin(5 * angle - tier_index * 0.7)
            )

            x = (
                math.copysign(abs(cosine) ** tier["power"], cosine)
                * tier["radius"][0]
                * roughness
            )
            y = (
                math.copysign(abs(sine) ** tier["power"], sine)
                * tier["radius"][1]
                * roughness
            )

            outline.append((
                x * math.cos(phase) - y * math.sin(phase),
                x * math.sin(phase) + y * math.cos(phase),
            ))

        for level, (height, scale) in enumerate(zip(
            tier["heights"],
            tier["scales"],
            strict=True,
        )):
            points = []

            for index, (x, y) in enumerate(outline):
                angle = index * math.tau / SEGMENTS

                wave = (
                    0.006 * math.sin(3 * angle + tier_index)
                    + 0.003 * math.cos(5 * angle - tier_index)
                ) if level in (1, 2, 3, 4) else 0

                points.append((
                    tier["center"][0] + x * scale,
                    tier["center"][1] + y * scale,
                    height + wave,
                ))

            current = builder.ring(points)

            if previous is None:
                builder.face(reversed(current), sand)
            else:
                colors = [sand] * SEGMENTS

                if tier_index > 0 and level == 1:
                    colors = [shade] * SEGMENTS

                if level == 5:
                    colors = [
                        white
                        if (index + 3 * tier_index) % 7 in (0, 1)
                        else sand
                        for index in range(SEGMENTS)
                    ]

                builder.bridge(previous, current, colors)

            previous = current

    builder.face(previous, sand)
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

    assert stride >= size
    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + row * stride)
        for row in range(accessor["count"])
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
    assert node["name"] == NAME and node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]

    scene = document["scenes"][document.get("scene", 0)]
    assert scene["nodes"] == [0]

    primitive, = mesh["primitives"]

    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]

    assert {"POSITION", "NORMAL", "TEXCOORD_0"}.issubset(attributes)
    assert not any(key.startswith("COLOR_") for key in attributes)

    points = [
        Vector(row)
        for row in accessor_rows(document, binary, attributes["POSITION"])
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

    assert 600 <= triangles <= 2000
    assert triangles == len(obj.data.loop_triangles)

    def yup(point):
        x, y, z = point
        return Vector((x, z, -y))

    lower, upper = bounds(points)

    assert (
        upper - lower - Vector((1.60, 0.60, 1.60))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON
    assert (yup(FRONT) - Vector((0, 0, 1))).length < EPSILON

    expected = [yup(vertex.co) for vertex in obj.data.vertices]

    # GLB는 UV·법선 경계에서 정점을 복제하므로 위치 집합으로 대조한다.
    def position_key(point):
        return tuple(round(value, 5) for value in point)

    assert {
        position_key(point) for point in points
    } == {
        position_key(point) for point in expected
    }

    assert abs(lower.y + 0.30) < EPSILON
    assert abs(upper.y - 0.30) < EPSILON

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
        "front_blender": tuple(FRONT),
        "front_glb": tuple(yup(FRONT)),
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
        column, row = index % 4, index // 4

        position = screen_right * (-0.1 + column * 1.5)
        position += Vector((0, 0, 1.7 if row == 0 else 0))

        clones.append(clone_for_preview(
            scene,
            references[label],
            position,
            1.35,
        ))

    print(
        "COMPARE: rockBase left; original references right:",
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

    obj = build_rock_base()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj)

    if not args.skip_render:
        render_comparison(obj, references)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
