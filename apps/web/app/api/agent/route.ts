import { run } from '@openai/agents';
import { triageAgent } from '@workspace/agent-core';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not set' },
        { status: 500 },
      );
    }

    // Run the agent
    const result = await run(triageAgent, message);

    return NextResponse.json({
      output: result.finalOutput,
      agent: result.finalAgent?.name || 'Triage Agent',
    });
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 },
    );
  }
}
