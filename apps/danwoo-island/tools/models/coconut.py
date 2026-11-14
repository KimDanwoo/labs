"""
Blender 5.3
실행: Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/coconut.py
출력: coconut.glb, coconut.png(원작 소품 비교 렌더).
384삼각형. 메시·자기 교차·GLB 직렬화·비교 장면 구성을 메모리에서 검증했다.
파일 저장·렌더는 실행하지 않았다.
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
OUTPUT = ROOT / "codex-work/island3"
NAME = "coconut"
TARGET = Vector((0.55, 0.50, 0.48))
EPSILON = 1e-5

SLOTS = {
    "wood": 14,
    "light_wood": 18,
    "basalt": 5,
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
        self.eyes = []

    def vertex(self, point):
        self.vertices.append(Vector(point))
        return len(self.vertices) - 1

    def face(self, indices, slot):
        self.faces.append(tuple(indices))
        self.slots.append(slot)

    def eye(self, quad, slot):
        corners = [self.vertices[index] for index in quad]

        def surface(u, v):
            return (
                corners[0] * (1 - u) * (1 - v)
                + corners[1] * u * (1 - v)
                + corners[2] * u * v
                + corners[3] * (1 - u) * v
            )

        center = surface(0.5, 0.5)
        normal = (
            (corners[1] - corners[0]).cross(corners[3] - corners[0])
        ).normalized()
        if normal.dot(center) < 0:
            normal.negate()

        u_length = (
            (corners[1] - corners[0]).length
            + (corners[2] - corners[3]).length
        ) / 2
        v_length = (
            (corners[3] - corners[0]).length
            + (corners[2] - corners[1]).length
        ) / 2
        radius = 0.0145
        ru = min(0.36, radius / u_length)
        rv = min(0.36, radius / v_length)
        cut = math.sqrt(2) - 1
        outline = (
            (-1, -cut), (-cut, -1), (cut, -1), (1, -cut),
            (1, cut), (cut, 1), (-cut, 1), (-1, cut),
        )
        rim_points = [
            surface(0.5 + u * ru, 0.5 + v * rv)
            for u, v in outline
        ]
        rim = [self.vertex(point) for point in rim_points]
        inner = [
            self.vertex(center + (point - center) * 0.72 - normal * 0.0045)
            for point in rim_points
        ]

        # 기존 면을 대체해 눈과 껍질 사이에 겹친 면이나 열린 경계를 남기지 않는다.
        for i in range(4):
            j = (i + 1) % 4
            self.face(
                (quad[i], quad[j], rim[(2 * i + 2) % 8], rim[2 * i + 1]),
                slot,
            )
            self.face((quad[i], rim[2 * i + 1], rim[2 * i]), slot)

        for i in range(8):
            j = (i + 1) % 8
            self.face((rim[i], rim[j], inner[j], inner[i]), SLOTS["wood"])
        self.face(inner, SLOTS["basalt"])
        self.eyes.append(center - normal * 0.0045)

    def finish(self):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Object name already exists: " + NAME)

        lower, upper = bounds(self.vertices)
        center = (lower + upper) / 2
        size = upper - lower

        def place(point):
            return Vector(tuple(
                (point[axis] - center[axis]) * TARGET[axis] / size[axis]
                for axis in range(3)
            ))

        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata([place(point) for point in self.vertices], [], self.faces)
        mesh.update()
        assert not mesh.validate(verbose=False)
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
                bm, faces=list(bm.faces),
                quad_method="BEAUTY", ngon_method="EAR_CLIP",
            )
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
            assert all(v.is_manifold for v in bm.verts)
            assert all(f.calc_area() > 1e-10 for f in bm.faces)
            assert len(bm.verts) - len(bm.edges) + len(bm.faces) == 2

            remaining = set(bm.faces)
            pending = [remaining.pop()]
            while pending:
                face = pending.pop()
                for edge in face.edges:
                    for neighbor in edge.link_faces:
                        if neighbor in remaining:
                            remaining.remove(neighbor)
                            pending.append(neighbor)
            assert not remaining, "Coconut must be one connected closed shell"

            volume = bm.calc_volume(signed=True)
            assert abs(volume) > 1e-6
            if volume < 0:
                bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
            assert bm.calc_volume(signed=True) > 0
            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()
        triangles = len(mesh.loop_triangles)
        assert 200 <= triangles <= 500
        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        assert (upper - lower - TARGET).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert abs(lower.z + TARGET.z / 2) < EPSILON
        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"
        used_slots = set()
        dark_faces = []

        for face in mesh.polygons:
            values = [tuple(uv.data[index].uv) for index in face.loop_indices]
            slots = {check_uv(value) for value in values}
            assert len(slots) == 1
            used_slots.update(slots)
            if slots == {SLOTS["basalt"]}:
                dark_faces.append(set(face.vertices))
        assert used_slots == set(SLOTS.values())

        remaining = set(range(len(dark_faces)))
        eye_count = 0
        while remaining:
            pending = [remaining.pop()]
            while pending:
                index = pending.pop()
                neighbors = {
                    other for other in remaining
                    if dark_faces[index] & dark_faces[other]
                }
                remaining.difference_update(neighbors)
                pending.extend(neighbors)
            eye_count += 1
        assert eye_count == 3

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)
        assert obj.location.length == 0
        assert tuple(obj.rotation_euler) == (0, 0, 0)
        assert tuple(obj.scale) == (1, 1, 1)
        markers = {
            "front": (0, -1, 0),
            "eyes": [tuple(place(point)) for point in self.eyes],
        }
        assert len(markers["eyes"]) == 3
        assert all(point[1] < 0 and point[2] > 0 for point in markers["eyes"])
        print(json.dumps({
            "closed_components": 1,
            "eye_count": eye_count,
            "triangles": triangles,
            "palette_slots": sorted(used_slots),
            "markers": markers,
        }, ensure_ascii=False))
        return obj, markers


def build_coconut():
    builder = Builder()
    segments, latitudes = 16, 10
    phase = -math.pi / segments
    rings = []

    for latitude in range(1, latitudes):
        theta = math.pi * latitude / latitudes
        ring = []
        for sector in range(segments):
            phi = math.tau * sector / segments + phase
            relief = 1 + (
                0.025 * math.cos(8 * phi + 0.2 * math.sin(theta))
                + 0.012 * math.sin(3 * phi + 0.7 * theta)
            ) * math.sin(theta) ** 2
            ring.append(builder.vertex((
                0.275 * math.sin(theta) * math.cos(phi) * relief,
                0.250 * math.sin(theta) * math.sin(phi) * relief,
                0.240 * math.cos(theta)
                + 0.003 * math.sin(3 * phi) * math.sin(theta) ** 2,
            )))
        rings.append(ring)

    top = builder.vertex((0, 0, 0.240))
    bottom = builder.vertex((0, 0, -0.240))
    eye_cells = {(1, 11), (1, 13), (2, 12)}

    for sector in range(segments):
        following = (sector + 1) % segments
        builder.face((top, rings[0][sector], rings[0][following]), SLOTS["wood"])
        builder.face(
            (bottom, rings[-1][following], rings[-1][sector]), SLOTS["wood"],
        )

    for band in range(len(rings) - 1):
        for sector in range(segments):
            following = (sector + 1) % segments
            quad = (
                rings[band][sector], rings[band + 1][sector],
                rings[band + 1][following], rings[band][following],
            )
            is_fiber_highlight = (
                sector in (2, 7, 10, 14)
                and 2 <= band <= 6
                and (band + sector) % 5 != 0
            )
            slot = SLOTS["light_wood"] if is_fiber_highlight else SLOTS["wood"]
            if (band, sector) in eye_cells:
                builder.eye(quad, slot)
            else:
                builder.face(quad, slot)

    return builder.finish()


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
    assert 200 <= triangles <= 500

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
    assert len(markers["eyes"]) == 3
    assert all(
        yup(point).y > 0 and yup(point).z > 0
        for point in markers["eyes"]
    )
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
        "eye_count": 3,
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
        "COMPARE: coconut left; original references right:",
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
    obj, markers = build_coconut()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, markers)
    if not args.skip_render:
        render_comparison(obj, references)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
