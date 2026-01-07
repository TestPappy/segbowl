
export function defaultColors() {
    return Array(12).fill('#E2CAA0');
}

export function defaultWood() {
    return Array(12).fill('maple');
}

export function defaultLens(cnt = 12) {
    return Array(cnt).fill(1);
}

export function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1)
}

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