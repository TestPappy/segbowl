import { offsetCurve, calcBezPath } from "./bowl_calculator.mjs";
import { dfltclrs, dfltlens } from "./common.mjs";

/**
 * calcRings
 */
export function calcRings(view2d, bowlprop) {
    var paths = offsetCurve(calcBezPath(view2d, bowlprop), bowlprop.thick / 2);

    // Split path into components
    var pathx1 = [], pathx2 = [], pathy1 = [], pathy2 = [];
    for (var i = 0; i < paths.c1.length; i++) {
        pathx1.push(paths.c1[i].x);
        pathx2.push(paths.c2[i].x);
        pathy1.push(paths.c1[i].y);
        pathy2.push(paths.c2[i].y);
    }

    // Vertical profile
    bowlprop.height = Math.max(Math.max.apply(null, pathy1), Math.max.apply(null, pathy2));
    bowlprop.radius = Math.max(Math.max.apply(null, pathx1), Math.max.apply(null, pathx2));
    var y = -bowlprop.thick / 2;
    var i = 0;
    while (y < bowlprop.height) {
        var x = []; // x-values within this ring
        var yidx = []; // INDEX of y-values in this ring
        if (bowlprop.rings.length <= i) { // Need a new ring
            bowlprop.rings.push({ height: .75, segs: 12, clrs: dfltclrs(), seglen: dfltlens(), xvals: [], theta: 0 });
        }
        for (var p = 0; p < pathx1.length; p++) {
            if (pathy1[p] > y && pathy1[p] < y + bowlprop.rings[i].height) { 
                x.push(pathx1[p]); yidx.push(p); 
            }
            if (pathy2[p] > y && pathy2[p] < y + bowlprop.rings[i].height) { 
                x.push(pathx2[p]); yidx.push(p); 
            }
            if (p > 1 && pathy1[p - 1] < y && pathy1[p] > y + bowlprop.rings[i].height) {
                // ring is too thin, curve points jump over it.. interpolate.
                var m = (pathy1[p] - pathy1[p - 1]) / (pathx1[p] - pathx1[p - 1]);
                x.push((y - pathy1[p - 1]) / m + pathx1[p - 1]);
                yidx.push(p);
            }
            if (p > 1 && pathy2[p - 1] < y && pathy2[p] > y + bowlprop.rings[i].height) {
                var m = (pathy2[p] - pathy2[p - 1]) / (pathx2[p] - pathx2[p - 1]);
                x.push((y - pathy2[p - 1]) / m + pathx2[p - 1]);
                yidx.push(p);
            }
        }
        bowlprop.rings[i].xvals = {
            max: Math.max(0, Math.max.apply(null, x) + bowlprop.pad),
            min: Math.max(0, Math.min.apply(null, x) - bowlprop.pad)
        };
        y += bowlprop.rings[i].height;
        i += 1;
    }
    bowlprop.usedrings = i;
}

export function calcRingTrapz(bowlprop, ringidx, rotate = true) {
    if (ringidx == null) { ringidx = 0; }
    var rotation = 0;
    var trapzlist = [];
    var thetas = [];
    var maxtheta = [];
    for (var segidx = 0; segidx < bowlprop.rings[ringidx].seglen.length; segidx++) {
        maxtheta.push(Math.PI / bowlprop.rings[ringidx].segs * bowlprop.rings[ringidx].seglen[segidx]);
    }
    maxtheta = Math.max.apply(null, maxtheta);
    var theta;
    for (var segidx = 0; segidx < bowlprop.rings[ringidx].seglen.length; segidx++) {
        thetas.push(rotation);
        theta = Math.PI / bowlprop.rings[ringidx].segs * bowlprop.rings[ringidx].seglen[segidx];
        var x2 = bowlprop.rings[ringidx].xvals.max * Math.cos(theta) / Math.cos(maxtheta); // cosines make different width segments meet at endpoints
        var x1 = (bowlprop.rings[ringidx].xvals.min) * Math.cos(theta);
        var y2 = x2 * Math.tan(theta);
        var y1 = (bowlprop.rings[ringidx].xvals.min) * Math.sin(theta);
        var trapz = [{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x2, y: -y2 }, { x: x1, y: -y1 }];
        if (rotate) {
            var rtrapz = [];
            var toffset = bowlprop.rings[ringidx].theta; // + rotation;
            for (var p = 0; p < trapz.length; p++) {
                // Complex-number magic to rotate segment around
                var zx = Math.cos(theta + rotation + toffset); // exp(j*theta*i) with j=complex
                var zy = Math.sin(theta + rotation + toffset);

                var rx = trapz[p].x * zx - trapz[p].y * zy; // Basically complex number multiplication
                var ry = trapz[p].y * zx + trapz[p].x * zy;
                rtrapz.push({ x: rx, y: ry });
            }
            trapz = rtrapz;
        }
        rotation += theta * 2;
        trapzlist.push(trapz);
    }
    console.log(trapzlist);
    bowlprop.seltrapz = trapzlist;
    bowlprop.selthetas = thetas;
}