var tempStore;

export function loadDesign() {
    console.log("Loading...");
    return JSON.parse(tempStore);
}

export function saveDesign(bowlprop) {
    console.log("Saving...");
    tempStore = JSON.stringify(bowlprop);
}