import { calcRingTrapz } from "./ring_calculator.mjs";
import { clearCanvas, drawCurve, drawRing, drawSegProfile } from "./drawing.js";

export function createReport(nwindow, bowlprop, step, ctrl, view2d, view3d, style) {
    
    setTimeout(() => { 
        var table = nwindow.document.getElementById('cutlist');
    
        for (var i = 0; i < bowlprop.usedrings; i++) {
            add_cutlist_row(table, bowlprop, i, step, ctrl);
        }

        // Add pictures
        ctrl.selring = null,
            ctrl.selseg = [];
        var bcanvas = document.getElementById("backcanvas");
        var ctx = bcanvas.getContext("2d");
        ctx.canvas.width = view2d.canvas.width;
        ctx.canvas.height = view2d.canvas.height;
        clearCanvas(bcanvas, ctx, view2d.canvas.height);
        drawCurve(ctx, bowlprop, view2d, style);
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        var bowl_profile = nwindow.document.getElementById('bowl_profile');
        bowl_profile.innerHTML = '<img src="' + bcanvas.toDataURL("image/png") + '"/>'
        
        var bowl_3d_picture = nwindow.document.getElementById('bowl_3d_picture');
        view3d.renderer.render(view3d.scene, view3d.camera);
        bowl_3d_picture.innerHTML = '<img src="' + view3d.renderer.domElement.toDataURL("image/png") + '"/>';

        var ring_2d_pictures = nwindow.document.getElementById('ring_2d_pictures');
        for (var i = 0; i < bowlprop.usedrings; i++) {
            clearCanvas(bcanvas, ctx, view2d.canvas.height);
            drawRing(ctx, i, bowlprop, view2d, ctrl, style);
            if (i > 0) {
                ring_2d_pictures.innerHTML += ('<h3>Ring ' + i + '</h3> \n');
            } else {
                ring_2d_pictures.innerHTML += ('<h3>Base</h3> \n');
            }
            ring_2d_pictures.innerHTML += ('<p><img src="' + bcanvas.toDataURL("image/png") + '"/>\n');
        }
    }, 500);
 



        // nwindow.document.close();
}

function add_cutlist_row(table, bowlprop, no, step, ctrl) {
    var row = table.insertRow(table.rows.length);
    var cell_ring = row.insertCell(0);
    if (no == 0) {
        cell_ring.innerHTML = "Base";
    } else {
        cell_ring.innerHTML = no;
    }

    var cell_diameter = row.insertCell(1);
    cell_diameter.innerHTML = reduce(bowlprop.rings[no].xvals.max * 2, step, ctrl);

    var cell_thickness = row.insertCell(2);
    cell_thickness.innerHTML = reduce(bowlprop.rings[no].height, step, ctrl);

    var cell_rotation = row.insertCell(3);
    cell_rotation.innerHTML = (180 / Math.PI * bowlprop.rings[no].theta).toFixed(2).concat("&deg;");
    
    var seglist = getReportSegsList(bowlprop, no);

    if (seglist.length > 1) {
        console.log("FOUND MORE THAN ONE SEGLIST!!!!");
    }

    var cell_segments = row.insertCell(4);
    cell_segments.innerHTML = seglist[0].cnt;

    var cell_cut_angle = row.insertCell(5);
    cell_cut_angle.innerHTML = seglist[0].theta.toFixed(2).concat("&deg;");

    var cell_outside_length = row.insertCell(6);
    cell_outside_length.innerHTML = reduce(seglist[0].outlen, step, ctrl);

    var cell_inside_length = row.insertCell(7);
    cell_inside_length.innerHTML = reduce(seglist[0].inlen, step, ctrl);

    var cell_strip_width = row.insertCell(8);
    cell_strip_width.innerHTML = reduce(seglist[0].width, step, ctrl);

    var cell_strip_length = row.insertCell(9);
    cell_strip_length.innerHTML = reduce(seglist[0].length, step, ctrl);

}

export function reduce(value, step = null, ctrl) {
    if (ctrl.inch == false) {
        return (value * 25.4).toFixed(1).concat(' mm');
    } else if (isNaN(step) || step == "decimal") {
        return value.toFixed(1).concat('"');
    }
    if (step == null) { step = ctrl.step; }

    if (value == 0) { return '0"'; }
    var numerator = Math.round(value / step);
    var denominator = 1 / step;
    if (numerator == denominator) { return '1"'; };
    var gcd = function gcd(a, b) {
        return b ? gcd(b, a % b) : a;
    };
    gcd = gcd(numerator, denominator);
    if (gcd == denominator) { return (numerator / denominator).toString().concat('"'); } // Whole number
    if (numerator > denominator) { //Mixed fraction
        var whole = Math.floor(numerator / denominator);
        numerator = numerator % denominator;
        return whole.toString().concat(' ').concat(numerator / gcd).toString().concat('&frasl;').concat((denominator / gcd).toString().concat('"'));
    }
    return (numerator / gcd).toString().concat('&frasl;').concat((denominator / gcd).toString().concat('"'));
}

export function getReportSegsList(bowlprop, ring) {
    var donesegs = [];
    var seginfo = [];
    calcRingTrapz(bowlprop, ring, false);
    for (var seg = 0; seg < bowlprop.rings[ring].segs; seg++) {
        var idx = donesegs.indexOf(bowlprop.rings[ring].seglen[seg]);
        if (idx == -1) {
            seginfo.push({
                theta: 180 / bowlprop.rings[ring].segs * bowlprop.rings[ring].seglen[seg],
                outlen: 2 * bowlprop.seltrapz[seg][1].y,
                inlen: 2 * bowlprop.seltrapz[seg][0].y,
                width: bowlprop.seltrapz[seg][1].x - bowlprop.seltrapz[seg][0].x,
                length: 2 * bowlprop.seltrapz[seg][1].y,
                cnt: 1
            });
            donesegs.push(bowlprop.rings[ring].seglen[seg]);
        } else {
            seginfo[idx].length += seginfo[idx].outlen;
            seginfo[idx].cnt++;
        }
    }
    return seginfo;
}