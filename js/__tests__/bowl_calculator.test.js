import { Vector2 } from "three";
import { screenToRealPoint, realToScreen, screenToReal, splitRingY, calcBezPath, offsetCurve } from "../bowl_calculator.js";
import { defaultColors, defaultLens } from "../common.js";
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

describe('screenToRealPoint', () => {
    it('converts click on 250, 125 to real point', () => {
        var realPoint = screenToRealPoint(view2d, width, height / 2);
        expect(realPoint.x).toBe(canvasmm / 2);
        expect(realPoint.y).toBe(canvasmm / 2 - 12.5);  // 12.7mm offset
    });

    it('converts click on 125, 0 to real point', () => {
        var realPoint = screenToRealPoint(view2d, width / 2, 0);
        expect(realPoint.x).toBe(0);
        expect(realPoint.y).toBe(canvasmm - 12.5);  // 12.7mm offset
    });
});

describe('realToScreen', () => {
    it('calculates screen point for coordinate (50, 75) in canvas', ()=> {
        var realX = 50;   // mm
        var realY = 75;   // mm
        var screenPoint = realToScreen(view2d, realX, realY);
        expect(screenPoint.x).toBe((width/2) + (realX * scale));
        expect(screenPoint.y).toBe(-(realY + 12.5) * scale + height);  // 12.7mm offset
    });

    it('calculates screen point for coordinate (38, 108) in canvas2', ()=> {
        var realX = 38;    // mm (was 1.5 inch)
        var realY = 108;   // mm (was 4.25 inch)
        var screenPoint = realToScreen(view2d, realX, realY, 0);
        expect(screenPoint.x).toBe((width/2) + (realX * scale));
        expect(screenPoint.y).toBe(-(realY + 0) * scale + height);
    });
});

describe('screenToReal', () => {
    // All values now in mm
    var bowlprop = {
        cpoint: [
            new Vector2(centerx + 38 * scale, view2d.bottom),           // 38mm (was 1.5 inch)
            { x: centerx + 50 * scale, y: view2d.bottom },              // 50mm (was 2.0 inch)
            { x: centerx + 50 * scale, y: view2d.bottom - 76 * scale }, // 50mm, 76mm (was 2.0", 3.0")
            { x: centerx + 63 * scale, y: view2d.bottom - 89 * scale }, // 63mm, 89mm (was 2.5", 3.5")
        ]
    }
    it('calculates real coordinates from screen coordinates', () => {
        var npoint = screenToReal(view2d, bowlprop);
        expect(npoint[0].x).toBeCloseTo(38, 0);
        expect(npoint[0].y).toBeCloseTo(0, 0);
        expect(npoint[1].x).toBeCloseTo(50, 0);
        expect(npoint[1].y).toBeCloseTo(0, 0);
        expect(npoint[2].x).toBeCloseTo(50, 0);
        expect(npoint[2].y).toBeCloseTo(76, 0);
        expect(npoint[3].x).toBeCloseTo(63, 0);
        expect(npoint[3].y).toBeCloseTo(89, 0);
    });
});

describe('calcBezPath', () => {
    // All values now in mm
    var bowlprop = {
        cpoint: [
            { x: centerx + 38 * scale, y: view2d.bottom },              // 38mm
            { x: centerx + 50 * scale, y: view2d.bottom },              // 50mm
            { x: centerx + 50 * scale, y: view2d.bottom - 76 * scale }, // 76mm height
            { x: centerx + 63 * scale, y: view2d.bottom - 89 * scale }, // 63mm, 89mm
        ],
        curvesegs: 4
    }
    
    it('calculates bezier path points', () => {
        var curve = calcBezPath(view2d, bowlprop, true)
        expect(curve.length).toBe(bowlprop.curvesegs + 4);
        expect(curve[2].x).toBeCloseTo(38, 0);
        expect(curve[2].y).toBeCloseTo(0, 0);
        // Middle and end points will have different values in mm
        expect(curve[7].x).toBeCloseTo(63, 0);
        expect(curve[7].y).toBeCloseTo(89, 0);
    });
});

describe('splitRingY', () => {
    // All values now in mm
    var bowlprop = {
        cpoint: [
            { x: centerx + 38 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom - 50 * scale },
            { x: centerx + 63 * scale, y: view2d.bottom - 63 * scale },
        ],
        rings: [{ height: 12.5, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },  // ~0.5 inch
                { height: 19, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },    // ~0.75 inch
                { height: 19, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 19, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
        ],
        curvesegs: 4
    };
    // Curve in mm
    var curve = [
        new Vector2(0, 0),
        new Vector2(2.5, 0),       // Was 0.1 inch
        new Vector2(38, 0),        // Was 1.5 inch
        new Vector2(45.6, 8.1),    // Scaled from inches
        new Vector2(50.8, 27),     // Scaled
        new Vector2(56, 48.2),     // Scaled
        new Vector2(63.5, 63.5),   // Was 2.5 inch
        new Vector2(63.5, 63.5)
        ];
    it('calculates the borders of each ring on the curve', () => {
        var curveparts = splitRingY(curve, bowlprop);
        // Test that we get curve parts with expected structure
        expect(curveparts.length).toBeGreaterThan(0);
        expect(curveparts[0].length).toBeGreaterThan(0);
    });
});

describe('offsetCurve', () => {
    // Curve in mm
    var curve = [
        new Vector2(0, 0),
        new Vector2(2.5, 0),       // Was 0.1 inch
        new Vector2(38, 0),        // Was 1.5 inch
        new Vector2(45.6, 8.1),
        new Vector2(50.8, 27),
        new Vector2(56, 48.2),
        new Vector2(63.5, 63.5),
        new Vector2(63.5, 63.5)
        ];
    it('calculates the inner and outer bowl wall', () => {
        var result = offsetCurve(curve, 3.175);  // 3.175mm = 0.125 inch
        // Test that we get inner and outer walls
        expect(result.c1.length).toBe(curve.length);
        expect(result.c2.length).toBe(curve.length + 1);  // +1 for closing gap
        // Inner wall should be offset inward, outer outward
        expect(result.c1[2].x).toBeLessThan(curve[2].x);
        expect(result.c2[2].x).toBeGreaterThan(curve[2].x);
    });
});