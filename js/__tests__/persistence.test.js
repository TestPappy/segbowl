import { 
    // New API
    captureProfileThumbnail,
    serializeDesign,
    deserializeDesign,
    saveToHistory,
    getHistory,
    getHistoryCount,
    restoreFromHistory,
    getHistorySummary,
    clearHistory,
    deleteFromHistory,
    // Legacy API (kept for backward compatibility)
    loadDesign, 
    loadSettings, 
    checkStorage, 
    clearDesignAndSettings, 
    saveDesignAndSettings 
} from "../persistence.js";
require('jest-localstorage-mock');

// =============================================================================
// Helper: Create mock canvas for thumbnail tests
// =============================================================================
function createMockCanvas(width = 500, height = 500) {
    // Create a mock canvas with toDataURL for testing
    const mockCtx = {
        drawImage: jest.fn(),
        fillRect: jest.fn(),
        fillStyle: ''
    };
    
    const canvas = {
        width: width,
        height: height,
        getContext: jest.fn(() => mockCtx),
        toDataURL: jest.fn(() => 'data:image/png;base64,mockThumbnailData')
    };
    
    return canvas;
}

// =============================================================================
// Helper: Create sample bowl data
// =============================================================================
function createSampleBowlProp() {
    return {
        radius: 80,
        height: 100,
        thick: 6,
        pad: 3,
        cpoint: [
            { x: 250, y: 400 },
            { x: 300, y: 400 },
            { x: 300, y: 200 },
            { x: 350, y: 150 }
        ],
        curvesegs: 50,
        rings: [
            { 
                height: 19, 
                segs: 12, 
                clrs: ['#FF0000', '#00FF00', '#0000FF'], 
                wood: ['maple', 'oak', 'walnut'],
                seglen: [1, 1, 1],
                xvals: { min: 30, max: 50 },
                theta: 0 
            }
        ],
        usedrings: 1,
        seltrapz: null,
        selthetas: null
    };
}

function createSampleCtrl() {
    return {
        drag: null,
        dPoint: null,
        selring: 1,
        selseg: [],
        copyring: null,
        step: 0.5,
        inch: false,
        sawkerf: 3
    };
}

// =============================================================================
// Helper: Create mock view2d for coordinate conversion
// =============================================================================
function createMockView2D() {
    return {
        canvas: { width: 500, height: 500 },
        scale: 2.0,
        canvasmm: 250,
        bottom: 480,
        centerx: 250
    };
}

// =============================================================================
// TEST CASES FOR: captureProfileThumbnail
// =============================================================================
describe('captureProfileThumbnail', () => {
    it('returns null for null canvas', () => {
        const result = captureProfileThumbnail(null);
        expect(result).toBeNull();
    });

    it('creates a scaled canvas with correct dimensions', () => {
        // Use actual document.createElement for this test
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        
        // Mock getContext to return a mock context
        const mockCtx = {
            drawImage: jest.fn()
        };
        
        // Override getContext
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCtx);
        
        // Mock toDataURL
        HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test');
        
        const result = captureProfileThumbnail(canvas, 100);
        
        expect(result).toMatch(/^data:image\/png/);
        
        // Restore
        HTMLCanvasElement.prototype.getContext = originalGetContext;
    });
});

// =============================================================================
// TEST CASES FOR: serializeDesign
// =============================================================================
describe('serializeDesign', () => {
    it('creates correct schema version 3 structure', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        const result = serializeDesign(bowlprop, ctrl, canvas, view2d);
        
        expect(result.schemaVersion).toBe(3);
        expect(result.metadata).toBeDefined();
        expect(result.thumbnail).toBeDefined();
        expect(result.design).toBeDefined();
        expect(result.settings).toBeDefined();
    });

    it('includes metadata with timestamps', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        const result = serializeDesign(bowlprop, ctrl, canvas, view2d, 'Test Design');
        
        expect(result.metadata.name).toBe('Test Design');
        expect(result.metadata.created).toBeDefined();
        expect(result.metadata.modified).toBeDefined();
        expect(result.metadata.appVersion).toBeDefined();
    });

    it('extracts only essential design data (no xvals)', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        const result = serializeDesign(bowlprop, ctrl, canvas, view2d);
        
        expect(result.design.thick).toBe(6);
        expect(result.design.pad).toBe(3);
        expect(result.design.rings[0].xvals).toBeUndefined();
        expect(result.design.rings[0].height).toBe(19);
    });

    it('extracts only persistent settings', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        const result = serializeDesign(bowlprop, ctrl, canvas, view2d);
        
        expect(result.settings.inch).toBe(false);
        expect(result.settings.sawkerf).toBe(3);
        expect(result.settings.selring).toBeUndefined();
        expect(result.settings.selseg).toBeUndefined();
    });

    it('works with null canvas', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const view2d = createMockView2D();
        
        const result = serializeDesign(bowlprop, ctrl, null, view2d);
        
        expect(result.schemaVersion).toBe(3);
        expect(result.thumbnail).toBeNull();
    });
});

