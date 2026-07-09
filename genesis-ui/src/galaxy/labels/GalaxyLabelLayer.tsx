import { getLabelYOffset } from "./labelUtils"
import type { NodeLabelProps } from "./NodeLabel"
import { Html } from "@react-three/drei"
import type {
  GalaxyNode,
} from "../galaxyTypes"

function NodeLabel({ node, yOffset = getLabelYOffset(node) }: NodeLabelProps) {
  return (
    <Html
      position={[
        node.position[0],
        node.position[1] + yOffset,
        node.position[2],
      ]}
      center
      distanceFactor={10}
    >
      <div
        className={`
          galaxy-label
          galaxy-label-${node.kind}
          galaxy-label-${node.bodyType}
        `}
      >
        {node.label}
      </div>
    </Html>
  )
}

export function GalaxyLabelLayer({ nodes }: { nodes: GalaxyNode[] }) {
  const labeledNodes = nodes.filter((node) => {
    if (node.bodyType === "asteroid") {
      return node.mass > 80
    }

    return true
  })

  return (
    <group>
      {labeledNodes.map((node) => (
        <NodeLabel
          key={`label-${node.id}`}
          node={node}
        />
      ))}
    </group>
  )
}