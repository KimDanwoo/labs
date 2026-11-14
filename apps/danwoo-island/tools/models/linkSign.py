"""
Blender 5.3
실행: blender -b --factory-startup --disable-autoexec --python /absolute/path/to/linkSign.py
렌더 생략: 명령 끝에 -- --skip-render 추가.
메시·GLB 직렬화는 메모리에서 검증했다. 렌더·파일 저장은 실행하지 않았다.
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
NAME = "linkSign"
TARGET = Vector((1.00, 0.30, 1.40))
EPSILON = 1e-5
SLOTS = {"cream": 23, "sand": 1, "wood": 14, "light_wood": 18}
PANEL_Y = 0.15

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
            "bevels": [
                {"width": m.width, "segments": m.segments}
                for m in obj.modifiers
                if m.type == "BEVEL"
            ],
        }, ensure_ascii=False))

    material = bpy.data.materials.get("palette")

    if material is None or material.node_tree is None:
        raise RuntimeError("Missing source palette material")

    textures = [
        n for n in material.node_tree.nodes
        if n.type == "TEX_IMAGE"
    ]

    if len(textures) != 1:
        raise RuntimeError("Expected one palette image texture")

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    for label, slot in SLOTS.items():
        rgb = tuple(
            round(pixels[4 * (2 * 128 + slot * 4 + 2) + c] * 255)
            for c in range(3)
        )

        print(json.dumps({
            "color": label,
            "slot": slot,
            "actual": rgb,
        }, ensure_ascii=False))

    texture = textures[0]
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    texture.mute = False
    material.node_tree.nodes.active = texture
    image.pack()

    return references


def arch_outline(half_width, bottom, shoulder, top):
    cut = 0.055 * half_width / 0.5

    points = [
        (-half_width + cut, bottom),
        (half_width - cut, bottom),
    ]

    for i in range(1, 4):
        angle = -math.pi / 2 + i * math.pi / 6

        points.append((
            half_width - cut + cut * math.cos(angle),
            bottom + cut + cut * math.sin(angle),
        ))

    for i in range(1, 7):
        points.append((
            half_width
            - 0.006 * (half_width / 0.5) * math.sin(i * math.pi / 6) ** 2,
            bottom + cut + (shoulder - bottom - cut) * i / 6,
        ))

    for i in range(1, 17):
        angle = i * math.pi / 16

        points.append((
            half_width * math.cos(angle),
            shoulder + (top - shoulder) * math.sin(angle),
        ))

    for i in range(1, 7):
        points.append((
            -half_width
            + 0.004 * (half_width / 0.5) * math.sin(i * math.pi / 6) ** 2,
            shoulder + (bottom + cut - shoulder) * i / 6,
        ))

    for i in range(1, 3):
        angle = math.pi + i * math.pi / 6

        points.append((
            -half_width + cut + cut * math.cos(angle),
            bottom + cut + cut * math.sin(angle),
        ))

    return points


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []

    def ring(self, points):
        first = len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)
        return list(range(first, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)

        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)

        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, first, second, slot):
        assert len(first) == len(second)

        for i in range(len(first)):
            j = (i + 1) % len(first)
            color = slot[i] if isinstance(slot, (list, tuple)) else slot

            self.face(
                (first[i], first[j], second[j], second[i]),
                color,
            )

    def cap(self, ring, point, slot):
        center = self.ring([point])[0]

        for i in range(len(ring)):
            self.face(
                (ring[i], ring[(i + 1) % len(ring)], center),
                slot,
            )

    def leg(self, x):
        rings = []

        for z, width, depth in (
            (0.000, 0.120, 0.170),
            (0.022, 0.148, 0.202),
            (0.245, 0.134, 0.180),
            (0.325, 0.120, 0.160),
        ):
            cut = 0.022
            hx, hy = width / 2, depth / 2

            rings.append(self.ring([
                (x - hx + cut, -hy, z),
                (x + hx - cut, -hy, z),
                (x + hx, -hy + cut, z),
                (x + hx, hy - cut, z),
                (x + hx - cut, hy, z),
                (x - hx + cut, hy, z),
                (x - hx, hy - cut, z),
                (x - hx, -hy + cut, z),
            ]))

        self.face(reversed(rings[0]), SLOTS["wood"])

        for i in range(1, len(rings)):
            self.bridge(rings[i - 1], rings[i], [
                SLOTS["light_wood"],
                SLOTS["sand"],
                SLOTS["wood"],
                SLOTS["light_wood"],
                SLOTS["light_wood"],
                SLOTS["sand"],
                SLOTS["wood"],
                SLOTS["light_wood"],
            ])

        self.face(rings[-1], SLOTS["wood"])

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
            face.material_index = 0

            for index in face.loop_indices:
                uv.data[index].uv = ((slot + 0.5) / 32, 0.5)

        lower, upper = bounds(v.co for v in mesh.vertices)
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
                e.is_manifold and e.is_contiguous
                for e in bm.edges
            )
            assert all(v.is_manifold for v in bm.verts)
            assert all(f.calc_area() > 1e-10 for f in bm.faces)

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

                volume = sum(
                    f.verts[0].co.dot(
                        f.verts[1].co.cross(f.verts[2].co)
                    ) / 6
                    for f in component
                )

                assert abs(volume) > 1e-10

                if volume < 0:
                    bmesh.ops.reverse_faces(
                        bm,
                        faces=list(component),
                    )

                components += 1

            assert components == 3
            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert 600 <= len(mesh.loop_triangles) <= 2000

        lower, upper = bounds(v.co for v in mesh.vertices)

        assert (upper - lower - TARGET).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert abs(lower.z + TARGET.z / 2) < EPSILON

        assert sum(
            abs(v.co.z - lower.z) < EPSILON
            for v in mesh.vertices
        ) == 16

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used = set()

        for polygon in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[i].uv)
                for i in polygon.loop_indices
            ]

            used.update(check_uv(value) for value in values)
            assert all(value == values[0] for value in values)

        assert used == set(SLOTS.values())

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)
        bpy.context.view_layer.update()

        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)

        verify_panels(obj)
        return obj


def verify_panels(obj):
    # 다양한 가로세로 배율에서 글씨 판이 차지할 수 있는 최대 영역.
    for sign in (-1, 1):
        for x in (-0.28, 0, 0.28):
            for fraction in (0.376, 0.58, 0.784):
                z = (fraction - 0.5) * TARGET.z

                hit, point, normal, index = obj.ray_cast(
                    Vector((x, sign * 0.25, z)),
                    Vector((0, -sign, 0)),
                )

                assert hit
                assert abs(point.y - sign * PANEL_Y) < EPSILON
                assert normal.dot(Vector((0, sign, 0))) > 0.999

                polygon = obj.data.polygons[index]

                for i in polygon.loop_indices:
                    assert check_uv(
                        obj.data.uv_layers.active.data[i].uv
                    ) == SLOTS["cream"]


def build_sign():
    builder = Builder()

    # 양쪽 면을 같은 깊이에 두어 정면과 뒷면 모두 글씨를 붙일 수 있다.
    profiles = (
        (-0.150, 0.405, 0.324, 1.307, "cream"),
        (-0.150, 0.420, 0.310, 1.320, "cream"),
        (-0.150, 0.435, 0.294, 1.337, "sand"),
        (-0.137, 0.473, 0.255, 1.376, "light_wood"),
        (-0.095, 0.500, 0.230, 1.400, "wood"),
        (0.095, 0.500, 0.230, 1.400, "wood"),
        (0.137, 0.473, 0.255, 1.376, "light_wood"),
        (0.150, 0.435, 0.294, 1.337, "sand"),
        (0.150, 0.420, 0.310, 1.320, "cream"),
        (0.150, 0.405, 0.324, 1.307, "cream"),
    )

    rings = [
        builder.ring(
            (x, y, z)
            for x, z in arch_outline(width, bottom, 0.99, top)
        )
        for y, width, bottom, top, slot in profiles
    ]

    builder.cap(
        rings[0],
        (0, -PANEL_Y, 0.80),
        SLOTS["cream"],
    )

    for i in range(1, len(rings)):
        slot = SLOTS[profiles[i][4]]

        if i == 5:
            colors = [
                SLOTS["light_wood"]
                if j in (0, 7, 8, 17, 18, 29)
                else slot
                for j in range(len(rings[i]))
            ]
        else:
            colors = slot

        builder.bridge(rings[i - 1], rings[i], colors)

    builder.cap(
        rings[-1],
        (0, PANEL_Y, 0.80),
        SLOTS["cream"],
    )

    # 다리는 판에 조금 겹쳐 틈을 없애며, 각 부품은 닫힌 형상이다.
    builder.leg(-0.285)
    builder.leg(0.285)

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

    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_glb(data, obj):
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
    assert not any(k.startswith("COLOR_") for k in attributes)

    points = [
        Vector(p)
        for p in accessor_rows(document, binary, attributes["POSITION"])
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
    assert {check_uv(uv) for uv in uvs} == set(SLOTS.values())

    indices = [
        row[0]
        for row in accessor_rows(document, binary, primitive["indices"])
    ]

    assert len(indices) % 3 == 0

    triangles = len(indices) // 3

    assert 600 <= triangles <= 2000
    assert triangles == len(obj.data.loop_triangles)

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

        assert 0 <= min(a, b, c)
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a])
            .cross(points[c] - points[a])
            .length > 2e-10
        )

        assert all(
            abs(uvs[a][axis] - uvs[v][axis]) < 1e-7
            for v in (b, c)
            for axis in range(2)
        )

    lower, upper = bounds(points)

    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON

    # Blender -Y 정면은 Y-up GLB의 +Z 정면이다.
    def yup(point):
        x, y, z = point
        return Vector((x, z, -y))

    expected = [yup(v.co) for v in obj.data.vertices]
    expected_positions = {
        tuple(round(c, 6) for c in p)
        for p in expected
    }

    assert all(
        tuple(round(c, 6) for c in p) in expected_positions
        for p in points
    )

    label_y = (0.58 - 0.5) * TARGET.z

    for sign in (-1, 1):
        candidates = [
            i for i, p in enumerate(points)
            if abs(p.z - sign * PANEL_Y) < EPSILON
            and abs(p.x) < 0.41
            and 0.31 - TARGET.z / 2 < p.y < 1.32 - TARGET.z / 2
        ]

        assert candidates
        assert any(
            normals[i][2] * sign > 0.999
            and check_uv(uvs[i]) == SLOTS["cream"]
            for i in candidates
        )

    assert lower.y < label_y < upper.y

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
        "triangles": triangles,
        "blender_dimensions": tuple(TARGET),
        "glb_dimensions": tuple(upper - lower),
        "palette_slots": SLOTS,
        "label_height": 0.58,
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

    report = verify_glb(path.read_bytes(), obj)
    report["file"] = str(path)

    return report


def clone_for_preview(scene, source, position, height):
    mesh = source.data.copy()
    clone = bpy.data.objects.new("preview-" + source.name, mesh)
    scene.collection.objects.link(clone)

    points = [
        source.matrix_world @ v.co
        for v in source.data.vertices
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
        "COMPARE: linkSign left; original references right:",
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
        v.co.copy()
        for clone in clones
        for v in clone.data.vertices
    ]
    lower, upper = bounds(points)
    center = (lower + upper) / 2

    view_points = [
        basis.transposed() @ (p - center)
        for p in points
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

    obj = build_sign()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    report = export_glb(obj)

    if not args.skip_render:
        render_comparison(obj, references)

    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
