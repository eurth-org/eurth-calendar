/** Whole-number helpers. Everything here rounds towards minus infinity, so years before year 1 behave. */
/** a divided by b, rounded down. */
export declare function floorDiv(a: number, b: number): number;
/** The remainder of a divided by b, always from 0 up to (not including) b. */
export declare function mod(a: number, b: number): number;
/** The greatest common divisor of two positive whole numbers. */
export declare function gcd(a: number, b: number): number;
/** The least common multiple of two positive whole numbers. */
export declare function lcm(a: number, b: number): number;
/** A value held between two bounds. */
export declare function clamp(value: number, min: number, max: number): number;
/** BigInt division, rounded down. */
export declare function floorDivBig(a: bigint, b: bigint): bigint;
/** BigInt division, rounded up. */
export declare function ceilDivBig(a: bigint, b: bigint): bigint;
/** BigInt remainder, always from 0 up to (not including) b, for a positive b. */
export declare function modBig(a: bigint, b: bigint): bigint;
