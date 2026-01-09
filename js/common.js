/** @typedef {import('./types.js').Ctrl} Ctrl */

/**
 * Get default colors array for a new ring (12 maple-colored segments)
 * @returns {string[]} Array of 12 hex color strings
 */
export function defaultColors() {
    return Array(12).fill('#E2CAA0');
}

/**
 * Get default wood type array for a new ring (12 maple segments)
 * @returns {string[]} Array of 12 wood type names
 */
export function defaultWood() {
    return Array(12).fill('maple');
}

/**
 * Get default segment length multipliers (all equal)
 * @param {number} [cnt=12] - Number of segments
 * @returns {number[]} Array of length multipliers (all 1)
 */
export function defaultLens(cnt = 12) {
    return Array(cnt).fill(1);
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - Input string
 * @returns {string} String with first letter capitalized
 */
export function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1)
}

/**
 * Format a measurement value for display (inches with fractions or mm)
 * @param {number} value - The value to format (in inches)
 * @param {number|null} [step=null] - Step size for fraction reduction
 * @param {Ctrl} ctrl - Control state (for unit preference)
 * @returns {string} Formatted measurement string
 */
export function reduce(value, step = null, ctrl) {
    if (ctrl.inch == false) {
        return (value * 25.4).toFixed(1).concat(' mm');
    } else if (isNaN(step) || step == "decimal") {
        return value.toFixed(1).concat('"');
    }
    if (step == null) { step = ctrl.step; }

    if (value == 0) { return '0"'; }
    let numerator = Math.round(value / step);
    const denominator = 1 / step;
    if (numerator == denominator) { return '1"'; }
    const gcdFn = function gcdFn(a, b) {
        return b ? gcdFn(b, a % b) : a;
    };
    const gcd = gcdFn(numerator, denominator);
    if (gcd == denominator) { return (numerator / denominator).toString().concat('"'); } // Whole number
    if (numerator > denominator) { //Mixed fraction
        const whole = Math.floor(numerator / denominator);
        numerator = numerator % denominator;
        return whole.toString().concat(' ').concat(numerator / gcd).toString().concat('&frasl;').concat((denominator / gcd).toString().concat('"'));
    }
    return (numerator / gcd).toString().concat('&frasl;').concat((denominator / gcd).toString().concat('"'));
}

