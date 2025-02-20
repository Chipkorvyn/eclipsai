// app/lib/insuranceHelpers.ts

/**
 * A single "reference year" so the code won't go stale.
 * If you want a fixed year, set NEXT_PUBLIC_REF_YEAR in .env,
 * otherwise we default to the current calendar year.
 */
export const CURRENT_REF_YEAR = parseInt(process.env.NEXT_PUBLIC_REF_YEAR || '', 10)
  || new Date().getFullYear();

/**
 * Determine "child," "young adult," or "adult" based on YOB.
 * Returns one of: "AKL-KIN", "AKL-JUG", or "AKL-ERW".
 */
export function computeAltersklasse(yob: number): string {
  if (!yob || yob < 1900) return '';  // invalid or empty => return ''
  const age = CURRENT_REF_YEAR - yob;
  if (age <= 18) {
    return 'AKL-KIN';  // child
  } else if (age <= 25) {
    return 'AKL-JUG';  // young adult
  } else {
    return 'AKL-ERW';  // adult
  }
}

/**
 * Return the franchise options for child vs. adult/young adult.
 * "AKL-KIN" => [0,100,200,300,400,500,600]
 * Everything else => [300,500,1000,1500,2000,2500]
 */
export function getFranchiseOptions(altersklasse: string): number[] {
  if (altersklasse === 'AKL-KIN') {
    return [0, 100, 200, 300, 400, 500, 600];
  }
  // For AKL-JUG and AKL-ERW, we use adult franchises
  return [300, 500, 1000, 1500, 2000, 2500];
}
