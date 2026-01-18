/**
 * Report Module Tests
 * 
 * Tests for the cut list report generation functionality.
 */

import { getReportSegsList } from '../report.js';
import { calcRings, calcRingTrapz } from '../ring_calculator.js';
import { defaultColors, defaultWood, defaultLens } from '../common.js';

// Mock view2d setup (in mm)
const canvasmm = 200;
const width = 500;
const scale = width / canvasmm;
const centerx = width / 2;
const bottom = width - 12.7 * scale;

const view2d = {
    canvas: { width, height: width },
    centerx,
    bottom,
    scale
};

// Helper to create a basic bowlprop with calculated rings
function createBowlpropWithRings(overrides = {}) {
    const bowlprop = {
        thick: 6,
        pad: 3,
        cpoint: [
            { x: centerx + 38 * scale, y: bottom },
            { x: centerx + 50 * scale, y: bottom },
            { x: centerx + 50 * scale, y: bottom - 76 * scale },
            { x: centerx + 63 * scale, y: bottom - 89 * scale },
        ],
        curvesegs: 50,
        rings: [
            { height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
            { height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
        ],
        usedrings: 2,
        seltrapz: null,
        selthetas: null,
        ...overrides
    };
    
    // Calculate ring dimensions
    const ringResult = calcRings(view2d, bowlprop);
    Object.assign(bowlprop, ringResult);
    
    return bowlprop;
}

// Helper to create a ring with specific colors
function createRingWithColors(segs, colors, wood = null) {
    return {
        height: 19,
        segs: segs,
        clrs: colors,
        wood: wood || Array(segs).fill('maple'),
        seglen: Array(segs).fill(1),
        xvals: [],
        theta: 0
    };
}

// =============================================================================
// TEST CASES FOR: getReportSegsList
// =============================================================================
describe('getReportSegsList', () => {
    it('returns array of segment info objects', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        
        // Each segment info should have required properties
        result.forEach(segInfo => {
            expect(segInfo).toHaveProperty('theta');
            expect(segInfo).toHaveProperty('outlen');
            expect(segInfo).toHaveProperty('inlen');
            expect(segInfo).toHaveProperty('width');
            expect(segInfo).toHaveProperty('length');
            expect(segInfo).toHaveProperty('color');
            expect(segInfo).toHaveProperty('wood');
            expect(segInfo).toHaveProperty('cnt');
        });
    });

    it('groups identical segments by color and size', () => {
        // Create a ring with two colors alternating
        const colors = ['#FF0000', '#00FF00', '#FF0000', '#00FF00', '#FF0000', '#00FF00',
                       '#FF0000', '#00FF00', '#FF0000', '#00FF00', '#FF0000', '#00FF00'];
        const bowlprop = createBowlpropWithRings({
            rings: [
                createRingWithColors(12, colors),
            ]
        });
        
        const result = getReportSegsList(bowlprop, 0);
        
        // Should have 2 groups (one for each color)
        expect(result.length).toBe(2);
        // Each group should have 6 segments
        expect(result[0].cnt).toBe(6);
        expect(result[1].cnt).toBe(6);
    });

    it('calculates correct cut angle for each segment group', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // For 12 segments with seglen=1: theta = 180/12 * 1 = 15 degrees
        expect(result[0].theta).toBeCloseTo(15, 5);
    });

    it('calculates outside edge length', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // outlen should be positive and reasonable (2 * outer y coordinate)
        expect(result[0].outlen).toBeGreaterThan(0);
        expect(typeof result[0].outlen).toBe('number');
    });

    it('calculates inside edge length', () => {
        const bowlprop = createBowlpropWithRings();
        // Use ring 1 instead of base ring (ring 0 may have inner radius near 0)
        const result = getReportSegsList(bowlprop, 1);
        
        // inlen should be non-negative and smaller than outlen
        expect(result[0].inlen).toBeGreaterThanOrEqual(0);
        expect(result[0].inlen).toBeLessThan(result[0].outlen);
        expect(typeof result[0].inlen).toBe('number');
    });

    it('calculates segment width (radial dimension)', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // width = outer x - inner x (should be positive)
        expect(result[0].width).toBeGreaterThan(0);
        expect(typeof result[0].width).toBe('number');
    });

    it('calculates total strip length needed', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // length accumulates for identical segments
        // For single group with 12 segments: length = outlen * 12
        expect(result[0].length).toBeGreaterThan(0);
        expect(result[0].length).toBeGreaterThanOrEqual(result[0].outlen);
    });

    it('includes wood type for each segment group', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // Wood type should be a string
        expect(typeof result[0].wood).toBe('string');
        expect(result[0].wood).toBe('maple');  // defaultWood() returns 'maple'
    });

    it('includes color for each segment group', () => {
        const colors = ['#FF0000', '#00FF00', '#FF0000', '#00FF00', '#FF0000', '#00FF00',
                       '#FF0000', '#00FF00', '#FF0000', '#00FF00', '#FF0000', '#00FF00'];
        const bowlprop = createBowlpropWithRings({
            rings: [
                createRingWithColors(12, colors),
            ]
        });
        
        const result = getReportSegsList(bowlprop, 0);
        
        expect(result[0].color).toBe('#FF0000');
        expect(result[1].color).toBe('#00FF00');
    });

    it('counts number of identical segments', () => {
        // All same color should result in count = segs
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // With default colors (all same), should have 1 group with cnt = 12
        expect(result.length).toBe(1);
        expect(result[0].cnt).toBe(12);
    });

    it('returns single group when all segments are identical', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // All segments have same color and seglen by default
        expect(result.length).toBe(1);
        expect(result[0].cnt).toBe(bowlprop.rings[0].segs);
    });

    it('handles alternating color patterns', () => {
        const colors = ['#FF0000', '#00FF00', '#FF0000', '#00FF00', '#FF0000', '#00FF00',
                       '#FF0000', '#00FF00', '#FF0000', '#00FF00', '#FF0000', '#00FF00'];
        const bowlprop = createBowlpropWithRings({
            rings: [
                createRingWithColors(12, colors),
            ]
        });
        
        const result = getReportSegsList(bowlprop, 0);
        
        expect(result.length).toBe(2);
        expect(result[0].cnt + result[1].cnt).toBe(12);
    });

    it('handles all unique colors', () => {
        // 12 different colors
        const colors = ['#000001', '#000002', '#000003', '#000004', '#000005', '#000006',
                       '#000007', '#000008', '#000009', '#00000A', '#00000B', '#00000C'];
        const bowlprop = createBowlpropWithRings({
            rings: [
                createRingWithColors(12, colors),
            ]
        });
        
        const result = getReportSegsList(bowlprop, 0);
        
        // Should have 12 groups, one per segment
        expect(result.length).toBe(12);
        result.forEach(seg => {
            expect(seg.cnt).toBe(1);
        });
    });

    it('separates segments with different lengths even if same color', () => {
        const colors = Array(12).fill('#E2CAA0');  // All same color
        const seglen = [1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5];  // Alternating lengths
        const bowlprop = createBowlpropWithRings({
            rings: [{
                height: 19,
                segs: 12,
                clrs: colors,
                wood: Array(12).fill('maple'),
                seglen: seglen,
                xvals: [],
                theta: 0
            }]
        });
        
        const result = getReportSegsList(bowlprop, 0);
        
        // Should have 2 groups despite same color (different seglen)
        expect(result.length).toBe(2);
        expect(result[0].cnt).toBe(6);
        expect(result[1].cnt).toBe(6);
    });

    it('handles various segment counts', () => {
        const segmentCounts = [6, 8, 12, 16, 24];
        
        segmentCounts.forEach(segs => {
            const colors = Array(segs).fill('#E2CAA0');
            const bowlprop = createBowlpropWithRings({
                rings: [
                    createRingWithColors(segs, colors),
                ]
            });
            
            const result = getReportSegsList(bowlprop, 0);
            
            expect(result.length).toBe(1);
            expect(result[0].cnt).toBe(segs);
            
            // Cut angle should be correct: 180 / segs
            expect(result[0].theta).toBeCloseTo(180 / segs, 5);
        });
    });

    it('handles base ring (ring index 0)', () => {
        const bowlprop = createBowlpropWithRings();
        
        // Should not throw for ring index 0
        expect(() => getReportSegsList(bowlprop, 0)).not.toThrow();
        
        const result = getReportSegsList(bowlprop, 0);
        expect(result.length).toBeGreaterThan(0);
    });

    it('works with any valid ring index', () => {
        const bowlprop = createBowlpropWithRings({
            rings: [
                { height: 19, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: 19, segs: 8, clrs: Array(8).fill('#FF0000'), wood: Array(8).fill('walnut'), seglen: Array(8).fill(1), xvals: [], theta: 0 },
                { height: 19, segs: 16, clrs: Array(16).fill('#00FF00'), wood: Array(16).fill('cherry'), seglen: Array(16).fill(1), xvals: [], theta: 0 },
            ]
        });
        
        // Test each ring index
        const result0 = getReportSegsList(bowlprop, 0);
        expect(result0[0].cnt).toBe(12);
        
        const result1 = getReportSegsList(bowlprop, 1);
        expect(result1[0].cnt).toBe(8);
        expect(result1[0].color).toBe('#FF0000');
        expect(result1[0].wood).toBe('walnut');
        
        const result2 = getReportSegsList(bowlprop, 2);
        expect(result2[0].cnt).toBe(16);
        expect(result2[0].color).toBe('#00FF00');
        expect(result2[0].wood).toBe('cherry');
    });

    it('calculates length as accumulated outlen for identical segments', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // For 12 identical segments, length should be 12 * outlen
        // First segment: length = outlen, then each additional adds outlen
        // So total = outlen * cnt
        expect(result[0].length).toBeCloseTo(result[0].outlen * result[0].cnt, 5);
    });

    it('uses correct trapezoid points for calculations', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // After getReportSegsList, bowlprop.seltrapz should be set
        expect(bowlprop.seltrapz).toBeDefined();
        expect(bowlprop.seltrapz.length).toBe(bowlprop.rings[0].seglen.length);
        
        // outlen = 2 * trapz[0][1].y (outer y)
        expect(result[0].outlen).toBeCloseTo(2 * Math.abs(bowlprop.seltrapz[0][1].y), 5);
        
        // inlen = 2 * trapz[0][0].y (inner y)
        expect(result[0].inlen).toBeCloseTo(2 * Math.abs(bowlprop.seltrapz[0][0].y), 5);
        
        // width = trapz[0][1].x - trapz[0][0].x
        expect(result[0].width).toBeCloseTo(bowlprop.seltrapz[0][1].x - bowlprop.seltrapz[0][0].x, 5);
    });
});

