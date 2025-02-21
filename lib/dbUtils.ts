/**
 * Build a WHERE clause and values array from a given params object.
 */

export function buildWhereClause(
  params: Record<string, unknown>,
  tableAlias: string,
  allowedFields: string[]
): {
  whereClause: string;
  values: unknown[];
} {
  const whereParts: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const field of allowedFields) {
    const val = params[field];
    if (!val) continue;

    switch (field) {
      case "bag_code":
        whereParts.push(`${tableAlias}.bag_code = $${idx}`);
        values.push(val);
        idx++;
        break;

      case "canton":
        whereParts.push(`${tableAlias}.kanton = $${idx}`);
        values.push(val);
        idx++;
        break;

      case "region":
        whereParts.push(`${tableAlias}.region = $${idx}`);
        values.push(val);
        idx++;
        break;

      case "altersklasse":
        whereParts.push(`${tableAlias}.altersklasse = $${idx}`);
        values.push(val);
        idx++;
        break;

      case "franchise":
        // parse int
        if (typeof val === "number") {
          whereParts.push(`${tableAlias}.franchise = $${idx}`);
          values.push(val);
          idx++;
        } else if (typeof val === "string") {
          const fNum = parseInt(val, 10);
          if (!isNaN(fNum)) {
            whereParts.push(`${tableAlias}.franchise = $${idx}`);
            values.push(fNum);
            idx++;
          }
        }
        break;

      case "unfalleinschluss":
        whereParts.push(`${tableAlias}.unfalleinschluss = $${idx}`);
        values.push(val);
        idx++;
        break;

      default:
        // skip fields not in logic
        break;
    }
  }

  const whereClause = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  return { whereClause, values };
}
