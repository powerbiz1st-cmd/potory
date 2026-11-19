import { Suspense, useEffect, useMemo } from 'react'
import ModelPlant from './ModelPlant'
import * as THREE from 'three'
import type { Design, Shape } from '../design'

const HEIGHT = 1.5

// 화분 단면(옆에서 본 윤곽선). 이 선을 360° 회전시키면 화분이 됩니다 (LatheGeometry).
function profile(shape: Shape, scale = 1): THREE.Vector2[] {
  const pts: THREE.Vector2[] = []
  const N = 28
  for (let i = 0; i <= N; i++) {
    const t = i / N
    let r: number
    switch (shape) {
      case 'cylinder':
        r = 0.88
        break
      case 'round':
        r = 0.6 + 0.44 * Math.sin(Math.PI * (0.12 + 0.76 * t))
        break
      case 'square':
        r = 1.18 // 4면으로 돌리면 네모 화분
        break
      default:
        r = 0.7 + 0.32 * t
    }
    pts.push(new THREE.Vector2(r * scale, t * HEIGHT))
  }
  return pts
}

function topRadius(shape: Shape) {
  const p = profile(shape)
  return p[p.length - 1].x
}

// 색 + 패턴 + 문구를 캔버스에 그려서 화분 표면 이미지(텍스처)로 씁니다.
function drawSurface(d: Design) {
  const W = 2048
  const H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.fillStyle = d.color
  g.fillRect(0, 0, W, H)
  g.fillStyle = d.accent
  g.strokeStyle = d.accent

  switch (d.pattern) {
    case 'stripe':
      for (let y = 40; y < H; y += 96) g.fillRect(0, y, W, 34)
      break
    case 'dots':
      for (let y = 40; y < H; y += 80)
        for (let x = (y / 80) % 2 ? 40 : 80; x < W; x += 80) {
          g.beginPath()
          g.arc(x, y, 14, 0, Math.PI * 2)
          g.fill()
        }
      break
    case 'wave':
      g.lineWidth = 22
      g.lineCap = 'round'
      for (let y = 70; y < H; y += 120) {
        g.beginPath()
        for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin((x / W) * Math.PI * 16) * 22)
        g.stroke()
      }
      break
    case 'check':
      for (let y = 0; y < H; y += 64)
        for (let x = (y / 64) % 2 ? 0 : 64; x < W; x += 128) g.fillRect(x, y, 64, 64)
      break
  }

  const text = d.text.trim()
  if (text) {
    let size = 170
    g.font = `400 ${size}px "Black Han Sans", "Anton", sans-serif`
    const maxW = 420
    const w = g.measureText(text).width
    if (w > maxW) size = Math.floor((size * maxW) / w)
    g.font = `400 ${size}px "Black Han Sans", "Anton", sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    // 라벨 스티커 느낌의 바탕
    const tw = g.measureText(text).width
    if (d.pattern !== 'none') {
      g.fillStyle = d.color
      g.beginPath()
      g.roundRect(1024 - tw / 2 - 36, 256 - size * 0.62, tw + 72, size * 1.24, 28)
      g.fill()
    }
    g.fillStyle = d.textColor
    g.fillText(text, 1024, 262)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.anisotropy = 8
  // 네모 화분은 면의 가운데에 글씨가 오도록 위치 보정
  if (d.shape === 'square') tex.offset.x = 0.125
  return tex
}

function Plant({ kind }: { kind: Design['plant'] }) {
  const leaf = <meshStandardMaterial color="#3DBE29" roughness={0.55} />
  const dark = <meshStandardMaterial color="#1F7A12" roughness={0.6} />
  if (kind === 'succulent') {
    const leaves = []
    for (let ring = 0; ring < 3; ring++) {
      const n = 7 - ring * 2
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.5
        const tilt = 1.1 - ring * 0.35
        leaves.push(
          <mesh key={`${ring}-${i}`} position={[Math.sin(a) * (0.32 - ring * 0.1), 0.12 + ring * 0.08, Math.cos(a) * (0.32 - ring * 0.1)]} rotation={[Math.cos(a) * tilt, 0, -Math.sin(a) * tilt]} castShadow>
            <coneGeometry args={[0.13, 0.42 - ring * 0.08, 10]} />
            <meshStandardMaterial color={ring === 2 ? '#B6E36A' : '#6CC24A'} roughness={0.5} />
          </mesh>,
        )
      }
    }
    return <group>{leaves}</group>
  }
  if (kind === 'flower') {
    return (
      <group>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.9, 8]} />
          {dark}
        </mesh>
        <mesh position={[0.13, 0.3, 0]} rotation={[0, 0, -0.9]} scale={[1, 0.35, 0.6]} castShadow>
          <sphereGeometry args={[0.16, 16, 12]} />
          {leaf}
        </mesh>
        <group position={[0, 0.92, 0]} rotation={[0.35, 0, 0]}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17]} rotation={[0, -a, 0]} scale={[1, 0.25, 0.55]} castShadow>
                <sphereGeometry args={[0.15, 16, 10]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
              </mesh>
            )
          })}
          <mesh scale={[1, 0.6, 1]} castShadow>
            <sphereGeometry args={[0.11, 16, 12]} />
            <meshStandardMaterial color="#FFC20E" roughness={0.5} />
          </mesh>
        </group>
      </group>
    )
  }
  // sprout
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.4, 8]} />
        {dark}
      </mesh>
      <mesh position={[-0.16, 0.42, 0]} rotation={[0, 0, 0.7]} scale={[1, 0.32, 0.62]} castShadow>
        <sphereGeometry args={[0.2, 18, 12]} />
        {leaf}
      </mesh>
      <mesh position={[0.16, 0.44, 0]} rotation={[0, 0, -0.7]} scale={[1, 0.32, 0.62]} castShadow>
        <sphereGeometry args={[0.2, 18, 12]} />
        {leaf}
      </mesh>
    </group>
  )
}

export default function Pot({ design, fontsReady }: { design: Design; fontsReady: boolean }) {
  const segs = design.shape === 'square' ? 4 : 72

  const geo = useMemo(() => {
    const outer = new THREE.LatheGeometry(profile(design.shape), segs)
    const inner = new THREE.LatheGeometry(profile(design.shape, 0.9).slice(4), segs)
    const rOut = topRadius(design.shape)
    const rIn = rOut * 0.9
    const rim = new THREE.LatheGeometry([new THREE.Vector2(rIn, HEIGHT), new THREE.Vector2(rOut, HEIGHT)], segs)
    const soil = new THREE.LatheGeometry([new THREE.Vector2(0, HEIGHT - 0.14), new THREE.Vector2(rIn * 0.99, HEIGHT - 0.14)], segs)
    return { outer, inner, rim, soil }
  }, [design.shape, segs])

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  const texture = useMemo(
    () => drawSurface(design),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design.color, design.accent, design.pattern, design.text, design.textColor, design.shape, fontsReady],
  )
  useEffect(() => () => texture.dispose(), [texture])

  // 회전 보정: 텍스처 가운데(문구)가 카메라 정면에 오도록
  const rotY = design.shape === 'square' ? (5 * Math.PI) / 4 : Math.PI

  return (
    <group>
      <group rotation={[0, rotY, 0]}>
        <mesh geometry={geo.outer} castShadow receiveShadow>
          <meshStandardMaterial map={texture} roughness={0.55} side={THREE.DoubleSide} flatShading={design.shape === 'square'} />
        </mesh>
        <mesh geometry={geo.inner}>
          <meshStandardMaterial color={design.color} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={geo.rim}>
          <meshStandardMaterial color={design.color} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={geo.soil} receiveShadow>
          <meshStandardMaterial color="#4A2E1B" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={[0, HEIGHT - 0.14, 0]}>
        {design.plant === 'monstera' ? (
          // 모델을 받는 동안은 새싹을 잠깐 보여줌
          <Suspense fallback={<Plant kind="sprout" />}>
            <ModelPlant id="monstera" radius={topRadius(design.shape) * 0.9 * (design.shape === 'square' ? Math.SQRT1_2 : 1)} />
          </Suspense>
        ) : (
          <Plant kind={design.plant} />
        )}
      </group>
    </group>
  )
}
