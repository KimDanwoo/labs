"""
Blender 5.3
실행: blender -b --factory-startup --disable-autoexec --python /absolute/path/to/shellFountain.py
렌더 생략: 명령 끝에 -- --skip-render 추가.

원본 blend 없이 새 형상을 생성한다. 물은 미리보기에만 포함한다.
출구 접합면 안쪽은 그릇이며, 출구 평면 바깥의 물줄기 통로는 완전히 비운다.
"""
import argparse
from collections import Counter
import json
import math
from pathlib import Path
import struct
import sys

import bmesh
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import closest_point_on_tri, intersect_ray_tri


ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/fountain"
NAME = "shellFountain"
EPS = 1e-6

SLOTS = {
    "sand": 1,
    "turquoise": 3,
    "peach": 7,
    "green": 9,
    "lime": 12,
    "khaki": 13,
    "orange": 15,
    "pink": 17,
    "mango": 18,
    "cream": 23,
}
RGB = {
    1: (235, 209, 163),
    3: (61, 187, 231),
    7: (238, 195, 175),
    9: (145, 173, 120),
    12: (171, 174, 43),
    13: (164, 152, 118),
    15: (228, 98, 2),
    17: (253, 230, 226),
    18: (248, 166, 88),
    23: (255, 242, 232),
}
USED = set(SLOTS.values())

SPOUTS = tuple(
    Vector(p)
    for p in (
        (-0.445, -0.636, 1.03),
        (0.0, -0.78, 1.03),
        (0.445, -0.636, 1.03),
    )
)
OUTWARD = tuple(
    Vector((p.x, p.y, 0)).normalized()
    for p in SPOUTS
)

SHELL_THICKNESS = 0.14
LOW = (-1.3, -1.3, 0.0)
HIGH = (1.3, 1.3, 2.4)
SPOUT_ANGLE = math.atan2(0.445, 0.636)
SPOUT_RADIUS = math.hypot(0.445, 0.636)


def bounds(points):
    points = list(points)
    return (
        tuple(min(p[k] for p in points) for k in range(3)),
        tuple(max(p[k] for p in points) for k in range(3)),
    )


def assert_bounds(points, low=LOW, high=HIGH):
    actual = bounds(points)
    assert all(
        abs(a - b) < 0.01
        for row, goal in zip(actual, (low, high), strict=True)
        for a, b in zip(row, goal, strict=True)
    ), actual
    return {
        "min": list(actual[0]),
        "max": list(actual[1]),
    }


def slot_of(uv):
    slot = round(uv[0] * 32 - 0.5)
    assert slot in USED
    assert abs(uv[0] - (slot + 0.5) / 32) < 1e-7
    assert abs(uv[1] - 0.5) < 1e-7
    return slot


def load_palette():
    assert bpy.app.version[:2] == (5, 3), bpy.app.version_string
    assert "--disable-autoexec" in sys.argv
    assert PALETTE.is_file(), str(PALETTE)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    image.colorspace_settings.name = "sRGB"
    assert tuple(image.size) == (128, 4)

    pixels = list(image.pixels)
    for slot, expected in RGB.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        actual = tuple(
            round(pixels[offset + c] * 255)
            for c in range(3)
        )
        assert actual == expected, (slot, actual, expected)
        assert pixels[offset + 3] > 0.999

    image.pack()

    old = bpy.data.materials.get("palette")
    if old:
        bpy.data.materials.remove(old, do_unlink=True)

    material = bpy.data.materials.new("palette")
    material.use_nodes = True
    material.use_backface_culling = True

    nodes = material.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.84
    shader.inputs["Metallic"].default_value = 0

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    nodes.active = texture

    material.node_tree.links.new(
        texture.outputs["Color"],
        shader.inputs["Base Color"],
    )
    material.node_tree.links.new(
        shader.outputs["BSDF"],
        output.inputs["Surface"],
    )
    return material


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.tags = []
        self.names = []
        self.part = ""
        self.shell_pairs = []
        self.rim_vertices = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)
        return list(range(start, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)
        assert len(indices) >= 3
        assert len(indices) == len(set(indices))
        assert slot in USED

        if self.part not in self.names:
            self.names.append(self.part)

        self.faces.append(indices)
        self.slots.append(slot)
        self.tags.append(self.names.index(self.part))

    def bridge(self, first, second, slot, closed=True):
        assert len(first) == len(second)
        count = len(first) if closed else len(first) - 1

        for i in range(count):
            j = (i + 1) % len(first)
            color = (
                slot[i % len(slot)]
                if isinstance(slot, (tuple, list))
                else slot
            )
            self.face(
                (first[i], first[j], second[j], second[i]),
                color,
            )

    def cap(self, ring, center, slot):
        middle = self.ring([center])[0]
        for i in range(len(ring)):
            self.face(
                (ring[i], ring[(i + 1) % len(ring)], middle),
                slot,
            )

    def lathe(self, profile, segments=48, closed=False):
        rings = [
            self.ring(
                (
                    r * math.cos(math.tau * i / segments),
                    r * math.sin(math.tau * i / segments),
                    z,
                )
                for i in range(segments)
            )
            for r, z, slot in profile
        ]

        for i in range(1, len(rings)):
            self.bridge(
                rings[i - 1],
                rings[i],
                profile[i][2],
            )

        if closed:
            self.bridge(rings[-1], rings[0], profile[0][2])
        else:
            self.cap(
                rings[0],
                (0, 0, profile[0][1]),
                profile[0][2],
            )
            self.cap(
                rings[-1],
                (0, 0, profile[-1][1]),
                profile[-1][2],
            )

    def ellipsoid(
        self,
        center,
        scale,
        slots,
        segments=12,
        latitudes=6,
        radial=None,
        tangent=None,
    ):
        center = Vector(center)
        radial = Vector((0, 1, 0)) if radial is None else radial
        tangent = Vector((1, 0, 0)) if tangent is None else tangent

        rings = []
        for j in range(1, latitudes):
            phi = math.pi * j / latitudes
            rings.append(
                self.ring(
                    center
                    + tangent * (
                        scale[0]
                        * math.sin(phi)
                        * math.cos(math.tau * i / segments)
                    )
                    + radial * (
                        scale[1]
                        * math.sin(phi)
                        * math.sin(math.tau * i / segments)
                    )
                    + Vector((0, 0, scale[2] * math.cos(phi)))
                    for i in range(segments)
                )
            )

        self.cap(
            rings[0],
            center + Vector((0, 0, scale[2])),
            slots[0],
        )
        for j in range(1, len(rings)):
            self.bridge(
                rings[j - 1],
                rings[j],
                slots[min(j, len(slots) - 1)],
            )
        self.cap(
            rings[-1],
            center - Vector((0, 0, scale[2])),
            slots[-1],
        )

    def finish(self, material):
        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        assert not mesh.validate()

        mesh.materials.append(material)
        uv = mesh.uv_layers.new(name="UVMap")
        tag = mesh.attributes.new("part_id", "INT", "FACE")

        for polygon, slot, part in zip(
            mesh.polygons,
            self.slots,
            self.tags,
            strict=True,
        ):
            tag.data[polygon.index].value = part
            for loop in polygon.loop_indices:
                uv.data[loop].uv = ((slot + 0.5) / 32, 0.5)

        bm = bmesh.new()
        try:
            bm.from_mesh(mesh)
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
            while remaining:
                component = {remaining.pop()}
                pending = list(component)

                while pending:
                    for edge in pending.pop().edges:
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

            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert len(mesh.vertices) == len(self.vertices)
        for actual, expected in zip(
            mesh.vertices,
            self.vertices,
            strict=True,
        ):
            assert (actual.co - Vector(expected)).length < EPS

        for polygon in mesh.polygons:
            polygon.use_smooth = False

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)
        bpy.context.view_layer.update()
        return obj


