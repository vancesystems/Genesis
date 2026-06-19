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
            const outgoingNode: GalaxyNode = {
                id: graphData.outgoing[index].target_name,
                path: graphData.outgoing[index].target_path,
                label: graphData.outgoing[index].target_name,
                kind: "outgoing",
                position: [3 + index, 0, 0],
                size: 1,
            }
            nodeArray.push(outgoingNode)
    }}

    if (graphData.backlinks.length > 0) {
        for (let index = 0; index < graphData.backlinks.length; index++) {
            const backlinkNode: GalaxyNode = {
                id: graphData.backlinks[index].source_path,
                path: graphData.backlinks[index].source_path,
                label: getNoteName(graphData.backlinks[index].source_path),
                kind: "backlink",
                position: [-3 - index, 0, 0],
                size: 1,
            }
            nodeArray.push(backlinkNode)
    }}
    

    return nodeArray
}