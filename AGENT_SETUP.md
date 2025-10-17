# OpenAI Agents SDK Integration

This project integrates the [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/guides/quickstart/) with a multi-agent system for homework assistance.

## Architecture

### Package Structure

- **`packages/agent-core`**: Core agent implementation
  - `agents/historyTutor.ts`: History specialist agent
  - `agents/mathTutor.ts`: Math specialist agent
  - `agents/triage.ts`: Routing agent that directs questions
  - `tools/historyFunFact.ts`: Example tool for history agent

### Agent System

The system uses three agents following the quickstart guide pattern:

1. **Triage Agent**: Routes user questions to the appropriate specialist
2. **History Tutor**: Answers historical questions with fun facts
3. **Math Tutor**: Helps with math problems and provides explanations

### Web Integration

- **API Route**: `/api/agent` - Server-side endpoint that runs agents
- **UI Component**: `AgentChat` - Chat interface for interacting with agents
- **Demo Page**: `/agent` - Standalone page showcasing the agent system

## Usage

### From the Web UI

1. Start the dev server: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. Click "Try the AI Agent Demo →"
4. Ask questions like:
   - "When did sharks first appear?"
   - "What is 25 × 17?"
   - "What is the capital of France?"

### Programmatically

```typescript
import { run } from '@openai/agents';
import { triageAgent } from '@workspace/agent-core';

const result = await run(triageAgent, 'What is the capital of France?');
console.log(result.finalOutput);
console.log('Handled by:', result.finalAgent?.name);
```

## Environment Variables

Required environment variable in `.env`:

```bash
OPENAI_API_KEY=sk-...
```

## Development

### Adding New Agents

1. Create a new agent file in `packages/agent-core/src/agents/`
2. Export it from `packages/agent-core/src/index.ts`
3. Add it to the triage agent's handoffs if needed

### Adding Tools

1. Create a new tool file in `packages/agent-core/src/tools/`
2. Import and add it to the agent's `tools` array

Example:
```typescript
import { tool } from '@openai/agents';
import { z } from 'zod';

export const myTool = tool({
  name: 'my_tool',
  description: 'What this tool does',
  parameters: z.object({
    input: z.string(),
  }),
  execute: async ({ input }) => {
    return `Result for ${input}`;
  },
});
```

## References

- [OpenAI Agents SDK Quickstart](https://openai.github.io/openai-agents-js/guides/quickstart/)
- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-js/)
