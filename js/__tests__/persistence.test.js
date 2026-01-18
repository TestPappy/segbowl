import { loadDesign, loadSettings, checkStorage, clearDesignAndSettings, saveDesignAndSettings } from "../persistence.js";
require('jest-localstorage-mock');

// =============================================================================
// TEST CASES FOR: Persistence Module
// =============================================================================
describe('persistence can', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem.mockClear();
        localStorage.getItem.mockClear();
        localStorage.removeItem.mockClear();
      });

    it('save a design', () => {
        var bowlpropMock = {
            test: "123"
        };
        var ctrlMock = {
            inch: false
        };
        // Saving...
        saveDesignAndSettings(bowlpropMock, ctrlMock);
        expect(Object.keys(localStorage.__STORE__).length).toBe(2);
        expect(localStorage.setItem).toHaveBeenCalledWith("bowlDesign", JSON.stringify(bowlpropMock));
        expect(localStorage.setItem).toHaveBeenLastCalledWith("bowlSettings", JSON.stringify(ctrlMock));
    });

    it('can check for an existing design', () => {
        var bowlpropMock = {
            test: "123",
            timestamp: "0815-4711"
        };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        var timestamp = checkStorage();
        expect(localStorage.getItem).toHaveBeenLastCalledWith("bowlDesign");
        expect(timestamp).toBe(bowlpropMock.timestamp);
    });

    it('load an existing design', () => {
        var bowlpropMock = {
            test: "123",
            timestamp: "0815-4711"
        };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        var loadedBowlprop = loadDesign();
        expect(localStorage.getItem).toHaveBeenLastCalledWith("bowlDesign");
        expect(loadedBowlprop.test).toBe("123");
    });

    it('load an existing setting', () => {
        var ctrlMock = {
            inch: false
        };
        localStorage.setItem("bowlSettings", JSON.stringify(ctrlMock));
        var loadedSettings = loadSettings();
        expect(localStorage.getItem).toHaveBeenLastCalledWith("bowlSettings");
        expect(loadedSettings.inch).toBe(false);
    });

    it('remove an existing design', () => {
        var bowlpropMock = {
            test: "123",
            timestamp: "0815-4711"
        };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        localStorage.setItem("bowlSettings", JSON.stringify(bowlpropMock));
        // Deleting...
        clearDesignAndSettings();
        expect(Object.keys(localStorage.__STORE__).length).toBe(0);
        expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
    });
});

