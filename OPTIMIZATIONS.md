**Optimierungen für das Projekt `segbowl`**

Verbleibende Verbesserungsvorschläge:

**1. Fehlende Typdefinitionen**

Warum: Komplexe Objekte (`bowlprop`, `view2d`, `ctrl`, `style`) werden überall durchgereicht ohne Dokumentation. Fehleranfällig und schlecht wartbar.

Lösung: JSDoc-Typen hinzufügen:

```js
/**
 * @typedef {Object} BowlProp
 * @property {number} radius
 * @property {number} height
 * @property {number} thick
 * @property {Array<{x: number, y: number}>} cpoint
 * @property {Array<Ring>} rings
 */

/** @param {BowlProp} bowlprop */
export function calcRings(view2d, bowlprop) { ... }
```

---

**Bereits erledigte Optimierungen:**
- ✅ `var` → `const`/`let` Modernisierung
- ✅ DOM-Zugriffe cachen mit `el()` Helper
- ✅ Material-Cache für THREE.js
- ✅ Kürzere Array-Erzeugung in `common.js`
- ✅ Robusteres Persistence-Handling
- ✅ `reduce()` Funktion zusammengeführt
- ✅ Undefinierte Variablen `t` und `idx` korrigiert (jetzt `const`)
- ✅ Implizite globale `canvas` Variable korrigiert (jetzt `ctx.canvas`)
- ✅ Side-Effects in `calcRings()` und `calcRingTrapz()` entfernt – geben jetzt Werte zurück
- ✅ Fragile `this`-Bindung durch `event.target` ersetzt in allen Event-Handlern
- ✅ Dateiendungen vereinheitlicht – alle Module jetzt `.js` statt gemischt `.js`/`.mjs`
