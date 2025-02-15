// app/api/insurerPlans/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function buildWhereClause(params: any) {
  const whereParts: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.bag_code) {
    whereParts.push(`p.bag_code = $${idx}`);
    values.push(params.bag_code);
    idx++;
  }
  if (params.canton) {
    whereParts.push(`p.kanton = $${idx}`);
    values.push(params.canton);
    idx++;
  }
  if (params.region) {
    whereParts.push(`p.region = $${idx}`);
    values.push(params.region);
    idx++;
  }
  if (params.altersklasse) {
    whereParts.push(`p.altersklasse = $${idx}`);
    values.push(params.altersklasse);
    idx++;
  }
  if (params.franchise) {
    whereParts.push(`p.franchise = $${idx}`);
    values.push(parseInt(params.franchise, 10));
    idx++;
  }
  if (params.unfalleinschluss) {
    whereParts.push(`p.unfalleinschluss = $${idx}`);
    values.push(params.unfalleinschluss);
    idx++;
  }

  const whereClause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';
  return { whereClause, values };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bag_code = searchParams.get('bag_code') || '';
    const canton = searchParams.get('canton') || '';
    const region = searchParams.get('region') || '';
    const altersklasse = searchParams.get('altersklasse') || '';
    const franchise = searchParams.get('franchise') || '';
    const unfalleinschluss = searchParams.get('unfalleinschluss') || '';

    const { whereClause, values } = buildWhereClause({
      bag_code,
      canton,
      region,
      altersklasse,
      franchise,
      unfalleinschluss,
    });

    // Distinct on COALESCE(tarifbezeichnung, tarif)
    const sql = `
      SELECT DISTINCT ON (COALESCE(NULLIF(p.tarifbezeichnung,''), p.tarif))
        p.tarif AS "distinctTarif",
        COALESCE(NULLIF(p.tarifbezeichnung,''), p.tarif) AS "distinctLabel"
      FROM premiums p
      ${whereClause}
      ORDER BY COALESCE(NULLIF(p.tarifbezeichnung,''), p.tarif) ASC
      LIMIT 200
    `;
    const result = await pool.query(sql, values);
    return NextResponse.json(result.rows); 
  } catch (error: any) {
    console.error('insurerPlans route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
