import type { GalaxyNode, GlobalGraph, NoteGraph } from "./galaxyTypes"
import { stableNoise} from "./galaxyNoise"

const BACKLINK_BASE_RADIUS = 5
const BACKLINK_RADIUS_VARIATION = 1

const OUTGOING_BASE_RADIUS = 9
const OUTGOING_RADIUS_VARIATION = 2

const BACKLINK_BASE_Y = 0.8
const OUTGOING_BASE_Y = -0.4

const GLOBAL_GRAPH_RADIUS = 80
const GLOBAL_GRAPH_THICKNESS = 5

const GLOBAL_SPIRAL_ARMS = 8
const GLOBAL_SPIRAL_TURNS = 1.6

const GLOBAL_ARM_JITTER = 0.55
const GLOBAL_RADIAL_JITTER = 3

function getNoteName(path: string) {
    const noteName = path.split(/[\\/]/).pop()

    if (!noteName) {return ""}

    return noteName.replace(/\.md$/i, "")
}

export function buildGlobalGalaxyNodes(
    globalData: GlobalGraph
): GalaxyNode[] {
    const nodeArray: GalaxyNode[] = []

    for (const note of globalData.nodes) {
        const radiusNoise = stableNoise(`radius:${note.path}`)
        const armNoise = stableNoise(`arm:${note.path}`)
        const angleNoise = stableNoise(`angle:${note.path}`)
        const radialJitterNoise = stableNoise(`radial-jitter:${note.path}`)
        const heightNoise = stableNoise(`height:${note.path}`)

        const radiusRatio = Math.pow(radiusNoise, 1.15)

        const baseRadius = radiusRatio * GLOBAL_GRAPH_RADIUS

        const armIndex = Math.floor(
            armNoise * GLOBAL_SPIRAL_ARMS
        )

        const armOffset =
            (armIndex / GLOBAL_SPIRAL_ARMS) *
            Math.PI *
            2

        const spiralAngle =
            armOffset +
            radiusRatio *
            GLOBAL_SPIRAL_TURNS *
            Math.PI *
            2

        const angleJitter =
            (angleNoise - 0.5) *
            GLOBAL_ARM_JITTER

        const radialJitter =
            (radialJitterNoise - 0.5) *
            GLOBAL_RADIAL_JITTER *
            2

        const angle = spiralAngle + angleJitter
        const radius = Math.max(
            0,
            baseRadius + radialJitter
        )

        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        const localThickness =
            GLOBAL_GRAPH_THICKNESS *
            (0.25 + (1 - radiusRatio) * 0.75)

        const y =
            (heightNoise - 0.5) *
            localThickness *
            2

        const globalNode: GalaxyNode = {
            id: note.id,
            path: note.path,
            label: note.label,
            kind: "global",
            position: [x, y, z],
            size: 0.3,
        }

        nodeArray.push(globalNode)
    }

    return nodeArray
}

export function buildGalaxyNodes(graphData: NoteGraph): GalaxyNode[] {
    const nodeArray: GalaxyNode[] = [];
    const centerNode: GalaxyNode = {
        id: graphData.note_path,
        path: graphData.note_path,
        label: getNoteName(graphData.note_path),
        kind: "center",
        position: [0, 0, 0],
        size: 1,
        
    }
    nodeArray.push(centerNode)

    if (graphData.outgoing.length > 0) {
        for (let index = 0; index < graphData.outgoing.length; index++) {
            const radiusNoise = stableNoise(`${graphData.outgoing[index].target_path}:radius`)
            const radiusOffset = (radiusNoise - 0.5) * OUTGOING_RADIUS_VARIATION * 2
            const orbitRadius = OUTGOING_BASE_RADIUS + radiusOffset
            const angleStep = (Math.PI * 2) / graphData.outgoing.length
            const angleNoise = stableNoise(`${graphData.outgoing[index].target_path}:angle`)
            const angleOffset = (angleNoise - 0.5) * angleStep * 0.25
            const angle = index * angleStep + angleOffset

            const x = Math.cos(angle) * orbitRadius
            const y = OUTGOING_BASE_Y
            const z = Math.sin(angle) * orbitRadius 
            const outgoingNode: GalaxyNode = {
                id: graphData.outgoing[index].target_name,
                path: graphData.outgoing[index].target_path,
                label: graphData.outgoing[index].target_name,
                kind: "outgoing",
                position: [x, y, z],
                size: 1,
            }
            nodeArray.push(outgoingNode)
    }}

    if (graphData.backlinks.length > 0) {
        for (let index = 0; index < graphData.backlinks.length; index++) {
            const radiusNoise = stableNoise(`${graphData.backlinks[index].source_path}:radius`)
            const radiusOffset = (radiusNoise - 0.5) * BACKLINK_RADIUS_VARIATION * 2
            const orbitRadius = BACKLINK_BASE_RADIUS + radiusOffset
            const angleStep = (Math.PI * 2) / graphData.backlinks.length
            const angleNoise = stableNoise(`${graphData.backlinks[index].source_path}:angle`)
            const angleOffset = (angleNoise - 0.5) * angleStep * 0.25
            const angle = index * angleStep + angleOffset


            const x = Math.cos(angle) * orbitRadius
            const y = BACKLINK_BASE_Y
            const z = Math.sin(angle) * orbitRadius
            const backlinkNode: GalaxyNode = {
                id: graphData.backlinks[index].source_path,
                path: graphData.backlinks[index].source_path,
                label: getNoteName(graphData.backlinks[index].source_path),
                kind: "backlink",
                position: [x, y, z],
                size: 1,
            }
            nodeArray.push(backlinkNode)
    }}
    

    return nodeArray
}