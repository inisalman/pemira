import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllVoteCounts } from '@/services/vote.service';

/**
 * GET /api/results/stream
 * Server-Sent Events endpoint for real-time vote counts.
 * Polls the database every 5 seconds and pushes updated vote counts.
 * Requires admin authentication.
 */
export async function GET(request: Request) {
  // Require admin authentication
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const counts = await getAllVoteCounts();
          const data = `data: ${JSON.stringify(counts)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // If database query fails, send an error event
          const errorData = `event: error\ndata: {"message":"Failed to fetch vote counts"}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      };

      // Send initial data immediately
      await sendUpdate();

      // Poll every 5 seconds for updates
      const interval = setInterval(sendUpdate, 5000);

      // Handle client disconnect via AbortSignal
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
