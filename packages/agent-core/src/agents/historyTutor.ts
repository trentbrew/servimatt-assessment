import { Agent } from '@openai/agents';
import { historyFunFact } from '../tools/historyFunFact';

export const historyTutorAgent = new Agent({
  name: 'History Tutor',
  instructions:
    'You provide assistance with historical queries. Explain important events and context clearly.',
  tools: [historyFunFact],
});
