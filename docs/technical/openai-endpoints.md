# Insor.ai OpenAI-Compatible Endpoint Setup

The Insor mission-control desktop app can talk to any OpenAI-compatible API (OpenAI, Together, Groq, local servers). Configuration happens through Vite env vars so both the web preview and Tauri shell share the same client.

## 1. Configure Environment Variables

Copy the example file and add your credentials:

```bash
cd insor-app
cp .env.example .env
```

Edit `.env` with your values:

```env
VITE_OPENAI_BASE_URL=https://api.openai.com
VITE_OPENAI_API_KEY=sk-your-key
VITE_OPENAI_MODEL=gpt-4o-mini
```

Tips:
- Point `VITE_OPENAI_BASE_URL` to any server that implements the `/v1/chat/completions` contract.
- Keys live only on your machine; Tauri bundles fetches locally so nothing is proxied through 3rd parties.
- Restart `npm run dev` / `npm run tauri` after changing env vars so Vite reloads them.

## 2. How the Client Works

The React app now instantiates `aiClient` (`src/services/aiClient.ts`). It:
- Reads the env vars from `src/config/env.ts`.
- Issues POST requests to `{BASE_URL}/v1/chat/completions` with the configured model.
- Throws meaningful errors if credentials are missing or the API responds with an error body.

## 3. Wiring Into the UI

- Conversation data lives in the `WorkspaceProvider` (`src/core/workspace.tsx`).
- The assistant pane sends the current transcript + the new user message to `aiClient` and streams the reply back into the conversation log.
- Errors are injected into the log with the `system` author so they’re visible to the user.

That’s all that’s required for a working OpenAI-compatible hookup. Point the env vars at your preferred provider and the Insor shell will start responding with real AI output.
