"""
실행: /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/stele.py
렌더 생략: 마지막에 -- --skip-render 추가.
원본은 저장하지 않으며 OUTPUT 아래 GLB 2개와 compare.png만 기록한다.
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
OUTPUT = ROOT / "codex-work/stele"

STONE, DARK, LIGHT = 0, 6, 4
TARGETS = {
    "stele": Vector((1.0, 0.3, 1.4)),
    "pedestal": Vector((1.6, 1.6, 0.5)),
}
EXPECTED_TRIANGLES = {"stele": 184, "pedestal": 188}
PANEL_Y = 0.108
EPSILON = 1e-5


def bounds(points):
    points = list(points)
    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


def outline(width, bottom, top, cut):
    half = width / 2
    return [
        (-half + cut, bottom),
        (half - cut, bottom),
        (half, bottom + cut),
        (half, top - cut),
        (half - cut, top),
        (-half + cut, top),
        (-half, top - cut),
        (-half, bottom + cut),
    ]


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)
        return list(range(start, len(self.vertices)))

    def face(self, vertices, slot=STONE):
        self.faces.append(tuple(vertices))
        self.slots.append(slot)

    def bridge(self, first, second, slots):
        assert len(first) == len(second) == len(slots)

        for i, slot in enumerate(slots):
            j = (i + 1) % len(first)
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
            )

    def xz_ring(self, width, bottom, top, cut, y):
        return self.ring(
            (x, y, z)
            for x, z in outline(width, bottom, top, cut)
        )

    def xy_ring(self, width, depth, cut, z):
        return self.ring(
            (x, y, z)
            for x, y in outline(
                width, -depth / 2, depth / 2, cut,
            )
        )

    def finish(self, name, material):
        if name in bpy.data.objects or name in bpy.data.meshes:
            raise RuntimeError("기존 데이터와 이름 충돌: " + name)

        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        mesh.materials.append(material)

        uv = mesh.uv_layers.new(name="UVMap")

        for polygon, slot in zip(mesh.polygons, self.slots):
            polygon.use_smooth = False
            polygon.material_index = 0

            for i in polygon.loop_indices:
                uv.data[i].uv = ((slot + 0.5) / 32, 0.5)

        bm = bmesh.new()
        try:
            bm.from_mesh(mesh)
            bmesh.ops.recalc_face_normals(
                bm, faces=list(bm.faces),
            )
            assert all(edge.is_manifold for edge in bm.edges)
            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()

        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        verify_mesh(obj)
        return obj


def build_stele(material):
    builder = Builder()

    outer = [
        builder.xz_ring(
            1.0, -0.59, 0.70, 0.075, sign * 0.075,
        )
        for sign in (-1, 1)
    ]

    builder.bridge(
        outer[0],
        outer[1],
        (
            DARK, STONE, DARK, STONE,
            STONE, STONE, STONE, DARK,
        ),
    )

    for sign, outside in zip((-1, 1), outer):
        crest_outer = builder.xz_ring(
            0.95, -0.565, 0.675, 0.055, sign * 0.130,
        )
        crest_inner = builder.xz_ring(
            0.80, -0.470, 0.580, 0.045, sign * 0.130,
        )
        panel = builder.xz_ring(
            0.74, -0.440, 0.550, 0.035, sign * PANEL_Y,
        )

        builder.bridge(
            outside,
            crest_outer,
            (
                DARK, STONE, STONE, STONE,
                LIGHT, STONE, LIGHT, STONE,
            ),
        )
        builder.bridge(
            crest_outer, crest_inner, (STONE,) * 8,
        )
        builder.bridge(
            crest_inner,
            panel,
            (
                STONE, STONE, DARK, DARK,
                DARK, STONE, STONE, STONE,
            ),
        )
        builder.face(panel, STONE)

    # 작은 발은 몸체 아래에 0.03만큼 겹쳐 이음새 틈을 없앤다.
    foot = [
        builder.xy_ring(width, depth, cut, z)
        for width, depth, cut, z in (
            (0.84, 0.26, 0.035, -0.700),
            (0.90, 0.30, 0.045, -0.675),
            (0.90, 0.30, 0.045, -0.585),
            (0.84, 0.26, 0.035, -0.560),
        )
    ]

    builder.face(reversed(foot[0]), DARK)
    builder.bridge(foot[0], foot[1], (DARK,) * 8)
    builder.bridge(foot[1], foot[2], (STONE,) * 8)
    builder.bridge(
        foot[2],
        foot[3],
        (
            STONE, STONE, STONE, STONE,
            STONE, LIGHT, LIGHT, STONE,
        ),
    )
    builder.face(foot[-1], STONE)

    obj = builder.finish("stele", material)

    # 글씨판 영역: Blender X[-0.33, 0.33], Z[-0.40, 0.50].
    # 앞면 Y=-0.108 / 뒷면 Y=+0.108; 바깥으로 0.001 띄워 부착한다.
    # GLB에서는 앞면 Z=+0.108 / 뒷면 Z=-0.108, 세로축은 Y다.
    for sign in (-1, 1):
        panels = [
            polygon
            for polygon in obj.data.polygons
            if len(polygon.vertices) == 8
            and all(
                abs(
                    obj.data.vertices[i].co.y
                    - sign * PANEL_Y
                ) < EPSILON
                for i in polygon.vertices
            )
        ]

        assert len(panels) == 1
        assert (
            panels[0].normal.dot(Vector((0, sign, 0)))
            > 0.999
        )

        uv = obj.data.uv_layers.active

        assert all(
            abs(
                uv.data[i].uv.x - (STONE + 0.5) / 32
            ) < EPSILON
            for i in panels[0].loop_indices
        )

    return obj


def build_pedestal(material):
    builder = Builder()

    sections = (
        (1.54, 0.055, -0.250),
        (1.60, 0.070, -0.225),
        (1.60, 0.070, -0.095),
        (1.54, 0.055, -0.070),
        (1.29, 0.045, -0.070),
        (1.35, 0.060, -0.045),
        (1.35, 0.060, 0.075),
        (1.29, 0.045, 0.100),
        (1.04, 0.035, 0.100),
        (1.10, 0.050, 0.120),
        (1.10, 0.050, 0.230),
        (1.04, 0.035, 0.250),
    )

    rings = [
        builder.xy_ring(width, width, cut, z)
        for width, cut, z in sections
    ]

    builder.face(reversed(rings[0]), DARK)

    for i, (first, second) in enumerate(
        zip(rings, rings[1:])
    ):
        if i in (0, 4, 8):
            slots = (DARK,) * 8
        elif i in (2, 6, 10):
            slots = (
                STONE, STONE, STONE, STONE,
                STONE, LIGHT, LIGHT, STONE,
            )
        else:
            slots = (STONE,) * 8

        builder.bridge(first, second, slots)

    builder.face(rings[-1], STONE)
    return builder.finish("pedestal", material)


def verify_mesh(obj):
    mesh = obj.data
    mesh.calc_loop_triangles()

    low, high = bounds(v.co for v in mesh.vertices)

    assert (
        (high - low) - TARGETS[obj.name]
    ).length < EPSILON
    assert ((low + high) / 2).length < EPSILON
    assert (
        len(mesh.loop_triangles)
        == EXPECTED_TRIANGLES[obj.name]
    )
    assert all(
        triangle.area > 1e-10
        for triangle in mesh.loop_triangles
    )
    assert not any(
        polygon.use_smooth for polygon in mesh.polygons
    )
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert obj.location.length < EPSILON
    assert obj.rotation_euler.to_matrix().is_identity
    assert (
        obj.scale - Vector((1, 1, 1))
    ).length < EPSILON

    uv = mesh.uv_layers.active

    for polygon in mesh.polygons:
        values = [
            uv.data[i].uv.copy()
            for i in polygon.loop_indices
        ]

        assert all(
            (value - values[0]).length < EPSILON
            for value in values
        )
        assert any(
            abs(
                values[0].x - (slot + 0.5) / 32
            ) < EPSILON
            for slot in (STONE, DARK, LIGHT)
        )
        assert abs(values[0].y - 0.5) < EPSILON


def open_source():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3이 필요합니다.")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError(
            "--disable-autoexec로 Blender를 실행하세요."
        )

    bpy.ops.wm.open_mainfile(
        filepath=str(SOURCE),
        load_ui=False,
        use_scripts=False,
    )

    for name, expected, smooth in (
        ("Cube.094", 394, False),
        ("body.001", 512, True),
    ):
        obj = bpy.data.objects[name]
        obj.data.calc_loop_triangles()

        assert (
            len(obj.data.loop_triangles) == expected
        ), name
        assert all(
            polygon.use_smooth == smooth
            for polygon in obj.data.polygons
        )
        assert any(
            material and material.name == "palette"
            for material in obj.data.materials
        )

    material = bpy.data.materials["palette"]
    assert material.use_nodes and material.node_tree

    image = bpy.data.images.load(
        str(PALETTE), check_existing=True,
    )
    assert tuple(image.size) == (128, 4)
    image.colorspace_settings.name = "sRGB"

    for slot, expected in (
        (STONE, (124, 118, 145)),
        (DARK, (87, 90, 94)),
        (LIGHT, (200, 194, 193)),
    ):
        offset = (2 * 128 + slot * 4 + 2) * 4
        actual = tuple(
            round(channel * 255)
            for channel in image.pixels[offset:offset + 3]
        )
        assert actual == expected, (slot, actual)

    textures = [
        node
        for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    assert len(textures) == 1

    texture = textures[0]
    texture.image = image
    texture.mute = False
    texture.interpolation = "Closest"
    material.node_tree.nodes.active = texture

    return material


def verify_glb(path, obj):
    data = path.read_bytes()
    assert len(data) >= 20

    magic, version, length = struct.unpack_from(
        "<4sII", data,
    )
    assert magic == b"glTF"
    assert version == 2
    assert length == len(data)

    size, kind = struct.unpack_from("<I4s", data, 12)
    assert kind == b"JSON"
    assert 20 + size <= len(data)

    document = json.loads(data[20:20 + size])

    assert (
        len(document["meshes"])
        == len(document["materials"])
        == 1
    )
    assert document["meshes"][0]["name"] == obj.name
    assert document["materials"][0]["name"] == "palette"
    assert len(document["nodes"]) == 1
    assert document["nodes"][0]["name"] == obj.name
    assert document["nodes"][0]["mesh"] == 0
    assert (
        len(document["images"])
        == len(document["textures"])
        == 1
    )
    assert (
        document["images"][0]["mimeType"] == "image/png"
    )
    assert "bufferView" in document["images"][0]

    primitive, = document["meshes"][0]["primitives"]
    assert primitive.get("mode", 4) == 4

    attributes = primitive["attributes"]
    assert {
        "POSITION", "NORMAL", "TEXCOORD_0",
    }.issubset(attributes)
    assert not any(
        key.startswith("COLOR_") for key in attributes
    )

    accessors = document["accessors"]
    count = accessors[primitive["indices"]]["count"]
    assert count % 3 == 0

    triangles = count // 3
    assert triangles == EXPECTED_TRIANGLES[obj.name]

    position = accessors[attributes["POSITION"]]
    assert all(
        accessors[attributes[key]]["count"]
        == position["count"]
        for key in ("NORMAL", "TEXCOORD_0")
    )

    low = Vector(position["min"])
    high = Vector(position["max"])
    target = TARGETS[obj.name]
    glb_target = Vector((target.x, target.z, target.y))

    assert (
        (high - low) - glb_target
    ).length < EPSILON
    assert ((high + low) / 2).length < EPSILON

    blender_low, blender_high = bounds(
        vertex.co for vertex in obj.data.vertices
    )

    return {
        "file": path.name,
        "triangles": triangles,
        "blender_xyz": tuple(
            round(value, 6)
            for value in blender_high - blender_low
        ),
        "glb_xyz": tuple(
            round(value, 6) for value in high - low
        ),
    }


def export_glb(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    path = OUTPUT / (obj.name + ".glb")

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
        export_vertex_color="NONE",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        will_save_settings=False,
    )
    assert result == {"FINISHED"}

    return verify_glb(path, obj)


def clone_for_preview(
    scene,
    source,
    height,
    horizontal,
    base_z=0,
    yaw=0,
):
    clone = bpy.data.objects.new(
        "preview-" + source.name,
        source.data.copy(),
    )
    scene.collection.objects.link(clone)

    points = [
        source.matrix_world @ vertex.co
        for vertex in source.data.vertices
    ]
    low, high = bounds(points)
    bottom_center = Vector(
        (
            (low.x + high.x) / 2,
            (low.y + high.y) / 2,
            low.z,
        )
    )
    factor = height / (high.z - low.z)

    for vertex, point in zip(clone.data.vertices, points):
        vertex.co = (point - bottom_center) * factor

    clone.rotation_euler.z = yaw
    clone.location = (
        Vector((0.8, 0.6, 0)) * horizontal
    )
    clone.location.z = base_z
    clone.data.update()

    return clone


def render_compare(stele, pedestal):
    scene = bpy.data.scenes.new("stele-preview")
    scene.render.engine = "BLENDER_WORKBENCH"

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "WORLD"

    scene.world = bpy.data.worlds.new(
        "stele-preview-world"
    )
    scene.world.color = (0.045, 0.045, 0.045)

    scene.render.resolution_x = 2000
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.use_file_extension = True

    clone_for_preview(
        scene,
        bpy.data.objects["refStatuePhysicalDynamic"],
        1.9,
        -4.2,
    )
    clone_for_preview(
        scene, bpy.data.objects["Cube.094"], 1.0, -2.65,
    )
    clone_for_preview(
        scene, bpy.data.objects["body.001"], 1.0, -1.1,
    )
    clone_for_preview(
        scene, pedestal, 0.5, 1.05,
    )
    clone_for_preview(
        scene, stele, 1.4, 1.05, base_z=0.5,
    )
    clone_for_preview(
        scene, stele, 1.4, 2.85, yaw=math.pi,
    )
    clone_for_preview(
        scene, pedestal, 0.5, 4.6,
    )

    camera = bpy.data.objects.new(
        "preview-camera",
        bpy.data.cameras.new("preview-camera"),
    )
    scene.collection.objects.link(camera)
    scene.camera = camera

    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 11.8

    center = Vector((0, 0, 0.85))
    camera.location = (
        center + Vector((0.6, -0.8, 0.45)) * 12
    )
    camera.rotation_euler = (
        (center - camera.location)
        .to_track_quat("-Z", "Y")
        .to_euler()
    )

    scene.render.filepath = str(OUTPUT / "compare.png")
    bpy.ops.render.render(
        write_still=True, scene=scene.name,
    )

    print(
        "비교 순서: 원본 동상 / 원본 모루 / 원본 가마솥 / "
        "앞면+3단 받침 / 뒷면 / 받침"
    )
    print("Render:", OUTPUT / "compare.png")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-render", action="store_true",
    )

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    material = open_source()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    scene = bpy.data.scenes.new("stele-export")
    bpy.context.window.scene = scene

    stele = build_stele(material)
    pedestal = build_pedestal(material)

    reports = [
        export_glb(stele),
        export_glb(pedestal),
    ]

    if not args.skip_render:
        render_compare(stele, pedestal)

    for report in reports:
        print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
