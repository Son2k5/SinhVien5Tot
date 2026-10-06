import { create } from 'zustand';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';
import { chatService } from '../services/chat.service';
import type { Message, ConversationSummary } from '../types/chat.types';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface ChatRealtimeStore {
  connectionState: ConnectionState;
  activeConversationId: string | null;
  setConnectionState: (state: ConnectionState) => void;
  setActiveConversationId: (id: string | null) => void;
}

export const useChatRealtimeStore = create<ChatRealtimeStore>((set) => ({
  connectionState: 'disconnected',
  activeConversationId: null,
  setConnectionState: (state) => set({ connectionState: state }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
}));

const API_BASE = import.meta.env.VITE_API_URL;
const HUB_URL = API_BASE ? API_BASE.replace('/api', '/hubs/chat') : '/hubs/chat';

export function useChatRealtime() {
  const queryClient = useQueryClient();
  const { connectionState, setConnectionState, activeConversationId } = useChatRealtimeStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getToken = () => useAuthStore.getState().token || '';

  const connectionRef = useRef<HubConnection | null>(null);

  // We need the latest activeConversationId in callbacks without stale closures
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
        setConnectionState('disconnected');
      }
      return;
    }

    if (connectionRef.current) return;

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getToken(),
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => {
      setConnectionState('reconnecting');
    });

    connection.onreconnected(() => {
      setConnectionState('connected');
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    });

    connection.onclose(() => {
      setConnectionState('disconnected');
    });

    connection.on('message:new', async (message: Message) => {
      const { conversationId, clientMessageId } = message;
      const isWindowFocused = document.hasFocus();
      const isActive = activeConversationIdRef.current === conversationId;

      // Update messages cache if it exists
      const queryKey = ['chat', 'messages', conversationId];
      const existingData = queryClient.getQueryData(queryKey);

      if (existingData) {
        queryClient.setQueryData<InfiniteData<{ items: Message[]; nextCursor: string | null; otherLastReadAt: string | null }>>(
          queryKey,
          (old) => {
            if (!old || !old.pages) return old;
            // dedupe by id or clientMessageId
            let found = false;
            const newPages = old.pages.map((page) => {
              const items = page.items.map((msg: Message) => {
                if (msg.id === message.id || (msg.clientMessageId && msg.clientMessageId === clientMessageId)) {
                  found = true;
                  return { ...msg, ...message, status: 'sent' as const };
                }
                return msg;
              });
              return { ...page, items };
            });

            if (!found) {
              newPages[0].items = [message, ...newPages[0].items];
            }

            return { ...old, pages: newPages };
          }
        );
      }

      // Update conversations cache (move to top, update preview, update unread)
      queryClient.setQueryData<InfiniteData<{ items: ConversationSummary[]; nextCursor: string | null }>>(
        ['chat', 'conversations'],
        (old) => {
          if (!old || !old.pages) return old;
          let convFound: ConversationSummary | null = null;
          const newPages = old.pages.map((page) => {
            const items = page.items.filter((conv) => {
              if (conv.id === conversationId) {
                convFound = conv;
                return false;
              }
              return true;
            });
            return { ...page, items };
          });

          if (convFound) {
            const currentConv: ConversationSummary = convFound;
            const shouldIncrementUnread = !(isActive && isWindowFocused);
            const updatedConv: ConversationSummary = {
              ...currentConv,
              lastMessagePreview: message.body,
              lastMessageAt: message.createdAt,
              unreadCount: shouldIncrementUnread ? currentConv.unreadCount + 1 : currentConv.unreadCount,
            };
            newPages[0].items = [updatedConv, ...newPages[0].items];
          } else {
            // If conversation is not in cache, we just invalidate
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
          }
          return { ...old, pages: newPages };
        }
      );

      // Mark read automatically if active and focused
      if (isActive && isWindowFocused) {
        chatService.markRead(conversationId).catch(console.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-total'] });
      }
    });

    connection.on('conversation:read', (data: { conversationId: string; readerUserId: string; readAt: string }) => {
      const { conversationId, readAt } = data;
      const queryKey = ['chat', 'messages', conversationId];
      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, otherLastReadAt: readAt };
      });
    });

    const startConnection = async () => {
      try {
        setConnectionState('connecting');
        await connection.start();
        setConnectionState('connected');
      } catch (err) {
        console.error('SignalR Connection Error: ', err);
        setConnectionState('disconnected');
      }
    };

    startConnection();

    return () => {
      connection.stop();
      connectionRef.current = null;
      setConnectionState('disconnected');
    };
  }, [isAuthenticated, queryClient, setConnectionState]);

  return connectionState;
}
