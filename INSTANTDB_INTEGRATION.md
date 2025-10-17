# InstantDB Integration - Chat Sessions & Custom Agents

## Overview
The application now uses InstantDB to persist custom agents, chat sessions, and messages. Each agent can have multiple chats, and new agents start with 0 chats.

## Database Schema

### Entities

#### `agents`
- `name`: string - Agent display name
- `icon`: string - Icon identifier (bot, sparkles, brain, book, calculator, palette)
- `personality`: string (optional) - Personality description
- `expertise`: string - Area of expertise
- `systemPrompt`: string (optional) - Custom AI instructions
- `color`: string - Theme color
- `agentType`: string - Type identifier (math, history, general, or custom)
- `isCustom`: boolean - Whether this is a user-created agent
- `createdAt`: number - Timestamp

#### `chats`
- `title`: string - Chat session title
- `agentId`: string - Associated agent ID
- `agentType`: string - Agent type for filtering
- `lastMessage`: string (optional) - Preview of last message
- `messageCount`: number - Total messages in chat
- `createdAt`: number - Timestamp
- `updatedAt`: number - Last activity timestamp

#### `messages`
- `chatId`: string - Associated chat ID
- `role`: string - 'user' or 'assistant'
- `content`: string - Message text
- `agentName`: string (optional) - Name of agent that responded
- `createdAt`: number - Timestamp

## Key Features

### 1. Custom Agent Creation
- Users can create custom agents via the "+ New Agent" button
- Agents are saved to InstantDB (not localStorage)
- Each new agent starts with 0 chats
- Agents appear in the sidebar icon rail

### 2. Chat Management
- **New Chat Button**: Located in the sidebar header (next to agent name)
- Creates a new chat session for the currently selected agent
- Automatically opens the new chat
- Each chat is associated with a specific agent

### 3. Message Persistence
- All messages are saved to InstantDB in real-time
- Messages are linked to their parent chat
- Chat metadata (lastMessage, messageCount) updates automatically
- Messages persist across sessions

### 4. Agent Filtering
- Clicking an agent in the icon rail filters chats to show only that agent's chats
- "All Chats" shows chats from all agents
- New agents show an empty chat list until a chat is created

## File Structure

```
apps/web/
├── lib/
│   └── instant.ts              # InstantDB configuration & schema
├── hooks/
│   └── useAgents.ts            # Hooks for agents, chats, and messages
├── components/
│   ├── app-sidebar.tsx         # Updated to use InstantDB
│   ├── AgentChat.tsx           # Updated to save messages to DB
│   └── CreateAgentModal.tsx    # Custom agent creation form
└── app/
    └── dashboard/
        └── page.tsx            # Main dashboard with chat interface
```

## Usage Flow

### Creating a Custom Agent
1. Click "+ New Agent" in the icon rail
2. Fill out the form (name, expertise, icon, color, etc.)
3. Click "Create Agent"
4. Agent appears in sidebar with 0 chats

### Starting a New Chat
1. Select an agent from the icon rail
2. Click the "+ New" button in the sidebar header
3. New chat appears in the chat list and opens automatically
4. Start messaging!

### Chatting
1. Select a chat from the sidebar
2. Type a message and press Enter or click Send
3. Message is saved to InstantDB
4. AI response is fetched and saved
5. Chat metadata updates (lastMessage, messageCount, updatedAt)

## Default Agents

The system includes two built-in agents:
- **Math Tutor** (calculator icon, blue)
- **History Tutor** (book icon, purple)

These are defined in `useAgents.ts` and combined with custom agents from the database.

## Data Flow

```
User Action → Component → Hook → InstantDB
                ↓
            Real-time Update
                ↓
        UI Re-renders with New Data
```

### Example: Sending a Message
1. User types message in `AgentChat`
2. `handleSubmit` calls `addMessage()` hook
3. Hook uses `db.transact()` to save to InstantDB
4. InstantDB triggers real-time update
5. `useMessages()` hook receives new data
6. Component re-renders with new message

## API Integration

The chat still calls `/api/agent` for AI responses:
- User message is saved to DB first
- API is called with the message
- AI response is saved to DB
- Chat metadata is updated

## Benefits

✅ **Persistent Data**: All chats and messages survive page refreshes  
✅ **Real-time Updates**: InstantDB provides instant synchronization  
✅ **Agent-Specific Chats**: Each agent maintains its own chat history  
✅ **Scalable**: Can handle unlimited agents and chats  
✅ **Clean Architecture**: Hooks abstract database operations  

## Future Enhancements

- [ ] Edit/delete custom agents
- [ ] Delete individual chats
- [ ] Search across all chats
- [ ] Export chat history
- [ ] Share chats with other users
- [ ] Agent-specific system prompts actually used in API calls
- [ ] Message reactions/favorites
- [ ] Chat folders/organization
