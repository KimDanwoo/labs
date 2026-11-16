"""
Blender 5.3
실행: blender -b --factory-startup --disable-autoexec --python /absolute/path/to/linkSign.py
렌더 생략: 명령 끝에 -- --skip-render 추가.
수정 형상의 메시·앞뒤 대칭·글씨 칸·GLB 직렬화를 메모리에서 검증했다(삼각형 1,260개).
파일 저장과 최종 PNG의 시각적 결과는 검증하지 않았다.
"""
import argparse
import json
import math
import struct
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(
    "/private/tmp/claude-501/-Users-duse-Dev-danwoo-labs/"
    "13c85364-e479-440e-9a47-6ff23149a17c/scratchpad"
)
SOURCE = ROOT / "upstream-blend/folio-2025.blend"
PALETTE = ROOT / "style/palette.png"
OUTPUT = ROOT / "codex-work/polish3"
NAME = "linkSign"
TARGET = Vector((1.00, 0.30, 1.40))
EPSILON = 1e-5
PANEL_Y = 0.15
LABEL_Z = (0.58 - 0.5) * TARGET.z

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
    "cream": 23,
}
USED_SLOTS = {10, 14, 17, 23}
EXPECTED_RGB = {
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


def bounds(points):
    points = list(points)
    assert points

    return (
        Vector(tuple(min(p[a] for p in points) for a in range(3))),
        Vector(tuple(max(p[a] for p in points) for a in range(3))),
    )


def check_uv(uv):
    u, v = uv
    slot = round(u * 32 - 0.5)

    assert slot in USED_SLOTS
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7

    return slot


def load_source():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3이 필요합니다.")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("--disable-autoexec로 실행하세요.")

    for path in (SOURCE, PALETTE):
        if not path.is_file():
            raise FileNotFoundError(path)

    bpy.ops.wm.open_mainfile(
        filepath=str(SOURCE),
        load_ui=False,
        use_scripts=False,
    )

    material = bpy.data.materials.get("palette")
    assert material is not None and material.node_tree is not None

    textures = [
        node for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    assert len(textures) == 1

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    # 칸 경계의 혼색을 피하고 각 칸의 중앙 픽셀만 검사한다.
    for label, slot in SLOTS.items():
        assert 0 <= slot < 32

        offset = 4 * (2 * 128 + slot * 4 + 2)
        rgb = tuple(
            round(pixels[offset + channel] * 255)
            for channel in range(3)
        )

        assert rgb == EXPECTED_RGB[slot], (label, slot, rgb)
        assert abs(pixels[offset + 3] - 1) < EPSILON

    texture = textures[0]
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    texture.mute = False
    material.node_tree.nodes.active = texture
    image.pack()

    for node in material.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            node.inputs["Metallic"].default_value = 0
            node.inputs["Roughness"].default_value = 0.82

    assert any(
        link.from_node == texture
        and link.to_node.type == "BSDF_PRINCIPLED"
        and link.to_socket.name == "Base Color"
        for link in material.node_tree.links
    )

    for collection in (bpy.data.objects, bpy.data.meshes):
        old = collection.get(NAME)
        if old is not None:
            old.name = NAME + "-source"


def cubic(a, b, c, d, steps):
    return [
        tuple(
            (1 - t) ** 3 * a[k]
            + 3 * (1 - t) ** 2 * t * b[k]
            + 3 * (1 - t) * t * t * c[k]
            + t ** 3 * d[k]
            for k in range(2)
        )
        for t in (i / steps for i in range(1, steps + 1))
    ]


def shell_outline():
    upper = [(0.405, -0.17)]

    # 肩を広げ、中央との谷を内側へ寄せて、上三つ・左右二つの丸い塊にする。
    segments = (
        ((0.55, -0.09), (0.55, 0.17), (0.43, 0.18)),
        ((0.49, 0.60), (0.29, 0.75), (0.205, 0.47)),
        (
            (0.16, 0.7766666666666667),
            (-0.16, 0.7766666666666667),
            (-0.205, 0.47),
        ),
        ((-0.29, 0.75), (-0.49, 0.60), (-0.43, 0.18)),
        ((-0.55, 0.17), (-0.55, -0.09), (-0.405, -0.17)),
    )

    for b, c, d in segments:
        upper.extend(cubic(upper[-1], b, c, d, 8))

    bottom = [upper[-1]]
    bottom.extend(cubic(
        bottom[-1],
        (-0.38, -0.23),
        (-0.20, -0.29),
        (-0.12, -0.40),
        8,
    ))
    bottom.extend(
        (x, -0.40)
        for x in (-0.06, 0, 0.06, 0.12)
    )
    bottom.extend(cubic(
        bottom[-1],
        (0.20, -0.29),
        (0.38, -0.23),
        upper[0],
        8,
    ))

    half_width = max(abs(x) for x, z in upper)
    upper = [
        (x * 0.5 / half_width, z)
        for x, z in upper
    ]
    bottom = [
        (x * 0.5 / half_width, z)
        for x, z in bottom
    ]
    outline = upper + bottom[1:-1]

    assert len(outline) == len(set(outline))
    assert abs(max(z for x, z in outline) - 0.70) < EPSILON
    assert abs(min(z for x, z in outline) + 0.40) < EPSILON

    return outline, len(upper), len(bottom)


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        return list(range(start, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)

        assert len(indices) >= 3
        assert len(indices) == len(set(indices))
        assert slot in USED_SLOTS

        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, first, second, slots):
        assert len(first) == len(second)

        for i in range(len(first)):
            j = (i + 1) % len(first)
            slot = slots[i] if isinstance(slots, (tuple, list)) else slots

            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
            )

    def shell_cap(self, ring, upper_count, bottom_count, sign):
        upper = ring[:upper_count]
        bottom = (
            [ring[upper_count - 1]]
            + ring[upper_count:]
            + [ring[0]]
        )
        assert len(bottom) == bottom_count

        left = Vector(self.vertices[bottom[0]])
        right = Vector(self.vertices[bottom[-1]])
        seam = [bottom[0]]

        # 방사형 골의 윗경계를 글씨 칸 아래에 둔다.
        for i in range(1, bottom_count - 1):
            t = i / (bottom_count - 1)
            x = left.x * (1 - t) + right.x * t
            z = left.z - 0.012 * math.sin(math.pi * t)

            seam.extend(self.ring([(x, sign * PANEL_Y, z)]))

        seam.append(bottom[-1])

        self.face(
            upper + seam[1:-1],
            SLOTS["cream"],
        )

        middle = []

        for outside, inside in zip(bottom, seam, strict=True):
            a = Vector(self.vertices[outside])
            b = Vector(self.vertices[inside])

            if outside == inside:
                middle.append(outside)
                continue

            point = a.lerp(b, 0.48)
            point.y = sign * (PANEL_Y - 0.007)
            middle.extend(self.ring([point]))

        for i in range(bottom_count - 1):
            slot = SLOTS["pink"] if i % 2 else SLOTS["coral"]

            for first, second in ((bottom, middle), (middle, seam)):
                face = list(dict.fromkeys((
                    first[i],
                    first[i + 1],
                    second[i + 1],
                    second[i],
                )))

                if len(face) >= 3:
                    self.face(face, slot)

    def leg(self, x):
        rings = []

        for z, half_size, cut in (
            (-0.700, 0.043, 0.009),
            (-0.690, 0.050, 0.010),
            (-0.330, 0.050, 0.010),
            (-0.235, 0.050, 0.010),
            (-0.225, 0.043, 0.009),
        ):
            h = half_size

            rings.append(self.ring([
                (x - h + cut, -h, z),
                (x + h - cut, -h, z),
                (x + h, -h + cut, z),
                (x + h, h - cut, z),
                (x + h - cut, h, z),
                (x - h + cut, h, z),
                (x - h, h - cut, z),
                (x - h, -h + cut, z),
            ]))

        self.face(reversed(rings[0]), SLOTS["wood"])

        for first, second in zip(rings, rings[1:]):
            self.bridge(first, second, SLOTS["wood"])

        self.face(rings[-1], SLOTS["wood"])

    def finish(self):
        mesh = bpy.data.meshes.new(NAME)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate(verbose=False)

        mesh.materials.append(bpy.data.materials["palette"])
        uv = mesh.uv_layers.new(name="UVMap")

        for polygon, slot in zip(mesh.polygons, self.slots, strict=True):
            polygon.use_smooth = False
            polygon.material_index = 0

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
            components = []

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

                components.append(component)

            assert len(components) == 3

            for component in components:
                lower, upper = bounds(
                    vertex.co
                    for face in component
                    for vertex in face.verts
                )

                if lower.z < -0.69:
                    assert abs(
                        abs((lower.x + upper.x) / 2) - 0.28
                    ) < EPSILON
                    assert abs(upper.x - lower.x - 0.10) < EPSILON
                    assert abs(upper.y - lower.y - 0.10) < EPSILON
                    assert abs(lower.z + 0.70) < EPSILON
                else:
                    assert abs(lower.z + 0.40) < EPSILON
                    assert abs(upper.z - 0.70) < EPSILON

            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        assert 600 <= len(mesh.loop_triangles) <= 2500

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)

        assert (upper - lower - TARGET).length < EPSILON
        assert ((lower + upper) / 2).length < EPSILON
        assert abs(lower.z + 0.70) < EPSILON
        assert sum(
            abs(vertex.co.z + 0.70) < EPSILON
            for vertex in mesh.vertices
        ) == 16

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used = set()

        for polygon in mesh.polygons:
            values = [
                tuple(mesh.uv_layers.active.data[index].uv)
                for index in polygon.loop_indices
            ]
            used.update(check_uv(value) for value in values)

            assert all(value == values[0] for value in values)

        assert used == USED_SLOTS

        positions = {
            tuple(round(component, 6) for component in vertex.co)
            for vertex in mesh.vertices
        }
        assert positions == {
            (x, -y, z)
            for x, y, z in positions
        }

        obj = bpy.data.objects.new(NAME, mesh)
        bpy.context.scene.collection.objects.link(obj)
        bpy.context.view_layer.update()

        assert obj.location.length == 0
        assert tuple(obj.scale) == (1, 1, 1)

        verify_panels(obj)
        return obj


