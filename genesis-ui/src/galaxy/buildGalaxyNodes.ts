import type { GalaxyNode, NoteGraph } from "./galaxyTypes"

function getNoteName(path: string) {
    const noteName = path.split(/[\\/]/).pop()

    if (!noteName) {return ""}

    return noteName.replace(/\.md$/i, "")
}

export function buildGalaxyNodes(graphData: NoteGraph): GalaxyNode[] {
    const centerNode: GalaxyNode = {
        id: graphData.note_path,
        path: graphData.note_path,
        label: getNoteName(graphData.note_path),
        kind: "center",
        position: [0, 0, 0],
        size: 1,
    }

    return[centerNode]
}