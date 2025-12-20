import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Socket realtime cho POS Table
 */
export function createTableSocket(onMessage) {
  const token = localStorage.getItem("access_token");
  const WS_BASE_URL = import.meta.env.VITE_WS_URL;

  const client = new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
    connectHeaders: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    reconnectDelay: 5000,

    onConnect: () => {
      client.subscribe("/topic/tables", (message) => {
        try {
          const payload = JSON.parse(message.body);
          onMessage(payload);
        } catch (e) {
          console.error("Parse table socket error", e);
        }
      });
    },
  });

  return client;
}
