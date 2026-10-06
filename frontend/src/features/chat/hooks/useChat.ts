import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import type { ConversationSummary, Message, UiMessage } from '../types/chat.types';
import { useDebounce } from '../../../hooks/useDebounce';
import { useChatRealtimeStore } from './useChatRealtime';

export type { UiMessage };

export const useConversations = () => {
  return useInfiniteQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: ({ pageParam }) => chatService.getConversations(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });
};

export const useMessages = (conversationId: string) => {
  return useInfiniteQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: ({ pageParam }) => chatService.getMessages(conversationId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { conversationId: string; body: string; clientMessageId?: string; applicationRefId?: string }) => {
      const clientMessageId = data.clientMessageId || crypto.randomUUID();
      return chatService.sendMessage(data.conversationId, {
        clientMessageId,
        body: data.body,
        applicationRefId: data.applicationRefId,
      });
    },
    onMutate: async (variables) => {
      const clientMessageId = variables.clientMessageId || crypto.randomUUID();
      variables.clientMessageId = clientMessageId;

      const queryKey = ['chat', 'messages', variables.conversationId];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData(queryKey);

      const optimisticMessage: UiMessage = {
        id: clientMessageId,
        conversationId: variables.conversationId,
        senderUserId: '',
        body: variables.body,
        createdAt: new Date().toISOString(),
        clientMessageId,
        applicationRefId: variables.applicationRefId || null,
        status: 'sending',
      };

      queryClient.setQueryData<InfiniteData<{ items: Message[]; nextCursor: string | null; otherLastReadAt: string | null }>>(
        queryKey,
        (old) => {
          if (!old || !old.pages || old.pages.length === 0) return old;
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            items: [optimisticMessage, ...newPages[0].items],
          };
          return { ...old, pages: newPages };
        }
      );

      return { previousMessages, clientMessageId, queryKey };
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<InfiniteData<{ items: Message[]; nextCursor: string | null; otherLastReadAt: string | null }>>(
        context.queryKey,
        (old) => {
          if (!old || !old.pages) return old;
          const newPages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((msg: UiMessage) =>
              msg.clientMessageId === context.clientMessageId ? { ...data, status: 'sent' as const } : msg
            ),
          }));
          return { ...old, pages: newPages };
        }
      );

      // also update conversation preview
      queryClient.setQueryData<InfiniteData<{ items: ConversationSummary[]; nextCursor: string | null }>>(
        ['chat', 'conversations'],
        (old) => {
          if (!old || !old.pages) return old;
          const newPages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((conv) => {
              if (conv.id === variables.conversationId) {
                return {
                  ...conv,
                  lastMessagePreview: data.body,
                  lastMessageAt: data.createdAt,
                };
              }
              return conv;
            }),
          }));
          return { ...old, pages: newPages };
        }
      );
    },
    onError: (err: unknown, _variables, context) => {
      if (context?.queryKey && context?.clientMessageId) {
        queryClient.setQueryData<InfiniteData<{ items: Message[]; nextCursor: string | null; otherLastReadAt: string | null }>>(
          context.queryKey,
          (old) => {
            if (!old || !old.pages) return old;
            const is429 = (err as { response?: { status?: number } })?.response?.status === 429;
            const errorMessage = is429 ? 'Bạn gửi quá nhanh, thử lại sau' : undefined;

            const newPages = old.pages.map((page) => ({
              ...page,
              items: page.items.map((msg: UiMessage) =>
                msg.clientMessageId === context.clientMessageId
                  ? { ...msg, status: 'failed' as const, errorMessage }
                  : msg
              ),
            }));
            return { ...old, pages: newPages };
          }
        );
      }
    },
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatService.markRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-total'] });
      queryClient.setQueryData<InfiniteData<{ items: ConversationSummary[]; nextCursor: string | null }>>(
        ['chat', 'conversations'],
        (old) => {
          if (!old || !old.pages) return old;
          const newPages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((conv) =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            ),
          }));
          return { ...old, pages: newPages };
        }
      );
    },
  });
};

export const useUnreadTotal = () => {
  const connectionState = useChatRealtimeStore((s) => s.connectionState);

  return useQuery({
    queryKey: ['chat', 'unread-total'],
    queryFn: () => chatService.getUnreadTotal(),
    refetchInterval: connectionState === 'connected' ? false : 60000,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  });
};

export const useChatSearch = (q: string, scope: 'All' | 'Students' | 'Staff') => {
  const debouncedQ = useDebounce(q, 300);
  const enabled = debouncedQ.trim().length >= 2;

  return useQuery({
    queryKey: ['chat', 'search', { q: debouncedQ, scope }],
    queryFn: ({ signal }) => chatService.searchContacts(debouncedQ, scope, 10, signal),
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 60000,
  });
};

export const useSuggestedContacts = () => {
  return useQuery({
    queryKey: ['chat', 'suggested'],
    queryFn: () => chatService.getSuggestedContacts(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useStartConversation = () => {
  return useMutation({
    mutationFn: (targetUserId: string) => chatService.startConversation(targetUserId),
  });
};

export const useStartSupport = () => {
  return useMutation({
    mutationFn: (applicationId?: string) => chatService.startSupport(applicationId),
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => chatService.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => chatService.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};
