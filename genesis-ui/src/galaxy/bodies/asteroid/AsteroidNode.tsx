import { mulberry32, hashString, heightToNormalMap } from "../shared/textureUtils"
import type { GalaxyNode } from "../../galaxyTypes"
import { useEffect, useMemo, useRef } from "react"
import { BackSide, AdditiveBlending } from "three"
import { stableNoise } from "../../galaxyNoise"
import * as THREE from 'three'

function smoothNoise3D(x: number, y: number, z: number, seed: number) {
  return (
    Math.sin(x * 1.7 + y * 2.3 + z * 0.6 + seed) +
    Math.sin(x * 3.1 - y * 1.1 + z * 2.7 + seed * 1.3) * 0.5 +
    Math.sin(x * 0.9 + y * 4.2 - z * 1.3 + seed * 0.7) * 0.25
  ) / 1.75
}

let sharedRockGeometry: THREE.BufferGeometry | null = null

// bakes crater dents + rim bumps directly into vertex positions (shared once, since
// all asteroid instances reuse the same geometry and get variety from scale/rotation)
function getSharedRockGeometry() {
  if (sharedRockGeometry) return sharedRockGeometry

  const geometry = new THREE.IcosahedronGeometry(1, 3)
  const position = geometry.attributes.position
  const vertex = new THREE.Vector3()

  const craterCount = 9
  const craterCenters: THREE.Vector3[] = []

  for (let i = 0; i < craterCount; i++) {
    const theta = stableNoise(`rock-crater-theta:${i}`) * Math.PI * 2
    const phi = Math.acos(stableNoise(`rock-crater-phi:${i}`) * 2 - 1)

    craterCenters.push(
      new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      )
    )
  }

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i)
    const direction = vertex.clone().normalize()

    let offset =
      smoothNoise3D(direction.x * 2.4, direction.y * 2.4, direction.z * 2.4, 3.1) * 0.09 +
      smoothNoise3D(direction.x * 5.1, direction.y * 5.1, direction.z * 5.1, 7.4) * 0.045

    for (const center of craterCenters) {
      const dist = direction.distanceTo(center)
      const radius = 0.32

      if (dist < radius) {
        const falloff = 1 - dist / radius
        offset -= falloff * falloff * 0.16 // bowl-shaped dent

        if (dist > radius * 0.75) {
          offset += (1 - Math.abs(dist / radius - 0.87) * 6) * 0.02 // raised rim
        }
      }
    }

    const displaced = direction.multiplyScalar(1 + offset)
    position.setXYZ(i, displaced.x, displaced.y, displaced.z)
  }

  geometry.computeVertexNormals()
  sharedRockGeometry = geometry

  return geometry
}

let sharedRockTextures: {
  diffuseTexture: THREE.CanvasTexture
  normalTexture: THREE.CanvasTexture
  roughnessTexture: THREE.CanvasTexture
} | null = null

function getSharedRockTextures() {
  if (sharedRockTextures) return sharedRockTextures

  const size = 512
  const rand = mulberry32(hashString("shared-asteroid-rock"))

  const diffuseCanvas = document.createElement("canvas")
  diffuseCanvas.width = diffuseCanvas.height = size
  const dctx = diffuseCanvas.getContext("2d")!

  const heightCanvas = document.createElement("canvas")
  heightCanvas.width = heightCanvas.height = size
  const hctx = heightCanvas.getContext("2d")!

  const roughCanvas = document.createElement("canvas")
  roughCanvas.width = roughCanvas.height = size
  const rctx = roughCanvas.getContext("2d")!

  dctx.fillStyle = "#75726c"
  dctx.fillRect(0, 0, size, size)

  hctx.fillStyle = "#808080"
  hctx.fillRect(0, 0, size, size)

  rctx.fillStyle = "#e6e6e6" // matte rock baseline
  rctx.fillRect(0, 0, size, size)

  // tonal mottling — warm/cool patches so it doesn't read as flat gray
  for (let i = 0; i < 140; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 6 + rand() * 30
    const warm = rand() > 0.5
    const tint = warm ? "94,80,62" : "70,74,80"
    const alpha = 0.08 + rand() * 0.14

    const grad = dctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `rgba(${tint},${alpha})`)
    grad.addColorStop(1, `rgba(${tint},0)`)
    dctx.fillStyle = grad
    dctx.beginPath(); dctx.arc(x, y, r, 0, Math.PI * 2); dctx.fill()
  }

  // small surface craters (micro-detail on top of the geometry-level ones)
  for (let i = 0; i < 60; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 4 + rand() * 16

    const dGrad = dctx.createRadialGradient(x, y, 0, x, y, r)
    dGrad.addColorStop(0, "rgba(30,28,26,0.55)")
    dGrad.addColorStop(0.7, "rgba(40,38,35,0.3)")
    dGrad.addColorStop(0.85, "rgba(150,140,125,0.35)")
    dGrad.addColorStop(1, "rgba(0,0,0,0)")
    dctx.fillStyle = dGrad
    dctx.beginPath(); dctx.arc(x, y, r, 0, Math.PI * 2); dctx.fill()

    const hGrad = hctx.createRadialGradient(x, y, 0, x, y, r)
    hGrad.addColorStop(0, "rgba(60,60,60,0.8)")
    hGrad.addColorStop(0.75, "rgba(120,120,120,0.3)")
    hGrad.addColorStop(0.88, "rgba(200,200,200,0.5)")
    hGrad.addColorStop(1, "rgba(128,128,128,0)")
    hctx.fillStyle = hGrad
    hctx.beginPath(); hctx.arc(x, y, r, 0, Math.PI * 2); hctx.fill()
  }

  const grain = dctx.getImageData(0, 0, size, size)
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rand() - 0.5) * 14
    grain.data[i] += n
    grain.data[i + 1] += n
    grain.data[i + 2] += n
  }
  dctx.putImageData(grain, 0, 0)

  const normalCanvas = heightToNormalMap(heightCanvas, 2.2)

  const diffuseTexture = new THREE.CanvasTexture(diffuseCanvas)
  diffuseTexture.colorSpace = THREE.SRGBColorSpace

  const normalTexture = new THREE.CanvasTexture(normalCanvas)
  const roughnessTexture = new THREE.CanvasTexture(roughCanvas)

  sharedRockTextures = { diffuseTexture, normalTexture, roughnessTexture }
  return sharedRockTextures
}

