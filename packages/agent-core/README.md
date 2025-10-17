# @workspace/agent-core

Core agent implementation for the OpenAI Agents SDK.

## Agents

- **Triage Agent**: Routes questions to specialized agents
- **History Tutor**: Answers historical questions with fun facts
- **Math Tutor**: Helps with math problems

## Usage

```typescript
import { run } from '@openai/agents';
import { triageAgent } from '@workspace/agent-core';

const result = await run(triageAgent, 'What is the capital of France?');
console.log(result.finalOutput);
```

## Environment Variables

Make sure to set your OpenAI API key:

```bash
export OPENAI_API_KEY=sk-...
```
