import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import type {
  Contact,
  ConversationSummary,
  Message,
} from '../types/chat.types';

export const chatService = {
  getConversations: async (
    cursor?: string,
    pageSize = 20
  ): Promise<{ items: ConversationSummary[]; nextCursor: string | null }> => {
    const { data } = await axiosClient.get<{ items: ConversationSummary[]; nextCursor: string | null }>(
      ENDPOINTS.CHAT.CONVERSATIONS,
      { params: { cursor, pageSize } }
    );
    return data;
  },

  getMessages: async (
    conversationId: string,
    cursor?: string,
    pageSize = 30
  ): Promise<{ items: Message[]; nextCursor: string | null; otherLastReadAt: string | null }> => {
    const { data } = await axiosClient.get<{
      items: Message[];
      nextCursor: string | null;
      otherLastReadAt: string | null;
    }>(ENDPOINTS.CHAT.MESSAGES(conversationId), { params: { cursor, pageSize } });
    return data;
  },

  startConversation: async (targetUserId: string): Promise<{ conversationId: string }> => {
    const { data } = await axiosClient.post<{ conversationId: string }>(
      ENDPOINTS.CHAT.CONVERSATIONS,
      { targetUserId }
    );
    return data;
  },

  startSupport: async (applicationId?: string): Promise<{ conversationId: string }> => {
    const { data } = await axiosClient.post<{ conversationId: string }>(
      ENDPOINTS.CHAT.SUPPORT,
      { applicationId }
    );
    return data;
  },

  sendMessage: async (
    conversationId: string,
    payload: { clientMessageId: string; body: string; applicationRefId?: string }
  ): Promise<Message> => {
    const { data } = await axiosClient.post<Message>(
      ENDPOINTS.CHAT.MESSAGES(conversationId),
      payload
    );
    return data;
  },

  markRead: async (conversationId: string): Promise<void> => {
    await axiosClient.post(ENDPOINTS.CHAT.READ(conversationId));
  },

  getUnreadTotal: async (): Promise<{ count: number }> => {
    const { data } = await axiosClient.get<{ count: number }>(ENDPOINTS.CHAT.UNREAD_TOTAL);
    return data;
  },

  searchContacts: async (
    q: string,
    scope: 'All' | 'Students' | 'Staff',
    limit = 10,
    signal?: AbortSignal
  ): Promise<Contact[]> => {
    const { data } = await axiosClient.get<Contact[]>(ENDPOINTS.CHAT.SEARCH, {
      params: { q, scope, limit },
      signal,
    });
    return data;
  },

  getSuggestedContacts: async (): Promise<Contact[]> => {
    const { data } = await axiosClient.get<Contact[]>(ENDPOINTS.CHAT.SUGGESTED_CONTACTS);
    return data;
  },

  blockUser: async (userId: string): Promise<void> => {
    await axiosClient.post(ENDPOINTS.CHAT.BLOCK(userId));
  },

  unblockUser: async (userId: string): Promise<void> => {
    await axiosClient.delete(ENDPOINTS.CHAT.BLOCK(userId));
  },
};

export default chatService;
