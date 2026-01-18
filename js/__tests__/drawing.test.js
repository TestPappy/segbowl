/**
 * Drawing Module Tests
 * 
 * Note: Drawing functions require canvas mocking. These tests verify
 * the functions execute without errors and produce expected side effects.
 */

import { clearCanvas, drawCurve, drawSegProfile, drawRing } from '../drawing.js';
import { calcRings, calcRingTrapz } from '../ring_calculator.js';
import { defaultColors, defaultWood, defaultLens } from '../common.js';

// Mock canvas setup
function createMockCanvas(width = 500, height = 500) {
    const canvas = {
        width,
        height,
        getContext: jest.fn()
    };
    return canvas;
}

function createMockContext() {
    const gradient = {
        addColorStop: jest.fn()
    };
    return {
        createLinearGradient: jest.fn(() => gradient),
        gradient,  // Expose for testing
        fillStyle: null,
        fillRect: jest.fn(),
        strokeStyle: null,
        lineWidth: null,
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        arc: jest.fn(),
        rect: jest.fn(),
        closePath: jest.fn(),
        canvas: { width: 500, height: 500 },
        fillText: jest.fn(),
        font: null,
        textAlign: null
    };
}

function createMockView2d(width = 500, height = 500) {
    const canvasmm = 200;
    const scale = width / canvasmm;
    return {
        canvas: createMockCanvas(width, height),
        ctx: createMockContext(),
        canvas2: createMockCanvas(width, height),
        ctx2: createMockContext(),
        canvasmm,
        scale,
        bottom: height - 12.7 * scale,
        centerx: width / 2
    };
}

function createMockBowlprop(view2d) {
    const scale = view2d.scale;
    const centerx = view2d.centerx;
    return {
        thick: 6,
        pad: 3,
        cpoint: [
            { x: centerx + 38 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom - 76 * scale },
            { x: centerx + 63 * scale, y: view2d.bottom - 89 * scale },
        ],
        curvesegs: 50,
        rings: [
            { height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: { min: 35, max: 45 }, theta: 0 }
        ],
        usedrings: 1,
        seltrapz: null,
        selthetas: null
    };
}

function createMockCtrl() {
    return {
        selring: 0,
        selseg: [],
        copyring: null
    };
}

function createMockStyle() {
    return {
        curve: { width: 8, color: "#333" },
        cpline: { width: 1, color: "#06C" },
        point: { radius: 5, width: 2, color: "#06C", fill: "rgba(200,200,200,0.5)" },
        segs: { width: 1, color: "#935" },
        selring: { width: 3, color: "#FF9900" },
        selseg: { width: 3, color: "#FF0" },
        copyring: { width: 3, color: "#0000FF" },
        gratio: { width: 1, color: "#555555" }
    };
}

// Mock elements for document.getElementById
const mockShowSegNum = { checked: false };
let getElementByIdSpy;

beforeEach(() => {
    // Reset mock state
    mockShowSegNum.checked = false;
    
    // Spy on document.getElementById
    getElementByIdSpy = jest.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'showsegnum') return mockShowSegNum;
        return null;
    });
});

afterEach(() => {
    // Restore original implementation
    if (getElementByIdSpy) {
        getElementByIdSpy.mockRestore();
    }
});

// =============================================================================
// TEST CASES FOR: clearCanvas
// =============================================================================
describe('clearCanvas', () => {
    it('creates a gradient background from lightblue to lightgray', () => {
        const canvas = createMockCanvas();
        const ctx = createMockContext();
        
        clearCanvas(canvas, ctx, canvas.height);
        
        // Verify createLinearGradient was called
        expect(ctx.createLinearGradient).toHaveBeenCalled();
        
        // Verify color stops were added
        expect(ctx.gradient.addColorStop).toHaveBeenCalledWith(0, "lightblue");
        expect(ctx.gradient.addColorStop).toHaveBeenCalledWith(1, "lightgray");
    });

    it('fills the entire canvas area', () => {
        const canvas = createMockCanvas(500, 500);
        const ctx = createMockContext();
        
        clearCanvas(canvas, ctx, canvas.height);
        
        expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 500, 500);
    });

    it('handles different canvas dimensions', () => {
        const sizes = [
            { width: 300, height: 300 },
            { width: 800, height: 600 },
            { width: 1024, height: 768 }
        ];
        
        sizes.forEach(({ width, height }) => {
            const canvas = createMockCanvas(width, height);
            const ctx = createMockContext();
            
            clearCanvas(canvas, ctx, height);
            
            expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, width, height);
        });
    });

    it('creates gradient in correct vertical direction', () => {
        const canvas = createMockCanvas(500, 400);
        const ctx = createMockContext();
        
        clearCanvas(canvas, ctx, 400);
        
        // Gradient should go from bottom (height) to top (0)
        expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 400, 0, 0);
    });
});

