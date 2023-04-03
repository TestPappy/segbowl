import * as THREE from 'three';

/**
 * screenToRealPoint
 * @param {view2d} view2d 
 * @param {int} x of mouse click in canvas
 * @param {int} y of mouse click in canvas
 * @returns x and y of real position in bowl cross section. y is - half an inch, 
 * because bowl is located half an inch above bottom of canvas.
 */
export function screenToRealPoint(view2d, x, y) {
    console.log("x: " + x + "; y: " + y);
    return {
        x: (x - view2d.canvas.width / 2) / view2d.scale,
        y: (view2d.canvas.height - y) / view2d.scale - .5
    };
}

export function realToScreen(view2d, x, y, ofst = -.5) {
    return {
        x: x * view2d.scale + view2d.canvas.width / 2,
        y: -(y - ofst) * view2d.scale + view2d.canvas.height
    };
}

export function screenToReal(view2d, bowlprop) {
    var npoint = [];
    for (var p in bowlprop.cpoint) {
        npoint.push(new THREE.Vector2(
            (bowlprop.cpoint[p].x - view2d.canvas.width / 2) / view2d.scale,
            (view2d.canvas.height - bowlprop.cpoint[p].y) / view2d.scale - .5)); // .5 to put at 0,0
    }
    return npoint;
}