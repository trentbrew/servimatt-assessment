import { init, i, InstaQLEntity } from '@instantdb/react';

// ID for app: servimatt-assessment  
const APP_ID = '384f3f83-084d-410d-9d69-0bdba050f23b';

// Schema definition
const schema = i.schema({
  entities: {
    // Built-in file storage
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
      'content-type': i.string().optional(),
      'content-disposition': i.string().optional(),
    }),
    // Original todos
    todos: i.entity({
      text: i.string(),
      done: i.boolean(),
      createdAt: i.number(),
    }),
    // Custom agents
    agents: i.entity({
      name: i.string(),
      icon: i.string(),
      personality: i.string().optional(),
      expertise: i.string(),
      systemPrompt: i.string().optional(),
      color: i.string(),
      agentType: i.string(), // 'math', 'history', 'general', or custom
      isCustom: i.boolean(),
      avatarUrl: i.string().optional(),
      createdAt: i.number(),
    }),
    // Chat sessions
    chats: i.entity({
      title: i.string(),
      agentId: i.string(),
      agentType: i.string(),
      lastMessage: i.string().optional(),
      messageCount: i.number(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    // Chat messages
    messages: i.entity({
      chatId: i.string(),
      role: i.string(), // 'user' or 'assistant'
      content: i.string(),
      agentName: i.string().optional(),
      createdAt: i.number(),
    }),
  },
  links: {
    chatMessages: {
      forward: {
        on: 'messages',
        has: 'one',
        label: 'chat',
      },
      reverse: {
        on: 'chats',
        has: 'many',
        label: 'messages',
      },
    },
  },
  rooms: {
    todos: {
      presence: i.entity({}),
    },
  },
});

// Export types
export type Agent = InstaQLEntity<typeof schema, 'agents'>;
export type Chat = InstaQLEntity<typeof schema, 'chats'>;
export type Message = InstaQLEntity<typeof schema, 'messages'>;
export type Todo = InstaQLEntity<typeof schema, 'todos'>;

// Initialize and export db
export const db = init({ appId: APP_ID, schema });