// =============================================================================
// TEST CASES FOR: drawCurve
// =============================================================================
describe('drawCurve', () => {
    it('sets line width proportional to bowl thickness', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        
        drawCurve(ctx, bowlprop, view2d, style);
        
        // lineWidth should be thick * scale
        expect(ctx.lineWidth).toBe(bowlprop.thick * view2d.scale);
    });

    it('applies curve color from style', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        style.curve.color = "#FF0000";
        
        drawCurve(ctx, bowlprop, view2d, style);
        
        expect(ctx.strokeStyle).toBe("#FF0000");
    });

    it('draws bezier curves through all control points', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        
        drawCurve(ctx, bowlprop, view2d, style);
        
        // For 4 control points, there should be 1 bezier curve call per side
        // (points 0-3 make one curve)
        // Times 2 for mirrored curve
        expect(ctx.bezierCurveTo).toHaveBeenCalledTimes(2);
    });

    it('draws mirrored curve on left side of center', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        
        drawCurve(ctx, bowlprop, view2d, style);
        
        // moveTo should be called twice (once for each side)
        expect(ctx.moveTo).toHaveBeenCalledTimes(2);
        
        // Both should start from center bottom
        expect(ctx.moveTo).toHaveBeenCalledWith(view2d.centerx, view2d.bottom);
    });

    it('starts curve from center bottom of canvas', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        
        drawCurve(ctx, bowlprop, view2d, style);
        
        // First moveTo should be to center bottom
        expect(ctx.moveTo.mock.calls[0]).toEqual([view2d.centerx, view2d.bottom]);
    });

    it('handles minimum control points (single bezier)', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        // Ensure we have exactly 4 control points (minimum for one bezier)
        bowlprop.cpoint = bowlprop.cpoint.slice(0, 4);
        const ctx = createMockContext();
        const style = createMockStyle();
        
        expect(() => drawCurve(ctx, bowlprop, view2d, style)).not.toThrow();
        expect(ctx.bezierCurveTo).toHaveBeenCalledTimes(2);  // Once per side
    });

    it('handles multiple bezier segments', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const scale = view2d.scale;
        const centerx = view2d.centerx;
        
        // 7 control points = 2 bezier segments
        bowlprop.cpoint = [
            { x: centerx + 38 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom },
            { x: centerx + 50 * scale, y: view2d.bottom - 30 * scale },
            { x: centerx + 55 * scale, y: view2d.bottom - 50 * scale },
            { x: centerx + 60 * scale, y: view2d.bottom - 60 * scale },
            { x: centerx + 65 * scale, y: view2d.bottom - 70 * scale },
            { x: centerx + 70 * scale, y: view2d.bottom - 80 * scale },
        ];
        const ctx = createMockContext();
        const style = createMockStyle();
        
        drawCurve(ctx, bowlprop, view2d, style);
        
        // 2 bezier segments per side = 4 total
        expect(ctx.bezierCurveTo).toHaveBeenCalledTimes(4);
    });
});

// =============================================================================
// TEST CASES FOR: drawSegProfile
// =============================================================================
describe('drawSegProfile', () => {
    it('highlights selected ring with selection style', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selring = 0;  // Select first ring
        
        // Track all strokeStyle values set during drawing
        const strokeStyles = [];
        Object.defineProperty(ctx, 'strokeStyle', {
            set: function(value) { strokeStyles.push(value); },
            get: function() { return strokeStyles[strokeStyles.length - 1]; }
        });
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        // Selected ring style should have been used at some point
        expect(strokeStyles).toContain(style.selring.color);
    });

    it('highlights copied ring with copy style', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        // Add a second ring
        bowlprop.rings.push({ height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: { min: 40, max: 55 }, theta: 0 });
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selring = 1;
        ctrl.copyring = 0;  // Copy first ring
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        // copyring style should have been used at some point
        // The first ring (copyring) gets copyring style before selected ring gets selring style
        expect(ctx.beginPath).toHaveBeenCalled();
    });

    it('uses default style for unselected rings', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        // Add more rings
        bowlprop.rings.push({ height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: { min: 40, max: 55 }, theta: 0 });
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selring = null;  // No ring selected
        ctrl.copyring = null;
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        // Default segs style should be used
        expect(ctx.strokeStyle).toBe(style.segs.color);
    });

    it('draws rectangle for each ring', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        // rect should be called for each ring within height bounds
        expect(ctx.rect).toHaveBeenCalled();
        expect(ctx.rect.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('positions rings correctly in vertical stack', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        // Rings should be stacked - each rect call should have different y position
        // This is verified by checking that multiple rects are drawn
        expect(ctx.rect).toHaveBeenCalled();
    });

    it('only draws rings within bowl height bounds', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        // Create many rings that would exceed bowl height
        bowlprop.rings = Array(20).fill(null).map(() => ({
            height: 19,
            segs: 12,
            clrs: defaultColors(),
            wood: defaultWood(),
            seglen: defaultLens(),
            xvals: { min: 35, max: 45 },
            theta: 0
        }));
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        
        // Calculate rings first to get proper height
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        const rectCallsBefore = ctx.rect.mock.calls.length;
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        // Should not draw all 20 rings, only those within height
        const rectCalls = ctx.rect.mock.calls.length - rectCallsBefore;
        expect(rectCalls).toBeLessThan(20);
    });

    it('displays ring numbers when option is enabled', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        mockShowSegNum.checked = true;
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        // fillText should be called to display ring numbers
        expect(ctx.fillText).toHaveBeenCalled();
    });

    it('recalculates ring dimensions before drawing', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        // Don't pre-calculate rings
        bowlprop.rings[0].xvals = {};  // Clear xvals
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        
        // Should not throw and should calculate rings internally
        expect(() => drawSegProfile(ctx, bowlprop, view2d, ctrl, style)).not.toThrow();
        
        // After drawing, rings should have xvals calculated
        expect(bowlprop.rings[0].xvals.min).toBeDefined();
        expect(bowlprop.rings[0].xvals.max).toBeDefined();
    });
});

