"""
Blender 5.3:
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --disable-autoexec --python /absolute/path/jangseung.py
렌더 생략: 명령 끝에 -- --skip-render
원본과 저장소는 저장하지 않으며, 출력은 OUTPUT 아래에만 생성한다.
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
OUTPUT = ROOT / "codex-work/jangseung"
TARGET = Vector((0.86, 0.86, 4.3))

WOOD, WOOD_DARK, RED, BLACK = 18, 14, 16, 22
SLOT_COLORS = {
    WOOD: "F8A658",
    WOOD_DARK: "B36D45",
    RED: "ED3F1C",
    BLACK: "1E0603",
}
EPSILON = 1e-5


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def bounds(points):
    points = list(points)
    require(bool(points), "Empty geometry")
    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.smooth = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)
        return list(range(start, len(self.vertices)))

    def face(self, vertices, slot=WOOD, smooth=False):
        self.faces.append(tuple(vertices))
        self.slots.append(slot)
        self.smooth.append(smooth)

    def bridge(self, first, second, slot=WOOD, smooth=False):
        require(len(first) == len(second), "Mismatched rings")
        for i in range(len(first)):
            j = (i + 1) % len(first)
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
                smooth,
            )

    def close(self, rings, slot=WOOD, smooth=False):
        self.face(reversed(rings[0]), slot)
        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot, smooth)
        self.face(rings[-1], slot)

    def loft(self, sections, n=10, slot=WOOD, smooth=False):
        rings = [
            self.ring([
                (
                    rx * math.cos(i * math.tau / n),
                    cy + ry * math.sin(i * math.tau / n),
                    z,
                )
                for i in range(n)
            ])
            for z, rx, ry, cy in sections
        ]
        self.close(rings, slot, smooth)

    def ellipsoid(
        self,
        center,
        radius,
        slot=WOOD,
        n=8,
        lat=4,
        smooth=True,
    ):
        cx, cy, cz = center
        rx, ry, rz = radius
        bottom = self.ring([(cx, cy, cz - rz)])[0]
        top = self.ring([(cx, cy, cz + rz)])[0]

        rings = [
            self.ring([
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
            ])
            for j in range(1, lat)
        ]

        for i in range(n):
            self.face(
                (bottom, rings[0][(i + 1) % n], rings[0][i]),
                slot,
                smooth,
            )

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot, smooth)

        for i in range(n):
            self.face(
                (rings[-1][i], rings[-1][(i + 1) % n], top),
                slot,
                smooth,
            )

    def tube(
        self,
        coords,
        radius,
        depth=None,
        slot=WOOD,
        n=6,
        smooth=False,
    ):
        points = [Vector(p) for p in coords]
        depth = radius if depth is None else depth
        rings = []

        for i, point in enumerate(points):
            tangent = (
                points[min(i + 1, len(points) - 1)]
                - points[max(0, i - 1)]
            ).normalized()
            require(tangent.length > 0.5, "Zero-length tube tangent")

            reference = Vector((0, -1, 0))
            if abs(tangent.dot(reference)) > 0.9:
                reference = Vector((1, 0, 0))

            side = (
                reference - tangent * reference.dot(tangent)
            ).normalized()
            up = tangent.cross(side).normalized()

            rings.append(self.ring([
                point
                + side * (depth * math.cos(j * math.tau / n))
                + up * (radius * math.sin(j * math.tau / n))
                for j in range(n)
            ]))

        self.close(rings, slot, smooth)

    def relief(self, outline, back, front, slot=WOOD):
        self.close([
            self.ring([(x, back, z) for x, z in outline]),
            self.ring([(x, front, z) for x, z in outline]),
        ], slot)

    def recess(self, indices):
        # 몸통 면 자체를 대체하여 붙인 명패가 아닌 함몰부를 만든다.
        outer = [Vector(self.vertices[i]) for i in indices]
        center = sum(outer, Vector()) / len(outer)

        inner = self.ring([
            (
                center.x + (p.x - center.x) * 0.79,
                p.y + 0.038,
                center.z + (p.z - center.z) * 0.90,
            )
            for p in outer
        ])

        for i in range(4):
            j = (i + 1) % 4
            self.face(
                (indices[i], indices[j], inner[j], inner[i]),
                WOOD_DARK,
            )

        self.face(inner, WOOD)

    def log(self):
        outline = [
            (-0.245, -0.26),
            (0.245, -0.26),
            (0.35, -0.17),
            (0.385, 0.02),
            (0.30, 0.23),
            (0.13, 0.31),
            (-0.13, 0.31),
            (-0.30, 0.23),
            (-0.385, 0.02),
            (-0.35, -0.17),
        ]
        sections = [
            (0.00, 0.94),
            (0.12, 1.00),
            (0.34, 1.00),
            (2.12, 0.93),
            (2.24, 0.98),
            (2.55, 1.02),
            (3.25, 1.05),
            (3.67, 1.00),
            (3.76, 0.84),
            (3.80, 0.75),
        ]

        rings = [
            self.ring([
                (x * scale, y * scale, z)
                for x, y in outline
            ])
            for z, scale in sections
        ]

        self.face(reversed(rings[0]), WOOD_DARK)

        for section, (first, second) in enumerate(
            zip(rings, rings[1:])
        ):
            for i in range(len(outline)):
                j = (i + 1) % len(outline)
                quad = (first[i], first[j], second[j], second[i])

                if section == 2 and i == 0:
                    self.recess(quad)
                    continue

                slot = WOOD_DARK if i in (2, 4, 7) else WOOD
                self.face(quad, slot)

        self.face(rings[-1], WOOD_DARK)

        for sign, z in ((-1, 0.16), (1, 2.29)):
            x = sign * 0.15
            self.relief(
                [
                    (x - 0.006, z - 0.065),
                    (x + 0.009, z + 0.09),
                    (x + 0.015, z + 0.015),
                ],
                -0.253,
                -0.265,
                WOOD_DARK,
            )


def add_heaven_face(builder):
    for sign in (-1, 1):
        builder.ellipsoid(
            (sign * 0.17, -0.265, 3.38),
            (0.142, 0.080, 0.145),
        )
        builder.ellipsoid(
            (sign * 0.17, -0.339, 3.38),
            (0.047, 0.019, 0.059),
            slot=BLACK,
        )
        builder.tube(
            [
                (sign * 0.06, -0.285, 3.56),
                (sign * 0.16, -0.295, 3.62),
                (sign * 0.29, -0.255, 3.57),
            ],
            0.035,
            depth=0.028,
            slot=WOOD_DARK,
        )
        builder.ellipsoid(
            (sign * 0.27, -0.245, 3.03),
            (0.059, 0.025, 0.064),
            slot=RED,
        )

    builder.loft(
        [
            (2.97, 0.062, 0.060, -0.295),
            (3.02, 0.099, 0.108, -0.323),
            (3.12, 0.092, 0.117, -0.319),
            (3.41, 0.050, 0.055, -0.275),
            (3.50, 0.036, 0.030, -0.260),
        ],
        n=8,
    )

    builder.relief(
        [
            (-0.27, 2.87),
            (-0.22, 2.67),
            (0.0, 2.61),
            (0.22, 2.67),
            (0.27, 2.87),
            (0.21, 2.95),
            (0.0, 2.92),
            (-0.21, 2.95),
        ],
        -0.260,
        -0.308,
        BLACK,
    )

    # 치아도 목재색으로 두어 채색 범위를 볼과 검은 부위로 제한한다.
    for x in (-0.16, -0.08, 0.0, 0.08, 0.16):
        z = 2.850 + 0.028 * abs(x) / 0.16
        builder.relief(
            [
                (x - 0.030, z - 0.036),
                (x + 0.030, z - 0.036),
                (x + 0.030, z + 0.043),
                (x - 0.030, z + 0.043),
            ],
            -0.300,
            -0.328,
        )

        z = 2.688 + 0.038 * abs(x) / 0.16
        builder.relief(
            [
                (x - 0.026, z - 0.020),
                (x + 0.026, z - 0.020),
                (x + 0.026, z + 0.030),
                (x - 0.026, z + 0.030),
            ],
            -0.300,
            -0.325,
        )

    for sign in (-1, 1):
        builder.relief(
            [
                (sign * 0.184, 2.904),
                (sign * 0.241, 2.923),
                (sign * 0.214, 2.742),
            ],
            -0.306,
            -0.348,
        )

        builder.tube(
            [
                (sign * 0.035, -0.305, 2.99),
                (sign * 0.12, -0.301, 2.965),
                (sign * 0.23, -0.272, 2.99),
            ],
            0.023,
            depth=0.016,
            slot=WOOD_DARK,
        )

        builder.tube(
            [
                (sign * 0.23, -0.262, 2.64),
                (sign * 0.18, -0.275, 2.49),
                (sign * 0.08, -0.274, 2.38),
            ],
            0.040,
            depth=0.025,
            slot=WOOD_DARK,
        )

    builder.relief(
        [
            (-0.105, 2.61),
            (-0.092, 2.42),
            (0, 2.32),
            (0.092, 2.42),
            (0.105, 2.61),
        ],
        -0.253,
        -0.295,
        WOOD_DARK,
    )


def add_heaven_hat(builder):
    builder.loft(
        [
            (3.73, 0.335, 0.285, 0.015),
            (3.80, 0.355, 0.305, 0.020),
            (3.86, 0.305, 0.270, 0.035),
            (4.14, 0.285, 0.250, 0.065),
            (4.30, 0.230, 0.205, 0.065),
        ],
        n=10,
        slot=BLACK,
    )

    for sign in (-1, 1):
        builder.relief(
            [
                (sign * 0.265, 3.96),
                (sign * 0.420, 3.99),
                (sign * 0.430, 4.15),
                (sign * 0.290, 4.10),
            ],
            0.14,
            0.075,
            BLACK,
        )


def add_earth_face(builder):
    for sign in (-1, 1):
        builder.ellipsoid(
            (sign * 0.17, -0.260, 3.36),
            (0.133, 0.055, 0.071),
        )
        builder.ellipsoid(
            (sign * 0.17, -0.310, 3.355),
            (0.025, 0.012, 0.032),
            slot=BLACK,
        )
        builder.tube(
            [
                (sign * 0.055, -0.277, 3.39),
                (sign * 0.15, -0.313, 3.425),
                (sign * 0.26, -0.270, 3.40),
            ],
            0.018,
            depth=0.011,
            slot=WOOD_DARK,
        )
        builder.tube(
            [
                (sign * 0.07, -0.270, 3.54),
                (sign * 0.17, -0.280, 3.57),
                (sign * 0.27, -0.247, 3.54),
            ],
            0.020,
            depth=0.012,
            slot=WOOD_DARK,
        )
        builder.ellipsoid(
            (sign * 0.26, -0.254, 3.04),
            (0.065, 0.024, 0.065),
            slot=RED,
        )

    builder.loft(
        [
            (3.00, 0.047, 0.042, -0.284),
            (3.045, 0.075, 0.082, -0.300),
            (3.14, 0.062, 0.086, -0.295),
            (3.39, 0.035, 0.038, -0.267),
        ],
        n=8,
    )

    builder.tube(
        [
            (-0.205, -0.270, 2.91),
            (-0.13, -0.284, 2.83),
            (0, -0.293, 2.79),
            (0.13, -0.284, 2.83),
            (0.205, -0.270, 2.91),
        ],
        0.018,
        depth=0.011,
        slot=BLACK,
    )

    builder.tube(
        [
            (-0.14, -0.268, 2.765),
            (0, -0.279, 2.735),
            (0.14, -0.268, 2.765),
        ],
        0.025,
        depth=0.015,
    )


def add_earth_hair(builder):
    builder.loft(
        [
            (3.69, 0.300, 0.257, 0.005),
            (3.78, 0.347, 0.293, 0.005),
            (3.98, 0.322, 0.278, 0.025),
            (4.14, 0.218, 0.205, 0.045),
            (4.18, 0.105, 0.115, 0.065),
        ],
        n=10,
        slot=BLACK,
    )

    builder.ellipsoid(
        (0, 0.265, 4.08),
        (0.185, 0.185, 0.22),
        slot=BLACK,
        n=10,
        lat=4,
    )

    builder.tube(
        [
            (-0.40, 0.268, 4.075),
            (0.43, 0.268, 4.075),
        ],
        0.021,
        slot=WOOD_DARK,
    )

    builder.ellipsoid(
        (-0.395, 0.268, 4.075),
        (0.035, 0.041, 0.041),
        n=8,
        lat=3,
        smooth=False,
    )


def prepare_palette():
    require(PALETTE.is_file(), "Missing palette: " + str(PALETTE))
    image = bpy.data.images.load(str(PALETTE), check_existing=True)
    require(tuple(image.size) == (128, 4), "Expected 128 x 4 palette")
    image.colorspace_settings.name = "sRGB"

    pixels = image.pixels[:]
    for slot, expected in SLOT_COLORS.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        actual = "".join(
            f"{round(c * 255):02X}"
            for c in pixels[offset:offset + 3]
        )
        require(
            actual == expected,
            f"Palette slot {slot}: {actual} != {expected}",
        )

    image.pack()

    material = bpy.data.materials.get("palette")
    require(
        material is not None and material.use_nodes,
        "Missing palette material",
    )

    textures = [
        node
        for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    require(len(textures) == 1, "Expected one palette image node")

    texture = textures[0]
    texture.image = image
    texture.mute = False
    texture.interpolation = "Closest"
    material.node_tree.nodes.active = texture

    require(
        texture.outputs["Color"].is_linked,
        "Unconnected palette texture",
    )
    return material


def build(name, material):
    require(
        bpy.data.objects.get(name) is None,
        "Object name already exists: " + name,
    )

    builder = Builder()
    builder.log()

    if name == "jangseungHeaven":
        add_heaven_face(builder)
        add_heaven_hat(builder)
    elif name == "jangseungEarth":
        add_earth_face(builder)
        add_earth_hair(builder)
    else:
        raise ValueError(name)

    lower, upper = bounds(builder.vertices)
    center = (lower + upper) / 2
    size = upper - lower

    vertices = [
        tuple(
            (point[a] - center[a]) * TARGET[a] / size[a]
            for a in range(3)
        )
        for point in builder.vertices
    ]

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], builder.faces)
    mesh.update()

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    require(
        all(len(edge.link_faces) == 2 for edge in bm.edges),
        "Open mesh component",
    )
    bm.to_mesh(mesh)
    bm.free()

    require(
        len(mesh.polygons) == len(builder.slots),
        "Face metadata mismatch",
    )

    uv = mesh.uv_layers.new(name="UVMap")
    mesh.materials.append(material)

    for polygon, slot, smooth in zip(
        mesh.polygons,
        builder.slots,
        builder.smooth,
    ):
        polygon.use_smooth = smooth
        for loop_index in polygon.loop_indices:
            uv.data[loop_index].uv = ((slot + 0.5) / 32, 0.5)

    mesh.update()
    mesh.calc_loop_triangles()

    require(
        all(triangle.area > 1e-10 for triangle in mesh.loop_triangles),
        "Degenerate triangle",
    )
    require(not mesh.color_attributes, "Unexpected vertex colors")

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    require(
        ((upper - lower) - TARGET).length < EPSILON,
        "Incorrect Blender dimensions",
    )
    require(
        ((upper + lower) / 2).length < EPSILON,
        "Incorrect bounding center",
    )

    for polygon in mesh.polygons:
        values = [
            tuple(uv.data[index].uv)
            for index in polygon.loop_indices
        ]
        require(
            all(value == values[0] for value in values),
            "Nonconstant face UV",
        )

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.update()

    require(
        (obj.dimensions - TARGET).length < EPSILON,
        "Object dimensions mismatch",
    )
    require(
        (obj.scale - Vector((1, 1, 1))).length < EPSILON,
        "Nonidentity scale",
    )
    return obj


def read_glb(path):
    data = path.read_bytes()
    require(len(data) >= 20, "Truncated GLB")

    magic, version, length = struct.unpack_from("<4sII", data)
    require(
        (magic, version, length) == (b"glTF", 2, len(data)),
        "Invalid GLB header",
    )

    chunks = {}
    offset = 12

    while offset < len(data):
        size, kind = struct.unpack_from("<I4s", data, offset)
        offset += 8
        require(
            offset + size <= len(data) and size % 4 == 0,
            "Invalid GLB chunk",
        )
        require(kind not in chunks, "Repeated GLB chunk")
        chunks[kind] = data[offset:offset + size]
        offset += size

    require(offset == len(data), "GLB length mismatch")
    require(
        b"JSON" in chunks and b"BIN\x00" in chunks,
        "Missing GLB chunks",
    )
    return json.loads(chunks[b"JSON"]), chunks[b"BIN\x00"]


def accessor_values(document, binary, index):
    accessor = document["accessors"][index]
    require("sparse" not in accessor, "Unexpected sparse accessor")
    require(
        not accessor.get("normalized", False),
        "Unexpected normalized accessor",
    )

    formats = {
        5121: ("B", 1),
        5123: ("H", 2),
        5125: ("I", 4),
        5126: ("f", 4),
    }
    widths = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}

    fmt, component_size = formats[accessor["componentType"]]
    width = widths[accessor["type"]]
    view = document["bufferViews"][accessor["bufferView"]]
    require(view["buffer"] == 0, "Unexpected external buffer")

    stride = view.get("byteStride", component_size * width)
    local_offset = accessor.get("byteOffset", 0)
    end = (
        local_offset
        + (accessor["count"] - 1) * stride
        + component_size * width
    )
    require(end <= view["byteLength"], "Accessor outside buffer view")

    start = view.get("byteOffset", 0) + local_offset
    return [
        struct.unpack_from(
            "<" + fmt * width,
            binary,
            start + i * stride,
        )
        for i in range(accessor["count"])
    ]


def verify_glb(path, obj):
    document, binary = read_glb(path)

    require(
        len(document["meshes"]) == len(document["materials"]) == 1,
        "Unexpected mesh/material count",
    )
    require(
        document["meshes"][0]["name"] == obj.name,
        "GLB mesh name mismatch",
    )
    require(
        document["materials"][0]["name"] == "palette",
        "GLB material mismatch",
    )
    require(
        len(document["meshes"][0]["primitives"]) == 1,
        "Expected one primitive",
    )

    primitive = document["meshes"][0]["primitives"][0]
    require(
        primitive.get("mode", 4) == 4 and primitive["material"] == 0,
        "Invalid primitive",
    )

    attributes = primitive["attributes"]
    require(
        {"POSITION", "NORMAL", "TEXCOORD_0"} <= attributes.keys(),
        "Missing attributes",
    )
    require(
        "COLOR_0" not in attributes,
        "Unexpected exported vertex colors",
    )

    positions = accessor_values(
        document, binary, attributes["POSITION"],
    )
    normals = accessor_values(
        document, binary, attributes["NORMAL"],
    )
    uvs = accessor_values(
        document, binary, attributes["TEXCOORD_0"],
    )
    indices = [
        value[0]
        for value in accessor_values(
            document, binary, primitive["indices"],
        )
    ]

    require(
        len(positions) == len(normals) == len(uvs),
        "Attribute count mismatch",
    )
    require(len(indices) % 3 == 0, "Invalid triangle indices")
    require(
        all(0 <= index < len(positions) for index in indices),
        "Invalid vertex index",
    )

    triangles = len(indices) // 3
    require(
        triangles == len(obj.data.loop_triangles),
        "Export triangle count mismatch",
    )
    require(
        all(math.isfinite(value) for p in positions for value in p),
        "Nonfinite position",
    )
    require(
        all(abs(Vector(normal).length - 1) < 0.001 for normal in normals),
        "Invalid normal",
    )

    for u, v in uvs:
        require(abs(v - 0.5) < EPSILON, "Incorrect palette V")
        require(
            any(
                abs(u - (slot + 0.5) / 32) < EPSILON
                for slot in SLOT_COLORS
            ),
            "Incorrect palette U",
        )

    for i in range(0, len(indices), 3):
        a, b, c = [
            Vector(positions[index])
            for index in indices[i:i + 3]
        ]
        require(
            (b - a).cross(c - a).length > 2e-10,
            "Degenerate exported triangle",
        )

    lower, upper = bounds(positions)
    expected = Vector((TARGET.x, TARGET.z, TARGET.y))
    require(
        ((upper - lower) - expected).length < EPSILON,
        "GLB dimensions mismatch",
    )
    require(
        ((upper + lower) / 2).length < EPSILON,
        "GLB center mismatch",
    )

    position_accessor = document["accessors"][attributes["POSITION"]]
    require(
        (Vector(position_accessor["min"]) - lower).length < EPSILON,
        "Invalid POSITION minimum",
    )
    require(
        (Vector(position_accessor["max"]) - upper).length < EPSILON,
        "Invalid POSITION maximum",
    )

    nodes = document["nodes"]
    require(
        len(nodes) == 1 and nodes[0].get("mesh") == 0,
        "Unexpected GLB nodes",
    )
    require(nodes[0]["name"] == obj.name, "GLB node name mismatch")
    require("matrix" not in nodes[0], "Unexpected GLB node matrix")
    require(
        Vector(nodes[0].get("translation", (0, 0, 0))).length < EPSILON,
        "Unexpected translation",
    )
    require(
        (
            Vector(nodes[0].get("scale", (1, 1, 1)))
            - Vector((1, 1, 1))
        ).length < EPSILON,
        "Unexpected scale",
    )

    rotation = nodes[0].get("rotation", (0, 0, 0, 1))
    require(
        Vector(rotation[:3]).length < EPSILON
        and abs(abs(rotation[3]) - 1) < EPSILON,
        "Unexpected rotation",
    )

    require(
        len(document["images"]) == len(document["textures"]) == 1,
        "Unexpected GLB images",
    )

    texture_info = (
        document["materials"][0]["pbrMetallicRoughness"]["baseColorTexture"]
    )
    require(
        texture_info["index"] == 0,
        "Unexpected base-color texture",
    )
    require(
        document["textures"][0]["source"] == 0,
        "Unexpected texture source",
    )

    image = document["images"][0]
    require(
        image.get("mimeType") == "image/png" and "uri" not in image,
        "Expected embedded PNG",
    )

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    require(png[:8] == b"\x89PNG\r\n\x1a\n", "Invalid palette PNG")
    require(
        struct.unpack_from(">II", png, 16) == (128, 4),
        "Wrong embedded palette size",
    )

    dimensions = upper - lower
    return {
        "file": str(path),
        "triangles": triangles,
        "dimensions_blender": [
            round(dimensions.x, 6),
            round(dimensions.z, 6),
            round(dimensions.y, 6),
        ],
    }


def export_glb(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    path = OUTPUT / (obj.name + ".glb")
    result = bpy.ops.export_scene.gltf(
        filepath=str(path),
        check_existing=False,
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
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        will_save_settings=False,
    )

    require(result == {"FINISHED"}, "GLB export failed")
    return verify_glb(path, obj)


def clone_for_preview(scene, source, height, x, depsgraph):
    evaluated = source.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(
        evaluated,
        preserve_all_data_layers=True,
        depsgraph=depsgraph,
    )

    points = [
        evaluated.matrix_world @ vertex.co
        for vertex in mesh.vertices
    ]
    lower, upper = bounds(points)
    center = Vector((
        (lower.x + upper.x) / 2,
        (lower.y + upper.y) / 2,
        lower.z,
    ))
    factor = height / (upper.z - lower.z)

    for vertex, point in zip(mesh.vertices, points):
        vertex.co = (
            (point - center) * factor
            + Vector((x, 0, 0))
        )

    mesh.update()
    clone = bpy.data.objects.new("preview-" + source.name, mesh)
    scene.collection.objects.link(clone)
    return clone


def make_render_scene():
    scene = bpy.data.scenes.new("jangseung-preview")
    scene.render.engine = "BLENDER_WORKBENCH"

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "WORLD"
    shading.show_shadows = True
    shading.show_cavity = True

    scene.world = bpy.data.worlds.new("jangseung-preview-world")
    scene.world.color = (0.045, 0.045, 0.045)
    scene.view_settings.view_transform = "Standard"

    scene.render.resolution_x = 1800
    scene.render.resolution_y = 1050
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.use_file_extension = True

    camera = bpy.data.objects.new(
        "jangseung-camera",
        bpy.data.cameras.new("jangseung-camera"),
    )
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type = "ORTHO"
    camera.data.clip_end = 200
    return scene


def render_comparison(objects, references):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    scene = make_render_scene()

    layout = [
        (objects[0], 4.3, -4.20),
        (objects[1], 4.3, -2.90),
        (references[0], 4.3, -1.10),
        (references[1], 1.60, 1.35),
        (references[2], 1.50, 4.00),
    ]

    clones = [
        clone_for_preview(scene, source, height, x, depsgraph)
        for source, height, x in layout
    ]

    points = [
        vertex.co.copy()
        for clone in clones
        for vertex in clone.data.vertices
    ]

    direction = Vector((0.32, -1.0, 0.27)).normalized()
    rotation = (-direction).to_track_quat("-Z", "Y")
    right = rotation @ Vector((1, 0, 0))
    up = rotation @ Vector((0, 1, 0))

    projected_x = [point.dot(right) for point in points]
    projected_y = [point.dot(up) for point in points]

    center = (
        right * ((min(projected_x) + max(projected_x)) / 2)
        + up * ((min(projected_y) + max(projected_y)) / 2)
    )

    camera = scene.camera
    camera.location = center + direction * 25
    camera.rotation_euler = rotation.to_euler()

    aspect = scene.render.resolution_x / scene.render.resolution_y
    camera.data.ortho_scale = 1.13 * max(
        max(projected_x) - min(projected_x),
        (max(projected_y) - min(projected_y)) * aspect,
    )

    scene.render.filepath = str(OUTPUT / "compare.png")
    bpy.ops.render.render(write_still=True, scene=scene.name)

    require(
        (OUTPUT / "compare.png").is_file(),
        "Missing comparison render",
    )
    print(
        "compare.png 왼쪽부터:",
        ", ".join(source.name for source, _, _ in layout),
    )


def load_source():
    require(bpy.app.version[:2] == (5, 3), "Blender 5.3 is required")
    require(
        "--disable-autoexec" in sys.argv,
        "Start Blender with --disable-autoexec",
    )
    require(SOURCE.is_file(), "Missing source: " + str(SOURCE))

    bpy.ops.wm.open_mainfile(
        filepath=str(SOURCE),
        load_ui=False,
        use_scripts=False,
    )

    source_scene = bpy.context.scene
    material = prepare_palette()

    reference_names = (
        "refStatuePhysicalDynamic",
        "benchPhysicalDynamic",
        "body.001",
    )

    references = []
    for name in reference_names:
        obj = bpy.data.objects.get(name)
        require(
            obj is not None and obj.type == "MESH",
            "Missing source reference: " + name,
        )
        require(
            obj.name in source_scene.objects,
            "Reference outside source scene: " + name,
        )
        references.append(obj)

    return source_scene, material, references


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")
    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    source_scene, material, references = load_source()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    export_scene = bpy.data.scenes.new("jangseung-export")
    bpy.context.window.scene = export_scene

    objects = [
        build(name, material)
        for name in ("jangseungHeaven", "jangseungEarth")
    ]
    results = [export_glb(obj) for obj in objects]

    if not args.skip_render:
        # 원본 장면의 depsgraph에서 modifier와 원본 변환을 평가한다.
        bpy.context.window.scene = source_scene
        for obj in objects:
            source_scene.collection.objects.link(obj)
        bpy.context.view_layer.update()

        render_comparison(objects, references)
        print("Render:", OUTPUT / "compare.png")

    for result in results:
        print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
