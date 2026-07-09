import { mulberry32, hashString, heightToNormalMap } from "../shared/textureUtils"
import { useMemo } from "react"
import type { PlanetNodeProps } from "../types"
import { stableNoise } from "../../galaxyNoise"
import type { GalaxyNode } from "../../galaxyTypes"
import * as THREE from 'three'
import { getPlanetVisuals } from "../planetVisuals"
import { AXIAL_TILT } from "../constants"

const DWARF_TEXTURE_VARIANT_COUNT = 5

const sharedDwarfTextures = new Map<number, {
  diffuseTexture: THREE.CanvasTexture
  normalTexture: THREE.CanvasTexture
  roughnessTexture: THREE.CanvasTexture
}>()

function getDwarfTextureVariant(node: GalaxyNode) {
  return Math.min(
    DWARF_TEXTURE_VARIANT_COUNT - 1,
    Math.floor(stableNoise(`${node.path}:dwarf-texture-variant`) * DWARF_TEXTURE_VARIANT_COUNT)
  )
}

function getSharedDwarfTextures(variant: number) {
  const existing = sharedDwarfTextures.get(variant)
  if (existing) return existing

  const size = 384
  const rand = mulberry32(hashString(`dwarf-variant:${variant}`))

  const diffuseCanvas = document.createElement("canvas")
  diffuseCanvas.width = diffuseCanvas.height = size
  const dctx = diffuseCanvas.getContext("2d")!

  const heightCanvas = document.createElement("canvas")
  heightCanvas.width = heightCanvas.height = size
  const hctx = heightCanvas.getContext("2d")!

  const roughCanvas = document.createElement("canvas")
  roughCanvas.width = roughCanvas.height = size
  const rctx = roughCanvas.getContext("2d")!

  // barren gray-tan base, brightened near poles (frost caps)
  const base = dctx.createLinearGradient(0, 0, 0, size)
  base.addColorStop(0, "#e7e2d8")
  base.addColorStop(0.12, "#c9c1b0")
  base.addColorStop(0.5, "#9c9384")
  base.addColorStop(0.88, "#c9c1b0")
  base.addColorStop(1, "#e7e2d8")
  dctx.fillStyle = base
  dctx.fillRect(0, 0, size, size)

  hctx.fillStyle = "#808080"
  hctx.fillRect(0, 0, size, size)

  rctx.fillStyle = "#d0d0d0"
  rctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 100; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 6 + rand() * 26
    const alpha = 0.06 + rand() * 0.14
    const dark = rand() > 0.5
    const tint = dark ? "60,55,48" : "230,225,210"

    const grad = dctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `rgba(${tint},${alpha})`)
    grad.addColorStop(1, `rgba(${tint},0)`)
    dctx.fillStyle = grad
    dctx.beginPath(); dctx.arc(x, y, r, 0, Math.PI * 2); dctx.fill()
  }

  const craterCount = 26 + Math.floor(rand() * 14)
  for (let i = 0; i < craterCount; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 4 + rand() * 22

    const dGrad = dctx.createRadialGradient(x, y, 0, x, y, r)
    dGrad.addColorStop(0, "rgba(40,36,30,0.5)")
    dGrad.addColorStop(0.7, "rgba(60,54,46,0.28)")
    dGrad.addColorStop(0.86, "rgba(235,230,215,0.4)")
    dGrad.addColorStop(1, "rgba(0,0,0,0)")
    dctx.fillStyle = dGrad
    dctx.beginPath(); dctx.arc(x, y, r, 0, Math.PI * 2); dctx.fill()

    const hGrad = hctx.createRadialGradient(x, y, 0, x, y, r)
    hGrad.addColorStop(0, "rgba(50,50,50,0.75)")
    hGrad.addColorStop(0.75, "rgba(110,110,110,0.3)")
    hGrad.addColorStop(0.88, "rgba(210,210,210,0.55)")
    hGrad.addColorStop(1, "rgba(128,128,128,0)")
    hctx.fillStyle = hGrad
    hctx.beginPath(); hctx.arc(x, y, r, 0, Math.PI * 2); hctx.fill()

    const rGrad = rctx.createRadialGradient(x, y, 0, x, y, r)
    rGrad.addColorStop(0, "rgba(60,60,60,0.4)")
    rGrad.addColorStop(1, "rgba(208,208,208,0)")
    rctx.fillStyle = rGrad
    rctx.beginPath(); rctx.arc(x, y, r, 0, Math.PI * 2); rctx.fill()
  }

  const grain = dctx.getImageData(0, 0, size, size)
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rand() - 0.5) * 10
    grain.data[i] += n
    grain.data[i + 1] += n
    grain.data[i + 2] += n
  }
  dctx.putImageData(grain, 0, 0)

  const normalCanvas = heightToNormalMap(heightCanvas, 2.4)

  const diffuseTexture = new THREE.CanvasTexture(diffuseCanvas)
  diffuseTexture.colorSpace = THREE.SRGBColorSpace

  const normalTexture = new THREE.CanvasTexture(normalCanvas)
  const roughnessTexture = new THREE.CanvasTexture(roughCanvas)

  const textures = { diffuseTexture, normalTexture, roughnessTexture }
  sharedDwarfTextures.set(variant, textures)
  return textures
}

export function DwarfPlanet({ node }: PlanetNodeProps) {
  const visuals = getPlanetVisuals(node)

  const visualSize = Math.min(1.2, 0.22 + Math.log1p(node.mass) * 0.075)

  const rotationNoise = stableNoise(`${node.path}:dwarf-rotation`)
  const textureVariant = getDwarfTextureVariant(node)

  const { diffuseTexture, normalTexture, roughnessTexture } = useMemo(
    () => getSharedDwarfTextures(textureVariant),
    [textureVariant]
  )

  const tintColor = useMemo(() => new THREE.Color(visuals.body), [visuals.body])

  return (
    <group
      position={node.position}
      scale={visualSize * visuals.size}
      rotation={[AXIAL_TILT[0], rotationNoise * Math.PI * 2, AXIAL_TILT[2]]}
    >
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          map={diffuseTexture}
          normalMap={normalTexture}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          roughnessMap={roughnessTexture}
          roughness={1}
          metalness={0}
          color={tintColor}
          emissive={visuals.emissive}
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  )
}