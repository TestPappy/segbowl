# Segmented Bowl Designer - Test Cases

This document lists all test cases to be implemented for comprehensive test coverage.

## Summary

| Test File | Existing Tests | TODO Tests | Total |
|-----------|---------------|------------|-------|
| `common.test.js` | 42 ✅ | 0 | 42 |
| `bowl_calculator.test.js` | 59 ✅ | 0 | 59 |
| `ring_calculator.test.js` | 37 ✅ | 0 | 37 |
| `persistence.test.js` | 5 | 26 | 31 |
| `drawing.test.js` | 0 | 28 | 28 |
| `report.test.js` | 0 | 35 | 35 |
| **Total** | **143** | **89** | **232** |

---

## 1. common.test.js ✅ COMPLETE

### defaultColors()
- [x] Returns 12 elements with color #E2CAA0
- [x] Returns a new array instance each time (not a reference)

### defaultWood()
- [x] Returns 12 elements with 'maple'
- [x] Returns a new array instance each time (not a reference)

### defaultLens()
- [x] Returns 12 elements by default, all set to 1
- [x] Accepts custom segment count parameter
- [x] Creates array with specified segment count (6, 8, 16, 24)
- [x] Initializes all segment lengths to 1
- [x] Returns a new array instance each time

### capitalize()
- [x] Converts first letter to upper case
- [x] Handles already capitalized strings
- [x] Handles all uppercase strings
- [x] Handles single character strings
- [x] Handles strings starting with numbers
- [x] Preserves case of remaining characters ("tEST" → "TEST")

### reduce() - MM Mode
- [x] Formats value with mm suffix
- [x] Formats to one decimal place
- [x] Handles zero value
- [x] Handles negative values
- [x] Handles large values (1000+ mm)
- [x] Handles very small values (< 1mm)

