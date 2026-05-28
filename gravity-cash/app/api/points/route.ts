// c:\Workspace\gravity\app\api\points\route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

type PointRequest = {
  amount: number;
  type: string; // e.g., 'TAP' | 'AD_REWARD'
  description?: string;
};

export async function POST(req: Request) {
  // 1️⃣ Verify Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2️⃣ Parse request body
  const body: PointRequest = await req.json();
  const { amount, type, description = '' } = body;

  // 3️⃣ Simple anti‑cheat: reject requests that arrive within 1 s of the previous one
  const { data: lastTxn } = await supabase
    .from('point_transactions')
    .select('created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastTxn && new Date(lastTxn.created_at).getTime() > Date.now() - 1000) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 4️⃣ Call RPC to atomically add points and log transaction
  try {
    await supabase.rpc('increment_points', {
      target_user_id: session.user.id,
      amount,
      txn_type: type,
      txn_description: description,
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
