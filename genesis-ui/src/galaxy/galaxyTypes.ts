export type GalaxyNodeKind = "center" | "outgoing" | "backlink" | "global"

export type Position3D = [number, number, number]

export type GalaxyNode = {
    id: string
    path: string
    label: string
    kind: GalaxyNodeKind
    position: Position3D
    size: number
}

export type GraphLink = {
    source_path: string
    target_name: string
    target_path: string
    link_text: string
    link_type: string
}

export type NoteGraph = {
    note_path: string
    outgoing: GraphLink[]
    backlinks: GraphLink[]
}

export type GlobalGraphNode = {
    id: string
    path: string
    label: string
}

export type GlobalGraph = {
    nodes: GlobalGraphNode[]
}