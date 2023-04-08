
export function loadDesign() {
    console.log("Loading...");
    return JSON.parse(localStorage.getItem("bowlDesign"));
}

export function saveDesign(bowlprop) {
    console.log("Saving...");
    localStorage.setItem("bowlDesign", JSON.stringify(bowlprop));
}