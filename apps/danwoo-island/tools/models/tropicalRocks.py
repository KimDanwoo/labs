"""
Blender 5.3
실행:
blender -b --factory-startup --disable-autoexec --python tools/models/tropicalRocks.py

정면: Blender -Y, GLB +Z. 원점: 바닥 바운딩박스 중심.
Small/Cluster: 2 × 2 × 1.
Tall: 2 × 2 × 2.4.
Flat: 2 × 2 × 0.44.
모델마다 단일 메시·재질이며, 각 구성 요소는 닫힌 형상이다.

Blender 5.3에서 네 모델의 메시·GLB 직렬화 메모리 검사 통과.
Workbench 장면 설정은 확인했으며 실제 렌더는 실행하지 않았다.
"""

import json
import math
import random
import struct
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


APP_ROOT = Path(__file__).resolve().parents[2]
SOURCES = APP_ROOT / "tools/models/.sources"
WORK = APP_ROOT / "tools/models/.work"
PALETTE = SOURCES / "palette.png"
OUTPUT = WORK / "env"

EPSILON = 2e-5
FRONT = Vector((0, -1, 0))

SLOTS = {
    "sand": 1,
    "light_gray": 4,
    "dark": 5,
    "gray": 6,
    "moss": 9,
    "taupe": 11,
    "lime": 12,
    "khaki": 13,
    "star": 15,
    "barnacle": 23,
}

EXPECTED = {
    1: "#EBD1A3",
    4: "#C8C2C1",
    5: "#4A413C",
    6: "#575A5E",
    9: "#91AD78",
    11: "#988165",
    12: "#ABAE2B",
    13: "#A49876",
    15: "#E46202",
    23: "#FFF2E8",
}

ORDER = (
    "tropicalRockSmall",
    "tropicalRockCluster",
    "tropicalRockTall",
    "tropicalRockFlat",
)

HEIGHTS = dict(zip(ORDER, (1.0, 1.0, 2.4, 0.44), strict=True))

# cx, cy, 반폭, 반깊이, 높이. 모든 바위의 하단은 z=0이다.
LAYOUTS = {
    ORDER[0]: (
        (0.22, 0.32, 0.72, 0.66, 1.05),
        (-0.63, -0.38, 0.50, 0.48, 0.58),
        (0.20, -0.73, 0.45, 0.42, 0.37),
    ),
    ORDER[1]: (
        (0.30, 0.45, 0.73, 0.62, 1.20),
        (-0.57, 0.52, 0.39, 0.38, 0.76),
        (-0.78, -0.05, 0.48, 0.46, 0.66),
        (-0.08, -0.43, 0.75, 0.58, 0.78),
        (0.83, -0.06, 0.44, 0.44, 0.56),
        (0.66, -0.79, 0.40, 0.35, 0.32),
    ),
    ORDER[2]: (
        (0.20, 0.24, 0.64, 0.57, 2.40),
        (-0.44, 0.20, 0.32, 0.35, 0.95),
        (-0.40, -0.40, 0.36, 0.42, 0.64),
        (0.30, -0.75, 0.36, 0.32, 0.37),
    ),
    ORDER[3]: (
        (-0.42, -0.54, 0.75, 0.52, 0.38),
        (-0.54, 0.29, 0.47, 0.39, 0.30),
        (0.16, 0.02, 0.58, 0.43, 0.34),
        (0.58, 0.61, 0.61, 0.47, 0.42),
        (0.78, -0.69, 0.37, 0.32, 0.24),
    ),
}


def bounds(points):
    points = list(points)
    assert points, "Empty geometry"

    return tuple(
        Vector(tuple(
            operation(point[axis] for point in points)
            for axis in range(3)
        ))
        for operation in (min, max)
    )


def yup(point):
    return Vector((point[0], point[2], -point[1]))


def frame(normal):
    normal = Vector(normal).normalized()
    reference = Vector((1, 0, 0))

    if abs(reference.dot(normal)) > 0.9:
        reference = Vector((0, 1, 0))

    u = (reference - normal * reference.dot(normal)).normalized()
    return u, normal.cross(u).normalized(), normal


def check_uv(value):
    u, v = value
    slot = round(u * 32 - 0.5)

    assert slot in EXPECTED, (u, v, slot)
    assert abs(u - (slot + 0.5) / 32) < 1e-7
    assert abs(v - 0.5) < 1e-7

    return slot


