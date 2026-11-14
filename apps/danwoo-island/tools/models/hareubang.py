# blender -b --factory-startup -P hareubang.py -- out.glb
# 팔레트 위치가 달라지면: -- out.glb --palette /path/to/palette.png

import argparse
import sys
from pathlib import Path

import bpy
from mathutils import Vector

DEFAULT_PALETTE = Path(
    "/private/var/folders/kf/3g0vshgs7036ghmr3cv1f9lh0000gn/T/"
    "danwoo-island-world-70764a9/static/palette.png"
)
TARGET_SIZE = Vector((1.282, 0.573, 4.383))
STONE, SHADOW, LIGHT = 0, 6, 4

OCTAGON = (
    (-0.80, -1.0), (0.80, -1.0),
    (1.0, -0.55), (1.0, 0.55),
    (0.80, 1.0), (-0.80, 1.0),
    (-1.0, 0.55), (-1.0, -0.55),
)
HEXAGON = (
    (-0.65, -1.0), (0.65, -1.0), (1.0, 0.0),
    (0.65, 1.0), (-0.65, 1.0), (-1.0, 0.0),
)


class MeshBuilder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []

    def add_vertices(self, points):
        start = len(self.vertices)
        self.vertices.extend(points)
        return list(range(start, len(self.vertices)))

    def face(self, indices, slot=None):
        self.faces.append(tuple(indices))
        self.slots.append(slot)

    def bridge(self, first, second, slot=None):
        for i in range(len(first)):
            j = (i + 1) % len(first)
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
            )

    def loft(self, sections):
        rings = [
            self.add_vertices([
                (x * rx, y * ry, z)
                for x, y in OCTAGON
            ])
            for z, rx, ry in sections
        ]
        self.face(reversed(rings[0]), SHADOW)
        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second)
        self.face(rings[-1])

    def relief(self, outline, back_y, front_y, slot=None):
        if isinstance(front_y, (int, float)):
            depths = [front_y] * len(outline)
        else:
            depths = front_y
        if len(depths) != len(outline):
            raise ValueError("Front depth count must match outline")

        back = self.add_vertices([
            (x, back_y, z) for x, z in outline
        ])
        front = self.add_vertices([
            (x, y, z)
            for (x, z), y in zip(outline, depths)
        ])
        self.face(reversed(back), SHADOW)
        self.bridge(back, front, slot)
        self.face(front, slot)

    def plate(self, outline, y, slot):
        self.face(
            self.add_vertices([(x, y, z) for x, z in outline]),
            slot,
        )


def outline_at(shape, center, radius):
    cx, cz = center
    rx, rz = radius
    return [(cx + x * rx, cz + z * rz) for x, z in shape]


def rectangle(x0, x1, z0, z1):
    return [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]


def build_geometry():
    builder = MeshBuilder()

    builder.loft((
        (0.0, 0.40, 0.18),
        (0.38, 0.47, 0.21),
        (2.42, 0.42, 0.19),
    ))
    builder.loft((
        (2.27, 0.40, 0.19),
        (2.67, 0.47, 0.21),
        (3.64, 0.44, 0.20),
    ))
    builder.loft((
        (3.52, 0.58, 0.25),
        (3.60, 0.641, 0.2865),
        (3.76, 0.61, 0.27),
    ))
    builder.loft((
        (3.72, 0.50, 0.24),
        (4.14, 0.40, 0.21),
        (4.383, 0.18, 0.12),
    ))

    for side in (-1, 1):
        cx = side * 0.46
        builder.relief(
            rectangle(cx - 0.055, cx + 0.055, 2.72, 3.26),
            -0.06, -0.17,
        )

        cx = side * 0.235
        builder.plate(
            outline_at(OCTAGON, (cx, 3.12), (0.170, 0.194)),
            -0.216, SHADOW,
        )
        builder.relief(
            outline_at(HEXAGON, (cx, 3.12), (0.138, 0.158)),
            -0.18, -0.315,
        )
        builder.plate(
            [
                (cx - 0.175, 3.34),
                (cx + 0.175, 3.34),
                (cx + 0.13, 3.43),
                (cx - 0.11, 3.47),
            ],
            -0.235, SHADOW,
        )

    builder.relief(
        [
            (-0.105, 2.72), (0.105, 2.72),
            (0.073, 3.42), (-0.073, 3.42),
        ],
        -0.205,
        (-0.410, -0.410, -0.300, -0.300),
    )
    builder.plate(
        [
            (-0.19, 2.57), (0.19, 2.57),
            (0.16, 2.62), (-0.16, 2.62),
        ],
        -0.222, SHADOW,
    )

    builder.relief(
        [
            (-0.45, 1.48), (-0.29, 1.55),
            (-0.28, 2.20), (-0.43, 2.28),
        ],
        -0.12, -0.258,
    )
    builder.relief(
        [
            (0.29, 0.91), (0.45, 0.99),
            (0.43, 1.82), (0.28, 1.74),
        ],
        -0.12, -0.258,
    )

    for cx, cz in ((-0.11, 1.72), (0.10, 1.12)):
        builder.relief(
            outline_at(HEXAGON, (cx, cz), (0.245, 0.205)),
            -0.205, -0.327,
        )
        for offset in (-0.095, 0.0, 0.095):
            builder.plate(
                rectangle(
                    cx - 0.14,
                    cx + 0.14,
                    cz + offset - 0.009,
                    cz + offset + 0.009,
                ),
                -0.328, SHADOW,
            )

    return builder


