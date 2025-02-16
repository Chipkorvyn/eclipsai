// app/api/premiums/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function buildWhereClause(params: any) {
  const whereParts: string[] = [];
  const values: any[] = [];
  let idx = 1;

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

  const whereClause = whereParts.length
    ? 'WHERE ' + whereParts.join(' AND ')
    : '';

  return { whereClause, values };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const canton = searchParams.get('canton') || '';
    const region = searchParams.get('region') || '';
    const altersklasse = searchParams.get('altersklasse') || '';
    const franchise = searchParams.get('franchise') || '';
    const unfalleinschluss = searchParams.get('unfalleinschluss') || '';

    const { whereClause, values } = buildWhereClause({
      canton,
      region,
      altersklasse,
      franchise,
      unfalleinschluss
    });

    const sql = `
      SELECT
        p.id,
        p.tarif,
        p.tariftyp,
        p.tarifbezeichnung,
        p.franchise,
        p.unfalleinschluss,
        p.altersklasse,
        p.praemie,
        i.name AS insurer_name,
        COALESCE(NULLIF(p.tarifbezeichnung,''), p.tarif) AS plan_label
      FROM premiums p
      LEFT JOIN insurers i
        ON p.bag_code = i.bag_code
      ${whereClause}
      ORDER BY p.praemie ASC
      LIMIT 300
    `;
    const result = await pool.query(sql, values);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error in /api/premiums:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
