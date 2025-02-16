// app/api/profiles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET => list all rows
export async function GET() {
  try {
    const userId = 'default';
    const sql = `
      SELECT id, profile_name,
             postal_id, postal_plz, postal_ort_localite,
             postal_gemeinde, postal_kanton, postal_region_int,
             year_of_birth, canton, region,
             franchise, current_plan, unfalleinschluss,
             current_insurer_bag_code,
             last_updated
      FROM profiles
      WHERE user_id=$1
      ORDER BY id DESC
    `;
    const result = await pool.query(sql, [userId]);
    return NextResponse.json({ success: true, profiles: result.rows });
  } catch (error: any) {
    console.error('GET /api/profiles error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST => create new row
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = 'default';

    if (!body.profileName) {
      return NextResponse.json({ success: false, error: 'Missing profileName' }, { status: 400 });
    }
    if (!body.yearOfBirth || !body.currentPlan) {
      return NextResponse.json({ success: false, error: 'Missing essential fields' }, { status: 400 });
    }

    const sql = `
      INSERT INTO profiles
      (
        user_id, profile_name,
        postal_id, postal_plz, postal_ort_localite,
        postal_gemeinde, postal_kanton, postal_region_int,
        year_of_birth, canton, region,
        franchise, current_plan, unfalleinschluss,
        current_insurer_bag_code
      )
      VALUES
      (
        $1, $2,
        $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15
      )
      RETURNING *
    `;
    const vals = [
      userId,
      body.profileName,

      body.postalId,
      body.postalPlz,
      body.postalOrtLocalite,
      body.postalGemeinde,
      body.postalKanton,
      body.postalRegionInt,

      body.yearOfBirth,
      body.canton,
      body.region,

      body.franchise,
      body.currentPlan,
      body.unfalleinschluss || 'MIT-UNF',
      body.currentInsurerBagCode || '',
    ];
    const result = await pool.query(sql, vals);
    return NextResponse.json({ success: true, profile: result.rows[0] });
  } catch (error: any) {
    console.error('POST /api/profiles error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE => remove by ?id=123
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const sql = 'DELETE FROM profiles WHERE id=$1 RETURNING id';
    const result = await pool.query(sql, [parseInt(id, 10)]);
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedId: result.rows[0].id });
  } catch (error: any) {
    console.error('DELETE /api/profiles error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
