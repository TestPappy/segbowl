import { offsetCurve, calcBezPath } from "./bowl_calculator.mjs";
import { defaultColors, defaultWood, defaultLens } from "./common.mjs";

/**
 * calcRings
 */
export function calcRings(view2d, bowlprop) {
    const paths = offsetCurve(calcBezPath(view2d, bowlprop), bowlprop.thick / 2);

    // Split path into components
    const pathx1 = [], pathx2 = [], pathy1 = [], pathy2 = [];
    for (let i = 0; i < paths.c1.length; i++) {
        pathx1.push(paths.c1[i].x);
        pathx2.push(paths.c2[i].x);
        pathy1.push(paths.c1[i].y);
        pathy2.push(paths.c2[i].y);
    }

    // Vertical profile
    bowlprop.height = Math.max(Math.max.apply(null, pathy1), Math.max.apply(null, pathy2));
    bowlprop.radius = Math.max(Math.max.apply(null, pathx1), Math.max.apply(null, pathx2));
    let y = -bowlprop.thick / 2;
    let i = 0;
    while (y < bowlprop.height) {
        const x = []; // x-values within this ring
        const yidx = []; // INDEX of y-values in this ring
        if (bowlprop.rings.length <= i) { // Need a new ring
            bowlprop.rings.push({ height: .75, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 });
        }
        for (let p = 0; p < pathx1.length; p++) {
            if (pathy1[p] > y && pathy1[p] < y + bowlprop.rings[i].height) { 
                x.push(pathx1[p]); yidx.push(p); 
            }
            if (pathy2[p] > y && pathy2[p] < y + bowlprop.rings[i].height) { 
                x.push(pathx2[p]); yidx.push(p); 
            }
            if (p > 1 && pathy1[p - 1] < y && pathy1[p] > y + bowlprop.rings[i].height) {
                // ring is too thin, curve points jump over it.. interpolate.
                const m = (pathy1[p] - pathy1[p - 1]) / (pathx1[p] - pathx1[p - 1]);
                x.push((y - pathy1[p - 1]) / m + pathx1[p - 1]);
                yidx.push(p);
            }
            if (p > 1 && pathy2[p - 1] < y && pathy2[p] > y + bowlprop.rings[i].height) {
                const m = (pathy2[p] - pathy2[p - 1]) / (pathx2[p] - pathx2[p - 1]);
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
    let rotation = 0;
    const trapzlist = [];
    const thetas = [];
    const maxthetaArr = [];
    for (let segidx = 0; segidx < bowlprop.rings[ringidx].seglen.length; segidx++) {
        maxthetaArr.push(Math.PI / bowlprop.rings[ringidx].segs * bowlprop.rings[ringidx].seglen[segidx]);
    }
    const maxtheta = Math.max.apply(null, maxthetaArr);
    for (let segidx = 0; segidx < bowlprop.rings[ringidx].seglen.length; segidx++) {
        thetas.push(rotation);
        const theta = Math.PI / bowlprop.rings[ringidx].segs * bowlprop.rings[ringidx].seglen[segidx];
        const x2 = bowlprop.rings[ringidx].xvals.max * Math.cos(theta) / Math.cos(maxtheta); // cosines make different width segments meet at endpoints
        const x1 = (bowlprop.rings[ringidx].xvals.min) * Math.cos(theta);
        const y2 = x2 * Math.tan(theta);
        const y1 = (bowlprop.rings[ringidx].xvals.min) * Math.sin(theta);
        let trapz = [{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x2, y: -y2 }, { x: x1, y: -y1 }];
        if (rotate) {
            const rtrapz = [];
            const toffset = bowlprop.rings[ringidx].theta; // + rotation;
            for (let p = 0; p < trapz.length; p++) {
                // Complex-number magic to rotate segment around
                const zx = Math.cos(theta + rotation + toffset); // exp(j*theta*i) with j=complex
                const zy = Math.sin(theta + rotation + toffset);

                const rx = trapz[p].x * zx - trapz[p].y * zy; // Basically complex number multiplication
                const ry = trapz[p].y * zx + trapz[p].x * zy;
                rtrapz.push({ x: rx, y: ry });
            }
            trapz = rtrapz;
        }
        rotation += theta * 2;
        trapzlist.push(trapz);
    }
    bowlprop.seltrapz = trapzlist;
    bowlprop.selthetas = thetas;
}