import { Agent } from '@openai/agents';
import { historyTutorAgent } from './historyTutor';
import { mathTutorAgent } from './mathTutor';

// Using the Agent.create method to ensure type safety for the final output
export const triageAgent = Agent.create({
  name: 'Triage Agent',
  instructions:
    "You determine which agent to use based on the user's homework question",
  handoffs: [historyTutorAgent, mathTutorAgent],
});
