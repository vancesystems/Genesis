import "@react-three/fiber"
import type { GalaxyNode, NoteGraph, GlobalGraph } from "./galaxyTypes"
import { buildGalaxyNodes, buildGlobalGalaxyNodes } from "./buildGalaxyNodes"
import { stableNoise } from "./galaxyNoise"
import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  DoubleSide,
  SRGBColorSpace,
} from "three"
import type { Group } from "three"

type GalaxySceneProps = {
  graphData: NoteGraph | null
  globalData: GlobalGraph | null
}

type PlanetNodeProps = {
  node: GalaxyNode
}

const PLANET_PALETTES = [
  {
    body: "#2563eb",
    emissive: "#172554",
    glow: "#60a5fa",
  },
  {
    body: "#dc2626",
    emissive: "#450a0a",
    glow: "#fb923c",
  },
  {
    body: "#16a34a",
    emissive: "#052e16",
    glow: "#86efac",
  },
  {
    body: "#7c3aed",
    emissive: "#2e1065",
    glow: "#c084fc",
  },
  {
    body: "#d97706",
    emissive: "#451a03",
    glow: "#fbbf24",
  },
]

function getPlanetVisuals(node: GalaxyNode) {
  if (node.kind === "center") {
    return {
      body: "#f8fafc",
      emissive: "#38bdf8",
      glow: "#7dd3fc",
      size: 1.4,
      glowScale: 1.5,
      glowOpacity: 0.28,
    }
  }

  if (node.kind === "outgoing") {
    return {
      body: "#2563eb",
      emissive: "#1d4ed8",
      glow: "#60a5fa",
      size: 0.7,
      glowScale: 1.2,
      glowOpacity: 0.16,
    }
  }

  if (node.kind === "global") {
    const paletteNoise = stableNoise(`palette:${node.path}`)
    const sizeNoise = stableNoise(`size:${node.path}`)
    const roughnessNoise = stableNoise(`roughness:${node.path}`)
    const paletteIndex = Math.min(
      PLANET_PALETTES.length - 1,
      Math.floor(paletteNoise * PLANET_PALETTES.length)
    )

    const palette = PLANET_PALETTES[paletteIndex]
    return {
      body: palette.body,
      emissive: palette.emissive,
      glow: palette.glow,
      size: 0.7 + sizeNoise * 0.6,
      roughness: 0.35 + roughnessNoise * 0.55,
      glowScale: 1.15,
      glowOpacity: 0.1,
    }
  }

  return {
    body: "#7c3aed",
    emissive: "#6d28d9",
    glow: "#a855f7",
    size: 0.65,
    glowScale: 1.2,
    glowOpacity: 0.16,
  }
}

function GasGiantPlanet({ node }: PlanetNodeProps) {
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

  return (
    <group
      position={node.position}
      scale={node.size * 1.6}
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

function PlanetNode({ node }: PlanetNodeProps) {
  const planetTypeNoise = stableNoise(`planet-type:${node.path}`)
  if (node.kind === "global" && planetTypeNoise < 0.12) {
    return <GasGiantPlanet node={node} />
  }
  const visuals = getPlanetVisuals(node)
  return (
    <group position={node.position} scale={node.size * visuals.size}>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
         color={visuals.body}
         emissive={visuals.emissive}
         emissiveIntensity={0.35}
         roughness={0.55}
         />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={visuals.glow} transparent={true} opacity={visuals.glowOpacity} />
      </mesh>
    </group>
  )
}

export function GalaxyScene(props: GalaxySceneProps) {
  let nodes: GalaxyNode[]

  if (props.globalData) {
    nodes = buildGlobalGalaxyNodes(props.globalData)
  } else if (props.graphData) {
    nodes = buildGalaxyNodes(props.graphData)
  } else {
    return null
  }

  return (
    <>
      {nodes.map((node) => {
        return <PlanetNode key={node.id} node={node} />
      })}
    </>
  )
}