def load_palette():
    if bpy.app.version[:2] != (5, 3):
        raise RuntimeError("Blender 5.3 is required")

    if "--disable-autoexec" not in sys.argv:
        raise RuntimeError("Start Blender with --disable-autoexec")

    if not PALETTE.is_file():
        raise FileNotFoundError(PALETTE)

    image = bpy.data.images.load(str(PALETTE), check_existing=False)
    assert tuple(image.size) == (128, 4)

    image.colorspace_settings.name = "sRGB"
    pixels = list(image.pixels)

    # 경계 픽셀은 혼색되어 있으므로 각 칸 중앙 한 픽셀만 검사한다.
    for slot, expected in EXPECTED.items():
        start = 4 * (2 * 128 + slot * 4 + 2)
        actual = "#" + "".join(
            f"{round(pixels[start + channel] * 255):02X}"
            for channel in range(3)
        )

        assert actual == expected, (slot, actual, expected)
        assert abs(pixels[start + 3] - 1) < 1e-7

    material = bpy.data.materials.new("palette")
    assert material.name == "palette"

    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 1
    shader.inputs["Metallic"].default_value = 0

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    nodes.active = texture
    texture.select = True

    links = material.node_tree.links
    links.new(uv.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])

    image.pack()
    return material


class Builder:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.slots = []
        self.components = 0

    def ring(self, points):
        start = len(self.vertices)
        self.vertices.extend(tuple(point) for point in points)
        return list(range(start, len(self.vertices)))

    def face(self, indices, slot):
        indices = tuple(indices)

        assert len(indices) >= 3
        assert len(indices) == len(set(indices))
        assert slot in EXPECTED

        self.faces.append(indices)
        self.slots.append(slot)

    def bridge(self, first, second, slot):
        assert len(first) == len(second)

        for i in range(len(first)):
            j = (i + 1) % len(first)
            self.face(
                (first[i], first[j], second[j], second[i]),
                slot,
            )

    def finish(self, name, material):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()

        assert not mesh.validate(verbose=False)

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)
        raw_size = upper - lower
        center = Vector((
            (lower.x + upper.x) / 2,
            (lower.y + upper.y) / 2,
            lower.z,
        ))
        target = Vector((2, 2, HEIGHTS[name]))

        assert min(raw_size) > EPSILON

        # 正規化を座標に焼き込み、GLBノードの変換を恒等に保つ。
        for vertex in mesh.vertices:
            point = vertex.co - center
            vertex.co = Vector(tuple(
                point[axis] * target[axis] / raw_size[axis]
                for axis in range(3)
            ))

        self.normalization_scale = Vector(tuple(
            target[axis] / raw_size[axis]
            for axis in range(3)
        ))

        mesh.materials.append(material)
        uv = mesh.uv_layers.new(name="UVMap")

        for polygon, slot in zip(mesh.polygons, self.slots, strict=True):
            polygon.use_smooth = False

            for loop in polygon.loop_indices:
                uv.data[loop].uv = ((slot + 0.5) / 32, 0.5)

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
            assert all(face.calc_area() > 1e-11 for face in bm.faces)

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

                assert len(vertices) - len(edges) + len(component) == 2

                volume = sum(
                    face.verts[0].co.dot(
                        face.verts[1].co.cross(face.verts[2].co)
                    ) / 6
                    for face in component
                )

                assert abs(volume) > 1e-12

                if volume < 0:
                    bmesh.ops.reverse_faces(bm, faces=list(component))

                volumes.append(abs(volume))

            assert len(volumes) == self.components
            bm.to_mesh(mesh)

        finally:
            bm.free()

        mesh.update()
        mesh.calc_loop_triangles()

        triangles = len(mesh.loop_triangles)
        assert 400 <= triangles <= 2500, (name, triangles)

        lower, upper = bounds(vertex.co for vertex in mesh.vertices)

        assert (lower - Vector((-1, -1, 0))).length < EPSILON
        assert (
            upper - Vector((1, 1, HEIGHTS[name]))
        ).length < EPSILON

        assert not mesh.color_attributes
        assert len(mesh.materials) == 1
        assert mesh.materials[0].name == "palette"

        used = set()

        for polygon in mesh.polygons:
            assert not polygon.use_smooth

            values = [
                tuple(mesh.uv_layers.active.data[i].uv)
                for i in polygon.loop_indices
            ]

            used.update(check_uv(value) for value in values)
            assert all(value == values[0] for value in values)

        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)

        assert obj.location.length == 0
        assert tuple(obj.rotation_euler) == (0, 0, 0)
        assert tuple(obj.scale) == (1, 1, 1)

        return obj, {
            "triangles": triangles,
            "closed_components": len(volumes),
            "component_volumes": sorted(volumes),
            "palette_slots": sorted(used),
            "normalization_envelope": [2, 2, HEIGHTS[name]],
            "blender_bounds": {
                "min": list(lower),
                "max": list(upper),
            },
            "blender_dimensions": list(upper - lower),
            "waterline_z": HEIGHTS[name] * 0.30,
            "front_blender": list(FRONT),
            "front_glb": list(yup(FRONT)),
        }


def cross2(a, b, c):
    return (
        (b[0] - a[0]) * (c[1] - a[1])
        - (b[1] - a[1]) * (c[0] - a[0])
    )


def polygon_area(points):
    return sum(
        points[i][0] * points[(i + 1) % len(points)][1]
        - points[(i + 1) % len(points)][0] * points[i][1]
        for i in range(len(points))
    ) * 0.5


