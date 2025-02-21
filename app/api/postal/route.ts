// app/api/postal/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Define proper types for your postal data
interface PostalRecord {
  id: number;
  plz: string;
  gemeinde: string;
  ort_localite: string;
  kanton: string;
  region_int: string;
}

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

    return NextResponse.json(result.rows as PostalRecord[]);
  } catch (error: unknown) {
    // Use unknown instead of any for better type safety
    console.error('postal route error:', error);
    
    // Type guard to safely access error properties
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}