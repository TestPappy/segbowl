/* Segmented Bowl Designer
  (c) 2017, Collin J. Delker
  (c) 2024, Patrick Prill
  Released under the MIT License
*/
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { defaultColors, defaultWood, defaultLens, capitalize, reduce as reduceValue } from './common.js';
import { screenToRealPoint, realToScreen, screenToReal, calcBezPath, splitRingY, offsetCurve } from './bowl_calculator.js';
import { calcRings } from './ring_calculator.js';
import { createReport, getReportSegsList } from './report.js';
import { clearCanvas, drawCurve, drawRing, drawSegProfile } from './drawing.js';
import * as PERSISTENCE from './persistence.js';

(() => {
    const version = "0.2";

    let bowlprop = {
        radius: null,
        height: null,
        thick: .25,
        pad: .125,
        cpoint: null,
        curvesegs: 50,
        rings: [{ height: .5, segs: 12, clrs: defaultColors(), wood: defaultWood(), seglen: defaultLens(), xvals: [], theta: 0 }],
        usedrings: 1,

        seltrapz: null,
        selthetas: null, // List of theta angles starting each segment in selected ring
    };

    let ctrl = {
        drag: null,
        dPoint: null,
        selring: 1,
        selseg: [],
        copyring: null,
        step: 1 / 16,
        inch: true, // Inches or mm
        sawkerf: .125,
    };

    const view2d = {
        canvas: null,
        ctx: null,
        canvas2: null,
        ctx2: null,
        canvasinches: 8,
        scale: null,
        bottom: null,
        centerx: null, // X-position of center
    };

    const view3d = {
        canvas: null,
        renderer: null,
        scene: null,
        camera: null,
        geom: [],
        mesh: [],
    };

    const style = {
        curve: { width: 8, color: "#333" },
        cpline: { width: 1, color: "#06C" },
        point: { radius: 5, width: 2, color: "#06C", fill: "rgba(200,200,200,0.5)" },
        segs: { width: 1, color: "#935" },
        selring: { width: 3, color: "#FF9900" },
        selseg: { width: 3, color: "#FF0" },
        copyring: { width: 3, color: "#0000FF" },
        gratio: { width: 1, color: "#555555" }
    };

    // DOM helper - cache getElementById calls
    const el = id => document.getElementById(id);

    // Material cache for THREE.js - reuse materials with same color
    const materialCache = new Map();
    function getMaterial(color) {
        if (!materialCache.has(color)) {
            const mat = new THREE.MeshPhongMaterial({ color });
            mat.side = THREE.DoubleSide;
            materialCache.set(color, mat);
        }
        return materialCache.get(color);
    }

    /*======================
     Initialize
    ======================*/
    function init() {
        view2d.bottom = view2d.canvas.height - 0.5 * view2d.scale;
        view2d.centerx = view2d.canvas.width / 2;

        bowlprop.cpoint = [
            { x: view2d.centerx + 1.0 * view2d.scale, y: view2d.bottom },
            { x: view2d.centerx + 2.0 * view2d.scale, y: view2d.bottom },
            { x: view2d.centerx + 2.0 * view2d.scale, y: view2d.bottom - 3.0 * view2d.scale },
            { x: view2d.centerx + 2.5 * view2d.scale, y: view2d.bottom - 3.5 * view2d.scale }, // This point is will also be start of next bezier curve
        ];

        view2d.canvas.onmousedown = mouseClick;
        view2d.canvas.onmousemove = dragging;
        view2d.canvas.onmouseup = view2d.canvas.onmouseout = dragEnd;
        view2d.canvas.ondblclick = addRemovePoint;
        view2d.canvas2.onmousedown = segClick;

        el("btnView").onclick = showMenu;
        el("btnOptions").onclick = showMenu;
        el("btnBowl").onclick = showMenu;
        el("btnRing").onclick = showMenu;
        el("btnSeg").onclick = showMenu;
        el("btnCopy").onclick = ringCopy;
        el("btnPaste").onclick = ringPaste;
        el("zoomIn").onclick = zoom;
        el("zoomOut").onclick = zoom;
        el("inptThick").oninput = thickChange;
        el("inptPad").oninput = padChange;
        el("showsegs").onchange = drawCanvas;
        el("showsegnum").onchange = drawCanvas;
        el("showratio").onchange = drawCanvas;
        el("segHup").onclick = setSegHeight;
        el("segHdn").onclick = setSegHeight;
        el("segNup").onclick = setSegCnt;
        el("segNdn").onclick = setSegCnt;
        el("segLup").onclick = setSegL;
        el("segLdn").onclick = setSegL;
        el("segLreset").onclick = setSegL;
        el("ringrot").onchange = rotateRing;
        el("btnTwist").onclick = twist;
        el("viewRing").onclick = setView;
        el("view3D").onclick = setView;
        el("viewProf").onclick = setView;
        el("inch").onclick = unitChange;
        el("mm").onclick = unitChange;
        el("gentable").onclick = genReport;
        el("about").onclick = about;
        el("loaddesign").onclick = load;
        el("savedesign").onclick = save;
        el("cleardesign").onclick = clear;
        el("sawkerf").onchange = saveSawKerf;
        window.addEventListener('resize', resizeWindow);
        const btnclrclass = document.getElementsByClassName("clrbtn");
        for (let i = 0; i < btnclrclass.length; i++) {
            btnclrclass[i].onclick = colorChange;
        }

        el("btnPal").onclick = showPalette;

        drawCanvas();

        // Now init the 3D view
        view3d.canvas = el("canvas3d");
        view3d.canvas.width = view2d.ctx.canvas.width;
        view3d.canvas.height = view2d.ctx.canvas.height;

        view3d.renderer = new THREE.WebGLRenderer({ canvas: view3d.canvas, antialias: true });
        view3d.renderer.setClearColor("lightblue");

        view3d.scene = new THREE.Scene();
        view3d.camera = new THREE.PerspectiveCamera(45, 1, 1, 100);
        view3d.camera.position.set(0, view2d.canvasinches, view2d.canvasinches + 3);
        const camlight = new THREE.PointLight(0xAAAAAA);
        camlight.position.set(20, 30, 20);
        view3d.camera.add(camlight);

        const controls = new OrbitControls(view3d.camera, view3d.renderer.domElement);
        controls.target.set(0, 4, 0);
        controls.update();
        controls.addEventListener("change", render3D);
        view3d.scene.add(view3d.camera);
        const light = new THREE.AmbientLight(0xffffff, .6);
        view3d.scene.add(light);
        /* var axisHelper = new THREE.AxisHelper(5);
        view3d.scene.add(axisHelper);  */
        build3D();
        checkStorage();
    }

    /*======================
      Drawing functions
    ======================*/

    function drawControlLines(ctx) {
        ctx.lineWidth = style.cpline.width;
        ctx.strokeStyle = style.cpline.color;
        ctx.beginPath();
        ctx.moveTo(bowlprop.cpoint[0].x, bowlprop.cpoint[0].y);
        for (let i = 0; i < bowlprop.cpoint.length - 1; i += 3) {
            ctx.lineTo(bowlprop.cpoint[i + 1].x, bowlprop.cpoint[i + 1].y);
            ctx.moveTo(bowlprop.cpoint[i + 2].x, bowlprop.cpoint[i + 2].y);
            ctx.lineTo(bowlprop.cpoint[i + 3].x, bowlprop.cpoint[i + 3].y);
        }
        ctx.stroke();
    }

    function drawScale(ctx, size) {
        const topleft = realToScreen(view2d, -bowlprop.radius, bowlprop.height);
        const botright = realToScreen(view2d, bowlprop.radius, 0);
        const middleX = (botright.x + topleft.x)/2;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(middleX, 10);
        ctx.lineTo(botright.x, 10);
        ctx.moveTo(middleX, 5);
        ctx.lineTo(middleX, 15);
        ctx.moveTo(botright.x, 5);
        ctx.lineTo(botright.x, 15);
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(size, (middleX + botright.x)/2, 25);
        ctx.stroke();
    }

    function getMaxDiameter() {
        const diameters = bowlprop.rings
            .map(r => (r.xvals && typeof r.xvals.max === 'number') ? r.xvals.max * 2 : 0);
        const maxDiameter = Math.max(...diameters, 0);
        return reduce(maxDiameter / 2);
    }

    function drawControlPoints(ctx) {
        for (let i = 0; i < bowlprop.cpoint.length; i++) {
            ctx.lineWidth = style.point.width;
            ctx.strokeStyle = style.point.color;
            ctx.fillStyle = style.point.fill;
            ctx.beginPath();
            ctx.arc(bowlprop.cpoint[i].x, bowlprop.cpoint[i].y, style.point.radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }

    function drawGRatio(ctx) {
        ctx.lineWidth = style.gratio.width;
        ctx.strokeStyle = style.gratio.color;
        const topleft = realToScreen(view2d, -bowlprop.radius, bowlprop.height);
        const botright = realToScreen(view2d, bowlprop.radius, 0);
        const g = (botright.y - topleft.y) / 1.618;
        const g2 = (botright.x - topleft.x) / 1.618;
        ctx.beginPath();
        ctx.rect(topleft.x, topleft.y, 2 * bowlprop.radius * view2d.scale, bowlprop.height * view2d.scale);
        ctx.stroke();
        ctx.setLineDash([5]);
        ctx.moveTo(topleft.x, topleft.y + g);
        ctx.lineTo(botright.x, topleft.y + g);
        ctx.moveTo(topleft.x, botright.y - g);
        ctx.lineTo(botright.x, botright.y - g);
        ctx.moveTo(topleft.x + g2, topleft.y);
        ctx.lineTo(topleft.x + g2, botright.y);
        ctx.moveTo(botright.x - g2, topleft.y);
        ctx.lineTo(botright.x - g2, botright.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawCanvas() {
        clearCanvas(view2d.canvas, view2d.ctx, view2d.canvas.height);
        clearCanvas(view2d.canvas2, view2d.ctx2, view2d.canvas.height);
        if (el("showsegs").checked) {
            drawSegProfile(view2d.ctx, bowlprop, view2d, ctrl, style);
        }
        if (el("showratio").checked) {
            drawGRatio(view2d.ctx);
        }
        drawControlLines(view2d.ctx);
        drawCurve(view2d.ctx, bowlprop, view2d, style);
        drawControlPoints(view2d.ctx);
        drawScale(view2d.ctx, getMaxDiameter());
        if (el("canvas2").style.display != "none" && ctrl.selring != null) {
            drawRing(view2d.ctx2, ctrl.selring, bowlprop, view2d, ctrl, style);
        }
        updateRingInfo();
    }

    function build3D() {
        if (el("canvas3d").style.display == 'none') { return; } // Don't calculate if not shown
        const curve = calcBezPath(view2d, bowlprop);
        const ringResult = calcRings(view2d, bowlprop);
        Object.assign(bowlprop, ringResult);
        const offcurve = offsetCurve(curve, bowlprop.thick / 2);
        for (let m = 0; m < view3d.mesh.length; m++) {
            view3d.mesh[m].geometry.dispose();
            // Materials are cached and reused - don't dispose
            view3d.scene.remove(view3d.mesh[m]);
        }
        view3d.mesh = [];

        let curvesegs = splitRingY(offcurve.c2, bowlprop); // Outer wall
        for (let i = 0; i < curvesegs.length; i++) {
            if (curvesegs[i].length > 1) {
                let tottheta = bowlprop.rings[i].theta;
                for (let seg = 0; seg < bowlprop.rings[i].segs; seg++) {
                    const theta = (2 * Math.PI / bowlprop.rings[i].segs) * bowlprop.rings[i].seglen[seg];
                    const material = getMaterial(bowlprop.rings[i].clrs[seg]);
                    view3d.mesh.push(new THREE.Mesh(
                        new THREE.LatheGeometry(
                            curvesegs[i], 10, tottheta, theta), material));
                    tottheta += theta;
                    view3d.scene.add(view3d.mesh[view3d.mesh.length - 1]);
                }
            }
        }
        curvesegs = splitRingY(offcurve.c1, bowlprop); // Inner wall
        for (let i = 0; i < curvesegs.length; i++) {
            if (curvesegs[i].length > 1) {
                let tottheta = bowlprop.rings[i].theta;
                for (let seg = 0; seg < bowlprop.rings[i].segs; seg++) {
                    const theta = (2 * Math.PI / bowlprop.rings[i].segs) * bowlprop.rings[i].seglen[seg];
                    const material = getMaterial(bowlprop.rings[i].clrs[seg]);
                    view3d.mesh.push(new THREE.Mesh(
                        new THREE.LatheGeometry(
                            curvesegs[i], 10, tottheta, theta), material));
                    tottheta += theta;
                    view3d.scene.add(view3d.mesh[view3d.mesh.length - 1]);
                }
            }
        }
        render3D();
    }

    function render3D() {
        view3d.renderer.render(view3d.scene, view3d.camera);
    }

    /*======================
     Event handlers
    ======================*/
    function showMenu(event) {
        const s = {
            btnOptions: "mnuOptions",
            btnView: "mnuView",
            btnBowl: "mnuBowl",
            btnRing: "mnuRing",
            btnSeg: "mnuSeg"
        }[event.target.id];
        const e = el(s);
        if (e.style.display == "none") { e.style.display = "inline"; }
        else { e.style.display = "none"; }
    }

    function range(start, stop, step = 1) {
        const A = [];
        for (let i = start; i <= stop; i += step) { A.push(i); }
        return A;
    }

    function segClick(e) {
        const pos = mousePos(e, view2d.canvas2);
        let theta, seg;
        const dx = (pos.x - view2d.centerx) / view2d.scale;
        const dy = (pos.y - view2d.centerx) / view2d.scale; // Always a square
        const r = Math.sqrt((dx * dx) + (dy * dy));
        if (r >= bowlprop.rings[ctrl.selring].xvals.min - bowlprop.pad && r < bowlprop.rings[ctrl.selring].xvals.max + bowlprop.pad) {
            const inc = el("segselect").value;
            if (inc == "all") {
                ctrl.selseg = range(0, bowlprop.rings[ctrl.selring].segs - 1);
            } else {
                theta = (Math.atan2(-dy, dx) + 2 * Math.PI) % (2 * Math.PI);
                for (let s = 1; s < bowlprop.selthetas.length; s++) {
                    if (theta <= bowlprop.selthetas[s]) { seg = s - 1; break; }
                    seg = bowlprop.selthetas.length - 1;
                }
                if (inc == "single") {
                    ctrl.selseg = [seg];
                } else {
                    ctrl.selseg = range(seg % parseInt(inc), bowlprop.rings[ctrl.selring].segs - 1, parseInt(inc));
                }
            }
        } else {
            ctrl.selseg = [];
        }
        drawCanvas();
    }

    function mouseClick(e) {
        let pos = mousePos(e, view2d.canvas);
        let dx, dy;
        // Check if near a control point
        for (let i = 0; i < bowlprop.cpoint.length; i++) {
            dx = bowlprop.cpoint[i].x - pos.x;
            dy = bowlprop.cpoint[i].y - pos.y;
            if ((dx * dx) + (dy * dy) < style.point.radius * style.point.radius) {
                ctrl.drag = i;
                ctrl.dPoint = pos;
                view2d.canvas.style.cursor = "move";
                return;
            }
        }
        // Not near ctrl point, check if in a segment
        pos = screenToRealPoint(view2d, pos.x, pos.y);
        let y = -bowlprop.thick / 2;
        for (let i = 0; i < bowlprop.rings.length; i++) {
            if (pos.x > bowlprop.rings[i].xvals.min && pos.x < bowlprop.rings[i].xvals.max
                && pos.y > y && pos.y < y + bowlprop.rings[i].height) {
                ctrl.selring = i;
                ctrl.selseg = [];
                drawCanvas();
                setRingHtxt();
                setSegCntTxt();
                el("ringrot").value = bowlprop.rings[i].theta * 180 / Math.PI;
                return;
            }
            y += bowlprop.rings[i].height;
        }
        ctrl.selring = null; // Not near anything
        drawCanvas();
    }

    function dragging(e) {
        if (ctrl.drag !== null) {
            const pos = mousePos(e, view2d.canvas);
            bowlprop.cpoint[ctrl.drag].x += pos.x - ctrl.dPoint.x;
            bowlprop.cpoint[ctrl.drag].y += pos.y - ctrl.dPoint.y;
            ctrl.dPoint = pos;
            drawCanvas();
            if (el("redrawdrag").checked) {
                build3D();
            }
        }
    }

    function dragEnd() {
        ctrl.drag = null;
        view2d.canvas.style.cursor = "default";
        drawCanvas();
        build3D();
    }

    function addRemovePoint(e) {
        // If position (e) close to existing control point, remove it
        // otherwise if close to line, add a new control point
        const pos = mousePos(e, view2d.canvas);
        let dx, dy;
        for (let i = 0; i < bowlprop.cpoint.length; i += 3) { // Go by 3 to get cpoints ON line
            dx = bowlprop.cpoint[i].x - pos.x;
            dy = bowlprop.cpoint[i].y - pos.y;
            if ((dx * dx) + (dy * dy) < style.point.radius * style.point.radius) {
                if (i == 0 || i == bowlprop.cpoint.length - 1) { return; } // Don't remove first or last point
                bowlprop.cpoint.splice(i - 1, 3); // Remove point and associated ctrl pts
                drawCanvas();
                return;
            }
        }

        let dmin = 1000, imin;
        const path = calcBezPath(view2d, bowlprop, false);
        for (let i = 1; i < path.length; i++) {
            dx = path[i].x - pos.x;
            dy = path[i].y - pos.y;
            if (dmin > dx * dx + dy * dy) { // Find closest point to the curve
                dmin = dx * dx + dy * dy;
                imin = i;
            }
        }
        if (dmin < style.point.radius * style.point.radius) {
            // If we're close enough, insert a point and 2 tangential control points
            const t = imin / path.length - path.length / bowlprop.curvesegs;
            const idx = 2 + 3 * Math.floor(imin / bowlprop.curvesegs);
            bowlprop.cpoint.splice(idx, 0, path[imin + 2]);
            bowlprop.cpoint.splice(idx, 0, path[imin]);
            bowlprop.cpoint.splice(idx, 0, path[imin - 2]);
            drawCanvas();
        }
    }

    // Wrapper to use shared reduce with local ctrl
    const reduce = (value, step = null) => reduceValue(value, step, ctrl);

    function mousePos(event, canvas) {
        event = (event ? event : window.event);
        return {
            x: event.pageX - canvas.offsetLeft,
            y: event.pageY - canvas.offsetTop
        };
    }

    function thickChange() {
        const slider = el("inptThick");
        bowlprop.thick = Number(slider.value);
        el("valThick").innerHTML = reduce(slider.value);
        drawCanvas();
        build3D();
    }

    function padChange() {
        const slider = el("inptPad");
        bowlprop.pad = Number(slider.value);
        el("valPad").innerHTML = reduce(slider.value);
        drawCanvas();
        build3D();
    }

    function setSegHeight(event) {
        if (ctrl.selring != null) {
            if (event.target.id === "segHup") {
                bowlprop.rings[ctrl.selring].height += ctrl.step;
            } else if (bowlprop.rings[ctrl.selring].height - ctrl.step > 0) {
                bowlprop.rings[ctrl.selring].height -= ctrl.step;
            }
            setRingHtxt();
            drawCanvas();
            build3D();
        }
    }

    function setSegCnt(event) {
        if (event.target.id === "segNup") {
            bowlprop.rings[ctrl.selring].segs += 1;
            if (bowlprop.rings[ctrl.selring].clrs.length < bowlprop.rings[ctrl.selring].segs) {
                bowlprop.rings[ctrl.selring].clrs.push(bowlprop.rings[ctrl.selring].clrs[bowlprop.rings[ctrl.selring].clrs.length - 1]);
            }
            if (bowlprop.rings[ctrl.selring].wood.length < bowlprop.rings[ctrl.selring].segs) {
                bowlprop.rings[ctrl.selring].wood.push(bowlprop.rings[ctrl.selring].wood[bowlprop.rings[ctrl.selring].wood.length - 1]);
            }
            bowlprop.rings[ctrl.selring].seglen = defaultLens(bowlprop.rings[ctrl.selring].segs); // just reset this
        } else if (bowlprop.rings[ctrl.selring].segs > 3) {
            bowlprop.rings[ctrl.selring].segs -= 1;
            bowlprop.rings[ctrl.selring].seglen = defaultLens(bowlprop.rings[ctrl.selring].segs); // just reset this
        }
        ctrl.selseg = [];
        setSegCntTxt();
        drawCanvas();
        build3D();
    }

    function setSegL(event) {
        if (event.target.id === "segLreset") {
            bowlprop.rings[ctrl.selring].seglen = defaultLens(bowlprop.rings[ctrl.selring].segs);
        } else if (ctrl.selseg.length != bowlprop.rings[ctrl.selring].segs) {
            let inc = .05; // 5%
            if (event.target.id === "segLdn") { inc = -inc; }
            const dec = inc * ctrl.selseg.length / (bowlprop.rings[ctrl.selring].segs - ctrl.selseg.length);
            for (let i = 0; i < ctrl.selseg.length; i++) {
                // Selected rings go up by inc
                bowlprop.rings[ctrl.selring].seglen[ctrl.selseg[i]] += inc;
            }
            for (let i = 0; i < bowlprop.rings[ctrl.selring].segs; i++) {
                if (ctrl.selseg.indexOf(i) == -1) {
                    bowlprop.rings[ctrl.selring].seglen[i] -= dec;
                }
            }
        }
        drawCanvas();
        build3D();
    }

    function rotateRing(event) {
        if (ctrl.selring != null) {
            bowlprop.rings[ctrl.selring].theta = Math.PI / 180 * event.target.value;
            drawCanvas();
            build3D();
        }
    }

    function twist() {
        const step = Math.PI / 180 * parseFloat(prompt("Enter total rotation", "30")) / bowlprop.usedrings;
        for (let i = 0; i < bowlprop.usedrings; i++) {
            bowlprop.rings[i].theta = i * step;
        }
        el("ringrot").value = bowlprop.rings[ctrl.selring].theta * 180 / Math.PI;
        drawCanvas();
        build3D();
    }

    function ringCopy() {
        ctrl.copyring = ctrl.selring;
        drawCanvas();
    }

    function ringPaste() {
        if (ctrl.selring && ctrl.copyring) { // Make a deep copy
            bowlprop.rings[ctrl.selring] = {
                height: bowlprop.rings[ctrl.copyring].height,
                segs: bowlprop.rings[ctrl.copyring].segs,
                clrs: [],
                wood: [],
                xvals: [],
                seglen: [],
                theta: bowlprop.rings[ctrl.copyring].theta,
            };
            for (const c in bowlprop.rings[ctrl.copyring].clrs) { bowlprop.rings[ctrl.selring].clrs.push(bowlprop.rings[ctrl.copyring].clrs[c]); }
            for (const c in bowlprop.rings[ctrl.copyring].wood) { bowlprop.rings[ctrl.selring].wood.push(bowlprop.rings[ctrl.copyring].wood[c]); }
            for (const c in bowlprop.rings[ctrl.copyring].seglen) { bowlprop.rings[ctrl.selring].seglen.push(bowlprop.rings[ctrl.copyring].seglen[c]); }
            ctrl.copyring = null;
            drawCanvas();
            build3D();
        }
    }

    function colorChange(event) {
        const clr = event.target.style.backgroundColor;
        for (let i = 0; i < ctrl.selseg.length; i++) {
            bowlprop.rings[ctrl.selring].clrs[ctrl.selseg[i]] = clr;
            bowlprop.rings[ctrl.selring].wood[ctrl.selseg[i]] = getWoodByColor(clr);
        }
        drawCanvas();
        build3D();
    }

    function setSegCntTxt() {
        el("segNtxt").innerHTML = "Segments: ".concat(bowlprop.rings[ctrl.selring].segs);
    }

    function setRingHtxt() {
        el("segHtxt").innerHTML = reduce(bowlprop.rings[ctrl.selring].height);
    }

    function setView(event) {
        let canv, ctrls;
        if (event.target.id === "viewProf") {
            canv = el("canvas");
            ctrls = el("segHctrl");
        }
        else if (event.target.id === "viewRing") {
            canv = el("canvas2");
            ctrls = el("segNctrl");
        } else {
            canv = el("canvas3d");
            ctrls = '';
        }

        if (event.target.checked) {
            canv.style.display = "inline";
            if (ctrls != null && ctrls != '') { ctrls.style.visibility = "visible"; }
        } else {
            canv.style.display = "none";
            if (ctrls != null && ctrls != '') { ctrls.style.visibility = "hidden"; }
        }
        resizeWindow();
    }

    function setUnit() {
        el("inch").checked = ctrl.inch
        el("mm").checked = !ctrl.inch
    }

    function unitChange() {
        const thick = el("inptThick");
        const pad = el("inptPad");
        if (el("inch").checked) {
            ctrl.inch = true;
            ctrl.step = 1 / 16;
            bowlprop.thick = roundTo(bowlprop.thick, 16);
            bowlprop.pad = roundTo(bowlprop.pad, 16);
            for (const p in bowlprop.rings) {
                bowlprop.rings[p].height = roundTo(bowlprop.rings[p].height, 16);
            }
            thick.setAttribute("step", 1 / 16);
            thick.value = bowlprop.thick;
            pad.setAttribute("step", 1 / 16);
            pad.value = bowlprop.pad;
            el("rptprec").style.visibility = "visible";
            el("zoomTxt").innerHTML = 'View: ' + (view2d.canvasinches).toFixed(0).concat('"');
        } else {
            ctrl.inch = false;
            ctrl.step = 0.5 / 25.4;
            bowlprop.thick = roundTo(bowlprop.thick * 25.4, 2) / 25.4;
            bowlprop.pad = roundTo(bowlprop.pad * 25.4, 2) / 25.4;
            for (const p in bowlprop.rings) {
                bowlprop.rings[p].height = roundTo(bowlprop.rings[p].height * 25.4, 2) / 25.4;
            }
            thick.setAttribute("step", 0.5 / 25.4);
            thick.setAttribute("value", bowlprop.thick);
            pad.setAttribute("step", 0.5 / 25.4);
            pad.setAttribute("value", bowlprop.pad);
            el("rptprec").style.visibility = "hidden";
            el("zoomTxt").innerHTML = 'View: ' + (view2d.canvasinches * 2.54).toFixed(0).concat(' cm');
        }
        thickChange();
        padChange();
        setRingHtxt();
        drawCanvas();
        loadSawKerf();
    }

    function loadSawKerf() {
        if (ctrl.inch) {
            el("sawkerf").value = ctrl.sawkerf;
        } else {
            el("sawkerf").value = (ctrl.sawkerf * 25.4).toFixed(3);
        }
    }

    function saveSawKerf() {
        if (ctrl.inch) {
            ctrl.sawkerf = el("sawkerf").value;
        } else {
            ctrl.sawkerf = (el("sawkerf").value / 25.4).toFixed(3);
        }
        loadSawKerf();
    }

    function zoom(event) {
        let inc, mult, unit;
        if (ctrl.inch) {
            inc = 1;
            mult = 1;
            unit = '"';
        } else {
            inc = 10 / 25.4; // 1cm?
            mult = 2.54;
            unit = ' cm';
        }
        if (event.target.id === "zoomIn") { inc = -inc; }
        if (event.target.id === "zoomIn" && view2d.canvasinches <= 2) { return; }
        const oldcp = screenToReal(view2d, bowlprop);

        view2d.canvasinches += inc;
        view2d.scale = view2d.ctx.canvas.width / view2d.canvasinches;
        view2d.bottom = view2d.canvas.height - 0.5 * view2d.scale;
        view2d.centerx = view2d.canvas.width / 2;
        el("zoomTxt").innerHTML = 'View: ' + (view2d.canvasinches * mult).toFixed(0).concat(unit);

        for (const p in oldcp) {
            bowlprop.cpoint[p] = realToScreen(view2d, oldcp[p].x, oldcp[p].y);
        }
        drawCanvas();
    }

    function roundTo(value, denom) {
        return Math.round(value * denom) / denom;
    }

    function resizeWindow() {
        const oldcp = screenToReal(view2d, bowlprop);
        let cnt = 0;
        if (el("canvas").style.display != "none") { cnt++; }
        if (el("canvas2").style.display != "none") { cnt++; }
        if (el("canvas3d").style.display != "none") { cnt++; }
        if (cnt > 0) {
            if (cnt > 1) {
                view2d.ctx.canvas.width = (window.innerWidth - el("left").clientWidth) / cnt - 15;
            } else {
                view2d.ctx.canvas.width = Math.min(el("left").clientHeight, window.innerWidth - el("left").clientWidth - 15);
            }
            view2d.ctx.canvas.height = view2d.ctx.canvas.width;
            view2d.ctx2.canvas.width = view2d.ctx.canvas.width;
            view2d.ctx2.canvas.height = view2d.ctx2.canvas.width;
            view2d.scale = view2d.ctx.canvas.width / view2d.canvasinches;
            view2d.bottom = view2d.canvas.height - 0.5 * view2d.scale;
            view2d.centerx = view2d.canvas.width / 2;

            view3d.renderer.setSize(view2d.ctx.canvas.width, view2d.ctx.canvas.height);
            view3d.camera.updateProjectionMatrix();
            for (const p in oldcp) {
                bowlprop.cpoint[p] = realToScreen(view2d, oldcp[p].x, oldcp[p].y);
            }
            drawCanvas();
            build3D();
        }
    }

    function updateRingInfo() {
        if (el("canvas2").style.display != "none" && ctrl.selring != null) {
            const step = 1 / parseInt(el("rptfmt").value);
            let txt = ["Ring:", ctrl.selring.toString(), "<br>",
                "Diameter:", reduce(bowlprop.rings[ctrl.selring].xvals.max * 2, step), "<br>",
                "Thickness:", reduce(bowlprop.rings[ctrl.selring].height, step), '<br><hr align="left" width="20%">'];
            const seglist = getReportSegsList(bowlprop, ctrl.selring);
            for (let seg = 0; seg < seglist.length; seg++) {
                txt = txt.concat([
                    "Segments:", seglist[seg].cnt, "<br>",
                    "&nbsp;Wood:", capitalize(seglist[seg].wood), "<br>",
                    "&nbsp;Angle:", seglist[seg].theta.toFixed(2).concat("&deg;"), "<br>",
                    "&nbsp;Outside Length:", reduce(seglist[seg].outlen, step), "<br>",
                    "&nbsp;Inside Length:", reduce(seglist[seg].inlen, step), "<br>",
                    "&nbsp;Width:", reduce(seglist[seg].width, step), "<br>",
                    "&nbsp;Strip Length:", reduce(seglist[seg].length, step), "<br>",
                    "&nbsp;Total Strip Length:", reduce(seglist[seg].length + (ctrl.sawkerf * seglist[seg].cnt), step), "<br>",
                    '<hr align="left" width="20%">'
                ]);
            }
            el("report").innerHTML = txt.join(" ");
        } else {
            el("report").innerHTML = "";
        }
    }

    function genReport() {
        const step = 1 / parseInt(el("rptfmt").value);
        const nwindow = window.open('report.html', 'Report', 'height=800,width=1000');
        createReport(nwindow, bowlprop, step, ctrl, view2d, view3d, style);
    }

    function getWoodByColor(clr) {
        const woodByColorMap = new Map();
        woodByColorMap.set('rgb(226, 202, 160)', 'maple');  //#E2CAA0
        woodByColorMap.set('rgb(173, 116, 63)', 'beech');   //#AD743F
        woodByColorMap.set('rgb(153, 80, 24)', 'cherry');   //#995018
        woodByColorMap.set('rgb(123, 79, 52)', 'walnut');   //#7B4F34
        woodByColorMap.set('rgb(98, 51, 41)', 'teak');      //#623329
        woodByColorMap.set('rgb(68, 37, 43)', 'cocobolo');  //#E2CAA0
        woodByColorMap.set('rgb(132, 62, 75)', 'amaranth'); //#843E4B
        if (woodByColorMap.has(clr)) {
            return woodByColorMap.get(clr);
        } else {
            console.log("No match for: " + clr);
            return "unknown";
        }
    }

    function showPalette() {
        const woodcolors = [
            '#FDFAF4', '#E2CAA0', '#C29A1F', '#C98753', '#AC572F', '#995018', '#7B4F34',
            '#6E442E', '#623329', '#51240D', '#EFEBE0', '#EFB973', '#AD743F', '#965938',
            '#884B2F', '#7C3826', '#843E4B', '#582824', '#44252B', '#342022'
        ];
        const brightcolors = [
            "#FF0000", "#FF8000", "#FFFF00", "#80FF00", "#00FF80", "#00FFFF", "#0080FF",
            "#0000FF", "#FF00FF", "#800040", "#FF6666", "#FFCC66", "#FFFF66", "#CCFF66",
            "#66FF66", "#66FFCC", "#66CCFF", "#6666FF", "#CC66FF", "#000000"
        ];

        el("colortype").onchange =
            function (event) {
                let clist;
                if (event.target.value === "wood") {
                    clist = woodcolors;
                } else {
                    clist = brightcolors;
                }
                const buttons = document.getElementsByClassName("clrsel");
                for (const i in clist) {
                    buttons[i].style.backgroundColor = clist[i];
                }
            };

        function dragclr(ev) {
            ev.dataTransfer.setData("text", ev.target.style.backgroundColor);
        }

        function dragover(ev) {
            ev.preventDefault();
        }

        function dropclr(ev) {
            ev.preventDefault();
            const clr = ev.dataTransfer.getData("text");
            ev.target.style.backgroundColor = clr;
        }

        el("colorselect").innerHTML = "";
        const clropts = document.createElement("p");
        for (const i in woodcolors) {
            if (i == woodcolors.length / 2) { clropts.appendChild(document.createElement("br")); }
            const c = document.createElement("span");
            c.className = "clrsel";
            c.style.backgroundColor = woodcolors[i];
            c.draggable = "true";
            c.ondragstart = dragclr;
            clropts.appendChild(c);
        }

        const btnpalette = document.getElementsByClassName("clrbtn");
        const palette = document.createElement("p");
        palette.appendChild(document.createElement("hr"));
        palette.appendChild(document.createTextNode("Palette: "));
        for (let i = 0; i < btnpalette.length; i++) {
            const c = document.createElement("span");
            c.className = "tmppal";
            c.style.backgroundColor = btnpalette[i].style.backgroundColor;
            c.ondragover = dragover;
            c.ondrop = dropclr;
            palette.appendChild(c);
        }
        el("colorselect").appendChild(clropts);
        el("colorselect").appendChild(palette);
        el("palettewindow").style.display = "block";
    }

    document.getElementsByClassName("close")[0].onclick = function () {
        const btnpalette = document.getElementsByClassName("clrbtn");
        const tmppalette = document.getElementsByClassName("tmppal");
        for (let i = 0; i < btnpalette.length; i++) {
            btnpalette[i].style.backgroundColor = tmppalette[i].style.backgroundColor;
            btnpalette[i].title = getWoodByColor(tmppalette[i].style.backgroundColor);
        }
        el("palettewindow").style.display = "none";
    };

    function about() {
        const user = "developer";
        const domain = "collindelker.com";
        el("contact").innerHTML = user + '@' + domain;
        el("version").innerHTML = 'Version ' + version;
        el("aboutwindow").style.display = "block";
        document.getElementsByClassName("close")[1].onclick = function () {
            el("aboutwindow").style.display = "none";
        };
    }

    function save() {
        PERSISTENCE.saveDesignAndSettings(bowlprop, ctrl);
        checkStorage();
        el("loaddesign").disabled = false;
    }

    function load() {
        if (PERSISTENCE.checkStorage() !== null) {
            bowlprop = PERSISTENCE.loadDesign();
            ctrl = PERSISTENCE.loadSettings();
        }
        setUnit();
        loadSawKerf();
        drawCanvas();
        build3D();
    }

    function clear() {
        PERSISTENCE.clearDesignAndSettings();
        checkStorage();
    }

    function checkStorage() {
        if (PERSISTENCE.checkStorage() !== null) {
            const timestamp = PERSISTENCE.checkStorage();
            el("storageinfo").innerHTML = "Design saved from " + timestamp;
        } else {
            el("storageinfo").innerHTML = "no design in storage";
            el("loaddesign").disabled = true;
        }
    }


    // Main
    view2d.canvas = el("canvas");
    view2d.ctx = view2d.canvas.getContext("2d");
    view2d.canvas2 = el("canvas2");
    view2d.ctx2 = view2d.canvas2.getContext("2d");

    view2d.ctx.canvas.width = (window.innerWidth - el("left").clientWidth) / 3 - 15;
    view2d.ctx.canvas.height = view2d.ctx.canvas.width;
    view2d.ctx2.canvas.width = (window.innerWidth - el("left").clientWidth) / 3 - 15;
    view2d.ctx2.canvas.height = view2d.ctx2.canvas.width;
    view2d.scale = view2d.ctx.canvas.width / view2d.canvasinches;
    init();
})();