"""
Blender 5.3

실행:
  /Applications/Blender.app/Contents/MacOS/Blender \
    -b --factory-startup --disable-autoexec \
    --python /absolute/path/to/companions.py

출력:
  지정 OUTPUT 폴더에 GLB 3개와 compare.png.

원본 blend와 저장소 파일은 저장하거나 수정하지 않는다.
해태 정면은 +X, 동자석과 진도개 정면은 -Y.
"""

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
OUTPUT = ROOT / "codex-work/companions"

TARGETS = {
    "haetae": (1.413, 0.531, 1.376),
    "dongjaseok": (0.588, 0.762, 1.815),
    "jindo": (0.680, 0.946, 1.280),
}
EXPECTED_TRIANGLES = {
    "haetae": 2488,
    "dongjaseok": 1134,
    "jindo": 1098,
}

GREY, LIGHT, DARK, CREAM, SAND, INK = 0, 4, 6, 23, 1, 22

REFERENCES = (
    "refStatuePhysicalDynamic",
    "Cube.094",
    "body.001",
    "base",
    "benchPhysicalDynamic",
    "wood.002",
    "refJukeboxPhysicalDynamic",
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

    def face(self, ids, slot, smooth=False):
        self.faces.append(tuple(ids))
        self.slots.append(slot)
        self.smooth.append(smooth)

    def bridge(self, first, second, slot, smooth):
        for i in range(len(first)):
            j = (i + 1) % len(first)
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
                smooth,
            )

    def close(self, rings, slot, smooth):
        self.face(reversed(rings[0]), slot)
        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot, smooth)
        self.face(rings[-1], slot)

    def loft(self, sections, slot, n=12, smooth=True):
        rings = [
            self.ring([
                (
                    cx + rx * math.cos(i * math.tau / n),
                    cy + ry * math.sin(i * math.tau / n),
                    z,
                )
                for i in range(n)
            ])
            for z, rx, ry, cx, cy in sections
        ]
        self.close(rings, slot, smooth)

    def ellipsoid(self, center, radius, slot, n=10, lat=4, smooth=True):
        center = Vector(center)
        bottom = self.ring([
            center + Vector((0, 0, -radius[2]))
        ])[0]
        top = self.ring([
            center + Vector((0, 0, radius[2]))
        ])[0]

        rings = [
            self.ring([
                center + Vector((
                    radius[0]
                    * math.sin(j * math.pi / lat)
                    * math.cos(i * math.tau / n),
                    radius[1]
                    * math.sin(j * math.pi / lat)
                    * math.sin(i * math.tau / n),
                    -radius[2] * math.cos(j * math.pi / lat),
                ))
                for i in range(n)
            ])
            for j in range(1, lat)
        ]

        for i in range(n):
            j = (i + 1) % n
            self.face((bottom, rings[0][j], rings[0][i]), slot, smooth)

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, slot, smooth)

        for i in range(n):
            self.face(
                (rings[-1][i], rings[-1][(i + 1) % n], top),
                slot,
                smooth,
            )

    def tube(self, coords, radius, slot, n=6, smooth=True):
        points = [Vector(p) for p in coords]
        radii = (
            [radius] * len(points)
            if isinstance(radius, (int, float))
            else radius
        )
        assert len(points) == len(radii)

        rings = []
        previous = None

        for i, point in enumerate(points):
            tangent = (
                points[min(i + 1, len(points) - 1)]
                - points[max(i - 1, 0)]
            ).normalized()

            seed = previous if previous is not None else (
                Vector((0, 0, 1))
                if abs(tangent.z) < 0.9
                else Vector((1, 0, 0))
            )
            side = seed - tangent * seed.dot(tangent)

            if side.length < 1e-6:
                seed = Vector((0, 1, 0))
                side = seed - tangent * seed.dot(tangent)

            side.normalize()
            previous = side
            up = tangent.cross(side).normalized()

            rings.append(self.ring([
                point + radii[i] * (
                    side * math.cos(j * math.tau / n)
                    + up * math.sin(j * math.tau / n)
                )
                for j in range(n)
            ]))

        self.close(rings, slot, smooth)

    def ear(self, sign):
        outer = [
            Vector((sign * .055, -.188, 1.035)),
            Vector((sign * .229, -.129, 1.055)),
            Vector((sign * .188, -.076, 1.310)),
        ]
        center = sum(outer, Vector()) / 3
        outline = []

        for i, point in enumerate(outer):
            outline.extend((
                point.lerp(outer[(i - 1) % 3], .09),
                point.lerp(outer[(i + 1) % 3], .09),
            ))

        rings = [
            self.ring([
                center + (point - center) * scale
                + Vector((0, depth, 0))
                for point in outline
            ])
            for scale, depth in ((.90, 0), (1, .018), (.90, .100))
        ]
        self.close(rings, CREAM, False)

        inner = self.ring([
            center + (point - center) * .53
            + Vector((0, -.004, 0))
            for point in outer
        ])
        self.face(inner, SAND)


