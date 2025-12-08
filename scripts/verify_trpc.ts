
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../server/routers';
import "dotenv/config";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuSWQiOiJ0ZXN0LXVzZXItaWQiLCJhcHBJZCI6InRyYWluLWNhbnZhcy1hcHAiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZXhwIjoxNzk2NzIwMTU4fQ.Wv3YpT4Z9SJKrDpCplsQDPkJFfHxvnMu_fu_6ZiUXP8";

async function main() {
    const trpc = createTRPCProxyClient<AppRouter>({
        links: [
            httpBatchLink({
                url: 'https://train-canvas-app-production.up.railway.app/api/trpc',
                transformer: superjson,
                headers: {
                    cookie: `app_session_id=${TOKEN}`
                }
            }),
        ],
    });

    console.log("Fetching auth.me...");
    const me = await trpc.auth.me.query();
    console.log('Me:', me);

    console.log("Fetching videos...");
    const videos = await trpc.videos.getUserVideos.query();
    console.log('Videos:', videos);
}
main().catch(console.error);
