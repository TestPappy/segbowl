import { Vector2 } from "three";
import { screenToRealPoint, realToScreen, screenToReal, splitRingY, calcBezPath, offsetCurve } from "../bowl_calculator.js";
import { defaultColors, defaultLens } from "../common.js";
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

describe('screenToRealPoint', () => {
    it('converts click on 250, 125 to real point', () => {
        var realPoint = screenToRealPoint(view2d, width, height / 2);
        expect(realPoint.x).toBe(canvasinches / 2);
        expect(realPoint.y).toBe(canvasinches / 2 - 0.5);
    });

    it('converts click on 125, 0 to real point', () => {
        var realPoint = screenToRealPoint(view2d, width / 2, 0);
        expect(realPoint.x).toBe(0);
        expect(realPoint.y).toBe(canvasinches - 0.5);
    });
});

describe('realToScreen', () => {
    it('calculates screen point for coordinate (1, 2) in canvas', ()=> {
        var realX = 2;
        var realY = 3;
        var screenPoint = realToScreen(view2d, realX, realY);
        expect(screenPoint.x).toBe((width/2) + (realX * scale));
        expect(screenPoint.y).toBe(-(realY + 0.5) * scale + height);
    });

    it('calculates screen point for coordinate (1, 2) in canvas2', ()=> {
        var realX = 1.5;
        var realY = 4.25;
        var screenPoint = realToScreen(view2d, realX, realY, 0);
        expect(screenPoint.x).toBe((width/2) + (realX * scale));
        expect(screenPoint.y).toBe(-(realY + 0) * scale + height);
    });
});

describe('screenToReal', () => {
    var bowlprop = {
        cpoint: [
            // { x: centerx + 1.5 * scale, y: view2d.bottom },
            new Vector2(centerx + 1.5 * scale, view2d.bottom),
            { x: centerx + 2.0 * scale, y: view2d.bottom },
            { x: centerx + 2.0 * scale, y: view2d.bottom - 3.0 * scale },
            { x: centerx + 2.5 * scale, y: view2d.bottom - 3.5 * scale }, // This point is will also be start of next bezier curve
        ]
    }
    it('calculates real coordinates from screen coordinates', () => {
        var npoint = screenToReal(view2d, bowlprop);
        expect(npoint[0].x).toBe(1.5);
        expect(npoint[0].y).toBe(0);
        expect(npoint[1].x).toBe(2);
        expect(npoint[1].y).toBe(0);
        expect(npoint[2].x).toBe(2);
        expect(npoint[2].y).toBe(3);
        expect(npoint[3].x).toBe(2.5);
        expect(npoint[3].y).toBe(3.5);
    });
});

describe('calcBezPath', () => {
    var bowlprop = {
        cpoint: [
            { x: centerx + 1.5 * scale, y: view2d.bottom },
            { x: centerx + 2.0 * scale, y: view2d.bottom },
            { x: centerx + 2.0 * scale, y: view2d.bottom - 3.0 * scale },
            { x: centerx + 2.5 * scale, y: view2d.bottom - 3.5 * scale }, // This point is will also be start of next bezier curve
        ],
        curvesegs: 4
    }
    
    it('calculates what?', () => {
        var curve = calcBezPath(view2d, bowlprop, true)
        expect(curve.length).toBe(bowlprop.curvesegs + 4);
        expect(curve[2].x).toBe(1.5);
        expect(curve[2].y).toBe(0);
        expect(curve[4].x).toBe(2);
        expect(curve[4].y).toBe(1.5625);
        expect(curve[7].x).toBe(2.5);
        expect(curve[7].y).toBe(3.5);
    });
});

describe('splitRingY', () => {
    var bowlprop = {
        cpoint: [
            { x: centerx + 1.5 * scale, y: view2d.bottom },
            { x: centerx + 2.0 * scale, y: view2d.bottom },
            { x: centerx + 2.0 * scale, y: view2d.bottom - 2.0 * scale },
            { x: centerx + 2.5 * scale, y: view2d.bottom - 2.5 * scale }, // This point is will also be start of next bezier curve
        ],
        rings: [{ height: .5, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: .75, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: .75, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
                { height: .75, segs: 12, clrs: defaultColors(), seglen: defaultLens(), xvals: [], theta: 0 },
        ],
        curvesegs: 4
    };
    var curve = [
        new Vector2(0, 0),
        new Vector2(0.1, 0),
        new Vector2(1.5, 0),
        new Vector2(1.796875, 0.3203125),
        new Vector2(2, 1.0625),
        new Vector2(2.203125, 1.8984375),
        new Vector2(2.5, 2.5),
        new Vector2(2.5, 2.5)
        ];
    it('calculates the borders of each ring on the curve', () => {
        var curveparts = splitRingY(curve, bowlprop);
        expect(Number.parseFloat(curveparts[0][4].x).toFixed(3)).toBe("1.846");
        expect(curveparts[0][4].y).toBe(0.5);
        expect(Number.parseFloat(curveparts[1][1].x).toFixed(3)).toBe("2.046");
        expect(curveparts[1][1].y).toBe(1.25);
        expect(Number.parseFloat(curveparts[2][1].x).toFixed(3)).toBe("2.253");
        expect(curveparts[2][1].y).toBe(2);
        expect(curveparts[3][1].x).toBe(2.5);
        expect(curveparts[3][1].y).toBe(2.5);
    });
});

describe('offsetCurve', () => {
    var curve = [
        new Vector2(0, 0),
        new Vector2(0.1, 0),
        new Vector2(1.5, 0),
        new Vector2(1.796875, 0.3203125),
        new Vector2(2, 1.0625),
        new Vector2(2.203125, 1.8984375),
        new Vector2(2.5, 2.5),
        new Vector2(2.5, 2.5)
        ];
    it('calculates the inner and outer bowl wall', () => {
        var result = offsetCurve(curve, 0.125);
        expect(Number.parseFloat(result.c1[2].x).toFixed(3)).toBe("1.408");
        expect(Number.parseFloat(result.c1[2].y).toFixed(3)).toBe("0.085");
        expect(Number.parseFloat(result.c2[2].x).toFixed(3)).toBe("1.592");
        expect(Number.parseFloat(result.c2[2].y).toFixed(3)).toBe("-0.085");
        expect(Number.parseFloat(result.c1[3].x).toFixed(3)).toBe("1.676");
        expect(Number.parseFloat(result.c1[3].y).toFixed(3)).toBe("0.353");
        expect(Number.parseFloat(result.c2[3].x).toFixed(3)).toBe("1.917");
        expect(Number.parseFloat(result.c2[3].y).toFixed(3)).toBe("0.287");
        expect(Number.parseFloat(result.c1[4].x).toFixed(3)).toBe("1.879");
        expect(Number.parseFloat(result.c1[4].y).toFixed(3)).toBe("1.092");
        expect(Number.parseFloat(result.c2[4].x).toFixed(3)).toBe("2.121");
        expect(Number.parseFloat(result.c2[4].y).toFixed(3)).toBe("1.033");
    });
});