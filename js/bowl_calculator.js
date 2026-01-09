import * as THREE from 'three';

/** @typedef {import('./types.js').View2D} View2D */
/** @typedef {import('./types.js').BowlProp} BowlProp */
/** @typedef {import('./types.js').Point} Point */

/**
 * Convert screen coordinates to real-world coordinates
 * @param {View2D} view2d - The 2D view configuration
 * @param {number} x - X position of mouse click in canvas
 * @param {number} y - Y position of mouse click in canvas
 * @returns {Point} Real position in bowl cross section (y offset by -12.7mm)
 */
export function screenToRealPoint(view2d, x, y) {
    // console.log("x: " + x + "; y: " + y);
    return {
        x: (x - view2d.canvas.width / 2) / view2d.scale,
        y: (view2d.canvas.height - y) / view2d.scale - 12.7  // 12.7mm (was 0.5 inch)
    };
}

/**
 * Convert real-world coordinates to screen coordinates
 * @param {View2D} view2d - The 2D view configuration
 * @param {number} x - Real X coordinate (in mm)
 * @param {number} y - Real Y coordinate (in mm)
 * @param {number} [ofst=-12.7] - Y offset for positioning (in mm)
 * @returns {Point} Canvas coordinates
 */
export function realToScreen(view2d, x, y, ofst = -12.7) {  // 12.7mm (was 0.5 inch)
    return {
        x: x * view2d.scale + view2d.canvas.width / 2,
        y: -(y - ofst) * view2d.scale + view2d.canvas.height
    };
}

/**
 * Convert all control points from screen to real-world coordinates
 * @param {View2D} view2d - The 2D view configuration
 * @param {BowlProp} bowlprop - The bowl properties
 * @returns {THREE.Vector2[]} Array of real-world coordinate vectors (in mm)
 */
export function screenToReal(view2d, bowlprop) {
    const npoint = [];
    for (const p in bowlprop.cpoint) {
        npoint.push(new THREE.Vector2(
            (bowlprop.cpoint[p].x - view2d.canvas.width / 2) / view2d.scale,
            (view2d.canvas.height - bowlprop.cpoint[p].y) / view2d.scale - 12.7)); // 12.7mm to put at 0,0 (was 0.5 inch)
    }
    return npoint;
}

/**
 * Calculate bezier curve path points
 * @param {View2D} view2d - The 2D view configuration
 * @param {BowlProp} bowlprop - The bowl properties
 * @param {boolean} [real=true] - Whether to convert to real coordinates
 * @returns {THREE.Vector2[]} Array of points along the bezier curve (in mm)
 */
export function calcBezPath(view2d, bowlprop, real = true) {
    const rpoint = real ? screenToReal(view2d, bowlprop) : bowlprop.cpoint;
    const points = [new THREE.Vector2(0, 0), new THREE.Vector2(2.5, 0)];  // 2.5mm (was 0.1 inch)
    for (let j = 0; j < rpoint.length - 1; j += 3) { // Step through each bezier
        for (let t = 0; t <= 1; t += 1 / bowlprop.curvesegs) { // Each t-value
            const mt = Math.max(0, 1 - t);
            points.push(new THREE.Vector2(
                (mt ** 3) * (rpoint[j].x) + 3 * t * (mt ** 2) * (rpoint[j + 1].x) + 3 * (t ** 2) * mt * (rpoint[j + 2].x) + (t ** 3) * (rpoint[j + 3].x),
                (mt ** 3) * (rpoint[j].y) + 3 * t * (mt ** 2) * (rpoint[j + 1].y) + 3 * (t ** 2) * mt * (rpoint[j + 2].y) + (t ** 3) * (rpoint[j + 3].y)));
        }
    }
    points.push(rpoint[rpoint.length - 1]); // Always end with last point (in case t != 1 exactly)
    return points;
}

/**
 * Split curve into segments by ring Y boundaries
 * @param {Array<{x: number, y: number}>} curve - The curve points (in mm)
 * @param {BowlProp} bowlprop - The bowl properties
 * @returns {Array<Array<{x: number, y: number}>>} Array of curve segments per ring (in mm)
 */
export function splitRingY(curve, bowlprop) {
    let y_from = 0;
    const curveparts = [];
    for (let i = 0; i < bowlprop.rings.length; i++) {
        const segcurve = [];
        const y_to = y_from + bowlprop.rings[i].height;
        if (i == 0) { // Always get first point
            segcurve.push({ x: curve[0].x, y: curve[0].y }); 
        } 
        for (let p = 1; p < curve.length; p++) {
            const last_y = curve[p - 1].y;
            const last_x = curve[p - 1].x;
            const this_y = curve[p].y;
            const this_x = curve[p].x;
            const m = (this_y - last_y) / (this_x - last_x);
            if (last_y < y_from && this_y > y_to) { // Make sure we don't skip over thin rings
                segcurve.push({ x: (y_from - last_y) / m + last_x, y: y_from });
                segcurve.push({ x: (y_to - last_y) / m + last_x, y: y_to });
            } else if (last_y <= y_from && this_y > y_from) { // First point inside segment y
                segcurve.push({ x: (y_from - this_y) / m + this_x, y: y_from });
            } else if (last_y < y_to && this_y >= y_to) { // Last point in segment y
                segcurve.push({ x: (y_to - this_y) / m + this_x, y: y_to });
                break;
            } else if (this_y >= y_from && this_y < y_to) {
                segcurve.push({ x: this_x, y: this_y });
            } // else, p is not in segment y
        }
        if (i == bowlprop.rings.length - 1) { 
            segcurve.push(curve[curve.length - 1]); 
        }
        if (segcurve.length > 1) {
            curveparts.push(segcurve);
        }
        y_from = y_to;
    }
    return curveparts;
}

/**
 * Create offset curves for inner and outer walls
 * @param {THREE.Vector2[]} curve - The original curve points (in mm)
 * @param {number} offset - Offset distance (half wall thickness, in mm)
 * @returns {{c1: THREE.Vector2[], c2: THREE.Vector2[]}} Inner (c1) and outer (c2) wall curves (in mm)
 */
export function offsetCurve(curve, offset) {
    // Numerical approximation by shifting line segments
    // Returns two curves, one with + offset one with - offset
    // And closes the gap with perp. line
    const innerwall = [];
    const outerwall = [];
    let kx, ky;
    for (let i = 0; i < curve.length - 1; i++) {
        const dx = curve[i + 1].x - curve[i].x;
        const dy = curve[i + 1].y - curve[i].y;
        const dd = Math.sqrt(dx ** 2 + dy ** 2);
        kx = -dy / dd;
        ky = dx / dd;
        innerwall.push(new THREE.Vector2(curve[i].x + offset * kx, curve[i].y + offset * ky));
        outerwall.push(new THREE.Vector2(curve[i].x - offset * kx, curve[i].y - offset * ky));
    }
    // Get the last point
    innerwall.push(new THREE.Vector2(curve[curve.length - 1].x + offset * kx, curve[curve.length - 1].y + offset * ky));
    outerwall.push(new THREE.Vector2(curve[curve.length - 1].x - offset * kx, curve[curve.length - 1].y - offset * ky));
    outerwall.push(innerwall[innerwall.length - 1]); // Close the gap
    return { c1: innerwall, c2: outerwall }; // c1 is inner wall, c2 outer wall
}
