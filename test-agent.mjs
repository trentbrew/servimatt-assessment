#!/usr/bin/env node
import { run } from '@openai/agents';
import { triageAgent } from './packages/agent-core/src/index.ts';

async function testAgent() {
  console.log('Testing OpenAI Agent...\n');
  
  const testQuestions = [
    'When did sharks first appear?',
    'What is 25 times 17?',
  ];

  for (const question of testQuestions) {
    console.log(`Question: ${question}`);
    try {
      const result = await run(triageAgent, question);
      console.log(`Answer: ${result.finalOutput}`);
      console.log(`Agent: ${result.finalAgent?.name || 'Unknown'}\n`);
    } catch (error) {
      console.error(`Error: ${error.message}\n`);
    }
  }
}

testAgent().catch(console.error);
