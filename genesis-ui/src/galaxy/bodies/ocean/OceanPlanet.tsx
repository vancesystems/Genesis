import { mulberry32, hashString, heightToNormalMap } from "../shared/textureUtils"
import { AXIAL_TILT, PLANET_SPHERE_GEOMETRY } from "../constants"
import { useMemo } from "react"
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  SRGBColorSpace,
} from "three"
import type { PlanetNodeProps } from "../types"
import { stableNoise } from "../../galaxyNoise"
import * as THREE from 'three'

let sharedOceanTextures: {
  diffuseTexture: THREE.CanvasTexture
  normalTexture: THREE.CanvasTexture
  roughnessTexture: THREE.CanvasTexture
} | null = null

let sharedOceanCloudTexture:
  THREE.CanvasTexture | null = null

function getSharedOceanTextures() {
  if (sharedOceanTextures) return sharedOceanTextures

  const width = 512
  const height = 256

  const diffuseCanvas = document.createElement("canvas")
  diffuseCanvas.width = width; diffuseCanvas.height = height
  const dctx = diffuseCanvas.getContext("2d")!

  const heightCanvas = document.createElement("canvas")
  heightCanvas.width = width; heightCanvas.height = height
  const hctx = heightCanvas.getContext("2d")!

  const roughCanvas = document.createElement("canvas")
  roughCanvas.width = width; roughCanvas.height = height
  const rctx = roughCanvas.getContext("2d")!

  const baseGradient = dctx.createLinearGradient(0, 0, 0, height)
  baseGradient.addColorStop(0, "#0b2740")
  baseGradient.addColorStop(0.35, "#0f4b78")
  baseGradient.addColorStop(0.68, "#10608f")
  baseGradient.addColorStop(1, "#08243b")
  dctx.fillStyle = baseGradient
  dctx.fillRect(0, 0, width, height)

  hctx.fillStyle = "#404040" // deep water = low relief
  hctx.fillRect(0, 0, width, height)

  rctx.fillStyle = "#303030" // deep water = glossy
  rctx.fillRect(0, 0, width, height)

  // Large shallow-water shelves / reef zones
  for (let index = 0; index < 22; index++) {
    const xNoise = stableNoise(`shared-ocean-shelf-x:${index}`)
    const yNoise = stableNoise(`shared-ocean-shelf-y:${index}`)
    const widthNoise = stableNoise(`shared-ocean-shelf-width:${index}`)
    const heightNoiseVal = stableNoise(`shared-ocean-shelf-height:${index}`)
    const rotationNoise = stableNoise(`shared-ocean-shelf-rotation:${index}`)

    const x = xNoise * width
    const y = yNoise * height
    const radiusX = 20 + widthNoise * 55
    const radiusY = 10 + heightNoiseVal * 26
    const rotation = rotationNoise * Math.PI * 2

    dctx.save(); dctx.translate(x, y); dctx.rotate(rotation)
    const shelfGradient = dctx.createRadialGradient(0, 0, 0, 0, 0, radiusX)
    shelfGradient.addColorStop(0, "rgba(140, 238, 255, 0.88)")
    shelfGradient.addColorStop(0.34, "rgba(72, 205, 226, 0.58)")
    shelfGradient.addColorStop(0.72, "rgba(33, 140, 185, 0.24)")
    shelfGradient.addColorStop(1, "rgba(0, 0, 0, 0)")
    dctx.fillStyle = shelfGradient
    dctx.beginPath(); dctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2); dctx.fill()
    dctx.restore()

    hctx.save(); hctx.translate(x, y); hctx.rotate(rotation)
    const shelfHeight = hctx.createRadialGradient(0, 0, 0, 0, 0, radiusX)
    shelfHeight.addColorStop(0, "rgba(160,160,160,0.5)")
    shelfHeight.addColorStop(1, "rgba(128,128,128,0)")
    hctx.fillStyle = shelfHeight
    hctx.beginPath(); hctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2); hctx.fill()
    hctx.restore()

    rctx.save(); rctx.translate(x, y); rctx.rotate(rotation)
    const shelfRough = rctx.createRadialGradient(0, 0, 0, 0, 0, radiusX)
    shelfRough.addColorStop(0, "rgba(90,90,90,0.4)")
    shelfRough.addColorStop(1, "rgba(48,48,48,0)")
    rctx.fillStyle = shelfRough
    rctx.beginPath(); rctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2); rctx.fill()
    rctx.restore()
  }

  // Small island / archipelago clusters
  for (let index = 0; index < 18; index++) {
    const xNoise = stableNoise(`shared-ocean-island-x:${index}`)
    const yNoise = stableNoise(`shared-ocean-island-y:${index}`)
    const widthNoise = stableNoise(`shared-ocean-island-width:${index}`)
    const heightNoiseVal = stableNoise(`shared-ocean-island-height:${index}`)
    const rotationNoise = stableNoise(`shared-ocean-island-rotation:${index}`)

    const x = xNoise * width
    const y = yNoise * height
    const radiusX = 5 + widthNoise * 18
    const radiusY = 2 + heightNoiseVal * 8
    const rotation = rotationNoise * Math.PI * 2

    dctx.save(); dctx.translate(x, y); dctx.rotate(rotation)
    const islandGradient = dctx.createRadialGradient(0, 0, 0, 0, 0, radiusX)
    islandGradient.addColorStop(0, "rgba(236, 245, 214, 0.95)")
    islandGradient.addColorStop(0.42, "rgba(123, 189, 104, 0.85)")
    islandGradient.addColorStop(0.75, "rgba(88, 148, 86, 0.38)")
    islandGradient.addColorStop(1, "rgba(0, 0, 0, 0)")
    dctx.fillStyle = islandGradient
    dctx.beginPath(); dctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2); dctx.fill()
    dctx.restore()

    hctx.save(); hctx.translate(x, y); hctx.rotate(rotation)
    const islandHeight = hctx.createRadialGradient(0, 0, 0, 0, 0, radiusX)
    islandHeight.addColorStop(0, "rgba(230,230,230,0.9)") // land = raised
    islandHeight.addColorStop(0.7, "rgba(170,170,170,0.4)")
    islandHeight.addColorStop(1, "rgba(128,128,128,0)")
    hctx.fillStyle = islandHeight
    hctx.beginPath(); hctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2); hctx.fill()
    hctx.restore()

    rctx.save(); rctx.translate(x, y); rctx.rotate(rotation)
    const islandRough = rctx.createRadialGradient(0, 0, 0, 0, 0, radiusX)
    islandRough.addColorStop(0, "rgba(220,220,220,0.85)") // land = matte
    islandRough.addColorStop(1, "rgba(48,48,48,0)")
    rctx.fillStyle = islandRough
    rctx.beginPath(); rctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2); rctx.fill()
    rctx.restore()
  }

  // Subtle current / band variation (diffuse only)
  dctx.globalCompositeOperation = "screen"
  for (let index = 0; index < 26; index++) {
    const yNoise = stableNoise(`shared-ocean-current-y:${index}`)
    const opacityNoise = stableNoise(`shared-ocean-current-opacity:${index}`)
    const widthNoise = stableNoise(`shared-ocean-current-width:${index}`)

    const y = yNoise * height
    const bandWidth = 20 + widthNoise * 55
    const opacity = 0.025 + opacityNoise * 0.035

    dctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    dctx.fillRect(0, y, width, bandWidth)
  }
  dctx.globalCompositeOperation = "source-over"

  // fine ripple so open water isn't perfectly flat under lighting
  const rippleRand = mulberry32(hashString("shared-ocean-ripple"))
  const grain = hctx.getImageData(0, 0, width, height)
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rippleRand() - 0.5) * 6
    grain.data[i] += n
    grain.data[i + 1] += n
    grain.data[i + 2] += n
  }
  hctx.putImageData(grain, 0, 0)

  const normalCanvas = heightToNormalMap(heightCanvas, 2)

  const diffuseTexture = new CanvasTexture(diffuseCanvas)
  diffuseTexture.colorSpace = SRGBColorSpace
  diffuseTexture.wrapS = THREE.RepeatWrapping
  diffuseTexture.wrapT = THREE.ClampToEdgeWrapping
  diffuseTexture.generateMipmaps = true
  diffuseTexture.needsUpdate = true

  const normalTexture = new CanvasTexture(normalCanvas)
  normalTexture.wrapS = THREE.RepeatWrapping
  normalTexture.wrapT = THREE.ClampToEdgeWrapping
  normalTexture.needsUpdate = true

  const roughnessTexture = new CanvasTexture(roughCanvas)
  roughnessTexture.wrapS = THREE.RepeatWrapping
  roughnessTexture.wrapT = THREE.ClampToEdgeWrapping
  roughnessTexture.needsUpdate = true

  sharedOceanTextures = { diffuseTexture, normalTexture, roughnessTexture }
  return sharedOceanTextures
}

