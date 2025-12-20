// src/utils/kitchenSocket.js
// ============================================================================
// kitchenSocket.js – WebSocket / STOMP client cho MÀN HÌNH BẾP
// ----------------------------------------------------------------------------
// Chức năng:
//  - Kết nối WebSocket tới BE (/ws)
//  - Gửi JWT qua header Authorization
//  - Subscribe topic /topic/kitchen
//  - Nhận dữ liệu realtime cho KitchenPage
//
// Lưu ý:
//  - File này CHỈ lo kết nối & subscribe
//  - KHÔNG xử lý state UI ở đây
// ============================================================================

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Tạo STOMP client cho Kitchen realtime
 *
 * @param {function} onMessage callback nhận payload realtime từ BE
 * @returns STOMP client instance
 */
export function createKitchenSocket(onMessage) {
  // Lấy JWT từ localStorage (đang dùng chung với REST)
  const token = localStorage.getItem("access_token");
  // Lấy domain của BE
  const WS_BASE_URL = import.meta.env.VITE_WS_URL;
  // Tạo STOMP client
  const client = new Client({
    // SockJS endpoint – PHẢI khớp với BE: registry.addEndpoint("/ws")
    webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),

    // Header gửi khi CONNECT (JWT)
    connectHeaders: {
      Authorization: token ? `Bearer ${token}` : "",
    },

    // Tự reconnect sau X ms nếu mất kết nối
    reconnectDelay: 5000,

    // Bật debug nếu cần (comment lại nếu log quá nhiều)
    // debug: (str) => console.log("[KITCHEN WS]", str),

    onConnect: () => {
      // Subscribe topic bếp
      client.subscribe("/topic/kitchen", (message) => {
        try {
          const payload = JSON.parse(message.body);
          onMessage(payload);
        } catch (e) {
          console.error("Không parse được message realtime từ kitchen", e);
        }
      });
    },

    onStompError: (frame) => {
      console.error("STOMP error", frame);
    },
  });

  return client;
}
