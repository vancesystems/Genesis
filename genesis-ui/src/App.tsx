import { useState } from "react";
import "./App.css"

type SearchBoxProps = {
    query: string;
    setQuery: (value: string) => void
}

type HandleAskProps = {
    handleAsk: () => void
    status: string
}

type DisplayResponseProps = {
  response: string
}

type Source = {
  title: string
  path: string
  heading: string
  preview: string
  signals: string[]
}

type GraphLink = {
  source_path: string
  target_name: string
  target_path: string
  link_text: string
  link_type: string
}

type NoteGraph = {
  note_path: string
  outgoing: GraphLink[]
  backlinks: GraphLink[]
}

type GraphExplorerProps = {
  selectedNotePath: string
  setSelectedNotePath: (value: string) => void
  handlePath: () => void
  graphStatus: string
  graphData: NoteGraph | null
}

type DisplaySourcesProps = {
  sources: Source[]
  loadGraphForPath: (notePath: string) => void
  setActiveTab: (value: ActiveTab) => void
}

type SourceCardProps = {
  source: Source
  loadGraphForPath: (notePath: string) => void
  setActiveTab: (value: ActiveTab) => void
}

type ActiveTab = "ask" | "graph"

type TabBarProps = {
  activeTab: ActiveTab
  setActiveTab: (value: ActiveTab) => void
}

type GraphCanvasProps = {
  graphData: NoteGraph | null
}

type PositionedNode = {
  label: string
  type: string
  x: number
  y: number
}

function GenesisHeader() {
    return (
      <>
     <h1>Genesis</h1>
     <h3>Search. Understand. Generate</h3>
     </>
    )
}

function SearchBox(props: SearchBoxProps) {
    return (
        <input
            value={props.query}
            onChange={(event) => {
                props.setQuery(event.target.value)
            }}
        />
    )
}

function AskButton(props: HandleAskProps) {
    return (
      <button 
        onClick={() => {
          props.handleAsk()
        }}
      >
        {props.status === "Sending..." ? "Thinking...": props.status === "Failed" ? "Try Again": "Ask"}
      </button>
    )
}

function DisplayResponse(props: DisplayResponseProps) {
  return (
    <>
      <h1>Response</h1>
      {props.response}
    </>
  )
}

function DisplaySources(props: DisplaySourcesProps) {
  return (
    <>
      <h1>Sources</h1>

      {props.sources.map((source) => {
        return <SourceCard 
          key={source.path} 
          source={source} 
          loadGraphForPath={props.loadGraphForPath} 
          setActiveTab={props.setActiveTab}/>
      })}
    </>
  )
}

function SourceCard(props: SourceCardProps) {
  return (
    <>
      <div
        className="source-card"
        onClick={() => {
          props.setActiveTab("graph")
          props.loadGraphForPath(props.source.path)
        }}
      >
        <h2>{props.source.title}</h2>
        <p>{props.source.heading}</p>
        <p>{props.source.preview}</p>
      </div>
    </>
  )
}

function getNoteName(path: string) {
  const noteName = path
    .split("\\")
    .pop()
  if (noteName)
    return noteName.replace(".md", "")
  return ""
}

