#!/bin/bash
# cristi-bet — Setup launchd crons pe macOS
# Rulează O SINGURĂ DATĂ după ce ai configurat proiectul.
#
# Lecție din ProphetAI original (Reddit):
# "Moved complex crons into launchctl crons outside of OC's control.
#  Blockages and problems went away immediately."
#
# Usage: bash setup_launchd.sh

set -e

USERNAME=$(whoami)
HOME_DIR=$HOME
PROJECT_DIR="$HOME_DIR/Projects/Bet/cristi-bet"
PLIST_DIR="$HOME_DIR/Library/LaunchAgents"
LOG_DIR="$PROJECT_DIR/agent/logs"

echo "🚀 cristi-bet — launchd setup"
echo "   User: $USERNAME"
echo "   Project: $PROJECT_DIR"
echo ""

# ── Creare directoare ──
mkdir -p "$PLIST_DIR"
mkdir -p "$LOG_DIR"

# ── scan_odds — 6x/zi ──
cat > "$PLIST_DIR/com.cristibet.scan.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.cristibet.scan</string>
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
  <string>__LOG_DIR__/scan.log</string>
  <key>StandardErrorPath</key>
  <string>__LOG_DIR__/scan_err.log</string>
</dict>
</plist>
PLIST

# fixme — hardcoded path în plist above, just use env
sed -i '' "s|__LOG_DIR__|$LOG_DIR|g" "$PLIST_DIR/com.cristibet.scan.plist"

# ── settle_bets — 4x/zi ──
cat > "$PLIST_DIR/com.cristibet.settle.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.cristibet.settle</string>
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
  <string>__LOG_DIR__/settle.log</string>
  <key>StandardErrorPath</key>
  <string>__LOG_DIR__/settle_err.log</string>
</dict>
</plist>
PLIST

sed -i '' "s|__LOG_DIR__|$LOG_DIR|g" "$PLIST_DIR/com.cristibet.settle.plist"

# ── write_diary — 1x/zi la 09:00 ──
cat > "$PLIST_DIR/com.cristibet.diary.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.cristibet.diary</string>
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
  <string>__LOG_DIR__/diary.log</string>
  <key>StandardErrorPath</key>
  <string>__LOG_DIR__/diary_err.log</string>
</dict>
</plist>
PLIST

sed -i '' "s|__LOG_DIR__|$LOG_DIR|g" "$PLIST_DIR/com.cristibet.diary.plist"

# ── Activare ──
echo "Loading launchd agents..."

launchctl unload "$PLIST_DIR/com.cristibet.scan.plist"   2>/dev/null || true
launchctl unload "$PLIST_DIR/com.cristibet.settle.plist"  2>/dev/null || true
launchctl unload "$PLIST_DIR/com.cristibet.diary.plist"   2>/dev/null || true

launchctl load   "$PLIST_DIR/com.cristibet.scan.plist"
launchctl load   "$PLIST_DIR/com.cristibet.settle.plist"
launchctl load   "$PLIST_DIR/com.cristibet.diary.plist"

echo ""
echo "✅ launchd agents active:"
launchctl list | grep cristibet

echo ""
echo "📁 Logs: $LOG_DIR/"
echo ""
echo "Test manual (după configurare .env.local):"
echo "  cd $PROJECT_DIR/agent"
echo "  source .venv/bin/activate"
echo "  python scripts/scan_odds.py"
echo "  python scripts/settle_bets.py"
echo ""
echo "Urmărește logs:"
echo "  tail -f $LOG_DIR/scan.log"
echo "  tail -f $LOG_DIR/settle.log"
echo "  tail -f $LOG_DIR/diary.log"
