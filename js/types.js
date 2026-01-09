/**
 * Type definitions for the Segmented Bowl Designer
 * These JSDoc types provide IDE autocompletion and documentation.
 */

/**
 * @typedef {Object} Point
 * @property {number} x - X coordinate (in mm)
 * @property {number} y - Y coordinate (in mm)
 */

/**
 * @typedef {Object} XVals
 * @property {number} max - Maximum x value (outer radius in mm)
 * @property {number} min - Minimum x value (inner radius in mm)
 */

/**
 * @typedef {Object} Ring
 * @property {number} height - Height of the ring (in mm)
 * @property {number} segs - Number of segments in the ring
 * @property {string[]} clrs - Array of color values for each segment
 * @property {string[]} wood - Array of wood type names for each segment
 * @property {number[]} seglen - Relative length multiplier for each segment
 * @property {XVals} xvals - Computed x-value bounds (in mm)
 * @property {number} theta - Rotation angle in radians
 */

/**
 * @typedef {Object} BowlProp
 * @property {number|null} radius - Maximum radius of the bowl (in mm)
 * @property {number|null} height - Total height of the bowl (in mm)
 * @property {number} thick - Wall thickness (in mm)
 * @property {number} pad - Padding/margin for cutting (in mm)
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
 * @property {number} step - Step size for adjustments (in mm for mm mode, 1/16 for inch display mode)
 * @property {boolean} inch - Display mode: true for inches, false for mm (internal values always in mm)
 * @property {number} sawkerf - Saw blade kerf width (in mm)
 */

/**
 * @typedef {Object} View2D
 * @property {HTMLCanvasElement|null} canvas - Primary 2D canvas element
 * @property {CanvasRenderingContext2D|null} ctx - Primary canvas context
 * @property {HTMLCanvasElement|null} canvas2 - Secondary canvas for ring view
 * @property {CanvasRenderingContext2D|null} ctx2 - Secondary canvas context
 * @property {number} canvasmm - Canvas size in mm
 * @property {number|null} scale - Pixels per mm
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
 * @property {number} height - Calculated bowl height (in mm)
 * @property {number} radius - Calculated bowl radius (in mm)
 * @property {number} usedrings - Number of rings used
 * @property {Ring[]} rings - Updated rings array with xvals computed
 */

/**
 * @typedef {Object} CalcRingTrapzResult
 * @property {Point[][]} seltrapz - Array of trapezoid point arrays (coordinates in mm)
 * @property {number[]} selthetas - Array of theta angles for each segment
 */

// Export empty object to make this a module
export {};