def build_base(b):
    b.part = "base_lower"
    b.lathe(
        [
            (1.245, 0.000, 13),
            (1.300, 0.035, 13),
            (1.300, 0.115, 1),
            (1.275, 0.165, 1),
            (1.220, 0.200, 23),
        ],
        segments=64,
    )

    b.part = "pool_rim"
    b.lathe(
        [
            (1.080, 0.200, 1),
            (1.125, 0.225, 1),
            (1.150, 0.265, 1),
            (1.150, 0.385, 1),
            (1.130, 0.435, 23),
            (1.100, 0.460, 23),
            (1.070, 0.460, 23),
            (1.045, 0.435, 23),
            (1.045, 0.395, 1),
            (1.045, 0.285, 3),
            (1.060, 0.220, 3),
        ],
        closed=True,
    )

    b.part = "pool_floor"
    b.lathe(
        [
            (1.060, 0.205, 3),
            (1.060, 0.280, 3),
            (0.970, 0.270, 3),
            (0.680, 0.245, 3),
            (0.320, 0.300, 3),
        ]
    )

    b.part = "pillar"
    b.lathe(
        [
            (0.285, 0.300, 1),
            (0.320, 0.325, 23),
            (0.320, 0.370, 23),
            (0.305, 0.405, 1),
            (0.305, 0.585, 1),
            (0.290, 0.650, 23),
        ],
        segments=24,
    )


def notch(angle):
    return max(
        math.exp(
            -(
                math.atan2(
                    math.sin(angle - a),
                    math.cos(angle - a),
                )
                / math.radians(5)
            ) ** 2
        )
        for a in (-SPOUT_ANGLE, 0, SPOUT_ANGLE)
    )


def outline(angle):
    a = abs(math.atan2(math.sin(angle), math.cos(angle)))
    knots = (
        (0.0, 0.78),
        (SPOUT_ANGLE / 2, 0.685),
        (SPOUT_ANGLE, SPOUT_RADIUS),
        (SPOUT_ANGLE + 0.25, 0.720),
        (math.pi / 2, 0.850),
        (2.15, 0.770),
        (math.pi, 0.730),
    )

    for (a0, r0), (a1, r1) in zip(knots, knots[1:]):
        if a <= a1:
            t = (a - a0) / (a1 - a0)
            return r0 + (r1 - r0) * (
                0.5 - 0.5 * math.cos(math.pi * t)
            )

    return knots[-1][1]