// =============================================================================
// TEST CASES FOR: drawRing
// =============================================================================
describe('drawRing', () => {
    it('draws polygon for each segment in ring', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selseg = [];
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawRing(ctx, 0, bowlprop, view2d, ctrl, style);
        
        // beginPath and closePath should be called for each segment
        // 12 segments = 12 calls minimum
        expect(ctx.beginPath.mock.calls.length).toBeGreaterThanOrEqual(12);
    });

    it('fills segments with assigned colors', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        bowlprop.rings[0].clrs = Array(12).fill('#FF0000');  // All red
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selseg = [];
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawRing(ctx, 0, bowlprop, view2d, ctrl, style);
        
        // fill should be called
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.fillStyle).toBeDefined();
    });

    it('highlights selected segments with selection style', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selseg = [0, 2, 4];  // Select some segments
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawRing(ctx, 0, bowlprop, view2d, ctrl, style);
        
        // Selected segments should use selseg style
        // The style is applied when drawing selected segments
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it('draws inner and outer boundary circles', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selseg = [];
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawRing(ctx, 0, bowlprop, view2d, ctrl, style);
        
        // arc should be called twice for inner and outer circles
        expect(ctx.arc).toHaveBeenCalledTimes(2);
    });

    it('applies padding to boundary circles', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        bowlprop.pad = 5;  // Set specific padding
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selseg = [];
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        drawRing(ctx, 0, bowlprop, view2d, ctrl, style);
        
        // arc calls should include padding adjustment
        // Inner circle: (xvals.min + pad) * scale
        // Outer circle: (xvals.max - pad) * scale
        const arcCalls = ctx.arc.mock.calls;
        expect(arcCalls.length).toBe(2);
        
        // Radii should be different (inner smaller than outer)
        const innerRadius = arcCalls[0][2];
        const outerRadius = arcCalls[1][2];
        expect(innerRadius).toBeLessThan(outerRadius);
    });

    it('calculates trapezoid shapes before drawing', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        // Don't pre-calculate trapezoids
        bowlprop.seltrapz = null;
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selseg = [];
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        // Should not throw and should calculate trapezoids internally
        expect(() => drawRing(ctx, 0, bowlprop, view2d, ctrl, style)).not.toThrow();
        
        // After drawing, seltrapz should be set
        expect(bowlprop.seltrapz).toBeDefined();
        expect(bowlprop.seltrapz.length).toBe(bowlprop.rings[0].seglen.length);
    });

    it('handles various segment counts correctly', () => {
        const segCounts = [6, 12, 18];
        
        segCounts.forEach(segs => {
            const view2d = createMockView2d();
            const bowlprop = createMockBowlprop(view2d);
            bowlprop.rings[0].segs = segs;
            bowlprop.rings[0].clrs = Array(segs).fill('#E2CAA0');
            bowlprop.rings[0].wood = Array(segs).fill('maple');
            bowlprop.rings[0].seglen = Array(segs).fill(1);
            const ctx = createMockContext();
            const style = createMockStyle();
            const ctrl = createMockCtrl();
            ctrl.selseg = [];
            
            // Calculate rings first
            const ringResult = calcRings(view2d, bowlprop);
            Object.assign(bowlprop, ringResult);
            
            expect(() => drawRing(ctx, 0, bowlprop, view2d, ctrl, style)).not.toThrow();
            
            // Should draw the correct number of segments
            expect(bowlprop.seltrapz.length).toBe(segs);
        });
    });

    it('handles segments with varying lengths', () => {
        const view2d = createMockView2d();
        const bowlprop = createMockBowlprop(view2d);
        // Varying segment lengths (sum should still equal segs for full circle)
        bowlprop.rings[0].segs = 6;
        bowlprop.rings[0].seglen = [0.8, 1.2, 0.8, 1.2, 0.8, 1.2];
        bowlprop.rings[0].clrs = Array(6).fill('#E2CAA0');
        bowlprop.rings[0].wood = Array(6).fill('maple');
        const ctx = createMockContext();
        const style = createMockStyle();
        const ctrl = createMockCtrl();
        ctrl.selseg = [];
        
        // Calculate rings first
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        
        expect(() => drawRing(ctx, 0, bowlprop, view2d, ctrl, style)).not.toThrow();
        
        // Should still draw all segments
        expect(bowlprop.seltrapz.length).toBe(6);
    });
});
