import "@react-three/fiber"
import { useMemo } from "react"
import type { NoteGraph, GlobalGraph } from "./galaxyTypes"
import { buildGalaxyNodes, buildGlobalGalaxyNodes } from "./buildGalaxyNodes"
import { PlanetNode } from "./bodies/PlanetNode"
import { InstancedAsteroids } from "./bodies/asteroid/AsteroidNode"
import { GalaxyLabelLayer } from "./labels/GalaxyLabelLayer"

type GalaxySceneProps = {
  graphData: NoteGraph | null
  globalData: GlobalGraph | null
}

export function GalaxyScene({ graphData, globalData }: GalaxySceneProps) {
  const nodes = useMemo(() => {
    if (globalData) return buildGlobalGalaxyNodes(globalData)
    if (graphData) return buildGalaxyNodes(graphData)
    return []
  }, [graphData, globalData])

  const asteroidNodes = useMemo(() => {
    return nodes.filter((node) => node.visualVariant === "asteroid")
  }, [nodes])

  const nonAsteroidNodes = useMemo(() => {
    return nodes.filter((node) => node.visualVariant !== "asteroid")
  }, [nodes])

  return (
    <>
      <InstancedAsteroids nodes={asteroidNodes} />

      {nonAsteroidNodes.map((node) => (
        <PlanetNode key={node.id} node={node} />
      ))}

      <GalaxyLabelLayer nodes={nodes} />
    </>
  )
}