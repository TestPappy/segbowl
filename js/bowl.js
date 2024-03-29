/* Segmented Bowl Designer
  (c) 2017, Collin J. Delker
  (c) 2024, Patrick Prill
  Released under the MIT License
*/
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { dfltclrs, dfltwood, dfltlens, capitalize } from './common.mjs';
import { screenToRealPoint, realToScreen, screenToReal, calcBezPath, splitRingY, offsetCurve } from './bowl_calculator.mjs';
import { calcRings } from './ring_calculator.mjs';
import { createReport, getReportSegsList } from './report.mjs';
import { clearCanvas, drawCurve, drawRing, drawSegProfile } from './drawing.js';
import * as PERSISTENCE from './persistence.mjs';

(() => {
    var version = "0.2";

    var bowlprop = {
        radius: null,
        height: null,
        thick: .25,
        pad: .125,
        cpoint: null,
        curvesegs: 50,
        rings: [{ height: .5, segs: 12, clrs: dfltclrs(), wood: dfltwood(), seglen: dfltlens(), xvals: [], theta: 0 }],
        usedrings: 1,

        seltrapz: null,
        selthetas: null, // List of theta angles starting each segment in selected ring
    };

    var ctrl = {
        drag: null,
        dPoint: null,
        selring: 1,
        selseg: [],
        copyring: null,
        step: 1 / 16,
        inch: true, // Inches or mm
        sawkerf: .125,
    };

    var view2d = {
        canvas: null,
        ctx: null,
        canvas2: null,
        ctx2: null,
        canvasinches: 8,
        scale: null,
        bottom: null,
        centerx: null, // X-position of center
    };

    var view3d = {
        canvas: null,
        renderer: null,
        scene: null,
        camera: null,
        geom: [],
        mesh: [],
    };

    var style = {
        curve: { width: 8, color: "#333" },
        cpline: { width: 1, color: "#06C" },
        point: { radius: 5, width: 2, color: "#06C", fill: "rgba(200,200,200,0.5)" },
        segs: { width: 1, color: "#935" },
        selring: { width: 3, color: "#FF9900" },
        selseg: { width: 3, color: "#FF0" },
        copyring: { width: 3, color: "#0000FF" },
        gratio: { width: 1, color: "#555555" }
    };

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

        document.getElementById("btnView").onclick = showMenu;
        document.getElementById("btnOptions").onclick = showMenu;
        document.getElementById("btnBowl").onclick = showMenu;
        document.getElementById("btnRing").onclick = showMenu;
        document.getElementById("btnSeg").onclick = showMenu;
        document.getElementById("btnCopy").onclick = ringCopy;
        document.getElementById("btnPaste").onclick = ringPaste;
        document.getElementById("zoomIn").onclick = zoom;
        document.getElementById("zoomOut").onclick = zoom;
        document.getElementById("inptThick").oninput = thickChange;
        document.getElementById("inptPad").oninput = padChange;
        document.getElementById("showsegs").onchange = drawCanvas;
        document.getElementById("showsegnum").onchange = drawCanvas;
        document.getElementById("showratio").onchange = drawCanvas;
        document.getElementById("segHup").onclick = setSegHeight;
        document.getElementById("segHdn").onclick = setSegHeight;
        document.getElementById("segNup").onclick = setSegCnt;
        document.getElementById("segNdn").onclick = setSegCnt;
        document.getElementById("segLup").onclick = setSegL;
        document.getElementById("segLdn").onclick = setSegL;
        document.getElementById("segLreset").onclick = setSegL;
        document.getElementById("ringrot").onchange = rotateRing;
        document.getElementById("btnTwist").onclick = twist;
        document.getElementById("viewRing").onclick = setView;
        document.getElementById("view3D").onclick = setView;
        document.getElementById("viewProf").onclick = setView;
        document.getElementById("inch").onclick = unitChange;
        document.getElementById("mm").onclick = unitChange;
        document.getElementById("gentable").onclick = genReport;
        document.getElementById("about").onclick = about;
        document.getElementById("loaddesign").onclick = load;
        document.getElementById("savedesign").onclick = save;
        document.getElementById("cleardesign").onclick = clear;
        document.getElementById("sawkerf").onchange = saveSawKerf;
        window.addEventListener('resize', resizeWindow);
        var btnclrclass = document.getElementsByClassName("clrbtn");
        for (var i = 0; i < btnclrclass.length; i++) {
            btnclrclass[i].onclick = colorChange;
        }

        document.getElementById("btnPal").onclick = showPalette;

        drawCanvas();

        // Now init the 3D view
        view3d.canvas = document.getElementById("canvas3d");
        view3d.canvas.width = view2d.ctx.canvas.width;
        view3d.canvas.height = view2d.ctx.canvas.height;

        view3d.renderer = new THREE.WebGLRenderer({ canvas: view3d.canvas, antialias: true });
        view3d.renderer.setClearColor("lightblue");

        view3d.scene = new THREE.Scene();
        view3d.camera = new THREE.PerspectiveCamera(45, 1, 1, 100);
        view3d.camera.position.set(0, view2d.canvasinches, view2d.canvasinches + 3);
        var camlight = new THREE.PointLight(0xAAAAAA);
        camlight.position.set(20, 30, 20);
        view3d.camera.add(camlight);

        var controls = new OrbitControls(view3d.camera, view3d.renderer.domElement);
        controls.target.set(0, 4, 0);
        controls.update();
        controls.addEventListener("change", render3D);
        view3d.scene.add(view3d.camera);
        var light = new THREE.AmbientLight(0xffffff, .6);
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
        for (var i = 0; i < bowlprop.cpoint.length - 1; i += 3) {
            ctx.lineTo(bowlprop.cpoint[i + 1].x, bowlprop.cpoint[i + 1].y);
            ctx.moveTo(bowlprop.cpoint[i + 2].x, bowlprop.cpoint[i + 2].y);
            ctx.lineTo(bowlprop.cpoint[i + 3].x, bowlprop.cpoint[i + 3].y);
        }
        ctx.stroke();
    }

    function drawControlPoints(ctx) {
        for (var i = 0; i < bowlprop.cpoint.length; i++) {
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
        var topleft = realToScreen(view2d, -bowlprop.radius, bowlprop.height);
        var botright = realToScreen(view2d, bowlprop.radius, 0);
        var g = (botright.y - topleft.y) / 1.618;
        var g2 = (botright.x - topleft.x) / 1.618;
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
        if (document.getElementById("showsegs").checked) {
            drawSegProfile(view2d.ctx, bowlprop, view2d, ctrl, style);
        }
        if (document.getElementById("showratio").checked) {
            drawGRatio(view2d.ctx);
        }
        drawControlLines(view2d.ctx);
        drawCurve(view2d.ctx, bowlprop, view2d, style);
        drawControlPoints(view2d.ctx);
        if (document.getElementById("canvas2").style.display != "none" && ctrl.selring != null) {
            drawRing(view2d.ctx2, ctrl.selring, bowlprop, view2d, ctrl, style);
        }
        updateRingInfo();
    }

    function build3D() {
        if (document.getElementById("canvas3d").style.display == 'none') { return; } // Don't calculate if not shown
        var curve = calcBezPath(view2d, bowlprop);
        calcRings(view2d, bowlprop);
        var offcurve = offsetCurve(curve, bowlprop.thick / 2);
        for (var m = 0; m < view3d.mesh.length; m++) {
            view3d.mesh[m].geometry.dispose();
            view3d.mesh[m].material.dispose();
            view3d.scene.remove(view3d.mesh[m]);
        }
        view3d.mesh = [];

        var curvesegs = splitRingY(offcurve.c2, bowlprop); // Outer wall
        for (var i = 0; i < curvesegs.length; i++) {
            if (curvesegs[i].length > 1) {
                var tottheta = bowlprop.rings[i].theta;
                for (var seg = 0; seg < bowlprop.rings[i].segs; seg++) {
                    var theta = (2 * Math.PI / bowlprop.rings[i].segs) * bowlprop.rings[i].seglen[seg];
                    var material = new THREE.MeshPhongMaterial({ color: bowlprop.rings[i].clrs[seg] });
                    material.side = THREE.DoubleSide;
                    view3d.mesh.push(new THREE.Mesh(
                        new THREE.LatheGeometry(
                            curvesegs[i], 10, tottheta, theta), material));
                    tottheta += theta;
                    view3d.scene.add(view3d.mesh[view3d.mesh.length - 1]);
                }
            }
        }
        curvesegs = splitRingY(offcurve.c1, bowlprop); // Inner wall
        for (var i = 0; i < curvesegs.length; i++) {
            if (curvesegs[i].length > 1) {
                tottheta = bowlprop.rings[i].theta;
                for (var seg = 0; seg < bowlprop.rings[i].segs; seg++) {
                    var theta = (2 * Math.PI / bowlprop.rings[i].segs) * bowlprop.rings[i].seglen[seg];
                    var material = new THREE.MeshPhongMaterial({ color: bowlprop.rings[i].clrs[seg] });
                    material.side = THREE.DoubleSide;
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
    function showMenu() {
        var s = {
            btnOptions: "mnuOptions",
            btnView: "mnuView",
            btnBowl: "mnuBowl",
            btnRing: "mnuRing",
            btnSeg: "mnuSeg"
        }[this.id];
        var e = document.getElementById(s);
        if (e.style.display == "none") { e.style.display = "inline"; }
        else { e.style.display = "none"; }
    }

    function range(start, stop, step = 1) {
        var A = [];
        for (var i = start; i <= stop; i += step) { A.push(i); }
        return A;
    }

    function segClick(e) {
        var e = mousePos(e, view2d.canvas2);
        var dx, dy, r, theta, seg;
        dx = (e.x - view2d.centerx) / view2d.scale;
        dy = (e.y - view2d.centerx) / view2d.scale; // Always a square
        r = Math.sqrt((dx * dx) + (dy * dy));
        if (r >= bowlprop.rings[ctrl.selring].xvals.min - bowlprop.pad && r < bowlprop.rings[ctrl.selring].xvals.max + bowlprop.pad) {
            var inc = document.getElementById("segselect").value;
            if (inc == "all") {
                ctrl.selseg = range(0, bowlprop.rings[ctrl.selring].segs - 1);
            } else {
                theta = (Math.atan2(-dy, dx) + 2 * Math.PI) % (2 * Math.PI);
                for (var s = 1; s < bowlprop.selthetas.length; s++) {
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
        e = mousePos(e, view2d.canvas);
        var dx, dy;
        // Check if near a control point
        for (var i = 0; i < bowlprop.cpoint.length; i++) {
            dx = bowlprop.cpoint[i].x - e.x;
            dy = bowlprop.cpoint[i].y - e.y;
            if ((dx * dx) + (dy * dy) < style.point.radius * style.point.radius) {
                ctrl.drag = i;
                ctrl.dPoint = e;
                view2d.canvas.style.cursor = "move";
                return;
            }
        }
        // Not near ctrl point, check if in a segment
        e = screenToRealPoint(view2d, e.x, e.y);
        var y = -bowlprop.thick / 2;
        for (var i = 0; i < bowlprop.rings.length; i++) {
            if (e.x > bowlprop.rings[i].xvals.min && e.x < bowlprop.rings[i].xvals.max
                && e.y > y && e.y < y + bowlprop.rings[i].height) {
                ctrl.selring = i;
                ctrl.selseg = [];
                drawCanvas();
                setRingHtxt();
                setSegCntTxt();
                document.getElementById("ringrot").value = bowlprop.rings[i].theta * 180 / Math.PI;
                return;
            }
            y += bowlprop.rings[i].height;
        }
        ctrl.selring = null; // Not near anything
        drawCanvas();
    }

    function dragging(e) {
        if (ctrl.drag !== null) {
            e = mousePos(e, view2d.canvas);
            bowlprop.cpoint[ctrl.drag].x += e.x - ctrl.dPoint.x;
            bowlprop.cpoint[ctrl.drag].y += e.y - ctrl.dPoint.y;
            ctrl.dPoint = e;
            drawCanvas();
            if (document.getElementById("redrawdrag").checked) {
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
        e = mousePos(e, view2d.canvas);
        for (var i = 0; i < bowlprop.cpoint.length; i += 3) { // Go by 3 to get cpoints ON line
            dx = bowlprop.cpoint[i].x - e.x;
            dy = bowlprop.cpoint[i].y - e.y;
            if ((dx * dx) + (dy * dy) < style.point.radius * style.point.radius) {
                if (i == 0 || i == bowlprop.cpoint.length - 1) { return; }; // Don't remove first or last point
                bowlprop.cpoint.splice(i - 1, 3); // Remove point and associated ctrl pts
                drawCanvas();
                return;
            }
        }

        var dmin = 1000, imin;
        var path = calcBezPath(view2d, bowlprop, false);
        for (var i = 1; i < path.length; i++) {
            dx = path[i].x - e.x;
            dy = path[i].y - e.y;
            if (dmin > dx * dx + dy * dy) { // Find closest point to the curve
                dmin = dx * dx + dy * dy;
                imin = i;
            }
        }
        if (dmin < style.point.radius * style.point.radius) {
            // If we're close enough, insert a point and 2 tangential control points
            t = imin / path.length - path.length / bowlprop.curvesegs;
            idx = 2 + 3 * Math.floor(imin / bowlprop.curvesegs);
            bowlprop.cpoint.splice(idx, 0, path[imin + 2]);
            bowlprop.cpoint.splice(idx, 0, path[imin]);
            bowlprop.cpoint.splice(idx, 0, path[imin - 2]);
            drawCanvas();
        }
    }

    function reduce(value, step = null) {
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

    function mousePos(event, canvas) {
        event = (event ? event : window.event);
        return {
            x: event.pageX - canvas.offsetLeft,
            y: event.pageY - canvas.offsetTop
        };
    }

    function thickChange() {
        var slider = document.getElementById("inptThick");
        bowlprop.thick = Number(slider.value);
        document.getElementById("valThick").innerHTML = reduce(slider.value);
        drawCanvas();
        build3D();
    }

    function padChange() {
        var slider = document.getElementById("inptPad");
        bowlprop.pad = Number(slider.value);
        document.getElementById("valPad").innerHTML = reduce(slider.value);
        drawCanvas();
        build3D();
    }

    function setSegHeight() {
        if (ctrl.selring != null) {
            if (this.id == "segHup") {
                bowlprop.rings[ctrl.selring].height += ctrl.step;
            } else if (bowlprop.rings[ctrl.selring].height - ctrl.step > 0) {
                bowlprop.rings[ctrl.selring].height -= ctrl.step;
            }
            setRingHtxt();
            drawCanvas();
            build3D();
        }
    }

    function setSegCnt() {
        if (this.id == "segNup") {
            bowlprop.rings[ctrl.selring].segs += 1;
            if (bowlprop.rings[ctrl.selring].clrs.length < bowlprop.rings[ctrl.selring].segs) {
                bowlprop.rings[ctrl.selring].clrs.push(bowlprop.rings[ctrl.selring].clrs[bowlprop.rings[ctrl.selring].clrs.length - 1]);
            }
            if (bowlprop.rings[ctrl.selring].wood.length < bowlprop.rings[ctrl.selring].segs) {
                bowlprop.rings[ctrl.selring].wood.push(bowlprop.rings[ctrl.selring].wood[bowlprop.rings[ctrl.selring].wood.length - 1]);
            }
            bowlprop.rings[ctrl.selring].seglen = dfltlens(bowlprop.rings[ctrl.selring].segs); // just reset this
        } else if (bowlprop.rings[ctrl.selring].segs > 3) {
            bowlprop.rings[ctrl.selring].segs -= 1;
            bowlprop.rings[ctrl.selring].seglen = dfltlens(bowlprop.rings[ctrl.selring].segs); // just reset this
        }
        ctrl.selseg = [];
        setSegCntTxt();
        drawCanvas();
        build3D();
    }

    function setSegL() {
        if (this.id == "segLreset") {
            bowlprop.rings[ctrl.selring].seglen = dfltlens(bowlprop.rings[ctrl.selring].segs);
        } else if (ctrl.selseg.length != bowlprop.rings[ctrl.selring].segs) {
            var inc = .05; // 5%
            if (this.id == "segLdn") { inc = -inc; }
            var dec = inc * ctrl.selseg.length / (bowlprop.rings[ctrl.selring].segs - ctrl.selseg.length);
            for (var i = 0; i < ctrl.selseg.length; i++) {
                // Selected rings go up by inc
                bowlprop.rings[ctrl.selring].seglen[ctrl.selseg[i]] += inc;
            }
            for (var i = 0; i < bowlprop.rings[ctrl.selring].segs; i++) {
                if (ctrl.selseg.indexOf(i) == -1) {
                    bowlprop.rings[ctrl.selring].seglen[i] -= dec;
                }
            }
        }
        drawCanvas();
        build3D();
    }

    function rotateRing() {
        if (ctrl.selring != null) {
            bowlprop.rings[ctrl.selring].theta = Math.PI / 180 * this.value;
            drawCanvas();
            build3D();
        }
    }

    function twist() {
        var step = Math.PI / 180 * parseFloat(prompt("Enter total rotation", "30")) / bowlprop.usedrings;
        for (var i = 0; i < bowlprop.usedrings; i++) {
            bowlprop.rings[i].theta = i * step;
        }
        document.getElementById("ringrot").value = bowlprop.rings[ctrl.selring].theta * 180 / Math.PI;
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
            for (var c in bowlprop.rings[ctrl.copyring].clrs) { bowlprop.rings[ctrl.selring].clrs.push(bowlprop.rings[ctrl.copyring].clrs[c]); }
            for (var c in bowlprop.rings[ctrl.copyring].wood) { bowlprop.rings[ctrl.selring].wood.push(bowlprop.rings[ctrl.copyring].wood[c]); }
            for (var c in bowlprop.rings[ctrl.copyring].seglen) { bowlprop.rings[ctrl.selring].seglen.push(bowlprop.rings[ctrl.copyring].seglen[c]); }
            ctrl.copyring = null;
            drawCanvas();
            build3D();
        }
    }

    function colorChange() {
        var clr = this.style.backgroundColor;
        for (var i = 0; i < ctrl.selseg.length; i++) {
            bowlprop.rings[ctrl.selring].clrs[ctrl.selseg[i]] = clr;
            bowlprop.rings[ctrl.selring].wood[ctrl.selseg[i]] = getWoodByColor(clr);
        }
        drawCanvas();
        build3D();
    }

    function setSegCntTxt() {
        document.getElementById("segNtxt").innerHTML = "Segments: ".concat(bowlprop.rings[ctrl.selring].segs);
    }

    function setRingHtxt() {
        document.getElementById("segHtxt").innerHTML = reduce(bowlprop.rings[ctrl.selring].height);
    }

    function setView() {
        if (this.id == "viewProf") {
            var canv = document.getElementById("canvas");
            var ctrls = document.getElementById("segHctrl");
        }
        else if (this.id == "viewRing") {
            var canv = document.getElementById("canvas2");
            var ctrls = document.getElementById("segNctrl");
        } else {
            var canv = document.getElementById("canvas3d");
            var ctrls = '';
        }

        if (this.checked) {
            canv.style.display = "inline";
            if (ctrls != null && ctrls != '') { ctrls.style.visibility = "visible"; }
        } else {
            canv.style.display = "none";
            if (ctrls != null && ctrls != '') { ctrls.style.visibility = "hidden"; }
        }
        resizeWindow();
    }

    function setUnit() {
        document.getElementById("inch").checked = ctrl.inch
        document.getElementById("mm").checked = !ctrl.inch
    }

    function unitChange() {
        var thick = document.getElementById("inptThick");
        var pad = document.getElementById("inptPad");
        if (document.getElementById("inch").checked) {
            ctrl.inch = true;
            ctrl.step = 1 / 16;
            bowlprop.thick = roundTo(bowlprop.thick, 16);
            bowlprop.pad = roundTo(bowlprop.pad, 16);
            for (var p in bowlprop.rings) {
                bowlprop.rings[p].height = roundTo(bowlprop.rings[p].height, 16);
            }
            thick.setAttribute("step", 1 / 16);
            thick.value = bowlprop.thick;
            pad.setAttribute("step", 1 / 16);
            pad.value = bowlprop.pad;
            document.getElementById("rptprec").style.visibility = "visible";
            document.getElementById("zoomTxt").innerHTML = 'View: ' + (view2d.canvasinches).toFixed(0).concat('"');
        } else {
            ctrl.inch = false;
            ctrl.step = 0.5 / 25.4;
            bowlprop.thick = roundTo(bowlprop.thick * 25.4, 2) / 25.4;
            bowlprop.pad = roundTo(bowlprop.pad * 25.4, 2) / 25.4;
            for (var p in bowlprop.rings) {
                bowlprop.rings[p].height = roundTo(bowlprop.rings[p].height * 25.4, 2) / 25.4;
            }
            thick.setAttribute("step", 0.5 / 25.4);
            thick.setAttribute("value", bowlprop.thick);
            pad.setAttribute("step", 0.5 / 25.4);
            pad.setAttribute("value", bowlprop.pad);
            document.getElementById("rptprec").style.visibility = "hidden";
            document.getElementById("zoomTxt").innerHTML = 'View: ' + (view2d.canvasinches * 2.54).toFixed(0).concat(' cm');
        }
        thickChange();
        padChange();
        setRingHtxt();
        drawCanvas();
        loadSawKerf();
    }

    function loadSawKerf() {
        if (ctrl.inch) {
            document.getElementById("sawkerf").value = ctrl.sawkerf;
        } else {
            document.getElementById("sawkerf").value = (ctrl.sawkerf * 25.4).toFixed(3);
        }
    }

    function saveSawKerf() {
        if (ctrl.inch) {
            ctrl.sawkerf = document.getElementById("sawkerf").value;
        } else {
            ctrl.sawkerf = (document.getElementById("sawkerf").value / 25.4).toFixed(3);
        }
        loadSawKerf();
    }

    function zoom() {
        if (ctrl.inch) {
            var inc = 1;
            var mult = 1;
            var unit = '"';
        } else {
            var inc = 10 / 25.4; // 1cm?
            var mult = 2.54;
            var unit = ' cm';
        }
        if (this.id == "zoomIn") { inc = -inc; }
        if (this.id == "zoomIn" && view2d.canvasinches <= 2) { return; }
        var oldcp = screenToReal(view2d, bowlprop);

        view2d.canvasinches += inc;
        view2d.scale = view2d.ctx.canvas.width / view2d.canvasinches;
        view2d.bottom = view2d.canvas.height - 0.5 * view2d.scale;
        view2d.centerx = view2d.canvas.width / 2;
        document.getElementById("zoomTxt").innerHTML = 'View: ' + (view2d.canvasinches * mult).toFixed(0).concat(unit);

        for (var p in oldcp) {
            bowlprop.cpoint[p] = realToScreen(view2d, oldcp[p].x, oldcp[p].y);
        }
        drawCanvas();
    }

    function roundTo(value, denom) {
        return Math.round(value * denom) / denom;
    }

    function resizeWindow() {
        var oldcp = screenToReal(view2d, bowlprop);
        var cnt = 0;
        if (document.getElementById("canvas").style.display != "none") { cnt++; }
        if (document.getElementById("canvas2").style.display != "none") { cnt++; }
        if (document.getElementById("canvas3d").style.display != "none") { cnt++; }
        if (cnt > 0) {
            if (cnt > 1) {
                view2d.ctx.canvas.width = (window.innerWidth - document.getElementById("left").clientWidth) / cnt - 15;
            } else {
                view2d.ctx.canvas.width = Math.min(document.getElementById("left").clientHeight, window.innerWidth - document.getElementById("left").clientWidth - 15);
            }
            view2d.ctx.canvas.height = view2d.ctx.canvas.width;
            view2d.ctx2.canvas.width = view2d.ctx.canvas.width;
            view2d.ctx2.canvas.height = view2d.ctx2.canvas.width;
            view2d.scale = view2d.ctx.canvas.width / view2d.canvasinches;
            view2d.bottom = view2d.canvas.height - 0.5 * view2d.scale;
            view2d.centerx = view2d.canvas.width / 2;

            view3d.renderer.setSize(view2d.ctx.canvas.width, view2d.ctx.canvas.height);
            view3d.camera.updateProjectionMatrix();
            for (var p in oldcp) {
                bowlprop.cpoint[p] = realToScreen(view2d, oldcp[p].x, oldcp[p].y);
            }
            drawCanvas();
            build3D();
        }
    }

    function updateRingInfo() {
        if (document.getElementById("canvas2").style.display != "none" && ctrl.selring != null) {
            var step = 1 / parseInt(document.getElementById("rptfmt").value);
            var txt = ["Ring:", ctrl.selring.toString(), "<br>",
                "Diameter:", reduce(bowlprop.rings[ctrl.selring].xvals.max * 2, step), "<br>",
                "Thickness:", reduce(bowlprop.rings[ctrl.selring].height, step), '<br><hr align="left" width="20%">'];
            var seglist = getReportSegsList(bowlprop, ctrl.selring);
            for (var seg = 0; seg < seglist.length; seg++) {
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
            document.getElementById("report").innerHTML = txt.join(" ");
        } else {
            document.getElementById("report").innerHTML = "";
        }
    }

    function genReport() {
        var step = 1 / parseInt(document.getElementById("rptfmt").value);
        var nwindow = window.open('report.html', 'Report', 'height=800,width=1000');
        createReport(nwindow, bowlprop, step, ctrl, view2d, view3d, style);
    }

    function getWoodByColor(clr) {
        var woodByColorMap = new Map();
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
        var woodcolors = [
            '#FDFAF4', '#E2CAA0', '#C29A1F', '#C98753', '#AC572F', '#995018', '#7B4F34',
            '#6E442E', '#623329', '#51240D', '#EFEBE0', '#EFB973', '#AD743F', '#965938',
            '#884B2F', '#7C3826', '#843E4B', '#582824', '#44252B', '#342022'
        ];
        var brightcolors = [
            "#FF0000", "#FF8000", "#FFFF00", "#80FF00", "#00FF80", "#00FFFF", "#0080FF",
            "#0000FF", "#FF00FF", "#800040", "#FF6666", "#FFCC66", "#FFFF66", "#CCFF66",
            "#66FF66", "#66FFCC", "#66CCFF", "#6666FF", "#CC66FF", "#000000"
        ];

        document.getElementById("colortype").onchange =
            function () {
                var clist = [];
                if (this.value == "wood") {
                    clist = woodcolors;
                } else {
                    clist = brightcolors;
                }
                var buttons = document.getElementsByClassName("clrsel");
                for (var i in clist) {
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
            var clr = ev.dataTransfer.getData("text");
            ev.target.style.backgroundColor = clr;
        }

        document.getElementById("colorselect").innerHTML = "";
        var div;
        var clropts = document.createElement("p");
        for (var i in woodcolors) {
            if (i == woodcolors.length / 2) { clropts.appendChild(document.createElement("br")); }
            var c = document.createElement("span");
            c.className = "clrsel";
            c.style.backgroundColor = woodcolors[i];
            c.draggable = "true";
            c.ondragstart = dragclr;
            clropts.appendChild(c);
        }

        var btnpalette = document.getElementsByClassName("clrbtn");
        var palette = document.createElement("p");
        palette.appendChild(document.createElement("hr"));
        palette.appendChild(document.createTextNode("Palette: "));
        for (var i = 0; i < btnpalette.length; i++) {
            var c = document.createElement("span");
            c.className = "tmppal";
            c.style.backgroundColor = btnpalette[i].style.backgroundColor;
            c.ondragover = dragover;
            c.ondrop = dropclr;
            palette.appendChild(c);
        }
        document.getElementById("colorselect").appendChild(clropts);
        document.getElementById("colorselect").appendChild(palette);
        document.getElementById("palettewindow").style.display = "block";
    }

    document.getElementsByClassName("close")[0].onclick = function () {
        var btnpalette = document.getElementsByClassName("clrbtn");
        var tmppalette = document.getElementsByClassName("tmppal");
        for (var i = 0; i < btnpalette.length; i++) {
            btnpalette[i].style.backgroundColor = tmppalette[i].style.backgroundColor;
            btnpalette[i].title = getWoodByColor(tmppalette[i].style.backgroundColor);
        }
        document.getElementById("palettewindow").style.display = "none";
    };

    function about() {
        var user = "developer";
        var domain = "collindelker.com";
        document.getElementById("contact").innerHTML = user + '@' + domain;
        document.getElementById("version").innerHTML = 'Version ' + version;
        document.getElementById("aboutwindow").style.display = "block";
        document.getElementsByClassName("close")[1].onclick = function () {
            document.getElementById("aboutwindow").style.display = "none";
        };
    }

    function save() {
        PERSISTENCE.saveDesignAndSettings(bowlprop, ctrl);
        checkStorage();
        document.getElementById("loaddesign").disabled = false;
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
            var timestamp = PERSISTENCE.checkStorage();
            document.getElementById("storageinfo").innerHTML = "Design saved from " + timestamp;
        } else {
            document.getElementById("storageinfo").innerHTML = "no design in storage";
            document.getElementById("loaddesign").disabled = true;
        }
    }


    // Main
    view2d.canvas = document.getElementById("canvas");
    view2d.ctx = view2d.canvas.getContext("2d");
    view2d.canvas2 = document.getElementById("canvas2");
    view2d.ctx2 = view2d.canvas2.getContext("2d");

    view2d.ctx.canvas.width = (window.innerWidth - document.getElementById("left").clientWidth) / 3 - 15;
    view2d.ctx.canvas.height = view2d.ctx.canvas.width;
    view2d.ctx2.canvas.width = (window.innerWidth - document.getElementById("left").clientWidth) / 3 - 15;
    view2d.ctx2.canvas.height = view2d.ctx2.canvas.width;
    view2d.scale = view2d.ctx.canvas.width / view2d.canvasinches;
    init();
})();