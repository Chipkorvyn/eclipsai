// app/api/insurers/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT id, bag_code, name
      FROM insurers
      WHERE name IS NOT NULL
      ORDER BY name ASC
    `;
    const result = await pool.query(sql);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('insurers route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