def make_material(palette_path):
    image = bpy.data.images.load(
        str(palette_path),
        check_existing=False,
    )
    if tuple(image.size) != (128, 4):
        raise ValueError("Expected a 128 x 4 palette PNG")
    image.colorspace_settings.name = "sRGB"

    material = bpy.data.materials.new("palette")
    material.use_nodes = True
    material.use_backface_culling = True
    material.diffuse_color = (1.0, 1.0, 1.0, 1.0)

    nodes = material.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 1.0

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"

    links = material.node_tree.links
    links.new(uv.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return material


def make_object(builder, material):
    points = [Vector(v) for v in builder.vertices]
    low = Vector(tuple(
        min(v[axis] for v in points) for axis in range(3)
    ))
    high = Vector(tuple(
        max(v[axis] for v in points) for axis in range(3)
    ))
    center = (low + high) * 0.5
    scale = tuple(
        TARGET_SIZE[axis] / (high[axis] - low[axis])
        for axis in range(3)
    )
    normalized = [
        tuple(
            (v[axis] - center[axis]) * scale[axis]
            for axis in range(3)
        )
        for v in points
    ]

    mesh = bpy.data.meshes.new("hareubang")
    mesh.from_pydata(normalized, [], builder.faces)
    mesh.update()

    obj = bpy.data.objects.new("hareubang", mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(material)

    uv_layer = mesh.uv_layers.new(name="UVMap")
    for polygon, override in zip(mesh.polygons, builder.slots):
        polygon.use_smooth = False
        normal = polygon.normal
        slot = override
        if slot is None:
            if normal.z > 0.65:
                slot = LIGHT
            elif normal.y > 0.4 or normal.z < -0.45:
                slot = SHADOW
            else:
                slot = STONE
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = (
                (slot + 0.5) / 32.0,
                0.5,
            )

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.context.view_layer.update()
    mesh.calc_loop_triangles()

    triangle_count = len(mesh.loop_triangles)
    assert triangle_count == 346, triangle_count
    assert all(
        abs(obj.dimensions[i] - TARGET_SIZE[i]) < 1e-5
        for i in range(3)
    )
    assert not mesh.color_attributes
    assert all(not polygon.use_smooth for polygon in mesh.polygons)
    return obj, triangle_count


def main():
    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv else []
    )
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--palette",
        type=Path,
        default=DEFAULT_PALETTE,
    )
    args = parser.parse_args(argv)

    if not args.palette.is_file():
        parser.error(
            "Palette not found; supply --palette /path/to/palette.png"
        )
    if args.output.suffix.lower() != ".glb":
        parser.error("Output must end in .glb")

    output = args.output.resolve()
    if not output.parent.is_dir():
        parser.error("Output directory does not exist")

    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material, do_unlink=True)

    obj, triangle_count = make_object(
        build_geometry(),
        make_material(args.palette.resolve()),
    )

    result = bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_vertex_color="NONE",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_apply=False,
    )
    if result != {"FINISHED"}:
        raise RuntimeError(f"Export failed: {result}")

    corners = [Vector(corner) for corner in obj.bound_box]
    low = tuple(min(v[i] for v in corners) for i in range(3))
    high = tuple(max(v[i] for v in corners) for i in range(3))

    print(f"triangles={triangle_count}")
    print("bounds_min=(%.6f, %.6f, %.6f)" % low)
    print("bounds_max=(%.6f, %.6f, %.6f)" % high)
    print("dimensions=(%.6f, %.6f, %.6f)" % tuple(obj.dimensions))


if __name__ == "__main__":
    main()