// =============================================================================
// Additional TEST CASES FOR: saveDesignAndSettings
// =============================================================================
describe('saveDesignAndSettings', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem.mockClear();
    });

    it('adds timestamp to bowlprop before saving', () => {
        const bowlprop = { test: "value" };
        const ctrl = { inch: false };
        
        saveDesignAndSettings(bowlprop, ctrl);
        
        // bowlprop should now have a timestamp property
        expect(bowlprop.timestamp).toBeDefined();
    });

    it('timestamp is valid ISO date string', () => {
        const bowlprop = { test: "value" };
        const ctrl = { inch: false };
        
        saveDesignAndSettings(bowlprop, ctrl);
        
        // Should be a valid ISO date string
        const timestamp = bowlprop.timestamp;
        const parsed = new Date(timestamp);
        expect(parsed.toJSON()).toBe(timestamp);
        expect(isNaN(parsed.getTime())).toBe(false);
    });

    it('preserves all bowlprop properties', () => {
        const bowlprop = {
            thick: 6,
            pad: 3,
            height: 100,
            radius: 80,
            curvesegs: 50
        };
        const ctrl = { inch: false };
        
        saveDesignAndSettings(bowlprop, ctrl);
        
        const saved = JSON.parse(localStorage.getItem("bowlDesign"));
        expect(saved.thick).toBe(6);
        expect(saved.pad).toBe(3);
        expect(saved.height).toBe(100);
        expect(saved.radius).toBe(80);
        expect(saved.curvesegs).toBe(50);
    });

    it('preserves all ctrl properties', () => {
        const bowlprop = { test: "value" };
        const ctrl = {
            inch: true,
            sawkerf: 3.2,
            step: 0.0625,
            selring: 2,
            selseg: [1, 3, 5]
        };
        
        saveDesignAndSettings(bowlprop, ctrl);
        
        const saved = JSON.parse(localStorage.getItem("bowlSettings"));
        expect(saved.inch).toBe(true);
        expect(saved.sawkerf).toBe(3.2);
        expect(saved.step).toBe(0.0625);
        expect(saved.selring).toBe(2);
        expect(saved.selseg).toEqual([1, 3, 5]);
    });

    it('handles complex nested objects', () => {
        const bowlprop = {
            rings: [
                { height: 19, segs: 12, clrs: ['#FF0000', '#00FF00'], xvals: { min: 30, max: 50 } },
                { height: 19, segs: 8, clrs: ['#0000FF'], xvals: { min: 40, max: 60 } }
            ],
            cpoint: [
                { x: 100, y: 200 },
                { x: 150, y: 250 }
            ]
        };
        const ctrl = { inch: false };
        
        saveDesignAndSettings(bowlprop, ctrl);
        
        const saved = JSON.parse(localStorage.getItem("bowlDesign"));
        expect(saved.rings.length).toBe(2);
        expect(saved.rings[0].clrs).toEqual(['#FF0000', '#00FF00']);
        expect(saved.rings[0].xvals.min).toBe(30);
        expect(saved.cpoint[1].y).toBe(250);
    });

    it('handles empty arrays in bowlprop', () => {
        const bowlprop = {
            rings: [],
            cpoint: [],
            emptyData: []
        };
        const ctrl = { inch: false };
        
        saveDesignAndSettings(bowlprop, ctrl);
        
        const saved = JSON.parse(localStorage.getItem("bowlDesign"));
        expect(saved.rings).toEqual([]);
        expect(saved.cpoint).toEqual([]);
        expect(saved.emptyData).toEqual([]);
    });

    it('overwrites existing saved design', () => {
        const bowlprop1 = { version: 1 };
        const bowlprop2 = { version: 2 };
        const ctrl = { inch: false };
        
        saveDesignAndSettings(bowlprop1, ctrl);
        const saved1 = JSON.parse(localStorage.getItem("bowlDesign"));
        expect(saved1.version).toBe(1);
        
        saveDesignAndSettings(bowlprop2, ctrl);
        const saved2 = JSON.parse(localStorage.getItem("bowlDesign"));
        expect(saved2.version).toBe(2);
    });
});

// =============================================================================
// Additional TEST CASES FOR: loadDesign
// =============================================================================
describe('loadDesign', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null when no design exists', () => {
        const result = loadDesign();
        expect(result).toBeNull();
    });

    it('handles corrupted JSON gracefully', () => {
        localStorage.setItem("bowlDesign", "{ invalid json }}}");
        
        // Should not throw and return null
        expect(() => loadDesign()).not.toThrow();
        const result = loadDesign();
        expect(result).toBeNull();
    });

    it('preserves all saved properties on load', () => {
        const original = {
            thick: 6,
            pad: 3,
            height: 100,
            radius: 80,
            timestamp: "2024-01-15T10:30:00.000Z"
        };
        localStorage.setItem("bowlDesign", JSON.stringify(original));
        
        const loaded = loadDesign();
        expect(loaded.thick).toBe(6);
        expect(loaded.pad).toBe(3);
        expect(loaded.height).toBe(100);
        expect(loaded.radius).toBe(80);
        expect(loaded.timestamp).toBe("2024-01-15T10:30:00.000Z");
    });

    it('parses nested objects correctly', () => {
        const original = {
            rings: [
                { height: 19, xvals: { min: 30, max: 50 } }
            ],
            cpoint: [{ x: 100, y: 200 }]
        };
        localStorage.setItem("bowlDesign", JSON.stringify(original));
        
        const loaded = loadDesign();
        expect(loaded.rings[0].xvals.min).toBe(30);
        expect(loaded.cpoint[0].x).toBe(100);
    });
});