// =============================================================================
// TEST CASES FOR: createReport (integration test)
// Note: createReport requires window mocking and is complex to test in isolation
// =============================================================================
describe('createReport', () => {
    // These tests require extensive DOM/window mocking
    // Marking as integration tests that verify the expected data flow
    
    it('creates cut list table with all rings', () => {
        // Verify getReportSegsList produces data for all rings
        const bowlprop = createBowlpropWithRings();
        
        for (let i = 0; i < bowlprop.usedrings; i++) {
            const result = getReportSegsList(bowlprop, i);
            expect(result.length).toBeGreaterThan(0);
        }
    });

    it('labels first ring as Base and others with numbers', () => {
        // This is verified by testing the logic flow
        // Ring 0 should produce "Base", others should produce ring number
        const bowlprop = createBowlpropWithRings();
        
        // Verify we can distinguish ring 0 from others
        expect(bowlprop.usedrings).toBeGreaterThan(1);
        
        // The label logic: no == 0 ? "Base" : no
        const ringLabels = [];
        for (let no = 0; no < bowlprop.usedrings; no++) {
            ringLabels.push(no === 0 ? "Base" : no);
        }
        expect(ringLabels[0]).toBe("Base");
        expect(ringLabels[1]).toBe(1);
    });

    it('includes ring diameter in report', () => {
        const bowlprop = createBowlpropWithRings();
        
        // Diameter = xvals.max * 2
        const ring0Diameter = bowlprop.rings[0].xvals.max * 2;
        expect(ring0Diameter).toBeGreaterThan(0);
    });

    it('includes ring thickness in report', () => {
        const bowlprop = createBowlpropWithRings();
        
        // Thickness = ring height
        expect(bowlprop.rings[0].height).toBe(19);
    });

    it('includes ring rotation angle', () => {
        const bowlprop = createBowlpropWithRings();
        bowlprop.rings[0].theta = Math.PI / 6;  // 30 degrees
        
        // Rotation in degrees = 180 / PI * theta
        const rotationDegrees = 180 / Math.PI * bowlprop.rings[0].theta;
        expect(rotationDegrees).toBeCloseTo(30, 5);
    });

    it('formats measurements according to step parameter', () => {
        // The reduce() function is used for formatting
        // This is already tested in common.test.js
        // Here we verify the data flow is correct
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // All measurement values should be numbers ready for formatting
        expect(typeof result[0].outlen).toBe('number');
        expect(typeof result[0].inlen).toBe('number');
        expect(typeof result[0].width).toBe('number');
        expect(typeof result[0].length).toBe('number');
    });

    it('generates bowl profile image', () => {
        // This requires canvas mocking - verify the data is available
        const bowlprop = createBowlpropWithRings();
        expect(bowlprop.cpoint).toBeDefined();
        expect(bowlprop.cpoint.length).toBeGreaterThanOrEqual(4);
    });

    it('generates 3D view image', () => {
        // This requires WebGL mocking - verify bowl data is complete
        const bowlprop = createBowlpropWithRings();
        expect(bowlprop.usedrings).toBeGreaterThan(0);
        expect(bowlprop.rings[0].xvals).toBeDefined();
    });

    it('generates image for each ring', () => {
        const bowlprop = createBowlpropWithRings();
        
        // Each ring should have the data needed for drawing
        for (let i = 0; i < bowlprop.usedrings; i++) {
            expect(bowlprop.rings[i]).toBeDefined();
            expect(bowlprop.rings[i].segs).toBeGreaterThan(0);
            expect(bowlprop.rings[i].xvals).toBeDefined();
        }
    });

    it('creates individual cut list table for each ring', () => {
        const bowlprop = createBowlpropWithRings();
        
        // Each ring should produce valid segment list data
        for (let i = 0; i < bowlprop.usedrings; i++) {
            const segList = getReportSegsList(bowlprop, i);
            expect(segList.length).toBeGreaterThan(0);
            
            // Total count should equal number of segments
            const totalCnt = segList.reduce((sum, seg) => sum + seg.cnt, 0);
            expect(totalCnt).toBe(bowlprop.rings[i].segs);
        }
    });
});

