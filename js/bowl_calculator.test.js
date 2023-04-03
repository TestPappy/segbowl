import { screenToRealPoint, realToScreen } from "./bowl_calculator.mjs";

describe('screenToRealPoint', () => {
    it('converts click on 250, 125 to real point', () => {
        var view2d = {
            canvas: {
                width: 250,
                height: 250
            },
            scale: 250 / 8
        }
        var realPoint = screenToRealPoint(view2d, 250, 125);
        expect(realPoint.x).toBe(4);
        expect(realPoint.y).toBe(3.5);
    });

    it('converts click on 125, 0 to real point', () => {
        var view2d = {
            canvas: {
                width: 250,
                height: 250
            },
            scale: 250 / 8
        }
        var realPoint = screenToRealPoint(view2d, 125, 0);
        expect(realPoint.x).toBe(0);
        expect(realPoint.y).toBe(7.5);
    });
})

describe('realToScreen', () => {
    it('calculates screen point for coordinate (1, 2) in canvas', ()=> {
        var scale = 250 / 8;
        var view2d = {
            canvas: {
                width: 250,
                height: 250
            },
            scale: scale
        }
        var screenPoint = realToScreen(view2d, 1, 2);
        expect(screenPoint.x).toBe((250/2) + (1 * scale));
        expect(screenPoint.y).toBe((250/2) + ((2 - 0.5) * scale));
    });

    it('calculates screen point for coordinate (1, 2) in canvas2', ()=> {
        var scale = 250 / 8;
        var view2d = {
            canvas: {
                width: 250,
                height: 250
            },
            scale: scale
        }
        var screenPoint = realToScreen(view2d, 1, 2, 0);
        expect(screenPoint.x).toBe((250/2) + (1 * scale));
        expect(screenPoint.y).toBe((250/2) + (2 * scale));
    });
})