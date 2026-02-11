import { defaultColors, defaultLens, defaultWood } from "../common.js";
import { screenToReal, realToScreen } from "../bowl_calculator.js";
import { calcRings } from "../ring_calculator.js";

// All measurements in mm — uses curvesegs: 50 matching the actual app default
var canvasmm = 200;
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
    bottom: height - 12.7 * scale,
    scale: scale
};

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
        curvesegs: 50,
        thick: 6,
        pad: 3,
        ...overrides
    };
}

/**
 * Simulate the resize operation: scale control points and optionally ring heights/thickness.
 * Mirrors the logic in bowl.js resizeBowl().
 */
function applyResize(bowlprop, factor, { keepThick = true, keepRingHeight = false } = {}) {
    // Scale control points (screen -> real -> scale -> screen)
    const realPoints = screenToReal(view2d, bowlprop);
    for (const p in realPoints) {
        bowlprop.cpoint[p] = realToScreen(view2d, realPoints[p].x * factor, realPoints[p].y * factor);
    }
    // Scale wall thickness if not kept fixed
    if (!keepThick) {
        bowlprop.thick *= factor;
    }
    // Scale ring heights unless kept fixed
    if (!keepRingHeight) {
        for (let i = 0; i < bowlprop.rings.length; i++) {
            bowlprop.rings[i].height *= factor;
        }
    }
}

// =============================================================================
// TEST CASES FOR: Control point scaling (round-trip)
// =============================================================================
describe('control point scaling', () => {
    it('scales real-world coordinates by the factor', () => {
        const bp = createBowlprop();
        const factor = 1.1;

        const realBefore = screenToReal(view2d, bp);
        applyResize(bp, factor);
        const realAfter = screenToReal(view2d, bp);

        for (let p = 0; p < realBefore.length; p++) {
            expect(realAfter[p].x).toBeCloseTo(realBefore[p].x * factor, 3);
            expect(realAfter[p].y).toBeCloseTo(realBefore[p].y * factor, 3);
        }
    });

    it('scales down by 0.9 correctly', () => {
        const bp = createBowlprop();
        const factor = 0.9;

        const realBefore = screenToReal(view2d, bp);
        applyResize(bp, factor);
        const realAfter = screenToReal(view2d, bp);

        for (let p = 0; p < realBefore.length; p++) {
            expect(realAfter[p].x).toBeCloseTo(realBefore[p].x * factor, 3);
            expect(realAfter[p].y).toBeCloseTo(realBefore[p].y * factor, 3);
        }
    });

    it('preserves curve shape after multiple resize steps', () => {
        const bp = createBowlprop();

        const realOriginal = screenToReal(view2d, bp);

        // Scale up 3 times then down 3 times
        for (let i = 0; i < 3; i++) { applyResize(bp, 1.1); }
        for (let i = 0; i < 3; i++) { applyResize(bp, 1 / 1.1); }

        const realAfter = screenToReal(view2d, bp);

        for (let p = 0; p < realOriginal.length; p++) {
            expect(realAfter[p].x).toBeCloseTo(realOriginal[p].x, 1);
            expect(realAfter[p].y).toBeCloseTo(realOriginal[p].y, 1);
        }
    });
});