def build_haetae():
    b = Builder()

    b.ellipsoid(
        (-.16, 0, .48), (.50, .205, .30),
        LIGHT, n=12, lat=5,
    )
    b.ellipsoid((-.43, 0, .36), (.25, .215, .29), LIGHT)
    b.ellipsoid((.25, 0, .59), (.23, .20, .38), LIGHT)

    for sign in (-1, 1):
        b.ellipsoid(
            (-.43, sign * .14, .25), (.23, .11, .20), LIGHT,
        )
        b.tube(
            [
                (.29, sign * .14, .54),
                (.38, sign * .15, .28),
                (.41, sign * .15, .12),
            ],
            [.105, .079, .077],
            LIGHT,
            n=8,
        )

        for x in (-.39, .45):
            b.ellipsoid(
                (x, sign * .15, .08),
                (.17, .102, .075),
                LIGHT,
                n=8,
            )
            for dy in (-.030, .030):
                b.tube(
                    [
                        (x + .085, sign * .15 + dy, .128),
                        (x + .145, sign * .15 + dy, .094),
                    ],
                    .006,
                    GREY,
                    n=4,
                    smooth=False,
                )

    b.ellipsoid(
        (.37, 0, .98), (.29, .235, .30),
        LIGHT, n=12, lat=5,
    )
    b.ellipsoid((.57, 0, .92), (.22, .19, .16), LIGHT)
    b.ellipsoid((.67, 0, .90), (.12, .145, .09), LIGHT, n=8)
    b.ellipsoid(
        (.725, 0, .990), (.051, .072, .038),
        GREY, n=8, lat=3,
    )

    for sign in (-1, 1):
        b.ellipsoid(
            (.53, sign * .162, 1.080),
            (.089, .069, .091),
            GREY,
            n=8,
        )
        b.ellipsoid(
            (.566, sign * .192, 1.090),
            (.054, .027, .057),
            LIGHT,
            n=8,
        )
        b.ellipsoid(
            (.597, sign * .199, 1.091),
            (.015, .018, .025),
            DARK,
            n=8,
            lat=3,
        )
        b.tube(
            [
                (.44, sign * .19, 1.150),
                (.52, sign * .211, 1.184),
                (.61, sign * .166, 1.150),
            ],
            .032,
            LIGHT,
        )
        b.ellipsoid(
            (.24, sign * .195, 1.15),
            (.084, .058, .103),
            LIGHT,
            n=8,
        )
        b.tube(
            [
                (.75, 0, .875),
                (.735, sign * .075, .863),
                (.683, sign * .143, .884),
                (.628, sign * .176, .923),
            ],
            .010,
            DARK,
            n=4,
            smooth=False,
        )

        for k in range(4):
            z = .66 + k * .140
            x = .18 + .055 * math.sin(k * .7)
            path = [
                (
                    x + .064 * (1 - t * .065)
                    * math.cos(t * math.pi / 3),
                    sign * (.190 + .012 * math.sin(t * math.pi / 6)),
                    z + .064 * (1 - t * .065)
                    * math.sin(t * math.pi / 3),
                )
                for t in range(8)
            ]
            b.tube(path, .025, LIGHT, n=5)

        for x in (-.42, -.16, .02):
            b.ellipsoid(
                (x, sign * .18, .61),
                (.092, .045, .066),
                LIGHT,
                n=8,
                lat=3,
            )

    for y in (-.10, 0, .10):
        b.ellipsoid(
            (.35, y, 1.235),
            (.086, .065, .072),
            LIGHT,
            n=8,
            lat=3,
        )

    b.tube(
        [
            (-.58, .03, .42),
            (-.72, .035, .57),
            (-.71, .02, .77),
            (-.57, -.01, .85),
            (-.49, -.03, .76),
            (-.56, -.03, .70),
        ],
        [.070, .063, .060, .055, .048, .040],
        LIGHT,
        n=7,
    )
    b.tube(
        [
            (.36, -.18, .76),
            (.40, -.22, .62),
            (.39, -.225, .50),
        ],
        .026,
        GREY,
    )
    b.ellipsoid(
        (.40, -.216, .47), (.080, .060, .083), LIGHT, n=8,
    )
    b.tube(
        [(.354, -.267, .448), (.437, -.269, .448)],
        .007,
        DARK,
        n=4,
        smooth=False,
    )
    return b


