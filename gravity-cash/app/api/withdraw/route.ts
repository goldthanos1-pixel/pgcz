// c:\Workspace\gravity\app\api\withdraw\route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

type WithdrawRequest = {
  amount: number;
  bank_name: string;
  account_number: string;
};

export async function POST(req: Request) {
  // 1️⃣ Verify session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount, bank_name, account_number }: WithdrawRequest = await req.json();

  // 2️⃣ Call RPC that atomically checks balance, deducts points, and inserts withdrawal record
  try {
    await supabase.rpc('request_withdrawal', {
      target_user_id: session.user.id,
      withdraw_amount: amount,
      bank: bank_name,
      acct: account_number,
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
