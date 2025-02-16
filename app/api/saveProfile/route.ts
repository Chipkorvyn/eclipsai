// app/api/saveProfile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // For now, single-user => userId='default' or you could do multi-user
    const userId = 'default'; 
    const year = body.yearOfBirth || null;
    const canton = body.canton || '';
    const region = body.region || '';
    const fran = body.franchise || 300;
    const plan = body.currentPlan || '';

    // Insert or update (unique on user_id)
    // Make sure 'profiles' table has a unique constraint on user_id
    const sql = `
      INSERT INTO profiles (user_id, year_of_birth, canton, region, franchise, current_plan)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE
        SET year_of_birth = EXCLUDED.year_of_birth,
            canton = EXCLUDED.canton,
            region = EXCLUDED.region,
            franchise = EXCLUDED.franchise,
            current_plan = EXCLUDED.current_plan
      RETURNING *
    `;
    const vals = [userId, year, canton, region, fran, plan];
    const result = await pool.query(sql, vals);

    return NextResponse.json({ success: true, profile: result.rows[0] });
  } catch (error: any) {
    console.error('saveProfile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Optional GET => retrieve profile
export async function GET() {
  try {
    const userId = 'default';
    const sql = 'SELECT * FROM profiles WHERE user_id=$1';
    const vals = [userId];
    const result = await pool.query(sql, vals);
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, profile: null });
    }
    return NextResponse.json({ success: true, profile: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