// =============================================================================
// TEST CASES FOR: Resize with proportional ring heights (default mode)
// =============================================================================
describe('resize with proportional ring heights', () => {
    it('increases bowl height when growing', () => {
        const bp = createBowlprop();
        const resultBefore = calcRings(view2d, bp);

        applyResize(bp, 1.1);
        const resultAfter = calcRings(view2d, bp);

        expect(resultAfter.height).toBeGreaterThan(resultBefore.height);
    });

    it('increases bowl radius when growing', () => {
        const bp = createBowlprop();
        const resultBefore = calcRings(view2d, bp);

        applyResize(bp, 1.1);
        const resultAfter = calcRings(view2d, bp);

        expect(resultAfter.radius).toBeGreaterThan(resultBefore.radius);
    });

    it('decreases bowl height when shrinking', () => {
        const bp = createBowlprop();
        const resultBefore = calcRings(view2d, bp);

        applyResize(bp, 0.9);
        const resultAfter = calcRings(view2d, bp);

        expect(resultAfter.height).toBeLessThan(resultBefore.height);
    });

    it('decreases bowl radius when shrinking', () => {
        const bp = createBowlprop();
        const resultBefore = calcRings(view2d, bp);

        applyResize(bp, 0.9);
        const resultAfter = calcRings(view2d, bp);

        expect(resultAfter.radius).toBeLessThan(resultBefore.radius);
    });

    it('bowl dimensions scale approximately by the factor', () => {
        const bp = createBowlprop();
        const resultBefore = calcRings(view2d, bp);

        applyResize(bp, 1.1);
        const resultAfter = calcRings(view2d, bp);

        // Not exactly 1.1 due to fixed wall thickness offset, but close
        const heightRatio = resultAfter.height / resultBefore.height;
        const radiusRatio = resultAfter.radius / resultBefore.radius;
        expect(heightRatio).toBeGreaterThan(1.05);
        expect(heightRatio).toBeLessThan(1.15);
        expect(radiusRatio).toBeGreaterThan(1.05);
        expect(radiusRatio).toBeLessThan(1.15);
    });

    it('scales all ring heights by the factor', () => {
        const bp = createBowlprop();
        const originalHeights = bp.rings.map(r => r.height);

        applyResize(bp, 1.1);

        for (let i = 0; i < originalHeights.length; i++) {
            expect(bp.rings[i].height).toBeCloseTo(originalHeights[i] * 1.1, 5);
        }
    });

    it('keeps the same number of rings', () => {
        const bp = createBowlprop();
        const ringCountBefore = bp.rings.length;

        applyResize(bp, 1.1);

        expect(bp.rings.length).toBe(ringCountBefore);
    });

    it('preserves segment count and colors', () => {
        const bp = createBowlprop();
        const originalSegs = bp.rings.map(r => r.segs);
        const originalClrs = bp.rings.map(r => [...r.clrs]);

        applyResize(bp, 1.1);

        for (let i = 0; i < bp.rings.length; i++) {
            expect(bp.rings[i].segs).toBe(originalSegs[i]);
            expect(bp.rings[i].clrs).toEqual(originalClrs[i]);
        }
    });

    it('preserves rotation angles', () => {
        const bp = createBowlprop();
        bp.rings[0].theta = Math.PI / 6;
        bp.rings[1].theta = Math.PI / 4;

        applyResize(bp, 1.1);

        expect(bp.rings[0].theta).toBe(Math.PI / 6);
        expect(bp.rings[1].theta).toBe(Math.PI / 4);
    });
});

// =============================================================================
// TEST CASES FOR: Resize with fixed ring height (keep ring height mode)
// =============================================================================
describe('resize with fixed ring height', () => {
    it('does not change existing ring heights', () => {
        const bp = createBowlprop();
        const originalHeights = bp.rings.map(r => r.height);

        applyResize(bp, 1.1, { keepRingHeight: true });

        for (let i = 0; i < originalHeights.length; i++) {
            expect(bp.rings[i].height).toBe(originalHeights[i]);
        }
    });

    it('calcRings creates additional rings to fill taller bowl', () => {
        // Use a single short ring so scaling up clearly needs more rings
        const bp = createBowlprop({
            rings: [
                { height: 10, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ],
        });
        const resultBefore = calcRings(view2d, bp);

        // Scale up significantly to require more rings
        applyResize(bp, 1.5, { keepRingHeight: true });
        const resultAfter = calcRings(view2d, bp);

        // Bowl is 50% taller, ring heights unchanged → more rings needed
        expect(resultAfter.usedrings).toBeGreaterThan(resultBefore.usedrings);
    });

    it('calcRings uses fewer rings when bowl shrinks with fixed ring heights', () => {
        const bp = createBowlprop();
        const resultBefore = calcRings(view2d, bp);

        // Scale down significantly
        applyResize(bp, 0.7, { keepRingHeight: true });
        const resultAfter = calcRings(view2d, bp);

        // Bowl is 30% shorter, ring heights unchanged → fewer rings fit
        expect(resultAfter.usedrings).toBeLessThan(resultBefore.usedrings);
    });

    it('newly created rings have default properties', () => {
        // Start with just one ring and scale up significantly to force new ring creation
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            ],
        });
        const resultBefore = calcRings(view2d, bp);
        const ringsBefore = resultBefore.usedrings;

        // Scale up by a large factor to ensure new rings are needed
        applyResize(bp, 1.5, { keepRingHeight: true });
        const resultAfter = calcRings(view2d, bp);

        expect(resultAfter.usedrings).toBeGreaterThan(ringsBefore);

        // New rings should have default segment count and height
        for (let i = ringsBefore; i < resultAfter.rings.length; i++) {
            expect(resultAfter.rings[i].segs).toBe(12);
            expect(resultAfter.rings[i].height).toBe(19);
        }
    });

    it('preserves existing ring properties when new rings are added', () => {
        const bp = createBowlprop({
            rings: [
                { height: 12.7, segs: 8, clrs: ['#FF0000'], wood: ['walnut'], seglen: defaultLens(8), xvals: [], theta: 0.5 },
            ],
        });

        applyResize(bp, 1.5, { keepRingHeight: true });
        const result = calcRings(view2d, bp);

        // Original ring should keep its properties
        expect(result.rings[0].segs).toBe(8);
        expect(result.rings[0].theta).toBe(0.5);
        expect(result.rings[0].height).toBe(12.7);
    });
});

