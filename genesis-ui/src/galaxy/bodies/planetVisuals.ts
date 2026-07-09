import { stableNoise } from "../galaxyNoise"
import type { GalaxyNode } from "../galaxyTypes"

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

export function getPlanetVisuals(node: GalaxyNode) {
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