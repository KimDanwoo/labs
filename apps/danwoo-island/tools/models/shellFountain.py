"""
Blender 5.3
실행: Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/shell_fountain.py
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
OUTPUT = ROOT / "codex-work/island"
NAME = "shellFountain"
TARGET = Vector((2.6, 2.6, 2.4))
EPSILON = 1e-5

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
    "water": "#42C9C6",
    "green": "#5BAA5A",
    "wood": "#B36D45",
    "yellow": "#F8D26A",
    "basalt": "#3B3A40",
    "blush": "#FDE6E2",
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
            "smooth_faces": sum(p.use_smooth for p in obj.data.polygons),
            "faces": len(obj.data.polygons),
            "bevels": [
                {"width": modifier.width, "segments": modifier.segments}
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

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
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
                f"{round(value * 255):02X}"
                for value in colors[slot]
            ),
        }, ensure_ascii=False))

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

    def radial(self, profile, center=(0, 0), n=24, smooth=False):
        rings = [
            self.ring([
                (
                    center[0] + radius * math.cos(i * math.tau / n),
                    center[1] + radius * math.sin(i * math.tau / n),
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

    def tube(self, points, radii, slot, n=8):
        points = [Vector(point) for point in points]
        assert len(points) == len(radii)

        rings = []
        previous_side = None

        for i, (point, radius) in enumerate(zip(points, radii)):
            tangent = (
                points[min(i + 1, len(points) - 1)]
                - points[max(i - 1, 0)]
            ).normalized()

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

        for i in range(1, len(rings)):
            self.bridge(rings[i - 1], rings[i], slot, True)

        self.face(rings[-1], slot)

    def rock(self, center, size, slot, phase=0):
        center = Vector(center)
        size = Vector(size)

        rings = [
            self.ring([
                center + Vector((
                    math.cos(j * math.tau / 8 + phase)
                    * radius * size.x,
                    math.sin(j * math.tau / 8 + phase)
                    * radius * size.y,
                    height * size.z,
                ))
                for j in range(8)
            ])
            for height, radius in (
                (-0.5, 0.70),
                (-0.12, 1),
                (0.30, 0.83),
                (0.5, 0.48),
            )
        ]

        self.face(reversed(rings[0]), slot)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot)

        self.face(rings[-1], slot)

    def star(self, center, radius, angle, slot):
        center = Vector(center)
        rings = []

        for scale, height in (
            (0.88, -0.023),
            (1, 0),
            (0.88, 0.032),
        ):
            rings.append(self.ring([
                center + Vector((
                    math.cos(angle + i * math.pi / 5)
                    * radius
                    * (1 if i % 2 == 0 else 0.48)
                    * scale,
                    math.sin(angle + i * math.pi / 5)
                    * radius
                    * (1 if i % 2 == 0 else 0.48)
                    * scale,
                    height,
                ))
                for i in range(10)
            ]))

        self.face(reversed(rings[0]), slot)
        self.bridge(rings[0], rings[1], slot)
        self.bridge(rings[1], rings[2], slot)

        apex = self.ring([
            center + Vector((0, 0, 0.072))
        ])[0]

        for i in range(10):
            self.face(
                (rings[2][i], rings[2][(i + 1) % 10], apex),
                slot,
            )

    def leaf(self, start, length, width, angle, slot):
        start = Vector(start)
        along = Vector((math.cos(angle), math.sin(angle), 0))
        across = Vector((-math.sin(angle), math.cos(angle), 0))

        outline = (
            (0, 0),
            (0.3, -0.5),
            (0.7, -0.42),
            (1, 0),
            (0.7, 0.42),
            (0.3, 0.5),
        )

        def point(t, w, height):
            return (
                start
                + along * (length * t)
                + across * (width * w)
                + Vector((
                    0,
                    0,
                    0.12 * math.sin(math.pi * t)
                    + 0.09 * t
                    + height,
                ))
            )

        bottom = self.ring([
            point(t, w, -0.017)
            for t, w in outline
        ])
        top = self.ring([
            point(t, w, 0.017)
            for t, w in outline
        ])
        lower = self.ring([point(0.48, 0, -0.025)])[0]
        upper = self.ring([point(0.48, 0, 0.058)])[0]

        self.bridge(bottom, top, slot)

        for i in range(6):
            j = (i + 1) % 6
            self.face((top[i], top[j], upper), slot)
            self.face((bottom[j], bottom[i], lower), slot)

    def ripple(self, center, radius, thickness, slot, n=16):
        center = Vector(center)

        rings = [
            self.ring([
                center + Vector((
                    (
                        radius
                        + thickness * math.cos(k * math.tau / 4)
                    ) * math.cos(j * math.tau / n),
                    (
                        radius
                        + thickness * math.cos(k * math.tau / 4)
                    ) * math.sin(j * math.tau / n),
                    thickness * 0.6 * math.sin(k * math.tau / 4),
                ))
                for j in range(n)
            ])
            for k in range(4)
        ]

        for k in range(4):
            self.bridge(
                rings[k],
                rings[(k + 1) % 4],
                slot,
                True,
            )

    def finish(self):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Object name already exists: " + NAME)

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
        assert (upper - lower - TARGET).length < EPSILON

        center = (lower + upper) / 2

        for vertex in mesh.vertices:
            vertex.co -= center

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

            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert len(mesh.loop_triangles) < 3200

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)

        assert (upper - lower - TARGET).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert abs(lower.z + 1.2) < EPSILON
        assert sum(
            abs(vertex.co.z - lower.z) < EPSILON
            for vertex in mesh.vertices
        ) >= 24

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

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

        return obj


def build_shell(builder):
    first = len(builder.vertices)

    axis = Vector((0.46, -0.72, -0.52)).normalized()
    right = Vector((0, 0, 1)).cross(axis).normalized()
    up = axis.cross(right).normalized()
    tip = Vector((-0.60, 0.52, 2.30))
    n = 16

    def shell_point(t, radius, theta, flare=0):
        relief = (
            1
            + 0.085 * math.cos(math.tau * 3 * t - theta)
        )
        lip = max(0, -math.sin(theta)) ** 6

        return (
            tip
            + axis * (1.65 * t + flare * 0.10 * lip)
            + right * (
                radius
                * relief
                * math.cos(theta)
                * (1 + 0.10 * flare)
            )
            + up * (
                radius
                * relief
                * math.sin(theta)
                * (1 + 0.22 * flare)
            )
        )

    profile = (
        (0, 0.025),
        (0.04, 0.075),
        (0.10, 0.095),
        (0.15, 0.15),
        (0.21, 0.14),
        (0.27, 0.23),
        (0.33, 0.205),
        (0.39, 0.32),
        (0.45, 0.30),
        (0.51, 0.42),
        (0.57, 0.44),
        (0.63, 0.55),
        (0.70, 0.63),
        (0.77, 0.67),
        (0.84, 0.66),
        (0.91, 0.62),
    )

    rings = [
        builder.ring([
            shell_point(t, radius, j * math.tau / n)
            for j in range(n)
        ])
        for t, radius in profile
    ]

    builder.face(reversed(rings[0]), SLOTS["white"])

    for i in range(1, len(rings)):
        t = (profile[i - 1][0] + profile[i][0]) / 2

        colors = [
            (
                SLOTS["coral"]
                if 0.12 < (3 * t - (j + 0.5) / n) % 1 < 0.34
                else SLOTS["white"]
            )
            for j in range(n)
        ]

        builder.bridge(
            rings[i - 1],
            rings[i],
            colors,
            True,
        )

    previous = rings[-1]
    mouth = None

    for t, radius, flare, slot in (
        (0.98, 0.64, 0.75, "white"),
        (1.015, 0.675, 1, "white"),
        (1.035, 0.66, 1, "blush"),
        (1.035, 0.60, 1, "coral"),
        (1.005, 0.565, 0.9, "coral"),
        (0.94, 0.51, 0.65, "blush"),
        (0.85, 0.43, 0.35, "coral"),
        (0.76, 0.29, 0, "coral"),
        (0.72, 0.12, 0, "wood"),
    ):
        ring = builder.ring([
            shell_point(t, radius, j * math.tau / n, flare)
            for j in range(n)
        ])

        builder.bridge(
            previous,
            ring,
            SLOTS[slot],
            True,
        )
        previous = ring

        if mouth is None and t == 1.035:
            mouth = Vector(
                builder.vertices[ring[3 * n // 4]]
            )

    builder.face(previous, SLOTS["wood"])

    lower, upper = bounds(builder.vertices[first:])
    scale = 1.80 / (upper.z - lower.z)

    origin = Vector((
        (lower.x + upper.x) / 2,
        (lower.y + upper.y) / 2,
        lower.z,
    ))
    offset = Vector((-0.02, -0.10, 0.60))

    def place(point):
        return (Vector(point) - origin) * scale + offset

    for i in range(first, len(builder.vertices)):
        builder.vertices[i] = tuple(place(builder.vertices[i]))

    mouth = place(mouth)

    assert axis.dot(Vector((0, -1, 0))) > 0.65
    assert mouth.y < 0

    return mouth, axis, up


def build_fountain():
    builder = Builder()
    sand, white, water = (
        SLOTS[key] for key in ("sand", "white", "water")
    )

    builder.radial([
        (0, 1.14, sand),
        (0.04, 1.23, sand),
        (0.10, 1.27, sand),
        (0.23, 1.30, sand),
        (0.34, 1.30, sand),
        (0.425, 1.25, sand),
        (0.47, 1.17, white),
        (0.435, 1.08, white),
        (0.33, 1.03, sand),
        (0.18, 0.94, sand),
        (0.16, 0.16, sand),
    ])

    builder.radial([
        (0.305, 1.005, water),
        (0.335, 1.02, water),
    ])

    builder.rock(
        (-0.24, 0.31, 0.68),
        (0.56, 0.43, 0.88),
        SLOTS["basalt"],
        0.15,
    )

    mouth, axis, up = build_shell(builder)

    start = mouth - axis * 0.035 + up * 0.032
    impact = Vector((
        start.x + 0.035,
        start.y - 0.34,
        0.325,
    ))

    distance = math.hypot(impact.x, impact.y)

    if distance > 0.72:
        impact.x *= 0.72 / distance
        impact.y *= 0.72 / distance

    assert impact.y < start.y - 0.1

    points = []

    for i in range(9):
        t = i / 8
        point = start.lerp(impact, t)
        point.z = (
            start.z
            + 0.045 * t
            - (start.z - impact.z + 0.045) * t * t
        )
        points.append(point)

    builder.tube(
        points,
        [0.070 + 0.020 * i / 8 for i in range(9)],
        water,
    )

    for radius, thickness in (
        (0.15, 0.014),
        (0.245, 0.011),
    ):
        builder.ripple(
            (impact.x, impact.y, 0.343),
            radius,
            thickness,
            white,
        )

    builder.star(
        (-0.69, -0.88, 0.455),
        0.19,
        0.22,
        SLOTS["coral"],
    )
    builder.star(
        (0.96, -0.54, 0.455),
        0.16,
        -0.30,
        SLOTS["yellow"],
    )

    builder.rock(
        (-1.05, 0.22, 0.46),
        (0.16, 0.14, 0.17),
        SLOTS["basalt"],
        0.18,
    )
    builder.rock(
        (0.86, 0.64, 0.46),
        (0.17, 0.13, 0.16),
        SLOTS["basalt"],
        -0.17,
    )
    builder.rock(
        (0.71, 0.82, 0.47),
        (0.10, 0.09, 0.10),
        sand,
    )

    for leaf_start, length, width, angle in (
        ((0.67, 0.61, 0.48), 0.37, 0.18, 1.60),
        ((0.70, 0.60, 0.48), 0.33, 0.16, 0.50),
        ((-0.94, 0.20, 0.48), 0.30, 0.16, 1.40),
    ):
        builder.leaf(
            leaf_start,
            length,
            width,
            angle,
            SLOTS["green"],
        )

    obj = builder.finish()

    markers = {
        "mouth": tuple(start - Vector((0, 0, 1.2))),
        "impact": tuple(impact - Vector((0, 0, 1.2))),
        "axis": tuple(axis),
    }

    print("DIRECTION", json.dumps(markers))
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

    assert (
        start + (accessor["count"] - 1) * stride + size
        <= view.get("byteOffset", 0) + view["byteLength"]
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
        chunks[kind] = data[offset + 8:offset + 8 + size]
        offset += 8 + size

    assert offset == len(data)

    document = json.loads(chunks[b"JSON"])
    binary = chunks[b"BIN\x00"]

    assert len(document["buffers"]) == 1
    assert "uri" not in document["buffers"][0]

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]

    assert mesh["name"] == NAME
    assert material["name"] == "palette"
    assert node["name"] == NAME
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

    lower, upper = bounds(points)

    assert (
        upper - lower - Vector((2.6, 2.4, 2.6))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON

    # Blender −Y는 Y-up GLB의 +Z로 변환된다.
    def yup(point):
        x, y, z = point
        return Vector((x, z, -y))

    assert yup(markers["axis"]).z > 0.65
    assert (
        yup(markers["impact"]).z
        > yup(markers["mouth"]).z + 0.1
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
        "blender_dimensions": tuple(TARGET),
        "glb_dimensions": tuple(upper - lower),
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


def clone_for_preview(scene, source, position, height):
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
    scale = height / max(upper - lower)

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
            screen_right * -3.0,
            3.4,
        )
    ]

    labels = list(REFERENCE_NAMES)

    for index, label in enumerate(labels):
        column = index % 4
        row = index // 4

        position = screen_right * (-0.1 + column * 1.5)
        position += Vector((
            0,
            0,
            1.7 if row == 0 else 0,
        ))

        clones.append(clone_for_preview(
            scene,
            references[label],
            position,
            1.35,
        ))

    print(
        "COMPARE: shellFountain left; original references right:",
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

    obj, markers = build_fountain()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, markers)

    if not args.skip_render:
        render_comparison(obj, references)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
