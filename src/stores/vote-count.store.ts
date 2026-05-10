import { create } from 'zustand';
import type { OrgVoteCount } from '@/types';

interface VoteCountState {
  voteCounts: OrgVoteCount[];
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

let eventSource: EventSource | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

const RECONNECT_DELAY_MS = 3000;
const SSE_ENDPOINT = '/api/results/stream';

export const useVoteCountStore = create<VoteCountState>((set, get) => ({
  voteCounts: [],
  isConnected: false,

  connect: () => {
    // Avoid duplicate connections
    if (eventSource) {
      return;
    }

    const es = new EventSource(SSE_ENDPOINT);
    eventSource = es;

    es.onopen = () => {
      set({ isConnected: true });
    };

    es.onmessage = (event) => {
      try {
        const data: OrgVoteCount[] = JSON.parse(event.data);
        set({ voteCounts: data });
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      set({ isConnected: false });
      es.close();
      eventSource = null;

      // Auto-reconnect after delay
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        get().connect();
      }, RECONNECT_DELAY_MS);
    };
  },

  disconnect: () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    set({ isConnected: false });
  },
}));
