import json
import math
from pathlib import Path

import bpy

APP = Path(__file__).resolve().parents[2]
OUTPUT = APP / "src/views/drive/lib/engine/game/world/grassBladeShape.json"
SOURCE = Path(__file__).with_name("grassTuft.blend")
LEAVES = [(0, .78, .38), (88, .56, .36), (166, .88, .41), (243, .67, .32), (300, .48, .29)]


def make_tuft(name, sweep):
    vertices, faces = [], []
    for angle, height, width in LEAVES:
        dx, dy = math.cos(math.radians(angle)), math.sin(math.radians(angle))
        start = len(vertices)
        for reach, across, elevation in [
            (.12, -width / 2, 0), (.36, -width / 3, height * .62),
            (.73, 0, height), (.33, width / 3, height * .54), (.12, width / 2, 0)
        ]:
            vertices.append((dx * reach + dy * across + sweep * elevation, dy * reach - dx * across, elevation))
        faces.extend(tuple(start + index for index in face) for face in [(0, 1, 4), (1, 3, 4), (1, 2, 3)])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def positions(name):
    mesh = bpy.data.objects[name].data
    mesh.calc_loop_triangles()
    return [round(value, 4) for tri in mesh.loop_triangles for i in tri.vertices
            for x, y, z in [mesh.vertices[i].co] for value in (x, z, -y)]


if not bpy.data.filepath:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    make_tuft("Groundcover", 0)
    make_tuft("Coastal grass", 1.2).location.x = 2.5
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE), compress=True)

OUTPUT.write_text(json.dumps({"interior": positions("Groundcover"), "fringe": positions("Coastal grass")}) + "\n")
