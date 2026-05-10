import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { OrgVoteCount } from '@/types';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
    this.readyState = 2;
  }

  // Test helpers
  simulateOpen() {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// Set up global EventSource mock
vi.stubGlobal('EventSource', MockEventSource);

describe('useVoteCountStore', () => {
  let useVoteCountStore: typeof import('./vote-count.store').useVoteCountStore;

  beforeEach(async () => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
    // Re-import to reset module-level state
    vi.resetModules();
    const mod = await import('./vote-count.store');
    useVoteCountStore = mod.useVoteCountStore;
  });

  afterEach(() => {
    useVoteCountStore.getState().disconnect();
    vi.useRealTimers();
  });

  it('should have initial state with empty voteCounts and disconnected', () => {
    const state = useVoteCountStore.getState();
    expect(state.voteCounts).toEqual([]);
    expect(state.isConnected).toBe(false);
  });

  it('should create EventSource on connect', () => {
    useVoteCountStore.getState().connect();
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/results/stream');
  });

  it('should set isConnected to true on open', () => {
    useVoteCountStore.getState().connect();
    MockEventSource.instances[0].simulateOpen();
    expect(useVoteCountStore.getState().isConnected).toBe(true);
  });

  it('should update voteCounts on message', () => {
    const mockData: OrgVoteCount[] = [
      {
        orgId: 'org-1',
        orgName: 'BEM',
        totalEligible: 100,
        totalVoted: 50,
        candidates: [
          { candidateId: 'c1', candidateName: 'Candidate A', count: 30 },
          { candidateId: 'c2', candidateName: 'Candidate B', count: 20 },
        ],
      },
    ];

    useVoteCountStore.getState().connect();
    MockEventSource.instances[0].simulateOpen();
    MockEventSource.instances[0].simulateMessage(mockData);

    expect(useVoteCountStore.getState().voteCounts).toEqual(mockData);
  });

  it('should not crash on malformed message data', () => {
    useVoteCountStore.getState().connect();
    MockEventSource.instances[0].simulateOpen();

    // Simulate a message with invalid JSON directly
    MockEventSource.instances[0].onmessage?.(
      new MessageEvent('message', { data: 'not valid json{' })
    );

    expect(useVoteCountStore.getState().voteCounts).toEqual([]);
  });

  it('should not create duplicate connections', () => {
    useVoteCountStore.getState().connect();
    useVoteCountStore.getState().connect();
    expect(MockEventSource.instances).toHaveLength(1);
  });

  it('should close EventSource on disconnect', () => {
    useVoteCountStore.getState().connect();
    const es = MockEventSource.instances[0];
    useVoteCountStore.getState().disconnect();
    expect(es.closed).toBe(true);
    expect(useVoteCountStore.getState().isConnected).toBe(false);
  });

  it('should auto-reconnect on error after delay', () => {
    useVoteCountStore.getState().connect();
    const firstEs = MockEventSource.instances[0];
    firstEs.simulateOpen();

    // Simulate error
    firstEs.simulateError();
    expect(useVoteCountStore.getState().isConnected).toBe(false);
    expect(firstEs.closed).toBe(true);

    // Should not reconnect immediately
    expect(MockEventSource.instances).toHaveLength(1);

    // Advance timer past reconnect delay
    vi.advanceTimersByTime(3000);

    // Should have created a new connection
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].url).toBe('/api/results/stream');
  });

  it('should cancel reconnect on disconnect', () => {
    useVoteCountStore.getState().connect();
    MockEventSource.instances[0].simulateOpen();
    MockEventSource.instances[0].simulateError();

    // Disconnect before reconnect fires
    useVoteCountStore.getState().disconnect();

    // Advance timer - should not reconnect
    vi.advanceTimersByTime(5000);
    expect(MockEventSource.instances).toHaveLength(1);
  });

  it('should update voteCounts with new data on subsequent messages', () => {
    const firstData: OrgVoteCount[] = [
      {
        orgId: 'org-1',
        orgName: 'BEM',
        totalEligible: 100,
        totalVoted: 10,
        candidates: [{ candidateId: 'c1', candidateName: 'A', count: 10 }],
      },
    ];

    const secondData: OrgVoteCount[] = [
      {
        orgId: 'org-1',
        orgName: 'BEM',
        totalEligible: 100,
        totalVoted: 25,
        candidates: [{ candidateId: 'c1', candidateName: 'A', count: 25 }],
      },
    ];

    useVoteCountStore.getState().connect();
    MockEventSource.instances[0].simulateOpen();
    MockEventSource.instances[0].simulateMessage(firstData);
    expect(useVoteCountStore.getState().voteCounts[0].totalVoted).toBe(10);

    MockEventSource.instances[0].simulateMessage(secondData);
    expect(useVoteCountStore.getState().voteCounts[0].totalVoted).toBe(25);
  });
});
