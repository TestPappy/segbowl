import { calcRingTrapz } from "./ring_calculator.mjs";
import { clearCanvas, drawCurve, drawRing, drawSegProfile } from "./drawing.js";
import { capitalize, reduce } from "./common.mjs";

export function createReport(nwindow, bowlprop, step, ctrl, view2d, view3d, style) {
    
    setTimeout(() => { 
        const table = nwindow.document.getElementById('cutlist');
    
        for (let i = 0; i < bowlprop.usedrings; i++) {
            add_cutlist_row(table, bowlprop, i, step, ctrl);
        }

        // Show segment numbers
        const segnum_preset = window.document.getElementById("showsegnum").checked;
        window.document.getElementById("showsegnum").checked = true;

        // Add pictures
        ctrl.selring = null;
        ctrl.selseg = [];
        const bcanvas = document.getElementById("backcanvas");
        const ctx = bcanvas.getContext("2d");
        ctx.canvas.width = view2d.canvas.width;
        ctx.canvas.height = view2d.canvas.height;
        clearCanvas(bcanvas, ctx, view2d.canvas.height);
        drawCurve(ctx, bowlprop, view2d, style);
        drawSegProfile(ctx, bowlprop, view2d, ctrl, style);
        
        const bowl_profile = nwindow.document.getElementById('bowl_profile');
        bowl_profile.innerHTML = '<img src="' + bcanvas.toDataURL("image/png") + '" width="60%"/>';
        
        const bowl_3d_picture = nwindow.document.getElementById('bowl_3d_picture');
        view3d.renderer.render(view3d.scene, view3d.camera);
        bowl_3d_picture.innerHTML = '<img src="' + view3d.renderer.domElement.toDataURL("image/png") + '" width="60%"/>';

        const ring_2d_pictures = nwindow.document.getElementById('ring_2d_pictures');
        for (let i = 0; i < bowlprop.usedrings; i++) {
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
    const html_element = nwindow.document.getElementById(name);
    html_element.innerHTML += ('<table id="cutlist_ring' + no + '"></table');
    const table_per_ring = nwindow.document.getElementById('cutlist_ring' + no);
    const table_per_ring_header = table_per_ring.createTHead().insertRow();
    for (let c = 0; c < table.rows[0].cells.length; c++) {
        const cell = table_per_ring_header.insertCell(c); 
        cell.innerHTML = ('<b>' + table.rows[0].cells[c].innerText + '</b>\n');
    }
    const table_per_ring_body = table_per_ring.createTBody();
    add_cutlist_row(table_per_ring_body, bowlprop, no, step, ctrl);
}

function add_cutlist_row(table, bowlprop, no, step, ctrl) {
    const seglist = getReportSegsList(bowlprop, no);

    for (let s = 0; s < seglist.length; s++) {
        const row = table.insertRow(table.rows.length);
        if (s == 0) {
            const cell_ring = row.insertCell(0);
            if (no == 0) {
                cell_ring.innerHTML = "Base";
            } else {
                cell_ring.innerHTML = no;
            }

            const cell_diameter = row.insertCell(1);
            cell_diameter.innerHTML = reduce(bowlprop.rings[no].xvals.max * 2, step, ctrl);

            const cell_thickness = row.insertCell(2);
            cell_thickness.innerHTML = reduce(bowlprop.rings[no].height, step, ctrl);

            const cell_rotation = row.insertCell(3);
            cell_rotation.innerHTML = (180 / Math.PI * bowlprop.rings[no].theta).toFixed(2).concat("&deg;");    
        } else {
            row.insertCell(0);
            row.insertCell(1);
            row.insertCell(2);
            row.insertCell(3);
        }
        const cell_color = row.insertCell(4);
        cell_color.innerHTML = capitalize(seglist[s].wood);

        const cell_segments = row.insertCell(5);
        cell_segments.innerHTML = seglist[s].cnt;

        const cell_cut_angle = row.insertCell(6);
        cell_cut_angle.innerHTML = seglist[s].theta.toFixed(2).concat("&deg;");

        const cell_outside_length = row.insertCell(7);
        cell_outside_length.innerHTML = reduce(seglist[s].outlen, step, ctrl);

        const cell_inside_length = row.insertCell(8);
        cell_inside_length.innerHTML = reduce(seglist[s].inlen, step, ctrl);

        const cell_strip_width = row.insertCell(9);
        cell_strip_width.innerHTML = reduce(seglist[s].width, step, ctrl);

        const cell_strip_length = row.insertCell(10);
        cell_strip_length.innerHTML = reduce(seglist[s].length, step, ctrl);

        const cell_strip_length_total = row.insertCell(11);
        cell_strip_length_total.innerHTML = reduce(seglist[s].length + (ctrl.sawkerf * seglist[s].cnt), step, ctrl);
    }
}


export function getReportSegsList(bowlprop, ring) {
    const col_size_segs = [];
    const seginfo = [];
    const trapzResult = calcRingTrapz(bowlprop, ring, false);
    Object.assign(bowlprop, trapzResult);
    for (let seg = 0; seg < bowlprop.rings[ring].segs; seg++) {
        const col = bowlprop.rings[ring].clrs[seg];
        const seglen = bowlprop.rings[ring].seglen[seg];
        const idx = col_size_segs.indexOf(col + "-" + seglen);
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