# 식물 화분 모델(.blend) → 웹용 경량 GLB
# - 이름에 'Vase'가 들어간 화분 오브젝트를 지우고 식물만 남김
# - 원래 화분 윗면 가운데를 원점(0,0,0)으로, 화분 윗면 반지름을 1로 맞춤
#   → three.js에서 우리 화분 윗면 반지름만큼 scale 하면 딱 맞게 올라감
# - 폴리곤을 목표치로 줄이고(Decimate), 텍스처는 1K로 줄여 WebP + Draco 압축
#
# 실행: blender -b <파일.blend> --disable-autoexec --python convert_plant.py -- <출력.glb> [목표삼각형수]
import sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
out = argv[0]
target_tris = int(argv[1]) if len(argv) > 1 else 40000
TEX = 1024


def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


meshes = [o for o in bpy.data.objects if o.type == 'MESH']
vase = [o for o in meshes if 'vase' in o.name.lower()]
plant = [o for o in meshes if o not in vase]
assert plant, 'no plant meshes found'

# 1) 기준점: 화분 윗면 (화분이 없으면 식물 맨 아래)
if vase:
    vlo, vhi = world_bbox(vase)
    base = Vector(((vlo.x + vhi.x) / 2, (vlo.y + vhi.y) / 2, vhi.z))
    radius = max(vhi.x - vlo.x, vhi.y - vlo.y) / 2
else:
    plo, phi = world_bbox(plant)
    base = Vector(((plo.x + phi.x) / 2, (plo.y + phi.y) / 2, plo.z))
    radius = max(phi.x - plo.x, phi.y - plo.y) / 2
print(f'BASE {tuple(round(v, 3) for v in base)} radius={radius:.3f}')

# 2) 식물 외 전부 삭제 (화분·카메라·조명 등)
for o in list(bpy.data.objects):
    if o not in plant:
        bpy.data.objects.remove(o, do_unlink=True)

# 3) 식물 메쉬를 하나로 합치고 변환 적용
bpy.ops.object.select_all(action='DESELECT')
for o in plant:
    o.hide_set(False)
    o.select_set(True)
bpy.context.view_layer.objects.active = plant[0]
for o in plant:  # 남아 있는 모디파이어는 먼저 적용
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=m.name)
        except Exception as e:
            print('modifier skip', o.name, m.name, e)
bpy.context.view_layer.objects.active = plant[0]
if len(plant) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# 4) 원점 이동 + 크기 정규화 (화분 윗면 반지름 = 1)
s = 1.0 / radius
for v in obj.data.vertices:
    v.co = (v.co - base) * s

# 5) 폴리곤 줄이기
tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
print(f'TRIS before={tris}')
if tris > target_tris:
    m = obj.modifiers.new('dec', 'DECIMATE')
    m.ratio = target_tris / tris
    m.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier='dec')
print(f'TRIS after={sum(len(p.vertices) - 2 for p in obj.data.polygons)}')

# 5-1) 재질 단순화: 원본은 커스텀 노드 그룹을 거쳐서 glTF가 텍스처를 못 따라감
#      → 색(COL)·거칠기(ROUGHNESS)·노멀(NRM) 이미지를 표준 Principled BSDF에 직접 연결
def find_img(prefix, kind):
    for img in bpy.data.images:
        n = img.name.upper()
        if n.startswith(prefix.upper()) and f'_{kind}_' in n:
            return img
    return None


for slot in obj.material_slots:
    mat = slot.material
    if not mat:
        continue
    prefix = mat.name.rsplit('_', 1)[0]  # 'PlantMonstera001_4K' → 'PlantMonstera001'
    col, rough, nrm = (find_img(prefix, k) for k in ('COL', 'ROUGHNESS', 'NRM'))
    print(f'MAT {mat.name}: col={col and col.name} rough={rough and rough.name} nrm={nrm and nrm.name}')
    nt = mat.node_tree
    nt.nodes.clear()
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], outn.inputs['Surface'])
    bsdf.inputs['Metallic'].default_value = 0.0
    if col:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = col
        nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    if rough:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = rough; t.image.colorspace_settings.name = 'Non-Color'
        nt.links.new(t.outputs['Color'], bsdf.inputs['Roughness'])
    if nrm:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = nrm; t.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    mat.use_backface_culling = False

# 쓰지 않는 이미지(화분용·SSS·METALNESS)는 지워서 축소/내보내기 대상에서 제외
used = {n.image for m in bpy.data.materials if m.use_nodes for n in m.node_tree.nodes if getattr(n, 'image', None)}
for img in list(bpy.data.images):
    if img not in used:
        bpy.data.images.remove(img)

# 6) 텍스처 1K로 축소 (쓰지 않는 SSS 등은 내보내기에서 자동 제외)
for img in bpy.data.images:
    if img.size[0] > TEX or img.size[1] > TEX:
        w, h = img.size
        k = TEX / max(w, h)
        img.scale(max(1, int(w * k)), max(1, int(h * k)))
        print(f'IMG {img.name} {w}x{h} -> {tuple(img.size)}')

# 7) GLB 내보내기
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_image_format='WEBP',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_cameras=False,
    export_lights=False,
)
print('EXPORTED', out)
