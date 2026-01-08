import { Vector2 } from "three";
import { defaultColors, defaultLens } from "../common.js";
import { calcRings, calcRingTrapz } from "../ring_calculator.js";

// All measurements now in mm
var canvasmm = 200;  // Was 8 inches (~203mm)
var width = 500;
var height = 500;
var scale = width / canvasmm;
var centerx = width / 2;
var view2d = {
    canvas: {
        width: width,
        height: width
    },
    centerx: centerx,
    bottom: height - 12.5 * scale,  // 12.7mm offset (was 0.5 inch)
    scale: scale
};

// All values now in mm
var bowlprop = {
    cpoint: [
        { x: centerx + 38 * scale, y: view2d.bottom },              // 38mm (was 1.5")
        { x: centerx + 50 * scale, y: view2d.bottom },              // 50mm (was 2.0")
        { x: centerx + 63 * scale, y: view2d.bottom - 63 * scale }, // 63mm (was 2.5")
        { x: centerx + 89 * scale, y: view2d.bottom - 76 * scale }, // 89mm, 76mm (was 3.5", 3.0")
    ],
    rings: [{ height: 12.5, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },  // ~0.5"
            { height: 12.5, segs: 14, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: 12.5, segs: 16, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: 12.5, segs: 18, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
    ],
    curvesegs: 6,
    thick: 6,      // 6mm (was 0.25")
    pad: 3,        // 3mm (was 0.125")
};

describe('calcRings', () => {
    it('calculates ring dimensions in mm', () => {
        const result = calcRings(view2d, bowlprop);
        // Results now in mm (roughly 25.4x the original inch values)
        expect(result.height).toBeGreaterThan(70);  // Was ~3" = ~76mm
        expect(result.radius).toBeGreaterThan(80);  // Was ~3.5" = ~89mm
        expect(result.usedrings).toBeGreaterThan(3);
        expect(result.rings.length).toBeGreaterThan(3);
        // xvals should be in mm range
        expect(result.rings[1].xvals.max).toBeGreaterThan(40);
        expect(result.rings[1].xvals.min).toBeGreaterThan(30);
    });
});

describe('calcRingTrapz', () => {
    it('calculates trapezoid shapes for ring segments', () => {
        // First ensure rings are calculated
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        const result = calcRingTrapz(bowlprop, 1, true);
        expect(result.seltrapz).toBeDefined();
        expect(result.selthetas).toBeDefined();
        // calcRingTrapz iterates over seglen.length, not segs
        expect(result.seltrapz.length).toBe(bowlprop.rings[1].seglen.length);
    });
});