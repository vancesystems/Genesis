import { useMemo, useRef, useEffect } from "react"
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  SRGBColorSpace,
  Group,
  DoubleSide
} from "three"
import type { PlanetNodeProps } from "../types"
import { useFrame } from "@react-three/fiber"

export function GasGiantPlanet({ node }: PlanetNodeProps) {
  const bodyRef = useRef<Group | null>(null)

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")

    canvas.width = 512
    canvas.height = 256

    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Could not create gas giant texture")
    }

    context.fillStyle = "#b96d2c"
    context.fillRect(0, 0, canvas.width, canvas.height)

    const bands = [
      { height: 20, color: "#6f3518" },
      { height: 32, color: "#c77a35" },
      { height: 18, color: "#e7b56e" },
      { height: 26, color: "#9a4e20" },
      { height: 38, color: "#d68b43" },
      { height: 16, color: "#f0c987" },
      { height: 32, color: "#7f3d1b" },
      { height: 28, color: "#c06b2d" },
      { height: 24, color: "#e0a55f" },
      { height: 22, color: "#8d451e" },
    ]

    let currentY = 0

    for (const band of bands) {
      context.fillStyle = band.color
      context.fillRect(0, currentY, canvas.width, band.height)

      context.fillStyle = "rgba(255, 235, 190, 0.16)"
      context.fillRect(0, currentY + band.height * 0.2, canvas.width, 2)

      context.fillStyle = "rgba(55, 20, 8, 0.12)"
      context.fillRect(0, currentY + band.height * 0.75, canvas.width, 2)

      currentY += band.height
    }

    context.save()
    context.translate(350, 155)
    context.rotate(-0.08)

    const stormGradient = context.createRadialGradient(
      0,
      0,
      4,
      0,
      0,
      42,
    )

    stormGradient.addColorStop(0, "#f7c58c")
    stormGradient.addColorStop(0.45, "#d96b38")
    stormGradient.addColorStop(1, "#7f271b")

    context.fillStyle = stormGradient
    context.beginPath()
    context.ellipse(0, 0, 44, 19, 0, 0, Math.PI * 2)
    context.fill()

    context.strokeStyle = "rgba(255, 221, 174, 0.45)"
    context.lineWidth = 3
    context.beginPath()
    context.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2)
    context.stroke()

    context.restore()

    const generatedTexture = new CanvasTexture(canvas)
    generatedTexture.colorSpace = SRGBColorSpace
    generatedTexture.needsUpdate = true

    return generatedTexture
  }, [])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useFrame((_, delta) => {
    if (!bodyRef.current) {
      return
    }

    bodyRef.current.rotation.y += delta * 0.12
  })

  const visualSize = Math.min(
    4,
    1.2 + Math.sqrt(node.mass) * 0.04
  )
  return (
    <group
      position={node.position}
      scale={visualSize * 1.6}
      rotation={[0.18, 0, -0.12]}
    >
      <group ref={bodyRef}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 32]} />

          <meshStandardMaterial
            map={texture}
            bumpMap={texture}
            bumpScale={0.025}
            roughness={0.78}
            metalness={0}
          />
        </mesh>

        <mesh scale={1.055}>
          <sphereGeometry args={[1, 24, 24]} />

          <meshBasicMaterial
            color="#f4b66f"
            transparent
            opacity={0.14}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <mesh rotation={[Math.PI / 2.25, 0.16, 0.08]}>
        <ringGeometry args={[1.35, 1.95, 96]} />

        <meshStandardMaterial
          color="#b68a54"
          transparent
          opacity={0.32}
          roughness={0.9}
          metalness={0}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2.25, 0.16, 0.08]}>
        <ringGeometry args={[1.48, 1.62, 96]} />

        <meshBasicMaterial
          color="#e7c38e"
          transparent
          opacity={0.32}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}