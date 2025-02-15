// app/api/postal/route.ts
import { NextResponse } from 'next/server';
import pool from '../../../lib/db'; // adjust the path if needed

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchValue = searchParams.get('search') || '';

    if (!searchValue) {
      return NextResponse.json([]);
    }

    const sql = `
      SELECT id, plz, gemeinde, ort_localite, kanton, region_int
      FROM postal_mappings
      WHERE plz ILIKE $1 || '%'
      ORDER BY plz
      LIMIT 20
    `;
    const result = await pool.query(sql, [searchValue]);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('postal route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
