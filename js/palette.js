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

// Bright colors map: hex color -> color name
export const brightcolors = new Map([
    ['#FF0000', 'red'],
    ['#FF8000', 'orange'],
    ['#FFFF00', 'yellow'],
    ['#80FF00', 'lime'],
    ['#00FF80', 'spring green'],
    ['#00FFFF', 'cyan'],
    ['#0080FF', 'sky blue'],
    ['#0000FF', 'blue'],
    ['#FF00FF', 'magenta'],
    ['#800040', 'burgundy'],
    ['#FF6666', 'salmon'],
    ['#FFCC66', 'peach'],
    ['#FFFF66', 'cream'],
    ['#CCFF66', 'chartreuse'],
    ['#66FF66', 'mint'],
    ['#66FFCC', 'aquamarine'],
    ['#66CCFF', 'light blue'],
    ['#6666FF', 'periwinkle'],
    ['#CC66FF', 'lavender'],
    ['#000000', 'black']
]);

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
    }
    return "unknown";
}

/**
 * Get color name by color value (checks both wood and bright colors)
 * @param {string} clr - Color in RGB or hex format
 * @returns {string} Color name or "unknown" if not found
 */
export function getColorName(clr) {
    const hex = rgbToHex(clr);
    if (woodcolors.has(hex)) {
        return woodcolors.get(hex);
    }
    if (brightcolors.has(hex)) {
        return brightcolors.get(hex);
    }
    return "unknown";
}

/**
 * Get all wood color hex values as an array
 * @returns {string[]} Array of hex color strings
 */
export function getWoodColorKeys() {
    return Array.from(woodcolors.keys());
}

/**
 * Get all bright color hex values as an array
 * @returns {string[]} Array of hex color strings
 */
export function getBrightColorKeys() {
    return Array.from(brightcolors.keys());
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
