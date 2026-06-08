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

type DisplaySourcesProps = {
  sources: Source[]
}

type SourceCardProps = {
  source: Source
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
        return <SourceCard key={source.path} source={source} />
      })}
    </>
  )
}

function SourceCard(props: SourceCardProps) {
  return (
    <>
    <div className="source-card">
            <h2>{props.source.title}</h2>
            <p>{props.source.heading}</p>
            <p>{props.source.preview}</p>
          </div>
    </>
  )
}

function App() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("Idle");
    const [response, setResponse] = useState("")
    const [sources, setSources] = useState<Source[]>([])

    async function handleAsk() {
      setStatus("Sending...")
      try {
        const apiResponse = await fetch("http://127.0.0.1:8000/ask", {
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

        const data = await apiResponse.json()
        setResponse(data.answer)
        setSources(data.sources)
        setStatus("Complete")        
      } catch (error) {
        setResponse("Genesis could not reach the backend. Make sure the API server is running.")
        setSources([])
        setStatus("Failed")
      }
    }
    return (
        <main className="app-shell">    
          <section className="hero-section">
            <GenesisHeader />

          <div className="query-section">
              <SearchBox query={query} setQuery={setQuery}/>
              <AskButton handleAsk={handleAsk} status={status}/>
            </div>
          </section>
          <section className="results-layout">
            <section className="response-section scroll-panel">
              <DisplayResponse response={response} />
            </section>

            <aside className="sources-section scroll-panel">
              <DisplaySources sources={sources} />
            </aside>
          </section>
        </main>
    );
}

export default App;