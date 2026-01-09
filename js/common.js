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
 * Format a measurement value for display (mm or inches with fractions)
 * @param {number} value - The value to format (in mm - internal unit)
 * @param {number|null} [step=null] - Step size for fraction reduction (in inches when displaying inches)
 * @param {Ctrl} ctrl - Control state (for unit preference)
 * @returns {string} Formatted measurement string
 */
export function reduce(value, step = null, ctrl) {
    // Default: display in mm (internal unit)
    if (ctrl.inch == false) {
        return value.toFixed(1).concat(' mm');
    }
    
    // Convert mm to inches for display
    const inchValue = value / 25.4;
    
    if (isNaN(step) || step == "decimal") {
        return inchValue.toFixed(2).concat('"');
    }
    if (step == null) { step = ctrl.step; }

    if (inchValue == 0) { return '0"'; }
    let numerator = Math.round(inchValue / step);
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
        return whole.toString().concat(' ').concat(numerator / gcd).toString().concat('⁄').concat((denominator / gcd).toString().concat('"'));
    }
    return (numerator / gcd).toString().concat('⁄').concat((denominator / gcd).toString().concat('"'));
}
