**Optimierungen für das Projekt `segbowl`**

Alle Optimierungen wurden umgesetzt! ✅

---

**Erledigte Optimierungen:**
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
- ✅ JSDoc-Typdefinitionen hinzugefügt (`types.js`) für `BowlProp`, `View2D`, `Ctrl`, `Style`, etc.
