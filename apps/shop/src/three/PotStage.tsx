import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Lightformer, OrbitControls } from '@react-three/drei'
import type { Group } from 'three'
import Pot from './Pot'
import type { Design } from '../design'
import { useFontsReady } from '../hooks'

// 화분 + 몬스테라 전체가 화면에 들어오도록 크기·위치 고정
const FRAME = { y: -1.4, s: 0.66 }

// 랜딩용: 마우스 방향으로 아주 살짝 기울어짐. 회전은 OrbitControls(autoRotate)가 맡아서 드래그로도 돌릴 수 있음
function Showcase({ design, fontsReady }: { design: Design; fontsReady: boolean }) {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x += (state.pointer.y * 0.08 - ref.current.rotation.x) * 0.05
    ref.current.rotation.z += (-state.pointer.x * 0.05 - ref.current.rotation.z) * 0.05
  })
  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.25}>
      <group ref={ref} position={[0, FRAME.y, 0]} scale={FRAME.s}>
        <Pot design={design} fontsReady={fontsReady} />
      </group>
    </Float>
  )
}

// 스튜디오 조명: 외부 HDR 파일 없이 코드로 만든 반사광 (유리·유약 광택용)
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={1.4} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
      <Lightformer form="rect" intensity={1.0} position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
      <Lightformer form="ring" intensity={0.8} position={[0, 2, -5]} scale={3} />
    </Environment>
  )
}

export default function PotStage({ design, interactive = false }: { design: Design; interactive?: boolean }) {
  const fontsReady = useFontsReady()
  return (
    <Canvas className="cursor-grab active:cursor-grabbing" shadows dpr={[1, 2]} camera={{ position: interactive ? [0, 1.4, 6.3] : [0, 1.3, 5.4], fov: 34 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <Studio />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      {interactive ? (
        <>
          <group position={[0, FRAME.y, 0]} scale={FRAME.s}>
            <Pot design={design} fontsReady={fontsReady} />
          </group>
          <OrbitControls enablePan={false} minDistance={3.4} maxDistance={8} target={[0, 0, 0]} minPolarAngle={0.3} maxPolarAngle={1.7} />
        </>
      ) : (
        <>
          <Showcase design={design} fontsReady={fontsReady} />
          {/* 줌은 끄고(페이지 스크롤 방해 방지) 드래그 회전만 허용, 손을 떼면 다시 천천히 자동 회전 */}
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.2} minPolarAngle={1.1} maxPolarAngle={1.45} />
        </>
      )}
      <ContactShadows position={[0, FRAME.y - 0.01, 0]} opacity={0.28} blur={2.8} scale={6} far={3} />
    </Canvas>
  )
}
