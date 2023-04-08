import * as THREE from 'three';

/**
 * screenToRealPoint
 * @param {view2d} view2d 
 * @param {int} x of mouse click in canvas
 * @param {int} y of mouse click in canvas
 * @returns x and y of real position in bowl cross section. y is - half an inch, 
 * because bowl is located half an inch above bottom of canvas.
 */
export function screenToRealPoint(view2d, x, y) {
    // console.log("x: " + x + "; y: " + y);
    return {
        x: (x - view2d.canvas.width / 2) / view2d.scale,
        y: (view2d.canvas.height - y) / view2d.scale - .5
    };
}

/**
 * realToScreen
 * @param {view2d} view2d 
 * @param {double} x 
 * @param {double} y 
 * @param {double} ofst offset
 * @returns the canvas coordinates of a real point
 */
export function realToScreen(view2d, x, y, ofst = -.5) {
    return {
        x: x * view2d.scale + view2d.canvas.width / 2,
        y: -(y - ofst) * view2d.scale + view2d.canvas.height
    };
}

/**
 * screenToReal
 * @param {view2d} view2d 
 * @param {bowlprop} bowlprop 
 * @returns 
 */
export function screenToReal(view2d, bowlprop) {
    var npoint = [];
    for (var p in bowlprop.cpoint) {
        npoint.push(new THREE.Vector2(
            (bowlprop.cpoint[p].x - view2d.canvas.width / 2) / view2d.scale,
            (view2d.canvas.height - bowlprop.cpoint[p].y) / view2d.scale - .5)); // .5 to put at 0,0
    }
    return npoint;
}

export function calcBezPath(view2d, bowlprop, real = true) {
    if (real) {
        var rpoint = screenToReal(view2d, bowlprop);
    } else {
        var rpoint = bowlprop.cpoint;
    }
    var points = [new THREE.Vector2(0, 0), new THREE.Vector2(.1, 0)];
    for (var j = 0; j < rpoint.length - 1; j += 3) { // Step through each bezier
        for (var t = 0; t <= 1; t += 1 / bowlprop.curvesegs) { // Each t-value
            var mt = Math.max(0, 1 - t);
            points.push(new THREE.Vector2(
                (mt ** 3) * (rpoint[j].x) + 3 * t * (mt ** 2) * (rpoint[j + 1].x) + 3 * (t ** 2) * mt * (rpoint[j + 2].x) + (t ** 3) * (rpoint[j + 3].x),
                (mt ** 3) * (rpoint[j].y) + 3 * t * (mt ** 2) * (rpoint[j + 1].y) + 3 * (t ** 2) * mt * (rpoint[j + 2].y) + (t ** 3) * (rpoint[j + 3].y)));
        }
    }
    points.push(rpoint[rpoint.length - 1]); // Always end with last point (in case t != 1 exactly)
    return points;
}

export function splitRingY(curve, bowlprop) {
    var y_from = 0;
    var curveparts = [];
    for (var i = 0; i < bowlprop.rings.length; i++) {
        var segcurve = [];
        var y_to = y_from + bowlprop.rings[i].height
        if (i == 0) { // Always get first point
            segcurve.push({ x: curve[0].x, y: curve[0].y }); 
        } 
        for (var p = 1; p < curve.length; p++) {
            var m = (curve[p].y - curve[p - 1].y) / (curve[p].x - curve[p - 1].x);
            if (curve[p - 1].y < y_from && curve[p].y > y_to) { // Make sure we don't skip over thin rings
                segcurve.push({ x: (y_from - curve[p - 1].y) / m + curve[p - 1].x, y: y_from });
                segcurve.push({ x: (y_to - curve[p - 1].y) / m + curve[p - 1].x, y: y_to });
            } else if (curve[p - 1].y <= y_from && curve[p].y > y_from) { // First point inside segment y
                segcurve.push({ x: (y_from - curve[p].y) / m + curve[p].x, y: y_from });
            } else if (curve[p - 1].y < y_to && curve[p].y >= y_to) { // Last point in segment y
                segcurve.push({ x: (y_to - curve[p].y) / m + curve[p].x, y: y_to });
                break;
            } else if (curve[p].y >= y_from && curve[p].y < y_to) {
                segcurve.push({ x: curve[p].x, y: curve[p].y });
            } // else, p is not in segment y
        }
        if (i == bowlprop.rings.length - 1) { 
            segcurve.push(curve[curve.length - 1]); 
        }
        if (segcurve.length > 1) {
            curveparts.push(segcurve);
        }
        y_from += bowlprop.rings[i].height;
    }
    return curveparts;
}