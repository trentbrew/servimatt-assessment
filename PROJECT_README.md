# AI Multi-Agent Chat with RAG

A production-ready, real-time AI chat application featuring multi-agent orchestration and Retrieval-Augmented Generation (RAG) for document querying.

**Live Demo:** [servimatt-assessment-web.vercel.app](https://servimatt-assessment-web.vercel.app/)  
**Repository:** [github.com/trentbrew/servimatt-assessment](https://github.com/trentbrew/servimatt-assessment)

---

## Overview

This application demonstrates modern AI application development with:

- **Multi-agent AI system** using OpenAI Agents SDK
- **RAG implementation** for document analysis
- **Real-time data synchronization** with InstantDB
- **Custom agent creation** with personalities and expertise
- **Production-ready architecture** with monorepo structure

Built with Next.js 15, React 19, TypeScript, and shadcn/ui components.

---

## Key Features

### Multi-Agent Intelligence

- **Triage routing** automatically directs queries to specialized agents
- **Built-in tutors** for math and history with custom tools
- **Custom agents** with configurable personalities, expertise, and avatars
- **Agent-specific chats** with isolated conversation histories

### RAG Document Analysis

- Upload and analyze multiple file types: CSV, JSON, Markdown, XLSX, TXT
- Server-side file parsing with content extraction
- Context-enhanced AI responses based on document contents
- Support for files up to 10MB with validation and retry logic

### Real-Time Capabilities

- **InstantDB integration** for live data synchronization
- **Streaming responses** with Server-Sent Events (SSE)
- **File storage** with secure upload/retrieval
- **Persistent chat history** across sessions

### Modern UI/UX

- Clean, accessible chat interface with markdown rendering
- Dark/light mode support
- File attachment management with visual indicators
- Loading states, error boundaries, and toast notifications
- Fully responsive design

---

## Architecture

### Monorepo Structure

```
app-v1/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App router (pages & API routes)
│       ├── components/         # React components
│       ├── hooks/              # Custom React hooks
│       └── lib/                # Utilities (file parsers, InstantDB config)
├── packages/
│   ├── agent-core/             # OpenAI Agents SDK configuration
│   │   ├── agents/             # Agent definitions (triage, tutors)
│   │   └── tools/              # Agent tools (historyFunFact)
│   └── ui/                     # Shared shadcn/ui components
└── .notes/                     # Documentation & deployment guides
```

### Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **AI:** OpenAI Agents SDK
- **Database:** InstantDB (real-time)
- **Build:** Turborepo + pnpm
- **Deploy:** Vercel

---

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key
- InstantDB account (free tier works)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/trentbrew/servimatt-assessment.git
   cd servimatt-assessment/app-v1
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create `apps/web/.env.local`:

   ```env
   # OpenAI
   OPENAI_API_KEY=sk-...

   # InstantDB (create a free app at instantdb.com)
   NEXT_PUBLIC_INSTANTDB_ID=your_app_id
   INSTANTDB_ADMIN_SECRET=your_admin_token
   ```

   > **💡 For Reviewers/Recruiters:**
   > The live demo is fully functional at [servimatt.brew.build](https://servimatt.brew.build).
   > If you'd like to run locally, you can use the demo InstantDB app:
   >
   > ```env
   > NEXT_PUBLIC_INSTANTDB_ID=8357e015-af13-4615-ac4c-b0be9d2a8832
   > ```
   >
   > You'll still need your own OpenAI API key. The admin secret is not needed for read-only testing.

4. **Run the development server**

   ```bash
   pnpm dev
   ```

5. **Open the application**
   ```
   http://localhost:1290
   ```

---

## Usage

### Creating a Custom Agent

1. Click the **"+ New Agent"** button in the sidebar
2. Configure the agent:
   - Name and expertise area
   - Personality traits
   - Visual identity (icon & color)
   - Optional: Custom system prompt
3. Click **"Create Agent"**
4. Your agent appears in the icon rail

### Starting a Chat

1. Select an agent from the sidebar
2. Click **"+ New"** to create a chat thread
3. Type your message or upload files
4. The agent responds with streaming text

### Using RAG with Files

1. Click the **📎 paperclip icon** in the chat input
2. Select files (CSV, JSON, MD, XLSX, TXT)
3. Ask questions about the uploaded content
4. The AI analyzes and responds with insights

---

## Technical Highlights

### OpenAI Agents SDK Integration

- Custom agent creation with `Agent.create()`
- Tool integration for specialized functions
- Handoff system for multi-agent orchestration
- Streaming support for real-time responses

### RAG Implementation

```typescript
// File parsing with content extraction
const parsed = await parseFileContent(fileId, filename, type);

// Context-enhanced prompt generation
const enhancedPrompt = createContextPrompt(files, userQuery);

// Agent execution with file context
const result = await run(agent, enhancedPrompt, { stream: true });
```

### Real-Time Data Flow

```
User Action → API Route → InstantDB → Real-time Update → UI Re-render
```

### Security Considerations

- API keys are server-side only (never exposed to client)
- File validation (type, size, content)
- Admin SDK for secure file operations
- Content truncation to prevent token overflow
- Retry logic with exponential backoff

---

## API Routes

### `POST /api/agent`

Execute AI agent with optional file attachments

- **Body:** `{ message, fileAttachments?, stream?, agent? }`
- **Returns:** Streaming response or JSON

### `POST /api/upload/files`

Upload files to InstantDB storage

- **Body:** FormData with files and chatId
- **Returns:** `{ success, files, errors? }`

### `POST /api/upload/avatar`

Upload agent avatar image

- **Body:** FormData with avatar file
- **Returns:** `{ fileId }`

---

## Testing

### Test File Upload

```bash
node test-upload.mjs
```

### Test Agent Execution

```bash
node test-agent.mjs
```

### Test API Endpoints

```bash
bash test-api.sh
```

---

## Deployment

The application is deployed on Vercel with automatic deployments from the `main` branch.

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/trentbrew/servimatt-assessment)

**Required Environment Variables:**

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_INSTANTDB_ID`
- `INSTANTDB_ADMIN_SECRET`

See [`.notes/DEPLOYMENT.md`](.notes/DEPLOYMENT.md) for detailed deployment instructions.

---

## Key Files

| File                                | Description                   |
| ----------------------------------- | ----------------------------- |
| `apps/web/app/dashboard/page.tsx`   | Main chat interface           |
| `apps/web/components/AgentChat.tsx` | Chat component with streaming |
| `apps/web/app/api/agent/route.ts`   | AI agent API endpoint         |
| `apps/web/lib/file-parsers.ts`      | RAG file parsing utilities    |
| `packages/agent-core/src/agents/`   | Agent configurations          |
| `.notes/INTEGRATION_SUMMARY.md`     | Feature documentation         |

---

## Design Decisions

### Why InstantDB?

- Real-time sync out-of-the-box
- File storage API included
- Zero backend setup required
- Perfect for prototypes and MVPs

### Why Monorepo?

- Share agent logic across multiple frontends
- Consistent tooling and TypeScript configs
- Easier dependency management
- Better code organization at scale

### Why Server-Side File Processing?

- Keeps API keys secure
- Reduces client bundle size
- Better error handling
- Content validation before sending to AI

### Why Streaming Responses?

- Better perceived performance
- Real-time feedback to users
- Lower time-to-first-byte
- Handles long AI responses gracefully

---

## Future Enhancements

- [ ] Full XLSX parsing with `xlsx` library
- [ ] User authentication and multi-tenancy
- [ ] Agent sharing and collaboration
- [ ] Chat export functionality
- [ ] Unit and integration tests
- [ ] Rate limiting and caching
- [ ] Vector database for semantic search
- [ ] Voice input/output
- [ ] Mobile app with React Native

---

## License

MIT License - feel free to use this as a starting point for your own projects!

---

## Acknowledgments

Built with:

- [OpenAI Agents SDK](https://github.com/openai/openai-agents-js)
- [InstantDB](https://instantdb.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Next.js](https://nextjs.org)
- [Vercel](https://vercel.com)

---

**Built by Trent Brew** | [GitHub](https://github.com/trentbrew) | [Website](https://brew.build)
