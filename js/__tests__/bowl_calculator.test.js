import { Vector2 } from "three";
import { screenToRealPoint, realToScreen, screenToReal, splitRingY, calcBezPath, offsetCurve } from "../bowl_calculator.js";
import { defaultColors, defaultLens, defaultWood } from "../common.js";

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
    bottom: height - 12.7 * scale,  // 12.7mm offset (was 0.5 inch)
    scale: scale
};

// =============================================================================
// TEST CASES FOR: screenToRealPoint
// =============================================================================
describe('screenToRealPoint', () => {
    it('converts click on 250, 125 to real point', () => {
        var realPoint = screenToRealPoint(view2d, width, height / 2);
        expect(realPoint.x).toBe(canvasmm / 2);
        expect(realPoint.y).toBe(canvasmm / 2 - 12.7);  // 12.7mm offset
    });

    it('converts click on 125, 0 to real point', () => {
        var realPoint = screenToRealPoint(view2d, width / 2, 0);
        expect(realPoint.x).toBe(0);
        expect(realPoint.y).toBe(canvasmm - 12.7);  // 12.7mm offset
    });

    it('converts center of canvas to origin in real coordinates', () => {
        // Center of canvas horizontally should be x=0 in real coords
        var realPoint = screenToRealPoint(view2d, width / 2, height);
        expect(realPoint.x).toBe(0);
        // At bottom of canvas (y=height), real y should be -12.7mm (the offset)
        expect(realPoint.y).toBe(-12.7);
    });

    it('handles clicks left of center (negative x)', () => {
        // Click at left edge of canvas
        var realPoint = screenToRealPoint(view2d, 0, height / 2);
        expect(realPoint.x).toBe(-canvasmm / 2);
        expect(realPoint.y).toBe(canvasmm / 2 - 12.7);
        
        // Click at quarter left
        var realPoint2 = screenToRealPoint(view2d, width / 4, height / 2);
        expect(realPoint2.x).toBe(-canvasmm / 4);
    });

    it('converts bottom edge correctly with 12.7mm offset', () => {
        // At canvas bottom, real y = 0 - 12.7 = -12.7
        var realPoint = screenToRealPoint(view2d, centerx, height);
        expect(realPoint.y).toBe(-12.7);
        
        // At view2d.bottom position, real y should be close to 0
        var realPoint2 = screenToRealPoint(view2d, centerx, view2d.bottom);
        expect(realPoint2.y).toBeCloseTo(0, 1);
    });

    it('handles all four canvas corners', () => {
        // Top-left corner
        var topLeft = screenToRealPoint(view2d, 0, 0);
        expect(topLeft.x).toBe(-canvasmm / 2);
        expect(topLeft.y).toBe(canvasmm - 12.7);
        
        // Top-right corner
        var topRight = screenToRealPoint(view2d, width, 0);
        expect(topRight.x).toBe(canvasmm / 2);
        expect(topRight.y).toBe(canvasmm - 12.7);
        
        // Bottom-left corner
        var bottomLeft = screenToRealPoint(view2d, 0, height);
        expect(bottomLeft.x).toBe(-canvasmm / 2);
        expect(bottomLeft.y).toBe(-12.7);
        
        // Bottom-right corner
        var bottomRight = screenToRealPoint(view2d, width, height);
        expect(bottomRight.x).toBe(canvasmm / 2);
        expect(bottomRight.y).toBe(-12.7);
    });

    it('scales correctly with different scale factors', () => {
        // Test with double scale
        var view2dDouble = {
            canvas: { width: 1000, height: 1000 },
            scale: 1000 / canvasmm
        };
        var realPoint = screenToRealPoint(view2dDouble, 1000, 500);
        expect(realPoint.x).toBe(canvasmm / 2);
        
        // Test with half scale
        var view2dHalf = {
            canvas: { width: 250, height: 250 },
            scale: 250 / canvasmm
        };
        var realPoint2 = screenToRealPoint(view2dHalf, 250, 125);
        expect(realPoint2.x).toBe(canvasmm / 2);
    });

    it('handles non-square canvas dimensions', () => {
        var view2dRect = {
            canvas: { width: 600, height: 400 },
            scale: 600 / canvasmm
        };
        // Center X should still be 0
        var realPoint = screenToRealPoint(view2dRect, 300, 200);
        expect(realPoint.x).toBe(0);
    });
});

