import PusherJS from "pusher-js";

let client: PusherJS | null = null;

export function getPusherClient(): PusherJS {
  if (typeof window === "undefined") {
    throw new Error("Pusher client is only available in the browser");
  }
  if (!client) {
    client = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return client;
}