def build_dongjaseok():
    b = Builder()

    b.loft([
        (0, .245, .220, 0, .025),
        (.045, .285, .242, 0, .025),
        (.12, .285, .243, 0, .025),
        (.38, .265, .230, 0, .020),
        (.78, .250, .215, 0, .010),
        (1.08, .240, .195, 0, .025),
        (1.21, .180, .160, 0, .025),
        (1.25, .145, .145, 0, .025),
    ], GREY)

    b.loft([
        (1.13, .14, .15, 0, .018),
        (1.20, .215, .205, 0, .010),
        (1.34, .256, .229, 0, .010),
        (1.51, .258, .226, 0, .025),
        (1.65, .200, .188, 0, .035),
        (1.69, .140, .140, 0, .035),
    ], GREY)

    b.ellipsoid(
        (0, .04, 1.708), (.126, .126, .107), DARK,
    )
    b.loft([
        (1.685, .132, .13, 0, .04),
        (1.706, .14, .138, 0, .04),
        (1.729, .125, .125, 0, .04),
    ], GREY, n=10)

    for sign in (-1, 1):
        b.ellipsoid(
            (sign * .251, .025, 1.420),
            (.038, .073, .085),
            GREY,
            n=8,
            lat=3,
        )
        b.ellipsoid(
            (sign * .137, -.176, 1.315),
            (.084, .043, .080),
            GREY,
            n=8,
        )
        b.tube(
            [
                (sign * .055, -.218, 1.486),
                (sign * .112, -.230, 1.501),
                (sign * .176, -.198, 1.478),
            ],
            .016,
            DARK,
            n=5,
        )
        b.tube(
            [
                (sign * .063, -.219, 1.442),
                (sign * .113, -.232, 1.435),
                (sign * .162, -.211, 1.447),
            ],
            .010,
            DARK,
            n=4,
            smooth=False,
        )
        b.tube(
            [
                (sign * .206, -.040, 1.092),
                (sign * .245, -.147, .984),
                (sign * .198, -.242, .870),
                (sign * .075, -.322, .905),
            ],
            [.073, .086, .076, .054],
            GREY,
            n=7,
        )
        b.ellipsoid(
            (sign * .063, -.330, .910),
            (.078, .068, .096),
            GREY,
            n=8,
        )

        for z in (.878, .911, .944):
            b.tube(
                [
                    (sign * .014, -.389, z),
                    (sign * .098, -.382, z + .006),
                ],
                .005,
                DARK,
                n=4,
                smooth=False,
            )

        b.tube(
            [
                (sign * .120, -.163, 1.164),
                (0, -.225, 1.005),
                (sign * .073, -.231, .820),
            ],
            .013,
            DARK,
            n=5,
            smooth=False,
        )
        b.tube(
            [
                (sign * .065, -.219, .73),
                (sign * .088, -.229, .48),
                (sign * .132, -.231, .17),
            ],
            .009,
            DARK,
            n=4,
            smooth=False,
        )

    b.ellipsoid(
        (0, -.230, 1.378), (.040, .067, .075), GREY, n=8,
    )
    b.tube(
        [
            (-.073, -.211, 1.258),
            (0, -.234, 1.247),
            (.073, -.211, 1.258),
        ],
        .010,
        DARK,
        n=5,
    )
    return b


