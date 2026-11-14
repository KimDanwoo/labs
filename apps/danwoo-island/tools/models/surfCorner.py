"""
Blender 5.3
실행: blender -b --factory-startup --disable-autoexec --python /absolute/path/to/surf_corner.py
메시·GLB 직렬화는 메모리에서 검증했다(2,842삼각형). 렌더·파일 저장은 실행하지 않았다.
"""

import argparse
import json
import math
import struct
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Vector

ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
SOURCE = ROOT / "upstream-blend/folio-2025.blend"
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/island"
NAME = "surfCorner"
TARGET = Vector((3.4, 2.6, 2.8))
EPSILON = 1e-5
TRIANGLE_LIMIT = 3200

REFERENCE_NAMES = {
    "statue": "refStatuePhysicalDynamic",
    "anvil": "Cube.094",
    "cauldron": "body.001",
    "lantern": "base",
    "bench": "benchPhysicalDynamic",
    "hut": "wood.002",
    "jukebox": "refJukeboxPhysicalDynamic",
}

DESIRED = {
    "sand": "#F2D7A5",
    "white": "#FAF7F0",
    "coral": "#F27A6B",
    "turquoise": "#42C9C6",
    "green": "#5BAA5A",
    "wood": "#B36D45",
    "yellow": "#F8D26A",
    "basalt": "#3B3A40",
}

EXPECTED_SLOTS = {
    "sand": 1,
    "white": 23,
    "coral": 10,
    "turquoise": 3,
    "green": 9,
    "wood": 14,
    "yellow": 18,
    "basalt": 5,
}

