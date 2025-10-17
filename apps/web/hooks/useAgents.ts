import { id } from '@instantdb/react';
import { db, Agent, Chat, Message } from '@/lib/instant';

// Default agents that come with the app
const DEFAULT_AGENTS = [
  {
    id: 'agent-math',
    name: 'Math Tutor',
    icon: 'calculator',
    expertise: 'Mathematics',
    agentType: 'math',
    color: 'blue',
    isCustom: false,
    avatarUrl: undefined,
    personality: 'Patient and encouraging, breaks down complex problems step-by-step',
    starterPrompts: [
      'What is 25 × 17?',
      'Help me solve this quadratic equation',
      'Explain the Pythagorean theorem'
    ],
  },
  {
    id: 'agent-history',
    name: 'History Tutor',
    icon: 'book',
    expertise: 'History',
    agentType: 'history',
    color: 'purple',
    isCustom: false,
    avatarUrl: undefined,
    personality: 'Engaging storyteller, makes historical events come alive',
    starterPrompts: [
      'When did sharks first appear?',
      'Tell me about the Renaissance',
      'What caused World War I?'
    ],
  },
];

export function useAgents() {
  const { data, isLoading, error } = db.useQuery({ agents: {} });

  const createAgent = async (agentData: {
    name: string;
    icon: string;
    personality?: string;
    expertise: string;
    systemPrompt?: string;
    color: string;
    agentType: string;
    avatarUrl?: string;
  }) => {
    const agentId = id();
    await db.transact(
      // @ts-ignore - InstantDB types issue
      db.tx.agents[agentId].update({
        ...agentData,
        isCustom: true,
        createdAt: Date.now(),
      })
    );
    return agentId;
  };

  const deleteAgent = async (agentId: string) => {
    // @ts-ignore - InstantDB types issue
    await db.transact(db.tx.agents[agentId].delete());
  };

  // Combine default agents with custom agents from DB
  const allAgents = [
    ...DEFAULT_AGENTS,
    ...(data?.agents || []),
  ];

  return {
    agents: allAgents,
    customAgents: data?.agents || [],
    isLoading,
    error,
    createAgent,
    deleteAgent,
  };
}

export function useChats(agentId?: string) {
  // Query all chats, we'll filter in the component if needed
  const { data, isLoading, error } = db.useQuery({ chats: {} });

  const createChat = async (chatData: {
    title: string;
    agentId: string;
    agentType: string;
  }) => {
    const chatId = id();
    // @ts-ignore - InstantDB types issue
    await db.transact(
      db.tx.chats[chatId].update({
        ...chatData,
        messageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    return chatId;
  };

  const updateChat = async (
    chatId: string,
    updates: {
      title?: string;
      lastMessage?: string;
      messageCount?: number;
    }
  ) => {
    // @ts-ignore - InstantDB types issue
    await db.transact(
      db.tx.chats[chatId].update({
        ...updates,
        updatedAt: Date.now(),
      })
    );
  };

  const deleteChat = async (chatId: string) => {
    // Just delete the chat - messages will be handled separately
    // @ts-ignore - InstantDB types issue
    await db.transact(db.tx.chats[chatId].delete());
  };

  // Filter chats by agentId if provided
  const filteredChats = agentId
    ? (data?.chats || []).filter((chat: Chat) => chat.agentId === agentId)
    : (data?.chats || []);

  return {
    chats: filteredChats,
    isLoading,
    error,
    createChat,
    updateChat,
    deleteChat,
  };
}

export function useMessages(chatId?: string) {
  const query = chatId
    ? { messages: { $: { where: { chatId } } } }
    : { messages: { $: { limit: 0 } } };

  const { data, isLoading, error } = db.useQuery(query);

  const addMessage = async (messageData: {
    chatId: string;
    role: 'user' | 'assistant';
    content: string;
    agentName?: string;
  }) => {
    const messageId = id();
    // @ts-ignore - InstantDB types issue
    await db.transact(
      db.tx.messages[messageId].update({
        ...messageData,
        createdAt: Date.now(),
      })
    );
    return messageId;
  };

  const messages = data?.messages || [];
  
  // Sort messages by creation time
  const sortedMessages = [...messages].sort(
    (a, b) => a.createdAt - b.createdAt
  );

  return {
    messages: sortedMessages,
    isLoading,
    error,
    addMessage,
  };
}
