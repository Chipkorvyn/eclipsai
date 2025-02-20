// File: app/api/postalById/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    if (!idParam) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const id = parseInt(idParam, 10);
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const sql = `
      SELECT id, plz, gemeinde, ort_localite, kanton, region_int
      FROM postal_mappings
      WHERE id = $1
    `;
    const result = await pool.query(sql, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // Return just one row
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('GET /api/postalById error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