### reduce() - Inch Mode
- [x] Converts mm to inches (25.4mm → 1")
- [x] Formats decimal inches with "decimal" step
- [x] Formats decimal inches when step is NaN

### reduce() - Fractional Inch Formatting
- [x] Formats whole inches without fraction (50.8mm → "2")
- [x] Formats half inch fraction
- [x] Formats quarter inch fractions
- [x] Formats eighth inch fractions
- [x] Formats sixteenth inch fractions
- [x] Formats sixty-fourth inch fractions
- [x] Reduces fractions to lowest terms (2/4 → 1/2)
- [x] Formats mixed fractions correctly (38.1mm → "1 1⁄2")
- [x] Handles zero value returning '0"'
- [x] Handles exactly one inch

### reduce() - Step Parameter
- [x] Uses ctrl.step when step parameter is null
- [x] Uses provided step parameter when not null
- [x] Handles 1/16 inch step
- [x] Handles 1/8 inch step
- [x] Handles 1/32 inch step

### reduce() - Edge Cases
- [x] Handles very small values near machine precision
- [x] Rounds correctly at fraction boundaries
- [x] Uses Unicode fraction slash (⁄) character

---

## 2. bowl_calculator.test.js ✅ COMPLETE

### screenToRealPoint()
- [x] Converts click on canvas edge to real point
- [x] Converts click on top center to real point
- [x] Converts center of canvas to origin in real coordinates
- [x] Handles clicks left of center (negative x)
- [x] Converts bottom edge correctly with 12.7mm offset
- [x] Handles all four canvas corners
- [x] Scales correctly with different scale factors
- [x] Handles non-square canvas dimensions

### realToScreen()
- [x] Calculates screen point for standard coordinate
- [x] Calculates screen point with custom offset
- [x] Handles origin point correctly
- [x] Handles negative x values
- [x] Applies custom offset parameter
- [x] Uses default offset of -12.7mm when not specified
- [x] Is inverse of screenToRealPoint (round trip)
- [x] Centers x=0 at canvas centerx

### screenToReal()
- [x] Calculates real coordinates from screen coordinates
- [x] Returns THREE.Vector2 instances
- [x] Handles empty control points array
- [x] Handles single control point
- [x] Handles many control points (7+)
- [x] Preserves relative positions between control points

### calcBezPath()
- [x] Calculates bezier path points
- [x] Starts path at origin (0,0)
- [x] Includes 2.5mm offset point after origin
- [x] Ends path at last control point
- [x] Returns screen coordinates when real=false
- [x] Produces more points with higher curvesegs
- [x] Handles multiple bezier segments
- [x] Follows bezier curve algorithm
- [x] Handles minimum 4 control points
- [x] Returns THREE.Vector2 instances

### splitRingY()
- [x] Calculates borders of each ring on curve
- [x] Returns one curve segment per ring
- [x] First segment includes first curve point
- [x] Last segment includes last curve point
- [x] Interpolates points at ring boundaries
- [x] Handles rings taller than curve segment spacing
- [x] Handles very thin rings
- [x] Handles single ring bowl
- [x] Handles many rings (10+)
- [x] Skips segments with less than 2 points
- [x] Preserves x,y point structure in output
- [x] Handles curves with varying slope

### offsetCurve()
- [x] Calculates inner and outer bowl wall
- [x] c1 is inner wall offset inward
- [x] c2 is outer wall offset outward
- [x] c2 closes gap to c1 at end
- [x] Offset distance is exact
- [x] Handles zero offset
- [x] Handles large offset values
- [x] Handles small offset values
- [x] Offset is perpendicular to curve direction
- [x] Handles horizontal curve segments
- [x] Handles vertical curve segments
- [x] Handles diagonal curve segments
- [x] Returns THREE.Vector2 instances
- [x] Handles minimum curve (2 points)
- [x] Handles identical consecutive points gracefully

---

## 3. ring_calculator.test.js ✅ COMPLETE

### calcRings()
- [x] Calculates ring dimensions in mm
- [x] Returns height as max y value of curve
- [x] Returns radius as max x value of curve
- [x] Counts usedrings correctly based on height
- [x] Creates new rings when bowl is taller than existing rings
- [x] Preserves existing ring properties
- [x] Calculates xvals.max with padding added
- [x] Calculates xvals.min with padding subtracted
- [x] xvals.min is never negative
- [x] xvals.max is never negative
- [x] Handles rings with different heights
- [x] Handles tall bowls requiring many rings
- [x] Handles short bowls with few rings
- [x] Handles different wall thickness values
- [x] Handles different padding values
- [x] Interpolates x values for thin rings
- [x] Does not mutate original bowlprop object

### calcRingTrapz()
- [x] Calculates trapezoid shapes for ring segments
- [x] Returns one trapezoid per segment
- [x] Each trapezoid has 4 corner points
- [x] Calculates correct theta angle for each segment
- [x] selthetas tracks cumulative rotation
- [x] Rotates trapezoids when rotate=true
- [x] Does not rotate trapezoids when rotate=false
- [x] Applies ring theta offset to rotation
- [x] Defaults to ring index 0 when null
- [x] Handles 6 segment rings
- [x] Handles 8 segment rings
- [x] Handles 12 segment rings
- [x] Handles 16 segment rings
- [x] Handles 24 segment rings
- [x] Handles unequal segment lengths
- [x] Trapezoid corners are within ring xvals bounds
- [x] Adjusts outer radius for segments to meet at endpoints
- [x] Trapezoid points form valid polygon in order
- [x] Handles minimum 3 segments
- [x] All segment thetas sum to full circle

---

## 4. persistence.test.js

### saveDesignAndSettings()
- [x] Saves design to localStorage
- [ ] Adds timestamp to bowlprop before saving
- [ ] Timestamp is valid ISO date string
- [ ] Preserves all bowlprop properties
- [ ] Preserves all ctrl properties
- [ ] Handles complex nested objects
- [ ] Handles empty arrays in bowlprop
- [ ] Overwrites existing saved design

### loadDesign()
- [x] Loads existing design
- [ ] Returns null when no design exists
- [ ] Handles corrupted JSON gracefully
- [ ] Preserves all saved properties on load
- [ ] Parses nested objects correctly

### loadSettings()
- [x] Loads existing settings
- [ ] Returns null when no settings exist
- [ ] Handles corrupted JSON gracefully
- [ ] Preserves boolean values correctly
- [ ] Preserves number values correctly

### checkStorage()
- [x] Checks for existing design timestamp
- [ ] Returns null when no design exists
- [ ] Returns null when design has no timestamp
- [ ] Handles corrupted JSON gracefully
- [ ] Returns exact timestamp string from saved design

### clearDesignAndSettings()
- [x] Removes design and settings from localStorage
- [ ] Removes bowlDesign key
- [ ] Removes bowlSettings key
- [ ] Does not throw when storage is already empty
- [ ] Does not affect other localStorage keys

---

## 5. drawing.test.js (NEW)

### clearCanvas()
- [ ] Creates a gradient background from lightblue to lightgray
- [ ] Fills the entire canvas area
- [ ] Handles different canvas dimensions
- [ ] Creates gradient in correct vertical direction

### drawCurve()
- [ ] Sets line width proportional to bowl thickness
- [ ] Applies curve color from style
- [ ] Draws bezier curves through all control points
- [ ] Draws mirrored curve on left side of center
- [ ] Starts curve from center bottom of canvas
- [ ] Handles minimum control points (single bezier)
- [ ] Handles multiple bezier segments

### drawSegProfile()
- [ ] Highlights selected ring with selection style
- [ ] Highlights copied ring with copy style
- [ ] Uses default style for unselected rings
- [ ] Draws rectangle for each ring
- [ ] Positions rings correctly in vertical stack
- [ ] Only draws rings within bowl height bounds
- [ ] Displays ring numbers when option is enabled
- [ ] Recalculates ring dimensions before drawing

### drawRing()
- [ ] Draws polygon for each segment in ring
- [ ] Fills segments with assigned colors
- [ ] Highlights selected segments with selection style
- [ ] Draws inner and outer boundary circles
- [ ] Applies padding to boundary circles
- [ ] Calculates trapezoid shapes before drawing
- [ ] Handles various segment counts correctly
- [ ] Handles segments with varying lengths

---

## 6. report.test.js (NEW)

### getReportSegsList()
- [ ] Returns array of segment info objects
- [ ] Groups identical segments by color and size
- [ ] Calculates correct cut angle for each segment group
- [ ] Calculates outside edge length
- [ ] Calculates inside edge length
- [ ] Calculates segment width (radial dimension)
- [ ] Calculates total strip length needed
- [ ] Includes wood type for each segment group
- [ ] Includes color for each segment group
- [ ] Counts number of identical segments
- [ ] Returns single group when all segments are identical
- [ ] Handles alternating color patterns
- [ ] Handles all unique colors
- [ ] Separates segments with different lengths even if same color
- [ ] Handles various segment counts (6, 8, 12, 16, 24)
- [ ] Handles base ring (ring index 0)
- [ ] Works with any valid ring index

### createReport()
- [ ] Creates cut list table with all rings
- [ ] Labels first ring as Base and others with numbers
- [ ] Includes ring diameter in report
- [ ] Includes ring thickness in report
- [ ] Includes ring rotation angle
- [ ] Formats measurements according to step parameter
- [ ] Generates bowl profile image
- [ ] Generates 3D view image
- [ ] Generates image for each ring
- [ ] Creates individual cut list table for each ring

### add_cutlist_row (via integration)
- [ ] Adds table row for each segment group
- [ ] Formats cut angle with degree symbol
- [ ] Accounts for saw kerf in total strip length
- [ ] Handles multiple segment groups in one ring

---

## Implementation Priority

### High Priority (Core Functionality)
1. `reduce()` tests - Critical for measurement display accuracy
2. `calcRings()` edge cases - Core calculation logic
3. `calcRingTrapz()` edge cases - Core calculation logic
4. `getReportSegsList()` - Report generation accuracy

### Medium Priority (UI/Display)
5. `drawRing()` - Visual output verification
6. `drawSegProfile()` - Visual output verification
7. `offsetCurve()` edge cases - Wall thickness calculations

### Lower Priority (Infrastructure)
8. Persistence edge cases - Error handling
9. `clearCanvas()` - Basic canvas operations
10. `createReport()` integration - Complex UI testing

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- bowl_calculator.test.js

# Run tests in watch mode
npm test -- --watch
```
