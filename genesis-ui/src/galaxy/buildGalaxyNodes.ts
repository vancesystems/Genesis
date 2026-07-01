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

function classifyBodyType(mass: number) {
    if (mass < 200) {
        return "asteroid"
    }
    else if (mass < 500) {
        return "dwarf"
    }
    else if (mass < 1500) {
        return "planet"
    }
    else if (mass < 2000) {
        return "gasGiant"
    }
    else{
        return "star"
    }
}

function resolveGlobalCollisions(nodes: GalaxyNode[]) {
    const minDistance = 20
    const iterations = 50
    for (let iteration = 0; iteration < iterations; iteration++)
        for (let i= 0; i < nodes.length; i++) {
            for (let j=i + 1; j < nodes.length; j++) {
                const a = nodes[i]
                const b = nodes[j]

                const dx = b.position[0] - a.position[0]
                const dz = b.position[2] - a.position[2]

                const distance = Math.sqrt(dx * dx + dz * dz)

                if (distance === 0 || distance >= minDistance) {
                    continue
                }

                if (distance < minDistance) {
                    const directionX = dx / distance
                    const directionZ = dz / distance

                    const overlap = minDistance - distance
                    const pushX = directionX * overlap * 0.5
                    const pushZ = directionZ * overlap * 0.5
                    
                    a.position = [
                        a.position[0] - pushX,
                        a.position[1],
                        a.position[2] - pushZ,
                    ]

                    b.position = [
                        b.position[0] + pushX,
                        b.position[1],
                        b.position[2] + pushZ
                    ]
                }
            }
        }
    return nodes
}

function positionOrbitersAroundStars(
    orbitersByStarPath: Map<string, string[]>,
    nodebyPath: Map<string, GalaxyNode>
) {

    for (const [starPath, orbiterPaths] of orbitersByStarPath) {
        const angleStep = (Math.PI * 2) / orbiterPaths.length
        const orbitRadius = 10
        const starNode = nodebyPath.get(starPath)

        if (!starNode) {continue}

        starNode.orbitorCount = orbiterPaths.length

        for (let index = 0; index < orbiterPaths.length; index++) {
            const angle = index * angleStep
            const orbiterPath = orbiterPaths[index]
            const orbiterNode = nodebyPath.get(orbiterPath)

            if (!orbiterNode){continue}

            orbiterNode.position = [
                starNode.position[0] + Math.cos(angle) * orbitRadius,
                starNode.position[1],
                starNode.position[2] + Math.sin(angle) * orbitRadius
            ]
        }
    }
}

export function buildGlobalGalaxyNodes(
    globalData: GlobalGraph
): GalaxyNode[] {
    const nodeArray: GalaxyNode[] = []

    const backlinksCount = new Map<string, number>()
    const outgoinglinksCount = new Map<string, number>()

    for (const link of globalData.links) {
        const currentBacklinks = backlinksCount.get(link.target_path) ?? 0
        const currentOutgoing = outgoinglinksCount.get(link.source_path) ?? 0
        backlinksCount.set(link.target_path, currentBacklinks +1)
        outgoinglinksCount.set(link.source_path, currentOutgoing +1)
    }


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

        const backlinks = backlinksCount.get(note.path) ?? 0
        const outgoing = outgoinglinksCount.get(note.path) ?? 0
        const mass = backlinks + outgoing * 0.35

        const globalNode: GalaxyNode = {
            id: note.id,
            path: note.path,
            label: note.label,
            kind: "global",
            bodyType: classifyBodyType(mass),
            position: [x, y, z],
            mass: mass,
        }

        nodeArray.push(globalNode)
    }

    const starPaths = new Set<string>()
    const orbitersByStarPath = new Map<string, string[]>()

    for (const node of nodeArray) {
        if (node.bodyType === "star") {
            starPaths.add(node.path)
        }
    }

    for (const link of globalData.links) {
        if (starPaths.has(link.target_path)){
            const currentOrbiters = orbitersByStarPath.get(link.target_path) ?? []
            currentOrbiters.push(link.source_path)
            orbitersByStarPath.set(link.target_path, currentOrbiters) 
        }         
    }

    const nodebyPath = new Map<string, GalaxyNode>()

    for (const node of nodeArray) {
        nodebyPath.set(node.path, node)
    }
    
    positionOrbitersAroundStars(
        orbitersByStarPath,
        nodebyPath
    )

    return resolveGlobalCollisions(nodeArray)
}

export function buildGalaxyNodes(graphData: NoteGraph): GalaxyNode[] {
    const nodeArray: GalaxyNode[] = [];
    const centerNode: GalaxyNode = {
        id: graphData.note_path,
        path: graphData.note_path,
        label: getNoteName(graphData.note_path),
        bodyType: classifyBodyType(1),
        kind: "center",
        position: [0, 0, 0],
        mass: 1,
        
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
                bodyType: classifyBodyType(1),
                kind: "outgoing",
                position: [x, y, z],
                mass: 1,
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
                bodyType: classifyBodyType(1),
                position: [x, y, z],
                mass: 1,
            }
            nodeArray.push(backlinkNode)
    }}
    

    return nodeArray
}