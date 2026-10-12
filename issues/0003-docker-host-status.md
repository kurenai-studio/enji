# Host status does not see a Docker-hosted preview

Status: open. Found 2026-09-30 while running Enji in Docker.

## Problem

`enji host start` inside a container writes `temp/enji-host.json` with the
**container** PID and `project: "/work"`. On the Mac host,
`enji host status --project <host-path>` then reports `running: false` because
that PID is not a process on the host, even though
`http://localhost:<port>/__enji/status` returns `ready: true`.

## Workaround

Drive a Docker-hosted preview through HTTP:

```sh
curl -s http://localhost:7460/__enji/status
curl -s 'http://localhost:7460/__enji/logs?errors=1'
```

Do not run a second `enji host start` on the host for the same project while
the container is serving it.

## Direction

- Prefer the HTTP status when `enji-host.json` exists but its PID is dead on
  this machine and `url` responds.
- Or write a `docker: true` / `pidNamespace` marker and teach the CLI to use
  `docker compose exec` / published URL.
- Document under `docker/README.md` (already notes the hybrid agent setup).
