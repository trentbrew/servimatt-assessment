'use client';

import * as React from 'react';
import {
  ArchiveX,
  Command,
  File,
  Inbox,
  Send,
  Trash2,
  MessageSquare,
  Plus,
  Bot,
  Sparkles,
  Brain,
  BookOpen,
  Calculator,
  Palette,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';

import { NavUser } from '@/components/nav-user';
import { CreateAgentModal, CustomAgent } from '@/components/create-agent-modal';
import { useAgents, useChats } from '@/hooks/useAgents';
import { db } from '@/lib/instant';
import { Label } from '@workspace/ui/components/label';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@workspace/ui/components/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import { Switch } from '@workspace/ui/components/switch';

// Chat thread data structure
export interface ChatThread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  agentType: 'math' | 'history' | 'general' | string;
  messageCount: number;
}

// Icon mapping for custom agents
const ICON_MAP: Record<string, any> = {
  bot: Bot,
  sparkles: Sparkles,
  brain: Brain,
  book: BookOpen,
  calculator: Calculator,
  palette: Palette,
};

// Component to display avatar from file ID
function AvatarWithFile({
  fileId,
  fallbackIcon,
}: {
  fileId: string;
  fallbackIcon: any;
}) {
  const { data } = db.useQuery({
    $files: {
      $: { where: { id: fileId } },
    },
  });

  const fileUrl = data?.$files?.[0]?.url;
  const FallbackIcon = fallbackIcon;

  return (
    <Avatar className="w-5 h-5">
      {fileUrl && (
        <AvatarImage
          src={fileUrl}
          alt="Agent avatar"
          className="object-cover"
        />
      )}
      <AvatarFallback className="w-5 h-5">
        <FallbackIcon className="w-3 h-3" />
      </AvatarFallback>
    </Avatar>
  );
}

