/**
 * Persistence module for Segmented Bowl Designer
 * Handles file export/import, version history, and localStorage management
 */

import { screenToReal } from './bowl_calculator.js';

// Constants
const SCHEMA_VERSION = 3;
const HISTORY_KEY = 'bowlHistory';
const MAX_VERSIONS = 5;
const APP_VERSION = '0.2';

// ============================================================================
// Thumbnail Capture
// ============================================================================

/**
 * Capture a canvas as a scaled-down base64 PNG thumbnail
 * @param {HTMLCanvasElement} canvas - The canvas to capture
 * @param {number} maxSize - Maximum dimension for the thumbnail
 * @returns {string|null} Base64 PNG data URL or null if canvas operations fail
 */
export function captureProfileThumbnail(canvas, maxSize = 200) {
    if (!canvas) return null;
    
    try {
        // Handle mock canvas objects (for testing)
        if (typeof canvas.toDataURL === 'function' && !canvas.getContext) {
            return canvas.toDataURL('image/png');
        }
        
        const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = Math.floor(canvas.width * scale);
        tmpCanvas.height = Math.floor(canvas.height * scale);
        
        const ctx = tmpCanvas.getContext('2d');
        if (!ctx) {
            // Canvas context not available (e.g., in jsdom test environment)
            return null;
        }
        
        ctx.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
        return tmpCanvas.toDataURL('image/png');
    } catch (e) {
        console.error('Failed to capture thumbnail:', e);
        return null;
    }
}

// ============================================================================
// Data Extraction Helpers
// ============================================================================

/**
 * Extract only essential design data from bowlprop (exclude computed fields)
 * @param {Object} bowlprop - The bowl properties object
 * @param {Object} view2d - The 2D view configuration
 * @returns {Object} Clean design data
 */
function extractDesignData(bowlprop, view2d) {
    return {
        thick: bowlprop.thick,
        pad: bowlprop.pad,
        cpoint: bowlprop.cpoint ? screenToReal(view2d, bowlprop).map(p => ({ x: p.x, y: p.y })) : null,
        curvesegs: bowlprop.curvesegs,
        rings: bowlprop.rings ? bowlprop.rings.map(ring => ({
            height: ring.height,
            segs: ring.segs,
            clrs: [...ring.clrs],
            wood: [...ring.wood],
            seglen: [...ring.seglen],
            theta: ring.theta
            // Exclude computed fields: xvals (recalculated on load)
        })) : []
    };
}

/**
 * Extract only persistent settings from ctrl (exclude UI state)
 * @param {Object} ctrl - The control state object
 * @returns {Object} Clean settings data
 */
function extractSettings(ctrl) {
    return {
        inch: ctrl.inch,
        sawkerf: ctrl.sawkerf
    };
}

/**
 * Restore full bowlprop structure from saved design data
 * @param {Object} design - The saved design data
 * @returns {Object} Full bowlprop structure
 */
function restoreBowlProp(design) {
    return {
        radius: null,  // Will be recalculated
        height: null,  // Will be recalculated
        thick: design.thick,
        pad: design.pad,
        cpoint: design.cpoint,
        curvesegs: design.curvesegs,
        rings: design.rings.map(ring => ({
            height: ring.height,
            segs: ring.segs,
            clrs: [...ring.clrs],
            wood: [...ring.wood],
            seglen: [...ring.seglen],
            xvals: [],  // Will be recalculated
            theta: ring.theta
        })),
        usedrings: design.rings.length,
        seltrapz: null,
        selthetas: null
    };
}

/**
 * Restore full ctrl structure from saved settings
 * @param {Object} settings - The saved settings
 * @returns {Object} Full ctrl structure
 */
function restoreCtrl(settings) {
    return {
        drag: null,
        dPoint: null,
        selring: 1,
        selseg: [],
        copyring: null,
        step: settings.inch ? 1/64 : 0.5,
        inch: settings.inch ?? false,
        sawkerf: settings.sawkerf ?? 3
    };
}

// ============================================================================
// Serialization / Deserialization
// ============================================================================

