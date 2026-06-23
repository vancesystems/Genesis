import type { GalaxyNode, NoteGraph } from "./galaxyTypes"

const BACKLINK_BASE_RADIUS = 5
const BACKLINK_RADIUS_VARIATION = 1

const OUTGOING_BASE_RADIUS = 9
const OUTGOING_RADIUS_VARIATION = 2

const BACKLINK_BASE_Y = 0.8
const OUTGOING_BASE_Y = -0.4

function getNoteName(path: string) {
    const noteName = path.split(/[\\/]/).pop()

    if (!noteName) {return ""}

    return noteName.replace(/\.md$/i, "")
}

function stableHash(value: string) {
    let hash = 2166136261

    for (let index = 0; index < value.length; index ++) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
}

function stableNoise(value: string) {
    return stableHash(value) / 4294967295
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