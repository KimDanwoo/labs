"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/circuitSigns.py

파일 쓰기 없이 기하 검사만:
blender -b --factory-startup --disable-autoexec --python tools/models/circuitSigns.py -- --check-only

좌표: X 오른쪽, Y 뒤, Z 위. 정면 -Y, 원점 바닥 중심.
비교 PNG: 왼쪽 circuitBoard, 오른쪽 resetSign. 각각 정면 위 30도.

Blender 5.3 메모리 내 기하 검사 통과:
circuitBoard 6,886 triangles, resetSign 1,580 triangles.
GLB 내보내기·렌더·실제 게임 화면은 이번 검증에서 실행하지 않았다.

조개는 명시된 지름 0.3을 우선한다.
1차 스크립트의 radius=0.29는 폭 약 0.55이므로, 이 수치는 기존보다 확대되는 크기는 아니다.
"""
import argparse
import json
import math
import struct
import sys
import tempfile
import zlib
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "circuit"
EPS = 1e-6

EXPECTED = {
    1: "#EBD1A3",
    3: "#3DBBE7",
    5: "#4A413C",
    8: "#E4A90C",
    9: "#91AD78",
    10: "#E49A78",
    11: "#988165",
    12: "#ABAE2B",
    13: "#A49876",
    14: "#B36D45",
    16: "#ED3F1C",
    17: "#FDE6E2",
    18: "#F8A658",
    23: "#FFF2E8",
}

HOLES = {
    "circuitBoard": (-2.5, 2.5, 0.6, 5.6),
    "resetSign": (-1.25, 1.25, 0.25, 0.75),
}
LIMITS = {
    "circuitBoard": (2500, 7000),
    "resetSign": (800, 3000),
}
BACKS = {
    "circuitBoard": ((-2.6, 0.02, 0.5), (2.6, 0.2, 5.7)),
    "resetSign": ((-1.35, 0.02, 0.18), (1.35, 0.2, 0.82)),
}


def bounds(points):
    points = list(points)
    assert points
    return tuple(
        Vector(tuple(fn(p[a] for p in points) for a in range(3)))
        for fn in (min, max)
    )


def check_uv(uv):
    u, v = uv
    slot = round(u * 32 - 0.5)
    assert slot in EXPECTED
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7
    return slot


def load_palette():
    assert bpy.app.version[:2] == (5, 3), bpy.app.version_string
    assert "--disable-autoexec" in sys.argv
    assert sys.flags.optimize == 0, "assert 검사를 끄지 마세요."

    if not PALETTE.is_file():
        raise FileNotFoundError(PALETTE)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    image.colorspace_settings.name = "sRGB"
    assert tuple(image.size) == (128, 4)

    pixels = list(image.pixels)

    # 경계 픽셀에는 이웃 색이 섞여 있으므로 각 칸의 중앙만 검사한다.
    for slot, expected in EXPECTED.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        actual = "#" + "".join(
            f"{round(pixels[offset + c] * 255):02X}"
            for c in range(3)
        )
        assert actual == expected, (slot, actual, expected)
        assert abs(pixels[offset + 3] - 1) < EPS

    if bpy.data.materials.get("palette"):
        raise RuntimeError("factory-startup 상태로 실행하세요.")

    material = bpy.data.materials.new("palette")
    material.use_nodes = True

    nodes = material.node_tree.nodes
    nodes.clear()

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"

    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.85
    shader.inputs["Metallic"].default_value = 0

    output = nodes.new("ShaderNodeOutputMaterial")
    links = material.node_tree.links
    links.new(uv.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])

    nodes.active = texture
    texture.select = True
    image.pack()

    return material


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)
        return list(range(start, len(self.vertices)))

    def face(self, ids, slot):
        ids = tuple(ids)
        assert len(ids) >= 3
        assert len(set(ids)) == len(ids)
        assert slot in EXPECTED

        self.faces.append(ids)
        self.slots.append(slot)

    def bridge(self, a, b, slot):
        assert len(a) == len(b)

        for j in range(len(a)):
            k = (j + 1) % len(a)
            color = (
                slot[j % len(slot)]
                if isinstance(slot, tuple)
                else slot
            )
            self.face((a[j], a[k], b[k], b[j]), color)

    def finish(self, name, material):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate(verbose=False)
        mesh.materials.append(material)
        uv = mesh.uv_layers.new(name="UVMap")

        for polygon, slot in zip(mesh.polygons, self.slots, strict=True):
            polygon.use_smooth = False
            for loop in polygon.loop_indices:
                uv.data[loop].uv = ((slot + 0.5) / 32, 0.5)

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
            assert all(face.calc_area() > 1e-11 for face in bm.faces)

            pending = set(bm.faces)

            while pending:
                component = {pending.pop()}
                stack = list(component)

                while stack:
                    for edge in stack.pop().edges:
                        for neighbor in edge.link_faces:
                            if neighbor in pending:
                                pending.remove(neighbor)
                                component.add(neighbor)
                                stack.append(neighbor)

                volume = sum(
                    face.verts[0].co.dot(
                        face.verts[1].co.cross(face.verts[2].co)
                    ) / 6
                    for face in component
                )
                assert abs(volume) > 1e-12

                if volume < 0:
                    bmesh.ops.reverse_faces(bm, faces=list(component))

            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        validate_mesh(obj)
        return obj


def prism(
    b,
    outline,
    y0,
    y1,
    slot,
    bevel=0.12,
    transform=None,
):
    assert y1 > y0
    center = Vector((
        sum(p[0] for p in outline) / len(outline),
        sum(p[1] for p in outline) / len(outline),
    ))
    depth = min((y1 - y0) * 0.25, 0.035)
    rings = []

    for y, scale in (
        (y0, 1 - bevel),
        (y0 + depth, 1),
        (y1 - depth, 1),
        (y1, 1 - bevel),
    ):
        points = []

        for x, z in outline:
            p = Vector((x, z))
            p = center + (p - center) * scale
            point = Vector((p.x, y, p.y))
            points.append(transform(point) if transform else point)

        rings.append(b.ring(points))

    b.face(reversed(rings[0]), slot)

    for a, c in zip(rings, rings[1:]):
        b.bridge(a, c, slot)

    b.face(rings[-1], slot)


def box(b, lower, upper, slot, bevel=0.03):
    x0, y0, z0 = lower
    x1, y1, z1 = upper

    prism(
        b,
        [(x0, z0), (x1, z0), (x1, z1), (x0, z1)],
        y0,
        y1,
        slot,
        bevel,
    )


def basis(direction):
    axis = Vector(direction).normalized()
    reference = (
        Vector((0, 1, 0))
        if abs(axis.y) < 0.9
        else Vector((1, 0, 0))
    )
    side = axis.cross(reference).normalized()
    return axis, side, axis.cross(side).normalized()


def rod(b, a, c, radius, slot, sides=8, profile=None):
    a, c = Vector(a), Vector(c)
    _, side, up = basis(c - a)

    profile = profile or (
        (0, 0.82),
        (0.035, 1),
        (0.965, 1),
        (1, 0.82),
    )
    rings = [
        b.ring([
            a.lerp(c, t)
            + radius * factor * (
                side * math.cos(j * math.tau / sides)
                + up * math.sin(j * math.tau / sides)
            )
            for j in range(sides)
        ])
        for t, factor in profile
    ]

    b.face(reversed(rings[0]), slot)

    for first, second in zip(rings, rings[1:]):
        b.bridge(first, second, slot)

    b.face(rings[-1], slot)


def torus(
    b,
    center,
    major=0.188,
    minor=0.031,
    slot=13,
):
    center = Vector(center)
    rings = []

    for j in range(12):
        angle = j * math.tau / 12
        outward = Vector((math.cos(angle), math.sin(angle), 0))

        rings.append(b.ring([
            center
            + outward * (
                major + minor * math.cos(k * math.tau / 4)
            )
            + Vector((
                0,
                0,
                minor * math.sin(k * math.tau / 4),
            ))
            for k in range(4)
        ]))

    for j in range(12):
        b.bridge(rings[j], rings[(j + 1) % 12], slot)


def pebble(
    b,
    center,
    radii,
    slot,
    sides=8,
    latitudes=4,
    accent=None,
):
    center = Vector(center)
    bottom = b.ring([
        center - Vector((0, 0, radii[2]))
    ])[0]
    rings = []

    for row in range(1, latitudes):
        phi = math.pi * row / latitudes

        rings.append(b.ring([
            center + Vector((
                radii[0] * math.sin(phi)
                * math.cos(j * math.tau / sides),
                radii[1] * math.sin(phi)
                * math.sin(j * math.tau / sides),
                -radii[2] * math.cos(phi),
            ))
            for j in range(sides)
        ]))

    top = b.ring([
        center + Vector((0, 0, radii[2]))
    ])[0]

    for j in range(sides):
        k = (j + 1) % sides
        b.face((bottom, rings[0][k], rings[0][j]), slot)
        b.face(
            (rings[-1][j], rings[-1][k], top),
            accent or slot,
        )

    for a, c in zip(rings, rings[1:]):
        b.bridge(a, c, slot)


def blade(
    b,
    start,
    end,
    width,
    slot,
    accent=None,
    bend=(0, -0.04, 0.04),
    normal=(0, -1, 0),
    thickness=0.022,
):
    start, end, bend = Vector(start), Vector(end), Vector(bend)
    direction = (end - start).normalized()
    normal = Vector(normal)
    normal = (
        normal - direction * normal.dot(direction)
    ).normalized()
    side = direction.cross(normal).normalized()
    rings = []

    for t in (0, 0.30, 0.65, 0.88):
        center = (
            start.lerp(end, t)
            + bend * math.sin(math.pi * t)
        )
        half = width * (
            0.12 + 0.88 * math.sin(math.pi * t)
        )

        rings.append(b.ring([
            center - side * half,
            center + normal * thickness,
            center + side * half,
            center - normal * thickness * 0.6,
        ]))

    colors = (slot, accent or slot, slot, slot)
    b.face(reversed(rings[0]), slot)

    for a, c in zip(rings, rings[1:]):
        b.bridge(a, c, colors)

    tip = b.ring([end])[0]

    for j in range(4):
        b.face(
            (rings[-1][j], rings[-1][(j + 1) % 4], tip),
            colors[j],
        )


def grass(b, x, y, size=1):
    for j in range(8):
        angle = math.radians(-76 + j * 152 / 7)
        end = (
            x + math.sin(angle) * 0.38 * size,
            y + 0.09 * math.cos(j * 1.7) * size,
            (0.52 + 0.16 * math.cos(angle)) * size,
        )

        blade(
            b,
            (x, y, 0.028),
            end,
            0.082 * size,
            9 if j % 2 == 0 else 12,
            12 if j % 2 == 0 else 9,
            bend=(
                math.sin(angle) * 0.055 * size,
                -0.065 * size,
                0.045 * size,
            ),
            thickness=0.018 * size,
        )


def flower(
    b,
    center,
    radius,
    slot=16,
    relief=0.075,
    stamens=True,
):
    center = Vector(center)
    shape = [
        (-0.12, 0.13),
        (-0.43, 0.39),
        (-0.43, 0.72),
        (-0.28, 0.96),
        (0, 1),
        (0.25, 0.95),
        (0.46, 0.72),
        (0.43, 0.43),
        (0.13, 0.13),
    ]

    for petal in range(5):
        angle = math.tau * petal / 5 + 0.12
        radial = Vector((math.sin(angle), 0, math.cos(angle)))
        side = Vector((math.cos(angle), 0, -math.sin(angle)))
        outline = []

        for u, v in shape:
            point = center + radius * (side * u + radial * v)
            outline.append((point.x, point.z))

        prism(
            b,
            outline,
            center.y - relief,
            center.y + relief * 0.4,
            slot,
            bevel=0.17,
        )

    pebble(
        b,
        center + Vector((0, -relief, 0)),
        (radius * 0.14, relief * 0.6, radius * 0.14),
        8,
        sides=6,
        latitudes=3,
    )

    if stamens:
        a = center + Vector((0, -relief, 0))
        c = a + Vector((
            radius * 0.16,
            -radius * 0.30,
            radius * 0.34,
        ))
        rod(b, a, c, radius * 0.025, 8, sides=6)

        for j in range(4):
            point = c + Vector((
                (j % 2 - 0.5) * radius * 0.11,
                -(j // 2) * radius * 0.06,
                (j // 2 - 0.5) * radius * 0.09,
            ))
            pebble(
                b,
                point,
                (radius * 0.045,) * 3,
                8,
                sides=6,
                latitudes=3,
            )


def bamboo(b, a, c, radius, sides=8):
    a, c = Vector(a), Vector(c)
    axis, side, up = basis(c - a)
    length = (c - a).length
    sections = [(0, 0.94, 8)]

    for j in range(1, math.ceil(length / 0.45)):
        distance = j * 0.45

        if distance + 0.045 >= length:
            continue

        sections.extend((
            (distance - 0.045, 1, 8),
            (distance, 1.10, 18),
            (distance + 0.045, 1, 18),
        ))

    sections.append((length, 0.94, 8))
    rings = []

    for distance, factor, slot in sections:
        ring = b.ring([
            a + axis * distance + radius * factor * (
                side * math.cos(j * math.tau / sides)
                + up * math.sin(j * math.tau / sides)
            )
            for j in range(sides)
        ])

        if rings:
            b.bridge(rings[-1], ring, slot)

        rings.append(ring)

    b.face(reversed(rings[0]), 8)
    b.face(rings[-1], 8)


def thatch_bundle(b, x, width, t0, t1, lift, rear=False):
    rings = []

    for t, taper in ((t0, 1), (t1, 0.93)):
        y = 0.10 + (0.60 if rear else -1.10) * t
        z = 7.015 - (0.53 if rear else 0.70) * t + lift
        half = width * taper / 2

        rings.append(b.ring([
            (x - half, y, z),
            (x + half, y, z),
            (x + half, y, z - 0.145),
            (x - half, y, z - 0.145),
        ]))

    b.face(reversed(rings[0]), 13)
    b.bridge(rings[0], rings[1], (18, 13, 13, 13))
    b.face(rings[1], 13)


def straw_tassel(b, x, y, z, length, width):
    upper = b.ring([
        (x - width / 2, y, z),
        (x + width / 2, y, z),
        (x, y + 0.045, z),
    ])
    lower = b.ring([
        (x - width * 0.26, y - 0.025, z - length * 0.75),
        (x + width * 0.26, y - 0.025, z - length * 0.75),
        (x, y + 0.018, z - length * 0.75),
    ])
    tip = b.ring([
        (x + width * 0.10, y - 0.032, z - length)
    ])[0]

    b.face(reversed(upper), 13)
    b.bridge(upper, lower, (18, 13, 13))

    for j in range(3):
        b.face(
            (lower[j], lower[(j + 1) % 3], tip),
            18 if j == 0 else 13,
        )


def build_circuit(material):
    b = Builder()
    box(b, *BACKS["circuitBoard"], 5, bevel=0.003)

    # 경계 포함 검사와 부동소수점 오차를 위해 구멍 밖에 1 mm 여유를 둔다.
    for lo, hi in (
        ((-2.681, -0.12, 0.419), (-2.501, 0.02, 5.781)),
        ((2.501, -0.12, 0.419), (2.681, 0.02, 5.781)),
        ((-2.501, -0.12, 0.419), (2.501, 0.02, 0.599)),
        ((-2.501, -0.12, 5.601), (2.501, 0.02, 5.781)),
    ):
        box(b, lo, hi, 14, bevel=0.008)

    for x in (-2.9, 2.9):
        bamboo(
            b,
            (x, 0.12, 0),
            (x, 0.12, 6.3),
            0.16,
        )

        for height in (0.34, 5.72):
            for dz in (-0.065, 0, 0.065):
                torus(b, (x, 0.12, height + dz), slot=13)

        grass(b, math.copysign(2.96, x), -0.22)

    bamboo(
        b,
        (-3.18, 0.1, 6.23),
        (3.18, 0.1, 6.23),
        0.16,
        sides=6,
    )
    bamboo(
        b,
        (-3.16, 0.12, 7.07),
        (3.16, 0.12, 7.07),
        0.12,
        sides=6,
    )

    for x in (-2.86, 2.86):
        rod(
            b,
            (x, -0.91, 6.18),
            (x, 0.12, 7.04),
            0.075,
            8,
            sides=6,
        )
        rod(
            b,
            (x, 0.12, 7.04),
            (x, 0.67, 6.39),
            0.075,
            8,
            sides=6,
        )

    for j in range(17):
        x = -3.04 + j * 0.38

        for row in range(4):
            t0 = row * 0.23
            t1 = min(1, t0 + 0.34)
            lift = (
                (3 - row) * 0.035
                + 0.012 * math.sin(j * 1.9)
            )

            thatch_bundle(
                b,
                x + 0.018 * math.sin(j + row),
                0.415,
                t0,
                t1,
                lift,
            )

        thatch_bundle(
            b,
            x,
            0.415,
            0,
            1,
            0.015,
            rear=True,
        )

        for strand in range(3):
            length = 0.15 + 0.20 * (
                0.5 + 0.5 * math.sin(j * 2.3 + strand * 1.7)
            )
            straw_tassel(
                b,
                x + (strand - 1) * 0.115,
                -0.995,
                6.30 + 0.012 * math.sin(j * 1.9),
                length,
                0.075,
            )

    for end in (
        (3.22, -0.28, 7.13),
        (2.22, -0.25, 7.18),
    ):
        blade(
            b,
            (2.62, -0.35, 6.65),
            end,
            0.18,
            9,
            12,
            bend=(0, -0.035, 0.03),
            thickness=0.028,
        )

    flower(b, (2.66, -0.57, 6.61), 0.51)

    surf = Builder()
    angle = math.radians(15)

    # 기울인 뒤에도 바닥부터 코끝까지의 수직 높이가 2.6이 되게 한다.
    height = 2.6 / math.cos(angle)
    outline = [
        (0, 0),
        (0.15, 0.10),
        (0.29, 0.40),
        (0.375, 1.10),
        (0.32, 1.80),
        (0.18, 2.32),
        (0, height),
        (-0.18, 2.32),
        (-0.32, 1.80),
        (-0.375, 1.10),
        (-0.29, 0.40),
        (-0.15, 0.10),
    ]
    prism(surf, outline, -0.065, 0.065, 23, bevel=0.065)

    for offset in (-0.115, 0.115):
        stripe = [
            (offset - 0.032, 0.23),
            (offset + 0.032, 0.23),
            (offset + 0.027, 2.22),
            (offset, 2.40),
            (offset - 0.027, 2.22),
        ]
        prism(
            surf,
            stripe,
            -0.073,
            -0.067,
            3,
            bevel=0.02,
        )

    flower(
        surf,
        (0, -0.084, 0.67),
        0.265,
        10,
        relief=0.012,
        stamens=False,
    )

    first = len(b.vertices)
    b.vertices.extend(
        (
            3.74 + x * math.cos(angle) - z * math.sin(angle),
            0.04 + y,
            x * math.sin(angle) + z * math.cos(angle),
        )
        for x, y, z in surf.vertices
    )
    b.faces.extend(
        tuple(first + i for i in face)
        for face in surf.faces
    )
    b.slots.extend(surf.slots)

    return b.finish("circuitBoard", material)


def shell(b, hinge, radius, slot, angle=0):
    hinge = Vector(hinge)
    angle = math.radians(angle)

    def point(t, theta, front, column):
        a = theta + angle
        scallop = 1 - 0.035 * (column % 2) * t * t
        x = radius * t * math.sin(a) * scallop
        z = radius * t * math.cos(a) * scallop
        y = (
            -radius * (
                0.09
                + 0.20 * math.sin(math.pi * t)
                + 0.045 * (column % 2)
            )
            if front
            else radius * 0.05
        )
        return hinge + Vector((x, y, z))

    count = 12
    surfaces = []

    for front in (True, False):
        root = b.ring([
            hinge + Vector((
                0,
                -radius * 0.09 if front else radius * 0.05,
                0,
            ))
        ])[0]

        rows = [
            b.ring([
                point(
                    t,
                    math.radians(-72 + 144 * j / count),
                    front,
                    j,
                )
                for j in range(count + 1)
            ])
            for t in (0.24, 0.62, 1)
        ]

        for j in range(count):
            b.face(
                (root, rows[0][j], rows[0][j + 1]),
                slot,
            )

        for a, c in zip(rows, rows[1:]):
            for j in range(count):
                color = (
                    17
                    if slot == 23 and j % 4 == 0
                    else slot
                )
                b.face(
                    (a[j], c[j], c[j + 1], a[j + 1]),
                    color,
                )

        surfaces.append((root, rows))

    (fa, fr), (ba, br) = surfaces

    for j in range(count):
        b.face(
            (
                fr[-1][j],
                br[-1][j],
                br[-1][j + 1],
                fr[-1][j + 1],
            ),
            slot,
        )

    for edge in (0, count):
        fs = [fa] + [row[edge] for row in fr]
        bs = [ba] + [row[edge] for row in br]

        for j in range(len(fs) - 1):
            b.face(
                (fs[j], bs[j], bs[j + 1], fs[j + 1]),
                slot,
            )

    pebble(
        b,
        hinge,
        (radius * 0.15, radius * 0.10, radius * 0.07),
        slot,
        sides=6,
        latitudes=3,
    )


def reset_rock(b, x, rx, height):
    sides = 8
    bottom = b.ring([(x, 0.17, 0)])[0]
    rings = []

    # 0.25 이상인 부분은 판 뒤로 물리고 낮은 앞면만 돌출시켜 받침을 드러낸다.
    for z, scale, front in (
        (0.055, 0.74, -0.21),
        (0.16, 1.0, -0.36),
        (0.245, 0.88, 0.025),
        (height - 0.035, 0.58, 0.045),
    ):
        back = 0.66 - (1 - scale) * 0.15
        cy = (front + back) / 2
        ry = (back - front) / 2

        rings.append(b.ring([
            (
                x + rx * scale * math.cos(j * math.tau / sides),
                cy + ry * math.sin(j * math.tau / sides),
                z,
            )
            for j in range(sides)
        ]))

    top = b.ring([(x - rx * 0.09, 0.27, height)])[0]

    for j in range(sides):
        k = (j + 1) % sides
        b.face((bottom, rings[0][k], rings[0][j]), 5)
        b.face((rings[-1][j], rings[-1][k], top), 13)

    for row, (a, c) in enumerate(zip(rings, rings[1:])):
        b.bridge(a, c, 5 if row == 0 else 13)


def build_reset(material):
    b = Builder()
    box(b, *BACKS["resetSign"], 5, bevel=0.003)

    # 유목 외곽을 네 개의 닫힌 부품으로 나누어 구멍을 가로지르는 캡을 피한다.
    outlines = [
        [
            (-1.65, 0.752),
            (1.65, 0.752),
            (1.85, 0.86),
            (1.71, 0.94),
            (1.38, 0.96),
            (1.50, 1.05),
            (1.26, 1.04),
            (0.93, 0.91),
            (0.12, 0.88),
            (-0.50, 0.95),
            (-1.06, 1.05),
            (-1.55, 1.02),
            (-1.70, 0.91),
        ],
        [
            (-1.60, 0.248),
            (1.65, 0.248),
            (1.73, 0.16),
            (1.58, 0.08),
            (0.90, 0.05),
            (0.15, 0.09),
            (-0.40, 0.065),
            (-1.40, 0.07),
            (-1.65, 0.12),
        ],
        [
            (-1.252, 0.15),
            (-1.252, 0.93),
            (-1.56, 0.96),
            (-1.70, 0.78),
            (-1.59, 0.67),
            (-1.75, 0.59),
            (-1.70, 0.50),
            (-1.53, 0.45),
            (-1.66, 0.26),
            (-1.58, 0.12),
        ],
        [
            (1.252, 0.14),
            (1.61, 0.10),
            (1.74, 0.24),
            (1.70, 0.47),
            (1.80, 0.64),
            (1.67, 0.88),
            (1.252, 0.91),
        ],
    ]

    for outline in outlines:
        prism(b, outline, -0.1, 0.22, 14, bevel=0.055)

    for x, z, length in (
        (-1.32, 0.83, 0.66),
        (-0.44, 0.82, 0.73),
        (0.43, 0.80, 0.77),
        (-1.25, 0.16, 0.82),
        (-0.20, 0.17, 0.68),
        (0.66, 0.15, 0.67),
    ):
        prism(
            b,
            [
                (x, z),
                (x + length * 0.42, z + 0.018),
                (x + length, z + 0.008),
                (x + length * 0.6, z - 0.009),
            ],
            -0.111,
            -0.101,
            11,
            bevel=0.06,
        )

    for x in (-1.46, 1.48):
        prism(
            b,
            [
                (x, 0.29),
                (x + 0.018, 0.50),
                (x - 0.01, 0.71),
                (x - 0.018, 0.51),
            ],
            -0.113,
            -0.103,
            11,
            bevel=0.06,
        )

    for x, rx, height in (
        (-0.79, 0.49, 0.33),
        (0.02, 0.53, 0.35),
        (0.82, 0.46, 0.32),
    ):
        reset_rock(b, x, rx, height)

    grass(b, -1.82, -0.07, 0.76)
    grass(b, 1.84, -0.06, 0.76)

    shell_radius = 0.30 / (2 * math.sin(math.radians(72)))

    shell(
        b,
        (-1.43, -0.16, 0.82),
        shell_radius,
        23,
        angle=-8,
    )
    shell(
        b,
        (1.57, -0.17, 0.075),
        shell_radius,
        23,
        angle=16,
    )

    return b.finish("resetSign", material)


def clip_polygon(points, axis, limit, sign):
    if not points:
        return []

    result = []
    previous = points[-1]
    pd = sign * (previous[axis] - limit)

    for current in points:
        cd = sign * (current[axis] - limit)

        if (pd >= 0) != (cd >= 0):
            result.append(previous.lerp(current, pd / (pd - cd)))

        if cd >= 0:
            result.append(current)

        previous, pd = current, cd

    return result


def check_hole(points, triangles, name):
    x0, x1, z0, z1 = HOLES[name]

    assert not any(
        x0 <= p.x <= x1
        and z0 <= p.z <= z1
        and p.y < 0.01
        for p in points
    ), (name, "판 앞 정점 침범")

    # 정점이 모두 밖에 있어도 큰 삼각형은 구멍을 가로지를 수 있다.
    planes = (
        (0, x0, 1),
        (0, x1, -1),
        (2, z0, 1),
        (2, z1, -1),
        (1, 0.01 - EPS, -1),
    )

    for indices in triangles:
        polygon = [points[i] for i in indices]

        for axis, limit, sign in planes:
            polygon = clip_polygon(polygon, axis, limit, sign)

            if not polygon:
                break

        if len(polygon) >= 3:
            area = sum(
                (polygon[i] - polygon[0]).cross(
                    polygon[i + 1] - polygon[0]
                ).length / 2
                for i in range(1, len(polygon) - 1)
            )
            assert area < 1e-11, (
                name,
                "판 앞 삼각형 침범",
                area,
            )


def validate_mesh(obj):
    mesh = obj.data
    mesh.calc_loop_triangles()
    count = len(mesh.loop_triangles)

    assert (
        LIMITS[obj.name][0] <= count <= LIMITS[obj.name][1]
    ), (obj.name, count)
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert obj.location.length == 0
    assert tuple(obj.rotation_euler) == (0, 0, 0)
    assert tuple(obj.scale) == (1, 1, 1)

    points = [v.co.copy() for v in mesh.vertices]
    assert all(math.isfinite(c) for p in points for c in p)

    lower, upper = bounds(points)
    assert abs(lower.z) < EPS, (obj.name, tuple(lower))

    if obj.name == "circuitBoard":
        assert lower.x >= -3.4 and upper.x <= 3.95
        assert lower.y >= -1.1 and upper.y <= 0.85
        assert 7.05 <= upper.z <= 7.25

    for polygon in mesh.polygons:
        values = [
            tuple(mesh.uv_layers.active.data[i].uv)
            for i in polygon.loop_indices
        ]
        for uv in values:
            check_uv(uv)
        assert all(uv == values[0] for uv in values)

    check_hole(
        points,
        [tuple(t.vertices) for t in mesh.loop_triangles],
        obj.name,
    )

    return {
        "triangles": count,
        "bounds": [tuple(lower), tuple(upper)],
    }


def png_chunks(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    offset = 8

    while offset < len(data):
        size, = struct.unpack_from(">I", data, offset)
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + size]
        crc, = struct.unpack_from(">I", data, offset + 8 + size)

        assert zlib.crc32(kind + payload) & 0xffffffff == crc
        offset += size + 12

        yield kind, payload

        if kind == b"IEND":
            assert offset == len(data)
            return

    raise AssertionError("PNG IEND 누락")


def decode_png(data):
    chunks = list(png_chunks(data))
    header, = [
        payload
        for kind, payload in chunks
        if kind == b"IHDR"
    ]

    (
        width,
        height,
        depth,
        color,
        compression,
        filtering,
        interlace,
    ) = struct.unpack(">IIBBBBB", header)

    assert (
        depth, compression, filtering, interlace
    ) == (8, 0, 0, 0)
    assert color in (2, 6)

    channels = 4 if color == 6 else 3
    stride = width * channels
    raw = zlib.decompress(b"".join(
        payload
        for kind, payload in chunks
        if kind == b"IDAT"
    ))
    assert len(raw) == height * (stride + 1)

    previous = bytearray(stride)
    rows = []

    for y in range(height):
        offset = y * (stride + 1)
        method = raw[offset]
        assert 0 <= method <= 4
        row = bytearray(raw[offset + 1:offset + 1 + stride])

        for x in range(stride):
            left = row[x - channels] if x >= channels else 0
            above = previous[x]
            corner = previous[x - channels] if x >= channels else 0

            if method == 0:
                predictor = 0
            elif method == 1:
                predictor = left
            elif method == 2:
                predictor = above
            elif method == 3:
                predictor = (left + above) // 2
            else:
                estimate = left + above - corner
                distances = (
                    abs(estimate - left),
                    abs(estimate - above),
                    abs(estimate - corner),
                )
                predictor = (left, above, corner)[
                    distances.index(min(distances))
                ]

            row[x] = (row[x] + predictor) & 255

        rows.append(bytes(row))
        previous = row

    return width, height, channels, rows, chunks


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

    start = (
        view.get("byteOffset", 0)
        + accessor.get("byteOffset", 0)
    )
    stride = view.get("byteStride", size)

    assert accessor["count"] > 0
    assert stride >= size
    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
        <= len(binary)
    )

    return [
        struct.unpack_from(fmt, binary, start + i * stride)
        for i in range(accessor["count"])
    ]


def verify_glb(path, obj):
    data = path.read_bytes()
    assert struct.unpack_from("<4sII", data) == (
        b"glTF", 2, len(data)
    )

    offset, chunks = 12, {}

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

    buffer, = document["buffers"]
    assert "uri" not in buffer
    assert 0 <= len(binary) - buffer["byteLength"] <= 3

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]

    assert mesh["name"] == node["name"] == obj.name
    assert node["mesh"] == 0
    assert "matrix" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert material["name"] == "palette"
    assert material.get("alphaMode", "OPAQUE") == "OPAQUE"

    primitive, = mesh["primitives"]
    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]
    assert {
        "POSITION", "NORMAL", "TEXCOORD_0"
    } <= attributes.keys()
    assert not any(k.startswith("COLOR_") for k in attributes)

    points = [
        Vector(p)
        for p in accessor_rows(
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
        abs(Vector(n).length - 1) < 1e-4
        for n in normals
    )

    for uv in uvs:
        check_uv(uv)

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"]
        )
    ]
    assert len(indices) % 3 == 0

    triangles = [
        indices[i:i + 3]
        for i in range(0, len(indices), 3)
    ]
    assert len(triangles) == len(obj.data.loop_triangles)

    for a, b, c in triangles:
        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a])
            .cross(points[c] - points[a]).length
            > 1e-11
        )
        assert uvs[a] == uvs[b] == uvs[c]

    # export_yup: Blender (x, y, z) -> glTF (x, z, -y).
    restored = [
        Vector((p.x, -p.z, p.y))
        for p in points
    ]
    check_hole(restored, triangles, obj.name)

    expected_bounds = bounds(
        vertex.co for vertex in obj.data.vertices
    )

    for actual, expected in zip(
        bounds(restored), expected_bounds, strict=True
    ):
        assert (actual - expected).length < 1e-5

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0
    assert (
        material["pbrMetallicRoughness"]
        ["baseColorTexture"]["index"]
        == 0
    )
    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]
    width, height, channels, rows, _ = decode_png(png)

    assert (width, height) == (128, 4)

    for slot, expected in EXPECTED.items():
        start = (slot * 4 + 2) * channels
        rgb = rows[height - 1 - 2][start:start + 3]
        actual = "#" + "".join(f"{c:02X}" for c in rgb)
        assert actual == expected, (slot, actual, expected)

    lower, upper = expected_bounds
    glower, gupper = bounds(points)
    x0, x1, z0, z1 = HOLES[obj.name]

    return {
        "name": obj.name,
        "file": str(path),
        "triangles": len(triangles),
        "bounds_blender": {
            "min": tuple(lower),
            "max": tuple(upper),
        },
        "dimensions_blender": tuple(upper - lower),
        "bounds_gltf_yup": {
            "min": tuple(glower),
            "max": tuple(gupper),
        },
        "origin_blender": (0, 0, 0),
        "front_blender": (0, -1, 0),
        "front_gltf_yup": (0, 0, 1),
        "hole_blender": {
            "x": (x0, x1),
            "z": (z0, z1),
            "panel_y": 0,
            "forbidden_geometry_y": "< 0.01",
        },
        "hole_gltf_yup": {
            "x": (x0, x1),
            "y": (z0, z1),
            "panel_z": 0,
        },
        "backing_bounds_blender": {
            "min": BACKS[obj.name][0],
            "max": BACKS[obj.name][1],
        },
        "material": "palette",
        "palette_source": str(PALETTE),
        "palette_slots": sorted(set(
            check_uv(uv) for uv in uvs
        )),
        "checks": {
            "closed_components": True,
            "positive_component_volumes": True,
            "hole_front_vertices": 0,
            "hole_front_triangle_intersections": 0,
            "embedded_palette_center_pixels": True,
            "export_yup": True,
        },
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
    assert path.is_file()
    return verify_glb(path, obj)


def preview_quad(
    scene,
    name,
    vertices,
    material,
    slot=None,
):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], [(0, 1, 2, 3)])
    mesh.materials.append(material)
    uv = mesh.uv_layers.new(name="UVMap")

    for loop in uv.data:
        loop.uv = (
            ((slot + 0.5) / 32, 0.5)
            if slot is not None
            else (0.5, 0.5)
        )

    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def make_preview(obj, gray):
    scene = bpy.data.scenes.new(obj.name + "-preview")
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 1280
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "VIEWPORT"
    shading.background_color = (0.86, 0.77, 0.63)
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 1.25
    shading.curvature_valley_factor = 1.0
    shading.cavity_ridge_factor = 1.1
    shading.cavity_valley_factor = 1.0
    shading.show_specular_highlight = True
    scene.display.render_aa = "32"

    clone = bpy.data.objects.new(
        "preview-" + obj.name,
        obj.data,
    )
    scene.collection.objects.link(clone)

    x0, x1, z0, z1 = HOLES[obj.name]

    # 실제 글자 판은 GLB에 넣지 않고 별도 렌더 장면에만 만든다.
    preview_quad(
        scene,
        "preview-text-panel",
        [
            (x0, 0, z0),
            (x1, 0, z0),
            (x1, 0, z1),
            (x0, 0, z1),
        ],
        gray,
    )
    preview_quad(
        scene,
        "preview-sand",
        [
            (-100, -100, -0.015),
            (100, -100, -0.015),
            (100, 100, -0.015),
            (-100, 100, -0.015),
        ],
        obj.data.materials[0],
        1,
    )

    points = [
        vertex.co.copy()
        for vertex in obj.data.vertices
    ]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2

    direction = Vector((
        0,
        -math.cos(math.pi / 6),
        math.sin(math.pi / 6),
    ))
    rotation = (-direction).to_track_quat("-Z", "Y")
    basis_matrix = rotation.to_matrix()

    screen_low, screen_high = bounds(
        basis_matrix.transposed() @ (point - pivot)
        for point in points
    )
    target = pivot + basis_matrix @ Vector((
        (screen_low.x + screen_high.x) / 2,
        (screen_low.y + screen_high.y) / 2,
        0,
    ))

    camera = bpy.data.objects.new(
        "preview-camera",
        bpy.data.cameras.new("preview-camera"),
    )
    scene.collection.objects.link(camera)

    camera.data.type = "ORTHO"
    camera.data.clip_start = 0.01
    camera.data.clip_end = 300
    camera.location = target + direction * 35
    camera.rotation_euler = rotation.to_euler()
    camera.data.ortho_scale = 1

    frame_low, frame_high = bounds(
        camera.data.view_frame(scene=scene)
    )
    camera.data.ortho_scale = 1.18 * max(
        (screen_high.x - screen_low.x)
        / (frame_high.x - frame_low.x),
        (screen_high.y - screen_low.y)
        / (frame_high.y - frame_low.y),
    )

    scene.camera = camera
    return scene


def gray_material():
    image = bpy.data.images.new(
        "preview-gray",
        width=1,
        height=1,
        alpha=True,
    )
    image.pixels = (0.105, 0.105, 0.105, 1)

    material = bpy.data.materials.new("preview-gray")
    material.use_nodes = True
    material.diffuse_color = (0.105, 0.105, 0.105, 1)

    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = image
    material.node_tree.nodes.active = node

    shader = material.node_tree.nodes.get("Principled BSDF")
    material.node_tree.links.new(
        node.outputs["Color"],
        shader.inputs["Base Color"],
    )

    return material, image


def combine_png(left, right, output):
    w1, h1, c1, rows1, chunks = decode_png(left.read_bytes())
    w2, h2, c2, rows2, _ = decode_png(right.read_bytes())
    assert h1 == h2
    assert c1 == c2 == 4

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

    result = bytearray(b"\x89PNG\r\n\x1a\n")
    result.extend(chunk(
        b"IHDR",
        struct.pack(
            ">IIBBBBB",
            w1 + w2,
            h1,
            8, 6, 0, 0, 0,
        ),
    ))

    for kind, payload in chunks:
        if kind in (b"gAMA", b"cHRM", b"sRGB", b"iCCP"):
            result.extend(chunk(kind, payload))

    raw = b"".join(
        b"\0" + a + b
        for a, b in zip(rows1, rows2, strict=True)
    )
    result.extend(chunk(b"IDAT", zlib.compress(raw, 6)))
    result.extend(chunk(b"IEND", b""))
    output.write_bytes(result)

    assert struct.unpack_from(
        ">II", output.read_bytes(), 16
    ) == (2560, 1280)


def render_comparison(objects):
    gray, image = gray_material()
    output = OUTPUT / "circuitProps.png"

    try:
        with tempfile.TemporaryDirectory(
            prefix="circuit-preview-",
            dir=OUTPUT,
        ) as directory:
            paths = []

            for obj in objects:
                scene = make_preview(obj, gray)

                try:
                    path = Path(directory) / (obj.name + ".png")
                    scene.render.filepath = str(path)

                    result = bpy.ops.render.render(
                        write_still=True,
                        scene=scene.name,
                    )

                    assert result == {"FINISHED"}
                    assert path.is_file()
                    paths.append(path)

                finally:
                    for item in list(scene.objects):
                        data = item.data
                        bpy.data.objects.remove(
                            item, do_unlink=True
                        )

                        if data.users == 0:
                            if isinstance(data, bpy.types.Mesh):
                                bpy.data.meshes.remove(data)
                            elif isinstance(data, bpy.types.Camera):
                                bpy.data.cameras.remove(data)

                    bpy.data.scenes.remove(scene)

            combine_png(paths[0], paths[1], output)

    finally:
        bpy.data.materials.remove(gray)
        bpy.data.images.remove(image)

    return {
        "file": str(output),
        "panels": [obj.name for obj in objects],
        "elevation_degrees": 30,
        "azimuth": "front_-Y",
        "engine": "BLENDER_WORKBENCH",
        "color_type": "TEXTURE",
        "framing": (
            "각 패널 독립 프레이밍; "
            "모델 좌표·스케일 변경 없음"
        ),
        "gray_text_panels": "렌더 전용; GLB 미포함",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="파일 쓰기 없이 메모리 내 기하 검사",
    )
    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    material = load_palette()
    scene = bpy.data.scenes.new("circuit-signs-export")
    bpy.context.window.scene = scene

    objects = [
        build_circuit(material),
        build_reset(material),
    ]
    bpy.context.view_layer.update()

    if args.check_only:
        print(json.dumps(
            {
                obj.name: validate_mesh(obj)
                for obj in objects
            },
            ensure_ascii=False,
            indent=2,
        ))
        return

    OUTPUT.mkdir(parents=True, exist_ok=True)

    # 렌더 전용 형상이 생기기 전에 모델만 선택하여 내보낸다.
    records = [export_glb(obj) for obj in objects]
    comparison = render_comparison(objects)

    for index, record in enumerate(records):
        record["comparison"] = {
            **comparison,
            "panel_index": index,
        }
        (OUTPUT / (record["name"] + ".json")).write_text(
            json.dumps(
                record,
                ensure_ascii=False,
                indent=2,
            ) + "\n",
            encoding="utf-8",
        )

    print(json.dumps(
        {
            "models": records,
            "comparison": comparison,
        },
        ensure_ascii=False,
        indent=2,
    ))


if __name__ == "__main__":
    main()
