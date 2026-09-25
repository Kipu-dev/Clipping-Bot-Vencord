import definePlugin, { definePluginSettings, OptionType } from "@api/settings";
import { addPreSendListener } from "@api/MessageEvents";
import { showToast } from "@webpack/common";
import { OBSWebSocketClient } from "./obsWebSocket";

const settings = definePluginSettings({
  obsWebSocketUrl: {
    type: OptionType.STRING,
    default: "ws://127.0.0.1:4455",
    description: "OBS WebSocket Server URL",
  },
  obsPassword: {
    type: OptionType.STRING,
    default: "",
    description: "OBS WebSocket Password (leave empty if not required)",
  },
  chatTriggerEnabled: {
    type: OptionType.BOOLEAN,
    default: false,
    description: "Enable chat trigger for clipping (!clip command)",
  },
  chatTriggerCommand: {
    type: OptionType.STRING,
    default: "!clip",
    description: "Chat command to trigger clip creation",
  },
  notifyOnClip: {
    type: OptionType.BOOLEAN,
    default: true,
    description: "Show toast notification when clip is created",
  },
});

let obsClient: OBSWebSocketClient | null = null;
let preSendListenerUnregister: (() => void) | null = null;

export default definePlugin({
  name: "OBS Clipping Bot",
  description: "Create clips from Discord streams via OBS Replay Buffer",
  version: "1.0.0",
  authors: [{ name: "Claude" }],
  settings,

  start() {
    obsClient = new OBSWebSocketClient(
      settings.store.obsWebSocketUrl,
      settings.store.obsPassword
    );

    if (settings.store.chatTriggerEnabled) {
      this.registerChatListener();
    }
  },

  stop() {
    if (obsClient) {
      obsClient.disconnect();
      obsClient = null;
    }

    if (preSendListenerUnregister) {
      preSendListenerUnregister();
      preSendListenerUnregister = null;
    }
  },

  registerChatListener() {
    if (preSendListenerUnregister) return;

    preSendListenerUnregister = addPreSendListener(
      (_channelId: string, messageData: any) => {
        const content = messageData.content || "";

        if (
          content
            .toLowerCase()
            .includes(settings.store.chatTriggerCommand.toLowerCase())
        ) {
          this.createClip().catch((err) => {
            console.error("[OBS Clipping] Chat trigger error:", err);
          });
        }
      }
    );
  },

  async createClip() {
    if (!obsClient) {
      throw new Error("OBS client not initialized");
    }

    try {
      if (!obsClient.isConnected()) {
        await obsClient.connect();
      }

      await obsClient.saveReplayBuffer();

      if (settings.store.notifyOnClip) {
        showToast({
          message: "📹 Clip created and saved to OBS Replay Buffer!",
          type: "success",
        });
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      console.error("[OBS Clipping] Error:", error);
      showToast({
        message: `❌ Failed to create clip: ${errorMsg}`,
        type: "danger",
      });
      throw error;
    }
  },
});
