import type {
  GalaxyNode,
} from "../galaxyTypes"

export function getLabelYOffset(node: GalaxyNode) {
  if (node.bodyType === "star") {
    return 7
  }

  if (node.bodyType === "gasGiant") {
    return 4
  }

  if (node.bodyType === "planet") {
    return 2.4
  }

  if (node.bodyType === "dwarf") {
    return 1.2
  }

  return 0.9
}