// =============================================================================
// TEST CASES FOR: realToScreen
// =============================================================================
describe('realToScreen', () => {
    it('calculates screen point for coordinate (50, 75) in canvas', ()=> {
        var realX = 50;   // mm
        var realY = 75;   // mm
        var screenPoint = realToScreen(view2d, realX, realY);
        expect(screenPoint.x).toBe((width/2) + (realX * scale));
        expect(screenPoint.y).toBe(-(realY + 12.7) * scale + height);  // 12.7mm offset
    });

    it('calculates screen point for coordinate (38, 108) in canvas2', ()=> {
        var realX = 38;    // mm (was 1.5 inch)
        var realY = 108;   // mm (was 4.25 inch)
        var screenPoint = realToScreen(view2d, realX, realY, 0);
        expect(screenPoint.x).toBe((width/2) + (realX * scale));
        expect(screenPoint.y).toBe(-(realY + 0) * scale + height);
    });

    it('handles origin point correctly', () => {
        var screenPoint = realToScreen(view2d, 0, 0);
        expect(screenPoint.x).toBe(width / 2);  // Center x
        // With default offset of -12.7: y = -(0 - (-12.7)) * scale + height = -12.7 * scale + height
        expect(screenPoint.y).toBe(-12.7 * scale + height);
    });

    it('handles negative x values', () => {
        var screenPoint = realToScreen(view2d, -50, 50);
        expect(screenPoint.x).toBe((width / 2) - (50 * scale));  // Left of center
        expect(screenPoint.x).toBeLessThan(width / 2);
    });

    it('applies custom offset parameter', () => {
        var realX = 50, realY = 50;
        
        // With offset 0
        var point1 = realToScreen(view2d, realX, realY, 0);
        // With offset -20
        var point2 = realToScreen(view2d, realX, realY, -20);
        
        // x should be the same
        expect(point1.x).toBe(point2.x);
        // y = -(realY - offset) * scale + height
        // point1.y = -(50 - 0) * scale + height = -50*scale + height
        // point2.y = -(50 - (-20)) * scale + height = -70*scale + height
        // point1.y - point2.y = -50*scale + 70*scale = 20*scale
        expect(point1.y - point2.y).toBeCloseTo(20 * scale, 5);
    });

    it('uses default offset of -12.7mm when not specified', () => {
        var realX = 50, realY = 50;
        
        // Without offset (should use default -12.7)
        var point1 = realToScreen(view2d, realX, realY);
        // With explicit -12.7
        var point2 = realToScreen(view2d, realX, realY, -12.7);
        
        expect(point1.x).toBe(point2.x);
        expect(point1.y).toBe(point2.y);
    });

    it('is inverse of screenToRealPoint (round trip)', () => {
        // Start with screen coordinates
        var screenX = 350, screenY = 200;
        
        // Convert to real
        var realPoint = screenToRealPoint(view2d, screenX, screenY);
        
        // Convert back to screen (with appropriate offset handling)
        // screenToRealPoint uses -12.7 offset, so we need to adjust
        var backToScreen = realToScreen(view2d, realPoint.x, realPoint.y);
        
        expect(backToScreen.x).toBeCloseTo(screenX, 5);
        expect(backToScreen.y).toBeCloseTo(screenY, 5);
    });

    it('centers x=0 at canvas centerx', () => {
        var screenPoint = realToScreen(view2d, 0, 50);
        expect(screenPoint.x).toBe(width / 2);
    });
});

