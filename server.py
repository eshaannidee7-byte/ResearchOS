#!/usr/bin/env python3
"""Local ResearchOS server with a server-side OpenAI research-plan endpoint.

Run with:
  OPENAI_API_KEY="..." python3 server.py
Then open http://localhost:8002.
"""

import json
import os
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.6-luna")

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["projectTitle", "topic", "question", "outcome", "control", "gaps", "hypotheses", "nullHypothesis", "decisionRule", "sources", "design", "protocol"],
    "properties": {
        "projectTitle": {"type": "string"},
        "topic": {"type": "string"},
        "question": {"type": "string"},
        "outcome": {"type": "string"},
        "control": {"type": "string"},
        "gaps": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3},
        "hypotheses": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3},
        "nullHypothesis": {"type": "string"},
        "decisionRule": {"type": "string"},
        "sources": {
            "type": "array", "minItems": 6, "maxItems": 8,
            "items": {"type": "object", "additionalProperties": False, "required": ["type", "title", "query"], "properties": {"type": {"type": "string"}, "title": {"type": "string"}, "query": {"type": "string"}}}
        },
        "design": {
            "type": "object", "additionalProperties": False,
            "required": ["independent", "dependent", "controls", "replicates", "analysis", "quality"],
            "properties": {key: {"type": "string"} for key in ["independent", "dependent", "controls", "replicates", "analysis", "quality"]}
        },
        "protocol": {"type": "array", "items": {"type": "string"}, "minItems": 6, "maxItems": 6}
    }
}

SYSTEM_PROMPT = """You are ResearchOS, an expert science-fair research mentor. Turn a student's rough problem into a genuinely project-specific, feasible research plan. Output only the required JSON.

Rules:
- Never reuse generic phrases such as 'the primary outcome' or 'the pre-specified test condition' when a concrete variable can be proposed.
- Refine vague ideas into a concrete student-feasible project with named organism/material/dataset, intervention or exposure levels, measurement units, control, timeline, and analysis. Make it clear these are proposed design choices, not results.
- Write exactly three grammatical, testable, topic-specific hypotheses. Each must name the study system, independent variable, dependent variable, and comparison. Do not merely restate the question.
- Include a precise null hypothesis and a cautious decision rule. Do not make clinical, causal, or impact claims beyond the study design.
- Source entries are search leads, never invented paper citations. Include at least two primary-evidence search queries, one methods query, one systematic-review query, and one bias/limitation query.
- For human participants, propose only low-risk observational or approved minimal-risk work. Do not instruct sleep deprivation, medical treatment, hazardous behavior, or collecting sensitive data. State that prior science-fair approval and consent/assent are required.
- For plants, organisms, or materials, choose realistic, low-risk student-accessible options and control plausible confounders.
- Do not invent literature findings, prior results, sample sizes, approvals, or statistical significance.
"""


class ResearchOSHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/research-plan":
            self.send_json(404, {"error": "Not found"})
            return
        if not os.environ.get("OPENAI_API_KEY"):
            self.send_json(503, {"error": "ResearchOS AI is not configured. Start the server with OPENAI_API_KEY set."})
            return
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 20000)
            request_data = json.loads(self.rfile.read(length) or b"{}")
            field = str(request_data.get("field", "Interdisciplinary science"))[:160]
            idea = str(request_data.get("idea", ""))[:2000]
            if not idea.strip():
                self.send_json(400, {"error": "A project idea is required."})
                return
            api_request = {
                "model": MODEL,
                "input": [
                    {"role": "system", "content": [{"type": "input_text", "text": SYSTEM_PROMPT}]},
                    {"role": "user", "content": [{"type": "input_text", "text": "Field: " + field + "\nStudent's rough problem: " + idea}]}
                ],
                "text": {"format": {"type": "json_schema", "name": "research_plan", "strict": True, "schema": SCHEMA}}
            }
            raw = urllib.request.Request(
                "https://api.openai.com/v1/responses",
                data=json.dumps(api_request).encode("utf-8"),
                headers={"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"], "Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(raw, timeout=75) as response:
                result = json.loads(response.read())
            output = result.get("output_text", "")
            if not output:
                for item in result.get("output", []):
                    for content in item.get("content", []):
                        if content.get("type") == "output_text":
                            output += content.get("text", "")
            self.send_json(200, {"project": json.loads(output)})
        except urllib.error.HTTPError as error:
            self.send_json(error.code, {"error": "OpenAI request failed", "detail": error.read().decode("utf-8", "replace")[:800]})
        except Exception as error:
            self.send_json(500, {"error": "Could not generate the research plan", "detail": str(error)[:500]})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8002"))
    host = os.environ.get("HOST", "127.0.0.1")
    print(f"ResearchOS running at http://{host}:{port}")
    ThreadingHTTPServer((host, port), ResearchOSHandler).serve_forever()
