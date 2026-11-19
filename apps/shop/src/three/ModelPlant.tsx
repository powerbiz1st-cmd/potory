import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// tools/blender/scripts/convert_plant.py 로 만든 GLB.
// 원점 = 원래 화분 윗면 가운데, 원래 화분 윗면 반지름 = 1 로 맞춰져 있어서
// 우리 화분 안쪽 반지름만 곱하면 크기가 맞습니다.
const BASE = import.meta.env.BASE_URL
const DRACO = `${BASE}draco/`

export const PLANT_MODELS = {
  monstera: `${BASE}models/monstera.glb`,
} as const

export type ModelPlantId = keyof typeof PLANT_MODELS

export default function ModelPlant({ id, radius }: { id: ModelPlantId; radius: number }) {
  const { scene } = useGLTF(PLANT_MODELS[id], DRACO)
  // 같은 모델을 여러 화분이 쓰더라도 따로 움직이도록 복제 + 그림자 설정
  const obj = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh
        m.castShadow = true
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat) {
          mat.side = THREE.DoubleSide // 얇은 잎 뒷면이 비어 보이지 않게
          mat.alphaTest = mat.alphaTest || 0
        }
      }
    })
    return c
  }, [scene])
  // 식물이 주인공: 식물 높이 ≈ 화분 높이의 2배 남짓
  return <primitive object={obj} scale={radius * 1.0} />
}

export function preloadPlant(id: ModelPlantId) {
  useGLTF.preload(PLANT_MODELS[id], DRACO)
}
