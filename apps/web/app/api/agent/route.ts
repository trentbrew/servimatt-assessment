import { run, Agent } from '@openai/agents';
import { triageAgent } from '@workspace/agent-core';
import { NextRequest, NextResponse } from 'next/server';
import { parseFileContent, createContextPrompt, ParsedContent } from '@/lib/file-parsers';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Safety limits
const MAX_MESSAGE_LENGTH = 4000; // characters
const MAX_FILES_PER_REQUEST = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 requests per hour per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(clientIp, {
      limit: 20,
      window: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.resetAt);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again after ${resetDate.toLocaleTimeString()}.`,
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    const { message, fileAttachments = [], stream: enableStreaming, agent } = await request.json();

    // Validation: Message length
    if (message && message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 },
      );
    }

    // Validation: File count
    if (fileAttachments && fileAttachments.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files per request.` },
        { status: 400 },
      );
    }

    // Validation: File sizes
    if (fileAttachments && fileAttachments.length > 0) {
      const oversizedFiles = fileAttachments.filter((f: FileAttachment) => f.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        return NextResponse.json(
          { error: `File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB per file.` },
          { status: 400 },
        );
      }
    }

    if (!message && (!fileAttachments || fileAttachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or file attachments required' },
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

    let finalMessage = message || 'Please analyze the uploaded files.';

    // Process file attachments for RAG
    if (fileAttachments && fileAttachments.length > 0) {
      try {
        console.log(`Processing ${fileAttachments.length} file attachments for RAG...`);
        
        const parsedFiles: ParsedContent[] = await Promise.all(
          fileAttachments.map(async (file: FileAttachment) => {
            return await parseFileContent(file.id, file.name, file.type);
          })
        );

        // Create enhanced prompt with file context
        finalMessage = createContextPrompt(parsedFiles, message || '');
        
        console.log(`RAG context created with ${parsedFiles.length} files`);
      } catch (fileError) {
        console.error('File processing error:', fileError);
        return NextResponse.json(
          { error: 'Failed to process uploaded files', details: String(fileError) },
          { status: 500 },
        );
      }
    }

    // Create custom agent if agent info is provided
    let selectedAgent = triageAgent;
    
    if (agent && agent.isCustom) {
      // Get the agent details from the database to get full info
      const customInstructions = `You are ${agent.title}, a specialized AI assistant.

${agent.personality ? `Personality: ${agent.personality}` : ''}

${agent.expertise ? `Expertise: You specialize in ${agent.expertise}.` : ''}

${agent.systemPrompt ? `Additional Instructions: ${agent.systemPrompt}` : ''}

Please respond in character and use your specialized knowledge to help the user.`;

      selectedAgent = new Agent({
        name: agent.title || 'Custom Agent',
        instructions: customInstructions,
      });
    }

    // Run the agent with the enhanced message
    if (enableStreaming) {
      const result = await run(selectedAgent, finalMessage, { stream: true });
      
      // Create a readable stream for the response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial processing status if files are attached
            if (fileAttachments && fileAttachments.length > 0) {
              const processingChunk = `data: ${JSON.stringify({ 
                toolCall: { name: 'file_analysis' },
                done: false 
              })}\n\n`;
              controller.enqueue(new TextEncoder().encode(processingChunk));
            }
            
            for await (const event of result) {
              if (event.type === 'raw_model_stream_event') {
                // Send text chunks as Server-Sent Events
                const data = event.data;
                if (data.type === 'output_text_delta' && data.delta) {
                  const chunk = `data: ${JSON.stringify({ 
                    content: data.delta,
                    done: false 
                  })}\n\n`;
                  controller.enqueue(new TextEncoder().encode(chunk));
                }
              }
            }
            
            // Wait for completion
            await result.completed;
            
            // Send completion signal
            const finalChunk = `data: ${JSON.stringify({ 
              content: '', 
              done: true,
              agent: 'RAG-Enhanced Agent',
              filesProcessed: fileAttachments?.length || 0
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(finalChunk));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        },
      });
    } else {
      // Non-streaming response (existing behavior)
      const result = await run(selectedAgent, finalMessage);

      return NextResponse.json(
        {
          output: result.finalOutput,
          agent: 'RAG-Enhanced Agent',
          filesProcessed: fileAttachments?.length || 0,
        },
        {
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          },
        },
      );
    }
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 },
    );
  }
}