SLOTS = {}


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

    assert 0 <= slot < 32
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7


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
            "smooth_faces": sum(
                p.use_smooth for p in obj.data.polygons
            ),
            "faces": len(obj.data.polygons),
            "bevels": [
                {
                    "width": modifier.width,
                    "segments": modifier.segments,
                }
                for modifier in obj.modifiers
                if modifier.type == "BEVEL"
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

    image = bpy.data.images.load(
        str(PALETTE),
        check_existing=False,
    )

    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    colors = [
        tuple(
            pixels[4 * (2 * 128 + i * 4 + 2) + channel]
            for channel in range(3)
        )
        for i in range(32)
    ]

    SLOTS.clear()

    for label, color in DESIRED.items():
        rgb = tuple(
            int(color[i:i + 2], 16) / 255
            for i in (1, 3, 5)
        )

        slot = min(
            range(32),
            key=lambda i: sum(
                (colors[i][channel] - rgb[channel]) ** 2
                for channel in range(3)
            ),
        )

        SLOTS[label] = slot

        print(json.dumps({
            "color": label,
            "requested": color,
            "slot": slot,
            "actual": "#" + "".join(
                f"{round(channel * 255):02X}"
                for channel in colors[slot]
            ),
        }, ensure_ascii=False))

    assert SLOTS == EXPECTED_SLOTS, SLOTS

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
        self.smoothing = []

    def ring(self, points):
        first = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        return list(range(first, len(self.vertices)))

    def face(self, indices, slot, smooth=False):
        indices = tuple(indices)

        assert len(indices) >= 3
        assert len(set(indices)) == len(indices)

        self.faces.append(indices)
        self.slots.append(slot)
        self.smoothing.append(smooth)

    def bridge(self, first, second, slot, smooth=False):
        assert len(first) == len(second)

        for i in range(len(first)):
            j = (i + 1) % len(first)
            color = slot[i] if isinstance(slot, (list, tuple)) else slot

            self.face(
                (first[i], first[j], second[j], second[i]),
                color,
                smooth,
            )

    def radial(
        self,
        profile,
        center=(0, 0),
        n=12,
        smooth=False,
        ellipse=(1, 1),
    ):
        rings = [
            self.ring([
                (
                    center[0]
                    + radius * ellipse[0] * math.cos(i * math.tau / n),
                    center[1]
                    + radius * ellipse[1] * math.sin(i * math.tau / n),
                    z,
                )
                for i in range(n)
            ])
            for z, radius, slot in profile
        ]

        self.face(reversed(rings[0]), profile[0][2])

        for i in range(1, len(rings)):
            self.bridge(
                rings[i - 1],
                rings[i],
                profile[i][2],
                smooth,
            )

        self.face(rings[-1], profile[-1][2])

    def box(
        self,
        center,
        size,
        slot,
        rotation=(0, 0, 0),
        bevel=0.018,
    ):
        center = Vector(center)
        size = Vector(size)
        hx, hy, hz = size / 2
        bevel = min(bevel, min(size) * 0.24)

        outline = (
            (-hx + bevel, -hy),
            (hx - bevel, -hy),
            (hx, -hy + bevel),
            (hx, hy - bevel),
            (hx - bevel, hy),
            (-hx + bevel, hy),
            (-hx, hy - bevel),
            (-hx, -hy + bevel),
        )

        rotation = Euler(rotation, "XYZ").to_matrix()

        rings = [
            self.ring([
                center + rotation @ Vector((x * scale, y * scale, z))
                for x, y in outline
            ])
            for z, scale in (
                (-hz, 1 - bevel / min(hx, hy)),
                (-hz + bevel, 1),
                (hz - bevel, 1),
                (hz, 1 - bevel / min(hx, hy)),
            )
        ]

        self.face(reversed(rings[0]), slot)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)

        self.face(rings[-1], slot)

    def tube(self, points, radii, slot, n=8, smooth=False):
        points = [Vector(point) for point in points]

        assert len(points) == len(radii)
        assert len(points) >= 2

        rings = []
        previous_side = None

        for i, (point, radius) in enumerate(
            zip(points, radii, strict=True)
        ):
            tangent = (
                points[min(i + 1, len(points) - 1)]
                - points[max(i - 1, 0)]
            ).normalized()

            assert tangent.length > 0.99
            assert radius > 0

            side = (
                previous_side
                if previous_side is not None
                else Vector((1, 0, 0))
            )
            side = side - tangent * side.dot(tangent)

            if side.length < EPSILON:
                side = tangent.cross(Vector((0, 1, 0)))

            side.normalize()
            previous_side = side
            up = tangent.cross(side).normalized()

            rings.append(self.ring([
                point + radius * (
                    side * math.cos(j * math.tau / n)
                    + up * math.sin(j * math.tau / n)
                )
                for j in range(n)
            ]))

        self.face(reversed(rings[0]), slot)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot, smooth)

        self.face(rings[-1], slot)

    def leaf(self, start, length, width, angle, lift):
        start = Vector(start)
        along = Vector((math.cos(angle), math.sin(angle), 0))
        across = Vector((-math.sin(angle), math.cos(angle), 0))

        outline = (
            (0, 0),
            (0.3, -0.5),
            (0.7, -0.4),
            (1, 0),
            (0.7, 0.4),
            (0.3, 0.5),
        )

        def point(t, w, thickness):
            return (
                start
                + along * (length * t)
                + across * (width * w)
                + Vector((
                    0,
                    0,
                    lift * math.sin(math.pi * t * 0.72) + thickness,
                ))
            )

        bottom = self.ring([
            point(t, w, -0.009)
            for t, w in outline
        ])
        top = self.ring([
            point(t, w, 0.009)
            for t, w in outline
        ])
        lower = self.ring([point(0.48, 0, -0.018)])[0]
        upper = self.ring([point(0.48, 0, 0.037)])[0]

        self.bridge(bottom, top, SLOTS["green"])

        for i in range(6):
            j = (i + 1) % 6
            self.face((top[i], top[j], upper), SLOTS["green"])
            self.face((bottom[j], bottom[i], lower), SLOTS["green"])

    def finish(self):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Name already exists: " + NAME)

        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate(verbose=False)

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for face, slot, smooth in zip(
            mesh.polygons,
            self.slots,
            self.smoothing,
            strict=True,
        ):
            face.use_smooth = smooth

            for index in face.loop_indices:
                uv.data[index].uv = ((slot + 0.5) / 32, 0.5)

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)

        assert (
            upper - lower - TARGET
        ).length < EPSILON, tuple(upper - lower)

        center = (lower + upper) / 2

        for vertex in mesh.vertices:
            vertex.co -= center

        bm = bmesh.new()
        components = 0

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

            assert all(
                edge.is_manifold and edge.is_contiguous
                for edge in bm.edges
            )
            assert all(vertex.is_manifold for vertex in bm.verts)
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
                    bmesh.ops.reverse_faces(
                        bm,
                        faces=list(component),
                    )

                components += 1

            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert len(mesh.loop_triangles) < TRIANGLE_LIMIT

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)

        assert (upper - lower - TARGET).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert abs(lower.z + TARGET.z / 2) < EPSILON
        assert sum(
            abs(vertex.co.z - lower.z) < EPSILON
            for vertex in mesh.vertices
        ) >= 32

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"
        assert len(mesh.uv_layers) == 1

        for polygon in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[i].uv)
                for i in polygon.loop_indices
            ]

            for value in values:
                check_uv(value)

            assert all(value == values[0] for value in values)

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)

        print(json.dumps({
            "mesh": NAME,
            "closed_components": components,
            "triangles": len(mesh.loop_triangles),
            "dimensions": tuple(upper - lower),
        }))

        return obj, center


