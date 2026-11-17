"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/tropicalTrees.py

Blender 5.3 메모리 형상 검사 통과: 삼각형 4452 / 6774 / 5962.
이 검토에서는 파일 내보내기·렌더·게임 화면을 실행 검증하지 않았다.
"""

import json
import math
import struct
import sys
import tempfile
import zlib
from collections import Counter
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "env"
EPSILON = 1e-5

SLOTS = {
    "bud": 0,
    "sand": 1,
    "yellow": 8,
    "leaf": 9,
    "bark": 11,
    "lime": 12,
    "khaki": 13,
    "wood": 14,
    "mango": 18,
    "white": 23,
}

EXPECTED = {
    0: "#7C7691",
    1: "#EBD1A3",
    8: "#E4A90C",
    9: "#91AD78",
    11: "#988165",
    12: "#ABAE2B",
    13: "#A49876",
    14: "#B36D45",
    18: "#F8A658",
    23: "#FFF2E8",
}


def bounds(points):
    points = list(points)
    assert points
    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


def check_uv(value):
    u, v = value
    slot = round(u * 32 - .5)
    assert slot in SLOTS.values(), (slot, value)
    assert abs(u - (slot + .5) / 32) < 1e-7
    assert abs(v - .5) < 1e-7


def initialize():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3 is required")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("Start Blender with --disable-autoexec")

    if not PALETTE.is_file():
        raise FileNotFoundError(PALETTE)

    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    old = bpy.data.materials.get("palette")
    if old:
        bpy.data.materials.remove(old, do_unlink=True)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    image.colorspace_settings.name = "sRGB"
    assert tuple(image.size) == (128, 4)

    pixels = list(image.pixels)

    # 경계 픽셀은 혼색되어 있으므로 각 칸 중앙만 검사한다.
    for slot, expected in EXPECTED.items():
        rgb = tuple(
            round(pixels[4 * (2 * 128 + slot * 4 + 2) + c] * 255)
            for c in range(3)
        )
        actual = "#" + "".join(f"{c:02X}" for c in rgb)
        assert actual == expected, (slot, actual, expected)

    image.pack()

    material = bpy.data.materials.new("palette")
    material.use_nodes = True
    material.use_backface_culling = False

    nodes = material.node_tree.nodes
    nodes.clear()

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    nodes.active = texture

    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 1
    shader.inputs["Metallic"].default_value = 0

    output = nodes.new("ShaderNodeOutputMaterial")
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
    def __init__(self, name):
        self.name = name
        self.vertices = []
        self.faces = []
        self.slots = []
        self.blades = []
        self.parts = 0

    def ring(self, points):
        first = len(self.vertices)
        self.vertices.extend(Vector(p) for p in points)
        return list(range(first, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)
        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)
        assert slot in SLOTS.values()

        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, a, b, slot):
        assert len(a) == len(b)

        for j in range(len(a)):
            k = (j + 1) % len(a)
            color = slot[j] if isinstance(slot, (tuple, list)) else slot
            self.face((a[j], a[k], b[k], b[j]), color)

    def tube(self, points, radii, slot, sides=8):
        points = [Vector(p) for p in points]
        assert len(points) == len(radii) >= 2

        rings = []

        for i, (point, radius) in enumerate(zip(points, radii, strict=True)):
            tangent = (
                points[min(i + 1, len(points) - 1)]
                - points[max(0, i - 1)]
            ).normalized()

            if abs(point.z) < 1e-9:
                a = Vector((1, 0, 0))
                b = Vector((0, 1, 0))
            else:
                reference = (
                    Vector((0, 1, 0))
                    if abs(tangent.y) < .9
                    else Vector((1, 0, 0))
                )
                a = reference.cross(tangent).normalized()
                b = tangent.cross(a).normalized()

            rings.append(self.ring([
                point + radius * (
                    a * math.cos(j * math.tau / sides)
                    + b * math.sin(j * math.tau / sides)
                )
                for j in range(sides)
            ]))

        cap = slot[0] if isinstance(slot, (tuple, list)) else slot
        self.face(reversed(rings[0]), cap)

        for a, b in zip(rings, rings[1:]):
            self.bridge(a, b, slot)

        self.face(rings[-1], cap)
        self.parts += 1

    def plate(
        self,
        grid,
        body,
        holes=(),
        thickness=.04,
        kind="leaf",
        clefts=0,
        fenestrations=0,
    ):
        rows, cols = len(grid), len(grid[0])
        grid = [[Vector(p) for p in row] for row in grid]
        assert all(len(row) == cols for row in grid)

        pairs = []
        top, bottom = [], []

        for r in range(rows):
            tr, br = [], []

            for c in range(cols):
                across = (
                    grid[r][min(c + 1, cols - 1)]
                    - grid[r][max(0, c - 1)]
                )
                along = (
                    grid[min(r + 1, rows - 1)][c]
                    - grid[max(0, r - 1)][c]
                )
                normal = across.cross(along)
                assert normal.length > 1e-9
                normal.normalize()

                p = grid[r][c]
                a, b = self.ring((
                    p + normal * thickness / 2,
                    p - normal * thickness / 2,
                ))
                tr.append(a)
                br.append(b)
                pairs.append((a, b))

            top.append(tr)
            bottom.append(br)

        boundaries = Counter()
        oriented = {}

        for r in range(rows - 1):
            for c in range(cols - 1):
                if (r, c) in holes:
                    continue

                coordinates = (
                    (r, c),
                    (r, c + 1),
                    (r + 1, c + 1),
                    (r + 1, c),
                )
                a = [top[y][x] for y, x in coordinates]
                b = [bottom[y][x] for y, x in coordinates]

                is_rib = (
                    (cols == 4 and c == 1)
                    or (cols == 5 and c in (1, 2))
                    or (cols == 7 and c in (2, 3))
                )
                color = (
                    (SLOTS["leaf"] if is_rib else SLOTS["lime"])
                    if kind == "leaf" else body
                )

                self.face(a, color)
                self.face(
                    reversed(b),
                    SLOTS["leaf"] if kind == "leaf" else body,
                )

                for i in range(4):
                    j = (i + 1) % 4
                    key = tuple(sorted((a[i], a[j])))
                    boundaries[key] += 1
                    oriented[key] = (a[i], a[j], b[j], b[i])

        # 내부 구멍의 벽도 닫아 잎 전체를 하나의 폐곡면으로 만든다.
        for edge, count in boundaries.items():
            assert count in (1, 2)
            if count == 1:
                self.face(oriented[edge], body)

        self.blades.append({
            "pairs": pairs,
            "thickness": thickness,
            "kind": kind,
            "clefts": clefts,
            "fenestrations": fenestrations,
        })
        self.parts += 1

    def petal(self, center, radial, normal, length, width):
        center = Vector(center)
        radial = Vector(radial)
        normal = Vector(normal)
        side = normal.cross(radial).normalized()

        outline = [
            (0, -.025),
            (.32, -.75),
            (.78, -.92),
            (1, -.15),
            (.82, .85),
            (.28, .55),
        ]

        mid = [
            center
            + radial * (t * length)
            + side * (s * width)
            + normal * (.028 * math.sin(math.pi * t))
            for t, s in outline
        ]

        top = self.ring([p + normal * .012 for p in mid])
        bottom = self.ring([p - normal * .012 for p in mid])

        middle = center + radial * (length * .47) + normal * .03
        a, b = self.ring((
            middle + normal * .012,
            middle - normal * .012,
        ))

        for i in range(6):
            j = (i + 1) % 6
            color = SLOTS["yellow"] if i == 5 else SLOTS["white"]
            self.face((a, top[i], top[j]), color)
            self.face((b, bottom[j], bottom[i]), SLOTS["white"])

        self.bridge(top, bottom, SLOTS["white"])
        self.parts += 1

    def fit(self, width, height):
        lo, hi = bounds(self.vertices)
        scale_xy = width / max(hi.x - lo.x, hi.y - lo.y)
        scale_z = height / hi.z
        scale = Vector((scale_xy, scale_xy, scale_z))

        self.vertices = [
            Vector((
                p.x * scale.x,
                p.y * scale.y,
                p.z * scale.z,
            ))
            for p in self.vertices
        ]

        # 치수 조정 후에도 잎의 법선 방향 두께는 0.04로 유지한다.
        for blade in self.blades:
            for a, b in blade["pairs"]:
                midpoint = (self.vertices[a] + self.vertices[b]) / 2
                delta = self.vertices[a] - self.vertices[b]
                normal = Vector((
                    delta.x / scale.x**2,
                    delta.y / scale.y**2,
                    delta.z / scale.z**2,
                )).normalized()

                half = normal * (blade["thickness"] / 2)
                self.vertices[a] = midpoint + half
                self.vertices[b] = midpoint - half

        return scale

    def finish(self, material, expected_leaves):
        leaves = [
            blade for blade in self.blades
            if blade["kind"] == "leaf"
        ]
        assert len(leaves) == expected_leaves

        for blade in leaves:
            for a, b in blade["pairs"]:
                thickness = (self.vertices[a] - self.vertices[b]).length
                assert .03 <= thickness <= .05

        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        assert not mesh.validate(verbose=False)

        mesh.materials.append(material)
        uv = mesh.uv_layers.new(name="UVMap")

        for face, slot in zip(mesh.polygons, self.slots, strict=True):
            face.use_smooth = False
            for loop in face.loop_indices:
                uv.data[loop].uv = ((slot + .5) / 32, .5)

        bm = bmesh.new()
        components, genera = 0, []

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
            assert all(v.is_manifold for v in bm.verts)
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

                vertices = {
                    vertex
                    for face in component
                    for vertex in face.verts
                }
                edges = {
                    edge
                    for face in component
                    for edge in face.edges
                }
                chi = len(vertices) - len(edges) + len(component)
                assert (2 - chi) % 2 == 0

                genera.append((2 - chi) // 2)
                components += 1

            assert components == self.parts, (components, self.parts)
            assert sum(genera) == sum(
                leaf["fenestrations"] for leaf in leaves
            )

            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert 2000 <= len(mesh.loop_triangles) <= 7000, (
            self.name, len(mesh.loop_triangles)
        )
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"
        assert not mesh.color_attributes

        for face in mesh.polygons:
            face.use_smooth = False
            values = [
                tuple(mesh.uv_layers.active.data[i].uv)
                for i in face.loop_indices
            ]
            for value in values:
                check_uv(value)
            assert all(value == values[0] for value in values)

        lo, hi = bounds(v.co for v in mesh.vertices)
        assert lo.z >= -EPSILON
        assert abs(lo.z) < EPSILON

        base = [
            vertex.co for vertex in mesh.vertices
            if abs(vertex.co.z) < EPSILON
        ]
        base_center = sum(base, Vector()) / len(base)
        assert base_center.length < EPSILON, tuple(base_center)

        radius = max(math.hypot(v.x, v.y) for v in base)
        assert all(
            abs(math.hypot(v.x, v.y) - radius) < EPSILON
            for v in base
        )

        leaf_points = [
            self.vertices[i]
            for leaf in leaves
            for pair in leaf["pairs"]
            for i in pair
        ]

        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)

        return obj, {
            "name": self.name,
            "bounds_blender": {
                "min": list(lo),
                "max": list(hi),
            },
            "dimensions_blender": list(hi - lo),
            "height": hi.z,
            "triangles": len(mesh.loop_triangles),
            "trunk_base": [0, 0, 0],
            "trunk_base_radius": radius,
            "crown_start_height": min(p.z for p in leaf_points),
            "front_blender": [0, -1, 0],
            "up_blender": [0, 0, 1],
            "leaf_count": len(leaves),
            "leaf_thickness": .04,
            "clefts_per_leaf": [leaf["clefts"] for leaf in leaves],
            "holes_per_leaf": [leaf["fenestrations"] for leaf in leaves],
            "closed_components": components,
        }


def banana(material):
    b = Builder("bananaTree")
    crown = Vector((.20, .045, 3.25))

    def trunk_center(z):
        t = z / crown.z
        return Vector((crown.x * t * t, crown.y * t * t, z))

    def trunk_radius(z):
        return .30 - .10 * z / crown.z

    profiles = [(0, .30, 0, SLOTS["lime"])]

    for tier in range(1, 7):
        z = tier * .50
        for dz, flare, wave, slot in (
            (-.075, 0, .008, SLOTS["lime"]),
            (-.025, .024, .014, SLOTS["leaf"]),
            (0, .020, .014, SLOTS["lime"]),
            (.045, 0, .008, SLOTS["lime"]),
        ):
            height = z + dz
            profiles.append((
                height,
                trunk_radius(height) + flare,
                wave,
                slot,
            ))

    profiles.append((crown.z, .20, 0, SLOTS["lime"]))

    rings = []

    for z, radius, wave, slot in profiles:
        rings.append(b.ring([
            trunk_center(z)
            + Vector((
                radius * math.cos(j * math.tau / 10),
                radius * math.sin(j * math.tau / 10),
                wave * math.cos(3 * j * math.tau / 10 + z * 2.1),
            ))
            for j in range(10)
        ]))

    b.face(reversed(rings[0]), SLOTS["lime"])

    for i in range(1, len(rings)):
        b.bridge(rings[i - 1], rings[i], profiles[i][3])

    b.face(rings[-1], SLOTS["lime"])
    b.parts += 1

    for j in range(3):
        angle = j * math.tau / 3 + .35
        radial = Vector((math.cos(angle), math.sin(angle), 0))
        across = Vector((-math.sin(angle), math.cos(angle), 0))
        grid = []

        for z, radius, half in (
            (.035, .29, .085),
            (.19, .37, .15),
            (.43, .33, .115),
            (.68, .265, .012),
        ):
            center = trunk_center(z) + radial * radius
            grid.append([
                center
                + across * (fraction * half)
                + radial * (.025 * (1 - abs(fraction)))
                for fraction in (-1, 0, 1)
            ])

        b.plate(
            grid,
            SLOTS["wood"],
            thickness=.025,
            kind="sheath",
        )

    ts = (
        0, .10, 1 / 6, .29, .31, 1 / 3, .46, .48, .50,
        .62, .64, 2 / 3, .79, .81, 5 / 6, .93, 1,
    )

    for j, (length, width, rise, fall) in enumerate((
        (3.30, 1.26, 76, 48),
        (3.20, 1.20, 72, 50),
        (3.40, 1.30, 80, 44),
        (3.25, 1.22, 74, 52),
        (3.35, 1.28, 78, 46),
        (3.10, 1.16, 70, 50),
        (3.30, 1.24, 77, 49),
    )):
        angle = j * math.tau / 7 + .12
        radial = Vector((math.cos(angle), math.sin(angle), 0))
        across = Vector((math.sin(angle), -math.cos(angle), 0))
        start_angle = math.radians(rise)
        turn = math.radians(rise + fall)
        radius = length / turn
        root = crown + Vector((0, 0, .06 * math.sin(j * 2.1)))
        grid = []

        for r, t in enumerate(ts):
            pitch = start_angle - turn * t
            center = (
                root
                + radial * (
                    radius * (
                        math.sin(start_angle) - math.sin(pitch)
                    )
                )
                + Vector((
                    0,
                    0,
                    radius * (
                        math.cos(pitch) - math.cos(start_angle)
                    ),
                ))
            )
            tangent = (
                radial * math.cos(pitch)
                + Vector((0, 0, math.sin(pitch)))
            )
            normal = across.cross(tangent).normalized()
            envelope = max(.025, math.sin(math.pi * t)**.52)
            left = .70 if r in (4, 10) else 1
            right = .72 if r in (7, 13) else 1
            row = []

            for fraction in (-1, -.025, 0, .025, 1):
                edge = left if fraction < 0 else right
                side = fraction * (
                    edge if abs(fraction) == 1 else 1
                )
                row.append(
                    center
                    + across * (side * width * .5 * envelope)
                    + normal * (
                        .075 * abs(fraction)
                        * math.sin(math.pi * t)
                    )
                )

            grid.append(row)

        b.plate(grid, SLOTS["leaf"], clefts=4)

    bunch = Vector((1.18, -.78, 2.82))

    b.tube(
        [
            crown,
            (.53, -.21, 3.53),
            (.96, -.58, 3.46),
            (1.17, -.77, 3.13),
            bunch,
            (1.18, -.78, 2.14),
        ],
        [.065, .061, .054, .046, .039, .027],
        SLOTS["leaf"],
        sides=7,
    )

    for tier in range(5):
        for j in range(6):
            angle = j * math.tau / 6 + .22 * tier
            direction = Vector((
                math.cos(angle),
                math.sin(angle),
                0,
            ))
            center = bunch - Vector((0, 0, tier * .11))

            b.tube(
                [
                    center
                    + direction * radius
                    + Vector((0, 0, z))
                    for radius, z in (
                        (.07, .075),
                        (.23, .035),
                        (.33, -.095),
                        (.30, -.15),
                    )
                ],
                [.045, .09, .085, .03],
                SLOTS["lime"] if j % 3 != 0 else SLOTS["leaf"],
                sides=6,
            )

    b.tube(
        [
            (1.18, -.78, 2.14),
            (1.18, -.78, 2.06),
            (1.18, -.78, 1.94),
            (1.18, -.78, 1.79),
        ],
        [.027, .12, .15, .012],
        SLOTS["bud"],
        sides=7,
    )

    obj, metadata = b.finish(material, 7)

    assert 4.2 <= metadata["height"] <= 5.2
    assert min(metadata["dimensions_blender"][:2]) >= 5.0
    assert abs(metadata["trunk_base_radius"] - .30) < EPSILON

    metadata.update({
        "banana_bunches": 1,
        "banana_fingers": 30,
        "flower_buds": 1,
    })

    return obj, metadata


def monstera(material):
    b = Builder("monsteraClump")

    b.tube(
        [(0, 0, 0), (0, 0, .15), (0, .02, .36)],
        [.23, .22, .13],
        SLOTS["bark"],
        sides=8,
    )

    leaves = [
        (0, .36, 1.32, 14, 1.90, 1.65, .44),
        (60, .32, 1.43, 18, 1.80, 1.60, .44),
        (120, .38, 1.35, 12, 1.95, 1.68, .43),
        (180, .34, 1.34, 16, 1.85, 1.62, .44),
        (240, .36, 1.45, 20, 1.80, 1.58, .46),
        (300, .32, 1.36, 15, 1.90, 1.65, .43),
        (30, .20, 1.70, 40, 1.85, 1.65, .22),
        (102, .18, 1.80, 44, 1.70, 1.60, .24),
        (174, .24, 1.75, 36, 1.90, 1.68, .20),
        (246, .20, 1.72, 42, 1.80, 1.62, .22),
        (318, .18, 1.86, 46, 1.65, 1.55, .24),
        (15, .08, 2.64, 58, 1.60, 1.55, .16),
        (105, .06, 2.75, 64, 1.35, 1.45, .15),
        (195, .10, 2.68, 55, 1.50, 1.52, .15),
        (285, .04, 2.78, 66, 1.25, 1.38, .14),
    ]

    ts = (
        0, .10, .20, .27, .31, .39, .46, .50,
        .58, .65, .69, .78, .86, .94, 1,
    )
    widths = (
        .62, .88, 1, 1, .99, .97, .94, .90,
        .84, .77, .72, .61, .47, .28, .025,
    )

    for i, (
        yaw, radius, height, elevation, length, width, droop,
    ) in enumerate(leaves):
        yaw, elevation = map(math.radians, (yaw, elevation))

        horizontal = Vector((
            math.cos(yaw),
            math.sin(yaw),
            0,
        ))
        across = Vector((
            math.sin(yaw),
            -math.cos(yaw),
            0,
        ))
        root = horizontal * radius + Vector((0, 0, height))
        growth = (
            horizontal * math.cos(elevation)
            + Vector((0, 0, math.sin(elevation)))
        )
        end = root + growth * (length * .045)

        angle = i * math.tau / len(leaves)
        start = Vector((
            .11 * math.cos(angle),
            .11 * math.sin(angle),
            .12,
        ))

        b.tube(
            [
                start,
                start.lerp(end, .50) - horizontal * .04,
                end,
            ],
            [.060, .043, .026],
            SLOTS["leaf"],
            sides=5,
        )

        grid = []

        for r, (t, envelope) in enumerate(zip(ts, widths, strict=True)):
            left = .20 if r in (3, 7, 10) else 1
            right = .22 if r in (4, 8, 11) else 1
            shoulder_left = min(.60, left * .65)
            shoulder_right = min(.60, right * .65)

            fractions = (
                -left, -shoulder_left, -.025,
                0,
                .025, shoulder_right, right,
            )
            tangent = (
                horizontal * (length * math.cos(elevation))
                + Vector((
                    0,
                    0,
                    length * (
                        math.sin(elevation) - 2 * droop * t
                    ),
                ))
            )
            normal = across.cross(tangent).normalized()
            row = []

            for fraction in fractions:
                basal_notch = (
                    .05 * (1 - abs(fraction))
                    if r == 0 else 0
                )
                along = t + basal_notch
                center = (
                    root
                    + horizontal * (
                        length * math.cos(elevation) * along
                    )
                    + Vector((
                        0,
                        0,
                        length * (
                            math.sin(elevation) * along
                            - droop * along * along
                        ),
                    ))
                )

                row.append(
                    center
                    + across * (
                        fraction * width * .5 * envelope
                    )
                    + normal * (
                        .10 * (1 - abs(fraction))
                        * math.sin(math.pi * t)
                        + .018 * abs(fraction)
                    )
                )

            grid.append(row)

        holes = (
            {(5, 1)}
            if i % 3 == 0
            else {(5, 1), (9, 4)}
        )

        b.plate(
            grid,
            SLOTS["leaf"],
            holes=holes,
            clefts=6,
            fenestrations=len(holes),
        )

    b.fit(4.5, 3.85)
    obj, metadata = b.finish(material, len(leaves))

    assert 3.6 <= metadata["height"] <= 4.0
    assert abs(
        max(metadata["dimensions_blender"][:2]) - 4.5
    ) < .02

    metadata["basal_stems"] = len(leaves)

    return obj, metadata


def plumeria(material):
    b = Builder("plumeriaTree")
    bark = [11, 11, 13, 11, 11, 13, 11]

    b.tube(
        [
            (0, 0, 0),
            (.025, .01, .70),
            (.04, .02, 1.45),
            (.06, .025, 2.05),
            (.08, .03, 2.40),
        ],
        [.30, .275, .245, .218, .20],
        SLOTS["bark"],
        sides=8,
    )

    primary = [
        (
            (-.02, .02, 2.32),
            (-.36, .02, 2.70),
            (-.66, .02, 3.15),
        ),
        (
            (.09, .03, 2.34),
            (.44, .05, 2.70),
            (.78, .04, 3.15),
        ),
        (
            (.07, .05, 2.39),
            (.02, .17, 3.02),
            (.18, .25, 3.83),
        ),
    ]

    for points in primary:
        b.tube(points, [.18, .15, .12], bark, sides=7)

    rosettes = [
        ((-1.25, 0, 4.12), 1.16, .10, 7, True),
        ((.50, .28, 5.0), 1.20, .42, 7, True),
        ((1.43, -.02, 3.95), 1.14, -.18, 7, True),
        ((-1.49, .30, 3.40), 1.04, .25, 4, False),
        ((1.68, .36, 3.45), 1.02, -.10, 4, False),
        ((-.45, .57, 4.45), 1.06, .42, 4, False),
    ]

    for parent_index, rosette_index in (
        (0, 0), (0, 3),
        (1, 2), (1, 4),
        (2, 1), (2, 5),
    ):
        start = Vector(primary[parent_index][-1])
        end = Vector(rosettes[rosette_index][0])
        middle = (
            start.lerp(end, .53)
            + Vector((0, .015, -.05))
        )

        b.tube(
            [start, middle, end],
            [.12, .095, .065],
            bark,
            sides=7,
        )

    flower_total = 0

    for k, (
        root, length, phase, leaf_count, has_flowers,
    ) in enumerate(rosettes):
        root = Vector(root)

        b.tube(
            [
                root - Vector((0, 0, .10)),
                root + Vector((0, 0, .16)),
            ],
            [.07, .035],
            SLOTS["leaf"],
            sides=6,
        )

        normal = Vector((0, -.55, .84)).normalized()
        right = Vector((1, 0, 0))
        up = normal.cross(right).normalized()

        samples = (
            (
                (0, .08),
                (.22, .78),
                (.50, 1),
                (.78, .72),
                (1, .025),
            )
            if has_flowers else
            (
                (0, .08),
                (.35, 1),
                (.72, .84),
                (1, .025),
            )
        )

        for j in range(leaf_count):
            angle = j * math.tau / leaf_count + phase
            along = (
                right * math.cos(angle)
                + up * math.sin(angle)
            )
            across = along.cross(normal).normalized()
            grid = []

            for t, envelope in samples:
                center = (
                    root
                    + along * (length * t)
                    + Vector((
                        0,
                        0,
                        .20 * math.sin(math.pi * t) - .10 * t,
                    ))
                )

                grid.append([
                    center
                    + across * (fraction * .31 * envelope)
                    + normal * (
                        .035 * (1 - abs(fraction))
                        * math.sin(math.pi * t)
                    )
                    for fraction in (-1, -.025, .025, 1)
                ])

            b.plate(grid, SLOTS["leaf"])

        if not has_flowers:
            continue

        normal = Vector((0, -.16, .987)).normalized()
        up = normal.cross(right).normalized()

        for f in range(7):
            angle = (f - 1) * math.tau / 6 + .3 * k
            offset = (
                Vector()
                if f == 0 else
                right * (.34 * math.cos(angle))
                + up * (.34 * math.sin(angle))
            )
            center = (
                root
                + Vector((0, 0, .48))
                + normal * .06
                + offset
                + normal * (.035 if f == 0 else 0)
            )

            b.tube(
                [root, center - normal * .035],
                [.022, .014],
                SLOTS["leaf"],
                sides=4,
            )

            for p in range(5):
                petal_angle = (
                    p * math.tau / 5 + .13 * k + .08 * f
                )
                radial = (
                    right * math.cos(petal_angle)
                    + up * math.sin(petal_angle)
                )

                b.petal(
                    center + normal * (.003 * p),
                    radial,
                    normal,
                    .235,
                    .105,
                )

            b.tube(
                [
                    center + normal * .014,
                    center + normal * .055,
                ],
                [.073, .065],
                SLOTS["yellow"],
                sides=5,
            )
            flower_total += 1

    obj, metadata = b.finish(material, 33)

    assert 5.5 <= metadata["height"] <= 6.0
    assert abs(metadata["trunk_base_radius"] - .30) < EPSILON

    metadata.update({
        "leaf_rosettes": 6,
        "flower_clusters": 3,
        "flowers": flower_total,
        "petals_per_flower": 5,
    })

    return obj, metadata


def png_read(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    offset, chunks = 8, []

    while offset < len(data):
        size, kind = struct.unpack_from(">I4s", data, offset)
        assert offset + size + 12 <= len(data)

        payload = data[offset + 8:offset + 8 + size]
        crc = struct.unpack_from(">I", data, offset + 8 + size)[0]

        assert zlib.crc32(kind + payload) & 0xffffffff == crc

        chunks.append((kind, payload))
        offset += size + 12

        if kind == b"IEND":
            break

    assert offset == len(data)
    assert chunks[-1][0] == b"IEND"

    header, = [
        payload for kind, payload in chunks
        if kind == b"IHDR"
    ]
    (
        width, height, depth, color,
        compression, filtering, interlace,
    ) = struct.unpack(">IIBBBBB", header)

    assert depth == 8 and color in (2, 6)
    assert (compression, filtering, interlace) == (0, 0, 0)

    channels = 3 if color == 2 else 4
    stride = width * channels

    raw = zlib.decompress(b"".join(
        payload for kind, payload in chunks
        if kind == b"IDAT"
    ))
    assert len(raw) == height * (stride + 1)

    previous = bytearray(stride)
    rows = []

    for y in range(height):
        start = y * (stride + 1)
        filter_type = raw[start]
        row = bytearray(raw[start + 1:start + 1 + stride])

        assert 0 <= filter_type <= 4

        for x in range(stride):
            a = row[x - channels] if x >= channels else 0
            b = previous[x]
            c = previous[x - channels] if x >= channels else 0

            if filter_type == 0:
                prediction = 0
            elif filter_type == 1:
                prediction = a
            elif filter_type == 2:
                prediction = b
            elif filter_type == 3:
                prediction = (a + b) // 2
            else:
                estimate = a + b - c
                errors = (
                    abs(estimate - a),
                    abs(estimate - b),
                    abs(estimate - c),
                )
                prediction = (a, b, c)[errors.index(min(errors))]

            row[x] = (row[x] + prediction) & 255

        rows.append(bytes(row))
        previous = row

    return width, height, channels, rows, chunks


def verify_palette_png(data):
    width, height, channels, rows, _ = png_read(data)
    assert (width, height) == (128, 4)

    for slot, expected in EXPECTED.items():
        x = slot * 4 + 2
        y = height - 1 - 2
        rgb = rows[y][x * channels:x * channels + 3]
        actual = "#" + rgb.hex().upper()

        assert actual == expected, (slot, actual, expected)


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]

    assert "sparse" not in accessor
    assert not accessor.get("normalized", False)

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
    count = accessor["count"]

    assert count > 0 and stride >= size
    assert (
        start + (count - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
        <= len(binary)
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(count)
    ]


def verify_glb(path, obj, metadata):
    data = path.read_bytes()

    assert struct.unpack_from("<4sII", data) == (
        b"glTF", 2, len(data)
    )

    offset, chunks = 12, {}

    while offset < len(data):
        size, kind = struct.unpack_from("<I4s", data, offset)

        assert size % 4 == 0
        assert kind not in chunks
        assert offset + 8 + size <= len(data)

        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)

    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    buffer, = document["buffers"]
    assert "uri" not in buffer
    assert buffer["byteLength"] <= len(binary)

    mesh, = document["meshes"]
    node, = document["nodes"]
    material, = document["materials"]

    assert mesh["name"] == node["name"] == obj.name
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
    assert not any(key.startswith("COLOR_") for key in attributes)

    points = [
        Vector(point)
        for point in accessor_rows(
            document, binary, attributes["POSITION"]
        )
    ]
    normals = accessor_rows(
        document, binary, attributes["NORMAL"]
    )
    uvs = accessor_rows(
        document, binary, attributes["TEXCOORD_0"]
    )

    assert len(points) == len(normals) == len(uvs)
    assert all(
        all(math.isfinite(value) for value in point)
        for point in points
    )
    assert all(
        abs(Vector(normal).length - 1) < 1e-4
        for normal in normals
    )

    for value in uvs:
        check_uv(value)

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"]
        )
    ]
    assert len(indices) % 3 == 0

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a]).cross(
                points[c] - points[a]
            ).length > 2e-10
        )
        assert uvs[a] == uvs[b] == uvs[c]

    assert len(indices) // 3 == metadata["triangles"]
    assert 2000 <= len(indices) // 3 <= 7000

    lower, upper = bounds(points)
    original_lower = Vector(metadata["bounds_blender"]["min"])
    original_upper = Vector(metadata["bounds_blender"]["max"])

    assert (
        lower - Vector((
            original_lower.x,
            original_lower.z,
            -original_upper.y,
        ))
    ).length < EPSILON

    assert (
        upper - Vector((
            original_upper.x,
            original_upper.z,
            -original_lower.y,
        ))
    ).length < EPSILON

    assert abs(lower.y) < EPSILON
    assert lower.y >= -EPSILON

    base = {
        tuple(point)
        for point in points
        if abs(point.y) < EPSILON
    }
    source_base = {
        (vertex.co.x, vertex.co.z, -vertex.co.y)
        for vertex in obj.data.vertices
        if abs(vertex.co.z) < EPSILON
    }

    assert base == source_base

    center = sum(
        (Vector(point) for point in base),
        Vector(),
    ) / len(base)

    assert center.length < EPSILON
    assert all(
        abs(
            Vector(point).length
            - metadata["trunk_base_radius"]
        ) < EPSILON
        for point in base
    )

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
    verify_palette_png(
        binary[start:start + view["byteLength"]]
    )

    return {
        **metadata,
        "file": str(path),
        "bounds_glb": {
            "min": list(lower),
            "max": list(upper),
        },
        "dimensions_glb": list(upper - lower),
        "up_glb": [0, 1, 0],
        "front_glb": [0, 0, 1],
        "export_yup": True,
        "inspection": {
            "single_mesh": True,
            "single_primitive": True,
            "palette_center_uv": True,
            "embedded_palette_png": True,
            "closed_geometry": True,
            "ground_origin": True,
        },
    }


def export_glb(obj, metadata):
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
    return verify_glb(path, obj, metadata)


def render_scene(objects, material):
    scene = bpy.data.scenes.new("tropical-trees-comparison")
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 1800
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1

    scene.display.render_aa = "16"
    scene.display.light_direction = (-.5, -.7, 1)

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.studio_light = "paint.sl"
    shading.color_type = "TEXTURE"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 1.2
    shading.curvature_valley_factor = .8
    shading.cavity_ridge_factor = 1.1
    shading.cavity_valley_factor = .8
    shading.show_specular_highlight = False
    shading.show_object_outline = False
    shading.show_backface_culling = False
    shading.background_type = "VIEWPORT"

    sand = tuple(
        int(EXPECTED[1][i:i + 2], 16) / 255
        for i in (1, 3, 5)
    )
    shading.background_color = tuple(
        value / 12.92
        if value <= .04045
        else ((value + .055) / 1.055)**2.4
        for value in sand
    )

    points = []

    for obj, x in zip(objects, (-5.5, 0, 5.5), strict=True):
        clone = bpy.data.objects.new(
            "preview-" + obj.name, obj.data
        )
        scene.collection.objects.link(clone)
        clone.location.x = x

        points.extend(
            vertex.co + Vector((x, 0, 0))
            for vertex in obj.data.vertices
        )

    # 비교 장면의 바닥은 내보내는 모델에 포함되지 않는다.
    floor_mesh = bpy.data.meshes.new("preview-ground")
    floor_mesh.from_pydata(
        [
            (-60, -60, -.015),
            (60, -60, -.015),
            (60, 60, -.015),
            (-60, 60, -.015),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    floor_mesh.materials.append(material)

    uv = floor_mesh.uv_layers.new(name="UVMap")
    for loop in uv.data:
        loop.uv = ((SLOTS["sand"] + .5) / 32, .5)

    floor_mesh.update()
    floor = bpy.data.objects.new("preview-ground", floor_mesh)
    scene.collection.objects.link(floor)

    lower, upper = bounds(points)
    pivot = (lower + upper) / 2

    cameras, scales = [], []

    for label, direction in (
        ("front", (0, -1, 0)),
        ("front-above-45", (0, -1, 1)),
    ):
        direction = Vector(direction).normalized()
        rotation = (-direction).to_track_quat("-Z", "Y")
        basis = rotation.to_matrix()

        lo, hi = bounds(
            basis.transposed() @ (point - pivot)
            for point in points
        )

        target = pivot + basis @ Vector((
            (lo.x + hi.x) / 2,
            (lo.y + hi.y) / 2,
            0,
        ))

        camera = bpy.data.objects.new(
            label, bpy.data.cameras.new(label)
        )
        scene.collection.objects.link(camera)

        camera.data.type = "ORTHO"
        camera.data.clip_start = .01
        camera.data.clip_end = 300
        camera.location = target + direction * 40
        camera.rotation_euler = rotation.to_euler()
        camera.data.ortho_scale = 1

        frame_lo, frame_hi = bounds(
            camera.data.view_frame(scene=scene)
        )

        scales.append(max(
            (hi.x - lo.x) / (frame_hi.x - frame_lo.x),
            (hi.y - lo.y) / (frame_hi.y - frame_lo.y),
        ) * 1.16)

        cameras.append(camera)

    for camera in cameras:
        camera.data.ortho_scale = max(scales)

    assert scene.display.shading.color_type == "TEXTURE"
    return scene, cameras


def combine_png(top, bottom, output):
    width, height, channels, rows, chunks = png_read(
        top.read_bytes()
    )
    (
        other_width,
        other_height,
        other_channels,
        other_rows,
        _,
    ) = png_read(bottom.read_bytes())

    assert (width, height, channels) == (
        other_width, other_height, other_channels
    )
    assert channels == 4

    def chunk(kind, payload):
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(
                ">I",
                zlib.crc32(kind + payload) & 0xffffffff,
            )
        )

    data = bytearray(b"\x89PNG\r\n\x1a\n")
    data.extend(chunk(
        b"IHDR",
        struct.pack(
            ">IIBBBBB",
            width, height * 2, 8, 6, 0, 0, 0,
        ),
    ))

    for kind, payload in chunks:
        if kind in (b"gAMA", b"cHRM", b"sRGB", b"iCCP"):
            data.extend(chunk(kind, payload))

    raw = b"".join(
        b"\x00" + row
        for row in rows + other_rows
    )

    data.extend(chunk(b"IDAT", zlib.compress(raw, 6)))
    data.extend(chunk(b"IEND", b""))
    output.write_bytes(data)

    w, h, c, _, _ = png_read(output.read_bytes())
    assert (w, h, c) == (1800, 1800, 4)


def render_comparison(objects, material):
    scene, cameras = render_scene(objects, material)
    output = OUTPUT / "trees.png"

    with tempfile.TemporaryDirectory(
        prefix="tropical-preview-",
        dir=OUTPUT,
    ) as directory:
        paths = []

        for i, camera in enumerate(cameras):
            scene.camera = camera
            path = Path(directory) / f"panel-{i}.png"
            scene.render.filepath = str(path)

            result = bpy.ops.render.render(
                write_still=True,
                scene=scene.name,
            )

            assert result == {"FINISHED"}
            assert path.is_file()
            paths.append(path)

        combine_png(paths[0], paths[1], output)

    return {
        "file": str(output),
        "panel_order_top_to_bottom": [
            "front", "front_above_45"
        ],
        "view_directions": [
            [0, -1, 0],
            [0, -1, 1],
        ],
        "objects_left_to_right": [
            obj.name for obj in objects
        ],
        "same_scale": True,
        "engine": "BLENDER_WORKBENCH",
        "color_type": "TEXTURE",
    }


def main():
    material = initialize()
    verify_palette_png(PALETTE.read_bytes())

    objects, results = [], []

    for build in (banana, monstera, plumeria):
        obj, metadata = build(material)
        objects.append(obj)
        results.append(metadata)

    bpy.context.view_layer.update()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    results = [
        export_glb(obj, metadata)
        for obj, metadata in zip(
            objects, results, strict=True
        )
    ]

    for result in results:
        path = OUTPUT / (result["name"] + ".json")
        path.write_text(
            json.dumps(
                result, ensure_ascii=False, indent=2
            ) + "\n",
            encoding="utf-8",
        )

    comparison = render_comparison(objects, material)

    for result in results:
        result["comparison"] = comparison
        path = OUTPUT / (result["name"] + ".json")
        path.write_text(
            json.dumps(
                result, ensure_ascii=False, indent=2
            ) + "\n",
            encoding="utf-8",
        )

    print(json.dumps(
        {"models": results, "comparison": comparison},
        ensure_ascii=False,
    ))


if __name__ == "__main__":
    main()
