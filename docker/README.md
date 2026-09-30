# Docker preview (hybrid: Enji in container, Cursor Agent on the host)
#
# Cursor CLI stores login tokens in the macOS keychain, so the agent cannot
# authenticate inside a Linux container without `CURSOR_API_KEY`. The default
# workflow therefore keeps `agent` on the host and runs only the Enji preview
# host in Docker.
#
# ## One-shot slots demo
#
# ```sh
# # 1. Build the image (once)
# cd /path/to/enji
# docker build -f docker/Dockerfile -t enji:local .
#
# # 2. Scaffold the project on the host (fast; uses the local enji install)
# export PATH=/path/to/node/bin:$PATH
# enji() { node /path/to/enji/bin/enji.mjs "$@"; }
# enji init ../enji-demos/slots --3d
#
# # 3. Start the preview host in Docker (WATCH_POLL=1 for bind mounts)
# docker compose -f docker/compose.yml up --build -d
#
# # 4. One-sentence build on the host
# agent -p --force --trust --workspace ../enji-demos/slots \
#   'Follow AGENTS.md and docs from the enji package. Use enji host status /
#    logs / import / check. Build a playable 2D slots game…'
#
# # 5. Open the previewUrl printed by `enji host start` / `docker compose logs`
# ```
#
# Set `CURSOR_API_KEY` and install the Linux `agent` binary in the image if you
# want the agent inside the container instead.
