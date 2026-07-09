import { mulberry32, hashString, heightToNormalMap } from "../shared/textureUtils"
import { useEffect, useMemo } from "react"
import { BackSide, AdditiveBlending } from "three"
import type { PlanetNodeProps } from "../types"
import { stableNoise } from "../../galaxyNoise"
import * as THREE from 'three'
import { AXIAL_TILT, PLANET_SPHERE_GEOMETRY } from "../constants"

function createIceTextures(seedString: string) {
  const size = 1024
  const rand = mulberry32(hashString(seedString))

  const diffuseCanvas = document.createElement('canvas')
  diffuseCanvas.width = diffuseCanvas.height = size
  const dctx = diffuseCanvas.getContext('2d')!

  const heightCanvas = document.createElement('canvas')
  heightCanvas.width = heightCanvas.height = size
  const hctx = heightCanvas.getContext('2d')!

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = roughCanvas.height = size
  const rctx = roughCanvas.getContext('2d')!

  // base: pale ice-blue equator, brighter poles, more saturated than before
  const base = dctx.createLinearGradient(0, 0, 0, size)
  base.addColorStop(0, '#eef7ff')
  base.addColorStop(0.16, '#cfe9fb')
  base.addColorStop(0.5, '#8fcdf0')
  base.addColorStop(0.84, '#cfe9fb')
  base.addColorStop(1, '#eef7ff')
  dctx.fillStyle = base
  dctx.fillRect(0, 0, size, size)

  hctx.fillStyle = '#808080'
  hctx.fillRect(0, 0, size, size)

  rctx.fillStyle = '#4d4d4d' // mid roughness baseline
  rctx.fillRect(0, 0, size, size)

  // frost / mottling patches — more contrast, real texture instead of haze
  for (let i = 0; i < 220; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 10 + rand() * 55
    const bright = rand() > 0.45
    const tint = bright ? '255,255,255' : '70,130,175'
    const alpha = bright ? 0.15 + rand() * 0.25 : 0.1 + rand() * 0.18
    const grad = dctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `rgba(${tint},${alpha})`)
    grad.addColorStop(1, `rgba(${tint},0)`)
    dctx.fillStyle = grad
    dctx.beginPath()
    dctx.arc(x, y, r, 0, Math.PI * 2)
    dctx.fill()

    // frost patches are smoother (lower roughness), rocky/cracked bits rougher
    const rGrad = rctx.createRadialGradient(x, y, 0, x, y, r)
    const roughVal = bright ? 60 : 130
    rGrad.addColorStop(0, `rgba(${roughVal},${roughVal},${roughVal},0.5)`)
    rGrad.addColorStop(1, `rgba(${roughVal},${roughVal},${roughVal},0)`)
    rctx.fillStyle = rGrad
    rctx.beginPath()
    rctx.arc(x, y, r, 0, Math.PI * 2)
    rctx.fill()
  }

  // fracture network — deeper grooves, sharper highlight edge
  const crackCount = 7 + Math.floor(rand() * 7)
  for (let c = 0; c < crackCount; c++) {
    let x = rand() * size
    let y = rand() * size
    let angle = rand() * Math.PI * 2
    const segments = 30 + Math.floor(rand() * 40)
    const points: [number, number][] = [[x, y]]

    for (let s = 0; s < segments; s++) {
      angle += (rand() - 0.5) * 0.85
      const step = 10 + rand() * 16
      x += Math.cos(angle) * step
      y += Math.sin(angle) * step
      points.push([x, y])
    }

    const drawPath = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (const [px, py] of points) ctx.lineTo(px, py)
    }

    // diffuse: dark crevice line + thin bright highlight beside it
    drawPath(dctx)
    dctx.strokeStyle = `rgba(60,100,140,${0.25 + rand() * 0.2})`
    dctx.lineWidth = 2 + rand() * 2.5
    dctx.stroke()
    drawPath(dctx)
    dctx.strokeStyle = `rgba(255,255,255,${0.3 + rand() * 0.2})`
    dctx.lineWidth = 0.8
    dctx.stroke()

    // height: a real groove (dark = recessed)
    drawPath(hctx)
    hctx.strokeStyle = 'rgba(20,20,20,0.85)'
    hctx.lineWidth = 3 + rand() * 3
    hctx.stroke()

    // roughness: cracks are rougher (scattered light)
    drawPath(rctx)
    rctx.strokeStyle = 'rgba(180,180,180,0.6)'
    rctx.lineWidth = 4 + rand() * 3
    rctx.stroke()
  }

  // fine grain for material realism
  const grain = dctx.getImageData(0, 0, size, size)
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rand() - 0.5) * 8
    grain.data[i] += n
    grain.data[i + 1] += n
    grain.data[i + 2] += n
  }
  dctx.putImageData(grain, 0, 0)

  const normalCanvas = heightToNormalMap(heightCanvas, 3)

  const diffuseTexture = new THREE.CanvasTexture(diffuseCanvas)
  diffuseTexture.colorSpace = THREE.SRGBColorSpace
  diffuseTexture.anisotropy = 8

  const normalTexture = new THREE.CanvasTexture(normalCanvas)
  normalTexture.anisotropy = 8

  const roughnessTexture = new THREE.CanvasTexture(roughCanvas)

  return { diffuseTexture, normalTexture, roughnessTexture }
}

export function IcePlanet({ node }: PlanetNodeProps) {
  const visualSize = Math.min(2, 1.1 + Math.sqrt(node.mass) * 0.02)

  const colorNoise = stableNoise(`${node.path}:ice-color`)
  const rotationNoise = stableNoise(`${node.path}:ice-rotation`)

  const iceColor = useMemo(() => {
    return new THREE.Color().setHSL(0.55 + colorNoise * 0.08, 0.55, 0.8)
  }, [colorNoise])

  const { diffuseTexture, normalTexture, roughnessTexture } = useMemo(
    () => createIceTextures(`${node.path}:ice-surface`),
    [node.path]
  )

  useEffect(() => {
    return () => {
      diffuseTexture.dispose()
      normalTexture.dispose()
      roughnessTexture.dispose()
    }
  }, [diffuseTexture, normalTexture, roughnessTexture])

  return (
    <group position={node.position}>
      <group
        scale={visualSize}
        rotation={[AXIAL_TILT[0], rotationNoise * Math.PI * 2, AXIAL_TILT[2]]}
      >
        <mesh geometry={PLANET_SPHERE_GEOMETRY}>
          <meshPhysicalMaterial
            color={iceColor}
            map={diffuseTexture}
            normalMap={normalTexture}
            normalScale={new THREE.Vector2(0.9, 0.9)}
            roughnessMap={roughnessTexture}
            roughness={1}
            metalness={0.02}
            clearcoat={0.4}
            clearcoatRoughness={0.25}
            envMapIntensity={1.1}
            emissive="#0c4a6e"
            emissiveIntensity={0.04}
          />
        </mesh>

        {/* thin, subtle atmosphere rim only — no inner glow shell */}
        <mesh geometry={PLANET_SPHERE_GEOMETRY} scale={1.035}>
          <meshBasicMaterial
            color="#bae6fd"
            transparent
            opacity={0.08}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}