/**
 * Serialize bowl design and settings into storage format
 * @param {Object} bowlprop - The bowl properties
 * @param {Object} ctrl - The control state
 * @param {HTMLCanvasElement} canvas - The profile canvas for thumbnail
 * @param {Object} view2d - The 2D view configuration
 * @param {string|null} name - Optional name for the design
 * @param {string|null} existingCreated - Preserve original created timestamp
 * @returns {Object} Serialized design object
 */
export function serializeDesign(bowlprop, ctrl, canvas, view2d, name = null, existingCreated = null) {
    const now = new Date().toISOString();
    return {
        schemaVersion: SCHEMA_VERSION,
        metadata: {
            name: name,
            created: existingCreated || now,
            modified: now,
            appVersion: APP_VERSION
        },
        thumbnail: captureProfileThumbnail(canvas),
        design: extractDesignData(bowlprop, view2d),
        settings: extractSettings(ctrl)
    };
}

/**
 * Deserialize storage format back to app state
 * @param {Object} data - The stored data
 * @returns {Object} Object with bowlprop and ctrl
 */
export function deserializeDesign(data) {
    // Handle legacy format (no schemaVersion or version 1)
    if (!data.schemaVersion || data.schemaVersion === 1) {
        return migrateLegacyFormat(data);
    }
    
    // Schema version 2+
    return {
        bowlprop: restoreBowlProp(data.design),
        ctrl: restoreCtrl(data.settings),
        metadata: data.metadata,
        thumbnail: data.thumbnail,
        schemaVersion: data.schemaVersion
    };
}

// ============================================================================
// Legacy Format Migration
// ============================================================================

/**
 * Migrate legacy format (pre-schemaVersion or version 1) to current format
 * @param {Object} data - Legacy data
 * @returns {Object} Migrated data with bowlprop and ctrl
 */
function migrateLegacyFormat(data) {
    // Old format: bowlprop was stored directly with timestamp at root
    if (data.timestamp && data.rings) {
        // This is the old bowlprop format
        const bowlprop = {
            radius: data.radius ?? null,
            height: data.height ?? null,
            thick: data.thick ?? 6,
            pad: data.pad ?? 3,
            cpoint: data.cpoint ?? null,
            curvesegs: data.curvesegs ?? 50,
            rings: data.rings.map(ring => ({
                height: ring.height,
                segs: ring.segs,
                clrs: ring.clrs ? [...ring.clrs] : [],
                wood: ring.wood ? [...ring.wood] : [],
                seglen: ring.seglen ? [...ring.seglen] : [],
                xvals: ring.xvals ?? [],
                theta: ring.theta ?? 0
            })),
            usedrings: data.usedrings ?? data.rings.length,
            seltrapz: null,
            selthetas: null
        };
        
        return {
            bowlprop,
            ctrl: restoreCtrl({ inch: false, sawkerf: 3 }),
            metadata: {
                name: null,
                created: data.timestamp,
                modified: data.timestamp,
                appVersion: 'legacy'
            },
            thumbnail: null,
            schemaVersion: 1
        };
    }
    
    // Unknown format - try to use as-is
    return {
        bowlprop: data,
        ctrl: restoreCtrl({ inch: false, sawkerf: 3 }),
        metadata: null,
        thumbnail: null,
        schemaVersion: 0
    };
}

// ============================================================================
// File Export / Import
// ============================================================================

/**
 * Export design to a downloadable JSON file
 * @param {Object} bowlprop - The bowl properties
 * @param {Object} ctrl - The control state
 * @param {HTMLCanvasElement} canvas - The profile canvas for thumbnail
 * @param {Object} view2d - The 2D view configuration
 * @param {string} filename - The filename for download
 */