// =============================================================================
// TEST CASES FOR: deserializeDesign
// =============================================================================
describe('deserializeDesign', () => {
    it('restores schema version 3 data correctly', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        const serialized = serializeDesign(bowlprop, ctrl, canvas, view2d);
        const result = deserializeDesign(serialized);
        
        expect(result.bowlprop.thick).toBe(6);
        expect(result.bowlprop.pad).toBe(3);
        expect(result.ctrl.inch).toBe(false);
        expect(result.ctrl.sawkerf).toBe(3);
        expect(result.schemaVersion).toBe(3);
    });

    it('restores control points correctly', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        const serialized = serializeDesign(bowlprop, ctrl, canvas, view2d);
        const result = deserializeDesign(serialized);
        
        expect(result.bowlprop.cpoint).toHaveLength(4);
        // Points are in real coordinates now
        expect(result.bowlprop.cpoint[0].x).toBeDefined();
    });

    it('migrates legacy format (with timestamp)', () => {
        const legacyData = {
            timestamp: "2024-01-01T00:00:00.000Z",
            thick: 8,
            pad: 4,
            rings: [{ height: 20, segs: 8, clrs: [], wood: [], seglen: [], theta: 0 }]
        };
        
        const result = deserializeDesign(legacyData);
        
        expect(result.bowlprop.thick).toBe(8);
        expect(result.bowlprop.pad).toBe(4);
        expect(result.ctrl.inch).toBe(false);
    });

    it('handles unknown format gracefully', () => {
        const unknownData = { someField: "value" };
        
        const result = deserializeDesign(unknownData);
        
        expect(result.bowlprop).toBeDefined();
        expect(result.ctrl).toBeDefined();
    });
});

// =============================================================================
// TEST CASES FOR: Version History
// =============================================================================
describe('saveToHistory', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem.mockClear();
        localStorage.getItem.mockClear();
    });

    it('saves design to history', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        const result = saveToHistory(bowlprop, ctrl, canvas, view2d);
        
        expect(result).toHaveLength(1);
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'bowlHistory',
            expect.any(String)
        );
    });

    it('limits history to 5 versions', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        // Save 7 versions
        for (let i = 0; i < 7; i++) {
            saveToHistory(bowlprop, ctrl, canvas, view2d, `Version ${i}`);
        }
        
        const history = getHistory();
        expect(history.length).toBeLessThanOrEqual(5);
    });

    it('adds newest version to front of array', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        saveToHistory(bowlprop, ctrl, canvas, view2d, 'First');
        saveToHistory(bowlprop, ctrl, canvas, view2d, 'Second');
        
        const history = getHistory();
        expect(history[0].metadata.name).toBe('Second');
        expect(history[1].metadata.name).toBe('First');
    });
});

describe('getHistory', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns empty array when no history exists', () => {
        const result = getHistory();
        expect(result).toEqual([]);
    });

    it('handles corrupted JSON gracefully', () => {
        localStorage.setItem('bowlHistory', 'invalid json{{{');
        
        const result = getHistory();
        expect(result).toEqual([]);
    });
});

describe('getHistoryCount', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns 0 when no history', () => {
        expect(getHistoryCount()).toBe(0);
    });

    it('returns correct count', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        saveToHistory(bowlprop, ctrl, canvas, view2d);
        saveToHistory(bowlprop, ctrl, canvas, view2d);
        
        expect(getHistoryCount()).toBe(2);
    });
});

describe('restoreFromHistory', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null for invalid index', () => {
        expect(restoreFromHistory(-1)).toBeNull();
        expect(restoreFromHistory(0)).toBeNull();
        expect(restoreFromHistory(100)).toBeNull();
    });

    it('restores saved version correctly', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        saveToHistory(bowlprop, ctrl, canvas, view2d);
        
        const result = restoreFromHistory(0);
        expect(result.bowlprop.thick).toBe(6);
        expect(result.ctrl.sawkerf).toBe(3);
    });
});

describe('getHistorySummary', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns empty array when no history', () => {
        const result = getHistorySummary();
        expect(result).toEqual([]);
    });

    it('returns summary with metadata and thumbnail', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        saveToHistory(bowlprop, ctrl, canvas, view2d, 'Test Version');
        
        const result = getHistorySummary();
        expect(result).toHaveLength(1);
        expect(result[0].index).toBe(0);
        expect(result[0].metadata.name).toBe('Test Version');
        expect(result[0].thumbnail).toBeDefined();
    });
});