function getSharedOceanCloudTexture() {
  if (sharedOceanCloudTexture) {
    return sharedOceanCloudTexture
  }

  const canvas = document.createElement("canvas")

  canvas.width = 128
  canvas.height = 64

  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create shared cloud texture")
  }

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  )

  context.filter = "blur(2px)"

  for (let index = 0; index < 55; index++) {
    const xNoise = stableNoise(
      `shared-ocean-cloud-x:${index}`
    )

    const yNoise = stableNoise(
      `shared-ocean-cloud-y:${index}`
    )

    const widthNoise = stableNoise(
      `shared-ocean-cloud-width:${index}`
    )

    const heightNoise = stableNoise(
      `shared-ocean-cloud-height:${index}`
    )

    const opacityNoise = stableNoise(
      `shared-ocean-cloud-opacity:${index}`
    )

    const x = xNoise * canvas.width
    const y = yNoise * canvas.height

    const radiusX = 4 + widthNoise * 14
    const radiusY = 1.5 + heightNoise * 4

    const opacity =
      0.2 + opacityNoise * 0.45

    const gradient =
      context.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radiusX
      )

    gradient.addColorStop(
      0,
      `rgba(255, 255, 255, ${opacity})`
    )

    gradient.addColorStop(
      0.55,
      `rgba(235, 247, 255, ${opacity * 0.45})`
    )

    gradient.addColorStop(
      1,
      "rgba(255, 255, 255, 0)"
    )

    context.fillStyle = gradient

    context.beginPath()

    context.ellipse(
      x,
      y,
      radiusX,
      radiusY,
      0,
      0,
      Math.PI * 2
    )

    context.fill()
  }

  context.filter = "none"

  const texture = new THREE.CanvasTexture(canvas)

  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.needsUpdate = true

  sharedOceanCloudTexture = texture

  return texture
}

