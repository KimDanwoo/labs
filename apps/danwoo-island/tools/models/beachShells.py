"""
Blender 5.3

실행:
blender -b --factory-startup --disable-autoexec --python /absolute/path/to/beachShells.py

Blender 5.3 메모리 검증: 804삼각형, 닫힌 구성요소 5개, 메시/UV/GLB 직렬화 통과.
파일 저장은 실행하지 않았고, Metal 장치가 없는 환경이라 실제 PNG 렌더는 미검증.
정면은 Blender -Y이며, GLB는 +Y 위쪽 / +Z 정면으로 내보낸다.
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
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/env"

NAME = "beachShells"
EPSILON = 1e-5

SLOTS = {
    "sand": 1,
    "coral": 10,
    "pink": 17,
    "mango": 18,
    "white": 23,
}
EXPECTED = {
    1: (235, 209, 163),
    10: (228, 154, 120),
    17: (253, 230, 226),
    18: (248, 166, 88),
    23: (255, 242, 232),
}


def bounds(points):
    points = list(points)
    assert points

    return (
        Vector(tuple(min(point[axis] for point in points) for axis in range(3))),
        Vector(tuple(max(point[axis] for point in points) for axis in range(3))),
    )


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)

    assert slot in EXPECTED
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7

    return slot


def load_palette():
    assert bpy.app.version[:2] == (5, 3), bpy.app.version_string
    assert "--disable-autoexec" in sys.argv

    if not PALETTE.is_file():
        raise FileNotFoundError(PALETTE)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    for slot, expected in EXPECTED.items():
        offset = 4 * (2 * 128 + slot * 4 + 2)
        actual = tuple(
            round(pixels[offset + channel] * 255)
            for channel in range(3)
        )
        assert actual == expected, (slot, actual, expected)
        assert pixels[offset + 3] > 0.999

    image.pack()

    assert bpy.data.materials.get("palette") is None
    material = bpy.data.materials.new("palette")
    material.use_nodes = True
    material.use_backface_culling = True

    nodes = material.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Metallic"].default_value = 0
    shader.inputs["Roughness"].default_value = 0.85

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"

    links = material.node_tree.links
    links.new(uv.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])

    nodes.active = texture
    texture.select = True

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
        assert slot in EXPECTED

        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, first, second, slot):
        assert len(first) == len(second)

        for index in range(len(first)):
            following = (index + 1) % len(first)
            self.face(
                (
                    first[index],
                    first[following],
                    second[following],
                    second[index],
                ),
                slot,
            )

    def cap(self, ring, point, slot):
        center = self.ring([point])[0]

        for index in range(len(ring)):
            self.face(
                (ring[index], ring[(index + 1) % len(ring)], center),
                slot,
            )

    def part(self, name, build):
        start = len(self.vertices)
        build()
        end = len(self.vertices)

        assert name not in self.parts
        assert end > start

        points = [Vector(point) for point in self.vertices[start:end]]
        minimum = min(point.z for point in points)

        # 기울어진 나선 단면까지 포함해 각 형상의 최저점을 지면에 맞춘다.
        for index in range(start, end):
            point = Vector(self.vertices[index])
            point.z -= minimum
            self.vertices[index] = tuple(point)

        self.parts[name] = (start, end)

    def finish(self, material):
        lower, upper = bounds(self.vertices)
        center = Vector((
            (lower.x + upper.x) / 2,
            (lower.y + upper.y) / 2,
            0,
        ))
        self.vertices = [
            tuple(Vector(point) - center)
            for point in self.vertices
        ]

        assert bpy.data.objects.get(NAME) is None
        assert bpy.data.meshes.get(NAME) is None

        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        assert not mesh.validate(verbose=False)

        mesh.materials.append(material)
        layer = mesh.uv_layers.new(name="UVMap")

        for polygon, slot in zip(mesh.polygons, self.slots, strict=True):
            polygon.use_smooth = False
            polygon.material_index = 0

            for index in polygon.loop_indices:
                layer.data[index].uv = ((slot + 0.5) / 32, 0.5)

        bm = bmesh.new()
        volumes = []

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

                volumes.append(abs(volume))

            assert len(volumes) == 5
            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        radius = max(
            math.hypot(vertex.co.x, vertex.co.y)
            for vertex in mesh.vertices
        )

        assert radius <= 0.5
        assert abs(lower.z) < EPSILON
        assert upper.z <= 0.25
        assert all(vertex.co.z >= -EPSILON for vertex in mesh.vertices)
        assert abs(lower.x + upper.x) < EPSILON
        assert abs(lower.y + upper.y) < EPSILON
        assert 300 <= len(mesh.loop_triangles) <= 900
        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used = set()

        for polygon in mesh.polygons:
            assert len(polygon.vertices) == 3

            values = [
                tuple(mesh.uv_layers.active.data[index].uv)
                for index in polygon.loop_indices
            ]
            used.update(check_uv(value) for value in values)
            assert all(value == values[0] for value in values)

        assert used == set(EXPECTED)

        parts = {}

        for name, (start, end) in self.parts.items():
            part_lower, part_upper = bounds(self.vertices[start:end])
            assert abs(part_lower.z) < EPSILON

            parts[name] = {
                "min": tuple(part_lower),
                "max": tuple(part_upper),
            }

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert obj.location.length == 0
        assert tuple(obj.rotation_euler) == (0, 0, 0)
        assert tuple(obj.scale) == (1, 1, 1)
        assert [
            item for item in bpy.context.scene.objects
            if item.type == "MESH"
        ] == [obj]

        return obj, {
            "front_blender": (0, -1, 0),
            "up_blender": (0, 0, 1),
            "parts": parts,
            "closed_components": len(volumes),
            "component_volumes": sorted(volumes),
            "footprint_radius": radius,
            "footprint_diameter_upper_bound": 2 * radius,
            "palette_slots": SLOTS,
        }


def add_scallop(builder):
    hinge = Vector((-0.16, 0.11, 0))
    angle = math.radians(-12)

    def point(x, y, z):
        return hinge + Vector((
            x * math.cos(angle) - y * math.sin(angle),
            x * math.sin(angle) + y * math.cos(angle),
            z,
        ))

    rays = []

    for rib in range(8):
        crest = -68 + 17 * rib
        rays.extend((
            (crest, True),
            (crest + 7, False),
            (crest + 10, False),
        ))

    rays.append((68, True))

    apex = builder.ring([point(0, 0, 0.035)])[0]
    rings = []

    for distance in (0.16, 0.40, 0.70, 1.0):
        ring = []

        for degrees, is_crest in rays:
            theta = math.radians(degrees)
            scallop = 1.0 if is_crest else 0.965

            x = 0.235 * distance * math.sin(theta) * scallop
            y = -0.31 * distance * math.cos(theta) * scallop

            dome = 0.060 * math.sin(math.pi * distance) ** 0.85
            groove = (
                (0.009 if is_crest else -0.004)
                * math.sin(math.pi * distance / 2)
            )
            z = 0.017 + 0.018 * (1 - distance) + dome + groove

            ring.append(point(x, y, z))

        rings.append(builder.ring(ring))

    for index in range(len(rays) - 1):
        slot = SLOTS["coral"] if index % 3 == 1 else SLOTS["pink"]

        builder.face(
            (apex, rings[0][index], rings[0][index + 1]),
            slot,
        )

        for first, second in zip(rings, rings[1:]):
            builder.face(
                (
                    first[index],
                    second[index],
                    second[index + 1],
                    first[index + 1],
                ),
                slot,
            )

    boundary = (
        [apex]
        + [ring[0] for ring in rings]
        + rings[-1][1:]
        + [ring[-1] for ring in reversed(rings[:-1])]
    )
    bottom = builder.ring(
        (
            builder.vertices[index][0],
            builder.vertices[index][1],
            0,
        )
        for index in boundary
    )

    builder.bridge(boundary, bottom, SLOTS["pink"])
    builder.cap(bottom, point(0, -0.12, 0), SLOTS["sand"])


def add_conch(builder):
    center = Vector((0.15, 0.145, 0))
    sweep = math.pi * 3.25
    growth = math.log(0.13 / 0.012)

    def frame(t):
        radius = 0.012 * math.exp(growth * t)
        theta = math.pi - sweep * (1 - t)

        axis = center + Vector((
            radius * math.cos(theta),
            radius * math.sin(theta),
            0.18 - 0.115 * t,
        ))
        tangent = Vector((
            radius * (
                growth * math.cos(theta) - sweep * math.sin(theta)
            ),
            radius * (
                growth * math.sin(theta) + sweep * math.cos(theta)
            ),
            -0.115,
        )).normalized()

        side = Vector((0, 0, 1)).cross(tangent).normalized()
        up = tangent.cross(side).normalized()

        return axis, tangent, side, up, radius * 0.49

    def section(axis, side, up, radius):
        return builder.ring(
            axis
            + side * (radius * math.cos(index * math.tau / 8))
            + up * (radius * 0.90 * math.sin(index * math.tau / 8))
            for index in range(8)
        )

    rings = []

    for index in range(21):
        axis, tangent, side, up, radius = frame(index / 20)
        rings.append(section(axis, side, up, radius))

    axis, tangent, _, _, radius = frame(0)
    builder.cap(
        rings[0],
        axis - tangent * radius,
        SLOTS["white"],
    )

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, SLOTS["white"])

    axis, tangent, side, up, radius = frame(1)

    lip = section(
        axis + tangent * 0.008,
        side,
        up,
        radius * 1.06,
    )
    inside = section(
        axis + tangent * 0.008,
        side,
        up,
        radius * 0.77,
    )
    throat = section(
        axis - tangent * 0.027,
        side,
        up,
        radius * 0.50,
    )

    builder.bridge(rings[-1], lip, SLOTS["white"])
    builder.bridge(lip, inside, SLOTS["white"])
    builder.bridge(inside, throat, SLOTS["mango"])
    builder.cap(
        throat,
        axis - tangent * 0.046,
        SLOTS["mango"],
    )


def add_starfish(builder):
    center = Vector((0.19, -0.145, 0))
    outline = []
    lengths = (1.0, 0.96, 1.04, 0.94, 1.0)

    for index in range(10):
        theta = math.radians(-91) + index * math.pi / 5
        radius = (
            0.162 * lengths[index // 2]
            if index % 2 == 0
            else 0.073
        )
        outline.append(Vector((
            radius * math.cos(theta),
            radius * math.sin(theta),
            0,
        )))

    bottom = builder.ring(
        center + point * 0.94
        for point in outline
    )
    edge = builder.ring(
        center + point + Vector((0, 0, 0.014))
        for point in outline
    )
    top = builder.ring(
        center + point * 0.82 + Vector((
            0,
            0,
            0.029 if index % 2 == 0 else 0.036,
        ))
        for index, point in enumerate(outline)
    )

    builder.bridge(bottom, edge, SLOTS["coral"])
    builder.bridge(edge, top, SLOTS["coral"])
    builder.cap(bottom, center, SLOTS["coral"])
    builder.cap(
        top,
        center + Vector((0, 0, 0.052)),
        SLOTS["coral"],
    )


def add_pebble(builder, center, radii, phase):
    center = Vector(center)
    rings = []

    for factor, height in (
        (0.70, 0),
        (1.0, 0.38),
        (0.62, 0.87),
    ):
        rings.append(builder.ring(
            center + Vector((
                radii[0] * factor
                * math.cos(index * math.tau / 8 + phase),
                radii[1] * factor
                * math.sin(index * math.tau / 8 + phase),
                radii[2] * height,
            ))
            for index in range(8)
        ))

    for first, second in zip(rings, rings[1:]):
        builder.bridge(first, second, SLOTS["white"])

    builder.cap(rings[0], center, SLOTS["white"])
    builder.cap(
        rings[-1],
        center + Vector((0, 0, radii[2])),
        SLOTS["white"],
    )


def build_cluster(material):
    builder = Builder()

    builder.part("scallop", lambda: add_scallop(builder))
    builder.part("conch", lambda: add_conch(builder))
    builder.part("starfish", lambda: add_starfish(builder))
    builder.part(
        "pebble_1",
        lambda: add_pebble(
            builder,
            (-0.235, 0.215, 0),
            (0.064, 0.049, 0.043),
            0.2,
        ),
    )
    builder.part(
        "pebble_2",
        lambda: add_pebble(
            builder,
            (0.015, -0.265, 0),
            (0.045, 0.034, 0.032),
            -0.3,
        ),
    )

    return builder.finish(material)


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
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    assert accessor["count"] > 0
    assert stride >= size
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    )
    assert view.get("byteOffset", 0) + view["byteLength"] <= len(binary)

    return [
        struct.unpack_from(fmt, binary, start + index * stride)
        for index in range(accessor["count"])
    ]


def verify_glb(data, obj, metadata):
    assert struct.unpack_from("<4sII", data) == (
        b"glTF", 2, len(data),
    )

    chunks = {}
    offset = 12

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
    assert buffer["byteLength"] <= len(binary) <= buffer["byteLength"] + 3

    mesh, = document["meshes"]
    node, = document["nodes"]
    material, = document["materials"]
    scene, = document["scenes"]

    assert scene["nodes"] == [0]
    assert mesh["name"] == node["name"] == NAME
    assert node["mesh"] == 0
    assert material["name"] == "palette"
    assert "matrix" not in node
    assert "children" not in node
    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]
    assert not any(
        document.get(key)
        for key in ("animations", "skins", "cameras")
    )

    primitive, = mesh["primitives"]

    assert primitive.get("mode", 4) == 4
    assert primitive["material"] == 0

    attributes = primitive["attributes"]

    assert {"POSITION", "NORMAL", "TEXCOORD_0"} <= set(attributes)
    assert not any(
        key.startswith("COLOR_")
        for key in attributes
    )

    points = [
        Vector(point)
        for point in accessor_rows(
            document, binary, attributes["POSITION"],
        )
    ]
    normals = [
        Vector(normal)
        for normal in accessor_rows(
            document, binary, attributes["NORMAL"],
        )
    ]
    uvs = accessor_rows(
        document, binary, attributes["TEXCOORD_0"],
    )

    assert len(points) == len(normals) == len(uvs)
    assert all(
        math.isfinite(value)
        for point in points
        for value in point
    )
    assert all(
        abs(normal.length - 1) < 1e-4
        for normal in normals
    )
    assert {check_uv(uv) for uv in uvs} == set(EXPECTED)

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"],
        )
    ]
    assert len(indices) % 3 == 0

    for offset in range(0, len(indices), 3):
        a, b, c = indices[offset:offset + 3]

        assert 0 <= min(a, b, c) <= max(a, b, c) < len(points)

        normal = (points[b] - points[a]).cross(points[c] - points[a])
        assert normal.length > 2e-10

        normal.normalize()

        assert all(
            normal.dot(normals[index]) > 0.999
            for index in (a, b, c)
        )
        assert all(
            abs(uvs[a][axis] - uvs[index][axis]) < 1e-7
            for index in (b, c)
            for axis in range(2)
        )

    triangles = len(indices) // 3

    assert 300 <= triangles <= 900
    assert triangles == len(obj.data.loop_triangles)

    lower, upper = bounds(points)
    blender_lower, blender_upper = bounds(
        vertex.co for vertex in obj.data.vertices
    )
    expected_lower = Vector((
        blender_lower.x,
        blender_lower.z,
        -blender_upper.y,
    ))
    expected_upper = Vector((
        blender_upper.x,
        blender_upper.z,
        -blender_lower.y,
    ))

    assert (lower - expected_lower).length < EPSILON
    assert (upper - expected_upper).length < EPSILON
    assert abs(lower.y) < EPSILON
    assert upper.y <= 0.25
    assert all(
        point.y >= -EPSILON
        and math.hypot(point.x, point.z) <= 0.5
        for point in points
    )

    front = Vector(metadata["front_blender"])
    assert (
        Vector((front.x, front.z, -front.y))
        - Vector((0, 0, 1))
    ).length < EPSILON

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0

    pbr = material["pbrMetallicRoughness"]

    assert pbr["baseColorTexture"]["index"] == 0
    assert pbr["baseColorTexture"].get("texCoord", 0) == 0
    assert pbr.get("baseColorFactor", [1, 1, 1, 1]) == [1, 1, 1, 1]
    assert pbr.get("metallicFactor", 1) == 0

    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)
    assert png == PALETTE.read_bytes(), (
        "Embedded palette must preserve original PNG bytes"
    )

    return {
        "triangles": triangles,
        "vertices_blender": len(obj.data.vertices),
        "vertices_glb": len(points),
        "blender_bounds": {
            "min": tuple(blender_lower),
            "max": tuple(blender_upper),
            "dimensions": tuple(blender_upper - blender_lower),
        },
        "glb_bounds": {
            "min": tuple(lower),
            "max": tuple(upper),
            "dimensions": tuple(upper - lower),
        },
        "front_glb": (0, 0, 1),
        "up_glb": (0, 1, 0),
        **metadata,
    }


def export_glb(obj, metadata):
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
    assert path.is_file()

    return verify_glb(path.read_bytes(), obj, metadata)


def make_render_scene(obj):
    scene = bpy.data.scenes.new(NAME + "-preview")
    scene.render.engine = "BLENDER_WORKBENCH"

    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False

    scene.display.render_aa = "32"

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.studio_light = "paint.sl"
    shading.color_type = "TEXTURE"
    shading.show_shadows = True
    shading.shadow_intensity = 0.35
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.cavity_ridge_factor = 0.75
    shading.cavity_valley_factor = 0.75
    shading.curvature_ridge_factor = 0.75
    shading.curvature_valley_factor = 0.60
    shading.show_specular_highlight = False
    shading.show_object_outline = False
    shading.show_backface_culling = True
    shading.background_type = "VIEWPORT"
    shading.background_color = (0.70, 0.63, 0.51)

    scene.collection.objects.link(obj)

    # 접지 그림자용 바닥은 미리보기 전용이며 GLB 내보내기 이후에 만든다.
    floor_mesh = bpy.data.meshes.new("preview-ground")
    floor_mesh.from_pydata(
        [
            (-2, -2, -0.002),
            (2, -2, -0.002),
            (2, 2, -0.002),
            (-2, 2, -0.002),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    floor_mesh.materials.append(obj.data.materials[0])

    uv = floor_mesh.uv_layers.new(name="UVMap")

    for loop in uv.data:
        loop.uv = ((SLOTS["sand"] + 0.5) / 32, 0.5)

    floor_mesh.update()

    floor = bpy.data.objects.new("preview-ground", floor_mesh)
    scene.collection.objects.link(floor)

    points = [vertex.co.copy() for vertex in obj.data.vertices]
    lower, upper = bounds(points)
    pivot = (lower + upper) / 2

    direction = Vector((0, -1, 1)).normalized()
    rotation = (-direction).to_track_quat("-Z", "Y")
    basis = rotation.to_matrix()

    screen_lower, screen_upper = bounds(
        basis.transposed() @ (point - pivot)
        for point in points
    )
    target = pivot + basis @ Vector((
        (screen_lower.x + screen_upper.x) / 2,
        (screen_lower.y + screen_upper.y) / 2,
        0,
    ))

    camera = bpy.data.objects.new(
        "preview-camera",
        bpy.data.cameras.new("preview-camera"),
    )
    scene.collection.objects.link(camera)

    camera.data.type = "ORTHO"
    camera.data.clip_start = 0.01
    camera.data.clip_end = 10
    camera.data.ortho_scale = max(
        screen_upper.x - screen_lower.x,
        screen_upper.y - screen_lower.y,
    ) * 1.24

    camera.location = target + direction * 3
    camera.rotation_euler = rotation.to_euler()
    scene.camera = camera

    assert shading.color_type == "TEXTURE"

    return scene


def render_preview(obj):
    scene = make_render_scene(obj)
    path = OUTPUT / (NAME + ".png")
    scene.render.filepath = str(path)

    result = bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )
    assert result == {"FINISHED"}

    data = path.read_bytes()

    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">IIBBBBB", data, 16) == (
        1024, 1024, 8, 6, 0, 0, 0,
    )

    image = bpy.data.images.load(str(path), check_existing=False)

    try:
        assert tuple(image.size) == (1024, 1024)
        pixels = image.pixels
        reds = [
            pixels[4 * (y * 1024 + x)]
            for y in range(16, 1024, 32)
            for x in range(16, 1024, 32)
        ]
        assert max(reds) - min(reds) > 0.025, "Preview appears blank"

    finally:
        bpy.data.images.remove(image)

    return {
        "file": str(path),
        "engine": scene.render.engine,
        "color_type": scene.display.shading.color_type,
        "view_direction_blender": (0, -1, 1),
        "elevation_degrees": 45,
        "resolution": (1024, 1024),
        "png_verified": True,
    }


def main():
    material = load_palette()

    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene

    obj, metadata = build_cluster(material)
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)

    result = export_glb(obj, metadata)
    result["file"] = str(OUTPUT / (NAME + ".glb"))

    path = OUTPUT / (NAME + ".json")
    path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    result["preview"] = render_preview(obj)

    path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    assert all(
        (OUTPUT / (NAME + extension)).is_file()
        for extension in (".glb", ".json", ".png")
    )

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
