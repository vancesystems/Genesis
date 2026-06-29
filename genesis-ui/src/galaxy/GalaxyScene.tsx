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

function StarNode({ node }: PlanetNodeProps) {
  const bodyRef = useRef<Group | null>(null)
  const innerGlowRef = useRef<Group | null>(null)
  const coronaRef = useRef<Group | null>(null)
  const elapsedTimeRef = useRef(0)

  /*
   * Converts the note's graph mass into a controlled render size.
   *
   * Math.log1p compresses large values so a mass of 100 does not
   * create a star ten times larger than a mass of 10.
   *
   * Math.min prevents extremely connected notes from becoming
   * absurdly large.
   */
  const visualSize = Math.min(
    2.6,
    0.9 + Math.log1p(node.mass) * 0.22
  )

  /*
   * Generate a procedural star-surface texture.
   *
   * useMemo means React creates this texture once for this node
   * instead of rebuilding the canvas every rendered frame.
   */
  const surfaceTexture = useMemo(() => {
    const canvas = document.createElement("canvas")

    canvas.width = 512
    canvas.height = 256

    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Could not create star surface texture")
    }

    /*
     * Base colour of the star.
     *
     * This gradient creates a slightly brighter equator and darker
     * polar regions instead of one completely flat colour.
     */
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

    /*
     * Draw bright plasma cells.
     *
     * stableNoise gives every star a repeatable appearance based
     * on its note path. Reloading the graph will not completely
     * redesign the star.
     */
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

    /*
     * Draw darker plasma regions.
     *
     * Multiply darkens the existing colours instead of painting
     * opaque black spots over them.
     */
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

    /*
     * Reset the canvas compositing mode before finishing.
     */
    context.globalCompositeOperation = "source-over"

    const generatedTexture = new CanvasTexture(canvas)

    generatedTexture.colorSpace = SRGBColorSpace
    generatedTexture.needsUpdate = true

    return generatedTexture
  }, [node.path])

  /*
   * Generate a radial texture for the corona and flares.
   *
   * Sprites use this image like a transparent glowing billboard.
   * Sprites automatically face the camera.
   */
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

  /*
   * Dispose GPU textures when this component is removed.
   *
   * Without this cleanup, repeatedly loading graphs could leave
   * unused textures in GPU memory.
   */
  useEffect(() => {
    return () => {
      surfaceTexture.dispose()
      glowTexture.dispose()
    }
  }, [surfaceTexture, glowTexture])

  /*
   * Animate the star every frame.
   */
  useFrame((_, delta) => {
    elapsedTimeRef.current += delta

    const elapsedTime = elapsedTimeRef.current

    /*
     * Slowly rotate the surface.
     */
    if (bodyRef.current) {
      bodyRef.current.rotation.y += delta * 0.045
      bodyRef.current.rotation.z += delta * 0.006
    }

    /*
     * Very small inner-glow pulse.
     */
    if (innerGlowRef.current) {
      const innerPulse =
        1 + Math.sin(elapsedTime * 1.6) * 0.015

      innerGlowRef.current.scale.setScalar(innerPulse)
    }

    /*
     * Larger, slower corona pulse.
     */
    if (coronaRef.current) {
      const coronaPulse =
        1 + Math.sin(elapsedTime * 1.15) * 0.035

      coronaRef.current.scale.setScalar(coronaPulse)
    }
  })

  return (
    <group
      position={node.position}
      scale={visualSize}
    >
      {/* Procedural rotating star surface */}
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

      {/* Tight glow directly around the surface */}
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

      {/* Larger atmospheric corona */}
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

        {/* Circular corona surrounding the star */}
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

        {/* Bright compact glow close to the core */}
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

        {/* Horizontal stellar flare */}
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

        {/* Subtle vertical stellar flare */}
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

  const visualSize = Math.min(
    1.4,
    0.18 + Math.log1p(node.mass) * 0.08
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

function PlanetNode({ node }: PlanetNodeProps) {
  if (node.bodyType === "star") {
    return <StarNode node={node} />
  } 
  if (node.bodyType === "gasGiant") {
    return <GasGiantPlanet node={node} />
  }
  const visuals = getPlanetVisuals(node)
  const visualSize = Math.min(
    1.4, 0.18 + Math.log1p(node.mass) * 0.08
  )
  return (
    <group position={node.position} scale={visualSize * visuals.size}>
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