def clipped_label_area(points):
    polygon = [(point.x, point.z) for point in points]

    for axis, boundary, direction in (
        (0, -0.33, 1),
        (0, 0.33, -1),
        (1, LABEL_Z - 0.20, 1),
        (1, LABEL_Z + 0.20, -1),
    ):
        if not polygon:
            return 0

        clipped = []
        previous = polygon[-1]
        previous_inside = direction * (previous[axis] - boundary) >= 0

        for current in polygon:
            current_inside = direction * (current[axis] - boundary) >= 0

            if current_inside != previous_inside:
                t = (
                    (boundary - previous[axis])
                    / (current[axis] - previous[axis])
                )
                clipped.append(tuple(
                    previous[k] + t * (current[k] - previous[k])
                    for k in range(2)
                ))

            if current_inside:
                clipped.append(current)

            previous = current
            previous_inside = current_inside

        polygon = clipped

    return abs(sum(
        polygon[i][0] * polygon[(i + 1) % len(polygon)][1]
        - polygon[(i + 1) % len(polygon)][0] * polygon[i][1]
        for i in range(len(polygon))
    )) / 2


def verify_panels(obj):
    for vertex in obj.data.vertices:
        x, y, z = vertex.co

        assert abs(y) <= PANEL_Y + EPSILON

        if (
            abs(x) < 0.33
            and abs(z - LABEL_Z) < 0.20
            and abs(y) > 0.10
        ):
            assert abs(abs(y) - PANEL_Y) < EPSILON, tuple(vertex.co)

    for sign in (-1, 1):
        covered = 0

        for polygon in obj.data.polygons:
            points = [
                obj.data.vertices[index].co
                for index in polygon.vertices
            ]

            if not all(
                abs(point.y - sign * PANEL_Y) < EPSILON
                for point in points
            ):
                continue

            if not all(
                check_uv(obj.data.uv_layers.active.data[index].uv)
                == SLOTS["cream"]
                for index in polygon.loop_indices
            ):
                continue

            assert polygon.normal.y * sign > 0.999
            covered += clipped_label_area(points)

        assert abs(covered - 0.66 * 0.40) < EPSILON, (sign, covered)

        for ix in range(17):
            x = -0.33 + 0.66 * ix / 16

            for iz in range(13):
                z = LABEL_Z - 0.20 + 0.40 * iz / 12

                hit, point, normal, index = obj.ray_cast(
                    Vector((x, sign * 0.30, z)),
                    Vector((0, -sign, 0)),
                )

                assert hit, (x, z)
                assert abs(point.y - sign * PANEL_Y) < EPSILON, (
                    tuple(point), x, z
                )
                assert normal.dot(Vector((0, sign, 0))) > 0.999

                polygon = obj.data.polygons[index]

                assert all(
                    check_uv(obj.data.uv_layers.active.data[i].uv)
                    == SLOTS["cream"]
                    for i in polygon.loop_indices
                ), (x, z, index)


