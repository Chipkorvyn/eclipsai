// File: app/lib/dbUtils.ts

/**
 * Build a WHERE clause and values array from a given params object.
 * 
 * @param params - an object with potential keys like bag_code, canton, region, altersklasse, etc.
 * @param tableAlias - e.g. "p"
 * @param allowedFields - an array of fields we handle, e.g. ["bag_code","canton","region","altersklasse","franchise","unfalleinschluss"]
 */
export function buildWhereClause(params: Record<string, any>, tableAlias: string, allowedFields: string[]) {
    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;
  
    for (const field of allowedFields) {
      const val = params[field];
      if (!val) continue;
  
      // If "franchise" => parse into int
      // If it's bag_code => tableAlias.bag_code = ...
      // etc.  We'll do some small logic:
      switch (field) {
        case 'bag_code':
          whereParts.push(`${tableAlias}.bag_code = $${idx}`);
          values.push(val);
          idx++;
          break;
  
        case 'canton':
          whereParts.push(`${tableAlias}.kanton = $${idx}`);
          values.push(val);
          idx++;
          break;
  
        case 'region':
          whereParts.push(`${tableAlias}.region = $${idx}`);
          values.push(val);
          idx++;
          break;
  
        case 'altersklasse':
          whereParts.push(`${tableAlias}.altersklasse = $${idx}`);
          values.push(val);
          idx++;
          break;
  
        case 'franchise':
          // parse int
          const fNum = parseInt(val, 10);
          if (!isNaN(fNum)) {
            whereParts.push(`${tableAlias}.franchise = $${idx}`);
            values.push(fNum);
            idx++;
          }
          break;
  
        case 'unfalleinschluss':
          whereParts.push(`${tableAlias}.unfalleinschluss = $${idx}`);
          values.push(val);
          idx++;
          break;
  
        default:
          // we skip fields that we haven't coded logic for
          break;
      }
    }
  
    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(' AND ')}`
      : '';
  
    return { whereClause, values };
  }
  