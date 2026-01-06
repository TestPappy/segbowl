import { Vector2 } from "three";
import { defaultColors, defaultLens } from "../common.mjs";
import { calcRings, calcRingTrapz } from "../ring_calculator.mjs";

var canvasinches = 8;
var width = 500;
var height = 500;
var scale = width / canvasinches;
var centerx = width / 2;
var view2d = {
    canvas: {
        width: width,
        height: width
    },
    centerx: centerx,
    bottom: height - 0.5 * scale,
    scale: scale
};

var bowlprop = {
    cpoint: [
        { x: centerx + 1.5 * scale, y: view2d.bottom },
        { x: centerx + 2.0 * scale, y: view2d.bottom },
        { x: centerx + 2.5 * scale, y: view2d.bottom - 2.5 * scale },
        { x: centerx + 3.5 * scale, y: view2d.bottom - 3.0 * scale }, // This point is will also be start of next bezier curve
    ],
    rings: [{ height: .5, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: .5, segs: 14, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: .5, segs: 16, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: .5, segs: 18, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
    ],
    curvesegs: 6,
    thick: 0.25,
    pad: 0.125,
};

describe('calcRings', () => {
    it('calculates something with rings', () => {
        calcRings(view2d, bowlprop);
        expect(bowlprop.height).toBe(3.125);
        expect(bowlprop.radius).toBe(3.5);
        expect(bowlprop.usedrings).toBe(6);
        expect(bowlprop.rings.length).toBe(6);
        expect(Number.parseFloat(bowlprop.rings[1].xvals.max).toFixed(3)).toBe("2.257");
        expect(Number.parseFloat(bowlprop.rings[1].xvals.min).toFixed(3)).toBe("1.780");
        expect(Number.parseFloat(bowlprop.rings[3].xvals.max).toFixed(3)).toBe("2.607");
        expect(Number.parseFloat(bowlprop.rings[3].xvals.min).toFixed(3)).toBe("2.079");
        expect(Number.parseFloat(bowlprop.rings[5].xvals.max).toFixed(3)).toBe("3.625");
        expect(Number.parseFloat(bowlprop.rings[5].xvals.min).toFixed(3)).toBe("2.833");
    });
});

describe('calcRingTrapz', () => {
    it('calculates this', () => {
        calcRingTrapz(bowlprop, 1, true);
        console.log(bowlprop);
    });
});