// This is sample data
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: 'https://github.com/shadcn.png',
  },
  navMain: [
    {
      title: 'All Chats',
      url: '#',
      icon: MessageSquare,
      isActive: true,
    },
    {
      title: 'Math Tutor',
      url: '#',
      icon: File,
      isActive: false,
    },
    {
      title: 'History Tutor',
      url: '#',
      icon: Send,
      isActive: false,
    },
    {
      title: 'Archived',
      url: '#',
      icon: ArchiveX,
      isActive: false,
    },
  ],
  threads: [
    {
      id: 'thread-1',
      title: 'Math Homework Help',
      lastMessage: 'What is 25 × 17?',
      timestamp: '2 min ago',
      agentType: 'math' as const,
      messageCount: 5,
    },
    {
      id: 'thread-2',
      title: 'World War II Questions',
      lastMessage: 'When did sharks first appear?',
      timestamp: '15 min ago',
      agentType: 'history' as const,
      messageCount: 8,
    },
    {
      id: 'thread-3',
      title: 'Algebra Practice',
      lastMessage: 'Can you help me solve this equation?',
      timestamp: '1 hour ago',
      agentType: 'math' as const,
      messageCount: 12,
    },
    {
      id: 'thread-4',
      title: 'Ancient Rome Study',
      lastMessage: 'Tell me about Julius Caesar',
      timestamp: '2 hours ago',
      agentType: 'history' as const,
      messageCount: 6,
    },
    {
      id: 'thread-5',
      title: 'Geometry Problems',
      lastMessage: 'Calculate the area of a circle',
      timestamp: 'Yesterday',
      agentType: 'math' as const,
      messageCount: 4,
    },
    {
      id: 'thread-6',
      title: 'Renaissance Period',
      lastMessage: 'Who were the key figures?',
      timestamp: 'Yesterday',
      agentType: 'history' as const,
      messageCount: 9,
    },
    {
      id: 'thread-7',
      title: 'Calculus Help',
      lastMessage: 'Explain derivatives',
      timestamp: '2 days ago',
      agentType: 'math' as const,
      messageCount: 15,
    },
    {
      id: 'thread-8',
      title: 'American Revolution',
      lastMessage: 'What caused the war?',
      timestamp: '3 days ago',
      agentType: 'history' as const,
      messageCount: 7,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onThreadSelect?: (thread: ChatThread) => void;
  onAgentSelect?: (agent: any) => void;
}

export function AppSidebar({
  onThreadSelect,
  onAgentSelect,
  ...props
}: AppSidebarProps) {
  const [activeItem, setActiveItem] = React.useState<any>(null);
  const [selectedThread, setSelectedThread] = React.useState<ChatThread | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [editingThreadId, setEditingThreadId] = React.useState<string | null>(
    null,
  );
  const [editingTitle, setEditingTitle] = React.useState('');
  const { setOpen } = useSidebar();

  // Get agents and chats from InstantDB
  const { agents, createAgent: createAgentInDB } = useAgents();
  const { chats, createChat, updateChat, deleteChat } = useChats(
    activeItem?.agentId,
  );

  // Set initial active item
  React.useEffect(() => {
    if (!activeItem && agents.length > 0) {
      setActiveItem({
        title: 'All Chats',
        agentId: undefined,
        agentType: 'all',
      });
    }
  }, [agents, activeItem]);

  const handleCreateAgent = async (agent: CustomAgent) => {
    await createAgentInDB({
      name: agent.name,
      icon: agent.icon,
      personality: agent.personality,
      expertise: agent.expertise,
      systemPrompt: agent.systemPrompt,
      color: agent.color,
      agentType: agent.id,
      avatarUrl: agent.avatarUrl,
    });
  };

  const handleNewChat = async () => {
    if (!activeItem) return;

    const chatTitle = `New ${activeItem.title} Chat`;
    const chatId = await createChat({
      title: chatTitle,
      agentId: activeItem.agentId || 'all',
      agentType: activeItem.agentType || 'general',
    });

    // Select the new chat
    const newChat: ChatThread = {
      id: chatId,
      title: chatTitle,
      lastMessage: '',
      timestamp: 'Just now',
      agentType: activeItem.agentType || 'general',
      messageCount: 0,
    };
    setSelectedThread(newChat);
    onThreadSelect?.(newChat);
  };

  // Build nav items from agents
  const allNavItems = React.useMemo(() => {
    const defaultItems = [
      {
        title: 'All Chats',
        url: '#',
        icon: MessageSquare,
        isActive: false,
        agentId: undefined,
        agentType: 'all',
        avatarUrl: undefined,
      },
    ];

    const agentItems = agents.map((agent) => ({
      title: agent.name,
      url: '#',
      icon: ICON_MAP[agent.icon] || Bot,
      isActive: false,
      isCustom: agent.isCustom,
      agentId: agent.id,
      agentType: agent.agentType,
      color: agent.color,
      avatarUrl: agent.avatarUrl,
    }));

    return [...defaultItems, ...agentItems];
  }, [agents]);

  // Convert DB chats to ChatThread format
  const threads = React.useMemo(() => {
    return chats
      .sort((a, b) => b.updatedAt - a.updatedAt) // Sort newest first
      .map((chat) => ({
        id: chat.id,
        title: chat.title,
        lastMessage: chat.lastMessage || '',
        timestamp: formatTimestamp(chat.updatedAt),
        agentType: chat.agentType,
        messageCount: chat.messageCount,
      }));
  }, [chats]);

  function formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        {/* <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader> */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {allNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={async () => {
                        setActiveItem(item);
                        onAgentSelect?.(item);

                        // Auto-select the newest chat for this agent OR create one if none exist
                        const agentChats = chats.filter(
                          (chat) => chat.agentId === item.agentId,
                        );
                        if (agentChats.length > 0) {
                          // Sort by timestamp/createdAt and select newest
                          const sortedChats = agentChats.sort(
                            (a, b) => b.createdAt - a.createdAt,
                          );
                          const newestChat = sortedChats[0];
                          if (newestChat) {
                            setSelectedThread({
                              id: newestChat.id,
                              title: newestChat.title || 'Untitled Chat',
                              agentType: item.agentType,
                              lastMessage: newestChat.lastMessage || '',
                              timestamp: new Date(
                                newestChat.createdAt,
                              ).toLocaleDateString(),
                              messageCount: newestChat.messageCount || 0,
                            });
                            onThreadSelect?.(newestChat as any);
                          }
                        } else {
                          // No chats exist - create one automatically (if agent has ID)
                          if (item.agentId) {
                            const newChatId = await createChat({
                              agentId: item.agentId,
                              title: `New ${item.title} Chat`,
                              agentType: item.agentType,
                            });

                            const newThread = {
                              id: newChatId,
                              title: `New ${item.title} Chat`,
                              agentType: item.agentType,
                              lastMessage: '',
                              timestamp: 'Just now',
                              messageCount: 0,
                            };

                            setSelectedThread(newThread);
                            onThreadSelect?.(newThread);
                          } else {
                            // For "All Chats" or items without agentId, just clear selection
                            setSelectedThread(null);
                          }
                        }
                        setOpen(true);
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      {item.avatarUrl ? (
                        <AvatarWithFile
                          fileId={item.avatarUrl}
                          fallbackIcon={item.icon}
                        />
                      ) : (
                        <item.icon />
                      )}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {/* Add Agent Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{
                      children: 'Create Custom Agent',
                      hidden: false,
                    }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-2.5 md:px-2 border-t mt-2 pt-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Agent</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {/* <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter> */}
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            {threads.length} {threads.length === 1 ? 'chat' : 'chats'}
          </div>
          <SidebarInput placeholder="Search chats..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`group relative hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 w-full max-w-full transition-colors overflow-hidden ${
                    selectedThread?.id === thread.id ? 'bg-sidebar-accent' : ''
                  }`}
                >
                  <div
                    onClick={() => {
                      if (editingThreadId !== thread.id) {
                        setSelectedThread(thread);
                        onThreadSelect?.(thread);
                      }
                    }}
                    className="w-full cursor-pointer min-w-0"
                  >
                    <div className="flex w-full items-center gap-2 min-w-0">
                      {editingThreadId === thread.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={async () => {
                            if (editingTitle.trim()) {
                              await updateChat(thread.id, {
                                title: editingTitle.trim(),
                              });
                            }
                            setEditingThreadId(null);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              if (editingTitle.trim()) {
                                await updateChat(thread.id, {
                                  title: editingTitle.trim(),
                                });
                              }
                              setEditingThreadId(null);
                            } else if (e.key === 'Escape') {
                              setEditingThreadId(null);
                            }
                          }}
                          autoFocus
                          className="font-medium bg-transparent border-none outline-none focus:outline-none flex-1 min-w-0 text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="font-medium flex-1 truncate min-w-0">
                          {thread.title}
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingThreadId(thread.id);
                            setEditingTitle(thread.title);
                          }}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${thread.title}"?`)) {
                              await deleteChat(thread.id);
                              if (selectedThread?.id === thread.id) {
                                setSelectedThread(null);
                              }
                            }
                          }}
                          className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {thread.timestamp}
                      </span>
                    </div>
                    <span className="line-clamp-1 text-xs text-muted-foreground mt-1 w-full overflow-hidden">
                      {thread.lastMessage}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                        {thread.agentType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {thread.messageCount} messages
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <CreateAgentModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateAgent={handleCreateAgent}
      />
    </Sidebar>
  );
}