def clip_polygon(points, distance):
    result = []

    for start, end in zip(points, points[1:] + points[:1]):
        ds, de = distance(start), distance(end)
        inside_start, inside_end = ds >= 0, de >= 0

        if inside_start:
            result.append(start)

        if inside_start != inside_end:
            t = ds / (ds - de)
            result.append(start + (end - start) * t)

    cleaned = []

    for point in result:
        if not cleaned or (point - cleaned[-1]).length > 1e-7:
            cleaned.append(point)

    if len(cleaned) > 1 and (cleaned[0] - cleaned[-1]).length < 1e-7:
        cleaned.pop()

    return cleaned


def triangulate_polygon(points, indices=None):
    remaining = (
        list(range(len(points)))
        if indices is None
        else list(indices)
    )
    triangles = []

    while len(remaining) > 3:
        for i, middle in enumerate(remaining):
            first = remaining[i - 1]
            last = remaining[(i + 1) % len(remaining)]
            a, b, c = points[first], points[middle], points[last]

            if cross2(a, b, c) <= 1e-13:
                continue

            if any(
                min(
                    cross2(a, b, points[j]),
                    cross2(b, c, points[j]),
                    cross2(c, a, points[j]),
                ) >= -1e-13
                for j in remaining
                if j not in (first, middle, last)
            ):
                continue

            triangles.append((first, middle, last))
            remaining.pop(i)
            break
        else:
            raise RuntimeError(
                "Cannot triangulate a patch without degenerate faces"
            )

    assert cross2(*(points[i] for i in remaining)) > 1e-13
    triangles.append(tuple(remaining))
    return triangles


def rock_polyhedron(seed):
    rng = random.Random(seed)
    phase = rng.uniform(-0.2, 0.2)
    planes = [
        (Vector((0.045, -0.12, 1)).normalized(), 1.0),
        (Vector((0, 0, -1)), 1.0),
    ]

    # 정점 대신 평면을 변형하여 각 오각형의 평면성을 유지한다.
    for level, shift in ((1, 0), (-1, math.pi / 5)):
        for i in range(5):
            angle = phase + shift + math.tau * i / 5
            normal = Vector((
                2 / math.sqrt(5) * math.cos(angle)
                + rng.uniform(-0.025, 0.025),
                2 / math.sqrt(5) * math.sin(angle)
                + rng.uniform(-0.025, 0.025),
                level / math.sqrt(5) + rng.uniform(-0.02, 0.02),
            )).normalized()
            planes.append((normal, rng.uniform(0.96, 1.04)))

    vertices = []

    for i in range(len(planes)):
        for j in range(i + 1, len(planes)):
            for k in range(j + 1, len(planes)):
                a, da = planes[i]
                b, db = planes[j]
                c, dc = planes[k]
                determinant = a.dot(b.cross(c))

                if abs(determinant) < 1e-6:
                    continue

                point = (
                    da * b.cross(c)
                    + db * c.cross(a)
                    + dc * a.cross(b)
                ) / determinant

                if any(
                    normal.dot(point) > distance + 3e-6
                    for normal, distance in planes
                ):
                    continue

                if not any(
                    (point - other).length < 1e-5
                    for other in vertices
                ):
                    vertices.append(point)

    faces = []

    for normal, distance in planes:
        indices = [
            i for i, point in enumerate(vertices)
            if abs(normal.dot(point) - distance) < 1e-5
        ]
        assert len(indices) >= 3

        center = sum(
            (vertices[i] for i in indices),
            Vector(),
        ) / len(indices)
        u, v, _ = frame(normal)

        indices.sort(key=lambda i: math.atan2(
            (vertices[i] - center).dot(v),
            (vertices[i] - center).dot(u),
        ))
        faces.append(tuple(indices))

    assert len(faces) == 12
    assert len(vertices) == 20
    return vertices, faces


def rock_color(normal, height):
    sun = Vector((-0.6, -0.8, 0.85)).normalized()

    if (
        height >= 0.66
        and normal.z > 0.12
        and normal.dot(sun) > 0.20
    ):
        return SLOTS["khaki"]

    return SLOTS["taupe"]


