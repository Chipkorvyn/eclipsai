// app/api/saveProfile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Example fields from your userInputs
    const userId = 'default'; // or body.user_id if multi-user
    const year = body.yearOfBirth || null;
    const canton = body.canton || '';
    const region = body.region || '';
    const fran = body.franchise || 300;
    const plan = body.currentPlan || '';

    // Insert or update (if you only want one row per user)
    // You need a UNIQUE constraint on user_id in the 'profiles' table
    const sql = `
      INSERT INTO profiles (user_id, year_of_birth, canton, region, franchise, current_plan)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        year_of_birth = EXCLUDED.year_of_birth,
        canton = EXCLUDED.canton,
        region = EXCLUDED.region,
        franchise = EXCLUDED.franchise,
        current_plan = EXCLUDED.current_plan,
        last_updated = now()
      RETURNING *;
    `;
    const vals = [userId, year, canton, region, fran, plan];
    const result = await pool.query(sql, vals);

    return NextResponse.json({ success: true, profile: result.rows[0] });
  } catch (error: any) {
    console.error('saveProfile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
