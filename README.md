# OBS Clipping Bot for Vencord

Creates clips from your Discord streams via OBS Studio Replay Buffer with **zero performance impact** — clips are saved at full resolution without dropping FPS.

## Features

- 🎬 **One-click clipping** during Discord screenshares/streams
- ⚡ **Zero performance overhead** — leverages OBS Replay Buffer (always-running memory buffer)
- 🎙️ **Chat-based triggers** — configure custom commands like `!clip` to trigger clipping
- 🔔 **Toast notifications** — receive feedback when clips are created
- 🔐 **Secure authentication** — supports OBS WebSocket authentication with SHA-256
- ⚙️ **Fully configurable** — adjust all settings through Vencord settings panel

## Installation

1. **Clone or download this repository** to your Vencord plugins directory:
   ```bash
   git clone https://github.com/kipu-dev/clipping-bot-vencord.git <vencord>/userplugins/obsClipping
   ```

2. **Install dependencies** (if needed):
   ```bash
   cd <vencord>/userplugins/obsClipping
   npm install
   ```

3. **Reload Vencord** or restart Discord

4. **Enable the plugin** in Vencord settings

## Configuration

### Step 1: Enable OBS WebSocket Server

1. Open **OBS Studio**
2. Go to **Tools** → **WebSocket Server Settings**
3. Enable the WebSocket server
4. Note the connection details:
   - Default URL: `ws://127.0.0.1:4455`
   - Optional: Set a password for security

### Step 2: Configure Vencord Plugin

1. Open Discord and go to **Vencord Settings**
2. Find **OBS Clipping Bot** plugin
3. Configure these settings:

| Setting | Description | Default |
|---------|-------------|---------|
| **OBS WebSocket URL** | WebSocket server address | `ws://127.0.0.1:4455` |
| **OBS Password** | Authentication password (leave empty if none) | — |
| **Enable Chat Trigger** | Allow chat messages to trigger clips | `false` |
| **Chat Command** | Command users can type to create clips | `!clip` |
| **Show Notifications** | Display toast when clip is created | `true` |

### Step 3: Enable Replay Buffer in OBS

1. In OBS, go to **Settings** → **Output**
2. Under **Recording**, ensure replay buffer is set up
3. Check "Enable Replay Buffer" if available in your OBS version
4. Set desired buffer size (default: 20 MB)

## Usage

### Method 1: Manual Trigger via UI
- While streaming, a clip button appears in your Discord stream controls
- Click to save the current replay buffer

### Method 2: Chat Command
1. Enable "Chat Trigger" in plugin settings
2. Type the configured command (default: `!clip`) in chat
3. The replay buffer is saved instantly

## Technical Details

### OBS WebSocket v5 Protocol
- Uses native browser WebSocket API
- SHA-256 authentication when password is set
- `SaveReplayBuffer` RPC call to trigger clip creation
- Automatic reconnection on disconnect

### Architecture
```
Vencord Plugin
    ↓
OBS WebSocket Client (TypeScript)
    ↓
OBS Studio WebSocket Server
    ↓
Replay Buffer → Saved Clip
```

## Troubleshooting

### "Failed to create clip: WebSocket error"
- Verify OBS is running and WebSocket server is enabled
- Check that the URL is correct (default: `ws://127.0.0.1:4455`)
- Ensure Discord can reach localhost (firewall issues)

### "Failed to create clip: Authentication failed"
- If OBS password is set, ensure it's correctly entered in plugin settings
- Verify OBS WebSocket password is correct

### No notification appears
- Check "Show Notifications" is enabled in plugin settings
- Verify Discord notifications are not disabled

### Plugin doesn't respond to chat commands
- Enable "Chat Trigger" in plugin settings
- Ensure you're typing the exact command (default: `!clip`)
- Commands are case-insensitive

## Advanced: Remote OBS

To use a remote OBS instance:

1. Set WebSocket URL to: `ws://<remote-ip>:4455`
2. Ensure network connectivity between Discord host and OBS
3. **Security Note**: Use VPN or SSH tunnel for remote connections

## Development

### Build from source
```bash
npm run build
```

### Watch mode
```bash
npm run dev
```

## License

MIT

## Credits

Created for seamless Discord stream clipping with OBS Studio
