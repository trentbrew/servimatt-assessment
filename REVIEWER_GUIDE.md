# For Technical Reviewers

## Quick Access

**Live Demo:** [servimatt-assessment-web.vercel.app](https://servimatt-assessment-web.vercel.app/dashboard)
**GitHub:** [github.com/trentbrew/servimatt-assessment](https://github.com/trentbrew/servimatt-assessment)

The application is fully deployed and functional. No local setup required to review!

---

## Running Locally (Optional)

If you'd like to run the project locally:

### Quick Start

```bash
git clone https://github.com/trentbrew/servimatt-assessment.git
cd servimatt-assessment/app-v1
pnpm install
```

Create `apps/web/.env.local`:

```env
# Your OpenAI API key (required)
OPENAI_API_KEY=sk-your-key-here

# Demo InstantDB app (read-only, provided for testing)
NEXT_PUBLIC_INSTANTDB_ID=8357e015-af13-4615-ac4c-b0be9d2a8832
```

Run:

```bash
pnpm dev
```

Visit: `http://localhost:1290`

---

## What to Test

### Core Features

1. **Multi-Agent Chat**
   - Click "Math Tutor" or "History Tutor" in sidebar
   - Create a new chat
   - Ask questions like "What is 25 × 17?" or "When did sharks first appear?"

2. **Custom Agent Creation**
   - Click "+ New Agent" button
   - Configure personality, expertise, icon
   - Create chats with your custom agent

3. **RAG File Upload**
   - Click the 📎 paperclip icon in chat
   - Upload a CSV, JSON, or TXT file
   - Ask questions about the file contents
   - Watch the AI analyze and respond with insights

4. **Real-Time Sync**
   - Open two browser tabs
   - Create agents/chats in one tab
   - Watch them appear instantly in the other

---

## Technical Highlights

**Architecture:**

- Monorepo with Turborepo + pnpm
- Next.js 15 with App Router
- TypeScript throughout
- OpenAI Agents SDK for multi-agent orchestration

**Key Implementations:**

- RAG with file parsing (CSV, JSON, MD, XLSX, TXT)
- Streaming responses via Server-Sent Events
- Real-time data sync with InstantDB
- Custom agent creation with personalities
- File storage with validation and retry logic

**Code Quality:**

- Type-safe with TypeScript
- Error boundaries and graceful degradation
- Clean separation of concerns
- Comprehensive documentation

---

## Security Note

The `NEXT_PUBLIC_INSTANTDB_ID` provided above is a **public client key** that's safe to share. It's already visible in the browser bundle on the live site.

For full admin access (not needed for testing), a separate admin secret is used server-side only.

---

## Questions?

Feel free to explore the codebase. Key files:

- `apps/web/app/dashboard/page.tsx` - Main chat interface
- `apps/web/components/agent-chat.tsx` - Chat component
- `apps/web/app/api/agent/route.ts` - AI agent endpoint
- `apps/web/lib/file-parsers.ts` - RAG implementation
- `packages/agent-core/src/agents/` - Agent configurations

For complete documentation, see:

- `PROJECT_README.md` - Full technical documentation
- `README.md` - Quick start guide

---

**Built by Trent Brew for Servimatt Technical Assessment**
