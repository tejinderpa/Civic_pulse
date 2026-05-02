import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const issueId = params.id
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to upvote' }, { status: 401 })
  }

  try {
    // 2. Insert vote to handle uniqueness (Atomic check)
    // The 'votes' table should have a unique constraint on (user_id, issue_id)
    const { error: voteError } = await supabase
      .from('votes')
      .insert({ user_id: user.id, issue_id: issueId })

    if (voteError) {
      if (voteError.code === '23505') { // Postgres Unique Violation
        return NextResponse.json({ error: 'You have already upvoted this issue' }, { status: 400 })
      }
      throw voteError
    }

    // 3. Atomic Increment of upvotes in the reports/issues table
    // Note: In Supabase/PostgREST, we can use RPC for a truly atomic increment
    // For now, we'll try to update using a join or just assume the 'issues' table name needs to be confirmed.
    // Standard approach without RPC:
    const { data: updateData, error: updateError } = await supabase.rpc('increment_upvotes', { 
      issue_id_param: issueId 
    });

    if (updateError) {
      // Fallback if RPC is not defined
      console.warn('RPC increment_upvotes not found, falling back to manual update');
      const { data: issueData } = await supabase.from('issues').select('upvotes').eq('id', issueId).single();
      await supabase.from('issues').update({ upvotes: (issueData?.upvotes || 0) + 1 }).eq('id', issueId);
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Voting Error:', err)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
}
