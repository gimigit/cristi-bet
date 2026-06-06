import os
import sys
from datetime import datetime, timezone

# Ensure we can import the helper
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from cristi_bet_helper import (
    get_active_sports, fetch_odds, simplify_odds, 
    get_bankroll, get_open_exposure, place_bet, log_scan
)

def run_scan():
    print("🚀 Starting cristi-bet scan (Run 3/6)...")
    
    try:
        # 1. Fetch active sports
        sports = get_active_sports()
        print(f"Active sports from config: {sports}")
        
        # 2. Fetch and simplify odds
        all_opportunities = []
        for sport in sports:
            raw_odds = fetch_odds(sport)
            simplified = simplify_odds(raw_odds)
            all_opportunities.extend(simplified)
        
        print(f"Found {len(all_opportunities)} opportunities in the 1.70-2.80 range.")
        
        # 3. Bankroll and Exposure check
        bankroll = get_bankroll()
        exposure = get_open_exposure()
        print(f"Bankroll: {bankroll} RON | Current Exposure: {exposure} RON")
        
        # 4. Analysis and Decision
        bets_placed = 0
        max_bets = 2
        
        for opp in all_opportunities:
            if bets_placed >= max_bets:
                break
                
            best_selection = None
            best_price = 0
            for selection, price in opp['odds'].items():
                if 1.70 <= price <= 2.80 and price > best_price:
                    best_price = price
                    best_selection = selection
            
            if best_selection:
                stake = bankroll * 0.05
                if (exposure + stake) > (bankroll * 0.60):
                    print(f"  ⚠️ Exposure limit reached. Skipping {best_selection}")
                    continue
                
                rationale = f"Value found in {opp['league']} range. Odds {best_price} within sweet spot."
                bet_id = place_bet(
                    event=opp['event'],
                    selection=best_selection,
                    sport=opp['sport'],
                    league=opp['league'],
                    market="h2h",
                    event_date=opp['commence'],
                    odds=best_price,
                    confidence=7,
                    stake=stake,
                    rationale=rationale
                )
                
                if bet_id:
                    print(f"  ✅ Placed bet {bet_id}: {best_selection} @ {best_price} for {stake:.2f} RON")
                    bets_placed += 1
                    exposure += stake
                else:
                    print(f"  ❌ Failed to place bet for {best_selection}")

        # 5. Final Logging
        status = "SUCCESS" if bets_placed > 0 else "NO_VALUE"
        log_scan(status=status, leagues_scanned=len(sports), reason=f"Placed {bets_placed} bets.")
        print(f"🏁 Scan complete. Status: {status}. Bets placed: {bets_placed}")

    except Exception as e:
        print(f"❌ Critical error during scan: {e}")
        log_scan(status="ERROR", reason=str(e))

if __name__ == "__main__":
    run_scan()
