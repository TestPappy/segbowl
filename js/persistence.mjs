
export function loadDesign() {
    return JSON.parse(localStorage.getItem("bowlDesign"));
}

export function checkStorage() {
    var storedDesign = localStorage.getItem("bowlDesign");
    if (storedDesign !== null) {
        return JSON.parse(storedDesign).timestamp;
    }
    return null;
}

export function saveDesign(bowlprop) {
    bowlprop.timestamp = new Date().toJSON()
    localStorage.setItem("bowlDesign", JSON.stringify(bowlprop));
}

export function clearDesign() {
    localStorage.removeItem("bowlDesign");
}