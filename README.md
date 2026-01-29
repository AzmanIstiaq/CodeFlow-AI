# 🚀 CodeFlow AI — Visual AI Workflow Builder

**AI-powered workflow builder with visual editor and local AI execution**

CodeFlow AI is a graph-based workflow execution engine that runs AI models locally using Ollama. Build workflows visually, connect AI nodes, and execute them with real-time feedback.

---

## ✨ Features

### 🎨 Visual Workflow Builder

- Drag & drop nodes (Start, AI, Output)
- Connect nodes with edges
- ReactFlow-powered canvas
- Node settings panel
- Save/load workflows

### 🤖 Local AI Execution

- Powered by **Ollama** (runs locally, no API keys)
- 7 pre-configured models (Llama, Phi, Gemma, Mistral, Qwen)
- Graph-driven execution: Start → AI → Output
- Real-time status: ⏳ Running → ✅ Completed
- Clean execution contract: `{prompt, model}` → `{output}`

### 💾 Workflow Persistence

- SQLite backend storage
- CRUD operations for workflows
- Diagram state preservation

---

## 🚀 Quick Start

### Prerequisites

1. [Ollama](https://ollama.com/download) installed
2. Node.js 16+
3. .NET 8.0

### Installation

```bash
# 1. Install Ollama
# Windows: Download from ollama.com
# Mac: brew install ollama
# Linux: curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull a model (choose one)
ollama pull llama3.2:1b  # Fastest (1GB)
ollama pull llama3.2     # Default (3GB)

# 3. Install dependencies
npm install
cd frontend && npm install && cd ..
```

### Run

```bash
# Terminal 1: Start Ollama (keep running)
ollama serve

# Terminal 2: Start CodeFlow-AI
npm run dev
```

Open http://localhost:5173

---

## Rule Ownership Map

- Spacing / height bugs      → layout/*
- Flow & column math         → flow/*
- Drag / guides / canvas     → interaction/*
- Resize constraints         → resize/*
- Selection & bundling       → selection/*
- Z-index & overlap          → layering/*
- Inspector behavior         → inspector/*
- Export safety & layout     → export/*

Common failure triage:
- Unexpected gaps/stacking → check layoutMetrics.ts (numbers) then layoutResolvers.ts (stack math).
- Column drops/order off   → flowResolvers.ts (insert/order), flowPolicy.ts (allowed types).
- Drag feels sticky/loose  → interactionMetrics.ts (thresholds), interactionPolicy.ts (draggable rules).
- Bar resize clamps wrong  → resizePolicy.ts (mins), resizeResolvers.ts (state writeback).
- Selection bundles wrong  → selectionPolicy.ts (bundle/redirect), selectionResolvers.ts (hit/bundle logic).
- Export mismatch/layout   → exportPolicy.ts (gate), layoutResolvers.ts (invariants before export).


## 📖 Usage

1. **Create Workflow**: Click "New Workflow" → Enter name
2. **Open Builder**: Click "Open Visual Builder"
3. **Add Nodes**: Click toolbar buttons:
   - `➕ Start` (green)
   - `🤖 AI` (blue)
   - `📤 Output` (orange)
4. **Connect Nodes**: Drag from right handle → left handle
5. **Configure AI**: Click AI node → Set:
   - Prompt: "Write a haiku about coding"
   - Model: Select from dropdown
6. **Run**: Click `▶️ Run Workflow`
7. **View Results**: Output appears in AI node & Output node

---

## 🏗️ Architecture

```
┌─────────┐      ┌─────────┐      ┌────────────┐
│  Start  │─────▶│   AI    │─────▶│   Output   │
└─────────┘      └─────────┘      └────────────┘
                      │
                      ▼
                 Ollama API
              (localhost:11434)
```

**Execution Flow**:

1. Parse visual graph (nodes + edges)
2. Traverse Start → AI node
3. Extract `{prompt, model}` from AI node data
4. POST to `/api/executeWorkflow`
5. Backend calls Ollama: `POST http://localhost:11434/api/generate`
6. Return `{output}` or `{error}`
7. Update node states with results

---

## 🎯 Design Decisions

### Why Graph-Driven Execution?

**Decision**: Traverse nodes via edges, not UI state

**Rationale**:

- Scales to complex workflows (branching, loops, conditionals)
- Separates concerns: UI renders, engine executes
- Enables validation before execution (detect cycles, orphaned nodes)
- Makes testing deterministic (pure function: graph → output)

**Alternative Rejected**: Direct node invocation from UI would couple execution to rendering.

### Why Stateless Backend?

**Decision**: Backend has zero knowledge of nodes, edges, or workflow structure

**Rationale**:

- **Single Responsibility**: Backend only executes AI models
- **Scalability**: Horizontally scalable (no session state)
- **Flexibility**: Frontend can change node types without backend changes
- **Testability**: Simple contract: `{prompt, model}` → `{output}`

**Alternative Rejected**: Storing workflow execution state in backend would create coupling and complicate deployment.

### Why Local LLM (Ollama)?

**Decision**: Use Ollama instead of OpenAI/Anthropic APIs

**Rationale**:

- **Zero Cost**: No API keys, no rate limits, no billing
- **Privacy**: Data never leaves localhost
- **Speed**: No network latency for inference
- **Learning**: Understand LLM deployment architecture

**Deployment Note**: Production can swap to cloud APIs by changing one endpoint. Architecture remains identical.

### Why Execution Status States?

**Decision**: Nodes track `executing → completed → failed` states

**Rationale**:

- **UX**: Users see real-time feedback (critical for 10-30s LLM calls)
- **Debugging**: Failed nodes stay red, showing where errors occurred
- **Professional Polish**: Makes demos impressive vs. silent execution

### Why SQLite Over PostgreSQL?

**Decision**: Use SQLite for persistence

**Rationale**:

- **Zero Config**: No server setup, perfect for local dev
- **Sufficient**: Workflows are small JSON blobs (~1-10KB)
- **Portable**: Single file, easy to backup/share

**Production Path**: Swap to PostgreSQL when multi-user scaling needed.

---

## 📦 Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build

# Deploy
vercel
```

**Environment Variables**: None required

### Backend (Fly.io / Railway)

```bash
cd backend

# Fly.io
fly launch
fly deploy

# Railway
railway init
railway up
```

**Note**: Ollama runs locally only. For production AI:

- Replace Ollama endpoint with OpenAI/Anthropic API
- Add API key environment variable
- Update `ExecutionEndpoints.cs` to call cloud API

**Alternative**: Deploy Ollama on cloud VM and point backend to it.

---

## 🎬 Demo

[Demo GIF/Video Coming Soon]

**Workflow**: Start → AI → Output  
**Prompt**: "Write a haiku about programming"  
**Model**: Llama 3.2 (1B)  
**Execution Time**: ~5 seconds  
**Result**: Real-time status updates + AI-generated haiku

---

## 📝 Resume Bullet

```
Built a graph-driven AI workflow engine with execution state tracking,
local LLM support (Ollama), and extensible node architecture.
Tech: React, TypeScript, .NET 8, ReactFlow, SQLite
```

---

## 🛠️ Tech Stack

**Frontend**: React, TypeScript, Vite, ReactFlow  
**Backend**: ASP.NET Core 8.0, Minimal APIs  
**Database**: SQLite  
**AI**: Ollama (local LLM inference)

---

## 🚀 Future Enhancements

- Branching logic (IF/ELSE nodes)
- Loop nodes (iterate over arrays)
- HTTP Request nodes
- Data Transform nodes
- File I/O nodes
- Multi-agent chaining
- Workflow templates

---

## 📄 License

MIT

## 👤 Author

**Azman Istiaq**  
[GitHub](https://github.com/AzmanIstiaq) • [LinkedIn](https://linkedin.com/in/azmanistiaq)
