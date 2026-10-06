export interface ConversationSummary {
  id: string;
  type: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    roleLabel: string;
    unitLabel: string | null;
  };
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  clientMessageId: string;
  applicationRefId: string | null;
  status?: 'sending' | 'sent' | 'failed';
  errorMessage?: string;
}

export type UiMessage = Message & {
  status?: 'sending' | 'failed' | 'sent';
  errorMessage?: string;
};

export interface Contact {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  roleLabel: string;
  unitLabel: string | null;
  existingConversationId: string | null;
  reason: string | null;
}
