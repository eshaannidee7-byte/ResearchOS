#!/bin/sh
# Starts ResearchOS with its server-side AI endpoint. Never place API keys in index.html.

RESEARCHOS_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
cd "$RESEARCHOS_DIR" || exit 1

if [ -z "$OPENAI_API_KEY" ]; then
  echo "OPENAI_API_KEY is missing. Run:"
  echo 'OPENAI_API_KEY="paste-your-real-key-here" sh start-ai-server.sh'
  exit 1
fi

case "$OPENAI_API_KEY" in
  *PASTE_YOUR_REAL*|*YOUR_REAL_KEY*|*your-key-here*|*paste-your-real-key*|sk-PASTE-*|sk-your-actual-key-*)
    echo "That is still the example text, not an OpenAI API key."
    echo "Copy a real key from https://platform.openai.com/api-keys, then run the command again."
    exit 1
    ;;
esac

# Prefer the bundled runtime: macOS may expose a python3 placeholder that only
# launches the Xcode Command Line Tools installer.
if [ -x "/Users/eshaan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3" ]; then
  RESEARCHOS_PYTHON="/Users/eshaan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
elif command -v python3 >/dev/null 2>&1; then
  RESEARCHOS_PYTHON="$(command -v python3)"
else
  echo "Python 3 was not found. Install Python 3, then run this command again."
  exit 1
fi

echo "Starting ResearchOS AI at http://localhost:${PORT:-8002}"
exec "$RESEARCHOS_PYTHON" server.py