def build_board(builder, position, height, width, angles, pattern):
    first = len(builder.vertices)
    columns = (-1, -0.27, 0, 0.27, 1)

    profile = (
        (0, 0.28),
        (0.08, 0.70),
        (0.25, 0.97),
        (0.47, 1.0),
        (0.54, 0.99),
        (0.76, 0.83),
        (0.92, 0.48),
        (1.0, 0.08),
    )

    rows = []

    for i, (t, fullness) in enumerate(profile):
        chevron = (
            0.13
            if pattern == "chevron" and i in (3, 4)
            else 0
        )

        rows.append(builder.ring([
            (
                width * 0.5 * fullness * u,
                -0.045 - 0.012 * (1 - u * u) * math.sin(t * math.pi),
                height * t + chevron * abs(u),
            )
            for u in columns
        ]))

    for i in range(len(rows) - 1):
        for j in range(len(columns) - 1):
            color = SLOTS["white"]

            if pattern == "chevron" and i == 3:
                color = SLOTS["coral"]
            elif pattern == "solid":
                color = SLOTS["turquoise"]
            elif pattern == "stripe" and j in (1, 2):
                color = SLOTS["yellow"]

            builder.face(
                (
                    rows[i][j],
                    rows[i][j + 1],
                    rows[i + 1][j + 1],
                    rows[i + 1][j],
                ),
                color,
            )

    perimeter = (
        rows[0]
        + [row[-1] for row in rows[1:]]
        + list(reversed(rows[-1][:-1]))
        + [row[0] for row in reversed(rows[1:-1])]
    )

    edge = builder.ring([
        (
            builder.vertices[i][0] * 1.055,
            0,
            height / 2
            + (builder.vertices[i][2] - height / 2) * 1.014,
        )
        for i in perimeter
    ])

    back = builder.ring([
        (
            builder.vertices[i][0],
            0.045,
            builder.vertices[i][2],
        )
        for i in perimeter
    ])

    builder.bridge(perimeter, edge, SLOTS["wood"], True)
    builder.bridge(edge, back, SLOTS["wood"], True)

    # 끝단의 일직선 정점에서도 퇴화 삼각형이 생기지 않도록 팬으로 닫는다.
    back_center = builder.ring([
        (0, 0.045, height * 0.5)
    ])[0]

    for i in range(len(back)):
        builder.face(
            (
                back[(i + 1) % len(back)],
                back[i],
                back_center,
            ),
            SLOTS["wood"],
        )

    rotation = Euler(angles, "XYZ").to_matrix()
    points = [
        rotation @ Vector(vertex)
        for vertex in builder.vertices[first:]
    ]

    lower, _ = bounds(points)
    offset = Vector(position)
    offset.z -= lower.z

    for i, point in enumerate(points, first):
        builder.vertices[i] = tuple(point + offset)

    return rotation @ Vector((0, -1, 0))


def build_rack(builder):
    wood = SLOTS["wood"]

    for x in (-1.34, 0.06):
        builder.box(
            (x, 0.425, 0.72),
            (0.10, 0.12, 1.12),
            wood,
        )
        builder.box(
            (x, 0.43, 0.225),
            (0.18, 0.86, 0.11),
            wood,
        )
        builder.tube(
            [
                (x, 0.79, 0.235),
                (x, 0.47, 0.93),
            ],
            [0.037, 0.037],
            wood,
            n=6,
        )

    for z in (0.48, 1.13):
        builder.box(
            (-0.64, 0.425, z),
            (1.56, 0.12, 0.10),
            wood,
        )


