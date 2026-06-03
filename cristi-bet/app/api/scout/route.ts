import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('pending_bets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pending: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('pending_bets')
    .insert({
      sport: body.sport,
      event_name: body.event_name,
      league: body.league ?? null,
      match_date: body.match_date ?? null,
      market: body.market ?? 'h2h',
      selection: body.selection,
      odds: body.odds,
      stake: body.stake ?? null,
      reason: body.reason ?? null,
      confidence: body.confidence ?? null,
      category: body.category ?? 'manual',
      source: body.source ?? 'manual',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, action, stake } = await req.json()

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  }

  if (action === 'accept') {
    // 1. Get the pending bet
    const { data: pending, error: fetchError } = await supabase
      .from('pending_bets')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !pending) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 2. Insert into bets table
    const { data: bet, error: insertError } = await supabase
      .from('bets')
      .insert({
        event: pending.event_name,
        selection: pending.selection,
        sport: pending.sport,
        league: pending.league,
        market: pending.market,
        match_date: pending.match_date,
        odds: pending.odds,
        stake: stake ?? pending.stake ?? 5,
        confidence: pending.confidence ?? 5,
        status: 'OPEN',
        source: pending.source,
        rationale: pending.reason,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 3. Mark pending as accepted
    await supabase
      .from('pending_bets')
      .update({ status: 'accepted', accepted_at: new Date().toISOString(), bet_id: bet.id })
      .eq('id', id)

    return NextResponse.json({ success: true, bet_id: bet.id })
  }

  if (action === 'reject') {
    const { error: updateError } = await supabase
      .from('pending_bets')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'stake') {
    if (!stake || stake <= 0) {
      return NextResponse.json({ error: 'Invalid stake' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('pending_bets')
      .update({ stake })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()

  const { error } = await supabase
    .from('pending_bets')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