def build_sign():
    outline, upper_count, bottom_count = shell_outline()
    builder = Builder()

    # 앞뒤의 크림 칸·분홍 띠·산호 띠를 각각 y=±0.15에 평평하게 둔다.
    # 둥근 단면 대신 작은 모서리 베벨과 곧은 측면으로 판의 두께를 표현한다.
    profiles = (
        (-0.150, 0.870, 0.880),
        (-0.150, 0.935, 0.940),
        (-0.150, 0.985, 0.985),
        (-0.135, 1.000, 1.000),
        (0.135, 1.000, 1.000),
        (0.150, 0.985, 0.985),
        (0.150, 0.935, 0.940),
        (0.150, 0.870, 0.880),
    )

    assert profiles == tuple(
        (-y, scale_x, scale_z)
        for y, scale_x, scale_z in reversed(profiles)
    )

    rings = [
        builder.ring(
            (x * scale_x, y, 0.12 + (z - 0.12) * scale_z)
            for x, z in outline
        )
        for y, scale_x, scale_z in profiles
    ]

    builder.shell_cap(
        rings[0],
        upper_count,
        bottom_count,
        -1,
    )

    for i in range(1, len(rings)):
        slot = SLOTS["pink"] if i in (1, 7) else SLOTS["coral"]
        builder.bridge(rings[i - 1], rings[i], slot)

    builder.shell_cap(
        rings[-1],
        upper_count,
        bottom_count,
        1,
    )

    builder.leg(-0.28)
    builder.leg(0.28)

    return builder.finish()


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
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    assert accessor["count"] > 0
    assert stride >= size
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
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
        assert offset + 8 + size <= len(data)

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

    assert {"POSITION", "NORMAL", "TEXCOORD_0"}.issubset(attributes)
    assert not any(
        key.startswith("COLOR_")
        for key in attributes
    )

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
    assert {check_uv(uv) for uv in uvs} == USED_SLOTS

    indices = [
        row[0]
        for row in accessor_rows(
            document, binary, primitive["indices"]
        )
    ]

    assert len(indices) % 3 == 0

    triangles = len(indices) // 3

    assert 600 <= triangles <= 2500
    assert triangles == len(obj.data.loop_triangles)

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]

        assert 0 <= min(a, b, c)
        assert max(a, b, c) < len(points)
        assert (
            (points[b] - points[a])
            .cross(points[c] - points[a])
            .length > 2e-10
        )
        assert all(
            abs(uvs[a][axis] - uvs[index][axis]) < 1e-7
            for index in (b, c)
            for axis in range(2)
        )

    lower, upper = bounds(points)

    assert (
        upper - lower - Vector((TARGET.x, TARGET.z, TARGET.y))
    ).length < EPSILON
    assert ((lower + upper) / 2).length < EPSILON
    assert abs(lower.y + 0.70) < EPSILON

    # Blender -Y 정면은 export_yup 적용 후 GLB +Z 정면이다.
    expected = {
        (
            round(vertex.co.x, 6),
            round(vertex.co.z, 6),
            round(-vertex.co.y, 6),
        )
        for vertex in obj.data.vertices
    }
    actual = {
        tuple(round(component, 6) for component in point)
        for point in points
    }
    assert actual == expected

    for point in points:
        if (
            abs(point.x) < 0.33
            and abs(point.y - LABEL_Z) < 0.20
            and abs(point.z) > 0.10
        ):
            assert abs(abs(point.z) - PANEL_Y) < EPSILON

    for sign in (-1, 1):
        assert any(
            abs(point.z - sign * PANEL_Y) < EPSILON
            and normals[i][2] * sign > 0.999
            and check_uv(uvs[i]) == SLOTS["cream"]
            for i, point in enumerate(points)
        )

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0
    assert (
        material["pbrMetallicRoughness"]["baseColorTexture"]["index"]
        == 0
    )
    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    return {
        "file": str(OUTPUT / (NAME + ".glb")),
        "triangles": triangles,
        "closed_components": 3,
        "blender_dimensions": tuple(TARGET),
        "glb_dimensions": tuple(upper - lower),
        "label_center_z": LABEL_Z,
        "label_minimum_size": [0.66, 0.40],
        "label_planes_y": [-PANEL_Y, PANEL_Y],
        "palette_slots_used": sorted(USED_SLOTS),
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


def make_render_scene(obj):
    scene = bpy.data.scenes.new(NAME + "-front-and-upper45")
    scene.render.engine = "BLENDER_WORKBENCH"

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.studio_light = "paint.sl"
    shading.color_type = "TEXTURE"
    shading.background_type = "VIEWPORT"
    shading.background_color = (0.86, 0.79, 0.68)

    # 팔레트 비교에서 그림자·캐비티·광택이 색을 과장하지 않도록 한다.
    shading.show_shadows = False
    shading.show_cavity = False
    shading.show_specular_highlight = False
    shading.show_object_outline = False
    shading.show_backface_culling = False

    scene.render.resolution_x = 2000
    scene.render.resolution_y = 1400
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.use_sequencer = False
    scene.render.use_compositing = False

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0

    scene.world = bpy.data.worlds.new(NAME + "-preview-world")
    scene.world.color = (0.86, 0.79, 0.68)

    clones = []

    # 같은 정사영 카메라에서 왼쪽은 정면, 오른쪽은 정면 위 45도.
    for label, x, angle in (
        ("front", -0.70, 0),
        ("upper45", 0.70, math.pi / 4),
    ):
        clone = bpy.data.objects.new(
            NAME + "-" + label,
            obj.data.copy(),
        )
        scene.collection.objects.link(clone)

        rotation = Matrix.Rotation(angle, 4, "X")

        for vertex in clone.data.vertices:
            vertex.co = rotation @ vertex.co

        lower, upper = bounds(
            vertex.co for vertex in clone.data.vertices
        )
        center = (lower + upper) / 2

        for vertex in clone.data.vertices:
            vertex.co -= center

        clone.location.x = x
        clone.data.update()
        clones.append(clone)

    camera = bpy.data.objects.new(
        NAME + "-preview-camera",
        bpy.data.cameras.new(NAME + "-preview-camera"),
    )
    scene.collection.objects.link(camera)
    scene.camera = camera

    camera.location = (0, -8, 0)
    camera.rotation_euler = (
        Vector((0, 1, 0))
        .to_track_quat("-Z", "Y")
        .to_euler()
    )
    camera.data.type = "ORTHO"
    camera.data.clip_start = 0.01
    camera.data.clip_end = 100

    points = [
        vertex.co + clone.location
        for clone in clones
        for vertex in clone.data.vertices
    ]
    lower, upper = bounds(points)
    aspect = (
        scene.render.resolution_x
        / scene.render.resolution_y
    )

    camera.data.ortho_scale = max(
        upper.x - lower.x,
        (upper.z - lower.z) * aspect,
    ) * 1.14

    return scene


def render_comparison(obj):
    scene = make_render_scene(obj)
    scene.render.filepath = str(OUTPUT / (NAME + ".png"))

    bpy.context.window.scene = scene
    bpy.context.view_layer.update()

    result = bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )
    assert result == {"FINISHED"}

    path = OUTPUT / (NAME + ".png")
    data = path.read_bytes()

    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", data, 16) == (2000, 1400)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-render", action="store_true")

    argv = (
        sys.argv[sys.argv.index("--") + 1:]
        if "--" in sys.argv
        else []
    )
    args = parser.parse_args(argv)

    load_source()

    scene = bpy.data.scenes.new(NAME + "-export")
    bpy.context.window.scene = scene

    obj = build_sign()
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    report = export_glb(obj)

    if not args.skip_render:
        render_comparison(obj)
        report["preview"] = str(OUTPUT / (NAME + ".png"))

    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