def add_rock(builder, specification, seed):
    cx, cy, rx, ry, height = specification
    vertices, faces = rock_polyhedron(seed)
    lower, upper = bounds(vertices)
    dimensions = upper - lower

    coords = [
        Vector((
            cx - rx + (point.x - lower.x) * 2 * rx / dimensions.x,
            cy - ry + (point.y - lower.y) * 2 * ry / dimensions.y,
            (point.z - lower.z) * height / dimensions.z,
        ))
        for point in vertices
    ]

    normals = []
    surface_faces = []
    rock_slots = set()
    start_vertex = len(builder.vertices)
    indexed_positions = []

    def vertex_index(point):
        for previous, index in indexed_positions:
            if (point - previous).length < 2e-6:
                return index

        index = builder.ring([point])[0]
        indexed_positions.append((point.copy(), index))
        return index

    for indices in faces:
        polygon = [coords[i] for i in indices]
        normal = (
            (polygon[1] - polygon[0])
            .cross(polygon[2] - polygon[0])
        ).normalized()

        normals.append(normal)
        surface_faces.append((polygon, normal))

        center = sum(polygon, Vector()) / len(polygon)
        body_slot = rock_color(normal, center.z / height)

        # 젖은 띠는 색만 나누므로 위아래 삼각형의 평면 법선은 같다.
        for wet in (True, False):
            clipped = clip_polygon(
                polygon,
                lambda p: (
                    height * 0.12 - p.z
                    if wet
                    else p.z - height * 0.12
                ),
            )

            if len(clipped) < 3:
                continue

            slot = SLOTS["dark"] if wet else body_slot
            builder.face([vertex_index(p) for p in clipped], slot)
            rock_slots.add(slot)

    assert rock_slots <= {
        SLOTS["taupe"],
        SLOTS["khaki"],
        SLOTS["dark"],
    }
    builder.components += 1

    return {
        "bvh": BVHTree.FromPolygons(
            coords,
            faces,
            all_triangles=False,
        ),
        "coords": coords,
        "faces": faces,
        "normals": normals,
        "surface_faces": surface_faces,
        "vertex_range": (start_vertex, len(builder.vertices)),
        "center": Vector((cx, cy, height * 0.5)),
        "height": height,
        "planar_face_count": len(faces),
        "palette_slots": sorted(rock_slots),
    }


def surface(rock, direction, offset=(0, 0)):
    u, v, normal = frame(direction)
    origin = (
        rock["center"]
        + normal * 5
        + u * offset[0]
        + v * offset[1]
    )

    point, hit_normal, _, _ = rock["bvh"].ray_cast(
        origin,
        -normal,
        10,
    )

    if point is None:
        raise RuntimeError("Decoration missed its supporting rock")

    return point, hit_normal.normalized()


def moss_anchor(rock, direction):
    top = max(
        range(len(rock["faces"])),
        key=lambda i: rock["normals"][i].z,
    )
    top_indices = set(rock["faces"][top])
    horizontal = Vector((
        direction[0],
        direction[1],
        0,
    )).normalized()
    candidates = []

    for i, face in enumerate(rock["faces"]):
        shared = top_indices.intersection(face)

        if i == top or len(shared) != 2:
            continue

        score = rock["normals"][i].dot(horizontal)
        candidates.append((score, i, shared))

    _, side, shared = max(candidates, key=lambda entry: entry[0])

    anchor = sum(
        (rock["coords"][i] for i in shared),
        Vector(),
    ) * 0.5
    normal = (
        rock["normals"][top] + rock["normals"][side]
    ).normalized()

    return anchor, normal


