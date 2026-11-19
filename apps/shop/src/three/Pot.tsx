import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import ModelPlant from './ModelPlant'
import type { Design, Shape } from '../design'

// 화분 크기 (식물이 주인공이 되도록 화분은 낮고 날렵하게)
export const HEIGHT = 1.15
const WALL = 0.05 // 벽 두께: 얇을수록 고급스러워 보임
const FILLET = 0.07 // 바닥 모서리 둥글기
export const SOIL_Y = HEIGHT - 0.1

// 옆에서 본 바깥 윤곽: 높이 t(0~1)에서의 반지름
function radiusAt(shape: Shape, t: number) {
  switch (shape) {
    case 'tapered':
      return 0.6 + 0.2 * Math.pow(t, 0.9)
    case 'round': {
      // 아래가 넓은 볼 → 입구로 살짝 오므라듦
      const k = Math.sin(Math.PI * (0.18 + 0.7 * t))
      return 0.5 + 0.34 * k
    }
    case 'glass':
      return 0.72
    default:
      return 0.74
  }
}

// 바닥 가운데 → 둥근 모서리 → 옆면 → 입구까지 (LatheGeometry로 돌리면 화분)
function outerProfile(shape: Shape, inset = 0): THREE.Vector2[] {
  const pts: THREE.Vector2[] = []
  const r0 = radiusAt(shape, 0) - inset
  // 둥근 바닥 모서리 (1/4 원)
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2)
    pts.push(new THREE.Vector2(r0 - FILLET + Math.sin(a) * FILLET, inset + FILLET - Math.cos(a) * FILLET))
  }
  const N = 32
  for (let i = 1; i <= N; i++) {
    const t = i / N
    const y = FILLET + (HEIGHT - FILLET) * t
    pts.push(new THREE.Vector2(radiusAt(shape, y / HEIGHT) - inset, y))
  }
  return pts
}

export function topRadius(shape: Shape) {
  return radiusAt(shape, 1)
}

// 패턴 + 문구를 캔버스에 그려 화분 표면 이미지로 사용
// transparentBg: 유리 화분은 바탕 없이 무늬·글자만 (인쇄된 느낌)
function drawSurface(d: Design, transparentBg: boolean) {
  const W = 2048
  const H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  if (!transparentBg) {
    g.fillStyle = d.color
    g.fillRect(0, 0, W, H)
  }
  g.fillStyle = d.accent
  g.strokeStyle = d.accent

  // 무늬는 가늘고 촘촘하게 (굵은 줄무늬는 장난감처럼 보임)
  switch (d.pattern) {
    case 'stripe':
      for (let y = 30; y < H; y += 46) g.fillRect(0, y, W, 6)
      break
    case 'dots':
      for (let y = 26; y < H; y += 52)
        for (let x = (y / 52) % 2 ? 26 : 52; x < W; x += 52) {
          g.beginPath()
          g.arc(x, y, 6, 0, Math.PI * 2)
          g.fill()
        }
      break
    case 'wave':
      g.lineWidth = 6
      g.lineCap = 'round'
      for (let y = 40; y < H; y += 64) {
        g.beginPath()
        for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin((x / W) * Math.PI * 24) * 10)
        g.stroke()
      }
      break
    case 'check':
      g.globalAlpha = 0.9
      for (let y = 0; y < H; y += 40)
        for (let x = (y / 40) % 2 ? 0 : 40; x < W; x += 80) g.fillRect(x, y, 40, 40)
      g.globalAlpha = 1
      break
  }

  const text = d.text.trim()
  if (text) {
    // 글자는 작고 자간 넓게 → 브랜드 라벨 느낌
    let size = 92
    const font = (s: number) => `400 ${s}px "Anton", "Black Han Sans", sans-serif`
    g.font = font(size)
    g.letterSpacing = '10px'
    const maxW = 520
    const w = g.measureText(text).width
    if (w > maxW) size = Math.floor((size * maxW) / w)
    g.font = font(size)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const tw = g.measureText(text).width
    if (d.pattern !== 'none' && !transparentBg) {
      g.fillStyle = d.color
      g.fillRect(1024 - tw / 2 - 40, 256 - size * 0.75, tw + 80, size * 1.5)
    }
    g.fillStyle = d.textColor
    g.fillText(text, 1024, 262)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.anisotropy = 8
  return tex
}

