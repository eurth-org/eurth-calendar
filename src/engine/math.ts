/** Whole-number helpers. Everything here rounds towards minus infinity, so years before year 1 behave. */

/** a divided by b, rounded down. */
export function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

/** The remainder of a divided by b, always from 0 up to (not including) b. */
export function mod(a: number, b: number): number {
  const r = a % b;
  return r < 0 ? r + b : r;
}

/** The greatest common divisor of two positive whole numbers. */
export function gcd(a: number, b: number): number {
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

/** The least common multiple of two positive whole numbers. */
export function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

/** A value held between two bounds. */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** BigInt division, rounded down. */
export function floorDivBig(a: bigint, b: bigint): bigint {
  const q = a / b;
  return a % b !== 0n && a < 0n !== b < 0n ? q - 1n : q;
}

/** BigInt division, rounded up. */
export function ceilDivBig(a: bigint, b: bigint): bigint {
  return -floorDivBig(-a, b);
}

/** BigInt remainder, always from 0 up to (not including) b, for a positive b. */
export function modBig(a: bigint, b: bigint): bigint {
  const r = a % b;
  return r < 0n ? r + b : r;
}
