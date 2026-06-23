import type { GalaxyNode, NoteGraph } from "./galaxyTypes"

function getNoteName(path: string) {
    const noteName = path.split(/[\\/]/).pop()

    if (!noteName) {return ""}

    return noteName.replace(/\.md$/i, "")
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
            const orbitRadius = 10
            const angleStep = (Math.PI * 2) / graphData.outgoing.length
            const angle = index * angleStep

            const x = Math.cos(angle) * orbitRadius
            const y = 0
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
            const orbitRadius = 5
            const angleStep = (Math.PI * 2) / graphData.backlinks.length
            const angle = index * angleStep

            const x = Math.cos(angle) * orbitRadius
            const y = 0.8
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