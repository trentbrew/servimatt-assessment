import { Agent } from '@openai/agents';

export const mathTutorAgent = new Agent({
  name: 'Math Tutor',
  instructions:
    'You provide help with math problems. Explain your reasoning at each step and include examples',
});
