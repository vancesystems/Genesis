import type { PlanetNodeProps } from "./types"
import { OceanPlanet } from "./ocean/OceanPlanet"
import { IcePlanet } from "./ice/IcePlanet"
import { GasGiantPlanet } from "./gasGiant/GasGiantPlanet"
import { StarNode } from "./star/StarNode"
import { DwarfPlanet } from "./dwarf/DwarfPlanet"

export function PlanetNode({ node }: PlanetNodeProps) {
  switch (node.visualVariant) {
    case "star":
      return <StarNode node={node} />

    case "gasGiant":
      return <GasGiantPlanet node={node} />

    case "ocean":
      return <OceanPlanet node={node} />

    case "ice":
      return <IcePlanet node={node} />

    case "dwarf":
      return <DwarfPlanet node={node} />

    case "asteroid":
      return null

    default:
      return <DwarfPlanet node={node} />
  }
}