def build_bowl(b):
    angles = sorted(
        set(
            [i * math.tau / 72 for i in range(72)]
            + [
                (a + offset) % math.tau
                for a in (-SPOUT_ANGLE, SPOUT_ANGLE)
                for offset in (
                    0,
                    -math.radians(5),
                    math.radians(5),
                )
            ]
        )
    )

    b.part = "lower_shell"
    profiles = [
        (0.28, 0.620, 0.00, 0.000),
        (0.43, 0.685, 0.12, 0.000),
        (0.56, 0.790, 0.25, 0.000),
        (0.66, 0.910, 0.55, 0.000),
        (0.76, 1.015, 1.00, 0.025),
        (0.78, 1.060, 1.00, 0.030),
        (0.73, 1.052, 1.00, 0.047),
        (0.61, 0.985, 0.00, 0.000),
        (0.44, 0.950, 0.00, 0.000),
        (0.16, 0.940, 0.00, 0.000),
    ]

    rings = []
    for row, (radius, z, scallop, dip) in enumerate(profiles):
        rings.append(
            b.ring(
                (
                    (
                        radius + scallop * (outline(a) - 0.78)
                        - (
                            0.0, 0.012, 0.022, 0.014, 0.0,
                            0.0, 0.0, 0.0, 0.0, 0.0,
                        )[row]
                        * (0.5 + 0.5 * math.cos(12 * a)) ** 4
                    ) * math.sin(a),
                    -(
                        radius + scallop * (outline(a) - 0.78)
                        - (
                            0.0, 0.012, 0.022, 0.014, 0.0,
                            0.0, 0.0, 0.0, 0.0, 0.0,
                        )[row]
                        * (0.5 + 0.5 * math.cos(12 * a)) ** 4
                    ) * math.cos(a),
                    z - dip * notch(a),
                )
                for a in angles
            )
        )

    b.rim_vertices = rings[5]
    b.cap(rings[0], (0, 0, 0.620), 1)

    for i in range(1, len(rings)):
        if i >= 7:
            colors = 3
        elif i == 6:
            colors = [
                3 if notch(a) > 0.35 else 23
                for a in angles
            ]
        else:
            colors = [
                7 if int((a % math.tau) / math.tau * 12) % 2 else 1
                for a in angles
            ]

        b.bridge(rings[i - 1], rings[i], colors)

    b.cap(rings[-1], (0, 0, 0.940), 3)


def build_upper_shell(b):
    lobe_count = 7
    segments = 84
    fractions = (0.10, 0.26, 0.44, 0.63, 0.80, 0.965, 1.0)
    hinge_y = 0.625
    hinge_z = 0.96
    lean = math.tan(math.radians(20))
    wrap_depth = 0.40
    groove_half_angle = math.radians(0.28)

    boundaries = [
        -math.pi / 2 + math.pi * i / lobe_count
        for i in range(1, lobe_count)
    ]
    angles = sorted(
        set(
            [
                -math.pi / 2 + math.pi * i / segments
                for i in range(segments + 1)
            ]
            + [
                a + offset
                for a in boundaries
                for offset in (-groove_half_angle, groove_half_angle)
            ]
        )
    )
    segments = len(angles) - 1

    def silhouette(a):
        inset = 0.06 * (1 - math.cos(2 * lobe_count * a))
        return (
            (1.25 - inset) * math.sin(a),
            0.16 + (1.28 - inset) * math.cos(a),
        )

    x_scale = 1.25 / max(
        abs(silhouette(a)[0])
        for a in angles
    )
    z_scale = (2.4 - hinge_z) / max(
        silhouette(a)[1]
        for a in angles
    )

    def front_color(a):
        if any(
            abs(a - boundary) < groove_half_angle
            for boundary in boundaries
        ):
            return 18

        band = min(
            lobe_count - 1,
            int((a + math.pi / 2) / math.pi * lobe_count),
        )
        return 7 if band % 2 == 0 else 1

    front_colors = [
        front_color((a + c) / 2)
        for a, c in zip(angles, angles[1:])
    ]
    surfaces = []
    all_indices = []

    for side in ("front", "back"):
        b.part = "upper_" + side
        offset = 0 if side == "front" else SHELL_THICKNESS
        apex = b.ring([(0, hinge_y + offset, hinge_z)])[0]

        rings = []
        for f in fractions:
            points = []

            for a in angles:
                sx, sz = silhouette(a)
                x = x_scale * sx * f
                h = z_scale * sz * f
                y = (
                    hinge_y
                    + lean * h
                    - wrap_depth * (x / 1.25) ** 2
                    + 0.008 * f * f
                    * (1 - math.cos(2 * lobe_count * a))
                    + offset
                )
                points.append((x, y, hinge_z + h))

            rings.append(b.ring(points))

        colors = front_colors if side == "front" else 7

        for i in range(segments):
            b.face(
                (apex, rings[0][i], rings[0][i + 1]),
                colors[i] if isinstance(colors, list) else colors,
            )

        for j in range(1, len(rings)):
            b.bridge(
                rings[j - 1],
                rings[j],
                7 if j == len(rings) - 1 else colors,
                closed=False,
            )

        boundary = (
            [apex]
            + [ring[0] for ring in rings]
            + rings[-1][1:]
            + [
                ring[-1]
                for ring in reversed(rings[:-1])
            ]
        )
        surfaces.append(boundary)
        all_indices.append(
            [apex] + [v for ring in rings for v in ring]
        )

    b.part = "upper_edge"
    b.bridge(surfaces[0], surfaces[1], 17)
    b.shell_pairs = list(
        zip(all_indices[0], all_indices[1], strict=True)
    )

    b.part = "hinge"
    b.ellipsoid(
        (0, 0.71, 0.99),
        (0.27, 0.075, 0.10),
        (7, 7, 1),
    )

    b.part = "pearl_seat"
    b.lathe(
        [
            (0.09, 0.94, 23),
            (0.105, 0.98, 23),
            (0.08, 1.045, 23),
        ],
        segments=16,
    )

    b.part = "pearl"
    b.ellipsoid(
        (0, 0, 1.16),
        (0.13, 0.13, 0.13),
        (23,),
        segments=12,
        latitudes=7,
    )


