# Genesis

> Open Source Semantic Intelligence Platform

Genesis is a local-first semantic retrieval and AI assistant system built around an Obsidian vault.

The project is designed to transform a collection of notes into an intelligent knowledge system capable of retrieval, contextual understanding, and grounded AI responses.

Genesis focuses on retrieval quality, contextual reasoning, and transparent AI-assisted knowledge discovery while keeping data and models under user control.

---

## Current Focus

* Semantic Search
* Hybrid Retrieval
* Local AI Reasoning
* Contextual Vault Intelligence
* Information Retrieval
* Grounded Responses
* Knowledge Management

---

## Current Features

### Knowledge Ingestion

* Markdown vault ingestion
* Heading-aware chunking
* Incremental indexing
* Content-hash change detection
* Skipping unchanged notes
* Deleted note cleanup
* Vector synchronization

### Retrieval Engine

* Semantic retrieval
* Lexical retrieval
* Hybrid retrieval
* Query analysis
* Reciprocal Rank Fusion (RRF)
* Retrieval tracing and score visibility

### Local AI

* Local embedding generation through Ollama
* Grounded AI responses
* Source attribution
* Context assembly
* Local language model integration

### Development Features

* Retrieval evaluation framework
* Retrieval signal visibility
* Metadata tracking
* SQLite-backed storage
* Open-source development workflow

---

## Current Stack

| Category        | Technology             |
| --------------- | ---------------------- |
| Language        | Python                 |
| Database        | SQLite                 |
| Vector Database | ChromaDB               |
| LLM Runtime     | Ollama                 |
| Retrieval       | Hybrid Retrieval + RRF |
| Source Data     | Obsidian Vaults        |
| Version Control | Git + GitHub           |

---

## Current Models

### Embedding Model

`nomic-embed-text`

### LLM

`qwen2.5:7b`

---

## Architecture

```text
Obsidian Vault
        │
        ▼
Markdown Parsing
        │
        ▼
Heading-Aware Chunking
        │
        ▼
Embedding Generation
        │
        ▼
ChromaDB Vector Storage
        │
        ▼
Query Analysis
        │
        ▼
Hybrid Retrieval
 ┌──────────────┐
 │ Semantic     │
 │ Retrieval    │
 └──────────────┘
        +
 ┌──────────────┐
 │ Lexical      │
 │ Retrieval    │
 └──────────────┘
        │
        ▼
Reciprocal Rank Fusion
        │
        ▼
Context Assembly
        │
        ▼
Ollama
(qwen2.5:7b)
        │
        ▼
Grounded AI Response
```

---

## Screenshots

### CLI Interface

The current Genesis interface is terminal-based and provides access to indexing, retrieval, and AI interaction workflows.

![CLI Menu](screenshots/menu.png)

---

### Incremental Indexing System

Genesis tracks content changes through hashing and avoids rebuilding unchanged notes. This significantly reduces unnecessary processing time when working with larger vaults.

![Incremental Indexing](screenshots/incremental_indexing.png)

---

### Hybrid Retrieval Trace

Genesis combines lexical matching with semantic retrieval and exposes scoring signals to make retrieval behavior transparent during development.

This output shows:

* Lexical score contribution
* Semantic score contribution
* Matched terms
* Retrieval signals
* Source metadata

![Hybrid Retrieval](screenshots/hybrid_search.png)

---

### Grounded AI Responses

Responses are generated using retrieved vault context rather than relying entirely on model memory. Source references are included to show where information originated.

![Grounded AI Response](screenshots/grounded_response.png)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/vancesystems/Genesis.git
cd Genesis
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Install required Ollama models:

```bash
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

Run Genesis:

```bash
python main.py
```

---

## Development Roadmap

### Complete

* Markdown Vault Ingestion
* Heading-Aware Chunking
* Embedding Generation
* ChromaDB Integration
* Semantic Search
* Hybrid Retrieval
* Query Analysis
* Reciprocal Rank Fusion (RRF)
* Incremental Indexing
* Retrieval Evaluation
* Grounded Responses

### In Progress

* BM25 Retrieval
* SQLite FTS5 Integration

### Planned

* SQLite Structured Memory Layer
* Graph-Aware Retrieval
* Relationship Discovery
* Project Memory Systems
* Long-Term Contextual Intelligence
* TypeScript Frontend
* Backlinks and Knowledge Relationships
* Persistent Conversation Context

---

## Design Philosophy

### Retrieval Before Generation

A good answer begins with good retrieval.

### Transparency Before Magic

Retrieval decisions should be visible and explainable.

### Local First

Users should maintain ownership of their data and models.

### Evaluation Before Automation

System quality should be measured before adding complexity.

---

## Goal

The long-term goal of Genesis is to evolve beyond a simple chatbot into:

> A local semantic intelligence system designed for engineering knowledge, retrieval, and contextual reasoning.

The aim is to create an AI system that does more than answer questions — one that can build understanding, preserve context, discover relationships, and act as a long-term knowledge companion.
