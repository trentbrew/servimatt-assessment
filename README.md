# AI Multi-Agent Chat with RAG

<img width="1538" height="989" alt="image" src="https://github.com/user-attachments/assets/dd40e00c-afc4-49e3-ad5d-fec93de79691" />

> **📖 For full documentation, see [PROJECT_README.md](./PROJECT_README.md)**

A production-ready AI chat application with multi-agent orchestration and RAG for document analysis.

**Live Demo:** [servimatt.brew.build](https://servimatt.brew.build)

## Features

- Multi-agent system with OpenAI Agents SDK
- RAG implementation (CSV, JSON, MD, XLSX, TXT)
- Real-time sync with InstantDB
- Modern UI with shadcn/ui
- Deployed on Vercel

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment (see PROJECT_README.md)
cp apps/web/.env.local.example apps/web/.env.local

# Run development server
pnpm dev
```

Visit `http://localhost:1290`

## Architecture

Monorepo with:

- `apps/web` - Next.js 15 application
- `packages/agent-core` - OpenAI Agents SDK configuration
- `packages/ui` - Shared shadcn/ui components

See [PROJECT_README.md](./PROJECT_README.md) for complete documentation.