def build_jindo():
    b = Builder()

    b.loft([
        (.045, .165, .188, 0, .080),
        (.095, .231, .248, 0, .080),
        (.32, .235, .246, 0, .090),
        (.55, .187, .195, 0, .055),
        (.77, .158, .149, 0, -.005),
        (.91, .130, .130, 0, -.025),
    ], CREAM)

    for sign in (-1, 1):
        b.ellipsoid(
            (sign * .167, .131, .238),
            (.142, .195, .215),
            CREAM,
        )
        b.tube(
            [
                (sign * .111, -.063, .650),
                (sign * .107, -.130, .333),
                (sign * .106, -.159, .087),
            ],
            [.078, .057, .053],
            CREAM,
            n=8,
        )
        b.ellipsoid(
            (sign * .108, -.207, .058),
            (.084, .141, .058),
            CREAM,
            n=8,
        )

        for dx in (-.022, .022):
            b.tube(
                [
                    (sign * .108 + dx, -.319, .072),
                    (sign * .108 + dx, -.266, .103),
                ],
                .004,
                SAND,
                n=4,
                smooth=False,
            )

    b.loft([
        (.77, .115, .125, 0, -.04),
        (.86, .180, .177, 0, -.062),
        (.99, .212, .185, 0, -.075),
        (1.11, .178, .162, 0, -.062),
        (1.16, .120, .119, 0, -.045),
    ], CREAM, n=10)

    b.ear(-1)
    b.ear(1)

    b.ellipsoid(
        (0, -.249, .914), (.127, .160, .081), CREAM,
    )
    b.ellipsoid(
        (0, -.387, .940), (.056, .039, .035),
        INK, n=8, lat=3,
    )
    b.tube(
        [
            (-.083, -.323, .876),
            (0, -.379, .866),
            (.083, -.323, .876),
        ],
        .006,
        INK,
        n=4,
        smooth=False,
    )

    for sign in (-1, 1):
        b.ellipsoid(
            (sign * .135, -.211, 1.033),
            (.030, .019, .028),
            INK,
            n=8,
            lat=3,
        )
        b.ellipsoid(
            (sign * .128, -.227, 1.044),
            (.007, .004, .007),
            CREAM,
            n=6,
            lat=3,
        )
        b.tube(
            [
                (sign * .082, -.204, 1.083),
                (sign * .132, -.199, 1.096),
                (sign * .171, -.166, 1.077),
            ],
            .013,
            CREAM,
            n=5,
        )

    b.ellipsoid(
        (0, -.128, .616), (.123, .083, .176), CREAM,
    )
    b.tube(
        [
            (0, .25, .25),
            (.09, .34, .38),
            (.19, .33, .54),
            (.205, .20, .65),
            (.15, .095, .65),
            (.065, .080, .58),
            (.072, .165, .525),
        ],
        [.074, .086, .088, .086, .077, .063, .046],
        CREAM,
        n=8,
    )
    return b


def bounds(points):
    points = list(points)
    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


def create_object(name, builder):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(builder.vertices, [], builder.faces)
    mesh.update()

    # BMesh를 통과해도 면별 팔레트 값이 해당 면에 유지된다.
    slots = mesh.attributes.new("palette_slot", "INT", "FACE")
    for item, slot in zip(slots.data, builder.slots):
        item.value = slot
    for polygon, smooth in zip(mesh.polygons, builder.smooth):
        polygon.use_smooth = smooth

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    target = TARGETS[name]

    for vertex in mesh.vertices:
        vertex.co = Vector(tuple(
            (
                vertex.co[a] - (lower[a] + upper[a]) / 2
            ) * target[a] / (upper[a] - lower[a])
            for a in range(3)
        ))

    mesh.update()
    uv = mesh.uv_layers.new(name="UVMap")
    slots = mesh.attributes["palette_slot"]

    for polygon in mesh.polygons:
        slot = slots.data[polygon.index].value

        if polygon.normal.z < -.55:
            slot = {
                LIGHT: GREY,
                GREY: DARK,
                CREAM: SAND,
            }.get(slot, slot)

        for loop_index in polygon.loop_indices:
            uv.data[loop_index].uv = ((slot + .5) / 32, .5)

    mesh.attributes.remove(slots)
    mesh.materials.append(bpy.data.materials["palette"])

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    mesh.calc_loop_triangles()

    assert len(mesh.loop_triangles) == EXPECTED_TRIANGLES[name]
    assert all(triangle.area > 1e-10 for triangle in mesh.loop_triangles)

    lower, upper = bounds(vertex.co for vertex in mesh.vertices)
    assert ((lower + upper) / 2).length < 1e-6
    assert ((upper - lower) - Vector(target)).length < 1e-5
    assert len(mesh.materials) == 1
    assert mesh.materials[0].name == "palette"
    assert not mesh.color_attributes
    assert obj.name == mesh.name == name

    for polygon in mesh.polygons:
        values = {
            tuple(uv.data[index].uv)
            for index in polygon.loop_indices
        }
        assert len(values) == 1

    print(
        "MODEL", name,
        "triangles", len(mesh.loop_triangles),
        "dimensions", tuple(upper - lower),
    )
    return obj


