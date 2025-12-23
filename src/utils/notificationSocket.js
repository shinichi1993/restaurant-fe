// src/utils/notificationSocket.js
// ============================================================================
// notificationSocket.js – WebSocket / STOMP client cho THÔNG BÁO
// ----------------------------------------------------------------------------
// Chức năng:
//  - Kết nối WebSocket tới BE (/ws)
//  - Gửi JWT qua header Authorization
//  - Subscribe topic /topic/notification
//  - Nhận notification realtime để show toast + update badge
// ============================================================================

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Tạo STOMP client cho Notification realtime
 *
 * @param {function} onMessage callback nhận notification từ BE
 * @returns STOMP client instance
 */
export function createNotificationSocket(onMessage) {
  const token = localStorage.getItem("accessToken");
  const WS_BASE_URL = import.meta.env.VITE_WS_URL;

  const client = new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),

    connectHeaders: {
      Authorization: token ? `Bearer ${token}` : "",
    },

    reconnectDelay: 5000,

    onConnect: () => {
      client.subscribe("/topic/notification", (message) => {
        try {
          const payload = JSON.parse(message.body);
          onMessage(payload);
        } catch (e) {
          console.error("Không parse được notification realtime", e);
        }
      });
    },

    onStompError: (frame) => {
      console.error("STOMP error (notification)", frame);
    },
  });

  return client;
}
