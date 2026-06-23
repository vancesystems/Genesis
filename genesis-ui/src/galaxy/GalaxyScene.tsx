import "@react-three/fiber"
import type { GalaxyNode, NoteGraph } from "./galaxyTypes"
import { buildGalaxyNodes } from "./buildGalaxyNodes"

type GalaxySceneProps = {
  graphData: NoteGraph | null
}

type PlanetNodeProps = {
  node: GalaxyNode
}

function getPlanetVisuals(kind: GalaxyNode["kind"]) {
  if (kind === "center") {
    return {
      body: "#f8fafc",
      emissive: "#38bdf8",
      glow: "#7dd3fc",
      size: 1.4,
      glowScale: 1.5,
      glowOpacity: 0.28,
    }
  }

  if (kind === "outgoing") {
    return {
      body: "#2563eb",
      emissive: "#1d4ed8",
      glow: "#60a5fa",
      size: 0.7,
      glowScale: 1.2,
      glowOpacity: 0.16,
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

function PlanetNode({ node }: PlanetNodeProps) {
  const visuals = getPlanetVisuals(node.kind)
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
  if (!props.graphData) {
    return null
  }

  const nodes = buildGalaxyNodes(props.graphData)

  return (
    <>
      {nodes.map((node) => {
        return <PlanetNode key={node.id} node={node} />
      })}
    </>
  )
}