// =============================================================================
// Additional TEST CASES FOR: loadSettings
// =============================================================================
describe('loadSettings', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null when no settings exist', () => {
        const result = loadSettings();
        expect(result).toBeNull();
    });

    it('handles corrupted JSON gracefully', () => {
        localStorage.setItem("bowlSettings", "not valid json at all");
        
        // Should not throw and return null
        expect(() => loadSettings()).not.toThrow();
        const result = loadSettings();
        expect(result).toBeNull();
    });

    it('preserves boolean values correctly', () => {
        const original = { inch: true, otherBool: false };
        localStorage.setItem("bowlSettings", JSON.stringify(original));
        
        const loaded = loadSettings();
        expect(loaded.inch).toBe(true);
        expect(loaded.otherBool).toBe(false);
    });

    it('preserves number values correctly', () => {
        const original = {
            sawkerf: 3.2,
            step: 0.0625,
            intValue: 42,
            negValue: -5.5
        };
        localStorage.setItem("bowlSettings", JSON.stringify(original));
        
        const loaded = loadSettings();
        expect(loaded.sawkerf).toBe(3.2);
        expect(loaded.step).toBe(0.0625);
        expect(loaded.intValue).toBe(42);
        expect(loaded.negValue).toBe(-5.5);
    });
});

// =============================================================================
// Additional TEST CASES FOR: checkStorage
// =============================================================================
describe('checkStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null when no design exists', () => {
        const result = checkStorage();
        expect(result).toBeNull();
    });

    it('returns null when design has no timestamp', () => {
        localStorage.setItem("bowlDesign", JSON.stringify({ test: "value" }));
        
        const result = checkStorage();
        expect(result).toBeNull();
    });

    it('handles corrupted JSON gracefully', () => {
        localStorage.setItem("bowlDesign", "corrupted{{{");
        
        // Should not throw and return null
        expect(() => checkStorage()).not.toThrow();
        const result = checkStorage();
        expect(result).toBeNull();
    });

    it('returns exact timestamp string from saved design', () => {
        const timestamp = "2024-06-15T14:30:00.123Z";
        localStorage.setItem("bowlDesign", JSON.stringify({ timestamp }));
        
        const result = checkStorage();
        expect(result).toBe(timestamp);
    });
});

// =============================================================================
// Additional TEST CASES FOR: clearDesignAndSettings
// =============================================================================
describe('clearDesignAndSettings', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.removeItem.mockClear();
    });

    it('removes bowlDesign key', () => {
        localStorage.setItem("bowlDesign", JSON.stringify({ test: "value" }));
        
        clearDesignAndSettings();
        
        expect(localStorage.removeItem).toHaveBeenCalledWith("bowlDesign");
        expect(localStorage.getItem("bowlDesign")).toBeNull();
    });

    it('removes bowlSettings key', () => {
        localStorage.setItem("bowlSettings", JSON.stringify({ inch: true }));
        
        clearDesignAndSettings();
        
        expect(localStorage.removeItem).toHaveBeenCalledWith("bowlSettings");
        expect(localStorage.getItem("bowlSettings")).toBeNull();
    });

    it('does not throw when storage is already empty', () => {
        // Storage is empty
        expect(() => clearDesignAndSettings()).not.toThrow();
        expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
    });

    it('does not affect other localStorage keys', () => {
        localStorage.setItem("bowlDesign", JSON.stringify({ test: "value" }));
        localStorage.setItem("bowlSettings", JSON.stringify({ inch: true }));
        localStorage.setItem("otherKey", "should remain");
        localStorage.setItem("anotherKey", "also remains");
        
        clearDesignAndSettings();
        
        expect(localStorage.getItem("otherKey")).toBe("should remain");
        expect(localStorage.getItem("anotherKey")).toBe("also remains");
    });
});
