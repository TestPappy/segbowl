
export function loadDesign() {
    return JSON.parse(localStorage.getItem("bowlDesign"));
}

export function loadSettings() {
    return JSON.parse(localStorage.getItem("bowlSettings"));
}

export function checkStorage() {
    var storedDesign = localStorage.getItem("bowlDesign");
    if (storedDesign !== null) {
        return JSON.parse(storedDesign).timestamp;
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