export default function Pot({ design, fontsReady }: { design: Design; fontsReady: boolean }) {
  const glass = design.shape === 'glass'

  const geo = useMemo(() => {
    const prof = outerProfile(design.shape)
    const side = new THREE.LatheGeometry(prof.slice(6), 96) // 둥근 모서리 위 옆면 (무늬·글자가 들어가는 면)
    const corner = new THREE.LatheGeometry(prof.slice(0, 7), 96) // 바닥 둥근 모서리
    const bottom = new THREE.CircleGeometry(radiusAt(design.shape, 0) - FILLET, 64).rotateX(Math.PI / 2)
    const inner = new THREE.LatheGeometry(outerProfile(design.shape, WALL).filter((p) => p.y > SOIL_Y - 0.02), 96)
    const rOut = topRadius(design.shape)
    const rim = new THREE.LatheGeometry([new THREE.Vector2(rOut - WALL, HEIGHT), new THREE.Vector2(rOut, HEIGHT)], 96)
    const soil = new THREE.CircleGeometry(radiusAt(design.shape, SOIL_Y / HEIGHT) - WALL, 64).rotateX(-Math.PI / 2).translate(0, SOIL_Y, 0)
    // 유리 화분 안쪽 흙기둥: 아래는 밝은 자갈층, 위는 흙
    const fillProf = (y0: number, y1: number) => {
      const p: THREE.Vector2[] = [new THREE.Vector2(0, y0)]
      for (let i = 0; i <= 12; i++) {
        const y = y0 + ((y1 - y0) * i) / 12
        p.push(new THREE.Vector2(radiusAt(design.shape, y / HEIGHT) - WALL - 0.01, y))
      }
      p.push(new THREE.Vector2(0, y1))
      return new THREE.LatheGeometry(p, 64)
    }
    const pebbles = fillProf(WALL, 0.32)
    const dirt = fillProf(0.32, SOIL_Y)
    return { side, corner, bottom, inner, rim, soil, pebbles, dirt }
  }, [design.shape])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  const texture = useMemo(
    () => drawSurface(design, glass),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design.color, design.accent, design.pattern, design.text, design.textColor, glass, fontsReady],
  )
  useEffect(() => () => texture.dispose(), [texture])

  const tint = useMemo(() => new THREE.Color(design.color).lerp(new THREE.Color('#ffffff'), 0.7), [design.color])
  const hasPrint = design.pattern !== 'none' || design.text.trim() !== ''

  return (
    <group>
      {/* 텍스처 가운데(문구)가 카메라 정면에 오도록 회전 */}
      <group rotation={[0, Math.PI, 0]}>
        {glass ? (
          <>
            {/* 유리 몸통 */}
            {[geo.side, geo.corner].map((g, i) => (
              <mesh key={i} geometry={g} renderOrder={2}>
                <meshPhysicalMaterial color={tint} transmission={1} thickness={0.3} roughness={0.04} ior={1.45} metalness={0} side={THREE.DoubleSide} transparent />
              </mesh>
            ))}
            <mesh geometry={geo.bottom}>
              <meshPhysicalMaterial color={tint} transmission={1} thickness={0.3} roughness={0.04} ior={1.45} />
            </mesh>
            {/* 유리 겉면 인쇄 (무늬·글자) */}
            {hasPrint && (
              <mesh geometry={geo.side} scale={1.004} renderOrder={3}>
                <meshStandardMaterial map={texture} transparent alphaTest={0.02} roughness={0.5} depthWrite={false} />
              </mesh>
            )}
            {/* 안쪽: 자갈층 + 흙 */}
            <mesh geometry={geo.pebbles}>
              <meshStandardMaterial color="#D9D1C1" roughness={0.95} />
            </mesh>
            <mesh geometry={geo.dirt}>
              <meshStandardMaterial color="#3B2A1E" roughness={1} />
            </mesh>
          </>
        ) : (
          <>
            {/* 도자기: 살짝 광택 있는 유약 느낌 */}
            <mesh geometry={geo.side} castShadow receiveShadow>
              <meshPhysicalMaterial map={texture} roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.4} side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={geo.corner} castShadow>
              <meshPhysicalMaterial color={design.color} roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.4} side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={geo.bottom}>
              <meshStandardMaterial color={design.color} roughness={0.6} />
            </mesh>
            <mesh geometry={geo.inner}>
              <meshStandardMaterial color={design.color} roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={geo.soil} receiveShadow>
              <meshStandardMaterial color="#3B2A1E" roughness={1} />
            </mesh>
          </>
        )}
        <mesh geometry={geo.rim}>
          {glass ? (
            <meshPhysicalMaterial color={tint} transmission={1} thickness={0.3} roughness={0.04} ior={1.45} side={THREE.DoubleSide} />
          ) : (
            <meshPhysicalMaterial color={design.color} roughness={0.42} clearcoat={0.35} side={THREE.DoubleSide} />
          )}
        </mesh>
      </group>
      <group position={[0, SOIL_Y, 0]}>
        <Suspense fallback={null}>
          <ModelPlant id="monstera" radius={topRadius(design.shape) - WALL} />
        </Suspense>
      </group>
    </group>
  )
}
