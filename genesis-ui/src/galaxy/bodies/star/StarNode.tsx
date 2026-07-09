import { useMemo, useRef, useEffect } from "react"
import { stableNoise } from "../../galaxyNoise"
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  SRGBColorSpace,
  Group,
} from "three"
import type { PlanetNodeProps } from "../types"
import { useFrame } from "@react-three/fiber"

export function StarNode({ node }: PlanetNodeProps) {
  const bodyRef = useRef<Group | null>(null)
  const innerGlowRef = useRef<Group | null>(null)
  const coronaRef = useRef<Group | null>(null)
  const elapsedTimeRef = useRef(0)

  const visualSize = Math.min(
    8,
    2.4 + Math.sqrt(node.mass) * 0.08
  )

  const surfaceTexture = useMemo(() => {
    const canvas = document.createElement("canvas")

    canvas.width = 512
    canvas.height = 256

    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Could not create star surface texture")
    }

    const baseGradient = context.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    )

    baseGradient.addColorStop(0, "#f59e0b")
    baseGradient.addColorStop(0.3, "#ffd166")
    baseGradient.addColorStop(0.5, "#fff7cc")
    baseGradient.addColorStop(0.7, "#ffd166")
    baseGradient.addColorStop(1, "#ea580c")

    context.fillStyle = baseGradient
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.globalCompositeOperation = "screen"

    for (let index = 0; index < 140; index++) {
      const xNoise = stableNoise(
        `${node.path}:star-bright-x:${index}`
      )

      const yNoise = stableNoise(
        `${node.path}:star-bright-y:${index}`
      )

      const radiusNoise = stableNoise(
        `${node.path}:star-bright-radius:${index}`
      )

      const intensityNoise = stableNoise(
        `${node.path}:star-bright-intensity:${index}`
      )

      const x = xNoise * canvas.width
      const y = yNoise * canvas.height
      const radius = 4 + radiusNoise * 28

      const plasmaGradient = context.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius
      )

      plasmaGradient.addColorStop(
        0,
        `rgba(255, 255, 230, ${0.18 + intensityNoise * 0.32})`
      )

      plasmaGradient.addColorStop(
        0.45,
        `rgba(255, 190, 70, ${0.08 + intensityNoise * 0.14})`
      )

      plasmaGradient.addColorStop(
        1,
        "rgba(255, 100, 20, 0)"
      )

      context.fillStyle = plasmaGradient
      context.beginPath()
      context.arc(x, y, radius, 0, Math.PI * 2)
      context.fill()
    }

    context.globalCompositeOperation = "multiply"

    for (let index = 0; index < 90; index++) {
      const xNoise = stableNoise(
        `${node.path}:star-dark-x:${index}`
      )

      const yNoise = stableNoise(
        `${node.path}:star-dark-y:${index}`
      )

      const radiusNoise = stableNoise(
        `${node.path}:star-dark-radius:${index}`
      )

      const opacityNoise = stableNoise(
        `${node.path}:star-dark-opacity:${index}`
      )

      const x = xNoise * canvas.width
      const y = yNoise * canvas.height
      const radius = 3 + radiusNoise * 18

      const darkGradient = context.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius
      )

      darkGradient.addColorStop(
        0,
        `rgba(115, 35, 5, ${0.08 + opacityNoise * 0.18})`
      )

      darkGradient.addColorStop(
        1,
        "rgba(180, 70, 10, 0)"
      )

      context.fillStyle = darkGradient
      context.beginPath()
      context.arc(x, y, radius, 0, Math.PI * 2)
      context.fill()
    }
    context.globalCompositeOperation = "source-over"

    const generatedTexture = new CanvasTexture(canvas)

    generatedTexture.colorSpace = SRGBColorSpace
    generatedTexture.needsUpdate = true

    return generatedTexture
  }, [node.path])

  const glowTexture = useMemo(() => {
    const canvas = document.createElement("canvas")

    canvas.width = 256
    canvas.height = 256

    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Could not create star glow texture")
    }

    const glowGradient = context.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    )

    glowGradient.addColorStop(
      0,
      "rgba(255, 255, 235, 1)"
    )

    glowGradient.addColorStop(
      0.16,
      "rgba(255, 235, 145, 0.95)"
    )

    glowGradient.addColorStop(
      0.4,
      "rgba(255, 165, 55, 0.42)"
    )

    glowGradient.addColorStop(
      0.72,
      "rgba(255, 90, 20, 0.12)"
    )

    glowGradient.addColorStop(
      1,
      "rgba(255, 80, 10, 0)"
    )

    context.fillStyle = glowGradient
    context.fillRect(0, 0, canvas.width, canvas.height)

    const generatedTexture = new CanvasTexture(canvas)

    generatedTexture.colorSpace = SRGBColorSpace
    generatedTexture.needsUpdate = true

    return generatedTexture
  }, [])

  useEffect(() => {
    return () => {
      surfaceTexture.dispose()
      glowTexture.dispose()
    }
  }, [surfaceTexture, glowTexture])

  useFrame((_, delta) => {
    elapsedTimeRef.current += delta

    const elapsedTime = elapsedTimeRef.current

    if (bodyRef.current) {
      bodyRef.current.rotation.y += delta * 0.045
      bodyRef.current.rotation.z += delta * 0.006
    }

    if (innerGlowRef.current) {
      const innerPulse =
        1 + Math.sin(elapsedTime * 1.6) * 0.015

      innerGlowRef.current.scale.setScalar(innerPulse)
    }

    if (coronaRef.current) {
      const coronaPulse =
        1 + Math.sin(elapsedTime * 1.15) * 0.035

      coronaRef.current.scale.setScalar(coronaPulse)
    }
  })

  return (
    <group position={node.position}>
      {(node.orbitorCount ?? 0) > 0 && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry
          args={[
            10,
            0.08,
            12,
            160,
          ]}
        />
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0.3}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      )}
      <group scale={visualSize}>
        <group ref={bodyRef}>
          <mesh>
            <sphereGeometry args={[1, 64, 64]} />

            <meshStandardMaterial
              map={surfaceTexture}
              emissiveMap={surfaceTexture}
              color="#fff4c2"
              emissive="#ff9500"
              emissiveIntensity={2.8}
              roughness={0.48}
              metalness={0}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      <group ref={innerGlowRef}>
        <mesh scale={1.075}>
          <sphereGeometry args={[1, 48, 48]} />

          <meshBasicMaterial
            color="#fff0a3"
            transparent
            opacity={0.32}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={coronaRef}>
        <mesh scale={1.3}>
          <sphereGeometry args={[1, 48, 48]} />

          <meshBasicMaterial
            color="#ff8a24"
            transparent
            opacity={0.1}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        <sprite scale={[4.4, 4.4, 1]}>
          <spriteMaterial
            map={glowTexture}
            color="#ffad42"
            transparent
            opacity={0.32}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>

        <sprite scale={[2.65, 2.65, 1]}>
          <spriteMaterial
            map={glowTexture}
            color="#fff0a8"
            transparent
            opacity={0.46}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>

        <sprite scale={[6.5, 0.42, 1]}>
          <spriteMaterial
            map={glowTexture}
            color="#ffcc73"
            transparent
            opacity={0.16}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>

        <sprite scale={[0.3, 4.4, 1]}>
          <spriteMaterial
            map={glowTexture}
            color="#fff1b0"
            transparent
            opacity={0.09}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      </group>
    </group>
  )
}