def build_bush(b, side):
    b.part = "leaves_left" if side < 0 else "leaves_right"
    root_angle = math.radians(23)
    leaves = (
        (-0.52, 0.55, 0.17, 0.135),
        (-0.36, 0.59, 0.15, 0.150),
        (-0.21, 0.64, 0.12, 0.155),
        (-0.08, 0.70, 0.07, 0.145),
        (0.06, 0.67, 0.10, 0.155),
        (0.21, 0.63, 0.13, 0.160),
        (0.36, 0.59, 0.15, 0.150),
        (0.51, 0.56, 0.17, 0.140),
        (0.63, 0.55, 0.14, 0.125),
    )

    for spread, height, reach, half_width in leaves:
        rings = []

        for f, width_factor in (
            (0.0, 0.045),
            (0.22, 0.65),
            (0.48, 1.0),
            (0.73, 0.72),
            (0.90, 0.32),
        ):
            angle = root_angle + spread * f
            radial = Vector(
                (side * math.cos(angle), math.sin(angle), 0)
            )
            tangent = Vector(
                (-side * math.sin(angle), math.cos(angle), 0)
            )
            center = (
                radial * (1.075 + reach * f)
                + Vector(
                    (
                        0,
                        0,
                        0.455 + height * math.sin(math.pi * f / 2),
                    )
                )
            )
            width = half_width * width_factor
            fold = 0.008 + 0.050 * math.sin(math.pi * f)

            rings.append(
                b.ring(
                    center
                    + tangent * across
                    + Vector((0, 0, dz))
                    for across, dz in (
                        (-width, 0),
                        (0, fold),
                        (width, 0),
                        (0, -0.012),
                    )
                )
            )

        b.face(reversed(rings[0]), 9)

        for first, second in zip(rings, rings[1:]):
            b.bridge(first, second, (12, 9, 9, 9))

        angle = root_angle + spread
        tip = b.ring(
            [
                (
                    side * math.cos(angle) * (1.075 + reach),
                    math.sin(angle) * (1.075 + reach),
                    0.455 + height,
                )
            ]
        )[0]

        for i in range(4):
            b.face(
                (rings[-1][i], rings[-1][(i + 1) % 4], tip),
                12 if i == 0 else 9,
            )


def build_decorations(b):
    a = math.radians(43)
    radial = Vector((math.sin(a), -math.cos(a), 0))
    tangent = Vector((-radial.y, radial.x, 0))
    center = radial * 1.118 + Vector((0, 0, 0.452))

    b.part = "starfish"
    rings = []

    for scale, height in (
        (0.83, -0.012),
        (1.0, 0.009),
        (0.81, 0.035),
    ):
        rings.append(
            b.ring(
                center
                + tangent * (
                    0.1473
                    * scale
                    * (1 if i % 2 == 0 else 0.44)
                    * math.sin(i * math.pi / 5)
                )
                + radial * (
                    0.072
                    * scale
                    * (1 if i % 2 == 0 else 0.44)
                    * math.cos(i * math.pi / 5)
                )
                + Vector((0, 0, height))
                for i in range(10)
            )
        )

    b.cap(
        rings[0],
        center + Vector((0, 0, -0.012)),
        18,
    )
    b.bridge(rings[0], rings[1], 18)
    b.bridge(
        rings[1],
        rings[2],
        (18, 15, 18, 18, 18),
    )

    peak = b.ring(
        [center + Vector((0, 0, 0.069))]
    )[0]

    for i in range(10):
        b.face(
            (
                rings[2][i],
                rings[2][(i + 1) % 10],
                peak,
            ),
            15 if i in (2, 7) else 18,
        )

    b.part = "pebble"
    a = math.radians(-49)
    radial = Vector((math.sin(a), -math.cos(a), 0))
    tangent = Vector((-radial.y, radial.x, 0))
    center = radial * 1.108 + Vector((0, 0, 0.485))

    b.ellipsoid(
        center,
        (0.11, 0.057, 0.067),
        (23, 23, 23, 17),
        radial=radial,
        tangent=tangent,
    )


def stream_point(index, t):
    start = SPOUTS[index]
    control = start + OUTWARD[index] * 0.12
    end = OUTWARD[index] * 0.95 + Vector((0, 0, 0.35))

    return (
        (1 - t) ** 2 * start
        + 2 * (1 - t) * t * control
        + t * t * end
    )


def build_fountain(material):
    b = Builder()
    build_base(b)
    build_bowl(b)
    build_upper_shell(b)
    build_bush(b, -1)
    build_bush(b, 1)
    build_decorations(b)

    obj = b.finish(material)
    return obj, b


