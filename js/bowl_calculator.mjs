export function screenToRealPoint(view2d, x, y) {
    console.log("height: " + view2d.canvas.height + "; width: " + view2d.canvas.width);
    console.log("scale: " + view2d.scale);
    console.log("x: " + x + "; y: " + y);
    return {
        x: (x - view2d.canvas.width / 2) / view2d.scale,
        y: (view2d.canvas.height - y) / view2d.scale - .5
    };
}