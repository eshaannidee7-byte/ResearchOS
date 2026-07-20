// Optional: set this to your server-side LLM endpoint (for example, /api/outreach).
// The endpoint should accept POST JSON { recipient, connection, request, senderName, senderRole }
// and return JSON { draft: "..." }. Never put an API key in this browser file.
window.DISCOVERYAI_OUTREACH_ENDPOINT = '';
// Optional endpoint for project-specific research plans. It receives { field, idea }
// and returns { project: { question, hypotheses, design, protocol, sources, ... } }.
// `server.py` provides this endpoint at /api/research-plan when OPENAI_API_KEY is set.
// Local development default. This lets file:// previews use the AI server too.
// For deployment, change this to your deployed server's /api/research-plan URL.
window.DISCOVERYAI_IDEAS_ENDPOINT = 'http://localhost:8002/api/research-plan';
// Optional endpoint to return verified literature for a project brief as { sources: [{title, year, venue, url}] }.
window.DISCOVERYAI_SOURCES_ENDPOINT = '';