def clip_polygon(points, signed_distance):
    if not points:
        return []

    clipped = []
    previous = points[-1]
    previous_d = signed_distance(previous)

    for current in points:
        current_d = signed_distance(current)

        if (previous_d >= 0) != (current_d >= 0):
            t = previous_d / (previous_d - current_d)
            clipped.append(previous.lerp(current, t))

        if current_d >= 0:
            clipped.append(current)

        previous, previous_d = current, current_d

    return clipped


def radial_range(points):
    minimum = float("inf")
    inside = False

    for a, b in zip(points, points[1:] + points[:1]):
        dx, dy = b.x - a.x, b.y - a.y
        length2 = dx * dx + dy * dy
        t = (
            max(
                0,
                min(
                    1,
                    -(a.x * dx + a.y * dy) / length2,
                ),
            )
            if length2
            else 0
        )
        minimum = min(
            minimum,
            math.hypot(a.x + t * dx, a.y + t * dy),
        )

        if (a.y > 0) != (b.y > 0):
            if a.x + (b.x - a.x) * (-a.y) / (b.y - a.y) > 0:
                inside = not inside

    return (
        0 if inside else minimum,
        max(math.hypot(p.x, p.y) for p in points),
    )


def segment_distance(p1, q1, p2, q2):
    d1 = q1 - p1
    d2 = q2 - p2
    r = p1 - p2
    a = d1.dot(d1)
    e = d2.dot(d2)

    if a < 1e-16 and e < 1e-16:
        return (p1 - p2).length

    if a < 1e-16:
        s = 0.0
        t = max(0, min(1, d2.dot(r) / e))
    else:
        c = d1.dot(r)

        if e < 1e-16:
            s = max(0, min(1, -c / a))
            t = 0.0
        else:
            bb = d1.dot(d2)
            f = d2.dot(r)
            denominator = a * e - bb * bb

            s = (
                max(
                    0,
                    min(1, (bb * f - c * e) / denominator),
                )
                if denominator > 1e-16
                else 0.0
            )
            t = (bb * s + f) / e

            if t < 0:
                t = 0.0
                s = max(0, min(1, -c / a))
            elif t > 1:
                t = 1.0
                s = max(0, min(1, (bb - c) / a))

    return (
        (p1 + d1 * s) - (p2 + d2 * t)
    ).length


def segment_triangle_distance(p, q, a, b, c):
    direction = q - p
    hit = intersect_ray_tri(
        a,
        b,
        c,
        direction,
        p,
        True,
    )

    if hit is not None:
        t = (
            (hit - p).dot(direction)
            / direction.length_squared
        )
        if -EPS <= t <= 1 + EPS:
            return 0.0

    return min(
        (p - closest_point_on_tri(p, a, b, c)).length,
        (q - closest_point_on_tri(q, a, b, c)).length,
        segment_distance(p, q, a, b),
        segment_distance(p, q, b, c),
        segment_distance(p, q, c, a),
    )


def verify_clearances(mesh, names):
    curves = [
        [stream_point(i, j / 64) for j in range(65)]
        for i in range(3)
    ]

    # 곡선의 64분할 현과 실제 곡선 사이 오차까지 포함한다.
    safe_radius = 0.08005
    curve_boxes = [bounds(curve) for curve in curves]
    closest = float("inf")

    decorations = {
        "starfish",
        "pebble",
        "leaves_left",
        "leaves_right",
    }

    for face in mesh.polygons:
        points = [
            mesh.vertices[i].co.copy()
            for i in face.vertices
        ]
        name = names[
            mesh.attributes["part_id"].data[face.index].value
        ]

        clipped = clip_polygon(
            points,
            lambda p: p.z - 0.36,
        )
        clipped = clip_polygon(
            clipped,
            lambda p: 0.42 - p.z,
        )

        if clipped:
            low, high = radial_range(clipped)
            assert (
                high < 0.5 - EPS
                or low > 1.0 + EPS
            ), ("연못 낙하 링 침범", name, low, high)

        if name in decorations:
            assert radial_range(points)[0] >= 1.03 - EPS, (
                "장식 위치",
                name,
            )

        triangle_box = bounds(points)

        for i, curve in enumerate(curves):
            low, high = curve_boxes[i]

            if any(
                triangle_box[1][axis] < low[axis] - safe_radius
                or triangle_box[0][axis] > high[axis] + safe_radius
                for axis in range(3)
            ):
                continue

            # 출구 평면 자체는 물과 껍데기의 접합면이다.
            outside = clip_polygon(
                points,
                lambda p: (
                    (p - SPOUTS[i]).dot(OUTWARD[i]) - EPS
                ),
            )

            for j in range(1, len(outside) - 1):
                tri = (
                    outside[0],
                    outside[j],
                    outside[j + 1],
                )

                if (
                    (tri[1] - tri[0])
                    .cross(tri[2] - tri[0])
                    .length < 1e-12
                ):
                    continue

                distance = min(
                    segment_triangle_distance(a, b, *tri)
                    for a, b in zip(curve, curve[1:])
                )
                closest = min(closest, distance)

                assert distance >= safe_radius, (
                    "물줄기 통로 침범",
                    name,
                    i,
                    distance,
                    [tuple(p) for p in tri],
                )

    return closest


