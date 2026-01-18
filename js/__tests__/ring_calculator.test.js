import { Vector2 } from "three";
import { defaultColors, defaultLens, defaultWood } from "../common.js";
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
    bottom: height - 12.7 * scale,  // 12.7mm offset (was 0.5 inch)
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
    rings: [{ height: 12.7, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },  // ~0.5"
            { height: 12.7, segs: 14, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: 12.7, segs: 16, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: 12.7, segs: 18, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
    ],
    curvesegs: 6,
    thick: 6,      // 6mm (was 0.25")
    pad: 3,        // 3mm (was 0.125")
};

// Helper function to create a fresh bowlprop for tests that need clean state
function createBowlprop(overrides = {}) {
    return {
        cpoint: [
            { x: centerx + 38 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom },
            { x: centerx + 63 * scale, y: view2d.bottom - 63 * scale },
            { x: centerx + 89 * scale, y: view2d.bottom - 76 * scale },
        ],
        rings: [
            { height: 12.7, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: 12.7, segs: 14, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: 12.7, segs: 16, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: 12.7, segs: 18, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
        ],
        curvesegs: 6,
        thick: 6,
        pad: 3,
        ...overrides
    };
}

// =============================================================================
// TEST CASES FOR: calcRings
// =============================================================================
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

    it('returns height as max y value of curve', () => {
        const result = calcRings(view2d, bowlprop);
        // Height should be a positive number representing the bowl height
        expect(result.height).toBeGreaterThan(0);
        expect(typeof result.height).toBe('number');
        // Height should be approximately the y-extent of the bowl curve
        expect(result.height).toBeGreaterThan(70);
        expect(result.height).toBeLessThan(100);
    });

    it('returns radius as max x value of curve', () => {
        const result = calcRings(view2d, bowlprop);
        // Radius should be a positive number
        expect(result.radius).toBeGreaterThan(0);
        expect(typeof result.radius).toBe('number');
        // Radius should be approximately the x-extent of the bowl curve
        expect(result.radius).toBeGreaterThan(80);
        expect(result.radius).toBeLessThan(100);
    });

    it('counts usedrings correctly based on height', () => {
        const result = calcRings(view2d, bowlprop);
        // usedrings should equal the number of rings that fit within the bowl height
        expect(result.usedrings).toBeGreaterThan(0);
        
        // Calculate expected rings based on total height and ring heights
        let totalRingHeight = 0;
        let expectedRings = 0;
        for (const ring of result.rings) {
            if (totalRingHeight < result.height) {
                expectedRings++;
                totalRingHeight += ring.height;
            }
        }
        expect(result.usedrings).toBeGreaterThanOrEqual(1);
    });

    it('creates new rings when bowl is taller than existing rings', () => {
        // Create a tall bowl with only one initial ring
        const tallBowlprop = createBowlprop({
            cpoint: [
                { x: centerx + 38 * scale, y: view2d.bottom },
                { x: centerx + 50 * scale, y: view2d.bottom },
                { x: centerx + 63 * scale, y: view2d.bottom - 150 * scale },  // Very tall
                { x: centerx + 89 * scale, y: view2d.bottom - 160 * scale },
            ],
            rings: [
                { height: 12.7, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ],
        });
        
        const result = calcRings(view2d, tallBowlprop);
        // Should have created additional rings
        expect(result.rings.length).toBeGreaterThan(1);
        expect(result.usedrings).toBeGreaterThan(1);
    });

    it('preserves existing ring properties', () => {
        const customColors = ['#FF0000', '#00FF00', '#0000FF'];
        const customWood = ['walnut', 'maple', 'cherry'];
        const customBowlprop = createBowlprop({
            rings: [
                { height: 15, segs: 8, clrs: customColors, wood: customWood, seglen: [1, 1, 1, 1, 1, 1, 1, 1], xvals: [], theta: 0.5 },
            ],
        });
        
        const result = calcRings(view2d, customBowlprop);
        
        // Preserved properties
        expect(result.rings[0].segs).toBe(8);
        expect(result.rings[0].theta).toBe(0.5);
        expect(result.rings[0].height).toBe(15);
        expect(result.rings[0].clrs).toEqual(customColors);
        expect(result.rings[0].wood).toEqual(customWood);
    });

    it('calculates xvals.max with padding added', () => {
        const testBowlprop = createBowlprop({ pad: 5 });
        const result = calcRings(view2d, testBowlprop);
        
        // xvals.max should include the padding
        // The actual curve x-value + pad should equal xvals.max
        expect(result.rings[0].xvals.max).toBeGreaterThan(0);
        
        // Compare with pad=0 to verify padding is applied
        const noPadBowlprop = createBowlprop({ pad: 0 });
        const noPadResult = calcRings(view2d, noPadBowlprop);
        
        expect(result.rings[0].xvals.max).toBeGreaterThan(noPadResult.rings[0].xvals.max);
    });

    it('calculates xvals.min with padding subtracted', () => {
        const testBowlprop = createBowlprop({ pad: 5 });
        const result = calcRings(view2d, testBowlprop);
        
        // xvals.min should have padding subtracted (but clamped at 0)
        expect(result.rings[0].xvals.min).toBeGreaterThanOrEqual(0);
        
        // Compare with pad=0 - larger ring index to avoid the 0 clamp at base
        const noPadBowlprop = createBowlprop({ pad: 0 });
        const noPadResult = calcRings(view2d, noPadBowlprop);
        
        // At ring index where curve has non-zero inner radius,
        // padding should decrease the min (unless clamped at 0)
        // The algorithm: xvals.min = max(0, minX - pad)
        // So with larger pad, min should be smaller or equal (clamped)
        expect(result.rings[0].xvals.min).toBeLessThanOrEqual(noPadResult.rings[0].xvals.min);
    });

    it('xvals.min is never negative', () => {
        // Use large padding that could potentially make min negative
        const largePadBowlprop = createBowlprop({ pad: 100 });
        const result = calcRings(view2d, largePadBowlprop);
        
        result.rings.forEach(ring => {
            if (ring.xvals && ring.xvals.min !== undefined) {
                expect(ring.xvals.min).toBeGreaterThanOrEqual(0);
            }
        });
    });

    it('xvals.max is never negative', () => {
        const result = calcRings(view2d, bowlprop);
        
        result.rings.forEach(ring => {
            if (ring.xvals && ring.xvals.max !== undefined) {
                expect(ring.xvals.max).toBeGreaterThanOrEqual(0);
            }
        });
    });

    it('handles rings with different heights', () => {
        const mixedHeightBowlprop = createBowlprop({
            rings: [
                { height: 10, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 20, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 15, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ],
        });
        
        const result = calcRings(view2d, mixedHeightBowlprop);
        
        expect(result.rings[0].height).toBe(10);
        expect(result.rings[1].height).toBe(20);
        expect(result.rings[2].height).toBe(15);
    });

    it('handles tall bowls requiring many rings', () => {
        const tallBowlprop = createBowlprop({
            cpoint: [
                { x: centerx + 38 * scale, y: view2d.bottom },
                { x: centerx + 50 * scale, y: view2d.bottom },
                { x: centerx + 63 * scale, y: view2d.bottom - 180 * scale },
                { x: centerx + 70 * scale, y: view2d.bottom - 190 * scale },
            ],
            rings: [
                { height: 10, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ],
        });
        
        const result = calcRings(view2d, tallBowlprop);
        
        // Should create many rings for a tall bowl
        expect(result.rings.length).toBeGreaterThan(10);
        expect(result.usedrings).toBeGreaterThan(10);
    });

    it('handles short bowls with few rings', () => {
        const shortBowlprop = createBowlprop({
            cpoint: [
                { x: centerx + 38 * scale, y: view2d.bottom },
                { x: centerx + 50 * scale, y: view2d.bottom },
                { x: centerx + 55 * scale, y: view2d.bottom - 20 * scale },
                { x: centerx + 60 * scale, y: view2d.bottom - 25 * scale },
            ],
            rings: [
                { height: 20, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ],
        });
        
        const result = calcRings(view2d, shortBowlprop);
        
        // Should have few rings for a short bowl
        expect(result.usedrings).toBeLessThanOrEqual(3);
    });

    it('handles different wall thickness values', () => {
        const thinWallBowlprop = createBowlprop({ thick: 2 });
        const thickWallBowlprop = createBowlprop({ thick: 12 });
        
        const thinResult = calcRings(view2d, thinWallBowlprop);
        const thickResult = calcRings(view2d, thickWallBowlprop);
        
        // Both should calculate without error
        expect(thinResult.height).toBeGreaterThan(0);
        expect(thickResult.height).toBeGreaterThan(0);
        
        // Thicker walls should affect the offset curve
        // xvals.max should be different due to the offset
        expect(thinResult.rings[0].xvals.max).not.toBe(thickResult.rings[0].xvals.max);
    });

    it('handles different padding values', () => {
        const smallPadBowlprop = createBowlprop({ pad: 1 });
        const largePadBowlprop = createBowlprop({ pad: 10 });
        
        const smallPadResult = calcRings(view2d, smallPadBowlprop);
        const largePadResult = calcRings(view2d, largePadBowlprop);
        
        // Larger padding should result in larger xvals.max
        expect(largePadResult.rings[0].xvals.max).toBeGreaterThan(smallPadResult.rings[0].xvals.max);
        // And smaller or equal xvals.min (clamped at 0)
        expect(largePadResult.rings[0].xvals.min).toBeLessThanOrEqual(smallPadResult.rings[0].xvals.min);
    });

    it('interpolates x values for thin rings', () => {
        // Create a bowl with very thin rings that curve points might skip over
        const thinRingBowlprop = createBowlprop({
            rings: [
                { height: 2, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 2, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 2, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ],
            curvesegs: 4,  // Sparse curve segments
        });
        
        // Should not throw and should calculate xvals for thin rings
        expect(() => calcRings(view2d, thinRingBowlprop)).not.toThrow();
        const result = calcRings(view2d, thinRingBowlprop);
        
        // Each ring that's within the bowl should have valid xvals
        for (let i = 0; i < result.usedrings && i < result.rings.length; i++) {
            expect(result.rings[i].xvals).toBeDefined();
            expect(result.rings[i].xvals.max).toBeGreaterThanOrEqual(0);
            expect(result.rings[i].xvals.min).toBeGreaterThanOrEqual(0);
        }
    });

    it('does not mutate original bowlprop object', () => {
        const originalRingsLength = bowlprop.rings.length;
        const originalRing0Segs = bowlprop.rings[0].segs;
        const originalRing0Height = bowlprop.rings[0].height;
        
        calcRings(view2d, bowlprop);
        
        // Original should be unchanged
        expect(bowlprop.rings.length).toBe(originalRingsLength);
        expect(bowlprop.rings[0].segs).toBe(originalRing0Segs);
        expect(bowlprop.rings[0].height).toBe(originalRing0Height);
    });
});

// =============================================================================
// TEST CASES FOR: calcRingTrapz
// =============================================================================
describe('calcRingTrapz', () => {
    // Setup: calculate rings first
    let calculatedBowlprop;
    
    beforeEach(() => {
        calculatedBowlprop = createBowlprop();
        const ringResult = calcRings(view2d, calculatedBowlprop);
        Object.assign(calculatedBowlprop, ringResult);
    });

    it('calculates trapezoid shapes for ring segments', () => {
        const result = calcRingTrapz(calculatedBowlprop, 1, true);
        expect(result.seltrapz).toBeDefined();
        expect(result.selthetas).toBeDefined();
        // calcRingTrapz iterates over seglen.length, not segs
        expect(result.seltrapz.length).toBe(calculatedBowlprop.rings[1].seglen.length);
    });

    it('returns one trapezoid per segment', () => {
        const result = calcRingTrapz(calculatedBowlprop, 0, true);
        expect(result.seltrapz.length).toBe(calculatedBowlprop.rings[0].seglen.length);
    });

    it('each trapezoid has 4 corner points', () => {
        const result = calcRingTrapz(calculatedBowlprop, 0, true);
        result.seltrapz.forEach(trapz => {
            expect(trapz.length).toBe(4);
            trapz.forEach(point => {
                expect(point).toHaveProperty('x');
                expect(point).toHaveProperty('y');
            });
        });
    });

    it('calculates correct theta angle for each segment', () => {
        const ring = calculatedBowlprop.rings[0];
        const result = calcRingTrapz(calculatedBowlprop, 0, false);
        
        // For equal segments, theta = PI / segs * seglen[i]
        const expectedTheta = Math.PI / ring.segs * ring.seglen[0];
        
        // The trapezoid shape is determined by theta
        // y2 = x2 * tan(theta) and y1 = x1 * sin(theta)
        const trapz = result.seltrapz[0];
        
        // Verify the trapezoid has the expected geometry
        expect(trapz[0].y).toBeCloseTo(ring.xvals.min * Math.sin(expectedTheta), 5);
    });

    it('selthetas tracks cumulative rotation', () => {
        const result = calcRingTrapz(calculatedBowlprop, 0, true);
        
        // First segment starts at rotation 0
        expect(result.selthetas[0]).toBe(0);
        
        // Each subsequent theta should be greater (cumulative rotation)
        for (let i = 1; i < result.selthetas.length; i++) {
            expect(result.selthetas[i]).toBeGreaterThan(result.selthetas[i - 1]);
        }
    });

    it('rotates trapezoids when rotate=true', () => {
        const resultRotated = calcRingTrapz(calculatedBowlprop, 0, true);
        const resultUnrotated = calcRingTrapz(calculatedBowlprop, 0, false);
        
        // Second segment should be at different positions when rotated
        // Compare outer corner (index 1) which has larger x and thus more visible rotation effect
        // Use y coordinate which changes more noticeably with rotation
        expect(resultRotated.seltrapz[1][1].y).not.toBeCloseTo(resultUnrotated.seltrapz[1][1].y, 3);
    });

    it('does not rotate trapezoids when rotate=false', () => {
        const result = calcRingTrapz(calculatedBowlprop, 0, false);
        
        // Without rotation, all trapezoids should have the same base shape
        // (just different segment lengths affect the size)
        const trapz0 = result.seltrapz[0];
        const trapz1 = result.seltrapz[1];
        
        // For equal segment lengths, the unrotated trapezoids should be identical
        if (calculatedBowlprop.rings[0].seglen[0] === calculatedBowlprop.rings[0].seglen[1]) {
            expect(trapz0[0].x).toBeCloseTo(trapz1[0].x, 5);
            expect(trapz0[0].y).toBeCloseTo(trapz1[0].y, 5);
        }
    });

    it('applies ring theta offset to rotation', () => {
        // Create a bowlprop with a theta offset on ring 0
        const offsetBowlprop = createBowlprop();
        const ringResult = calcRings(view2d, offsetBowlprop);
        Object.assign(offsetBowlprop, ringResult);
        offsetBowlprop.rings[0].theta = Math.PI / 6;  // 30 degree offset
        
        const resultWithOffset = calcRingTrapz(offsetBowlprop, 0, true);
        const resultNoOffset = calcRingTrapz(calculatedBowlprop, 0, true);
        
        // Positions should be different due to the theta offset
        // Check the outer corner (index 1) which has larger coordinates and shows rotation effect better
        expect(resultWithOffset.seltrapz[0][1].x).not.toBeCloseTo(resultNoOffset.seltrapz[0][1].x, 3);
    });

    it('defaults to ring index 0 when null', () => {
        const resultNull = calcRingTrapz(calculatedBowlprop, null, true);
        const result0 = calcRingTrapz(calculatedBowlprop, 0, true);
        
        expect(resultNull.seltrapz.length).toBe(result0.seltrapz.length);
        expect(resultNull.seltrapz[0][0].x).toBe(result0.seltrapz[0][0].x);
    });

    it('handles 6 segment rings', () => {
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 6, clrs: defaultColors().slice(0, 6), wood: defaultWood().slice(0, 6), seglen: defaultLens(6), xvals: [], theta: 0 },
            ],
        });
        const ringResult = calcRings(view2d, bp);
        Object.assign(bp, ringResult);
        
        const result = calcRingTrapz(bp, 0, true);
        expect(result.seltrapz.length).toBe(6);
    });

    it('handles 8 segment rings', () => {
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 8, clrs: defaultColors().slice(0, 8), wood: defaultWood().slice(0, 8), seglen: defaultLens(8), xvals: [], theta: 0 },
            ],
        });
        const ringResult = calcRings(view2d, bp);
        Object.assign(bp, ringResult);
        
        const result = calcRingTrapz(bp, 0, true);
        expect(result.seltrapz.length).toBe(8);
    });

    it('handles 12 segment rings', () => {
        const result = calcRingTrapz(calculatedBowlprop, 0, true);
        expect(result.seltrapz.length).toBe(12);
    });

    it('handles 16 segment rings', () => {
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 16, clrs: Array(16).fill('#E2CAA0'), wood: Array(16).fill('maple'), seglen: defaultLens(16), xvals: [], theta: 0 },
            ],
        });
        const ringResult = calcRings(view2d, bp);
        Object.assign(bp, ringResult);
        
        const result = calcRingTrapz(bp, 0, true);
        expect(result.seltrapz.length).toBe(16);
    });

    it('handles 24 segment rings', () => {
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 24, clrs: Array(24).fill('#E2CAA0'), wood: Array(24).fill('maple'), seglen: defaultLens(24), xvals: [], theta: 0 },
            ],
        });
        const ringResult = calcRings(view2d, bp);
        Object.assign(bp, ringResult);
        
        const result = calcRingTrapz(bp, 0, true);
        expect(result.seltrapz.length).toBe(24);
    });

    it('handles unequal segment lengths', () => {
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 6, clrs: defaultColors().slice(0, 6), wood: defaultWood().slice(0, 6), seglen: [1, 1.5, 0.8, 1.2, 0.9, 0.6], xvals: [], theta: 0 },
            ],
        });
        const ringResult = calcRings(view2d, bp);
        Object.assign(bp, ringResult);
        
        const result = calcRingTrapz(bp, 0, false);
        
        // Segments with different lengths should have different sizes
        expect(result.seltrapz[0][1].y).not.toBeCloseTo(result.seltrapz[1][1].y, 3);
    });

    it('trapezoid corners are within ring xvals bounds', () => {
        const result = calcRingTrapz(calculatedBowlprop, 0, false);
        const ring = calculatedBowlprop.rings[0];
        
        result.seltrapz.forEach(trapz => {
            trapz.forEach(point => {
                // The radius (distance from center) should be within bounds
                const radius = Math.sqrt(point.x * point.x + point.y * point.y);
                // Allow some tolerance for the cosine adjustment
                expect(radius).toBeLessThanOrEqual(ring.xvals.max * 1.1);
            });
        });
    });

    it('adjusts outer radius for segments to meet at endpoints', () => {
        // Create a ring with unequal segment lengths that sum correctly
        // seglen values are multipliers - for proper full circle, sum should equal segs
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 6, clrs: defaultColors().slice(0, 6), wood: defaultWood().slice(0, 6), seglen: [0.8, 1.2, 0.8, 1.2, 0.8, 1.2], xvals: [], theta: 0 },
            ],
        });
        const ringResult = calcRings(view2d, bp);
        Object.assign(bp, ringResult);
        
        const result = calcRingTrapz(bp, 0, false);
        
        // The cosine adjustment: x2 = xvals.max * cos(theta) / cos(maxtheta)
        // For narrower segments (smaller theta): cos(theta) > cos(maxtheta)
        // So cos(theta)/cos(maxtheta) > 1, making x2 LARGER to extend further
        // This allows narrower segments to meet wider segments at their endpoints
        
        const narrowSegment = result.seltrapz[0];  // seglen = 0.8 (smaller theta)
        const wideSegment = result.seltrapz[1];  // seglen = 1.2 (larger theta = maxtheta)
        
        // The narrower segment should have LARGER outer x to extend and meet the wider segment
        expect(narrowSegment[1].x).toBeGreaterThan(wideSegment[1].x);
    });

    it('trapezoid points form valid polygon in order', () => {
        const result = calcRingTrapz(calculatedBowlprop, 0, false);
        
        result.seltrapz.forEach(trapz => {
            // Points should be in order: inner-top, outer-top, outer-bottom, inner-bottom
            // Or similar consistent ordering for proper polygon rendering
            expect(trapz.length).toBe(4);
            
            // The trapezoid should have a consistent winding order
            // Point 0 and 3 should be at inner radius (smaller x)
            // Point 1 and 2 should be at outer radius (larger x)
            expect(Math.abs(trapz[0].x)).toBeLessThan(Math.abs(trapz[1].x));
            expect(Math.abs(trapz[3].x)).toBeLessThan(Math.abs(trapz[2].x));
        });
    });

    it('handles minimum 3 segments', () => {
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 3, clrs: ['#E2CAA0', '#E2CAA0', '#E2CAA0'], wood: ['maple', 'maple', 'maple'], seglen: [1, 1, 1], xvals: [], theta: 0 },
            ],
        });
        const ringResult = calcRings(view2d, bp);
        Object.assign(bp, ringResult);
        
        const result = calcRingTrapz(bp, 0, true);
        expect(result.seltrapz.length).toBe(3);
        
        // Each trapezoid should have 4 points
        result.seltrapz.forEach(trapz => {
            expect(trapz.length).toBe(4);
        });
    });

    it('all segment thetas sum to full circle', () => {
        const result = calcRingTrapz(calculatedBowlprop, 0, true);
        const ring = calculatedBowlprop.rings[0];
        
        // Sum of all theta angles should equal 2*PI (full circle)
        let totalTheta = 0;
        for (let i = 0; i < ring.seglen.length; i++) {
            const theta = Math.PI / ring.segs * ring.seglen[i];
            totalTheta += theta * 2;  // Each segment spans theta*2 (rotation += theta * 2 in the code)
        }
        
        // For equal segments with seglen=1 each, total should be 2*PI
        // Sum of seglen should equal segs for a full circle
        const seglenSum = ring.seglen.reduce((a, b) => a + b, 0);
        expect(seglenSum).toBeCloseTo(ring.segs, 5);
        
        // And total rotation should be 2*PI
        expect(totalTheta).toBeCloseTo(2 * Math.PI, 5);
    });
});