def add_moss(
    builder,
    rock,
    direction,
    seed,
    size=0.14,
    lobes=8,
):
    rng = random.Random(seed)
    anchor, direction = moss_anchor(rock, direction)
    u, v, direction = frame(direction)

    count = max(24, lobes * 3)
    outline = []

    for i in range(count):
        angle = math.tau * i / count
        radius = size * (
            0.90
            + 0.12 * math.sin(3 * angle + seed)
            + 0.10 * math.sin(7 * angle)
            + rng.uniform(-0.08, 0.08)
        )

        outline.append(Vector((
            radius * math.cos(angle),
            radius * math.sin(angle)
            * (1.32 if math.sin(angle) < 0 else 0.85),
        )))

    outline_triangles = triangulate_polygon(outline)
    chart_points = []
    positions = []
    cells = []
    thickness = 0.0035

    def patch_vertex(point, normal, plane_distance):
        for i, other in enumerate(chart_points):
            if (point - other).length < 2e-6:
                return i

        projected = anchor + u * point.x + v * point.y
        depth = (
            plane_distance - normal.dot(projected)
        ) / normal.dot(direction)

        chart_points.append(point.copy())
        positions.append(projected + direction * depth)
        return len(chart_points) - 1

    # 바위 면과 패치의 교차 영역을 사용하여 모서리에서도 밀착시킨다.
    for polygon, normal in rock["surface_faces"]:
        if normal.dot(direction) <= 0.08:
            continue

        projected_face = [
            Vector((
                (p - anchor).dot(u),
                (p - anchor).dot(v),
            ))
            for p in polygon
        ]

        if polygon_area(projected_face) < 0:
            projected_face.reverse()

        plane_distance = normal.dot(polygon[0])

        for triangle in outline_triangles:
            clipped = [outline[i].copy() for i in triangle]

            for a, b in zip(
                projected_face,
                projected_face[1:] + projected_face[:1],
            ):
                clipped = clip_polygon(
                    clipped,
                    lambda p: cross2(a, b, p),
                )

                if len(clipped) < 3:
                    break

            if len(clipped) < 3 or polygon_area(clipped) <= 1e-10:
                continue

            # 장식이 주 바위의 최고점과 정규화 높이를 바꾸지 않게 한다.
            def below_peak(point):
                projected = anchor + u * point.x + v * point.y
                depth = (
                    plane_distance - normal.dot(projected)
                ) / normal.dot(direction)

                return rock["height"] - 0.012 - (
                    projected + direction * depth
                ).z

            clipped = clip_polygon(clipped, below_peak)

            if len(clipped) < 3 or polygon_area(clipped) <= 1e-10:
                continue

            cell = [
                patch_vertex(p, normal, plane_distance)
                for p in clipped
            ]
            cells.append(cell)

    assert cells, "Empty moss patch"
    triangles = []

    # 공유 변의 중간 정점을 양쪽 면에 넣어 T자 접합을 방지한다.
    for cell in cells:
        expanded = []

        for first, second in zip(cell, cell[1:] + cell[:1]):
            a, b = chart_points[first], chart_points[second]
            delta = b - a
            candidates = [(0.0, first)]

            for i, point in enumerate(chart_points):
                if i in (first, second):
                    continue

                t = (point - a).dot(delta) / delta.length_squared

                if (
                    1e-5 < t < 1 - 1e-5
                    and (point - (a + delta * t)).length < 2e-6
                ):
                    candidates.append((t, i))

            expanded.extend(i for _, i in sorted(candidates))

        triangles.extend(
            triangulate_polygon(chart_points, expanded)
        )

    bottom = builder.ring([
        p - direction * thickness
        for p in positions
    ])
    top = builder.ring([
        p + direction * thickness
        for p in positions
    ])
    edges = {}

    for triangle in triangles:
        center = sum(
            (chart_points[i] for i in triangle),
            Vector((0, 0)),
        ) / 3
        is_lime = center.x + 0.35 * center.y > size * 0.15
        slot = SLOTS["lime"] if is_lime else SLOTS["moss"]

        builder.face([top[i] for i in triangle], slot)
        builder.face(
            [bottom[i] for i in reversed(triangle)],
            slot,
        )

        for a, b in zip(
            triangle,
            triangle[1:] + triangle[:1],
        ):
            key = tuple(sorted((a, b)))
            edges.setdefault(key, []).append((a, b))

    boundary_count = 0

    for references in edges.values():
        assert len(references) in (1, 2)

        if len(references) == 2:
            assert references[0] == tuple(reversed(references[1]))
            continue

        a, b = references[0]
        builder.face(
            (bottom[a], bottom[b], top[b], top[a]),
            SLOTS["moss"],
        )
        boundary_count += 1

    assert boundary_count >= 12
    builder.components += 1


