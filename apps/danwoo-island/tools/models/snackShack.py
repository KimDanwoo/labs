"""
Blender 5.3
실행: Blender -b --factory-startup --disable-autoexec --python /absolute/path/to/snackShack.py
출력: snackShack.glb, snackShack.png(원작 소품 비교 렌더).
메시·GLB 직렬화는 메모리에서 검증했다(1,980삼각형). 렌더·파일 저장은 실행하지 않았다.
지붕 폭 3.8은 경사면을 따라 잰 전개 폭으로 해석한다. 수평 폭은 전체 X 치수에 맞춘 3.4다.
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
OUTPUT = ROOT / "codex-work/island3"
NAME = "snackShack"
TARGET = Vector((3.4, 3.1, 5.1))
EPSILON = 1e-5

SLOTS = {
    "wood": 14,
    "green": 9,
    "yellow": 8,
    "coral": 10,
    "white": 23,
}
REFERENCE_NAMES = {
    "statue": "refStatuePhysicalDynamic",
    "anvil": "Cube.094",
    "cauldron": "body.001",
    "lantern": "base",
    "bench": "benchPhysicalDynamic",
    "hut": "wood.002",
    "jukebox": "refJukeboxPhysicalDynamic",
}


def bounds(points):
    points = list(points)
    if not points:
        raise RuntimeError("Empty geometry")
    return (
        Vector(tuple(min(point[axis] for point in points) for axis in range(3))),
        Vector(tuple(max(point[axis] for point in points) for axis in range(3))),
    )


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)
    assert slot in SLOTS.values()
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
            "smooth_faces": sum(face.use_smooth for face in obj.data.polygons),
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

    for label, slot in SLOTS.items():
        start = 4 * (2 * 128 + slot * 4 + 2)
        rgb = pixels[start:start + 3]
        print(json.dumps({
            "color": label,
            "slot": slot,
            "actual": "#" + "".join(f"{round(value * 255):02X}" for value in rgb),
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
        self.parts = {}
        self.center = Vector((0, 0, 0))

    def box(self, name, *, center, size, slot, bevel=0.025):
        assert name not in self.parts
        assert 0 <= bevel < min(size) / 2

        bm = bmesh.new()
        try:
            bmesh.ops.create_cube(bm, size=1.0)
            for vertex in bm.verts:
                vertex.co = Vector(tuple(
                    vertex.co[axis] * size[axis] for axis in range(3)
                ))

            if bevel > 0:
                bmesh.ops.bevel(
                    bm,
                    geom=list(bm.edges),
                    offset=bevel,
                    segments=1,
                    profile=0.5,
                    affect="EDGES",
                    clamp_overlap=True,
                )

            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            assert all(
                edge.is_manifold and edge.is_contiguous for edge in bm.edges
            )

            bm.verts.ensure_lookup_table()
            bm.verts.index_update()
            first = len(self.vertices)
            origin = Vector(center)
            self.vertices.extend(tuple(vertex.co + origin) for vertex in bm.verts)
            for face in bm.faces:
                self.faces.append(tuple(
                    first + vertex.index for vertex in face.verts
                ))
                self.slots.append(slot)
            self.parts[name] = (first, len(self.vertices))
        finally:
            bm.free()

    def part_bounds(self, name):
        first, last = self.parts[name]
        return bounds(self.vertices[first:last])

    def finish(self):
        if bpy.data.objects.get(NAME) or bpy.data.meshes.get(NAME):
            raise RuntimeError("Object name already exists: " + NAME)

        lower, upper = bounds(self.vertices)
        assert (
            lower - Vector((-TARGET.x / 2, -TARGET.y / 2, 0))
        ).length < EPSILON
        assert (
            upper - Vector((TARGET.x / 2, TARGET.y / 2, TARGET.z))
        ).length < EPSILON

        self.center = (lower + upper) / 2
        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(
            [Vector(vertex) - self.center for vertex in self.vertices],
            [],
            self.faces,
        )
        mesh.update()
        assert not mesh.validate(verbose=False)

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")
        for face, slot in zip(mesh.polygons, self.slots, strict=True):
            face.use_smooth = False
            for index in face.loop_indices:
                uv.data[index].uv = ((slot + 0.5) / 32, 0.5)

        bm = bmesh.new()
        component_count = 0
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
                edge.is_manifold and edge.is_contiguous for edge in bm.edges
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
                component_count += 1

            assert component_count == len(self.parts)
            bm.to_mesh(mesh)
        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()
        assert 600 <= len(mesh.loop_triangles) <= 2000

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        assert (upper - lower - TARGET).length < EPSILON
        assert ((upper + lower) / 2).length < EPSILON
        assert abs(lower.z + TARGET.z / 2) < EPSILON

        floor_points = [
            vertex.co for vertex in mesh.vertices
            if abs(vertex.co.z - lower.z) < EPSILON
        ]
        assert len(floor_points) >= 4
        for x_sign in (-1, 1):
            for y_sign in (-1, 1):
                assert any(
                    point.x * x_sign > 0 and point.y * y_sign > 0
                    for point in floor_points
                )

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used_slots = set()
        for face in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[index].uv)
                for index in face.loop_indices
            ]
            used_slots.update(check_uv(value) for value in values)
            assert all(value == values[0] for value in values)
        assert used_slots == set(SLOTS.values())

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)
        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)

        print(json.dumps({
            "closed_components": component_count,
            "triangles": len(mesh.loop_triangles),
            "palette_slots": sorted(used_slots),
        }))
        return obj


def add_raw(builder, name, vertices, faces, slots):
    assert name not in builder.parts
    first = len(builder.vertices)
    builder.vertices.extend(tuple(vertex) for vertex in vertices)
    builder.faces.extend(
        tuple(first + index for index in face) for face in faces
    )
    builder.slots.extend(
        slots if isinstance(slots, (tuple, list)) else [slots] * len(faces)
    )
    builder.parts[name] = (first, len(builder.vertices))


def radial(
    builder, name, *, center, profile, slot, sides=8,
    rotation=(0, 0, 0), top_slot=None,
):
    transform = Euler(rotation, "XYZ").to_matrix()
    vertices = [
        Vector(center) + transform @ Vector((
            radius * math.cos(math.tau * index / sides),
            radius * math.sin(math.tau * index / sides),
            z,
        ))
        for z, radius in profile
        for index in range(sides)
    ]
    faces = [tuple(reversed(range(sides)))]
    colors = [slot]

    for ring in range(len(profile) - 1):
        for index in range(sides):
            faces.append((
                ring * sides + index,
                ring * sides + (index + 1) % sides,
                (ring + 1) * sides + (index + 1) % sides,
                (ring + 1) * sides + index,
            ))
            colors.append(slot)

    faces.append(tuple(
        (len(profile) - 1) * sides + index for index in range(sides)
    ))
    colors.append(slot if top_slot is None else top_slot)
    add_raw(builder, name, vertices, faces, colors)


def rod(builder, name, start, end, radius, slot, sides=6):
    start, end = Vector(start), Vector(end)
    delta = end - start
    rotation = delta.to_track_quat("Z", "Y").to_euler()
    radial(
        builder,
        name,
        center=(start + end) / 2,
        profile=(
            (-delta.length / 2, radius),
            (delta.length / 2, radius),
        ),
        slot=slot,
        sides=sides,
        rotation=rotation,
    )


def prism_y(builder, name, polygon, y0, y1, slot):
    count = len(polygon)
    vertices = [(x, y, z) for y in (y0, y1) for x, z in polygon]
    faces = [
        tuple(reversed(range(count))),
        tuple(range(count, 2 * count)),
    ]
    faces.extend(
        (
            index,
            (index + 1) % count,
            (index + 1) % count + count,
            index + count,
        )
        for index in range(count)
    )
    add_raw(builder, name, vertices, faces, slot)


def build_snack_shack():
    b = Builder()
    wood, coral, white, green, yellow = (
        SLOTS[key] for key in ("wood", "coral", "white", "green", "yellow")
    )
    body_x = -0.10

    b.box(
        "body",
        center=(body_x, 0, 0.5),
        size=(3.15, 2.2, 1.0),
        slot=wood,
        bevel=0.085,
    )
    b.box(
        "countertop",
        center=(body_x, 0, 1.045),
        size=(3.19, 2.28, 0.13),
        slot=wood,
        bevel=0.045,
    )
    for i in range(3):
        b.box(
            f"front-plank-{i}",
            center=(body_x - 0.96 + i * 0.96, -1.105, 0.53),
            size=(0.92, 0.07, 0.69),
            slot=wood,
            bevel=0,
        )
    for i, z in enumerate((0.17, 0.89)):
        b.box(
            f"front-rail-{i}",
            center=(body_x, -1.145, z),
            size=(2.98, 0.085, 0.10),
            slot=wood,
            bevel=0,
        )

    for i, y in enumerate((-1.22, 1.22)):
        radial(
            b,
            f"wheel-{i}",
            center=(-0.89, y, 0.51),
            profile=((-0.13, 0.43), (0, 0.51), (0.13, 0.43)),
            rotation=(math.pi / 2, 0, 0),
            slot=wood,
            sides=12,
        )
        outward = -1 if y < 0 else 1
        radial(
            b,
            f"hub-{i}",
            center=(-0.89, y + outward * 0.14, 0.51),
            profile=((-0.045, 0.13), (0.045, 0.13)),
            rotation=(math.pi / 2, 0, 0),
            slot=wood,
            sides=8,
        )

    rise = math.sqrt((3.8 / 2) ** 2 - (TARGET.x / 2) ** 2)
    for i, (x, y) in enumerate(
        (x, y) for x in (-1.48, 1.28) for y in (-0.96, 0.96)
    ):
        top = TARGET.z - rise * abs(x) / (TARGET.x / 2) - 0.04
        bottom = 1.03
        b.box(
            f"post-{i}",
            center=(x, y, (top + bottom) / 2),
            size=(0.13, 0.13, top - bottom),
            slot=wood,
            bevel=0.018,
        )

    b.box(
        "display-back",
        center=(body_x + 0.30, 0.94, 1.68),
        size=(1.70, 0.11, 1.18),
        slot=wood,
        bevel=0.032,
    )
    for i, x in enumerate((body_x - 0.51, body_x + 1.11)):
        b.box(
            f"display-side-{i}",
            center=(x, 0.70, 1.68),
            size=(0.12, 0.57, 1.18),
            slot=wood,
            bevel=0.025,
        )
    for i, z in enumerate((1.16, 1.71, 2.24)):
        b.box(
            f"display-shelf-{i}",
            center=(body_x + 0.30, 0.68, z),
            size=(1.73, 0.62, 0.115),
            slot=wood,
            bevel=0.027,
        )

    coconut_positions = (
        (-1.16, -0.62), (-0.57, -0.62), (0.02, -0.62),
        (-1.11, 0.00), (-0.52, 0.00), (0.07, 0.00),
    )
    for i, (x, y) in enumerate(coconut_positions):
        radial(
            b,
            f"coconut-{i}",
            center=(x, y, 1.105),
            profile=(
                (0, 0.13),
                (0.07, 0.235),
                (0.27, 0.25),
                (0.43, 0.14),
            ),
            slot=green,
            sides=8,
            rotation=(0, 0, math.radians(i * 13)),
            top_slot=wood,
        )

    radial(
        b,
        "coconut-cup",
        center=(0.92, -0.58, 1.105),
        profile=((0, 0.14), (0.07, 0.25), (0.29, 0.27), (0.40, 0.205)),
        slot=green,
        sides=10,
        top_slot=white,
    )
    rod(
        b, "straw-upright",
        (0.94, -0.56, 1.48), (1.00, -0.56, 1.93),
        0.025, coral,
    )
    rod(
        b, "straw-bend",
        (0.998, -0.56, 1.915), (1.17, -0.56, 1.99),
        0.025, coral,
    )

    for i, x in enumerate((-0.18, 0.30, 0.78)):
        radial(
            b,
            f"display-tumbler-{i}",
            center=(x, 0.65, 1.7675),
            profile=((0, 0.075), (0.25, 0.09)),
            slot=white,
            sides=6,
        )

    def roof_z(x):
        return TARGET.z - rise * abs(x) / (TARGET.x / 2)

    bands = 10
    xs = [
        -TARGET.x / 2 + TARGET.x * i / bands
        for i in range(bands + 1)
    ]
    vertices = [
        (x, y, roof_z(x) - drop)
        for drop in (0, 0.09)
        for y in (-1.45, 1.55)
        for x in xs
    ]
    row = bands + 1

    def index(layer, side, i):
        return layer * row * 2 + side * row + i

    faces, colors = [], []
    for i in range(bands):
        color = coral if i % 2 == 0 else white
        for layer in (0, 1):
            faces.append((
                index(layer, 0, i),
                index(layer, 0, i + 1),
                index(layer, 1, i + 1),
                index(layer, 1, i),
            ))
            colors.append(color)
        for side in (0, 1):
            faces.append((
                index(0, side, i),
                index(0, side, i + 1),
                index(1, side, i + 1),
                index(1, side, i),
            ))
            colors.append(color)
    for i in (0, bands):
        faces.append((
            index(0, 0, i),
            index(0, 1, i),
            index(1, 1, i),
            index(1, 0, i),
        ))
        colors.append(coral if i == 0 else white)
    add_raw(b, "striped-canopy", vertices, faces, colors)

    for i in range(bands):
        x0, x1 = xs[i], xs[i + 1]
        mid = (x0 + x1) / 2
        polygon = (
            (x0, roof_z(x0) - 0.04),
            (x1, roof_z(x1) - 0.04),
            (x1, roof_z(x1) - 0.20),
            (mid, roof_z(mid) - 0.27),
            (x0, roof_z(x0) - 0.20),
        )
        prism_y(
            b,
            f"valance-{i}",
            polygon,
            -1.45,
            -1.385,
            coral if i % 2 == 0 else white,
        )

    cable_points = []
    for i in range(11):
        x = -1.46 + 2.92 * i / 10
        z = 3.87 + 0.29 * (x / 1.46) ** 2
        cable_points.append((x, -1.435, z))
    for i in range(10):
        rod(
            b,
            f"garland-wire-{i}",
            cable_points[i],
            cable_points[i + 1],
            0.016,
            wood,
            sides=5,
        )

    for i, x in enumerate((-1.16, -0.58, 0, 0.58, 1.16)):
        z = 3.87 + 0.29 * (x / 1.46) ** 2
        rod(
            b,
            f"bulb-socket-{i}",
            (x, -1.435, z + 0.015),
            (x, -1.46, z - 0.075),
            0.035,
            wood,
        )
        radial(
            b,
            f"bulb-{i}",
            center=(x, -1.46, z - 0.24),
            profile=(
                (0, 0.025),
                (0.08, 0.09 / math.sin(math.pi / 3)),
                (0.16, 0.045),
            ),
            slot=yellow,
            sides=6,
        )

    lower, upper = b.part_bounds("body")
    assert (upper - lower - Vector((3.15, 2.2, 1.0))).length < EPSILON
    assert abs(lower.z) < EPSILON
    assert (lower.x + upper.x) / 2 < 0

    roof_lower, roof_upper = b.part_bounds("striped-canopy")
    assert abs(roof_upper.x - roof_lower.x - TARGET.x) < EPSILON
    assert abs(roof_upper.y - roof_lower.y - 3.0) < EPSILON
    assert abs(2 * math.hypot(TARGET.x / 2, rise) - 3.8) < EPSILON

    obj = b.finish()
    markers = {
        "front": (0, -1, 0),
        "display": tuple(Vector((body_x + 0.30, 0.94, 1.68)) - b.center),
        "cup": tuple(Vector((0.92, -0.58, 1.50)) - b.center),
        "body": tuple(Vector((body_x, 0, 0.5)) - b.center),
    }
    print("DIRECTION", json.dumps(markers))
    return obj, markers


def accessor_rows(document, binary, index):
    accessor = document["accessors"][index]
    assert "sparse" not in accessor
    formats = {5121: "B", 5123: "H", 5125: "I", 5126: "f"}
    widths = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
    fmt = "<" + formats[accessor["componentType"]] * widths[accessor["type"]]
    size = struct.calcsize(fmt)
    view = document["bufferViews"][accessor["bufferView"]]
    assert view.get("buffer", 0) == 0

    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    assert stride >= size and accessor["count"] > 0
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
    assert struct.unpack_from("<4sII", data) == (b"glTF", 2, len(data))

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
    assert len(document["buffers"]) == 1
    assert "uri" not in document["buffers"][0]

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]
    assert mesh["name"] == NAME and node["name"] == NAME
    assert material["name"] == "palette" and node["mesh"] == 0
    assert "matrix" not in node and "children" not in node
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
        for point in accessor_rows(document, binary, attributes["POSITION"])
    ]
    normals = accessor_rows(document, binary, attributes["NORMAL"])
    uvs = accessor_rows(document, binary, attributes["TEXCOORD_0"])
    assert len(points) == len(normals) == len(uvs)
    assert {check_uv(uv) for uv in uvs} == set(SLOTS.values())

    indices = [
        row[0]
        for row in accessor_rows(document, binary, primitive["indices"])
    ]
    assert len(indices) % 3 == 0

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]
        assert min(a, b, c) >= 0 and max(a, b, c) < len(points)
        assert (
            (points[b] - points[a]).cross(points[c] - points[a]).length
            > 2e-10
        )
        assert all(
            abs(uvs[a][axis] - uvs[vertex][axis]) < 1e-7
            for vertex in (b, c)
            for axis in range(2)
        )

    triangles = len(indices) // 3
    assert triangles == len(obj.data.loop_triangles)
    assert 600 <= triangles <= 2000

    lower, upper = bounds(points)
    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((upper + lower) / 2).length < EPSILON

    # Blender -Y 정면은 Y-up GLB의 +Z, 바닥은 GLB -Y다.
    def yup(point):
        x, y, z = point
        return Vector((x, z, -y))

    assert yup(markers["front"]).z == 1
    assert yup(markers["display"]).z < 0
    assert yup(markers["cup"]).z > 0
    assert yup(markers["body"]).x < 0
    assert abs(lower.y + TARGET.z / 2) < EPSILON

    texture, = document["textures"]
    image, = document["images"]
    assert texture["source"] == 0
    assert material["pbrMetallicRoughness"]["baseColorTexture"]["index"] == 0
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
    clone = bpy.data.objects.new("preview-" + source.name, mesh)
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

    for vertex, point in zip(mesh.vertices, points, strict=True):
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
        clone_for_preview(scene, obj, screen_right * -3.0, 3.4)
    ]
    labels = list(REFERENCE_NAMES)
    for index, label in enumerate(labels):
        column, row = index % 4, index // 4
        position = screen_right * (-0.1 + column * 1.5)
        position += Vector((0, 0, 1.7 if row == 0 else 0))
        clones.append(clone_for_preview(
            scene, references[label], position, 1.35,
        ))

    print(
        "COMPARE: snackShack left; original references right:",
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
    aspect = scene.render.resolution_x / scene.render.resolution_y
    camera.data.ortho_scale = max(
        screen_upper.x - screen_lower.x,
        (screen_upper.y - screen_lower.y) * aspect,
    ) * 1.12
    return scene


def render_comparison(obj, references):
    scene = make_render_scene(obj, references)
    scene.render.filepath = str(OUTPUT / (NAME + ".png"))
    bpy.ops.render.render(write_still=True, scene=scene.name)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)

    references = load_source()
    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene
    obj, markers = build_snack_shack()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = export_glb(obj, markers)
    if not args.skip_render:
        render_comparison(obj, references)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
