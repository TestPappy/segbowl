import { calcRingTrapz } from "./ring_calculator.mjs";
import { clearCanvas, drawCurve, drawRing, drawSegProfile } from "./drawing.js";
import { capitalize } from "./common.mjs";

export function createReport(nwindow, bowlprop, step, ctrl, view2d, view3d, style) {
    
    setTimeout(() => { 
        var table = nwindow.document.getElementById('cutlist');
    
        for (var i = 0; i < bowlprop.usedrings; i++) {
            add_cutlist_row(table, bowlprop, i, step, ctrl);
        }

        // Show segment numbers
        var segnum_preset = window.document.getElementById("showsegnum").checked;
        window.document.getElementById("showsegnum").checked = true;

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
        bowl_profile.innerHTML = '<img src="' + bcanvas.toDataURL("image/png") + '" width="60%"/>';
        
        var bowl_3d_picture = nwindow.document.getElementById('bowl_3d_picture');
        view3d.renderer.render(view3d.scene, view3d.camera);
        bowl_3d_picture.innerHTML = '<img src="' + view3d.renderer.domElement.toDataURL("image/png") + '" width="60%"/>';

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
            add_cut_list_table_with_header(nwindow, 'ring_2d_pictures', table, i, bowlprop, step, ctrl);
        }

        // Reset segment number option
        window.document.getElementById("showsegnum").checked = segnum_preset;
    }, 500);

}

function add_cut_list_table_with_header(nwindow, name, table, no, bowlprop, step, ctrl) {
    var html_element = nwindow.document.getElementById(name);
    html_element.innerHTML += ('<table id="cutlist_ring' + no + '"></table');
    var table_per_ring = nwindow.document.getElementById('cutlist_ring' + no);
    var table_per_ring_header = table_per_ring.createTHead().insertRow();
    for (var c = 0; c < table.rows[0].cells.length; c++) {
        var cell = table_per_ring_header.insertCell(c); 
        cell.innerHTML = ('<b>' + table.rows[0].cells[c].innerText + '</b>\n');
    }
    var table_per_ring_body = table_per_ring.createTBody()
    add_cutlist_row(table_per_ring_body, bowlprop, no, step, ctrl);
}

function add_cutlist_row(table, bowlprop, no, step, ctrl) {
    var seglist = getReportSegsList(bowlprop, no);

    for (var s = 0; s < seglist.length; s++) {
        var row = table.insertRow(table.rows.length);
        if (s == 0) {
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
        } else {
            row.insertCell(0);
            row.insertCell(1);
            row.insertCell(2);
            row.insertCell(3);
        }
        var cell_color = row.insertCell(4);
        cell_color.innerHTML = capitalize(seglist[s].wood);

        var cell_segments = row.insertCell(5);
        cell_segments.innerHTML = seglist[s].cnt;

        var cell_cut_angle = row.insertCell(6);
        cell_cut_angle.innerHTML = seglist[s].theta.toFixed(2).concat("&deg;");

        var cell_outside_length = row.insertCell(7);
        cell_outside_length.innerHTML = reduce(seglist[s].outlen, step, ctrl);

        var cell_inside_length = row.insertCell(8);
        cell_inside_length.innerHTML = reduce(seglist[s].inlen, step, ctrl);

        var cell_strip_width = row.insertCell(9);
        cell_strip_width.innerHTML = reduce(seglist[s].width, step, ctrl);

        var cell_strip_length = row.insertCell(10);
        cell_strip_length.innerHTML = reduce(seglist[s].length, step, ctrl);

        var cell_strip_length_total = row.insertCell(11);
        cell_strip_length_total.innerHTML = reduce(seglist[s].length + (ctrl.sawkerf * seglist[s].cnt), step, ctrl)
    }
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
    var col_size_segs = [];
    var seginfo = [];
    calcRingTrapz(bowlprop, ring, false);
    for (var seg = 0; seg < bowlprop.rings[ring].segs; seg++) {
        var col = bowlprop.rings[ring].clrs[seg];
        var seglen = bowlprop.rings[ring].seglen[seg];
        var idx = col_size_segs.indexOf(col + "-" + seglen);
        if (idx == -1) {
            seginfo.push({
                theta:  180 / bowlprop.rings[ring].segs * bowlprop.rings[ring].seglen[seg],
                outlen: 2 * bowlprop.seltrapz[seg][1].y,
                inlen:  2 * bowlprop.seltrapz[seg][0].y,
                width:  bowlprop.seltrapz[seg][1].x - bowlprop.seltrapz[seg][0].x,
                length: 2 * bowlprop.seltrapz[seg][1].y,
                color:  bowlprop.rings[ring].clrs[seg],
                wood:   bowlprop.rings[ring].wood[seg],
                cnt:    1
            });
            col_size_segs.push(col + "-" + seglen);
        } else {
            seginfo[idx].length += seginfo[idx].outlen;
            seginfo[idx].cnt++;
        }
    }
    return seginfo;
}