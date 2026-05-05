#!/bin/bash
# ProphetAI — Setup launchd crons pe macOS
# Rulează O SINGURĂ DATĂ după ce ai configurat proiectul.
#
# Lecție din autorul original ProphetAI (Reddit):
# "Moved complex crons into launchctl crons outside of OC's control.
#  Blockages and problems went away immediately."
#
# Usage: bash setup_launchd.sh

set -e

USERNAME=$(whoami)
HOME_DIR=$HOME
PROJECT_DIR="$HOME_DIR/prophet-clone"
PLIST_DIR="$HOME_DIR/Library/LaunchAgents"
LOG_DIR="$PROJECT_DIR/logs"

echo "🚀 ProphetAI — launchd setup"
echo "   User: $USERNAME"
echo "   Project: $PROJECT_DIR"
echo ""

# ── Creare directoare ──
mkdir -p "$PLIST_DIR"
mkdir -p "$LOG_DIR"

# ── Funcție helper ──
write_plist() {
  local label=$1
  local script=$2
  local file="$PLIST_DIR/${label}.plist"

  cat > "$file" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd ${PROJECT_DIR}/agent && source .venv/bin/activate && python scripts/${script} >> ${LOG_DIR}/${script%.py}.log 2>&1</string>
  </array>
PLIST
  echo "$file"
}

# ── scan_odds — 6x/zi ──
SCAN_PLIST="$PLIST_DIR/com.prophetai.scan.plist"
cat > "$SCAN_PLIST" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.prophetai.scan</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd $PROJECT_DIR/agent && source .venv/bin/activate && python scripts/scan_odds.py >> $LOG_DIR/scan.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>11</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>17</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>20</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>23</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/scan.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/scan_err.log</string>
</dict>
</plist>
PLIST

# ── settle_bets — 4x/zi ──
cat > "$PLIST_DIR/com.prophetai.settle.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.prophetai.settle</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd $PROJECT_DIR/agent && source .venv/bin/activate && python scripts/settle_bets.py >> $LOG_DIR/settle.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>10</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>16</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>22</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/settle.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/settle_err.log</string>
</dict>
</plist>
PLIST

# ── write_diary — 1x/zi la 09:00 ──
cat > "$PLIST_DIR/com.prophetai.diary.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.prophetai.diary</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd $PROJECT_DIR/agent && source .venv/bin/activate && python scripts/write_diary.py >> $LOG_DIR/diary.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/diary.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/diary_err.log</string>
</dict>
</plist>
PLIST

# ── Activare ──
echo "Loading launchd agents..."

launchctl unload "$PLIST_DIR/com.prophetai.scan.plist"   2>/dev/null || true
launchctl unload "$PLIST_DIR/com.prophetai.settle.plist" 2>/dev/null || true
launchctl unload "$PLIST_DIR/com.prophetai.diary.plist"  2>/dev/null || true

launchctl load "$PLIST_DIR/com.prophetai.scan.plist"
launchctl load "$PLIST_DIR/com.prophetai.settle.plist"
launchctl load "$PLIST_DIR/com.prophetai.diary.plist"

echo ""
echo "✅ launchd agents active:"
launchctl list | grep prophetai

echo ""
echo "📁 Logs vor apărea în: $LOG_DIR"
echo ""
echo "Comenzi utile:"
echo "  tail -f $LOG_DIR/scan.log      # urmărește scan-urile live"
echo "  tail -f $LOG_DIR/settle.log    # urmărește settlement-urile"
echo "  launchctl list | grep prophetai  # verifică statusul"
echo ""
echo "Test manual (înainte de primul cron automat):"
echo "  cd $PROJECT_DIR/agent && source .venv/bin/activate"
echo "  python scripts/scan_odds.py"
echo "  python scripts/settle_bets.py"
