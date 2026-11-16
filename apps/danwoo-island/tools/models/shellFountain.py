"""
Blender 5.3
실행: blender -b --factory-startup --disable-autoexec --python /absolute/path/to/shellFountain.py
렌더 생략: 명령 끝에 -- --skip-render 추가.

수정 메시 6,376개 삼각형과 GLB 직렬화를 Blender 5.3에서 메모리 검증했다.
그릇 내면의 위쪽 법선, 진주 가시성, 기존 홈·수면 좌표도 검증했다.
최종 PNG 렌더와 출력 파일 저장은 실행하지 않았다.

새 줄기 치수와 충돌하는 반경 0.221 제한은 Z 0.42 이상에서만 0.30으로 조정했다.
덤불 높이 0.45는 테두리의 뿌리 Z 0.40부터 측정하며 최고 Z 0.85로 검사한다.
나머지 파이프라인·출력 경로·수면 및 홈 좌표·메시/GLB 검사는 유지한다.
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
OUTPUT = ROOT / "codex-work/polish3"
NAME = "shellFountain"

EPSILON = 1e-5
MINIMUM = Vector((-1.3, -1.3, 0.0))
MAXIMUM = Vector((1.3, 1.3, 2.4))

SLOTS = {
    "sand": 1,
    "turquoise": 3,
    "basalt": 5,
    "gray": 6,
    "green": 9,
    "coral": 10,
    "light_wood": 11,
    "vein": 12,
    "wood": 14,
    "pink": 17,
    "mango": 18,
    "white": 23,
}
CENTER_RGB = {
    1: (235, 209, 163),
    3: (61, 187, 231),
    5: (74, 65, 60),
    6: (87, 90, 94),
    9: (145, 173, 120),
    10: (228, 154, 120),
    11: (152, 129, 101),
    12: (171, 174, 43),
    14: (179, 109, 69),
    17: (253, 230, 226),
    18: (248, 166, 88),
    23: (255, 242, 232),
}
USED_SLOTS = {1, 3, 9, 10, 12, 17, 23}

GROOVE_ANGLES = (-35, 0, 35)
GROOVE_DEPTH = 0.05
POOL_SURFACE = 0.35
POOL_RADIUS = 1.0
BOWL_SURFACE = 1.02
BOWL_RADIUS = 0.62


def bounds(points):
    points = list(points)
    assert points
    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


def check_bounds(points, lower=MINIMUM, upper=MAXIMUM):
    actual_lower, actual_upper = bounds(points)
    assert (actual_lower - lower).length < EPSILON, tuple(actual_lower)
    assert (actual_upper - upper).length < EPSILON, tuple(actual_upper)


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)
    assert slot in USED_SLOTS
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

    material = bpy.data.materials.get("palette")
    if material is None or material.node_tree is None:
        raise RuntimeError("Missing source palette material")

    textures = [
        node for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    assert len(textures) == 1
    assert tuple(SLOTS.values()) == (
        1, 3, 5, 6, 9, 10, 11, 12, 14, 17, 18, 23,
    )

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)
    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    for label, slot in SLOTS.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        rgb = tuple(round(pixels[offset + c] * 255) for c in range(3))
        assert rgb == CENTER_RGB[slot], (label, slot, rgb)
        assert pixels[offset + 3] > 0.999

        print(json.dumps({
            "color": label,
            "slot": slot,
            "center_rgb": rgb,
        }))

    texture = textures[0]
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    texture.mute = False
    material.node_tree.nodes.active = texture
    material.use_backface_culling = True
    image.pack()

    return material


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.parts = {}

    def ring(self, points):
        first = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        return list(range(first, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)
        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)
        assert slot in USED_SLOTS
        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, first, second, slot, closed=True):
        assert len(first) == len(second)
        count = len(first) if closed else len(first) - 1

        for i in range(count):
            j = (i + 1) % len(first)
            color = (
                slot[i % len(slot)]
                if isinstance(slot, (list, tuple))
                else slot
            )
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

    def lathe(self, profile, segments, closed_profile=False):
        rings = [
            self.ring(
                (
                    radius * math.cos(i * math.tau / segments),
                    radius * math.sin(i * math.tau / segments),
                    z,
                )
                for i in range(segments)
            )
            for radius, z, slot in profile
        ]

        for i in range(1, len(rings)):
            self.bridge(rings[i - 1], rings[i], profile[i][2])

        if closed_profile:
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

    def add_part(self, name, build):
        start = len(self.vertices)
        build()
        self.parts[name] = (start, len(self.vertices))

    def finish(self, material):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Object name already exists: " + NAME)

        check_bounds(self.vertices)

        for point in self.vertices:
            verify_clearance(Vector(point))

        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        assert not mesh.validate(verbose=False)

        mesh.materials.append(material)
        uv = mesh.uv_layers.new(name="UVMap")

        for polygon, slot in zip(mesh.polygons, self.slots, strict=True):
            polygon.material_index = 0
            polygon.use_smooth = False

            for index in polygon.loop_indices:
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
                    face.verts[0].co.dot(
                        face.verts[1].co.cross(face.verts[2].co)
                    ) / 6
                    for face in component
                )

                assert abs(volume) > 1e-10

                if volume < 0:
                    bmesh.ops.reverse_faces(
                        bm,
                        faces=list(component),
                    )

                components += 1

            assert components == 17, components
            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert 2500 <= len(mesh.loop_triangles) <= 7000
        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"
        assert {
            check_uv(loop.uv)
            for loop in mesh.uv_layers.active.data
        } == USED_SLOTS

        check_bounds(vertex.co for vertex in mesh.vertices)

        for vertex in mesh.vertices:
            verify_clearance(vertex.co)

        for face in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[i].uv)
                for i in face.loop_indices
            ]
            assert all(value == values[0] for value in values)

            points = [mesh.vertices[i].co for i in face.vertices]

            for a, b in zip(points, points[1:] + points[:1]):
                for fraction in (0.25, 0.5, 0.75):
                    verify_clearance(a.lerp(b, fraction))

            verify_clearance(sum(points, Vector()) / 3)

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)
        bpy.context.view_layer.update()

        assert obj.location.length == 0
        assert tuple(obj.rotation_euler) == (0, 0, 0)
        assert tuple(obj.scale) == (1, 1, 1)

        verify_water_disks(obj)
        verify_open_bowl_and_pearl(obj)

        return obj


def verify_clearance(point):
    radius = math.hypot(point.x, point.y)

    if (
        radius < POOL_RADIUS - EPSILON
        and 0.30 - EPSILON <= point.z <= 0.55 + EPSILON
    ):
        # 太くした支柱以外の水面領域を引き続き空ける。
        allowed = 0.30 if point.z >= 0.42 - EPSILON else 0.221
        assert radius <= allowed + EPSILON, (
            "pool intrusion",
            tuple(point),
        )

    if radius < BOWL_RADIUS - EPSILON:
        assert not (
            0.95 + EPSILON < point.z < BOWL_SURFACE - EPSILON
        ), ("bowl intrusion", tuple(point))


def verify_water_disks(obj):
    for surface, radius, floor, exclusion in (
        (POOL_SURFACE, POOL_RADIUS, 0.28, 0.24),
        (BOWL_SURFACE, BOWL_RADIUS, 0.95, 0.15),
    ):
        for fraction in (0.28, 0.50, 0.78, 0.99):
            r = radius * fraction

            if r <= exclusion:
                continue

            for i in range(48):
                angle = i * math.tau / 48
                origin = Vector((
                    r * math.cos(angle),
                    r * math.sin(angle),
                    surface - EPSILON,
                ))

                hit, point, normal, index = obj.ray_cast(
                    origin,
                    Vector((0, 0, -1)),
                )

                assert hit and point.z <= floor + EPSILON, (
                    surface,
                    tuple(origin),
                    tuple(point),
                )


def verify_open_bowl_and_pearl(obj):
    for radius in (0.20, 0.45, 0.60):
        for degrees in range(0, 360, 30):
            angle = math.radians(degrees)
            origin = Vector((
                radius * math.cos(angle),
                radius * math.sin(angle),
                1.40,
            ))
            hit, point, normal, index = obj.ray_cast(
                origin,
                Vector((0, 0, -1)),
            )

            assert hit and abs(point.z - 0.95) < EPSILON
            assert normal.z > 0.99, (
                "inverted bowl interior",
                tuple(normal),
            )

            face = obj.data.polygons[index]
            assert check_uv(
                obj.data.uv_layers.active.data[face.loop_start].uv
            ) == SLOTS["white"]

    center = Vector((0, 0, 1.20))

    for direction in (
        Vector((0, -1, 0)),
        Vector((0, -1, 1)).normalized(),
    ):
        hit, point, normal, index = obj.ray_cast(
            center + direction * 3,
            -direction,
        )

        assert hit
        assert 0.145 <= (point - center).length <= 0.16 + EPSILON

        face = obj.data.polygons[index]
        assert check_uv(
            obj.data.uv_layers.active.data[face.loop_start].uv
        ) == SLOTS["white"]


def build_basin(builder):
    sand = SLOTS["sand"]

    # 내벽의 다각형 면까지 반지름 1.0 수면 바깥에 둔다.
    inner = POOL_RADIUS / math.cos(math.pi / 64)

    builder.lathe([
        (1.040, 0.000, sand),
        (1.245, 0.000, sand),
        (1.300, 0.045, sand),
        (1.300, 0.130, sand),
        (1.255, 0.180, sand),
        (1.195, 0.195, sand),
        (1.195, 0.225, sand),
        (1.240, 0.265, sand),
        (1.240, 0.365, sand),
        (1.195, 0.420, sand),
        (1.055, 0.420, sand),
        (inner, 0.375, sand),
        (inner, 0.255, sand),
        (inner, 0.030, sand),
    ], 64, closed_profile=True)

    builder.lathe([
        (1.065, 0.035, sand),
        (1.065, 0.260, SLOTS["turquoise"]),
    ], 64)


def build_stem(builder):
    sand = SLOTS["sand"]

    builder.lathe([
        (0.270, 0.420, sand),
        (0.300, 0.455, sand),
        (0.300, 0.745, sand),
        (0.265, 0.800, sand),
    ], 16)


def notch_weight(angle):
    half_width = math.radians(8)
    result = 0.0

    for degrees in GROOVE_ANGLES:
        delta = angle - math.radians(degrees)
        distance = abs(math.atan2(math.sin(delta), math.cos(delta)))

        if distance < half_width:
            result = max(
                result,
                math.cos(distance / half_width * math.pi / 2) ** 2,
            )

    return result


def bowl_radius(radius, angle):
    # 기존 게임용 홈 좌표를 계산하는 반지름 함수는 유지한다.
    relief = max(0, min(1, (radius - 0.62) / 0.16))

    return radius * (
        1 - 0.018 * (1 - math.cos(12 * angle)) / 2 * relief
    )


def bowl_outline_radius(radius, angle):
    relief = max(0.0, min(1.0, (radius - 0.64) / 0.14))
    scallop = 0.055 * (1.0 - math.cos(10 * angle)) / 2

    # 큰 물결을 추가해도 홈 세 곳은 기존 좌표에 고정한다.
    return bowl_radius(radius, angle) - (
        scallop * relief * (1.0 - notch_weight(angle))
    )


def build_bowl(builder):
    pink = SLOTS["pink"]
    white = SLOTS["white"]

    profiles = [
        (0.08, 0.780, pink, 0.0),
        (0.30, 0.800, pink, 0.0),
        (0.52, 0.845, pink, 0.0),
        (0.66, 0.915, pink, 0.0),
        (0.74, 1.020, pink, 0.0),
        (0.78, 1.060, pink, 1.0),
        (0.78, 1.080, white, 1.0),
        (0.74, 1.065, white, 1.0),
        (0.68, 1.040, white, 1.0),
        (0.635, 0.950, white, 0.0),
        (0.44, 0.950, white, 0.0),
        (0.20, 0.950, white, 0.0),
        (0.06, 0.950, white, 0.0),
    ]

    rings = []

    for radius, z, slot, groove in profiles:
        points = []

        for i in range(72):
            angle = i * math.tau / 72
            r = bowl_outline_radius(radius, angle)
            rib = 0.0

            if slot == pink and radius > 0.30:
                rib = 0.008 * (math.cos(10 * angle) - 1)

            points.append((
                r * math.sin(angle),
                -r * math.cos(angle),
                z + rib - GROOVE_DEPTH * groove * notch_weight(angle),
            ))

        rings.append(builder.ring(points))

    builder.cap(rings[0], (0, 0, 0.780), pink)

    for i in range(1, len(rings)):
        builder.bridge(
            rings[i - 1],
            rings[i],
            profiles[i][2],
        )

    builder.cap(rings[-1], (0, 0, 0.950), white)


def build_upper_shell(builder):
    hinge = Vector((0, 0.70, 1.04))
    tilt = math.radians(15)
    up = Vector((0, math.sin(tilt), math.cos(tilt)))
    front = Vector((0, -math.cos(tilt), math.sin(tilt)))

    segments = 52
    fractions = (0.12, 0.30, 0.50, 0.70, 0.86, 0.96, 1.0)
    angles = [
        -math.pi / 2 + i * math.pi / segments
        for i in range(segments + 1)
    ]

    x_extent = max(
        abs(math.sin(angle) * (1 + 0.035 * math.cos(26 * angle)))
        for angle in angles
    )
    height_scale = (
        (2.4 - hinge.z - 0.077 * front.z)
        / (1.4 * 1.035 * up.z)
    )

    surfaces = []

    for is_front in (True, False):
        apex = builder.ring([
            hinge if is_front else hinge - front * 0.065,
        ])[0]

        rings = []

        for fraction in fractions:
            points = []

            for angle in angles:
                wave = math.cos(26 * angle)
                scallop = 1 + 0.035 * wave

                x = (
                    0.95
                    * math.sin(angle)
                    * scallop
                    * fraction
                    / x_extent
                )
                h = (
                    (0.12 + 1.28 * math.cos(angle))
                    * scallop
                    * height_scale
                    * fraction
                )
                depth = (
                    0.022 * fraction
                    - 0.115 * math.sin(math.pi * fraction)
                    + 0.055 * fraction ** 0.8 * wave
                )

                if not is_front:
                    depth -= (
                        0.065
                        + 0.020 * math.sin(math.pi * fraction)
                    )

                points.append(
                    hinge
                    + Vector((x, 0, 0))
                    + up * h
                    + front * depth
                )

            rings.append(builder.ring(points))

        slot = SLOTS["white"] if is_front else SLOTS["pink"]

        for i in range(segments):
            builder.face(
                (apex, rings[0][i], rings[0][i + 1]),
                slot,
            )

        for index in range(1, len(rings)):
            band_slot = (
                SLOTS["pink"]
                if not is_front or index == len(rings) - 1
                else slot
            )

            builder.bridge(
                rings[index - 1],
                rings[index],
                band_slot,
                closed=False,
            )

        boundary = (
            [apex]
            + [ring[0] for ring in rings]
            + rings[-1][1:]
            + [ring[-1] for ring in reversed(rings[:-1])]
        )
        surfaces.append(boundary)

    builder.bridge(
        surfaces[0],
        surfaces[1],
        SLOTS["pink"],
    )


def build_pearl(builder):
    center = Vector((0, 0, 1.20))
    radius = 0.16
    segments = 16
    latitudes = 8
    rings = []

    for latitude in range(1, latitudes):
        phi = math.pi * latitude / latitudes

        rings.append(builder.ring(
            center + radius * Vector((
                math.sin(phi) * math.cos(i * math.tau / segments),
                math.sin(phi) * math.sin(i * math.tau / segments),
                math.cos(phi),
            ))
            for i in range(segments)
        ))

    white = SLOTS["white"]

    builder.cap(
        rings[0],
        center + Vector((0, 0, radius)),
        white,
    )

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, white)

    builder.cap(
        rings[-1],
        center - Vector((0, 0, radius)),
        white,
    )


def build_starfish(builder):
    angle = math.radians(37)
    center = Vector((
        1.13 * math.sin(angle),
        -1.13 * math.cos(angle),
        0.435,
    ))
    rings = []

    for scale, height in (
        (0.86, -0.025),
        (1.0, 0.0),
        (0.86, 0.030),
    ):
        rings.append(builder.ring(
            center + Vector((
                0.125
                * scale
                * (1 if i % 2 == 0 else 0.46)
                * math.cos(i * math.pi / 5 + 0.23),
                0.125
                * scale
                * (1 if i % 2 == 0 else 0.46)
                * math.sin(i * math.pi / 5 + 0.23),
                height,
            ))
            for i in range(10)
        ))

    coral = SLOTS["coral"]

    builder.cap(
        rings[0],
        center + Vector((0, 0, -0.025)),
        coral,
    )
    builder.bridge(rings[0], rings[1], coral)
    builder.bridge(rings[1], rings[2], coral)
    builder.cap(
        rings[2],
        center + Vector((0, 0, 0.065)),
        coral,
    )


def build_bush(builder, side):
    root = Vector((side * 1.01, 0.50, 0.40))
    radial = Vector((root.x, root.y, 0)).normalized()
    tangent = Vector((-radial.y, radial.x, 0))

    spreads = (-0.27, -0.15, 0.0, 0.15, 0.27)
    heights = (0.29, 0.38, 0.446, 0.38, 0.29)

    for spread, height in zip(spreads, heights, strict=True):
        rings = []

        for fraction, width in (
            (0.0, 0.014),
            (0.24, 0.075),
            (0.50, 0.100),
            (0.78, 0.065),
            (1.0, 0.008),
        ):
            center = (
                root
                + tangent * (spread * fraction)
                + radial * (0.035 * math.sin(math.pi * fraction))
                + Vector((0, 0, height * fraction))
            )

            vein = min(0.008, width * 0.25)
            lift = 0.004 + 0.022 * math.sin(math.pi * fraction)
            cross_section = (
                (-width, 0),
                (-vein, lift * 0.75),
                (0, lift),
                (vein, lift * 0.75),
                (width, 0),
                (0, -lift * 0.60),
            )

            rings.append(builder.ring(
                center + radial * across + Vector((0, 0, dz))
                for across, dz in cross_section
            ))

        builder.face(reversed(rings[0]), SLOTS["green"])

        for first, second in zip(rings, rings[1:]):
            builder.bridge(first, second, [
                SLOTS["green"],
                SLOTS["vein"],
                SLOTS["vein"],
                SLOTS["green"],
                SLOTS["green"],
                SLOTS["green"],
            ])

        builder.face(rings[-1], SLOTS["green"])


def build_fountain(material):
    builder = Builder()

    for name, build in (
        ("basin_and_tile", lambda: build_basin(builder)),
        ("stem", lambda: build_stem(builder)),
        ("lower_shell", lambda: build_bowl(builder)),
        ("upper_shell", lambda: build_upper_shell(builder)),
        ("pearl", lambda: build_pearl(builder)),
        ("starfish", lambda: build_starfish(builder)),
        ("left_bush", lambda: build_bush(builder, -1)),
        ("right_bush", lambda: build_bush(builder, 1)),
    ):
        builder.add_part(name, build)

    for name in ("left_bush", "right_bush"):
        first, last = builder.parts[name]
        assert max(
            point[2]
            for point in builder.vertices[first:last]
        ) <= 0.85 + EPSILON

    first, last = builder.parts["upper_shell"]
    assert all(
        abs(point[0]) <= 0.95 + EPSILON
        for point in builder.vertices[first:last]
    )

    grooves = []

    for degrees in GROOVE_ANGLES:
        angle = math.radians(degrees)
        radius = bowl_radius(0.78, angle)
        position = (
            radius * math.sin(angle),
            -radius * math.cos(angle),
            1.08 - GROOVE_DEPTH,
        )

        assert any(
            (Vector(point) - Vector(position)).length < EPSILON
            for point in builder.vertices
        )

        grooves.append({
            "angle_from_front_degrees": degrees,
            "position": list(position),
        })

    metadata = {
        "coordinate_system": (
            "Blender: X right, Y back, Z up; front -Y; floor origin"
        ),
        "glb_transform": "(x,y,z) -> (x,z,-y)",
        "grooves": grooves,
        "groove_depth": GROOVE_DEPTH,
        "bowl_water": {
            "center": [0, 0, BOWL_SURFACE],
            "height": BOWL_SURFACE,
            "radius": BOWL_RADIUS,
        },
        "basin_water": {
            "center": [0, 0, POOL_SURFACE],
            "height": POOL_SURFACE,
            "radius": POOL_RADIUS,
        },
        "water_geometry_exported": False,
        "palette_slots": SLOTS,
        "palette_slots_used": sorted(USED_SLOTS),
        "bounds_blender": {
            "min": [-1.3, -1.3, 0.0],
            "max": [1.3, 1.3, 2.4],
        },
    }

    obj = builder.finish(material)
    return obj, metadata


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
    assert {
        "POSITION",
        "NORMAL",
        "TEXCOORD_0",
    }.issubset(attributes)
    assert not any(
        key.startswith("COLOR_")
        for key in attributes
    )

    positions = [
        Vector(point)
        for point in accessor_rows(
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

    assert len(positions) == len(normals) == len(uvs)
    assert {check_uv(uv) for uv in uvs} == USED_SLOTS

    check_bounds(
        positions,
        Vector((-1.3, 0, -1.3)),
        Vector((1.3, 2.4, 1.3)),
    )

    expected = {
        tuple(round(c, 5) for c in (
            vertex.co.x,
            vertex.co.z,
            -vertex.co.y,
        ))
        for vertex in obj.data.vertices
    }
    assert {
        tuple(round(c, 5) for c in point)
        for point in positions
    } == expected

    for point in positions:
        verify_clearance(Vector((
            point.x,
            -point.z,
            point.y,
        )))

    assert all(
        abs(Vector(normal).length - 1) < 1e-4
        for normal in normals
    )

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
    assert 2500 <= triangles <= 7000
    assert triangles == len(obj.data.loop_triangles)

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

        assert 0 <= min(a, b, c)
        assert max(a, b, c) < len(positions)
        assert (
            (positions[b] - positions[a])
            .cross(positions[c] - positions[a])
            .length > 2e-10
        )
        assert all(
            abs(uvs[a][axis] - uvs[vertex][axis]) < 1e-7
            for vertex in (b, c)
            for axis in range(2)
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
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    return {
        "triangles": triangles,
        "glb_dimensions": [2.6, 2.4, 2.6],
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
    return verify_glb(path.read_bytes(), obj)


def preview_clone(scene, source, direction, screen_x):
    rotation = (-direction).to_track_quat("-Z", "Y")
    inverse = rotation.to_matrix().transposed()

    points = [
        inverse @ vertex.co
        for vertex in source.data.vertices
    ]
    lower, upper = bounds(points)
    center = (lower + upper) / 2

    mesh = source.data.copy()

    for vertex, point in zip(mesh.vertices, points, strict=True):
        point -= center
        vertex.co = (
            point.x + screen_x,
            -point.z,
            point.y,
        )

    mesh.update()

    clone = bpy.data.objects.new(
        "preview-" + str(screen_x),
        mesh,
    )
    scene.collection.objects.link(clone)


def make_render_scene(obj):
    scene = bpy.data.scenes.new(NAME + "-compare")
    scene.render.engine = "BLENDER_WORKBENCH"

    scene.render.resolution_x = 2200
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0

    shading = scene.display.shading
    shading.color_type = "TEXTURE"
    shading.light = "STUDIO"
    shading.studio_light = "paint.sl"
    shading.background_type = "WORLD"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 1.1
    shading.curvature_valley_factor = 1.1
    shading.cavity_ridge_factor = 1.0
    shading.cavity_valley_factor = 1.2
    shading.show_specular_highlight = False
    shading.show_object_outline = False

    scene.world = bpy.data.worlds.new(NAME + "-preview-world")
    scene.world.color = (0.90, 0.84, 0.73)

    preview_clone(
        scene,
        obj,
        Vector((0, -1, 0)),
        -1.65,
    )
    preview_clone(
        scene,
        obj,
        Vector((0, -1, 1)).normalized(),
        1.65,
    )

    camera = bpy.data.objects.new(
        NAME + "-camera",
        bpy.data.cameras.new(NAME + "-camera"),
    )
    scene.collection.objects.link(camera)

    camera.location = (0, -20, 0)
    camera.rotation_euler = (
        Vector((0, 1, 0))
        .to_track_quat("-Z", "Y")
        .to_euler()
    )
    camera.data.type = "ORTHO"
    camera.data.clip_start = 0.01
    camera.data.clip_end = 100
    camera.data.ortho_scale = 6.65

    scene.camera = camera
    scene.render.filepath = str(OUTPUT / (NAME + ".png"))

    return scene


def render_comparison(obj):
    scene = make_render_scene(obj)

    assert bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    ) == {"FINISHED"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    material = load_source()

    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    obj, metadata = build_fountain(material)
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    metadata.update(export_glb(obj))
    metadata["file"] = str(OUTPUT / (NAME + ".glb"))

    if not args.skip_render:
        render_comparison(obj)
        metadata["preview"] = {
            "file": str(OUTPUT / (NAME + ".png")),
            "left": "front Blender -Y",
            "right": "front from 45 degrees above",
            "scale": "identical",
        }

    (OUTPUT / (NAME + ".json")).write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(metadata, ensure_ascii=False))


if __name__ == "__main__":
    main()
