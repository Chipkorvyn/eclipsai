// File: app/api/insurerPlans/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { buildWhereClause } from '@/lib/dbUtils';

// Define a type for the plans returned from your query
interface InsurerPlan {
  distinctTarif: string;
  distinctLabel: string;
  tariftyp: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bag_code        = searchParams.get('bag_code') || '';
    const canton          = searchParams.get('canton') || '';
    const region          = searchParams.get('region') || '';
    const altersklasse    = searchParams.get('altersklasse') || '';
    const franchise       = searchParams.get('franchise') || '';
    const unfalleinschluss= searchParams.get('unfalleinschluss') || '';

    // Build clause
    const { whereClause, values } = buildWhereClause(
      { bag_code, canton, region, altersklasse, franchise, unfalleinschluss },
      'p',
      [
        'bag_code',
        'canton',
        'region',
        'altersklasse',
        'franchise',
        'unfalleinschluss'
      ]
    );

    const sql = `
      SELECT DISTINCT ON (COALESCE(NULLIF(p.tarifbezeichnung,''), p.tarif))
        p.tarif AS "distinctTarif",
        COALESCE(NULLIF(p.tarifbezeichnung,''), p.tarif) AS "distinctLabel",
        p.tariftyp
      FROM premiums p
      ${whereClause}
      ORDER BY COALESCE(NULLIF(p.tarifbezeichnung,''), p.tarif) ASC
      LIMIT 200
    `;
    const result = await pool.query(sql, values);
    return NextResponse.json(result.rows as InsurerPlan[]);
  } catch (error: unknown) {
    console.error('insurerPlans route error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}