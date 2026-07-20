# ResearchOS

Open the app at `http://localhost:8000` while the local server is running.

## Real LLM project generation

The browser now calls `POST /api/research-plan` whenever it is served by the included AI server. The endpoint sends the student's problem to the model and returns a structured, project-specific question, hypotheses, evidence-search leads, literature-map nodes, and experiment protocol.

Keep the API key out of browser files. Start the included local server with it in the terminal environment:

```bash
OPENAI_API_KEY="paste-your-real-key-here" sh start-ai-server.sh
```

Then open [http://localhost:8002](http://localhost:8002). You can change the port with `PORT=8001` if that port is free. Without `OPENAI_API_KEY`, ResearchOS deliberately falls back to its local starter templates and displays no key in the website.

## Publish on GitHub and Render

1. Create a new empty GitHub repository, then upload every file in this folder **except** `.env` files or API keys. The included `.gitignore` protects common secret files.
2. On Render, create a **Web Service** from that GitHub repository. Render detects `render.yaml`; do not add a build command.
3. In the Render service’s Environment settings, add `OPENAI_API_KEY` as a secret. Never put it in `llm-config.js`, GitHub, or a client-side form.
4. Deploy. Render provides an `onrender.com` URL. Add a custom domain in the Render Dashboard, create the requested DNS record with your domain registrar, then verify it in Render.

For Google sign-in on the published site, add both the Render URL and your custom domain to the OAuth client’s **Authorized JavaScript origins**. The OAuth Client ID is public; the Client Secret is not.

## Real Google sign-in

The UI works in a local demo mode until OAuth credentials are configured. To enable real Google sign-in:

1. Create an OAuth 2.0 **Web application** client in Google Cloud Console.
2. Add `http://localhost:8000` as an Authorized JavaScript origin.
3. Paste its client ID into `auth-config.js`.

For deployment, use a server-side authentication provider or backend token verification before treating a browser session as authenticated.

## LLM-powered outreach

The app includes a strong local draft fallback. To use an actual LLM, set `DISCOVERYAI_OUTREACH_ENDPOINT` in `llm-config.js` to a server-side endpoint. That endpoint must receive the JSON fields documented in the file and return `{ "draft": "..." }`. Keep the provider API key on that server—never in this static browser app.
