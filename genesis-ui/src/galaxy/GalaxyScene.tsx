import "@react-three/fiber"
import type { NoteGraph } from "./galaxyTypes"
import { buildGalaxyNodes } from "./buildGalaxyNodes"

type GalaxySceneProps = {
  graphData: NoteGraph | null
}

export function GalaxyScene(props: GalaxySceneProps) {
  if (!props.graphData) {
    return null
  }

  const nodes = buildGalaxyNodes(props.graphData)

  return (
    <>
      {nodes.map((node) => {
        return (
          <mesh
            key={node.id}
            position={node.position}
            scale={node.size}
          >
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color="#7dd3fc" />
          </mesh>
        )
      })}
    </>
  )
}