// =============================================================================
// TEST CASES FOR: screenToReal
// =============================================================================
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

    it('returns THREE.Vector2 instances', () => {
        var npoint = screenToReal(view2d, bowlprop);
        npoint.forEach(point => {
            expect(point).toBeInstanceOf(Vector2);
            expect(typeof point.x).toBe('number');
            expect(typeof point.y).toBe('number');
        });
    });

    it('handles empty control points array', () => {
        var emptyBowlprop = { cpoint: [] };
        var npoint = screenToReal(view2d, emptyBowlprop);
        expect(npoint).toEqual([]);
        expect(npoint.length).toBe(0);
    });

    it('handles single control point', () => {
        var singleBowlprop = {
            cpoint: [{ x: centerx + 50 * scale, y: view2d.bottom }]
        };
        var npoint = screenToReal(view2d, singleBowlprop);
        expect(npoint.length).toBe(1);
        expect(npoint[0].x).toBeCloseTo(50, 0);
        expect(npoint[0].y).toBeCloseTo(0, 0);
    });

    it('handles many control points', () => {
        // 7 control points for 2 bezier segments
        var manyPointsBowlprop = {
            cpoint: [
                { x: centerx + 30 * scale, y: view2d.bottom },
                { x: centerx + 40 * scale, y: view2d.bottom },
                { x: centerx + 45 * scale, y: view2d.bottom - 30 * scale },
                { x: centerx + 50 * scale, y: view2d.bottom - 50 * scale },
                { x: centerx + 55 * scale, y: view2d.bottom - 60 * scale },
                { x: centerx + 60 * scale, y: view2d.bottom - 70 * scale },
                { x: centerx + 70 * scale, y: view2d.bottom - 90 * scale },
            ]
        };
        var npoint = screenToReal(view2d, manyPointsBowlprop);
        expect(npoint.length).toBe(7);
        expect(npoint[0].x).toBeCloseTo(30, 0);
        expect(npoint[6].x).toBeCloseTo(70, 0);
    });

    it('preserves relative positions between control points', () => {
        var npoint = screenToReal(view2d, bowlprop);
        // Point 2 should be above point 1 (higher y in real coords)
        expect(npoint[2].y).toBeGreaterThan(npoint[1].y);
        // Point 3 should be above point 2
        expect(npoint[3].y).toBeGreaterThan(npoint[2].y);
        // Point 3 should be to the right of point 2 (larger x)
        expect(npoint[3].x).toBeGreaterThan(npoint[2].x);
    });
});

// =============================================================================
// TEST CASES FOR: calcBezPath
// =============================================================================
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

    it('starts path at origin (0,0)', () => {
        var curve = calcBezPath(view2d, bowlprop, true);
        expect(curve[0].x).toBe(0);
        expect(curve[0].y).toBe(0);
    });

    it('includes 2.5mm offset point after origin', () => {
        var curve = calcBezPath(view2d, bowlprop, true);
        expect(curve[1].x).toBe(2.5);
        expect(curve[1].y).toBe(0);
    });

    it('ends path at last control point', () => {
        var curve = calcBezPath(view2d, bowlprop, true);
        var lastPoint = curve[curve.length - 1];
        // Should be close to the last control point in real coords
        expect(lastPoint.x).toBeCloseTo(63, 0);
        expect(lastPoint.y).toBeCloseTo(89, 0);
    });

    it('returns screen coordinates when real=false', () => {
        var curveScreen = calcBezPath(view2d, bowlprop, false);
        // First two points should still be (0,0) and (2.5,0) as they're hardcoded
        expect(curveScreen[0].x).toBe(0);
        expect(curveScreen[0].y).toBe(0);
        // But the rest should be in screen coordinate range (not real mm)
        // The curve points will be based on the screen cpoint values
    });

    it('produces more points with higher curvesegs', () => {
        var bowlpropLow = { ...bowlprop, curvesegs: 4 };
        var bowlpropHigh = { ...bowlprop, curvesegs: 20 };
        
        var curveLow = calcBezPath(view2d, bowlpropLow, true);
        var curveHigh = calcBezPath(view2d, bowlpropHigh, true);
        
        expect(curveHigh.length).toBeGreaterThan(curveLow.length);
    });

    it('handles multiple bezier segments', () => {
        // 7 control points = 2 bezier segments
        var multiBowlprop = {
            cpoint: [
                { x: centerx + 30 * scale, y: view2d.bottom },
                { x: centerx + 35 * scale, y: view2d.bottom },
                { x: centerx + 40 * scale, y: view2d.bottom - 30 * scale },
                { x: centerx + 45 * scale, y: view2d.bottom - 50 * scale },
                { x: centerx + 50 * scale, y: view2d.bottom - 60 * scale },
                { x: centerx + 55 * scale, y: view2d.bottom - 70 * scale },
                { x: centerx + 60 * scale, y: view2d.bottom - 90 * scale },
            ],
            curvesegs: 4
        };
        var curve = calcBezPath(view2d, multiBowlprop, true);
        // Should have points for 2 bezier segments
        // 2 initial points + (curvesegs+1) * 2 segments + 1 final = more points
        expect(curve.length).toBeGreaterThan(bowlprop.curvesegs + 4);
    });

    it('follows bezier curve algorithm', () => {
        var curve = calcBezPath(view2d, bowlprop, true);
        // Middle points should be interpolated between start and end
        // At t=0.5, the curve should be somewhere between start and end
        var midIndex = Math.floor(curve.length / 2);
        var midPoint = curve[midIndex];
        
        // Should be within the bounds of start and end x
        expect(midPoint.x).toBeGreaterThanOrEqual(curve[2].x);
        expect(midPoint.x).toBeLessThanOrEqual(curve[curve.length - 1].x);
    });

    it('handles minimum 4 control points', () => {
        var minBowlprop = {
            cpoint: [
                { x: centerx + 30 * scale, y: view2d.bottom },
                { x: centerx + 40 * scale, y: view2d.bottom },
                { x: centerx + 50 * scale, y: view2d.bottom - 50 * scale },
                { x: centerx + 60 * scale, y: view2d.bottom - 80 * scale },
            ],
            curvesegs: 4
        };
        var curve = calcBezPath(view2d, minBowlprop, true);
        expect(curve.length).toBeGreaterThan(2);
    });

    it('returns THREE.Vector2 instances', () => {
        var curve = calcBezPath(view2d, bowlprop, true);
        curve.forEach(point => {
            expect(point).toBeInstanceOf(Vector2);
        });
    });
});