def setup_palette():
    image = bpy.data.images.load(str(PALETTE), check_existing=True)
    assert tuple(image.size) == (128, 4)
    image.colorspace_settings.name = "sRGB"

    expected = {
        LIGHT: (200, 194, 193),
        GREY: (124, 118, 145),
        DARK: (87, 90, 94),
        CREAM: (255, 242, 232),
        SAND: (235, 209, 163),
        INK: (30, 6, 3),
    }

    for slot, rgb in expected.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        actual = tuple(
            round(component * 255)
            for component in image.pixels[offset:offset + 3]
        )
        assert actual == rgb, (slot, actual)

    material = bpy.data.materials["palette"]
    nodes = [
        node for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    assert nodes

    for node in nodes:
        node.image = image
        node.mute = False
        node.interpolation = "Closest"
        material.node_tree.nodes.active = node

    return image


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
        export_vertex_color="NONE",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        will_save_settings=False,
    )
    assert result == {"FINISHED"}

    raw = path.read_bytes()
    assert struct.unpack_from("<4sII", raw) == (
        b"glTF", 2, len(raw),
    )

    length, kind = struct.unpack_from("<I4s", raw, 12)
    assert kind == b"JSON"
    document = json.loads(raw[20:20 + length])

    assert (
        len(document["meshes"])
        == len(document["materials"])
        == len(document["nodes"])
        == 1
    )
    assert document["materials"][0]["name"] == "palette"
    assert (
        document["meshes"][0]["name"]
        == document["nodes"][0]["name"]
        == obj.name
    )

    primitive, = document["meshes"][0]["primitives"]
    assert primitive.get("mode", 4) == 4

    attributes = primitive["attributes"]
    assert {"POSITION", "NORMAL", "TEXCOORD_0"} <= attributes.keys()
    assert "COLOR_0" not in attributes

    accessors = document["accessors"]
    assert (
        accessors[primitive["indices"]]["count"] // 3
        == EXPECTED_TRIANGLES[obj.name]
    )

    count = accessors[attributes["POSITION"]]["count"]
    assert all(
        accessors[attributes[key]]["count"] == count
        for key in ("NORMAL", "TEXCOORD_0")
    )

    target = TARGETS[obj.name]
    half = (target[0] / 2, target[2] / 2, target[1] / 2)
    positions = accessors[attributes["POSITION"]]

    assert all(
        abs(positions["min"][axis] + half[axis]) < 1e-5
        for axis in range(3)
    )
    assert all(
        abs(positions["max"][axis] - half[axis]) < 1e-5
        for axis in range(3)
    )

    assert len(document["images"]) == len(document["textures"]) == 1
    assert document["images"][0]["mimeType"] == "image/png"
    assert "bufferView" in document["images"][0]

    node = document["nodes"][0]
    assert not node.get("children")
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]

    print("GLB verified:", path)


def preview_clone(scene, source, height):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = source.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(
        evaluated,
        depsgraph=depsgraph,
    )

    points = [
        source.matrix_world @ vertex.co
        for vertex in mesh.vertices
    ]
    lower, upper = bounds(points)
    origin = Vector((
        (lower.x + upper.x) / 2,
        (lower.y + upper.y) / 2,
        lower.z,
    ))

    for vertex, point in zip(mesh.vertices, points):
        vertex.co = (
            (point - origin) * (height / (upper.z - lower.z))
        )

    mesh.update()
    clone = bpy.data.objects.new("preview-" + source.name, mesh)
    scene.collection.objects.link(clone)
    return clone