export function OceanPlanet({ node }: PlanetNodeProps) {
  const visualSize = Math.min(2.15, 1.18 + Math.sqrt(node.mass) * 0.022)

  const colorNoise = stableNoise(`${node.path}:ocean-color`)
  const rotationNoise = stableNoise(`${node.path}:ocean-rotation`)
  const cloudRotationNoise = stableNoise(`${node.path}:cloud-rotation`)

  const { diffuseTexture, normalTexture, roughnessTexture } = useMemo(
    () => getSharedOceanTextures(),
    []
  )

  const cloudTexture = useMemo(() => getSharedOceanCloudTexture(), [])

  const oceanColor = useMemo(() => {
    return new THREE.Color().setHSL(0.535 + colorNoise * 0.04, 0.8, 0.34)
  }, [colorNoise])

  const atmosphereColor = useMemo(() => {
    return new THREE.Color().setHSL(0.53 + colorNoise * 0.04, 0.95, 0.74)
  }, [colorNoise])

  return (
    <group position={node.position}>
      <group
        scale={visualSize}
        rotation={[AXIAL_TILT[0], rotationNoise * Math.PI * 2, AXIAL_TILT[2]]}
      >
        <mesh geometry={PLANET_SPHERE_GEOMETRY}>
          <meshPhysicalMaterial
            map={diffuseTexture}
            normalMap={normalTexture}
            normalScale={new THREE.Vector2(0.5, 0.5)}
            roughnessMap={roughnessTexture}
            roughness={1}
            metalness={0}
            clearcoat={0.6}
            clearcoatRoughness={0.15}
            color={oceanColor}
            emissive="#02111d"
            emissiveIntensity={0.16}
          />
        </mesh>

        <mesh
          geometry={PLANET_SPHERE_GEOMETRY}
          scale={1.02}
          rotation={[0.08, cloudRotationNoise * Math.PI * 2, -0.04]}
        >
          <meshLambertMaterial
            map={cloudTexture}
            color="#ffffff"
            transparent
            opacity={0.66}
            alphaTest={0.04}
            depthWrite={false}
          />
        </mesh>

        <mesh geometry={PLANET_SPHERE_GEOMETRY} scale={1.075}>
          <meshBasicMaterial
            color={atmosphereColor}
            transparent
            opacity={0.22}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        <mesh geometry={PLANET_SPHERE_GEOMETRY} scale={1.125}>
          <meshBasicMaterial
            color={atmosphereColor}
            transparent
            opacity={0.07}
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