def build_umbrella(builder):
    cx, cy = 0.66, 0.50
    wood, white, yellow = (
        SLOTS[key] for key in ("wood", "white", "yellow")
    )

    builder.tube(
        [
            (cx, cy, 0.16),
            (cx, cy, 2.71),
        ],
        [0.038, 0.029],
        wood,
        smooth=True,
    )

    n = 24

    colors = [
        yellow if (i // 2) % 2 == 0 else white
        for i in range(n)
    ]

    rings = []

    for z, radius in (
        (2.655, 0.045),
        (2.46, 0.416),
        (2.19, 0.758),
        (2.225, 0.78),
        (2.52, 0.416),
        (2.70, 0.045),
    ):
        rings.append(builder.ring([
            (
                cx + radius * math.cos(i * math.tau / n),
                cy + radius * math.sin(i * math.tau / n),
                z - (
                    0.035
                    if radius > 0.7 and i % 2
                    else 0
                ),
            )
            for i in range(n)
        ]))

    builder.face(reversed(rings[0]), white)

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, colors)

    builder.face(rings[-1], yellow)

    for i in range(12):
        angle = i * math.tau / 12

        builder.tube(
            [
                (
                    cx + radius * math.cos(angle),
                    cy + radius * math.sin(angle),
                    z,
                )
                for radius, z in (
                    (0.06, 2.63),
                    (0.416, 2.44),
                    (0.745, 2.18),
                )
            ],
            [0.012, 0.012, 0.009],
            wood,
            n=6,
        )

    builder.radial(
        [
            (2.64, 0.052, wood),
            (2.71, 0.048, wood),
            (2.77, 0.041, yellow),
            (2.80, 0.022, yellow),
        ],
        center=(cx, cy),
        n=8,
    )

    builder.radial(
        [
            (1.34, 0.049, wood),
            (1.38, 0.049, wood),
        ],
        center=(cx, cy),
        n=8,
    )


def build_sunbed(builder):
    wood, white = SLOTS["wood"], SLOTS["white"]
    cx = 0.70

    for dx in (-0.30, 0.30):
        builder.box(
            (cx + dx, -0.50, 0.36),
            (0.085, 1.37, 0.115),
            wood,
        )

        for y in (-0.97, -0.02):
            builder.tube(
                [
                    (cx + dx, y, 0.17),
                    (cx + dx, y, 0.39),
                ],
                [0.045, 0.040],
                wood,
                n=6,
            )

    for y in (-0.93, -0.02):
        builder.box(
            (cx, y, 0.325),
            (0.65, 0.075, 0.09),
            wood,
        )

    builder.box(
        (cx, -0.58, 0.423),
        (0.64, 1.15, 0.07),
        wood,
    )

    builder.box(
        (cx, -0.58, 0.488),
        (0.59, 1.10, 0.105),
        white,
        bevel=0.025,
    )

    angle = math.radians(53)
    rotation = (angle, 0, 0)

    for dx in (-0.28, 0.28):
        builder.box(
            (cx + dx, 0.20, 0.68),
            (0.07, 0.60, 0.08),
            wood,
            rotation=rotation,
        )

    builder.box(
        (cx, 0.20, 0.70),
        (0.64, 0.62, 0.075),
        wood,
        rotation=rotation,
    )

    pad_center = Vector((cx, 0.17, 0.745))

    builder.box(
        pad_center,
        (0.59, 0.57, 0.105),
        white,
        rotation=rotation,
        bevel=0.025,
    )

    basis = Euler(rotation, "XYZ").to_matrix()

    builder.box(
        pad_center + basis @ Vector((0, 0.13, 0.073)),
        (0.40, 0.19, 0.09),
        white,
        rotation=rotation,
        bevel=0.02,
    )


