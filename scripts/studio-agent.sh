#!/bin/bash
# Keeps Newsletter Studio (scripts/newsletter-studio.mjs, http://localhost:4848)
# running as a macOS LaunchAgent, independent of any terminal or Claude preview
# pane: it starts at login and restarts if it ever exits. Also builds a
# clickable "Newsletter Studio" app (Dock / Spotlight) that wakes the agent if
# needed and opens the studio.
#
#   scripts/studio-agent.sh install    # LaunchAgent + ~/Applications/Newsletter Studio.app
#   scripts/studio-agent.sh open       # what the app runs: ensure up, open the browser
#   scripts/studio-agent.sh restart    # pick up a changed newsletter-studio.mjs
#   scripts/studio-agent.sh status
#   scripts/studio-agent.sh uninstall
set -euo pipefail

LABEL="com.alexcoulombepresents.newsletter-studio"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
APP="$HOME/Applications/Newsletter Studio.app"
LOG="$HOME/Library/Logs/newsletter-studio.log"
URL="http://localhost:${STUDIO_PORT:-4848}"
DOMAIN="gui/$(id -u)"

up() { curl -sf -o /dev/null --max-time 2 "$URL/"; }

wait_up() {
  for _ in $(seq 1 30); do up && return 0; sleep 0.5; done
  echo "Newsletter Studio didn't answer at $URL — see $LOG" >&2
  return 1
}

case "${1:-}" in
  install)
    NODE="$(command -v node)" || { echo "node not found on PATH" >&2; exit 1; }
    mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")" "$HOME/Applications"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>$NODE</string><string>$REPO/scripts/newsletter-studio.mjs</string></array>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$(dirname "$NODE"):/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict></plist>
EOF
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootstrap "$DOMAIN" "$PLIST"
    rm -rf "$APP"
    osacompile -o "$APP" -e "do shell script quoted form of \"$REPO/scripts/studio-agent.sh\" & \" open\""
    wait_up && echo "Running at $URL (LaunchAgent $LABEL). App: $APP"
    ;;
  open)
    if ! up; then launchctl kickstart "$DOMAIN/$LABEL" 2>/dev/null || true; wait_up; fi
    open "$URL"
    ;;
  restart)
    launchctl kickstart -k "$DOMAIN/$LABEL"
    wait_up && echo "Restarted: $URL"
    ;;
  status)
    launchctl print "$DOMAIN/$LABEL" 2>/dev/null | grep -E "^\s+(state|pid|last exit code)" || echo "LaunchAgent not loaded"
    up && echo "Answering at $URL" || echo "Not answering at $URL"
    ;;
  uninstall)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    rm -rf "$APP"
    echo "Removed $LABEL and $APP"
    ;;
  *)
    sed -n '2,13p' "$0"
    exit 2
    ;;
esac
