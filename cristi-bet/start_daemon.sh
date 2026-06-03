#!/bin/bash
# cristi-bet daemon manager
# Usage: ./start_daemon.sh {start|stop|restart|status|logs|test-scan|test-settle|test-diary}

DAEMON_DIR="$(cd "$(dirname "$0")" && pwd)"
DAEMON_SCRIPT="$DAEMON_DIR/agent/daemon.py"
PID_FILE="$DAEMON_DIR/daemon.pid"
LOG_DIR="$DAEMON_DIR/logs"

mkdir -p "$LOG_DIR"

case "${1:-status}" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "❌ Daemon-ul rulează deja (PID $(cat "$PID_FILE"))."
      echo "   Folosește: $0 restart"
      exit 1
    fi
    echo "🚀 Pornesc daemon-ul cristi-bet..."
    cd "$DAEMON_DIR"
    nohup python3 "$DAEMON_SCRIPT" >> "$LOG_DIR/daemon_console.log" 2>&1 &
    DAEMON_PID=$!
    echo $DAEMON_PID > "$PID_FILE"
    echo "✅ Daemon pornit cu PID $DAEMON_PID"
    ;;
    
  stop)
    if [ ! -f "$PID_FILE" ]; then
      echo "⚠️  Niciun PID găsit."
      exit 0
    fi
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      echo "🛑 Opresc daemon-ul (PID $PID)..."
      kill "$PID"
      sleep 2
      if kill -0 "$PID" 2>/dev/null; then
        echo "   Forțez oprirea..."
        kill -9 "$PID" 2>/dev/null
      fi
      echo "✅ Daemon oprit."
    else
      echo "⚠️  Daemon-ul nu mai rulează."
    fi
    rm -f "$PID_FILE"
    ;;
    
  restart)
    $0 stop
    sleep 1
    $0 start
    ;;
    
  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      PID=$(cat "$PID_FILE")
      echo "✅ Daemonul CRISTI-BET rulează (PID $PID)"
      echo "   Uptime: $(ps -o etime= -p $PID 2>/dev/null | xargs)"
      echo "   Memory: $(ps -o rss= -p $PID 2>/dev/null | xargs) KB"
    else
      echo "❌ Daemonul CRISTI-BET NU rulează"
    fi
    echo ""
    echo "📋 Task-uri programate:"
    echo "   Scan odds:    orele 0,4,8,12,16,20"
    echo "   Settle bets:  orele 0,6,12,18"
    echo "   Write diary:  ora 23:00"
    echo ""
    echo "📁 Loguri: $LOG_DIR/"
    ;;
    
  logs)
    if [ -n "$2" ]; then
      tail -f "$LOG_DIR/$2.log"
    else
      echo "📁 Loguri disponibile:"
      ls -1 "$LOG_DIR"/*.log 2>/dev/null || echo "   (niciun log)"
      echo ""
      echo "   Folosește: $0 logs daemon"
      echo "   Sau:       $0 logs scan_odds"
    fi
    ;;
    
  test-scan)
    echo "🧪 Test SCAN..."
    cd "$DAEMON_DIR"
    python3 -c "
from agent.scripts.cristi_bet_helper import *
exec(open('agent/daemon.py').read().split('if __name__')[0])
execute_scan()
"
    ;;
    
  test-settle)
    echo "🧪 Test SETTLE..."
    cd "$DAEMON_DIR"
    python3 -c "
from agent.scripts.cristi_bet_helper import *
exec(open('agent/daemon.py').read().split('if __name__')[0])
execute_settle()
"
    ;;
    
  test-diary)
    echo "🧪 Test DIARY..."
    cd "$DAEMON_DIR"
    python3 -c "
from agent.scripts.cristi_bet_helper import *
exec(open('agent/daemon.py').read().split('if __name__')[0])
execute_diary()
"
    ;;
    
  *)
    echo "cristi-bet daemon manager"
    echo ""
    echo "Usage: $0 {start|stop|restart|status|logs|test-scan|test-settle|test-diary}"
    ;;
esac
