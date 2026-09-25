interface OBSRequest {
  requestType: string;
  requestId?: string;
  requestData?: Record<string, any>;
}

interface OBSResponse {
  requestId: string;
  requestStatus: {
    result: boolean;
    code: number;
  };
  responseData?: Record<string, any>;
}

interface ServerMessage {
  messageType: string;
  messageData?: Record<string, any>;
  requestId?: string;
  requestStatus?: {
    result: boolean;
    code: number;
  };
  responseData?: Record<string, any>;
  d?: {
    requestType?: string;
    requestId?: string;
    requestData?: Record<string, any>;
  };
}

// Browser-compatible SHA-256 hash using WebCrypto API
async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
  return hashBase64;
}

export class OBSWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private password: string | null;
  private authenticated: boolean = false;
  private requestHandlers: Map<
    string,
    {
      resolve: (value: OBSResponse) => void;
      reject: (reason?: any) => void;
      timeout: number;
    }
  > = new Map();
  private readonly REQUEST_TIMEOUT = 5000;

  constructor(url: string, password?: string) {
    this.url = url;
    this.password = password || null;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = async () => {
          try {
            if (this.password) {
              await this.authenticate();
            }
            this.authenticated = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const data: ServerMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("[OBS] Message parse error:", error);
          }
        };

        this.ws.onerror = (error: Event) => {
          reject(new Error(`WebSocket error: ${error}`));
        };

        this.ws.onclose = () => {
          this.authenticated = false;
          this.ws = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private async authenticate(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not ready");
    }

    const response = await this.request("GetAuthRequired", {});
    const { challenge, salt } = response.responseData || {};

    if (!challenge || !salt || !this.password) {
      throw new Error("Authentication failed: missing auth data");
    }

    const hashSecret = await sha256Hash(this.password + salt);
    const authHash = await sha256Hash(hashSecret + challenge);

    await this.request("Authenticate", { auth: authHash });
  }

  private handleMessage(data: ServerMessage): void {
    const requestId = data.requestId || data.d?.requestId;

    if (requestId && this.requestHandlers.has(requestId)) {
      const handler = this.requestHandlers.get(requestId)!;
      clearTimeout(handler.timeout);
      this.requestHandlers.delete(requestId);

      if (data.requestStatus?.result) {
        handler.resolve(data as OBSResponse);
      } else {
        handler.reject(
          new Error(
            `OBS request failed: ${data.requestStatus?.code || "unknown error"}`
          )
        );
      }
    }
  }

  private request(
    requestType: string,
    requestData?: Record<string, any>
  ): Promise<OBSResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const requestId = `req_${Date.now()}_${Math.random()}`;

      const timeout = window.setTimeout(() => {
        this.requestHandlers.delete(requestId);
        reject(new Error("Request timeout"));
      }, this.REQUEST_TIMEOUT);

      this.requestHandlers.set(requestId, { resolve, reject, timeout });

      const message: OBSRequest = {
        requestType,
        requestId,
      };

      if (requestData) {
        message.requestData = requestData;
      }

      this.ws!.send(JSON.stringify(message));
    });
  }

  async saveReplayBuffer(): Promise<void> {
    const response = await this.request("SaveReplayBuffer", {});
    if (!response.requestStatus?.result) {
      throw new Error("Failed to save replay buffer");
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.authenticated = false;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