def render_compare(objects):
    source_scene = bpy.context.window.scene
    scene = bpy.data.scenes.new("companions-compare")
    scene.render.engine = "BLENDER_WORKBENCH"

    scene.world = bpy.data.worlds.new("companions-world")
    scene.world.color = (.045, .045, .045)

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "WORLD"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"

    scene.view_settings.view_transform = "Standard"
    scene.render.resolution_x = 1800
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.use_file_extension = True

    camera = bpy.data.objects.new(
        "comparison-camera",
        bpy.data.cameras.new("comparison-camera"),
    )
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type = "ORTHO"

    direction = Vector((.60, -.80, .50)).normalized()
    camera.location = direction * 20
    camera.rotation_euler = (
        (-direction).to_track_quat("-Z", "Y").to_euler()
    )

    rotation = camera.rotation_euler.to_matrix()
    right = rotation @ Vector((1, 0, 0))
    up = rotation @ Vector((0, 1, 0))

    rows = [
        [(obj, 1.8) for obj in objects],
        [
            (bpy.data.objects[name], 1.45)
            for name in REFERENCES[:4]
        ],
        [
            (bpy.data.objects[name], 1.45)
            for name in REFERENCES[4:]
        ],
    ]
    clones = []

    for row_index, row in enumerate(rows):
        row_clones = [
            preview_clone(scene, source, height)
            for source, height in row
        ]
        widths = []

        for clone in row_clones:
            coordinates = [
                right.dot(Vector(corner))
                for corner in clone.bound_box
            ]
            widths.append(max(coordinates) - min(coordinates))

        gap = .65
        cursor = -(
            sum(widths) + gap * (len(widths) - 1)
        ) / 2

        for clone, width in zip(row_clones, widths):
            points = [
                Vector(vertex.co)
                for vertex in clone.data.vertices
            ]
            projected_x = [right.dot(point) for point in points]
            projected_y = [up.dot(point) for point in points]

            x_center = (min(projected_x) + max(projected_x)) / 2
            y_center = (min(projected_y) + max(projected_y)) / 2

            clone.location = (
                right * (cursor + width / 2 - x_center)
                + up * ((1 - row_index) * 2.55 - y_center)
            )
            cursor += width + gap

        clones.extend(row_clones)

    bpy.context.window.scene = scene
    bpy.context.view_layer.update()

    points = [
        clone.matrix_world @ vertex.co
        for clone in clones
        for vertex in clone.data.vertices
    ]
    xs = [right.dot(point) for point in points]
    ys = [up.dot(point) for point in points]

    center = (
        right * ((min(xs) + max(xs)) / 2)
        + up * ((min(ys) + max(ys)) / 2)
    )
    camera.location = center + direction * 20

    aspect = (
        scene.render.resolution_x / scene.render.resolution_y
    )
    camera.data.ortho_scale = max(
        max(xs) - min(xs),
        (max(ys) - min(ys)) * aspect,
    ) * 1.10

    scene.render.filepath = str(OUTPUT / "compare.png")
    bpy.ops.render.render(write_still=True, scene=scene.name)
    bpy.context.window.scene = source_scene

    print("Compare:", OUTPUT / "compare.png")
    print("Top: haetae, dongjaseok, jindo")
    print("Middle: statue, anvil, cauldron, lantern")
    print("Bottom: bench, hut, jukebox")


def main():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3 is required")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("Start Blender with --disable-autoexec")

    bpy.ops.wm.open_mainfile(
        filepath=str(SOURCE),
        load_ui=False,
        use_scripts=False,
    )

    for name in REFERENCES:
        obj = bpy.data.objects[name]
        assert obj.type == "MESH", name
        assert any(
            material and material.name == "palette"
            for material in obj.data.materials
        ), name

    setup_palette()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    scene = bpy.data.scenes.new("companions-export")
    bpy.context.window.scene = scene

    factories = {
        "haetae": build_haetae,
        "dongjaseok": build_dongjaseok,
        "jindo": build_jindo,
    }
    objects = [
        create_object(name, factory())
        for name, factory in factories.items()
    ]

    for obj in objects:
        export_glb(obj)

    render_compare(objects)


if __name__ == "__main__":
    main()