// =============================================================================
// TEST CASES FOR: Wall thickness scaling
// =============================================================================
describe('resize wall thickness', () => {
    it('keeps wall thickness fixed when keepThick is true', () => {
        const bp = createBowlprop();
        const originalThick = bp.thick;

        applyResize(bp, 1.1, { keepThick: true });

        expect(bp.thick).toBe(originalThick);
    });

    it('scales wall thickness when keepThick is false', () => {
        const bp = createBowlprop();
        const originalThick = bp.thick;

        applyResize(bp, 1.1, { keepThick: false });

        expect(bp.thick).toBeCloseTo(originalThick * 1.1, 5);
    });

    it('scales wall thickness down when shrinking', () => {
        const bp = createBowlprop();
        const originalThick = bp.thick;

        applyResize(bp, 0.9, { keepThick: false });

        expect(bp.thick).toBeCloseTo(originalThick * 0.9, 5);
    });

    it('different wall thickness affects ring xvals', () => {
        const bpFixed = createBowlprop();
        const bpScaled = createBowlprop();

        applyResize(bpFixed, 1.1, { keepThick: true });
        applyResize(bpScaled, 1.1, { keepThick: false });

        const resultFixed = calcRings(view2d, bpFixed);
        const resultScaled = calcRings(view2d, bpScaled);

        // Both should produce valid results
        expect(resultFixed.height).toBeGreaterThan(0);
        expect(resultScaled.height).toBeGreaterThan(0);

        // With scaled (thicker) wall, offset curves differ → xvals differ
        expect(resultFixed.rings[1].xvals.max).not.toBeCloseTo(resultScaled.rings[1].xvals.max, 1);
    });

    it('padding stays fixed regardless of keepThick setting', () => {
        const bp = createBowlprop();
        const originalPad = bp.pad;

        applyResize(bp, 1.1, { keepThick: false });

        expect(bp.pad).toBe(originalPad);
    });
});

// =============================================================================
// TEST CASES FOR: Combined option combinations
// =============================================================================
describe('resize option combinations', () => {
    it('keepThick=false + keepRingHeight=false scales everything', () => {
        const bp = createBowlprop();
        const originalThick = bp.thick;
        const originalHeights = bp.rings.map(r => r.height);

        applyResize(bp, 1.1, { keepThick: false, keepRingHeight: false });

        expect(bp.thick).toBeCloseTo(originalThick * 1.1, 5);
        for (let i = 0; i < originalHeights.length; i++) {
            expect(bp.rings[i].height).toBeCloseTo(originalHeights[i] * 1.1, 5);
        }
    });

    it('keepThick=true + keepRingHeight=true only scales curve', () => {
        const bp = createBowlprop();
        const originalThick = bp.thick;
        const originalHeights = bp.rings.map(r => r.height);

        const realBefore = screenToReal(view2d, bp);
        applyResize(bp, 1.1, { keepThick: true, keepRingHeight: true });
        const realAfter = screenToReal(view2d, bp);

        // Control points scaled
        for (let p = 0; p < realBefore.length; p++) {
            expect(realAfter[p].x).toBeCloseTo(realBefore[p].x * 1.1, 3);
            expect(realAfter[p].y).toBeCloseTo(realBefore[p].y * 1.1, 3);
        }

        // Thickness and ring heights unchanged
        expect(bp.thick).toBe(originalThick);
        for (let i = 0; i < originalHeights.length; i++) {
            expect(bp.rings[i].height).toBe(originalHeights[i]);
        }
    });

    it('multiple consecutive resizes accumulate correctly', () => {
        const bp = createBowlprop();
        const resultOriginal = calcRings(view2d, bp);

        applyResize(bp, 1.1);
        applyResize(bp, 1.1);
        const resultAfter = calcRings(view2d, bp);

        // Two 10% increases should make the bowl noticeably larger
        expect(resultAfter.height).toBeGreaterThan(resultOriginal.height * 1.15);
        expect(resultAfter.radius).toBeGreaterThan(resultOriginal.radius * 1.15);
    });

    it('grow then shrink returns to approximately original size', () => {
        const bp = createBowlprop();
        const resultOriginal = calcRings(view2d, bp);

        applyResize(bp, 1.1);
        applyResize(bp, 1 / 1.1);
        const resultAfter = calcRings(view2d, bp);

        // Should be very close to original
        expect(resultAfter.height).toBeCloseTo(resultOriginal.height, 0);
        expect(resultAfter.radius).toBeCloseTo(resultOriginal.radius, 0);
    });
});