export function exportToFile(bowlprop, ctrl, canvas, view2d, filename = 'bowl-design.json') {
    const data = serializeDesign(bowlprop, ctrl, canvas, view2d);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

/**
 * Import design from a JSON file
 * @param {File} file - The file to import
 * @returns {Promise<Object>} Promise resolving to { bowlprop, ctrl, metadata, thumbnail }
 */
export function importFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const result = deserializeDesign(data);
                resolve(result);
            } catch (err) {
                reject(new Error('Invalid design file: ' + err.message));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

// ============================================================================
// Version History (localStorage)
// ============================================================================

/**
 * Save current design to version history
 * @param {Object} bowlprop - The bowl properties
 * @param {Object} ctrl - The control state
 * @param {HTMLCanvasElement} canvas - The profile canvas for thumbnail
 * @param {Object} view2d - The 2D view configuration
 * @param {string|null} name - Optional name for this version
 * @returns {Array} Updated history array
 */
export function saveToHistory(bowlprop, ctrl, canvas, view2d, name = null) {
    const history = getHistory();
    const entry = serializeDesign(bowlprop, ctrl, canvas, view2d, name);
    
    // Add to front of array (most recent first)
    history.unshift(entry);
    
    // Limit to MAX_VERSIONS
    if (history.length > MAX_VERSIONS) {
        history.pop();
    }
    
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Failed to save to history:', e);
        // If localStorage is full, try removing oldest entries
        if (e.name === 'QuotaExceededError') {
            while (history.length > 1) {
                history.pop();
                try {
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
                    break;
                } catch (e2) {
                    continue;
                }
            }
        }
    }
    
    return history;
}

/**
 * Get version history from localStorage
 * @returns {Array} Array of saved versions (most recent first)
 */
export function getHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to load history:', e);
        return [];
    }
}

/**
 * Get the count of versions in history
 * @returns {number} Number of saved versions
 */
export function getHistoryCount() {
    return getHistory().length;
}

/**
 * Restore a specific version from history
 * @param {number} index - Index of the version to restore (0 = most recent)
 * @returns {Object|null} Deserialized design or null if not found
 */
export function restoreFromHistory(index) {
    const history = getHistory();
    
    if (index < 0 || index >= history.length) {
        return null;
    }
    
    return deserializeDesign(history[index]);
}

/**
 * Get metadata for all versions in history (for display without full data)
 * @returns {Array} Array of { metadata, thumbnail, index } objects
 */
export function getHistorySummary() {
    const history = getHistory();
    return history.map((entry, index) => ({
        index,
        metadata: entry.metadata,
        thumbnail: entry.thumbnail
    }));
}

/**
 * Clear all version history
 */
export function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
}

/**
 * Delete a specific version from history
 * @param {number} index - Index of the version to delete
 * @returns {Array} Updated history array
 */
export function deleteFromHistory(index) {
    const history = getHistory();
    
    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
    
    return history;
}

// ============================================================================
// Legacy API Compatibility (deprecated, kept for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use saveToHistory instead
 */
export function saveDesignAndSettings(bowlprop, ctrl) {
    bowlprop.timestamp = new Date().toJSON();
    localStorage.setItem("bowlDesign", JSON.stringify(bowlprop));
    localStorage.setItem("bowlSettings", JSON.stringify(ctrl));
}

/**
 * @deprecated Use restoreFromHistory instead
 */
export function loadDesign() {
    try {
        const raw = localStorage.getItem("bowlDesign");
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error("Failed to load design:", e);
        return null;
    }
}

/**
 * @deprecated Use restoreFromHistory instead
 */
export function loadSettings() {
    try {
        const raw = localStorage.getItem("bowlSettings");
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error("Failed to load settings:", e);
        return null;
    }
}

/**
 * @deprecated Use getHistoryCount instead
 */
export function checkStorage() {
    // First check new history format
    const history = getHistory();
    if (history.length > 0 && history[0].metadata) {
        return history[0].metadata.modified;
    }
    
    // Fall back to legacy format
    try {
        const raw = localStorage.getItem("bowlDesign");
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed?.timestamp ?? null;
        }
    } catch (e) {
        console.error("Failed to check storage:", e);
    }
    return null;
}

/**
 * @deprecated Use clearHistory instead
 */
export function clearDesignAndSettings() {
    localStorage.removeItem("bowlDesign");
    localStorage.removeItem("bowlSettings");
    clearHistory();
}