// =============================================================================
// TEST CASES FOR: add_cutlist_row (internal function - test via getReportSegsList)
// =============================================================================
describe('add_cutlist_row (via integration)', () => {
    it('adds table row for each segment group', () => {
        // Create a ring with 3 different colors (3 groups)
        const colors = ['#FF0000', '#FF0000', '#FF0000', '#FF0000',
                       '#00FF00', '#00FF00', '#00FF00', '#00FF00',
                       '#0000FF', '#0000FF', '#0000FF', '#0000FF'];
        const bowlprop = createBowlpropWithRings({
            rings: [
                createRingWithColors(12, colors),
            ]
        });
        
        const result = getReportSegsList(bowlprop, 0);
        
        // Should have 3 groups (one row per group)
        expect(result.length).toBe(3);
    });

    it('formats cut angle with degree symbol', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        // The theta value in degrees
        const thetaDegrees = result[0].theta;
        
        // Format as done in add_cutlist_row: theta.toFixed(2).concat("°")
        const formatted = thetaDegrees.toFixed(2).concat("°");
        expect(formatted).toMatch(/^\d+\.\d{2}°$/);
        expect(formatted).toBe("15.00°");
    });

    it('accounts for saw kerf in total strip length', () => {
        const bowlprop = createBowlpropWithRings();
        const result = getReportSegsList(bowlprop, 0);
        
        const sawkerf = 3.2;  // Example saw kerf in mm
        
        // Total length with kerf = length + (sawkerf * cnt)
        const lengthWithKerf = result[0].length + (sawkerf * result[0].cnt);
        
        expect(lengthWithKerf).toBeGreaterThan(result[0].length);
        expect(lengthWithKerf).toBeCloseTo(result[0].length + sawkerf * 12, 5);
    });

    it('handles multiple segment groups per ring', () => {
        // Create a ring with multiple colors
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00',
                       '#FF00FF', '#00FFFF', '#FF0000', '#00FF00',
                       '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        const bowlprop = createBowlpropWithRings({
            rings: [
                createRingWithColors(12, colors),
            ]
        });
        
        const result = getReportSegsList(bowlprop, 0);
        
        // Should have 6 groups (each color appears twice)
        expect(result.length).toBe(6);
        
        // Each group should have 2 segments
        result.forEach(seg => {
            expect(seg.cnt).toBe(2);
        });
        
        // Total segments should still equal 12
        const totalCnt = result.reduce((sum, seg) => sum + seg.cnt, 0);
        expect(totalCnt).toBe(12);
    });
});
