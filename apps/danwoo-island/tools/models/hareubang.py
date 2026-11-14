"""
Blender 5.3

실행:
  /Applications/Blender.app/Contents/MacOS/Blender \
    -b --factory-startup --disable-autoexec \
    --python /absolute/path/to/hareubang.py

렌더를 생략하려면 마지막에 추가:
  -- --skip-render

모든 출력은 scratchpad/codex-work/ 아래에만 저장한다.
원본 .blend와 저장소 파일은 저장하거나 수정하지 않는다.
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
OUTPUT = ROOT / "codex-work"

TARGET = Vector((1.282, 0.573, 4.383))
STONE, DARK, LIGHT = 0, 6, 4
EXPECTED_TRIANGLES = 1476


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.smooth = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        return list(range(start, len(self.vertices)))

    def face(self, vertices, slot=STONE, smooth=True):
        self.faces.append(tuple(vertices))
        self.slots.append(slot)
        self.smooth.append(smooth)

    def bridge(self, first, second, slot=STONE, smooth=True):
        for i in range(len(first)):
            j = (i + 1) % len(first)
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
                smooth,
            )

    def close(self, rings, slot=STONE, smooth=True):
        self.face(reversed(rings[0]), DARK, False)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot, smooth)

        self.face(rings[-1], slot, False)

    def loft(self, sections, n=12, slot=STONE, smooth=True):
        rings = [
            self.ring(
                [
                    (
                        rx * math.cos(i * math.tau / n),
                        cy + ry * math.sin(i * math.tau / n),
                        z,
                    )
                    for i in range(n)
                ]
            )
            for z, rx, ry, cy in sections
        ]
        self.close(rings, slot, smooth)

    def ellipsoid(self, center, radius, n=10, lat=4, slot=STONE):
        cx, cy, cz = center
        rx, ry, rz = radius

        bottom = self.ring([(cx, cy, cz - rz)])[0]
        top = self.ring([(cx, cy, cz + rz)])[0]

        rings = [
            self.ring(
                [
                    (
                        cx
                        + rx
                        * math.sin(j * math.pi / lat)
                        * math.cos(i * math.tau / n),
                        cy
                        + ry
                        * math.sin(j * math.pi / lat)
                        * math.sin(i * math.tau / n),
                        cz - rz * math.cos(j * math.pi / lat),
                    )
                    for i in range(n)
                ]
            )
            for j in range(1, lat)
        ]

        for i in range(n):
            self.face(
                (bottom, rings[0][(i + 1) % n], rings[0][i]),
                slot,
            )

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)

        for i in range(n):
            self.face(
                (rings[-1][i], rings[-1][(i + 1) % n], top),
                slot,
            )

    def tube(
        self,
        coords,
        r,
        depth=None,
        n=6,
        slot=STONE,
        smooth=True,
    ):
        points = [Vector(point) for point in coords]
        depth = r if depth is None else depth
        rings = []

        for i, point in enumerate(points):
            tangent = (
                points[min(i + 1, len(points) - 1)]
                - points[max(0, i - 1)]
            ).normalized()

            side = Vector((0, -1, 0))
            side = (
                side - tangent * side.dot(tangent)
            ).normalized()
            up = tangent.cross(side).normalized()

            rings.append(
                self.ring(
                    [
                        point
                        + side * (depth * math.cos(j * math.tau / n))
                        + up * (r * math.sin(j * math.tau / n))
                        for j in range(n)
                    ]
                )
            )

        self.close(rings, slot, smooth)

    def hand(self, cx, z, mirror):
        outline = [
            (-0.22, -0.15),
            (0.17, -0.15),
            (0.24, -0.09),
            (0.24, 0.07),
            (0.16, 0.15),
            (-0.19, 0.15),
            (-0.25, 0.08),
            (-0.25, -0.07),
        ]

        rings = [
            self.ring(
                [
                    (cx + mirror * x * scale, y, z + dz * scale)
                    for x, dz in outline
                ]
            )
            for y, scale in (
                (-0.18, 0.80),
                (-0.26, 1.10),
                (-0.307, 0.94),
                (-0.326, 0.67),
            )
        ]
        self.close(rings)

        for dz in (-0.072, 0, 0.072):
            self.tube(
                [
                    (cx - mirror * 0.14, -0.328, z + dz),
                    (cx + mirror * 0.14, -0.328, z + dz + 0.012),
                ],
                0.009,
                0.007,
                n=4,
                slot=DARK,
                smooth=False,
            )

        self.tube(
            [
                (cx - mirror * 0.13, -0.26, z + 0.12),
                (cx, -0.33, z + 0.19),
                (cx + mirror * 0.11, -0.32, z + 0.17),
            ],
            0.048,
            0.028,
            n=6,
        )


def build():
    builder = Builder()

    builder.loft(
        [
            (0, 0.49, 0.175, 0.025),
            (0.08, 0.56, 0.195, 0.025),
            (0.40, 0.57, 0.205, 0.02),
            (1.05, 0.54, 0.225, 0.005),
            (1.70, 0.49, 0.215, 0.015),
            (2.08, 0.46, 0.175, 0.025),
            (2.23, 0.35, 0.145, 0.03),
        ],
        n=12,
    )

    builder.loft(
        [
            (2.15, 0.33, 0.145, 0.025),
            (2.27, 0.47, 0.19, 0.025),
            (2.54, 0.545, 0.21, 0.025),
            (3.12, 0.55, 0.205, 0.025),
            (3.48, 0.51, 0.185, 0.025),
            (3.67, 0.46, 0.17, 0.025),
        ],
        n=12,
    )

    builder.loft(
        [
            (3.58, 0.50, 0.23, 0.015),
            (3.61, 0.61, 0.26, 0.015),
            (3.67, 0.641, 0.275, 0.015),
            (3.74, 0.62, 0.265, 0.015),
            (3.78, 0.54, 0.23, 0.015),
            (3.98, 0.51, 0.22, 0.02),
            (4.18, 0.43, 0.19, 0.02),
            (4.32, 0.28, 0.13, 0.02),
            (4.383, 0.075, 0.05, 0.02),
        ],
        n=16,
    )

    for sign in (-1, 1):
        builder.ellipsoid(
            (sign * 0.255, -0.177, 3.20),
            (0.191, 0.104, 0.171),
            n=10,
            lat=4,
        )

        builder.tube(
            [
                (sign * 0.075, -0.19, 3.39),
                (sign * 0.20, -0.205, 3.47),
                (sign * 0.34, -0.19, 3.46),
                (sign * 0.45, -0.15, 3.38),
            ],
            0.058,
            0.045,
            n=6,
        )

        builder.ellipsoid(
            (sign * 0.528, 0.015, 2.99),
            (0.065, 0.102, 0.21),
            n=8,
            lat=3,
        )

        builder.ellipsoid(
            (sign * 0.35, -0.13, 2.69),
            (0.19, 0.070, 0.22),
            n=10,
            lat=4,
        )

    builder.loft(
        [
            (2.70, 0.105, 0.068, -0.239),
            (2.76, 0.148, 0.106, -0.245),
            (2.86, 0.145, 0.117, -0.236),
            (3.32, 0.082, 0.075, -0.202),
            (3.48, 0.062, 0.048, -0.175),
        ],
        n=8,
    )

    builder.tube(
        [
            (-0.29, -0.18, 2.55),
            (-0.15, -0.215, 2.51),
            (0, -0.225, 2.50),
            (0.15, -0.215, 2.51),
            (0.29, -0.18, 2.55),
        ],
        0.052,
        0.040,
        n=6,
    )

    builder.tube(
        [
            (-0.24, -0.208, 2.555),
            (0, -0.261, 2.535),
            (0.24, -0.208, 2.555),
        ],
        0.012,
        0.008,
        n=4,
        slot=DARK,
        smooth=False,
    )

    builder.tube(
        [
            (-0.40, -0.04, 2.13),
            (-0.51, -0.09, 1.96),
            (-0.50, -0.20, 1.80),
            (-0.30, -0.26, 1.90),
        ],
        0.092,
        0.075,
        n=6,
    )

    builder.tube(
        [
            (0.40, -0.04, 2.10),
            (0.53, -0.10, 1.74),
            (0.52, -0.20, 1.30),
            (0.30, -0.26, 1.30),
        ],
        0.095,
        0.075,
        n=6,
    )

    builder.hand(-0.08, 1.94, 1)
    builder.hand(0.08, 1.35, -1)

    mesh = bpy.data.meshes.new("hareubang")
    mesh.from_pydata(builder.vertices, [], builder.faces)
    mesh.update()

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()

    for polygon, smooth in zip(mesh.polygons, builder.smooth):
        polygon.use_smooth = smooth

    uv = mesh.uv_layers.new(name="UVMap")

    for polygon, slot in zip(mesh.polygons, builder.slots):
        if slot == STONE:
            x, y, z = polygon.center

            is_shadow = (
                polygon.normal.z < -0.65
                or 3.59 < z < 3.65
                or (x > 0.40 and y > -0.07 and z < 3.58)
            )
            is_highlight = (
                (3.68 < z < 3.77 and x < -0.39 and y < -0.05)
                or (
                    2.75 < z < 2.89
                    and -0.15 < x < -0.095
                    and y < -0.25
                )
            )

            if is_shadow:
                slot = DARK
            elif is_highlight:
                slot = LIGHT

        for loop_index in polygon.loop_indices:
            uv.data[loop_index].uv = ((slot + 0.5) / 32, 0.5)

    lower = Vector(
        tuple(min(v.co[a] for v in mesh.vertices) for a in range(3))
    )
    upper = Vector(
        tuple(max(v.co[a] for v in mesh.vertices) for a in range(3))
    )
    center = (lower + upper) / 2

    for vertex in mesh.vertices:
        vertex.co = Vector(
            tuple(
                (vertex.co[a] - center[a])
                * TARGET[a]
                / (upper[a] - lower[a])
                for a in range(3)
            )
        )

    mesh.update()

    obj = bpy.data.objects.new("hareubang", mesh)
    bpy.context.scene.collection.objects.link(obj)

    material = bpy.data.materials["palette"]
    mesh.materials.append(material)

    image = bpy.data.images.load(str(PALETTE), check_existing=True)
    if tuple(image.size) != (128, 4):
        raise RuntimeError("Expected a 128 x 4 palette")

    image.colorspace_settings.name = "sRGB"

    for node in material.node_tree.nodes:
        if node.type == "TEX_IMAGE":
            node.image = image
            node.mute = False
            node.interpolation = "Closest"
            material.node_tree.nodes.active = node

    mesh.calc_loop_triangles()

    assert len(mesh.loop_triangles) == EXPECTED_TRIANGLES
    assert obj.name == mesh.name == "hareubang"
    assert not mesh.color_attributes
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert all(abs(obj.scale[a] - 1) < 1e-7 for a in range(3))
    assert all(triangle.area > 1e-10 for triangle in mesh.loop_triangles)

    actual_lower = Vector(
        tuple(min(v.co[a] for v in mesh.vertices) for a in range(3))
    )
    actual_upper = Vector(
        tuple(max(v.co[a] for v in mesh.vertices) for a in range(3))
    )

    assert ((actual_upper - actual_lower) - TARGET).length < 1e-5
    assert ((actual_upper + actual_lower) / 2).length < 1e-5

    for polygon in mesh.polygons:
        values = [
            tuple(uv.data[i].uv)
            for i in polygon.loop_indices
        ]
        assert all(value == values[0] for value in values)

    print("triangles:", len(mesh.loop_triangles))
    print("dimensions:", tuple(actual_upper - actual_lower))
    print("center:", tuple((actual_lower + actual_upper) / 2))

    return obj


def verify_document(document):
    assert len(document["meshes"]) == len(document["materials"]) == 1
    assert document["meshes"][0]["name"] == "hareubang"
    assert document["materials"][0]["name"] == "palette"

    primitive, = document["meshes"][0]["primitives"]
    assert primitive.get("mode", 4) == 4

    attributes = primitive["attributes"]
    assert {"POSITION", "NORMAL", "TEXCOORD_0"}.issubset(attributes)
    assert "COLOR_0" not in attributes

    accessors = document["accessors"]
    assert (
        accessors[primitive["indices"]]["count"] // 3
        == EXPECTED_TRIANGLES
    )

    vertex_count = accessors[attributes["POSITION"]]["count"]
    assert all(
        accessors[attributes[key]]["count"] == vertex_count
        for key in ("NORMAL", "TEXCOORD_0")
    )

    position = accessors[attributes["POSITION"]]
    half = (TARGET.x / 2, TARGET.z / 2, TARGET.y / 2)

    assert all(
        abs(position["min"][a] + half[a]) < 1e-5
        for a in range(3)
    )
    assert all(
        abs(position["max"][a] - half[a]) < 1e-5
        for a in range(3)
    )

    mesh_nodes = [
        node for node in document["nodes"]
        if "mesh" in node
    ]
    assert len(document["nodes"]) == len(mesh_nodes) == 1
    assert mesh_nodes[0]["name"] == "hareubang"

    assert len(document["images"]) == len(document["textures"]) == 1
    assert "bufferView" in document["images"][0]
    assert document["images"][0]["mimeType"] == "image/png"


def export_glb(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    path = OUTPUT / "hareubang.glb"

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

    data = path.read_bytes()
    magic, version, length = struct.unpack_from("<4sII", data)
    assert magic == b"glTF"
    assert version == 2
    assert length == len(data)

    size, kind = struct.unpack_from("<I4s", data, 12)
    assert kind == b"JSON"

    verify_document(json.loads(data[20:20 + size]))
    print("GLB:", path)


def make_render_scene():
    scene = bpy.data.scenes.new("hareubang-preview")
    scene.render.engine = "BLENDER_WORKBENCH"

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "WORLD"

    scene.world = bpy.data.worlds.new("hareubang-preview-world")
    scene.world.color = (0.045, 0.045, 0.045)

    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    camera = bpy.data.objects.new(
        "preview-camera",
        bpy.data.cameras.new("preview-camera"),
    )
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type = "ORTHO"

    return scene


def clone_for_preview(scene, source, height, x):
    clone = bpy.data.objects.new(
        "preview-" + source.name,
        source.data.copy(),
    )
    scene.collection.objects.link(clone)

    points = [
        source.matrix_world @ vertex.co
        for vertex in source.data.vertices
    ]
    lower = Vector(
        tuple(min(point[a] for point in points) for a in range(3))
    )
    upper = Vector(
        tuple(max(point[a] for point in points) for a in range(3))
    )

    center = Vector(
        (
            (lower.x + upper.x) / 2,
            (lower.y + upper.y) / 2,
            lower.z,
        )
    )
    factor = height / (upper.z - lower.z)

    for vertex, point in zip(clone.data.vertices, points):
        vertex.co = (
            (point - center) * factor
            + Vector((x, 0, 0))
        )

    clone.data.update()
    return clone


def aim(scene, center, scale):
    camera = scene.camera
    camera.data.ortho_scale = scale
    camera.location = center + Vector((0.6, -0.8, 0.5)) * 12
    camera.rotation_euler = (
        (center - camera.location)
        .to_track_quat("-Z", "Y")
        .to_euler()
    )


def render_previews(obj):
    scene = make_render_scene()

    clone = clone_for_preview(scene, obj, TARGET.z, 0)
    scene.render.resolution_x = 700
    scene.render.resolution_y = 700

    aim(
        scene,
        Vector((0, 0, TARGET.z / 2)),
        TARGET.z * 1.4,
    )

    scene.render.filepath = str(OUTPUT / "hareubang.png")
    bpy.ops.render.render(write_still=True, scene=scene.name)
    bpy.data.objects.remove(clone, do_unlink=True)

    references = (
        ("hareubang", 4.383, -3),
        ("refStatuePhysicalDynamic", 4.383, -1),
        ("Cube.094", 1.7, 1.3),
        ("body.001", 1.7, 3.6),
    )

    for name, height, x in references:
        clone_for_preview(
            scene,
            bpy.data.objects[name],
            height,
            x,
        )

    scene.render.resolution_x = 1500
    scene.render.resolution_y = 800

    aim(scene, Vector((0, 0, 2.1)), 10.7)

    scene.render.filepath = str(OUTPUT / "compare.png")
    bpy.ops.render.render(write_still=True, scene=scene.name)

    print("Render:", OUTPUT / "hareubang.png")
    print("Compare order: hareubang, statue, anvil, cauldron")
    print("Render:", OUTPUT / "compare.png")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3 is required")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("Start Blender with --disable-autoexec")

    bpy.ops.wm.open_mainfile(
        filepath=str(SOURCE),
        load_ui=False,
        use_scripts=False,
    )

    for name, expected in (
        ("refStatuePhysicalDynamic", 1426),
        ("Cube.094", 394),
        ("body.001", 512),
        ("base", 350),
    ):
        reference = bpy.data.objects[name]
        reference.data.calc_loop_triangles()

        assert len(reference.data.loop_triangles) == expected, name
        assert any(
            material.name == "palette"
            for material in reference.data.materials
        )

    OUTPUT.mkdir(parents=True, exist_ok=True)

    scene = bpy.data.scenes.new("hareubang-export")
    bpy.context.window.scene = scene

    obj = build()
    export_glb(obj)

    if not args.skip_render:
        render_previews(obj)


if __name__ == "__main__":
    main()
