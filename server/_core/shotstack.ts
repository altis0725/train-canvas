import { ENV } from "./env";

const SHOTSTACK_API_KEY = ENV.shotstackApiKey;
const SHOTSTACK_BASE_URL = "https://api.shotstack.io/stage"; // Use stage for sandbox

/**
 * Merge three template videos into one final video using Shotstack REST API
 * @param template1Url URL of the first template video
 * @param template2Url URL of the second template video
 * @param template3Url URL of the third template video
 * @returns Render ID for tracking the video generation status
 */
export async function mergeVideos(
  template1Url: string,
  template2Url: string,
  template3Url: string
): Promise<{ renderId: string }> {
  try {
    const renderPayload = {
      timeline: {
        background: "#000000",
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "video",
                  src: template1Url,
                },
                start: 0,
                length: 10,
              },
            ],
          },
          {
            clips: [
              {
                asset: {
                  type: "video",
                  src: template2Url,
                },
                start: 0,
                length: 10,
              },
            ],
          },
          {
            clips: [
              {
                asset: {
                  type: "video",
                  src: template3Url,
                },
                start: 0,
                length: 10,
              },
            ],
          },
        ],
      },
      output: {
        format: "mp4",
        resolution: "sd", // Use SD for faster rendering
      },
    };

    const response = await fetch(`${SHOTSTACK_BASE_URL}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SHOTSTACK_API_KEY,
      },
      body: JSON.stringify(renderPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shotstack render request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const renderId = data.response?.id;

    if (!renderId) {
      throw new Error("Failed to get render ID from Shotstack response");
    }

    console.log("[Shotstack] Render submitted successfully:", renderId);
    return { renderId };
  } catch (error) {
    console.error("[Shotstack] Failed to merge videos:", error);
    throw new Error(`Video merge failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check the status of a video render using Shotstack REST API
 * @param renderId The render ID returned from mergeVideos
 * @returns Render status and URL if completed
 */
export async function getRenderStatus(renderId: string): Promise<{
  status: "queued" | "fetching" | "rendering" | "saving" | "done" | "failed" | "preprocessing";
  url?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${SHOTSTACK_BASE_URL}/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": SHOTSTACK_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shotstack status request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const status = data.response?.status as any;
    const url = data.response?.url;
    const error = data.response?.error;

    return {
      status: status || "failed",
      url: url,
      error: error,
    };
  } catch (error) {
    console.error("[Shotstack] Failed to get render status:", error);
    throw new Error(`Failed to get render status: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Poll render status until completion or failure
 * @param renderId The render ID to poll
 * @param maxAttempts Maximum number of polling attempts (default: 60)
 * @param intervalMs Polling interval in milliseconds (default: 5000)
 * @returns Final render URL
 */
export async function waitForRender(
  renderId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getRenderStatus(renderId);

    if (status.status === "done" && status.url) {
      return status.url;
    }

    if (status.status === "failed") {
      throw new Error(`Render failed: ${status.error || "Unknown error"}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Render timeout: Maximum polling attempts reached");
}
