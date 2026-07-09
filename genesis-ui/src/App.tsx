import { useState } from "react";
import { GalaxyCanvas } from "./galaxy/GalaxyCanvas";
import type { NoteGraph } from "./galaxy/galaxyTypes";
import type { GlobalGraph } from "./galaxy/galaxyTypes";
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

type GraphExplorerProps = {
  selectedNotePath: string
  setSelectedNotePath: (value: string) => void
  handlePath: () => void
  loadGlobalGraph: () => void
  graphStatus: string
  graphData: NoteGraph | null
  globalData: GlobalGraph | null
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

function GraphExplorer(props: GraphExplorerProps) {
  return (
    <div className="graph-explorer">
      <div className="graph-controls">
        <button
          className="global-graph-button"
          onClick={() => {
            props.loadGlobalGraph()
          }}
        >
          Load Global Graph
        </button>

        <span className="graph-status">
          Status: {props.graphStatus}
        </span>
      </div>

      <GalaxyCanvas
        graphData={props.graphData}
        globalData={props.globalData}
      />
    </div>
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
    const [globalData, setGlobalData] = useState<GlobalGraph | null>(null)
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

    async function loadGlobalGraph() {
      setGraphData(null)
      setGraphStatus("Sending...")

      try {
        const graphResponse = await fetch(
          `http://127.0.0.1:8000/graph/global`
        )

        if (!graphResponse.ok) {
          throw new Error("Request failed")
        }

        const data = await graphResponse.json()
        setGlobalData(data)
        console.log(data)
        setGraphStatus("Complete")
      } catch (error) {
        setGlobalData(null)
        setGraphStatus("Failed")
      }
    }

    async function loadGraphForPath(notePath: string) {
      setGlobalData(null)
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
        <main
          className={`app-shell ${activeTab === "graph" ? "graph-mode" : ""}`}
        >  
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
              <section className="graph-panel">
                <GraphExplorer
                  selectedNotePath={selectedNotePath}
                  setSelectedNotePath={setNodePath}
                  handlePath={handlePath}
                  loadGlobalGraph={loadGlobalGraph}
                  graphStatus={graphStatus}
                  graphData={graphData}
                  globalData={globalData}
                />
              </section>
            </section>
          )}
        </main>
    );
}

export default App;