def verify_shell(mesh, builder):
    front = []
    back = []

    for face in mesh.polygons:
        name = builder.names[
            mesh.attributes["part_id"].data[face.index].value
        ]
        if name == "upper_front":
            front.append(face)
        elif name == "upper_back":
            back.append(face)

    assert front and back

    for a, b in builder.shell_pairs:
        delta = (
            mesh.vertices[b].co
            - mesh.vertices[a].co
        )
        assert abs(delta.length - SHELL_THICKNESS) < EPS
        assert abs(delta.x) < EPS
        assert abs(delta.z) < EPS

    slab_minimum = min(
        abs(face.normal.y) * SHELL_THICKNESS
        for face in front
    )
    assert slab_minimum >= 0.1, (
        "법선 방향 껍데기 두께",
        slab_minimum,
    )

    tree = BVHTree.FromPolygons(
        [v.co for v in mesh.vertices],
        [tuple(f.vertices) for f in back],
        all_triangles=True,
    )

    minimum = float("inf")
    for face in front:
        a, b, c = [
            mesh.vertices[i].co
            for i in face.vertices
        ]

        for point in (
            a,
            b,
            c,
            (a + b) / 2,
            (b + c) / 2,
            (c + a) / 2,
            (a + b + c) / 3,
        ):
            nearest = tree.find_nearest(point)
            assert nearest[0] is not None
            minimum = min(minimum, nearest[3])

    assert minimum >= 0.1, (
        "앞뒤 표면 최소 거리",
        minimum,
    )

    return {
        "axial": SHELL_THICKNESS,
        "normal_lower_bound": slab_minimum,
        "sampled_surface_minimum": minimum,
    }


def verify_water_floors(obj):
    result = {}

    for name, z, radii, floor_low, floor_high in (
        (
            "pool",
            0.35,
            (0.45, 0.70, 0.95, 0.995),
            0.20,
            0.30,
        ),
        (
            "bowl",
            1.02,
            (0.18, 0.35, 0.54, 0.595),
            0.92,
            1.00,
        ),
    ):
        count = 0

        for radius in radii:
            for j in range(48):
                a = math.tau * j / 48
                origin = Vector(
                    (
                        radius * math.cos(a),
                        radius * math.sin(a),
                        z - EPS,
                    )
                )
                hit, point, normal, index = obj.ray_cast(
                    origin,
                    Vector((0, 0, -1)),
                )

                assert (
                    hit
                    and floor_low - EPS <= point.z <= floor_high + EPS
                ), (
                    name,
                    tuple(origin),
                    hit,
                    tuple(point),
                )
                assert normal.z > 0.75

                face = obj.data.polygons[index]
                uv = obj.data.uv_layers.active.data[face.loop_start].uv
                assert slot_of(uv) == 3

                count += 1

        result[name] = count

    return result


