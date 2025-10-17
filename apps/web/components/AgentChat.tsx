'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Paperclip,
  X,
  FileText,
  Brain,
  BookOpen,
  Calculator,
  Palette,
} from 'lucide-react';
import { db } from '@/lib/instant';
import ReactMarkdown from 'react-markdown';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar';
import { Badge } from '@workspace/ui/components/badge';
import { Spinner } from '@workspace/ui/components/spinner';
import { useMessages, useChats } from '@/hooks/useAgents';

// Icon mapping for agent avatars
const ICON_MAP: Record<string, any> = {
  bot: Bot,
  sparkles: Sparkles,
  brain: Brain,
  book: BookOpen,
  calculator: Calculator,
  palette: Palette,
};

// Component to display agent avatar (custom uploaded image or icon)
function AgentAvatar({ agent }: { agent?: any }) {
  // Always call hooks unconditionally (Rules of Hooks)
  const { data } = db.useQuery({
    $files: {
      $: {
        where: agent?.avatarUrl
          ? { id: agent.avatarUrl }
          : { id: '__no_file__' },
      },
    },
  });

  if (!agent) {
    return (
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-primary/10">
          <Sparkles className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  if (agent.avatarUrl) {
    const fileUrl = data?.$files?.[0]?.url;

    return (
      <Avatar className="w-8 h-8">
        {fileUrl && (
          <AvatarImage
            src={fileUrl}
            alt="Agent avatar"
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-primary/10">
          {ICON_MAP[agent.icon] ? (
            React.createElement(ICON_MAP[agent.icon], { className: 'w-4 h-4' })
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </AvatarFallback>
      </Avatar>
    );
  }

  // Default icon avatar
  const IconComponent = ICON_MAP[agent.icon] || Bot;
  return (
    <Avatar className="w-8 h-8">
      <AvatarFallback className="bg-primary/10">
        <IconComponent className="w-4 h-4" />
      </AvatarFallback>
    </Avatar>
  );
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface AgentChatProps {
  chatId?: string;
  currentAgent?: any;
}

export function AgentChat({ chatId, currentAgent }: AgentChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get messages from InstantDB
  const { messages: dbMessages, addMessage } = useMessages(chatId);
  const { updateChat } = useChats();

  // Clear input when switching chats
  useEffect(() => {
    setInput('');
    setIsLoading(false);
    setIsStreaming(false);
    setStreamingMessage('');
    setToolStatus('');
  }, [chatId]);

  // Auto-scroll to bottom when messages change or streaming updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dbMessages.length, streamingMessage]);

  // Convert DB messages to component format
  const messages = dbMessages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    agent: msg.agentName,
  }));

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);

    try {
      // Upload files using server-side API (bypasses permissions)
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('chatId', chatId || '');

      const uploadResponse = await fetch('/api/upload/files', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      
      // Handle partial successes
      if (uploadResult.files && uploadResult.files.length > 0) {
        setAttachedFiles((prev) => [...prev, ...uploadResult.files]);
      }
      
      // Show warnings for any errors
      if (uploadResult.errors && uploadResult.errors.length > 0) {
        console.warn('Some files failed to upload:', uploadResult.errors);
        alert(
          `Some files failed:\n${uploadResult.errors.join('\n')}\n\n${uploadResult.files?.length || 0} files uploaded successfully.`
        );
      }
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(
        `Upload failed: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const removeAttachment = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading || !chatId)
      return;

    const userMessageContent = input.trim();
    const messageAttachments = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);

    try {
      setIsLoading(true);
      
      // Show tool status if files are attached
      if (messageAttachments.length > 0) {
        setToolStatus('Analyzing files...');
      }

      // Update chat title if this is the first message
      if (dbMessages.length === 0) {
        await updateChat(chatId, {
          title: userMessageContent.slice(0, 50),
          lastMessage: userMessageContent.slice(0, 100),
        });
      }

      // Add user message to InstantDB
      await addMessage({
        chatId,
        role: 'user',
        content: userMessageContent || '📎 Uploaded files',
      });

      // Call AI agent API with streaming enabled
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageContent,
          fileAttachments: messageAttachments,
          stream: true, // Enable streaming
          agent: currentAgent, // Pass current agent info for custom instructions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setIsStreaming(true);
      setStreamingMessage('');

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                // Handle tool usage events
                if (data.toolCall) {
                  const toolName = data.toolCall.name || 'tool';
                  if (toolName.includes('file') || toolName.includes('read')) {
                    setToolStatus('Reading files...');
                  } else if (toolName.includes('search') || toolName.includes('query')) {
                    setToolStatus('Searching...');
                  } else if (toolName.includes('analyze')) {
                    setToolStatus('Analyzing...');
                  } else {
                    setToolStatus('Thinking...');
                  }
                } else if (data.toolComplete) {
                  setToolStatus('');
                }

                if (data.content && !data.done) {
                  assistantContent += data.content;
                  setStreamingMessage(assistantContent); // Update UI in real-time
                  setToolStatus(''); // Clear tool status when content starts
                } else if (data.done) {
                  // Save final complete message to DB
                  setIsStreaming(false);
                  setStreamingMessage('');
                  setToolStatus('');

                  if (assistantContent) {
                    await addMessage({
                      chatId,
                      role: 'assistant',
                      content: assistantContent,
                      agentName: data.agent || 'RAG-Enhanced Agent',
                    });
                  }
                }
              } catch (parseError) {
                console.error('Error parsing streaming data:', parseError);
              }
            }
          }
        }
      }

      // Update chat with last message and increment count
      await updateChat(chatId, {
        lastMessage: userMessageContent || 'Uploaded files',
        messageCount: messages.length + 2,
      });
    } catch (error) {
      console.error('Error:', error);
      // Save error message to DB
      await addMessage({
        chatId,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
      });
    } finally {
      setIsLoading(false);
      setToolStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center">
      <div className="flex flex-col h-full max-w-2xl w-full relative">
        <div ref={scrollRef} className="flex-1 p-4 pb-32 overflow-y-auto">
          {!chatId && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No chats yet</p>
              <p className="text-sm mb-4">
                {currentAgent?.title
                  ? `Start a conversation with ${currentAgent.title}`
                  : 'Create a new chat to get started'}
              </p>
              <p className="text-xs italic opacity-75">
                Click &quot;+ New&quot; in the sidebar to create a chat
              </p>
            </div>
          )}

          {chatId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm mb-2">Start a conversation!</p>
              <div className="space-y-1 text-xs">
                <p className="italic">
                  &quot;When did sharks first appear?&quot;
                </p>
                <p className="italic">&quot;What is 25 × 17?&quot;</p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {chatId &&
              messages.length > 0 &&
              messages.map((message, idx) => {
                // Use a combination of index and content hash for key
                const messageKey = `${idx}-${message.content.substring(0, 20)}`;
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <AgentAvatar agent={currentAgent} />
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.agent && (
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {message.agent}
                        </Badge>
                      )}
                      {message.role === 'assistant' ? (
                        <div className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:mb-2 prose-p:leading-relaxed prose-ul:ml-4 prose-ol:ml-4 prose-li:mb-1 prose-strong:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}

            {/* Streaming message display */}
            {isStreaming && streamingMessage && (
              <div className="flex gap-3">
                <AgentAvatar agent={currentAgent} />
                <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {currentAgent?.title || 'RAG-Enhanced Agent'}
                  </Badge>
                  <div className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:mb-2 prose-p:leading-relaxed prose-ul:ml-4 prose-ol:ml-4 prose-li:mb-1 prose-strong:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                    <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                    <span>Streaming...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tool usage indicator */}
            {toolStatus && (
              <div className="flex gap-3 items-center">
                <AgentAvatar agent={currentAgent} />
                <div className="bg-muted/50 rounded-lg px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{toolStatus}</span>
                </div>
              </div>
            )}

            {/* Loading indicator for non-streaming */}
            {isLoading && !isStreaming && !toolStatus && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10">
                    <Sparkles className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Spinner className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t"
        >
          {/* File Attachments */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-32">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(file.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              title="Attach files (CSV, JSON, Markdown, XLSX)"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                attachedFiles.length > 0
                  ? 'Ask about your files...'
                  : 'Ask a question...'
              }
              disabled={isLoading}
              className="flex-1"
            />

            <Button
              type="submit"
              disabled={
                isLoading || (!input.trim() && attachedFiles.length === 0)
              }
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.json,.md,.xlsx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </form>
      </div>
    </div>
  );
}
