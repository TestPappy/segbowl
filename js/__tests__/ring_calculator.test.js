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

    /**
     * TEST CASE: Should return height as max y value of curve
     */
    it.todo('returns height as max y value of curve');

    /**
     * TEST CASE: Should return radius as max x value of curve
     */
    it.todo('returns radius as max x value of curve');

    /**
     * TEST CASE: Should count usedrings correctly
     * - Number of rings that fit within bowl height
     */
    it.todo('counts usedrings correctly based on height');

    /**
     * TEST CASE: Should create new rings when needed
     * - If bowl is taller than existing rings, new ones are created
     */
    it.todo('creates new rings when bowl is taller than existing rings');

    /**
     * TEST CASE: Should preserve existing ring properties
     * - segs, clrs, wood, seglen, theta should be preserved
     */
    it.todo('preserves existing ring properties');

    /**
     * TEST CASE: Should calculate xvals.max with padding
     * - xvals.max = max curve x + pad
     */
    it.todo('calculates xvals.max with padding added');

    /**
     * TEST CASE: Should calculate xvals.min with padding
     * - xvals.min = min curve x - pad
     */
    it.todo('calculates xvals.min with padding subtracted');

    /**
     * TEST CASE: xvals.min should never be negative
     */
    it.todo('xvals.min is never negative');

    /**
     * TEST CASE: xvals.max should never be negative
     */
    it.todo('xvals.max is never negative');

    /**
     * TEST CASE: Should handle bowls with varying ring heights
     */
    it.todo('handles rings with different heights');

    /**
     * TEST CASE: Should handle very tall bowl (many rings)
     */
    it.todo('handles tall bowls requiring many rings');

    /**
     * TEST CASE: Should handle very short bowl (few rings)
     */
    it.todo('handles short bowls with few rings');

    /**
     * TEST CASE: Should handle different thick values
     */
    it.todo('handles different wall thickness values');

    /**
     * TEST CASE: Should handle different pad values
     */
    it.todo('handles different padding values');

    /**
     * TEST CASE: Should interpolate x values for thin rings
     * - When curve points jump over a ring, interpolate
     */
    it.todo('interpolates x values for thin rings');

    /**
     * TEST CASE: Should not mutate original bowlprop
     */
    it.todo('does not mutate original bowlprop object');
});

// =============================================================================
// TEST CASES FOR: calcRingTrapz
// =============================================================================
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

    /**
     * TEST CASE: Should return one trapezoid per segment
     */
    it.todo('returns one trapezoid per segment');

    /**
     * TEST CASE: Each trapezoid should have 4 corners
     */
    it.todo('each trapezoid has 4 corner points');

    /**
     * TEST CASE: Should calculate correct theta angles
     * - theta = PI / segs * seglen[i]
     */
    it.todo('calculates correct theta angle for each segment');

    /**
     * TEST CASE: selthetas should track cumulative rotation
     */
    it.todo('selthetas tracks cumulative rotation');

    /**
     * TEST CASE: Should rotate trapezoids when rotate=true
     */
    it.todo('rotates trapezoids when rotate=true');

    /**
     * TEST CASE: Should not rotate trapezoids when rotate=false
     */
    it.todo('does not rotate trapezoids when rotate=false');

    /**
     * TEST CASE: Should apply ring theta offset
     * - bowlprop.rings[i].theta affects rotation
     */
    it.todo('applies ring theta offset to rotation');

    /**
     * TEST CASE: Should handle default ringidx=0 when null
     */
    it.todo('defaults to ring index 0 when null');

    /**
     * TEST CASE: Should handle rings with 6 segments
     */
    it.todo('handles 6 segment rings');

    /**
     * TEST CASE: Should handle rings with 8 segments
     */
    it.todo('handles 8 segment rings');

    /**
     * TEST CASE: Should handle rings with 12 segments (common)
     */
    it.todo('handles 12 segment rings');

    /**
     * TEST CASE: Should handle rings with 16 segments
     */
    it.todo('handles 16 segment rings');

    /**
     * TEST CASE: Should handle rings with 24 segments
     */
    it.todo('handles 24 segment rings');

    /**
     * TEST CASE: Should handle unequal segment lengths
     * - Different segments can have different seglen values
     */
    it.todo('handles unequal segment lengths');

    /**
     * TEST CASE: Trapezoid corners should be within ring xvals bounds
     */
    it.todo('trapezoid corners are within ring xvals bounds');

    /**
     * TEST CASE: Should adjust outer x to make segments meet at endpoints
     * - cosine adjustment for different width segments
     */
    it.todo('adjusts outer radius for segments to meet at endpoints');

    /**
     * TEST CASE: Trapezoid points should form valid polygon
     * - Points should be ordered for proper drawing
     */
    it.todo('trapezoid points form valid polygon in order');

    /**
     * TEST CASE: Should handle minimum 3 segments
     */
    it.todo('handles minimum 3 segments');

    /**
     * TEST CASE: All segments should add up to full circle
     * - Sum of all segment thetas should equal 2*PI
     */
    it.todo('all segment thetas sum to full circle');
});
