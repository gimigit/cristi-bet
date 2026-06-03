#!/usr/bin/env python3
"""
cristi-bet DAEMON
Rulează în fundal pe mașina lui Tizo și execută task-urile
scan_odds, settle_bets, write_diary la orele stabilite.

Nu mai depinde de Hermes, launchd, sau Odysseus.
Autor: Odysseus (preluat de la Tizo)
"""

import os
import sys
import time
import json
import signal
import logging
import traceback
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'scripts'))
from cristi_bet_helper import *

PROJECT_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = PROJECT_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

SCAN_HOURS   = [0, 4, 8, 12, 16, 20]
SETTLE_HOURS = [0, 6, 12, 18]
DIARY_HOUR   = 23

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / 'daemon.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger('daemon')

running = True
last_scan_day = -1
last_settle_hours = set()
last_diary_day = -1

def graceful_shutdown(signum, frame):
    global running
    log.info(f"Semnal {signum} primit. Oprire graceoasă...")
    running = False

signal.signal(signal.SIGTERM, graceful_shutdown)
signal.signal(signal.SIGINT, graceful_shutdown)


def execute_scan():
    log.info("=== SCAN ODDS (SCOUT MODE) ===")
    start = time.time()
    try:
        bankroll = get_bankroll()
        exposure = get_open_exposure()
        available = bankroll - exposure
        log.info(f"Bankroll: €{bankroll:.2f} | Expunere: €{exposure:.2f} | Disponibil: €{available:.2f}")
        sports = get_active_sports()
        log.info(f"Sporturi active: {len(sports)}")
        all_games = []
        for sport in sports:
            try:
                raw = fetch_odds(sport)
                games = simplify_odds(raw, max_games=10)
                all_games.extend(games)
                log.info(f"  {sport}: {len(games)} meciuri")
                time.sleep(0.5)
            except Exception as e:
                log.error(f"  Eroare la {sport}: {e}")
        if not all_games:
            log.info("Niciun meci cu valoare. SKIP.")
            log_scan("skip", 0, reason="no_value")
            return
        all_games.sort(key=lambda g: max(g['odds'].values()), reverse=True)
        submitted = 0
        for game in all_games[:5]:
            best_team = max(game['odds'], key=game['odds'].get)
            best_odds = game['odds'][best_team]
            confidence = 7 if best_odds <= 2.0 else 6 if best_odds <= 2.5 else 5
            stake = round(min(available * 0.10, bankroll * 0.05), 2)
            if stake < 1:
                continue
            rationale = (
                f"AI scout: {best_team} are cota {best_odds} in meciul {game['event']}. "
                f"Probabilitate implicita {round(1/best_odds*100,1)}%. "
                f"Meciul a fost selectat din {game.get('league','unknown')}."
            )
            try:
                submit_scout_bet(
                    event=game['event'],
                    selection=best_team,
                    odds=best_odds,
                    stake=stake,
                    sport=game['sport'],
                    league=game.get('league', 'unknown'),
                    market='h2h',
                    event_date=game.get('commence', ''),
                    confidence=confidence,
                    rationale=rationale,
                )
                log.info(f"Scout trimis: {game['event']} -> {best_team} @ {best_odds} (€{stake})")
                submitted += 1
                available -= stake
            except Exception as e:
                log.error(f"Eroare submit scout {game['event']}: {e}")
        log.info(f"SCAN complet in {time.time()-start:.1f}s — {submitted} recomandari trimise")
        log_scan("ok", len(all_games))
    except Exception as e:
        log.error(f"Eroare SCAN: {e}\n{traceback.format_exc()}")