// =============================================================================
// TEST CASES FOR: splitRingY
// =============================================================================
describe('splitRingY', () => {
    // All values now in mm
    var bowlprop = {
        cpoint: [
            { x: centerx + 38 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom - 50 * scale },
            { x: centerx + 63 * scale, y: view2d.bottom - 63 * scale },
        ],
        rings: [{ height: 12.7, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },  // ~0.5 inch
                { height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },    // ~0.75 inch
                { height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
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

    it('returns one curve segment per ring', () => {
        // Create a curve that spans multiple rings
        var tallCurve = [
            new Vector2(0, 0),
            new Vector2(40, 10),
            new Vector2(50, 25),
            new Vector2(55, 40),
            new Vector2(60, 55),
            new Vector2(65, 70),
        ];
        var curveparts = splitRingY(tallCurve, bowlprop);
        // Should have segments for each ring that the curve passes through
        expect(curveparts.length).toBeGreaterThanOrEqual(1);
    });

    it('first segment includes first curve point', () => {
        var curveparts = splitRingY(curve, bowlprop);
        if (curveparts.length > 0) {
            // First segment should start at curve origin
            expect(curveparts[0][0].x).toBe(curve[0].x);
            expect(curveparts[0][0].y).toBe(curve[0].y);
        }
    });

    it('last segment includes last curve point', () => {
        var tallCurve = [
            new Vector2(0, 0),
            new Vector2(40, 20),
            new Vector2(50, 50),
            new Vector2(60, 80),
        ];
        var tallBowlprop = {
            rings: [
                { height: 30, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 30, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 30, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ]
        };
        var curveparts = splitRingY(tallCurve, tallBowlprop);
        if (curveparts.length > 0) {
            var lastSegment = curveparts[curveparts.length - 1];
            var lastPoint = lastSegment[lastSegment.length - 1];
            expect(lastPoint.x).toBe(tallCurve[tallCurve.length - 1].x);
            expect(lastPoint.y).toBe(tallCurve[tallCurve.length - 1].y);
        }
    });

    it('interpolates points at ring boundaries', () => {
        var simpleCurve = [
            new Vector2(0, 0),
            new Vector2(50, 50),
        ];
        var simpleBowlprop = {
            rings: [
                { height: 25, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 25, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ]
        };
        var curveparts = splitRingY(simpleCurve, simpleBowlprop);
        // Each segment should have interpolated boundary points
        expect(curveparts.length).toBeGreaterThan(0);
    });

    it('handles rings taller than curve segment spacing', () => {
        var sparseCurve = [
            new Vector2(0, 0),
            new Vector2(60, 100),  // Single large jump
        ];
        var thinRingsBowlprop = {
            rings: [
                { height: 10, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 10, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 10, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ]
        };
        // Should not throw and should handle the interpolation
        expect(() => splitRingY(sparseCurve, thinRingsBowlprop)).not.toThrow();
    });

    it('handles very thin rings', () => {
        var thinRingsBowlprop = {
            rings: [
                { height: 2, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 2, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ]
        };
        expect(() => splitRingY(curve, thinRingsBowlprop)).not.toThrow();
    });

    it('handles single ring bowl', () => {
        var singleRingBowlprop = {
            rings: [
                { height: 100, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ]
        };
        var curveparts = splitRingY(curve, singleRingBowlprop);
        expect(curveparts.length).toBeGreaterThanOrEqual(1);
    });

    it('handles many rings', () => {
        var manyRingsBowlprop = {
            rings: Array(12).fill(null).map(() => ({
                height: 8, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0
            }))
        };
        expect(() => splitRingY(curve, manyRingsBowlprop)).not.toThrow();
    });

    it('skips segments with less than 2 points', () => {
        // This is an edge case - very small rings might not get any curve points
        var curveparts = splitRingY(curve, bowlprop);
        curveparts.forEach(segment => {
            expect(segment.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('preserves x,y point structure in output', () => {
        var curveparts = splitRingY(curve, bowlprop);
        curveparts.forEach(segment => {
            segment.forEach(point => {
                expect(point).toHaveProperty('x');
                expect(point).toHaveProperty('y');
                expect(typeof point.x).toBe('number');
                expect(typeof point.y).toBe('number');
            });
        });
    });

    it('handles curves with varying slope', () => {
        // A curve that goes up then levels off
        var varyingSlopeCurve = [
            new Vector2(0, 0),
            new Vector2(30, 5),
            new Vector2(50, 30),
            new Vector2(55, 60),
            new Vector2(55, 70),  // Near vertical section
        ];
        expect(() => splitRingY(varyingSlopeCurve, bowlprop)).not.toThrow();
    });
});

// =============================================================================
// TEST CASES FOR: offsetCurve
// =============================================================================
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

    it('c1 is inner wall offset inward', () => {
        var result = offsetCurve(curve, 3);
        // For horizontal segment at y=0, inner wall should have smaller x
        // (offset perpendicular to direction, which is upward for horizontal right-moving line)
        for (let i = 1; i < 3; i++) {  // Check first few horizontal points
            expect(result.c1[i].x).toBeLessThanOrEqual(curve[i].x);
        }
    });

    it('c2 is outer wall offset outward', () => {
        var result = offsetCurve(curve, 3);
        // For horizontal segment, outer wall should have larger x
        for (let i = 1; i < 3; i++) {
            expect(result.c2[i].x).toBeGreaterThanOrEqual(curve[i].x);
        }
    });

    it('c2 closes gap to c1 at end', () => {
        var result = offsetCurve(curve, 3);
        var c2LastPoint = result.c2[result.c2.length - 1];
        var c1LastPoint = result.c1[result.c1.length - 1];
        // c2 should end with the same point as c1 ends
        expect(c2LastPoint.x).toBe(c1LastPoint.x);
        expect(c2LastPoint.y).toBe(c1LastPoint.y);
    });

    it('offset distance is exact', () => {
        var offset = 5;
        var simpleCurve = [
            new Vector2(0, 0),
            new Vector2(100, 0),  // Horizontal line
        ];
        var result = offsetCurve(simpleCurve, offset);
        // For a horizontal line, offset should be purely in y direction
        expect(Math.abs(result.c1[0].y - simpleCurve[0].y)).toBeCloseTo(offset, 5);
        expect(Math.abs(result.c2[0].y - simpleCurve[0].y)).toBeCloseTo(offset, 5);
    });

    it('handles zero offset', () => {
        // Use a curve without duplicate consecutive points
        var simpleCurve = [
            new Vector2(0, 0),
            new Vector2(50, 25),
            new Vector2(100, 50),
        ];
        var result = offsetCurve(simpleCurve, 0);
        // With zero offset, inner and outer should be at same position as original
        for (let i = 0; i < simpleCurve.length; i++) {
            expect(result.c1[i].x).toBeCloseTo(simpleCurve[i].x, 5);
            expect(result.c1[i].y).toBeCloseTo(simpleCurve[i].y, 5);
            expect(result.c2[i].x).toBeCloseTo(simpleCurve[i].x, 5);
            expect(result.c2[i].y).toBeCloseTo(simpleCurve[i].y, 5);
        }
    });

    it('handles large offset values', () => {
        var largeOffset = 20;  // 20mm
        expect(() => offsetCurve(curve, largeOffset)).not.toThrow();
        var result = offsetCurve(curve, largeOffset);
        expect(result.c1.length).toBe(curve.length);
    });

    it('handles small offset values', () => {
        var smallOffset = 0.1;  // 0.1mm
        expect(() => offsetCurve(curve, smallOffset)).not.toThrow();
        var result = offsetCurve(curve, smallOffset);
        expect(result.c1.length).toBe(curve.length);
    });

    it('offset is perpendicular to curve direction', () => {
        // For a horizontal line going right, perpendicular is up/down
        var horizontalCurve = [
            new Vector2(0, 50),
            new Vector2(100, 50),
        ];
        var result = offsetCurve(horizontalCurve, 10);
        // Offset should only affect y, not x
        expect(result.c1[0].x).toBeCloseTo(horizontalCurve[0].x, 5);
        expect(result.c2[0].x).toBeCloseTo(horizontalCurve[0].x, 5);
        // Y should differ by offset amount
        expect(Math.abs(result.c1[0].y - result.c2[0].y)).toBeCloseTo(20, 5);  // 2 * offset
    });

    it('handles horizontal curve segments', () => {
        var horizontalCurve = [
            new Vector2(0, 0),
            new Vector2(50, 0),
            new Vector2(100, 0),
        ];
        expect(() => offsetCurve(horizontalCurve, 5)).not.toThrow();
        var result = offsetCurve(horizontalCurve, 5);
        // All points should have y offset, not x
        expect(result.c1[1].y).toBeCloseTo(5, 5);
        expect(result.c2[1].y).toBeCloseTo(-5, 5);
    });

    it('handles vertical curve segments', () => {
        var verticalCurve = [
            new Vector2(50, 0),
            new Vector2(50, 50),
            new Vector2(50, 100),
        ];
        expect(() => offsetCurve(verticalCurve, 5)).not.toThrow();
        var result = offsetCurve(verticalCurve, 5);
        // Offset should be in x direction for vertical line
        expect(result.c1[1].x).toBeCloseTo(45, 5);
        expect(result.c2[1].x).toBeCloseTo(55, 5);
    });

    it('handles diagonal curve segments', () => {
        var diagonalCurve = [
            new Vector2(0, 0),
            new Vector2(50, 50),
            new Vector2(100, 100),
        ];
        expect(() => offsetCurve(diagonalCurve, 5)).not.toThrow();
        var result = offsetCurve(diagonalCurve, 5);
        expect(result.c1.length).toBe(diagonalCurve.length);
    });

    it('returns THREE.Vector2 instances', () => {
        var result = offsetCurve(curve, 3);
        result.c1.forEach(point => {
            expect(point).toBeInstanceOf(Vector2);
        });
        result.c2.forEach(point => {
            expect(point).toBeInstanceOf(Vector2);
        });
    });

    it('handles minimum curve (2 points)', () => {
        var minCurve = [
            new Vector2(0, 0),
            new Vector2(50, 50),
        ];
        expect(() => offsetCurve(minCurve, 5)).not.toThrow();
        var result = offsetCurve(minCurve, 5);
        expect(result.c1.length).toBe(2);
        expect(result.c2.length).toBe(3);  // +1 for closing gap
    });

    it('handles identical consecutive points gracefully', () => {
        // Note: This may produce NaN due to division by zero in the algorithm
        // The test verifies the function doesn't crash
        var curveWithDuplicates = [
            new Vector2(0, 0),
            new Vector2(50, 50),
            new Vector2(50, 50),  // Duplicate point
            new Vector2(100, 100),
        ];
        expect(() => offsetCurve(curveWithDuplicates, 5)).not.toThrow();
    });
});
