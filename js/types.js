/**
 * Type definitions for the Segmented Bowl Designer
 * These JSDoc types provide IDE autocompletion and documentation.
 */

/**
 * @typedef {Object} Point
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} XVals
 * @property {number} max - Maximum x value (outer radius)
 * @property {number} min - Minimum x value (inner radius)
 */

/**
 * @typedef {Object} Ring
 * @property {number} height - Height of the ring
 * @property {number} segs - Number of segments in the ring
 * @property {string[]} clrs - Array of color values for each segment
 * @property {string[]} wood - Array of wood type names for each segment
 * @property {number[]} seglen - Relative length multiplier for each segment
 * @property {XVals} xvals - Computed x-value bounds
 * @property {number} theta - Rotation angle in radians
 */

/**
 * @typedef {Object} BowlProp
 * @property {number|null} radius - Maximum radius of the bowl
 * @property {number|null} height - Total height of the bowl
 * @property {number} thick - Wall thickness
 * @property {number} pad - Padding/margin for cutting
 * @property {Point[]|null} cpoint - Control points for the bezier curve
 * @property {number} curvesegs - Number of segments for curve approximation
 * @property {Ring[]} rings - Array of ring definitions
 * @property {number} usedrings - Number of rings actually used
 * @property {Point[][]|null} seltrapz - Trapezoid points for selected ring segments
 * @property {number[]|null} selthetas - Theta angles for each segment in selected ring
 * @property {string} [timestamp] - ISO timestamp when design was saved
 */

/**
 * @typedef {Object} Ctrl
 * @property {number|null} drag - Index of control point being dragged
 * @property {Point|null} dPoint - Last drag position
 * @property {number|null} selring - Currently selected ring index
 * @property {number[]} selseg - Array of selected segment indices
 * @property {number|null} copyring - Ring index copied for paste
 * @property {number} step - Step size for adjustments (e.g., 1/16 inch)
 * @property {boolean} inch - True for inches, false for mm
 * @property {number} sawkerf - Saw blade kerf width
 */

/**
 * @typedef {Object} View2D
 * @property {HTMLCanvasElement|null} canvas - Primary 2D canvas element
 * @property {CanvasRenderingContext2D|null} ctx - Primary canvas context
 * @property {HTMLCanvasElement|null} canvas2 - Secondary canvas for ring view
 * @property {CanvasRenderingContext2D|null} ctx2 - Secondary canvas context
 * @property {number} canvasinches - Canvas size in inches
 * @property {number|null} scale - Pixels per inch
 * @property {number|null} bottom - Y position of bowl bottom
 * @property {number|null} centerx - X position of center line
 */

/**
 * @typedef {Object} View3D
 * @property {HTMLCanvasElement|null} canvas - 3D canvas element
 * @property {THREE.WebGLRenderer|null} renderer - Three.js renderer
 * @property {THREE.Scene|null} scene - Three.js scene
 * @property {THREE.PerspectiveCamera|null} camera - Three.js camera
 * @property {THREE.BufferGeometry[]} geom - Array of geometries
 * @property {THREE.Mesh[]} mesh - Array of meshes
 */

/**
 * @typedef {Object} StyleLine
 * @property {number} width - Line width in pixels
 * @property {string} color - CSS color string
 */

/**
 * @typedef {Object} StylePoint
 * @property {number} radius - Point radius in pixels
 * @property {number} width - Line width in pixels
 * @property {string} color - CSS color string
 * @property {string} fill - CSS fill color string
 */

/**
 * @typedef {Object} Style
 * @property {StyleLine} curve - Main curve style
 * @property {StyleLine} cpline - Control point line style
 * @property {StylePoint} point - Control point style
 * @property {StyleLine} segs - Segment line style
 * @property {StyleLine} selring - Selected ring style
 * @property {StyleLine} selseg - Selected segment style
 * @property {StyleLine} copyring - Copy ring style
 * @property {StyleLine} gratio - Golden ratio guide style
 */

/**
 * @typedef {Object} CalcRingsResult
 * @property {number} height - Calculated bowl height
 * @property {number} radius - Calculated bowl radius
 * @property {number} usedrings - Number of rings used
 * @property {Ring[]} rings - Updated rings array with xvals computed
 */

/**
 * @typedef {Object} CalcRingTrapzResult
 * @property {Point[][]} seltrapz - Array of trapezoid point arrays
 * @property {number[]} selthetas - Array of theta angles for each segment
 */

// Export empty object to make this a module
export {};