def build_surf_corner():
    builder = Builder()
    sand = SLOTS["sand"]

    builder.radial(
        [
            (0, 0.945, sand),
            (0.035, 1.0, sand),
            (0.135, 1.0, sand),
            (0.18, 0.965, sand),
        ],
        n=32,
        ellipse=(1.7, 1.3),
    )

    build_rack(builder)

    fronts = [
        build_board(
            builder,
            (-1.10, 0.12, 0.17),
            1.48,
            0.41,
            (-0.19, -0.055, -0.04),
            "chevron",
        ),
        build_board(
            builder,
            (-0.63, 0.14, 0.17),
            1.64,
            0.43,
            (-0.19, 0, 0),
            "solid",
        ),
        build_board(
            builder,
            (-0.16, 0.12, 0.17),
            1.46,
            0.40,
            (-0.19, 0.055, 0.04),
            "stripe",
        ),
    ]

    build_umbrella(builder)
    build_sunbed(builder)

    for start, count, phase in (
        ((-1.20, -0.55, 0.17), 4, 0.3),
        ((0.05, 0.94, 0.17), 3, 1.2),
    ):
        for i in range(count):
            builder.leaf(
                start,
                0.25 + 0.025 * (i % 2),
                0.11,
                phase + i * math.tau / count,
                0.20 + 0.035 * (i % 3),
            )

    obj, center = builder.finish()

    markers = {
        "fronts": [tuple(front) for front in fronts],
        "foot": tuple(Vector((0.70, -1.12, 0.48)) - center),
        "head": tuple(Vector((0.70, 0.35, 0.95)) - center),
    }

    assert all(
        Vector(front).dot(Vector((0, -1, 0))) > 0.95
        for front in fronts
    )
    assert markers["foot"][1] < markers["head"][1]

    return obj, markers


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


def verify_glb(path, obj, markers):
    data = path.read_bytes()

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
        offset += 8 + size

    assert offset == len(data)

    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    buffer, = document["buffers"]

    assert "uri" not in buffer
    assert buffer["byteLength"] <= len(binary)

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

    points = [
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

    assert len(points) == len(normals) == len(uvs)
    assert all(
        abs(Vector(normal).length - 1) < EPSILON
        for normal in normals
    )

    for uv in uvs:
        check_uv(uv)

    indices = [
        row[0]
        for row in accessor_rows(
            document,
            binary,
            primitive["indices"],
        )
    ]

    assert len(indices) % 3 == 0

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

        assert min(a, b, c) >= 0
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a])
            .cross(points[c] - points[a])
            .length > 2e-10
        )
        assert all(
            abs(uvs[a][axis] - uvs[vertex][axis]) < 1e-7
            for vertex in (b, c)
            for axis in range(2)
        )

    triangles = len(indices) // 3

    assert triangles == len(obj.data.loop_triangles)
    assert triangles < TRIANGLE_LIMIT

    lower, upper = bounds(points)
    expected = Vector((TARGET.x, TARGET.z, TARGET.y))

    assert (upper - lower - expected).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON
    assert sum(
        abs(point.y - lower.y) < EPSILON
        for point in points
    ) >= 32

    # Blender -Y는 Y-up GLB에서 +Z가 된다.
    def yup(point):
        x, y, z = point
        return Vector((x, z, -y))

    assert all(
        yup(front).z > 0.95
        for front in markers["fronts"]
    )
    assert (
        yup(markers["foot"]).z
        > yup(markers["head"]).z + 1
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
        "file": str(path),
        "triangles": triangles,
        "blender_dimensions": tuple(obj.dimensions),
        "glb_dimensions": tuple(upper - lower),
        "front_blender": "-Y",
        "front_glb": "+Z",
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


def clone_for_preview(scene, source, position, display_size):
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

    center = Vector((
        (lower.x + upper.x) / 2,
        (lower.y + upper.y) / 2,
        lower.z,
    ))
    scale = display_size / max(upper - lower)

    for vertex, point in zip(
        mesh.vertices,
        points,
        strict=True,
    ):
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
            screen_right * -3,
            3.4,
        )
    ]

    labels = list(REFERENCE_NAMES)

    for i, label in enumerate(labels):
        position = screen_right * (-0.1 + (i % 4) * 1.5)
        position += Vector((
            0,
            0,
            1.7 if i // 4 == 0 else 0,
        ))

        clones.append(clone_for_preview(
            scene,
            references[label],
            position,
            1.35,
        ))

    print(
        "COMPARE: surfCorner left; original references right:",
        ", ".join(labels),
    )
    print(
        "COMPARE: display sizes normalized separately; "
        "GLB dimensions unchanged."
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

    obj, markers = build_surf_corner()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, markers)

    if not args.skip_render:
        render_comparison(obj, references)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