function dedupeLinks(links: GraphLink[], getKey: (link:GraphLink) => string) {
  const seen = new Set<string>()

  return links.filter((link) => {
    const key = getKey(link)

    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function layoutAlgorithm(graphData: NoteGraph) {
  const currentNode = graphData.note_path
  const outgoingLinks = dedupeLinks(
    graphData.outgoing,
    (link) => link.target_path || link.target_name
  )
  const backlinkLinks = dedupeLinks(
    graphData.backlinks,
    (link) => link.source_path
  )

  const nodes: PositionedNode[] = [
    
  ]

  const centerX = 50
  const centerY = 50
  const radius = 35

  const centerNode: PositionedNode = {
    label: getNoteName(currentNode),
    type: "center",
    x: centerX,
    y: centerY
  }
  nodes.push(centerNode)

  for (let index = 0; index < outgoingLinks.length; index++){
    const outgoing_link = outgoingLinks[index]

    let angleDegrees: number

    if (outgoingLinks.length === 1) {angleDegrees = 0}
    else{
      const arcSize = 45 - (-45)
      const angleStep = arcSize / (outgoingLinks.length -1)
      angleDegrees = -45 + (index * angleStep)
    }
    const angleRadians = angleDegrees * (Math.PI / 180)

    const x = centerX + Math.cos(angleRadians) * radius
    const y = centerY + Math.sin(angleRadians) * radius

    let label: string

    if (outgoing_link.target_path) {label = getNoteName(outgoing_link.target_path)}
    else{
      label = outgoing_link.target_name
    }

    const outgoinglinkNode: PositionedNode = {
      label,
      type: "outgoing",
      x,
      y
    }
    nodes.push(outgoinglinkNode)
  }

  const startAngle = 135
  const endAngle = 225

  for (let index = 0; index < backlinkLinks.length; index++){
    const link = backlinkLinks[index]

    let angleDegrees: number
    if (backlinkLinks.length === 1) {angleDegrees = 180} 
    else {
      const arcSize = endAngle - startAngle
      const angleStep = arcSize / (backlinkLinks.length - 1)
      angleDegrees = startAngle + (index * angleStep)
    }
    const angleRadians = angleDegrees * (Math.PI / 180)

    const x = centerX + Math.cos(angleRadians) * radius
    const y = centerY + Math.sin(angleRadians) * radius
  
    const backlinkNode: PositionedNode = {
      label: getNoteName(link.source_path),
      type: "backlink",
      x,
      y
    }
    nodes.push(backlinkNode)
  }

  return nodes

}

function GraphCanvas(props: GraphCanvasProps ) {
  if (!props.graphData) {
    return null
  }

  const positionedNodes = layoutAlgorithm(props.graphData)

  const renderedNodes = positionedNodes.map((node, index) =>  {
    let className = ""
    if (node.type === "center") {
      className ="graph-node center-node"
    }
    if (node.type === "outgoing") {
      className ="graph-node outgoing-node"
    }
    if (node.type === "backlink") {
      className ="graph-node backlink-node"
    }
    return (
      <div className={className} style={{left: `${node.x}%`, top: `${node.y}%`}} key={node.type + node.label + index}> {node.label}
      </div>
    )
  })

  return (
    <div className="graph-space">

      {renderedNodes}

    </div>
  )
}

function GraphExplorer(props: GraphExplorerProps) {
  return (
    <>
      <input
        value={props.selectedNotePath}
        onChange={(event) => {
          props.setSelectedNotePath(event.target.value)
        }}
      />
      <button
        onClick={() => {
          props.handlePath()
        }}
      >
        Load Graph
      </button>
      <p>Status: {props.graphStatus}</p>
      <p>Outgoing: {props.graphData ? props.graphData.outgoing.length : 0}</p>
      <p>Backlinks: {props.graphData ? props.graphData.backlinks.length : 0}</p>
      <GraphCanvas graphData={props.graphData} />
    </>
  )
}

function TabBar(props: TabBarProps) {
  return (
    <>
      <button
        onClick={() => {
          props.setActiveTab("ask")
        }}
        className={props.activeTab === "ask" ? "tab-button active-tab" : "tab-button"}
      >
        Ask
      </button>
      <button
        onClick={() => {
          props.setActiveTab("graph")
        }}
        className={props.activeTab === "graph" ? "tab-button active-tab" : "tab-button"}
      >
        Graph
      </button>
    </>
  )
}

function App() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("Idle");
    const [response, setResponse] = useState("")
    const [graphData, setGraphData] = useState<NoteGraph | null>(null)
    const [selectedNotePath, setNodePath] = useState("")
    const [graphStatus, setGraphStatus] = useState("Idle")
    const [sources, setSources] = useState<Source[]>([])
    const [activeTab, setActiveTab] = useState<ActiveTab>("ask")
  

    async function handlePath() {
      loadGraphForPath(selectedNotePath)
    }

    async function handleAsk() {
      setStatus("Sending...")
      setResponse("")
      setSources([])

      try {
        const apiResponse = await fetch("http://127.0.0.1:8000/ask-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query,
          }),
        })

        if (!apiResponse.ok) {
          throw new Error("Request failed")
        }

        if (!apiResponse.body) {
          throw new Error("No response body")
        }

        const reader = apiResponse.body.getReader()
        const decoder = new TextDecoder()

        let buffer = ""

        while (true) {
          const { value, done } = await reader.read()
          if (done) {
            break
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) {
              continue
            }
            const event = JSON.parse(line)

            if (event.type === "sources") {
              setSources(event.sources)
            }

            if (event.type === "token") {
              setResponse((previous) => previous + event.text)
            }

            if (event.type === "done") {
              setStatus("Complete")
            }
          }
        }
        setStatus("Complete")      
      } catch (error) {
        setResponse("Genesis could not reach the backend. Make sure the API server is running.")
        setSources([])
        setStatus("Failed")
      }
    }

    async function loadGraphForPath(notePath: string) {
      setGraphStatus("Sending...")
      setNodePath(notePath)

      try {
        const encodedPath = encodeURIComponent(notePath)

        const graphResponse = await fetch(
          `http://127.0.0.1:8000/graph?note_path=${encodedPath}`
        )

        if (!graphResponse.ok) {
          throw new Error("Request failed")
        }

        const data = await graphResponse.json()

        setGraphData(data)
        setGraphStatus("Complete")
      } catch (error) {
        setGraphData(null)
        setGraphStatus("Failed")
      }
    }

    return (
        <main className="app-shell">    
          <section className="hero-section">
            <GenesisHeader />
          <div className="tab-bar">
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          {activeTab === "ask" && (
              <div className="query-section">
                <SearchBox query={query} setQuery={setQuery} />
                <AskButton handleAsk={handleAsk} status={status} />
              </div>
            )}
          </section>

          {activeTab === "ask" && (
            <section className="results-layout">
              <section className="response-section scroll-panel">
                <DisplayResponse response={response} />
              </section>

              <aside className="sources-section scroll-panel">
                <DisplaySources 
                  sources={sources} 
                  loadGraphForPath={loadGraphForPath}
                  setActiveTab={setActiveTab} />
              </aside>
            </section>
          )}

          {activeTab === "graph" && (
            <section className="graph-section">
              <section className="response-section scroll-panel">
                <GraphExplorer
                  selectedNotePath={selectedNotePath}
                  setSelectedNotePath={setNodePath}
                  handlePath={handlePath}
                  graphStatus={graphStatus}
                  graphData={graphData}
                />
              </section>
            </section>
          )}
        </main>
    );
}

export default App;