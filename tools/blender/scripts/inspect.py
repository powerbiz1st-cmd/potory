# .blend 안의 오브젝트·폴리곤 수·재질·크기를 출력 (변환 전 구조 파악용)
import bpy
for o in bpy.data.objects:
    tris = 0
    if o.type == 'MESH':
        tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    print(f"OBJ {o.name!r} type={o.type} parent={o.parent.name if o.parent else None} tris={tris} dims={tuple(round(d,3) for d in o.dimensions)} loc={tuple(round(v,3) for v in o.matrix_world.translation)} mats={[m.name for m in getattr(o.data,'materials',[]) if m]} mods={[m.type for m in o.modifiers]}")
for m in bpy.data.materials:
    if m.use_nodes:
        print(f"MAT {m.name!r}: " + ", ".join(f"{n.type}:{n.image.name if getattr(n,'image',None) else ''}" for n in m.node_tree.nodes))
for i in bpy.data.images:
    print(f"IMG {i.name!r} {i.filepath} size={tuple(i.size)}")