def verify_model(obj, builder):
    mesh = obj.data

    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert 3000 <= len(mesh.polygons) <= 9000, len(mesh.polygons)

    counts = Counter()
    parts = Counter()

    for face in mesh.polygons:
        assert len(face.vertices) == 3
        assert face.area > 1e-10

        values = [
            tuple(mesh.uv_layers.active.data[i].uv)
            for i in face.loop_indices
        ]
        assert all(value == values[0] for value in values)

        counts[slot_of(values[0])] += 1

        part = builder.names[
            mesh.attributes["part_id"].data[face.index].value
        ]
        parts[part] += 1

    assert set(counts) == USED

    outlet_errors = [
        min(
            (mesh.vertices[i].co - point).length
            for i in builder.rim_vertices
        )
        for point in SPOUTS
    ]
    assert max(outlet_errors) < 0.06
    assert max(outlet_errors) < 1e-5

    return {
        "triangles": len(mesh.polygons),
        "triangles_by_slot": dict(sorted(counts.items())),
        "triangles_by_part": dict(sorted(parts.items())),
        "bounds_blender": assert_bounds(
            v.co for v in mesh.vertices
        ),
        "outlet_vertex_errors": outlet_errors,
        "minimum_stream_clearance": verify_clearances(
            mesh,
            builder.names,
        ),
        "shell_thickness": verify_shell(mesh, builder),
        "water_floor_rays": verify_water_floors(obj),
    }


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]
    assert "sparse" not in accessor
    assert accessor["count"] > 0

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

    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_glb(data, obj, expected_counts):
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
        assert offset + 8 + size <= len(data)

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += size + 8

    assert offset == len(data)

    doc = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    node, = doc["nodes"]
    mesh, = doc["meshes"]
    material, = doc["materials"]
    primitive, = mesh["primitives"]
    buffer, = doc["buffers"]

    assert "uri" not in buffer
    assert node["name"] == mesh["name"] == NAME
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert material["name"] == "palette"
    assert primitive["material"] == 0
    assert primitive.get("mode", 4) == 4

    attributes = primitive["attributes"]
    assert set(attributes) == {
        "POSITION",
        "NORMAL",
        "TEXCOORD_0",
    }

    positions = [
        Vector(p)
        for p in accessor_rows(
            doc,
            binary,
            attributes["POSITION"],
        )
    ]
    normals = accessor_rows(
        doc,
        binary,
        attributes["NORMAL"],
    )
    uvs = accessor_rows(
        doc,
        binary,
        attributes["TEXCOORD_0"],
    )

    assert len(positions) == len(normals) == len(uvs)
    assert all(
        abs(Vector(n).length - 1) < 1e-4
        for n in normals
    )
    assert {slot_of(uv) for uv in uvs} == USED

    assert_bounds(
        positions,
        (-1.3, 0, -1.3),
        (1.3, 2.4, 1.3),
    )

    expected = {
        tuple(
            round(c, 5)
            for c in (v.co.x, v.co.z, -v.co.y)
        )
        for v in obj.data.vertices
    }
    actual = {
        tuple(round(c, 5) for c in p)
        for p in positions
    }
    assert actual == expected

    indices = [
        r[0]
        for r in accessor_rows(
            doc,
            binary,
            primitive["indices"],
        )
    ]
    assert len(indices) == len(obj.data.polygons) * 3

    counts = Counter()
    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

        assert 0 <= min(a, b, c)
        assert max(a, b, c) < len(positions)
        assert (
            (positions[b] - positions[a])
            .cross(positions[c] - positions[a])
            .length > 2e-10
        )
        assert uvs[a] == uvs[b] == uvs[c]

        counts[slot_of(uvs[a])] += 1

    assert dict(counts) == expected_counts

    texture, = doc["textures"]
    image, = doc["images"]

    assert texture["source"] == 0
    assert (
        material["pbrMetallicRoughness"]
        ["baseColorTexture"]["index"] == 0
    )
    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = doc["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)
    assert png == PALETTE.read_bytes(), (
        "팔레트 PNG 바이트가 변경됨"
    )

    return {
        "bytes": len(data),
        "triangles": len(indices) // 3,
        "embedded_palette_unchanged": True,
        "export_yup_verified": True,
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
        export_extras=False,
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
    return path


def preview_mesh(
    scene,
    name,
    vertices,
    faces,
    material,
    uv_slot=None,
):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mesh.materials.append(material)

    if uv_slot is not None:
        uv = mesh.uv_layers.new(name="UVMap")
        for loop in uv.data:
            loop.uv = ((uv_slot + 0.5) / 32, 0.5)

    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def preview_disk(scene, name, radius, z, material):
    count = 96

    vertices = [(0, 0, z)] + [
        (
            radius * math.cos(math.tau * i / count),
            radius * math.sin(math.tau * i / count),
            z,
        )
        for i in range(count)
    ]
    faces = [
        (0, i + 1, (i + 1) % count + 1)
        for i in range(count)
    ]

    return preview_mesh(
        scene,
        name,
        vertices,
        faces,
        material,
        uv_slot=3,
    )


def preview_tube(
    scene,
    name,
    points,
    radius,
    material,
    slot,
):
    points = [Vector(p) for p in points]
    vertices = []
    faces = []
    sides = 8

    for i, point in enumerate(points):
        direction = (
            points[min(i + 1, len(points) - 1)]
            - points[max(0, i - 1)]
        ).normalized()

        reference = (
            Vector((0, 0, 1))
            if abs(direction.z) < 0.9
            else Vector((1, 0, 0))
        )
        side = direction.cross(reference).normalized()
        up = direction.cross(side).normalized()

        for j in range(sides):
            a = math.tau * j / sides
            vertices.append(
                point
                + radius * (
                    side * math.cos(a)
                    + up * math.sin(a)
                )
            )

        if i:
            for j in range(sides):
                first = (i - 1) * sides
                second = i * sides
                k = (j + 1) % sides

                faces.append(
                    (
                        first + j,
                        first + k,
                        second + k,
                        second + j,
                    )
                )

    faces.append(tuple(reversed(range(sides))))
    faces.append(
        tuple(range(len(vertices) - sides, len(vertices)))
    )

    return preview_mesh(
        scene,
        name,
        vertices,
        faces,
        material,
        uv_slot=slot,
    )


def srgb_to_linear(value):
    return (
        value / 12.92
        if value <= 0.04045
        else ((value + 0.055) / 1.055) ** 2.4
    )


def preview_material(name, rgb, alpha):
    material = bpy.data.materials.new(name)
    material.diffuse_color = tuple(
        srgb_to_linear(c)
        for c in rgb
    ) + (alpha,)
    material.roughness = 0.5
    return material


def make_render_scene(obj):
    scene = bpy.data.scenes.new(NAME + "-preview")
    scene.collection.objects.link(obj)

    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.filepath = str(OUTPUT / "fountain.png")

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.display.render_aa = "32"

    shading = scene.display.shading
    shading.color_type = "TEXTURE"
    shading.light = "STUDIO"
    shading.studio_light = "paint.sl"
    shading.background_type = "WORLD"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 0.85
    shading.curvature_valley_factor = 0.8
    shading.cavity_ridge_factor = 0.7
    shading.cavity_valley_factor = 0.9
    shading.show_specular_highlight = False
    shading.show_object_outline = False
    shading.show_xray = False

    scene.world = bpy.data.worlds.new(NAME + "-world")
    scene.world.color = tuple(
        srgb_to_linear(c)
        for c in (1.0, 0.953, 0.867)
    )

    # TEXTURE 모드도 이미지 없는 재질은 diffuse_color와 알파를 사용한다.
    # https://github.com/blender/blender/blob/main/source/blender/draw/engines/workbench/workbench_engine.cc
    water = preview_material(
        "preview-water",
        (0.498, 0.878, 0.894),
        0.58,
    )
    stream = preview_material(
        "preview-stream",
        (0.40, 0.82, 0.84),
        0.78,
    )
    foam = preview_material(
        "preview-foam",
        (0.96, 0.985, 0.95),
        1,
    )
    ground = preview_material(
        "preview-ground",
        (1.0, 0.953, 0.867),
        1,
    )

    preview_mesh(
        scene,
        "preview-ground",
        [
            (-200, -200, -0.012),
            (200, -200, -0.012),
            (200, 200, -0.012),
            (-200, 200, -0.012),
        ],
        [(0, 1, 2, 3)],
        ground,
    )
    preview_disk(
        scene,
        "preview-pool",
        1.0,
        0.35,
        water,
    )
    preview_disk(
        scene,
        "preview-bowl",
        0.6,
        1.02,
        water,
    )

    for i in range(3):
        preview_tube(
            scene,
            "preview-stream-" + str(i),
            [
                stream_point(i, j / 40)
                for j in range(41)
            ],
            0.047,
            stream,
            3,
        )

        direction = OUTWARD[i]
        preview_tube(
            scene,
            "preview-channel-" + str(i),
            [
                direction * 0.59 + Vector((0, 0, 1.022)),
                direction * 0.69 + Vector((0, 0, 1.025)),
                SPOUTS[i],
            ],
            0.025,
            stream,
            3,
        )

        impact = stream_point(i, 1)

        for radius, start, end in (
            (0.075, 0.0, 5.5),
            (0.13, 0.6, 2.7),
        ):
            points = [
                impact + Vector(
                    (
                        radius * math.cos(
                            start + (end - start) * j / 24
                        ),
                        radius * math.sin(
                            start + (end - start) * j / 24
                        ),
                        0.009,
                    )
                )
                for j in range(25)
            ]

            preview_tube(
                scene,
                "preview-impact",
                points,
                0.008,
                foam,
                23,
            )

    for radius, start, end in (
        (0.25, 0.1, 5.3),
        (0.45, 0.3, 2.2),
    ):
        points = [
            (
                radius * math.cos(
                    start + (end - start) * j / 32
                ),
                radius * math.sin(
                    start + (end - start) * j / 32
                ),
                1.027,
            )
            for j in range(33)
        ]

        preview_tube(
            scene,
            "preview-bowl-ripple",
            points,
            0.006,
            foam,
            23,
        )

    camera = bpy.data.objects.new(
        "preview-camera",
        bpy.data.cameras.new("preview-camera"),
    )
    scene.collection.objects.link(camera)

    target = Vector((0, 0, 1.04))
    azimuth = math.radians(12)
    elevation = math.radians(30)

    direction = Vector(
        (
            -math.sin(azimuth) * math.cos(elevation),
            -math.cos(azimuth) * math.cos(elevation),
            math.sin(elevation),
        )
    )

    camera.location = target + direction * 8
    camera.rotation_euler = (
        (-direction)
        .to_track_quat("-Z", "Y")
        .to_euler()
    )
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.9
    camera.data.clip_start = 0.01
    camera.data.clip_end = 1000

    scene.camera = camera
    return scene


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    material = load_palette()

    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1

    obj, builder = build_fountain(material)
    metadata = verify_model(obj, builder)

    metadata.update(
        {
            "file": str(OUTPUT / (NAME + ".glb")),
            "coordinate_system": (
                "Blender X right, Y back, Z up; front -Y"
            ),
            "glb_transform": "(x,y,z) -> (x,z,-y)",
            "palette_file": str(PALETTE),
            "palette_slots": SLOTS,
            "palette_center_rgb": RGB,
            "water_geometry_exported": False,
            "basin_water": {
                "center": [0, 0, 0.35],
                "radius": 1.0,
            },
            "bowl_water": {
                "center": [0, 0, 1.02],
                "radius": 0.6,
            },
            "spouts": [list(p) for p in SPOUTS],
            "streams": [
                {
                    "start": list(SPOUTS[i]),
                    "control": list(
                        SPOUTS[i] + OUTWARD[i] * 0.12
                    ),
                    "end": list(stream_point(i, 1)),
                    "clearance_radius": 0.08,
                }
                for i in range(3)
            ],
            "clearance_domain": (
                "각 출구 평면 바깥의 베지어 곡선 주위 반지름 0.08"
            ),
        }
    )

    OUTPUT.mkdir(parents=True, exist_ok=True)

    path = export_glb(obj)
    metadata["glb"] = verify_glb(
        path.read_bytes(),
        obj,
        metadata["triangles_by_slot"],
    )

    if not args.skip_render:
        preview = make_render_scene(obj)

        assert bpy.ops.render.render(
            write_still=True,
            scene=preview.name,
        ) == {"FINISHED"}

        png = (OUTPUT / "fountain.png").read_bytes()
        assert png[:8] == b"\x89PNG\r\n\x1a\n"
        assert struct.unpack_from(">II", png, 16) == (
            1000,
            1200,
        )

        metadata["preview"] = {
            "file": str(OUTPUT / "fountain.png"),
            "engine": "BLENDER_WORKBENCH",
            "color_type": "TEXTURE",
            "elevation_degrees": 30,
            "azimuth_left_degrees": 12,
            "water_alpha": 0.58,
        }

    (OUTPUT / (NAME + ".json")).write_text(
        json.dumps(
            metadata,
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    print(json.dumps(metadata, ensure_ascii=False))


if __name__ == "__main__":
    main()
