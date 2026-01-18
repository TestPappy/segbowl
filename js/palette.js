/**
 * Palette module - handles wood colors and color-to-species mapping
 */

// Wood colors map: hex color -> wood species name
export const woodcolors = new Map([
    ['#FDFAF4', 'holly'],
    ['#E2CAA0', 'maple'],
    ['#C29A1F', 'yellowheart'],
    ['#C98753', 'red oak'],
    ['#AC572F', 'mahogany'],
    ['#995018', 'cherry'],
    ['#7B4F34', 'walnut'],
    ['#6E442E', 'sapele'],
    ['#623329', 'teak'],
    ['#51240D', 'wenge'],
    ['#EFEBE0', 'ash'],
    ['#EFB973', 'birch'],
    ['#AD743F', 'beech'],
    ['#965938', 'bubinga'],
    ['#884B2F', 'bloodwood'],
    ['#7C3826', 'padauk'],
    ['#843E4B', 'amaranth'],
    ['#582824', 'rosewood'],
    ['#44252B', 'cocobolo'],
    ['#342022', 'ebony']
]);

// Bright colors for non-wood palette option
export const brightcolors = [
    "#FF0000", "#FF8000", "#FFFF00", "#80FF00", "#00FF80", "#00FFFF", "#0080FF",
    "#0000FF", "#FF00FF", "#800040", "#FF6666", "#FFCC66", "#FFFF66", "#CCFF66",
    "#66FF66", "#66FFCC", "#66CCFF", "#6666FF", "#CC66FF", "#000000"
];

/**
 * Convert RGB color string to hex format
 * @param {string} rgb - Color in "rgb(r, g, b)" format
 * @returns {string} Color in "#RRGGBB" format (uppercase)
 */
export function rgbToHex(rgb) {
    // If already hex format, normalize to uppercase
    if (rgb.startsWith('#')) {
        return rgb.toUpperCase();
    }
    
    // Convert "rgb(r, g, b)" to "#RRGGBB"
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb; // Return as-is if not RGB format
    
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Get wood species name by color
 * @param {string} clr - Color in RGB or hex format
 * @returns {string} Wood species name or "unknown" if not found
 */
export function getWoodByColor(clr) {
    const hex = rgbToHex(clr);
    if (woodcolors.has(hex)) {
        return woodcolors.get(hex);
    } else {
        console.log("No match for: " + clr + " (hex: " + hex + ")");
        return "unknown";
    }
}

/**
 * Get all wood color hex values as an array
 * @returns {string[]} Array of hex color strings
 */
export function getWoodColorKeys() {
    return Array.from(woodcolors.keys());
}

/**
 * Check if a color is a known wood color
 * @param {string} clr - Color in RGB or hex format
 * @returns {boolean} True if the color is in the wood colors map
 */
export function isWoodColor(clr) {
    const hex = rgbToHex(clr);
    return woodcolors.has(hex);
}
