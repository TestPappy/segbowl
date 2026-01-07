
export function loadDesign() {
    try {
        const raw = localStorage.getItem("bowlDesign");
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error("Failed to load design:", e);
        return null;
    }
}

export function loadSettings() {
    try {
        const raw = localStorage.getItem("bowlSettings");
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error("Failed to load settings:", e);
        return null;
    }
}

export function checkStorage() {
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

export function saveDesignAndSettings(bowlprop, ctrl) {
    bowlprop.timestamp = new Date().toJSON()
    localStorage.setItem("bowlDesign", JSON.stringify(bowlprop));
    localStorage.setItem("bowlSettings", JSON.stringify(ctrl));
}

export function clearDesignAndSettings() {
    localStorage.removeItem("bowlDesign");
    localStorage.removeItem("bowlSettings");
}