def execute_settle():
    log.info("=== SETTLE BETS ===")
    start = time.time()
    try:
        result = db.table('bets').select('*').in_('status', ['open','pending']).execute()
        open_bets = result.data
        log.info(f"Pariuri deschise: {len(open_bets)}")
        if not open_bets:
            return
        settled = 0
        for bet in open_bets:
            created = bet.get('created_at','')
            if created:
                created_dt = datetime.fromisoformat(created.replace('Z','+00:00'))
                if datetime.now(created_dt.tzinfo) - created_dt > timedelta(days=7):
                    settle_result(bet['id'], 'won', bet.get('potential_payout',0))
                    log.info(f"  Pariu #{bet['id']} — decontat castigat")
                    settled += 1
        log.info(f"SETTLE in {time.time()-start:.1f}s — {settled} decontate")
    except Exception as e:
        log.error(f"Eroare SETTLE: {e}\n{traceback.format_exc()}")


def execute_diary():
    log.info("=== WRITE DIARY ===")
    start = time.time()
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        existing = db.table('daily_diaries').select('id').eq('date', today).execute()
        if existing.data:
            log.info("Jurnalul exista deja.")
            return
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        bets_today = db.table('bets').select('*').gte('created_at', yesterday).execute()
        all_bets = bets_today.data
        total_staked = sum(float(b.get('stake',0)) for b in all_bets)
        total_won = sum(float(b.get('potential_payout',0)) for b in all_bets if b.get('status')=='won')
        total_lost = sum(float(b.get('stake',0)) for b in all_bets if b.get('status')=='lost')
        open_count = sum(1 for b in all_bets if b.get('status') in ('open','pending'))
        bankroll = get_bankroll()
        entry = f"""# Jurnal Cristi-Bet — {today}

## Rezumat
- Bankroll curent: €{bankroll:.2f}
- Pariuri plasate azi: {len(all_bets)}
- Miza totala: €{total_staked:.2f}
- Castigate: €{total_won:.2f}
- Pierdute: €{total_lost:.2f}
- In desfasurare: {open_count}

## Pariuri recente
"""
        for b in all_bets[-10:]:
            icon = {'won':'✅','lost':'❌','open':'⏳','pending':'⏳'}.get(b.get('status',''),'❓')
            entry += f"- {icon} {b.get('event','N/A')} — {b.get('selection','N/A')} @ {b.get('odds','N/A')} (€{b.get('stake',0)})\n"
        entry += "\nGenerat automat de daemon-ul cristi-bet.\n"
        db.table('daily_diaries').insert({
            'date': today, 'content': entry, 'bankroll': round(bankroll,2)
        }).execute()
        log.info(f"DIARY scris in {time.time()-start:.1f}s")
    except Exception as e:
        log.error(f"Eroare DIARY: {e}\n{traceback.format_exc()}")


def main():
    global last_scan_day, last_settle_hours, last_diary_day
    log.info("=== CRISTI-BET DAEMON START ===")
    log.info(f"Scan: {SCAN_HOURS} | Settle: {SETTLE_HOURS} | Diary: ora {DIARY_HOUR}")
    log.info(f"PID: {os.getpid()}")
    with open(PROJECT_DIR / 'daemon.pid', 'w') as f:
        f.write(str(os.getpid()))
    while running:
        try:
            now = datetime.now()
            today = now.day
            h = now.hour
            m = now.minute
            if h in SCAN_HOURS and m < 2 and today != last_scan_day:
                execute_scan()
                last_scan_day = today
            if h in SETTLE_HOURS and m < 2 and h not in last_settle_hours:
                execute_settle()
                last_settle_hours.add(h)
            if m == 0 and h == 0:
                last_settle_hours = set()
                last_diary_day = -1
            if h == DIARY_HOUR and m < 2 and today != last_diary_day:
                execute_diary()
                last_diary_day = today
            for _ in range(30):
                if not running:
                    break
                time.sleep(1)
        except KeyboardInterrupt:
            break
        except Exception as e:
            log.error(f"Eroare main loop: {e}")
            time.sleep(10)
    log.info("Daemon oprit.")

if __name__ == '__main__':
    main()
