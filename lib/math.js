/** Whole-number helpers. Everything here rounds towards minus infinity, so years before year 1 behave. */
/** a divided by b, rounded down. */
export function floorDiv(a, b) {
    return Math.floor(a / b);
}
/** The remainder of a divided by b, always from 0 up to (not including) b. */
export function mod(a, b) {
    const r = a % b;
    return r < 0 ? r + b : r;
}
/** The greatest common divisor of two positive whole numbers. */
export function gcd(a, b) {
    while (b !== 0)
        [a, b] = [b, a % b];
    return a;
}
/** The least common multiple of two positive whole numbers. */
export function lcm(a, b) {
    return (a / gcd(a, b)) * b;
}
/** A value held between two bounds. */
export function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
}
/** BigInt division, rounded down. */
export function floorDivBig(a, b) {
    const q = a / b;
    return a % b !== 0n && a < 0n !== b < 0n ? q - 1n : q;
}
/** BigInt division, rounded up. */
export function ceilDivBig(a, b) {
    return -floorDivBig(-a, b);
}
/** BigInt remainder, always from 0 up to (not including) b, for a positive b. */
export function modBig(a, b) {
    const r = a % b;
    return r < 0n ? r + b : r;
}
