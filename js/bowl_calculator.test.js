import { screenToRealPoint, realToScreen, screenToReal } from "./bowl_calculator.mjs";
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
})

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
})

describe('screenToReal', () => {
    var bowlprop = {
        cpoint: [
            { x: centerx + 1.5 * scale, y: view2d.bottom },
            { x: centerx + 2.0 * scale, y: view2d.bottom },
            { x: centerx + 2.0 * scale, y: view2d.bottom - 3.0 * scale },
            { x: centerx + 2.5 * scale, y: view2d.bottom - 3.5 * scale }, // This point is will also be start of next bezier curve
        ]
    }
    it('calculates something', () => {
        console.log(bowlprop.cpoint);
        var npoint = screenToReal(view2d, bowlprop);
        console.log(npoint);
    })
})