const ASTEROID_TINTS = ["#8a8f97", "#9c8874", "#7f8a8f", "#a89a86", "#8f8a7f"]

function getAsteroidTint(node: GalaxyNode) {
  const tintNoise = stableNoise(`${node.path}:asteroid-tint`)
  const index = Math.min(
    ASTEROID_TINTS.length - 1,
    Math.floor(tintNoise * ASTEROID_TINTS.length)
  )
  return ASTEROID_TINTS[index]
}

export function InstancedAsteroids({ nodes }: { nodes: GalaxyNode[] }) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null)
  const rimMeshRef = useRef<THREE.InstancedMesh | null>(null)

  const geometry = useMemo(() => {
    return getSharedRockGeometry()
  }, [])

  const { diffuseTexture, normalTexture, roughnessTexture } = useMemo(
    () => getSharedRockTextures(),
    []
  )

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: diffuseTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: roughnessTexture,
      roughness: 0.95,
      metalness: 0,

      // Important: keep this bright.
      // This multiplies with instance colors + texture.
      color: "#f3f4f6",

      // Important: this prevents them from going black in weak lighting.
      emissive: "#6b625a",
      emissiveMap: diffuseTexture,
      emissiveIntensity: 0.32,

      vertexColors: true,
      toneMapped: false,
    })
  }, [diffuseTexture, normalTexture, roughnessTexture])

  const rimMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: "#cbd5e1",
      transparent: true,
      opacity: 0.075,
      side: BackSide,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  }, [])

  useEffect(() => {
    const mesh = meshRef.current
    const rimMesh = rimMeshRef.current

    if (!mesh || !rimMesh) return

    const dummy = new THREE.Object3D()
    const tintColor = new THREE.Color()
    const softLight = new THREE.Color("#e5e7eb")

    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index]

      const visualSize = Math.min(
        0.95,
        0.22 + Math.log1p(node.mass) * 0.065
      )

      const xStretch =
        0.72 + stableNoise(`${node.path}:asteroid-x`) * 0.82

      const yStretch =
        0.5 + stableNoise(`${node.path}:asteroid-y`) * 0.62

      const zStretch =
        0.72 + stableNoise(`${node.path}:asteroid-z`) * 0.82

      const rotationX =
        stableNoise(`${node.path}:asteroid-rx`) * Math.PI * 2

      const rotationY =
        stableNoise(`${node.path}:asteroid-ry`) * Math.PI * 2

      const rotationZ =
        stableNoise(`${node.path}:asteroid-rz`) * Math.PI * 2

      dummy.position.set(
        node.position[0],
        node.position[1],
        node.position[2]
      )

      dummy.rotation.set(
        rotationX,
        rotationY,
        rotationZ
      )

      dummy.scale.set(
        visualSize * xStretch,
        visualSize * yStretch,
        visualSize * zStretch
      )

      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)

      // Slightly lighten the tint so it does not crush to black.
      tintColor
        .set(getAsteroidTint(node))
        .lerp(softLight, 0.28)

      mesh.setColorAt(index, tintColor)

      dummy.scale.set(
        visualSize * xStretch * 1.045,
        visualSize * yStretch * 1.045,
        visualSize * zStretch * 1.045
      )

      dummy.updateMatrix()
      rimMesh.setMatrixAt(index, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
    rimMesh.instanceMatrix.needsUpdate = true

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }

    mesh.computeBoundingSphere()
    rimMesh.computeBoundingSphere()
  }, [nodes])

  if (nodes.length === 0) return null

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, nodes.length]}
        frustumCulled={false}
        dispose={null}
      />

      <instancedMesh
        ref={rimMeshRef}
        args={[geometry, rimMaterial, nodes.length]}
        frustumCulled={false}
        dispose={null}
      />
    </group>
  )
}