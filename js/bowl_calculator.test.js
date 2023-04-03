import { screenToRealPoint } from "./bowl_calculator.mjs";

test('find out what this does', () => {
    var view2d = {
        canvas: {
            width: 250,
            height: 250
        },
        scale: 31.25
    }
    console.log(screenToRealPoint(view2d, 200, 170));
});