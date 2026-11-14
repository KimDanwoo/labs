"""
Blender 5.3
실행: /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/landing.py
메시·GLB 직렬화는 메모리에서 검증했으며, 렌더·파일 저장은 실행하지 않았다.
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
OUTPUT = ROOT / "codex-work/landing"

TARGETS = {
    "gamepad": (1.62, 1.28, 0.54),
    "onggi": (0.92, 0.92, 0.99),
}

METAL = 0       # #7C7691
BLUE = 3        # #3DBBE7
BROWN = 5       # #4A413C
YELLOW = 8      # #E4A90C
GREEN = 9       # #91AD78
WOOD_DARK = 14  # #B36D45
RED = 16        # #ED3F1C
WOOD = 18       # #F8A658

EPSILON = 1e-5


def bounds(points):
    points = list(points)
    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.smoothing = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)
        return list(range(start, len(self.vertices)))

    def face(self, indices, slot, smooth=False):
        self.faces.append(tuple(indices))
        self.slots.append(slot)
        self.smoothing.append(smooth)

    def bridge(self, first, second, slot, smooth=False):
        if len(first) != len(second):
            raise ValueError("Ring vertex counts differ")

        for i in range(len(first)):
            j = (i + 1) % len(first)
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
                smooth,
            )

    def close(self, rings, slots, smooth=False):
        self.face(reversed(rings[0]), slots[0])

        for i in range(1, len(rings)):
            self.bridge(rings[i - 1], rings[i], slots[i], smooth)

        self.face(rings[-1], slots[-1])

    def radial(self, profile, center=(0, 0), n=16, smooth=True):
        cx, cy = center

        rings = [
            self.ring(
                [
                    (
                        cx + radius * math.cos(i * math.tau / n),
                        cy + radius * math.sin(i * math.tau / n),
                        z,
                    )
                    for i in range(n)
                ]
            )
            for z, radius, slot in profile
        ]

        self.close(
            rings,
            [slot for z, radius, slot in profile],
            smooth,
        )

    def slab(self, outline, levels):
        outline = list(outline)

        area = sum(
            x * outline[(i + 1) % len(outline)][1]
            - outline[(i + 1) % len(outline)][0] * y
            for i, (x, y) in enumerate(outline)
        )

        if area < 0:
            outline.reverse()

        cx = (
            min(x for x, y in outline)
            + max(x for x, y in outline)
        ) / 2
        cy = (
            min(y for x, y in outline)
            + max(y for x, y in outline)
        ) / 2

        rings = [
            self.ring(
                [
                    (
                        cx + (x - cx) * scale,
                        cy + (y - cy) * scale,
                        z,
                    )
                    for x, y in outline
                ]
            )
            for z, scale, slot in levels
        ]

        self.close(
            rings,
            [slot for z, scale, slot in levels],
        )

    def box(self, center, size, bottom, top, slot):
        cx, cy = center
        hx, hy = size[0] / 2, size[1] / 2

        bevel = min(
            0.018,
            (top - bottom) / 4,
            hx / 3,
            hy / 3,
        )

        outline = [
            (cx - hx + bevel, cy - hy),
            (cx + hx - bevel, cy - hy),
            (cx + hx, cy - hy + bevel),
            (cx + hx, cy + hy - bevel),
            (cx + hx - bevel, cy + hy),
            (cx - hx + bevel, cy + hy),
            (cx - hx, cy + hy - bevel),
            (cx - hx, cy - hy + bevel),
        ]

        inset = 1 - min(0.18, bevel / min(hx, hy))

        self.slab(
            outline,
            [
                (bottom, inset, slot),
                (bottom + bevel, 1, slot),
                (top - bevel, 1, slot),
                (top, inset, slot),
            ],
        )

    def finish(self, name):
        if bpy.data.objects.get(name) or bpy.data.meshes.get(name):
            raise RuntimeError("Name already present in source: " + name)

        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        if mesh.validate(verbose=False):
            raise RuntimeError("Invalid generated mesh: " + name)

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for polygon, slot, smooth in zip(
            mesh.polygons,
            self.slots,
            self.smoothing,
        ):
            polygon.use_smooth = smooth

            for loop_index in polygon.loop_indices:
                uv.data[loop_index].uv = (
                    (slot + 0.5) / 32,
                    0.5,
                )

        lower, upper = bounds(v.co for v in mesh.vertices)
        center = (lower + upper) / 2
        target = TARGETS[name]

        for vertex in mesh.vertices:
            vertex.co = tuple(
                (vertex.co[a] - center[a])
                * target[a]
                / (upper[a] - lower[a])
                for a in range(3)
            )

        mesh.update()

        bm = bmesh.new()

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

            if any(not edge.is_manifold for edge in bm.edges):
                raise RuntimeError(
                    "Open or non-manifold component: " + name
                )

            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        if any(t.area <= 1e-10 for t in mesh.loop_triangles):
            raise RuntimeError("Degenerate triangle: " + name)

        lower, upper = bounds(v.co for v in mesh.vertices)

        assert (upper - lower - Vector(target)).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        for polygon in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[i].uv)
                for i in polygon.loop_indices
            ]
            assert all(value == values[0] for value in values)

        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert tuple(obj.scale) == (1, 1, 1)

        return obj


def build_gamepad():
    b = Builder()

    outline = [
        (0.43, 0.56),
        (0.64, 0.51),
        (0.76, 0.35),
        (0.81, 0.10),
        (0.79, -0.19),
        (0.71, -0.48),
        (0.63, -0.62),
        (0.52, -0.64),
        (0.43, -0.57),
        (0.34, -0.35),
        (0.26, -0.19),
        (-0.26, -0.19),
        (-0.34, -0.35),
        (-0.43, -0.57),
        (-0.52, -0.64),
        (-0.63, -0.62),
        (-0.71, -0.48),
        (-0.79, -0.19),
        (-0.81, 0.10),
        (-0.76, 0.35),
        (-0.64, 0.51),
        (-0.43, 0.56),
    ]

    b.slab(
        outline,
        [
            (0, 0.90, WOOD_DARK),
            (0.045, 0.98, WOOD_DARK),
            (0.13, 1, WOOD_DARK),
            (0.15, 1.012, METAL),
            (0.195, 1.012, METAL),
            (0.21, 1, METAL),
            (0.30, 0.99, WOOD),
            (0.34, 0.94, WOOD),
        ],
    )

    for sign in (-1, 1):
        b.box(
            (sign * 0.47, 0.555),
            (0.38, 0.17),
            0.29,
            0.435,
            METAL,
        )

        b.box(
            (sign * 0.47, 0.566),
            (0.27, 0.105),
            0.43,
            0.455,
            WOOD_DARK,
        )

        b.box(
            (sign * 0.10, 0.29),
            (0.115, 0.052),
            0.336,
            0.372,
            METAL,
        )

        b.box(
            (sign * 0.094, 0.442),
            (0.010, 0.13),
            0.339,
            0.343,
            WOOD_DARK,
        )

        handle = [
            (sign * x, y)
            for x, y in [
                (0.47, -0.22),
                (0.66, -0.25),
                (0.62, -0.48),
                (0.56, -0.55),
                (0.49, -0.49),
                (0.40, -0.28),
            ]
        ]

        b.slab(
            handle,
            [
                (0.337, 1, WOOD_DARK),
                (0.349, 0.90, WOOD_DARK),
            ],
        )

        for x, y in [(0.55, -0.30), (0.55, -0.47)]:
            b.radial(
                [
                    (0.349, 0.025, METAL),
                    (0.361, 0.021, METAL),
                ],
                center=(sign * x, y),
                n=8,
                smooth=False,
            )

    dpad_center = (-0.435, 0.225)

    b.radial(
        [
            (0.335, 0.196, WOOD_DARK),
            (0.352, 0.187, METAL),
        ],
        center=dpad_center,
        n=12,
        smooth=False,
    )

    cross = [
        (-0.052, -0.155),
        (0.052, -0.155),
        (0.052, -0.052),
        (0.155, -0.052),
        (0.155, 0.052),
        (0.052, 0.052),
        (0.052, 0.155),
        (-0.052, 0.155),
        (-0.052, 0.052),
        (-0.155, 0.052),
        (-0.155, -0.052),
        (-0.052, -0.052),
    ]

    b.slab(
        [
            (x + dpad_center[0], y + dpad_center[1])
            for x, y in cross
        ],
        [
            (0.35, 1, METAL),
            (0.404, 1, METAL),
            (0.418, 0.91, METAL),
        ],
    )

    b.radial(
        [
            (0.418, 0.032, WOOD_DARK),
            (0.423, 0.028, WOOD_DARK),
        ],
        center=dpad_center,
        n=8,
        smooth=False,
    )

    for dx, dy, slot in [
        (-0.116, 0, BLUE),
        (0, 0.116, YELLOW),
        (0.116, 0, RED),
        (0, -0.116, GREEN),
    ]:
        center = (0.435 + dx, 0.225 + dy)

        b.radial(
            [
                (0.335, 0.079, WOOD_DARK),
                (0.354, 0.077, METAL),
            ],
            center=center,
            n=12,
        )

        b.radial(
            [
                (0.351, 0.063, slot),
                (0.399, 0.063, slot),
                (0.414, 0.052, slot),
            ],
            center=center,
            n=12,
        )

    for x in (-0.285, 0.285):
        center = (x, -0.062)

        b.radial(
            [
                (0.334, 0.145, WOOD_DARK),
                (0.352, 0.145, METAL),
                (0.369, 0.127, METAL),
            ],
            center=center,
            n=12,
        )

        b.radial(
            [
                (0.36, 0.053, WOOD_DARK),
                (0.464, 0.053, METAL),
            ],
            center=center,
            n=10,
        )

        b.radial(
            [
                (0.451, 0.091, METAL),
                (0.472, 0.115, METAL),
                (0.524, 0.115, METAL),
                (0.54, 0.095, METAL),
                (0.54, 0.073, METAL),
                (0.526, 0.069, WOOD_DARK),
            ],
            center=center,
            n=12,
        )

    return b.finish("gamepad")


def build_onggi():
    b = Builder()
    n = 20

    profile = [
        (0, 0.245, BROWN),
        (0.025, 0.275, BROWN),
        (0.065, 0.285, BROWN),
        (0.14, 0.35, BROWN),
        (0.28, 0.425, BROWN),
        (0.43, 0.46, BROWN),
        (0.55, 0.455, BROWN),
        (0.595, 0.441, BROWN),
        (0.607, 0.436, WOOD_DARK),
    ]

    rings = [
        b.ring(
            [
                (
                    radius * math.cos(i * math.tau / n),
                    radius * math.sin(i * math.tau / n),
                    z,
                )
                for i in range(n)
            ]
        )
        for z, radius, slot in profile
    ]
    slots = [slot for z, radius, slot in profile]

    for offset, slot in [(0, BROWN), (0.009, WOOD_DARK)]:
        points = []

        for i in range(n):
            z = 0.62 + 0.018 * (i % 2) + offset
            radius = 0.436 - (z - 0.607) * 0.52

            points.append(
                (
                    radius * math.cos(i * math.tau / n),
                    radius * math.sin(i * math.tau / n),
                    z,
                )
            )

        rings.append(b.ring(points))
        slots.append(slot)

    for z, radius, slot in [
        (0.665, 0.406, BROWN),
        (0.677, 0.400, WOOD_DARK),
        (0.742, 0.342, BROWN),
        (0.785, 0.307, BROWN),
        (0.805, 0.307, BROWN),
        (0.815, 0.324, WOOD_DARK),
        (0.835, 0.324, BROWN),
        (0.845, 0.305, BROWN),
        (0.845, 0.277, BROWN),
        (0.78, 0.268, BROWN),
        (0.69, 0.32, BROWN),
        (0.44, 0.41, BROWN),
        (0.15, 0.29, BROWN),
        (0.09, 0.18, BROWN),
    ]:
        rings.append(
            b.ring(
                [
                    (
                        radius * math.cos(i * math.tau / n),
                        radius * math.sin(i * math.tau / n),
                        z,
                    )
                    for i in range(n)
                ]
            )
        )
        slots.append(slot)

    b.close(rings, slots, smooth=True)

    b.radial(
        [
            (0.826, 0.292, BROWN),
            (0.840, 0.347, BROWN),
            (0.855, 0.36, WOOD_DARK),
            (0.873, 0.355, BROWN),
            (0.89, 0.31, BROWN),
            (0.91, 0.22, BROWN),
            (0.922, 0.09, BROWN),
        ],
        n=n,
    )

    b.radial(
        [
            (0.916, 0.054, BROWN),
            (0.937, 0.067, BROWN),
            (0.971, 0.078, BROWN),
            (0.99, 0.061, WOOD_DARK),
        ],
        n=12,
    )

    return b.finish("onggi")


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

    for name, triangles in [
        ("Cube.094", 394),
        ("body.001", 512),
    ]:
        reference = bpy.data.objects[name]
        reference.data.calc_loop_triangles()

        assert len(reference.data.loop_triangles) == triangles, name
        assert any(
            material and material.name == "palette"
            for material in reference.data.materials
        )

    assert not any(
        polygon.use_smooth
        for polygon in bpy.data.objects["Cube.094"].data.polygons
    )
    assert all(
        polygon.use_smooth
        for polygon in bpy.data.objects["body.001"].data.polygons
    )

    material = bpy.data.materials["palette"]
    image = bpy.data.images.load(
        str(PALETTE),
        check_existing=True,
    )

    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    image.pack()

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


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]

    if "sparse" in accessor:
        raise RuntimeError("Unexpected sparse accessor")

    component_format = {
        5121: "B",
        5123: "H",
        5125: "I",
        5126: "f",
    }[accessor["componentType"]]

    width = {
        "SCALAR": 1,
        "VEC2": 2,
        "VEC3": 3,
        "VEC4": 4,
    }[accessor["type"]]

    fmt = "<" + component_format * width
    size = struct.calcsize(fmt)
    view = document["bufferViews"][accessor["bufferView"]]

    assert view["buffer"] == 0

    stride = view.get("byteStride", size)
    start = (
        view.get("byteOffset", 0)
        + accessor.get("byteOffset", 0)
    )

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

    magic, version, total = struct.unpack_from("<4sII", data)
    assert (magic, version, total) == (b"glTF", 2, len(data))

    size, kind = struct.unpack_from("<I4s", data, 12)
    assert kind == b"JSON"

    document = json.loads(data[20:20 + size])
    binary_start = 20 + size

    binary_size, binary_kind = struct.unpack_from(
        "<I4s",
        data,
        binary_start,
    )
    assert binary_kind == b"BIN\x00"

    binary = data[
        binary_start + 8:
        binary_start + 8 + binary_size
    ]

    assert len(document["buffers"]) == 1
    assert "uri" not in document["buffers"][0]
    assert len(document["meshes"]) == 1
    assert len(document["materials"]) == 1
    assert document["meshes"][0]["name"] == obj.name
    assert document["materials"][0]["name"] == "palette"

    primitive, = document["meshes"][0]["primitives"]

    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]

    assert {"POSITION", "NORMAL", "TEXCOORD_0"}.issubset(attributes)
    assert "COLOR_0" not in attributes

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

    indices = [
        row[0]
        for row in accessor_rows(
            document,
            binary,
            primitive["indices"],
        )
    ]

    assert len(indices) % 3 == 0

    triangles = len(indices) // 3
    assert triangles == len(obj.data.loop_triangles)

    for offset in range(0, len(indices), 3):
        a, b, c = indices[offset:offset + 3]

        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a])
            .cross(points[c] - points[a])
            .length / 2
            > 1e-10
        )
        assert all(
            abs(uvs[a][axis] - uvs[v][axis]) < 1e-7
            for v in (b, c)
            for axis in range(2)
        )

    lower, upper = bounds(points)
    target = TARGETS[obj.name]

    expected = Vector(
        (target[0], target[2], target[1])
    )

    assert (upper - lower - expected).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON

    node, = document["nodes"]

    assert node["name"] == obj.name
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]

    assert len(document["images"]) == 1
    assert len(document["textures"]) == 1

    image, = document["images"]

    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    dimensions = upper - lower

    return {
        "file": path.name,
        "triangles": triangles,
        "blender_dimensions": (
            dimensions.x,
            dimensions.z,
            dimensions.y,
        ),
        "glb_dimensions": tuple(dimensions),
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


def clone_for_preview(scene, source, offset):
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

    center = Vector(
        (
            (lower.x + upper.x) / 2,
            (lower.y + upper.y) / 2,
            lower.z,
        )
    )

    factor = 1.8 / max(upper - lower)
    position = Vector((0.8, 0.6, 0)) * offset

    for vertex, point in zip(mesh.vertices, points):
        vertex.co = (
            (point - center) * factor
            + position
        )

    mesh.update()

    return clone


def make_render_scene(objects):
    scene = bpy.data.scenes.new("landing-compare")
    scene.render.engine = "BLENDER_WORKBENCH"

    scene.render.resolution_x = 1800
    scene.render.resolution_y = 850
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"

    scene.world = bpy.data.worlds.new(
        "landing-compare-world"
    )
    scene.world.color = (0.045, 0.045, 0.045)

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "WORLD"
    shading.show_shadows = True
    shading.show_cavity = False

    references = [
        bpy.data.objects["Cube.094"],
        objects[0],
        objects[1],
        bpy.data.objects["body.001"],
    ]

    clones = [
        clone_for_preview(scene, source, offset)
        for source, offset in zip(
            references,
            (-3.15, -1.05, 1.05, 3.15),
        )
    ]

    camera = bpy.data.objects.new(
        "landing-camera",
        bpy.data.cameras.new("landing-camera"),
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

    direction = Vector((0.6, -0.8, 0.5)).normalized()
    rotation = (-direction).to_track_quat("-Z", "Y")
    basis = rotation.to_matrix()

    view_points = [
        basis.transposed() @ (point - center)
        for point in points
    ]

    screen_lower, screen_upper = bounds(view_points)

    center += basis @ Vector(
        (
            (screen_lower.x + screen_upper.x) / 2,
            (screen_lower.y + screen_upper.y) / 2,
            0,
        )
    )

    camera.location = center + direction * 15
    camera.rotation_euler = rotation.to_euler()

    aspect = (
        scene.render.resolution_x
        / scene.render.resolution_y
    )

    camera.data.ortho_scale = max(
        screen_upper.x - screen_lower.x,
        (screen_upper.y - screen_lower.y) * aspect,
    ) * 1.15

    return scene


def render_comparison(objects):
    scene = make_render_scene(objects)
    scene.render.filepath = str(OUTPUT / "compare.png")

    bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )

    print(
        "Compare order: original anvil | gamepad | "
        "onggi | original cauldron"
    )
    print(
        "Compare: maximum dimensions normalized to 1.8; "
        + str(OUTPUT / "compare.png")
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-render",
        action="store_true",
    )

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    load_source()

    scene = bpy.data.scenes.new("landing-export")
    bpy.context.window.scene = scene

    objects = [
        build_gamepad(),
        build_onggi(),
    ]

    bpy.context.view_layer.update()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    results = [
        export_glb(obj)
        for obj in objects
    ]

    if not args.skip_render:
        render_comparison(objects)

    for result in results:
        print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