describe('clearHistory', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.removeItem.mockClear();
    });

    it('clears all history', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        saveToHistory(bowlprop, ctrl, canvas, view2d);
        clearHistory();
        
        expect(getHistoryCount()).toBe(0);
    });
});

describe('deleteFromHistory', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('deletes specific version', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        saveToHistory(bowlprop, ctrl, canvas, view2d, 'First');
        saveToHistory(bowlprop, ctrl, canvas, view2d, 'Second');
        saveToHistory(bowlprop, ctrl, canvas, view2d, 'Third');
        
        deleteFromHistory(1); // Delete 'Second'
        
        const history = getHistory();
        expect(history).toHaveLength(2);
        expect(history[0].metadata.name).toBe('Third');
        expect(history[1].metadata.name).toBe('First');
    });

    it('handles invalid index gracefully', () => {
        const result = deleteFromHistory(100);
        expect(result).toEqual([]);
    });
});

// =============================================================================
// LEGACY API TESTS (kept for backward compatibility)
// =============================================================================
describe('Legacy API: persistence can', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem.mockClear();
        localStorage.getItem.mockClear();
        localStorage.removeItem.mockClear();
    });

    it('save a design (legacy)', () => {
        const bowlpropMock = { test: "123" };
        const ctrlMock = { inch: false };
        
        saveDesignAndSettings(bowlpropMock, ctrlMock);
        
        expect(localStorage.setItem).toHaveBeenCalledWith("bowlDesign", expect.any(String));
        expect(localStorage.setItem).toHaveBeenCalledWith("bowlSettings", expect.any(String));
    });

    it('can check for an existing design (legacy)', () => {
        const bowlpropMock = { test: "123", timestamp: "0815-4711" };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        
        const timestamp = checkStorage();
        expect(timestamp).toBe(bowlpropMock.timestamp);
    });

    it('load an existing design (legacy)', () => {
        const bowlpropMock = { test: "123", timestamp: "0815-4711" };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        
        const loadedBowlprop = loadDesign();
        expect(loadedBowlprop.test).toBe("123");
    });

    it('load an existing setting (legacy)', () => {
        const ctrlMock = { inch: false };
        localStorage.setItem("bowlSettings", JSON.stringify(ctrlMock));
        
        const loadedSettings = loadSettings();
        expect(loadedSettings.inch).toBe(false);
    });
});

describe('Legacy API: saveDesignAndSettings', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem.mockClear();
    });

    it('adds timestamp to bowlprop before saving', () => {
        const bowlprop = { test: "value" };
        const ctrl = { inch: false };
        
        saveDesignAndSettings(bowlprop, ctrl);
        
        expect(bowlprop.timestamp).toBeDefined();
    });

    it('timestamp is valid ISO date string', () => {
        const bowlprop = { test: "value" };
        const ctrl = { inch: false };
        
        saveDesignAndSettings(bowlprop, ctrl);
        
        const timestamp = bowlprop.timestamp;
        const parsed = new Date(timestamp);
        expect(parsed.toJSON()).toBe(timestamp);
    });
});

describe('Legacy API: loadDesign', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null when no design exists', () => {
        const result = loadDesign();
        expect(result).toBeNull();
    });

    it('handles corrupted JSON gracefully', () => {
        localStorage.setItem("bowlDesign", "{ invalid json }}}");
        
        expect(() => loadDesign()).not.toThrow();
        const result = loadDesign();
        expect(result).toBeNull();
    });
});

describe('Legacy API: loadSettings', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null when no settings exist', () => {
        const result = loadSettings();
        expect(result).toBeNull();
    });

    it('handles corrupted JSON gracefully', () => {
        localStorage.setItem("bowlSettings", "not valid json at all");
        
        expect(() => loadSettings()).not.toThrow();
        const result = loadSettings();
        expect(result).toBeNull();
    });
});

describe('Legacy API: checkStorage', () => {
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

    it('returns timestamp from new history format', () => {
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        
        saveToHistory(bowlprop, ctrl, canvas, view2d);
        
        const result = checkStorage();
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
    });
});

describe('Legacy API: clearDesignAndSettings', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.removeItem.mockClear();
    });

    it('removes legacy keys and history', () => {
        localStorage.setItem("bowlDesign", JSON.stringify({ test: "value" }));
        localStorage.setItem("bowlSettings", JSON.stringify({ inch: true }));
        
        const bowlprop = createSampleBowlProp();
        const ctrl = createSampleCtrl();
        const canvas = createMockCanvas();
        const view2d = createMockView2D();
        saveToHistory(bowlprop, ctrl, canvas, view2d);
        
        clearDesignAndSettings();
        
        expect(localStorage.getItem("bowlDesign")).toBeNull();
        expect(localStorage.getItem("bowlSettings")).toBeNull();
        expect(getHistoryCount()).toBe(0);
    });
});
