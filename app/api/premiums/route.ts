// File: app/api/premiums/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { buildWhereClause } from '../../../lib/dbUtils';

// Define interface for premium data
interface Premium {
 id: number;
 tarif: string;
 tariftyp: string;
 tarifbezeichnung: string | null;
 franchise: string;
 unfalleinschluss: string;
 altersklasse: string;
 praemie: string;
 insurer_name: string;
 plan_label: string;
}

export async function GET(request: Request) {
 try {
   const { searchParams } = new URL(request.url);

   const canton           = searchParams.get('canton') || '';
   const region           = searchParams.get('region') || '';
   const altersklasse     = searchParams.get('altersklasse') || '';
   const franchise        = searchParams.get('franchise') || '';
   const unfalleinschluss = searchParams.get('unfalleinschluss') || '';

   // Reuse the DRY helper
   const { whereClause, values } = buildWhereClause(
     { canton, region, altersklasse, franchise, unfalleinschluss },
     'p',
     [
       'canton',
       'region',
       'altersklasse',
       'franchise',
       'unfalleinschluss'
     ]
   );

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
   return NextResponse.json(result.rows as Premium[]);
 } catch (error: unknown) {
   console.error('Error in /api/premiums:', error);
   
   if (error instanceof Error) {
     return NextResponse.json({ error: error.message }, { status: 500 });
   }
   
   return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
 }
}