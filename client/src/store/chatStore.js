// ─────────────────────────────────────────────────────────────────────────────
//  src/store/chatStore.js
//  Zustand store for real-time chat state (Phase 2 foundation)
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useChatStore = create(
  devtools(
    (set, get) => ({
      // ── State ───────────────────────────────────────────────────────────────

      /** Currently open conversation ID */
      activeConversationId: null,

      /** Map of conversationId → message[] */
      messagesByConversation: {},

      /** Map of conversationId → unread count */
      unreadCounts: {},

      /** List of all user conversations (for Inbox page) */
      conversations: [],

      // ── Actions ─────────────────────────────────────────────────────────────

      setActiveConversation: (conversationId) =>
        set({ activeConversationId: conversationId }),

      setConversations: (conversations) =>
        set({ conversations }),

      /**
       * Set all messages for a conversation (initial load)
       * @param {string} conversationId
       * @param {Array}  messages
       */
      setMessages: (conversationId, messages) =>
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: messages,
          },
        })),

      /**
       * Append a single new message (from socket or POST response)
       * @param {string} conversationId
       * @param {object} message
       */
      addMessage: (conversationId, message) =>
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [
              ...(state.messagesByConversation[conversationId] || []),
              message,
            ],
          },
        })),

      /**
       * Increment unread count for a conversation.
       * Called when a new socket message arrives for a conversation not currently open.
       */
      incrementUnread: (conversationId) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
          },
        })),

      /** Clear unread count when user opens a conversation */
      clearUnread: (conversationId) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
        })),

      /** Total unread messages (for Navbar badge) */
      totalUnread: () =>
        Object.values(get().unreadCounts).reduce((sum, n) => sum + n, 0),
    }),
    { name: 'chatStore' }
  )
);

export default useChatStore;
