import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Float, OrbitControls } from '@react-three/drei'
import type { Group } from 'three'
import Pot from './Pot'
import type { Design } from '../design'
import { useFontsReady } from '../hooks'

// 키 큰 식물(몬스테라)은 화면 밖으로 잘리지 않게 전체를 조금 작게, 아래로 내려서 보여줌
const frame = (d: Design) => (d.plant === 'monstera' ? { y: -1.3, s: 0.66 } : { y: -0.95, s: 1 })

// 랜딩용: 마우스 방향으로 살짝 기울어짐. 회전은 OrbitControls(autoRotate)가 맡아서 드래그로도 돌릴 수 있음
function Showcase({ design, fontsReady }: { design: Design; fontsReady: boolean }) {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x += (state.pointer.y * 0.25 - ref.current.rotation.x) * 0.06
    ref.current.rotation.z += (-state.pointer.x * 0.15 - ref.current.rotation.z) * 0.06
  })
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.8}>
      <group ref={ref} position={[0, frame(design).y, 0]} scale={frame(design).s}>
        <Pot design={design} fontsReady={fontsReady} />
      </group>
    </Float>
  )
}

export default function PotStage({ design, interactive = false }: { design: Design; interactive?: boolean }) {
  const fontsReady = useFontsReady()
  return (
    <Canvas className="cursor-grab active:cursor-grabbing" shadows dpr={[1, 2]} camera={{ position: [0, 1.4, 5.2], fov: 34 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <ambientLight intensity={1.1} />
      <hemisphereLight args={['#ffffff', '#5a7a30', 0.6]} />
      <directionalLight position={[3, 6, 4]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} />
      {interactive ? (
        <>
          <group position={[0, frame(design).y, 0]} scale={frame(design).s}>
            <Pot design={design} fontsReady={fontsReady} />
          </group>
          <OrbitControls enablePan={false} minDistance={3.4} maxDistance={8} target={[0, 0, 0]} minPolarAngle={0.3} maxPolarAngle={1.7} />
        </>
      ) : (
        <>
          <Showcase design={design} fontsReady={fontsReady} />
          {/* 줌은 끄고(페이지 스크롤 방해 방지) 드래그 회전만 허용, 손을 떼면 다시 자동 회전 */}
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={2.4} minPolarAngle={1.1} maxPolarAngle={1.45} />
        </>
      )}
      <ContactShadows position={[0, frame(design).y - 0.1, 0]} opacity={0.35} blur={2.6} scale={7} far={3} />
    </Canvas>
  )
}
