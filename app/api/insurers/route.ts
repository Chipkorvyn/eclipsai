// app/api/insurers/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Define interface for insurer data
interface Insurer {
 id: number;
 bag_code: string;
 name: string;
}

export async function GET() {
 try {
   const sql = `
     SELECT id, bag_code, name
     FROM insurers
     WHERE name IS NOT NULL
     ORDER BY name ASC
   `;
   const result = await pool.query(sql);
   return NextResponse.json(result.rows as Insurer[]);
 } catch (error: unknown) {
   console.error('insurers route error:', error);
   
   if (error instanceof Error) {
     return NextResponse.json({ error: error.message }, { status: 500 });
   }
   
   return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
 }
}