def add_barnacles(builder, rock, direction, seed, count=5):
    rng = random.Random(seed)

    for i in range(count):
        # 가까운 삼각 배열로 모아 따개비가 작은 군락으로 보이게 한다.
        offset = (
            (i % 3 - 1) * 0.043,
            (i // 3) * 0.046 - 0.027,
        )

        point, normal = surface(rock, direction, offset)
        u, v, normal = frame(normal)

        radius = rng.uniform(0.014, 0.023)
        height = radius * rng.uniform(1.0, 1.4)
        rings = []

        for scale, z in (
            (0.85, -0.004),
            (1, height * 0.42),
            (0.64, height),
            (0.28, height * 0.64),
        ):
            rings.append(builder.ring([
                point
                + normal * z
                + radius * scale * (
                    u * math.cos(j * math.tau / 7)
                    + v * math.sin(j * math.tau / 7)
                )
                for j in range(7)
            ]))

        builder.face(reversed(rings[0]), SLOTS["barnacle"])

        for first, second in zip(rings, rings[1:]):
            builder.bridge(first, second, SLOTS["barnacle"])

        builder.face(rings[-1], SLOTS["dark"])
        builder.components += 1


def add_star(builder, rock):
    point, normal = surface(
        rock,
        (0.12, -0.58, 1),
        (0.12, 0.02),
    )
    u, v, normal = frame(normal)

    bottom = []
    top = []

    for i in range(10):
        angle = math.pi / 2 + i * math.pi / 5
        radius = 0.145 if i % 2 == 0 else 0.063
        offset = (
            u * math.cos(angle) * radius
            + v * math.sin(angle) * radius
        )

        hit, _, _, _ = rock["bvh"].ray_cast(
            point + offset + normal * 2,
            -normal,
            4,
        )
        assert hit is not None

        bottom.append(hit + normal * 0.0008)
        top.append(
            hit + normal * (
                0.010 if i % 2 == 0 else 0.022
            )
        )

    first = builder.ring(bottom)
    second = builder.ring(top)
    lower = builder.ring([point + normal * 0.0008])[0]
    ridge = builder.ring([point + normal * 0.037])[0]

    for i in range(10):
        j = (i + 1) % 10
        builder.face(
            (lower, first[j], first[i]),
            SLOTS["star"],
        )
        builder.face(
            (ridge, second[i], second[j]),
            SLOTS["star"],
        )

    builder.bridge(first, second, SLOTS["star"])
    builder.components += 1


def add_grass(builder, rock, normalization_scale):
    point, _ = surface(
        rock,
        (0.50, -0.85, 0.35),
        (0.02, -0.01),
    )
    rng = random.Random(830)
    centerlines = []

    def raw_offset(offset):
        return Vector(tuple(
            offset[axis] / normalization_scale[axis]
            for axis in range(3)
        ))

    for i in range(7):
        angle = math.radians(-175 + i * 27)
        along = Vector((math.cos(angle), math.sin(angle), 0))
        across = Vector((-math.sin(angle), math.cos(angle), 0))

        reach = rng.uniform(0.22, 0.36)
        rise = rng.uniform(0.60, 0.75)
        length = rng.uniform(0.63, 0.77)
        times = (0, 0.38, 0.76, 1)

        curve = [
            along * (reach * t * t)
            + Vector((0, 0, rise * t))
            for t in times
        ]
        curve_length = sum(
            (b - a).length
            for a, b in zip(curve, curve[1:])
        )
        curve = [
            p * (length / curve_length)
            for p in curve
        ]

        width = rng.uniform(0.025, 0.040)
        base = point + raw_offset(Vector((
            rng.uniform(-0.025, 0.025),
            rng.uniform(-0.02, 0.02),
            -0.015,
        )))
        rings = []
        slot = SLOTS["moss"] if i % 3 == 0 else SLOTS["lime"]

        for offset, t, envelope in zip(
            curve[:-1],
            times[:-1],
            (0.35, 1, 0.52),
            strict=True,
        ):
            center = base + raw_offset(offset)
            half = width * envelope
            thickness = 0.006 * (1 - t * 0.6)

            rings.append(builder.ring([
                center - raw_offset(across * half),
                center + raw_offset(
                    along * thickness
                    + Vector((0, 0, thickness))
                ),
                center + raw_offset(across * half),
                center - raw_offset(
                    along * thickness
                    + Vector((0, 0, thickness))
                ),
            ]))

        builder.face(reversed(rings[0]), slot)

        for first, second in zip(rings, rings[1:]):
            builder.bridge(first, second, slot)

        tip = builder.ring([
            base + raw_offset(curve[-1]),
        ])[0]

        for j in range(4):
            builder.face(
                (
                    rings[-1][j],
                    rings[-1][(j + 1) % 4],
                    tip,
                ),
                slot,
            )

        centerlines.append([
            base + raw_offset(offset)
            for offset in curve
        ])
        builder.components += 1

    return centerlines


def build_model(name, material):
    builder = Builder()
    model_index = ORDER.index(name)

    rocks = [
        add_rock(
            builder,
            specification,
            1900 + model_index * 100 + i,
        )
        for i, specification in enumerate(LAYOUTS[name])
    ]

    rock_lower, rock_upper = bounds(builder.vertices)
    raw_size = rock_upper - rock_lower
    normalization_scale = Vector((
        2 / raw_size.x,
        2 / raw_size.y,
        HEIGHTS[name] / raw_size.z,
    ))

    grass_centerlines = []
    patches = 0
    star_count = 0
    grass_leaves = 0

    if name == ORDER[0]:
        add_moss(
            builder,
            rocks[0],
            (-0.85, -0.65, 0.85),
            100,
            size=0.18,
        )
        add_barnacles(
            builder,
            rocks[1],
            (-0.15, -1, 0.18),
            110,
        )
        patches = 1

    elif name == ORDER[1]:
        for index, direction, seed, size in (
            (0, (-0.60, -0.75, 0.75), 200, 0.17),
            (2, (-0.50, -1, 0.35), 201, 0.16),
            (3, (-0.80, -0.70, 0.28), 202, 0.18),
        ):
            add_moss(
                builder,
                rocks[index],
                direction,
                seed,
                size=size,
            )

        add_star(builder, rocks[3])
        add_barnacles(
            builder,
            rocks[4],
            (0.20, -1, 0.16),
            210,
            count=4,
        )

        patches = 3
        star_count = 1

    elif name == ORDER[2]:
        add_moss(
            builder,
            rocks[0],
            (0.30, -0.45, 1),
            300,
            size=0.18,
        )
        grass_centerlines = add_grass(
            builder,
            rocks[2],
            normalization_scale,
        )
        add_barnacles(
            builder,
            rocks[2],
            (-0.42, -1, 0.12),
            310,
        )

        patches = 1
        grass_leaves = 7

    else:
        add_moss(
            builder,
            rocks[0],
            (-0.75, -0.70, 0.25),
            400,
            size=0.14,
            lobes=6,
        )
        add_moss(
            builder,
            rocks[3],
            (0.75, -0.65, 0.45),
            401,
            size=0.11,
            lobes=5,
        )
        add_barnacles(
            builder,
            rocks[0],
            (-0.14, -1, 0.08),
            410,
            count=3,
        )
        patches = 2

    obj, metadata = builder.finish(name, material)

    metadata.update({
        "name": name,
        "rock_count": len(rocks),
        "moss_patches": patches,
        "starfish_count": star_count,
        "grass_leaf_count": grass_leaves,
    })

    assert len(rocks) == (3, 6, 4, 5)[model_index]
    assert all(
        8 <= rock["planar_face_count"] <= 14
        for rock in rocks
    )

    rock_slots = set().union(*(
        set(rock["palette_slots"])
        for rock in rocks
    ))
    assert rock_slots <= {5, 11, 13}
    assert {11, 13}.issubset(rock_slots)
    assert not {4, 6}.intersection(metadata["palette_slots"])

    metadata["rock_planar_face_counts"] = [
        rock["planar_face_count"]
        for rock in rocks
    ]
    metadata["rock_palette_slots"] = sorted(rock_slots)

    if name == ORDER[2]:
        start, end = rocks[0]["vertex_range"]
        main_lower, main_upper = bounds(
            vertex.co
            for vertex in obj.data.vertices[start:end]
        )
        main_dimensions = main_upper - main_lower
        ratio = main_dimensions.z / main_dimensions.x

        assert abs(ratio - 1.5) < 0.03, ratio
        assert abs(main_upper.z - 2.4) < EPSILON

        lengths = [
            sum(
                Vector(tuple(
                    (b[axis] - a[axis])
                    * builder.normalization_scale[axis]
                    for axis in range(3)
                )).length
                for a, b in zip(curve, curve[1:])
            )
            for curve in grass_centerlines
        ]

        assert len(lengths) == 7
        assert all(
            0.6 <= length <= 0.8
            for length in lengths
        ), lengths
        assert all(
            abs(
                builder.normalization_scale[axis]
                - normalization_scale[axis]
            ) < EPSILON
            for axis in range(3)
        ), "Tall decorations exceeded the rock envelope"

        metadata["main_rock_height_to_width"] = ratio
        metadata["main_rock_top_z"] = main_upper.z
        metadata["grass_leaf_lengths"] = lengths

    return obj, metadata


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

    assert accessor["count"] > 0
    assert stride >= size
    assert start + (accessor["count"] - 1) * stride + size <= (
        view.get("byteOffset", 0) + view["byteLength"]
    )
    assert (
        view.get("byteOffset", 0) + view["byteLength"]
        <= len(binary)
    )

    return [
        struct.unpack_from(fmt, binary, start + row * stride)
        for row in range(accessor["count"])
    ]


def verify_glb(path, obj, metadata):
    data = path.read_bytes()

    assert struct.unpack_from("<4sII", data) == (
        b"glTF",
        2,
        len(data),
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
    assert buffer["byteLength"] <= len(binary)

    mesh, = document["meshes"]
    material, = document["materials"]
    node, = document["nodes"]

    assert mesh["name"] == node["name"] == obj.name
    assert material["name"] == "palette"
    assert node["mesh"] == 0
    assert "matrix" not in node

    assert node.get("translation", [0, 0, 0]) == [0, 0, 0]
    assert node.get("rotation", [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get("scale", [1, 1, 1]) == [1, 1, 1]

    scene = document["scenes"][document.get("scene", 0)]
    assert scene["nodes"] == [0]

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
        Vector(row)
        for row in accessor_rows(
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
        abs(Vector(normal).length - 1) < 1e-4
        for normal in normals
    )
    assert {
        check_uv(uv) for uv in uvs
    } == set(metadata["palette_slots"])

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
            .length > 2e-11
        )
        assert all(
            abs(uvs[a][axis] - uvs[index][axis]) < 1e-7
            for index in (b, c)
            for axis in range(2)
        )

    triangles = len(indices) // 3

    assert 400 <= triangles <= 2500
    assert (
        triangles
        == metadata["triangles"]
        == len(obj.data.loop_triangles)
    )

    lower, upper = bounds(points)

    assert (lower - Vector((-1, 0, -1))).length < EPSILON
    assert (
        upper - Vector((1, HEIGHTS[obj.name], 1))
    ).length < EPSILON
    assert (yup(FRONT) - Vector((0, 0, 1))).length < EPSILON

    texture, = document["textures"]
    image, = document["images"]

    assert texture["source"] == 0

    pbr = material["pbrMetallicRoughness"]

    assert pbr["baseColorTexture"]["index"] == 0
    assert pbr.get("metallicFactor", 1) == 0
    assert (
        pbr.get("baseColorFactor", [1, 1, 1, 1])
        == [1, 1, 1, 1]
    )

    sampler = document["samplers"][texture["sampler"]]
    assert sampler["magFilter"] == 9728

    assert image["mimeType"] == "image/png"
    assert "uri" not in image

    view = document["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    png = binary[start:start + view["byteLength"]]

    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", png, 16) == (128, 4)

    return {
        **metadata,
        "file": str(path),
        "glb_bounds": {
            "min": list(lower),
            "max": list(upper),
        },
        "glb_dimensions": list(upper - lower),
        "verified_glb": True,
    }


def export_glb(obj, metadata):
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
        export_attributes=False,
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_draco_mesh_compression_enable=False,
        export_meshopt_compression_enable=False,
        export_use_gltfpack=False,
        will_save_settings=False,
    )

    assert result == {"FINISHED"}
    return verify_glb(path, obj, metadata)


def make_render_scene(objects, material):
    scene = bpy.data.scenes.new("tropical-rocks-compare")

    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 2400
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

    scene.world = bpy.data.worlds.new("tropical-rocks-world")
    scene.world.color = (0.94, 0.88, 0.77)

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.background_type = "WORLD"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 0.6
    shading.curvature_valley_factor = 0.7
    shading.show_object_outline = False
    shading.show_specular_highlight = False

    points = []

    for index, source in enumerate(objects):
        mesh = source.data.copy()
        shift = Vector(((index - 1.5) * 2.65, 0, 0))

        for vertex in mesh.vertices:
            vertex.co += shift
            points.append(vertex.co.copy())

        mesh.update()

        clone = bpy.data.objects.new(
            "preview-" + source.name,
            mesh,
        )
        scene.collection.objects.link(clone)

    floor_mesh = bpy.data.meshes.new("preview-sand")
    floor_mesh.from_pydata(
        [
            (-100, -100, -0.025),
            (100, -100, -0.025),
            (100, 100, -0.025),
            (-100, 100, -0.025),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    floor_mesh.materials.append(material)

    uv = floor_mesh.uv_layers.new(name="UVMap")

    for loop in uv.data:
        loop.uv = ((SLOTS["sand"] + 0.5) / 32, 0.5)

    floor_mesh.update()

    floor = bpy.data.objects.new("preview-sand", floor_mesh)
    scene.collection.objects.link(floor)

    direction = Vector((0, -1, 1)).normalized()
    rotation = (-direction).to_track_quat("-Z", "Y")
    basis = rotation.to_matrix()

    lower, upper = bounds(points)
    pivot = (lower + upper) / 2

    screen_lower, screen_upper = bounds(
        basis.transposed() @ (point - pivot)
        for point in points
    )

    pivot += basis @ Vector((
        (screen_lower.x + screen_upper.x) / 2,
        (screen_lower.y + screen_upper.y) / 2,
        0,
    ))

    camera = bpy.data.objects.new(
        "rocks-camera",
        bpy.data.cameras.new("rocks-camera"),
    )
    scene.collection.objects.link(camera)
    scene.camera = camera

    camera.data.type = "ORTHO"
    camera.data.clip_start = 0.01
    camera.data.clip_end = 200
    camera.location = pivot + direction * 30
    camera.rotation_euler = rotation.to_euler()
    camera.data.ortho_scale = 1

    frame_lower, frame_upper = bounds(
        camera.data.view_frame(scene=scene)
    )

    camera.data.ortho_scale = max(
        (screen_upper.x - screen_lower.x)
        / (frame_upper.x - frame_lower.x),
        (screen_upper.y - screen_lower.y)
        / (frame_upper.y - frame_lower.y),
    ) * 1.12

    return scene


def render_comparison(objects, material):
    scene = make_render_scene(objects, material)
    path = OUTPUT / "rocks.png"
    scene.render.filepath = str(path)

    result = bpy.ops.render.render(
        write_still=True,
        scene=scene.name,
    )

    assert result == {"FINISHED"}
    assert path.is_file()

    data = path.read_bytes()

    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack_from(">II", data, 16) == (2400, 900)

    return {
        "file": str(path),
        "left_to_right": list(ORDER),
        "view_direction_blender": [0, -1, 1],
        "elevation_degrees": 45,
        "engine": "BLENDER_WORKBENCH",
        "color_type": "TEXTURE",
        "common_display_scale": 1,
    }


def main():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    material = load_palette()

    scene = bpy.data.scenes.new("tropical-rocks-export")
    bpy.context.window.scene = scene

    built = [
        build_model(name, material)
        for name in ORDER
    ]
    bpy.context.view_layer.update()

    OUTPUT.mkdir(parents=True, exist_ok=True)

    results = [
        export_glb(obj, metadata)
        for obj, metadata in built
    ]

    # 렌더 이전에도 각 GLB의 검사 결과를 보존한다.
    for result in results:
        result["comparison"] = None
        path = OUTPUT / (result["name"] + ".json")
        path.write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    comparison = render_comparison(
        [obj for obj, _ in built],
        material,
    )

    for result in results:
        result["comparison"] = comparison
        path = OUTPUT / (result["name"] + ".json")
        path.write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(json.dumps(
        {
            "models": results,
            "comparison": comparison,
        },
        ensure_ascii=False,
    ))


if __name__ == "__main__":
    main()
