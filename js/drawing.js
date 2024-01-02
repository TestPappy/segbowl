import { calcRings, calcRingTrapz } from "./ring_calculator.mjs";
import { realToScreen } from "./bowl_calculator.mjs";

export function clearCanvas(canvas, ctx, height) {
    var grd = ctx.createLinearGradient(0, height, 0, 0);
    grd.addColorStop(0, "lightblue");
    grd.addColorStop(1, "lightgray");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawCurve(ctx, bowlprop, view2d, style) {
    ctx.lineWidth = bowlprop.thick * view2d.scale;
    ctx.strokeStyle = style.curve.color;
    ctx.beginPath();
    ctx.moveTo(view2d.centerx, view2d.bottom);
    ctx.lineTo(bowlprop.cpoint[0].x, bowlprop.cpoint[0].y);
    for (var i = 0; i < bowlprop.cpoint.length - 1; i += 3) {
        ctx.bezierCurveTo(
            bowlprop.cpoint[i + 1].x, bowlprop.cpoint[i + 1].y,
            bowlprop.cpoint[i + 2].x, bowlprop.cpoint[i + 2].y,
            bowlprop.cpoint[i + 3].x, bowlprop.cpoint[i + 3].y);
    }

    // Left-side mirror curve
    ctx.moveTo(view2d.centerx, view2d.bottom);
    ctx.lineTo(view2d.canvas.width - bowlprop.cpoint[0].x, bowlprop.cpoint[0].y);
    for (var i = 0; i < bowlprop.cpoint.length - 1; i += 3) {
        ctx.bezierCurveTo(
            canvas.width - bowlprop.cpoint[i + 1].x, bowlprop.cpoint[i + 1].y,
            canvas.width - bowlprop.cpoint[i + 2].x, bowlprop.cpoint[i + 2].y,
            canvas.width - bowlprop.cpoint[i + 3].x, bowlprop.cpoint[i + 3].y);
    }
    ctx.stroke();
}

export function drawSegProfile(ctx, bowlprop, view2d, ctrl, style) {
    calcRings(view2d, bowlprop);
    var y = -bowlprop.thick / 2;
    for (var i = 0; i < bowlprop.rings.length; i++) {
        ctx.beginPath();
        if (i == ctrl.copyring) {
            ctx.strokeStyle = style.copyring.color;
            ctx.lineWidth = style.copyring.width;
        }
        else if (i == ctrl.selring) {
            ctx.strokeStyle = style.selring.color;
            ctx.lineWidth = style.selring.width;
        } else {
            ctx.strokeStyle = style.segs.color;
            ctx.lineWidth = style.segs.width;
        }
        if (y <= bowlprop.height) {
            var p1 = realToScreen(view2d, bowlprop.rings[i].xvals.min, y);
            var p2 = realToScreen(view2d, bowlprop.rings[i].xvals.max, y + bowlprop.rings[i].height);
            ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            ctx.stroke();
            if (document.getElementById("showsegnum").checked) {
                ctx.fillStyle = "black";
                ctx.font = "15px Arial";
                ctx.textAlign = "center";
                ctx.fillText(i.toString(), p2.x + 10, (p1.y + p2.y) / 2 + 3);
                ctx.stroke();
            }
        }
        y += bowlprop.rings[i].height;
    }
}

export function drawRing(ctx, selring, bowlprop, view2d, ctrl, style) {
    calcRingTrapz(bowlprop, selring, true);
    for (var i = 0; i < bowlprop.rings[selring].segs; i++) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.fillStyle = bowlprop.rings[selring].clrs[i];
        drawPoly(ctx, bowlprop.seltrapz[i], true, view2d);
    }
    for (var i = 0; i < ctrl.selseg.length; i++) {
        ctx.strokeStyle = style.selseg.color;
        ctx.lineWidth = style.selseg.width;
        drawPoly(ctx, bowlprop.seltrapz[ctrl.selseg[i]], false, view2d);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, (bowlprop.rings[selring].xvals.min + bowlprop.pad) * view2d.scale, 0, Math.PI * 2);
    ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, (bowlprop.rings[selring].xvals.max - bowlprop.pad) * view2d.scale, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPoly(ctx, poly, fill = true, view2d) {
    ctx.beginPath();
    var point;
    for (var p = 0; p < poly.length; p++) {
        point = realToScreen(view2d, poly[p].x, poly[p].y, 0);
        if (p == 0) {
            ctx.moveTo(point.x, point.y - ctx.canvas.height / 2);
        } else {
            ctx.lineTo(point.x, point.y - ctx.canvas.height / 2);
        }
    }
    ctx.closePath();
    if (fill) { ctx.fill(); }
    ctx.stroke();
}