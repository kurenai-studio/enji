#!/bin/sh
set -eu

export WATCH_POLL="${WATCH_POLL:-1}"
export WATCH_POLL_MS="${WATCH_POLL_MS:-1000}"
export PATH="/enji/bin:${PATH}"

enji() { node /enji/bin/enji.mjs "$@"; }

if [ "$#" -eq 0 ]; then
  set -- host start --project .
fi

case "$1" in
  init|host|import|check|logs|asset|context|publish|--help|-h|--version|-v)
    exec node /enji/bin/enji.mjs "$@"
    ;;
  *)
    exec "$@"
    ;;
esac
