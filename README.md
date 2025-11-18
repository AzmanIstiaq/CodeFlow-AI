# 🚀 CodeFlow AI — Visual AI Workflow Builder

CodeFlow AI is a **visual drag-and-drop workflow builder** that allows developers to
create AI-powered pipelines using nodes, connections, and automation logic.  
Think of it as **n8n + GitHub Copilot + Replit AI**, but focused on **developer workflows**.

This prototype demonstrates how AI nodes can be connected together to generate code,
transform data, chain prompts, and produce automated outputs.

---

## ⭐ Features (Current Prototype)

### 🎨 Visual Workflow Canvas
- Drag & drop nodes  
- Connect nodes with edges  
- Edit node contents (prompts, labels, settings)  
- ReactFlow-powered editor  
- Sidebar settings panel for each node  
- Save/load diagrams from backend (SQLite)

### 🤖 AI Node Execution
- Run workflows from the **Start Node**  
- Each AI node:
  - Executes a prompt  
  - Sends request to OpenAI  
  - Receives output  
- Outputs can be passed to later nodes

### 🔗 Variable Passing
Use `{{variableName}}` inside prompts to dynamically inject output from previous nodes.

### 💾 Workflow Persistence
- Save diagram  
- Load diagram  
- Update nodes  
- Edit node metadata  
- Backend: .NET 8 + SQLite

---

## 🏗️ Architecture

### **Frontend (React + TypeScript + Vite)**
- ReactFlow for canvas interaction  
- Custom nodes (Start, AI, Output)  
- Node editor sidebar  
- File structure:
src/
api/
components/
builder/
CustomNodes/
NodeEditorPanel.tsx
NodeToolbar.tsx
pages/
visualbuilder.tsx
home.tsx

### **Backend (.NET 8 Minimal API)**
- CRUD for workflows  
- SQLite database for diagram JSON  
- Endpoints:
- `GET /workflows`
- `POST /workflows`
- `DELETE /workflows/{id}`
- `PUT /workflows/{id}/diagram`
- `GET /workflows/{id}/diagram`

---

## 🧪 Example Workflow

(Start)

↓

Generate Feature Ideas (AI Node)

↓

Summarize Features (AI Node)

↓

Output Summary

**AI Node Prompt Example:**

Generate 5 unique app ideas about {{topic}}.

**Output Node Example:**

variable: ideas

After execution:
- Ideas are generated
- Stored in variable `ideas`
- Next nodes can use `{{ideas}}`

---

## 🔥 Vision (Future Roadmap)

This prototype is the foundation for a much larger system:

### Long-term goals:
- AI nodes that generate **frontend + backend code**
- Auto-create folder structures
- Multi-agent pipeline execution
- Auto-deployment (Vercel / Docker)
- Database nodes (Prisma, Mongo, SQL)
- API call nodes
- Conditional logic (IF nodes)
- Testing + CI pipelines
- Template marketplace
- Persistent memory for better reasoning

### Short-term MVP Goals:
- Workflow execution engine  
- Run logs panel  
- Variable system  
- Basic code generation node  
- File viewer + export ZIP  

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- ReactFlow
- Vite
- Zustand (planned)
- Tailwind (planned)

### Backend
- .NET 8 Minimal API
- SQLite Database
- Dapper / EF (optional)
- OpenAI API

---

## 📦 Running the Project

### 1. Clone the repo
```bash
git clone https://github.com/yourname/CodeFlow-AI.git
```

### 2. Start Backend (.NET)
```bash
cd CodeFlowBackend
dotnet watch run
```

### 3. Start Frontend (React)
```bash
cd codeflow-client
npm install
npm run dev
```

### 4. Open in Browser
```bash
http://localhost:5173
```
