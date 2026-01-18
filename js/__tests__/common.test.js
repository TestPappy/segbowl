import { capitalize, defaultColors, defaultLens, defaultWood, reduce } from '../common.js';

// =============================================================================
// TEST CASES FOR: defaultColors
// =============================================================================
describe('defaultColors', () => {
    test('set default colors to be 12x #E2CAA0', () => {
        const isSameColor = (element) => element == "#E2CAA0";
        var result = defaultColors();
        expect(result.length).toBe(12);
        expect(result.every(isSameColor)).toBeTruthy();
    });

    it('returns a new array instance each time', () => {
        const result1 = defaultColors();
        const result2 = defaultColors();
        expect(result1).not.toBe(result2);
        // Modifying one should not affect the other
        result1[0] = '#000000';
        expect(result2[0]).toBe('#E2CAA0');
    });
});

// =============================================================================
// TEST CASES FOR: defaultWood
// =============================================================================
describe('defaultWood', () => {
    test('set default wood to be 12x maple', () => {
        const isSameWood = (element) => element == "maple";
        var result = defaultWood();
        expect(result.length).toBe(12);
        expect(result.every(isSameWood)).toBeTruthy();
    });

    it('returns a new array instance each time', () => {
        const result1 = defaultWood();
        const result2 = defaultWood();
        expect(result1).not.toBe(result2);
        // Modifying one should not affect the other
        result1[0] = 'walnut';
        expect(result2[0]).toBe('maple');
    });
});

// =============================================================================
// TEST CASES FOR: defaultLens
// =============================================================================
describe('defaultLens', () => {
    test('default amount of segments is 12', () => {
        var result = defaultLens();
        expect(result.length).toBe(12);
        expect(result.every((element) => element == 1)).toBeTruthy();
    });

    it('creates array with specified segment count', () => {
        const counts = [6, 8, 16, 24];
        counts.forEach(count => {
            const result = defaultLens(count);
            expect(result.length).toBe(count);
        });
    });

    it('initializes all segment lengths to 1', () => {
        const result = defaultLens(16);
        expect(result.every(element => element === 1)).toBeTruthy();
    });

    it('returns a new array instance each time', () => {
        const result1 = defaultLens();
        const result2 = defaultLens();
        expect(result1).not.toBe(result2);
        // Modifying one should not affect the other
        result1[0] = 2;
        expect(result2[0]).toBe(1);
    });
});

// =============================================================================
// TEST CASES FOR: capitalize
// =============================================================================
describe('capitalize', () => {
    test('capitalize converts first letter to upper case', () => {
        var result = capitalize("test");
        expect(result).toBe("Test");
    });

    it('handles already capitalized strings', () => {
        expect(capitalize("Test")).toBe("Test");
        expect(capitalize("MAPLE")).toBe("MAPLE");
    });

    it('handles all uppercase strings', () => {
        expect(capitalize("TEST")).toBe("TEST");
        expect(capitalize("WALNUT")).toBe("WALNUT");
    });

    it('handles single character strings', () => {
        expect(capitalize("a")).toBe("A");
        expect(capitalize("Z")).toBe("Z");
    });

    it('handles strings starting with numbers', () => {
        expect(capitalize("1test")).toBe("1test");
        expect(capitalize("123abc")).toBe("123abc");
    });

    it('preserves case of remaining characters', () => {
        expect(capitalize("tEST")).toBe("TEST");
        expect(capitalize("mAPLE")).toBe("MAPLE");
        expect(capitalize("wAlNuT")).toBe("WAlNuT");
    });
});

// =============================================================================
// TEST CASES FOR: reduce (mm/inch formatting)
// =============================================================================
describe('reduce', () => {
    // Ctrl mock for mm mode
    const ctrlMM = { inch: false, step: 0.5 };
    
    // Ctrl mock for inch mode
    const ctrlInch = { inch: true, step: 1/64 };

    // --- MM Mode Tests ---
    describe('in mm mode', () => {
        it('formats value with mm suffix', () => {
            expect(reduce(25.4, null, ctrlMM)).toBe('25.4 mm');
            expect(reduce(100, null, ctrlMM)).toBe('100.0 mm');
        });

        it('formats to one decimal place', () => {
            expect(reduce(25.456, null, ctrlMM)).toBe('25.5 mm');
            expect(reduce(25.444, null, ctrlMM)).toBe('25.4 mm');
            expect(reduce(10.96, null, ctrlMM)).toBe('11.0 mm');
        });

        it('handles zero value', () => {
            expect(reduce(0, null, ctrlMM)).toBe('0.0 mm');
        });

        it('handles negative values', () => {
            expect(reduce(-10, null, ctrlMM)).toBe('-10.0 mm');
            expect(reduce(-25.4, null, ctrlMM)).toBe('-25.4 mm');
        });

        it('handles large values', () => {
            expect(reduce(1000, null, ctrlMM)).toBe('1000.0 mm');
            expect(reduce(9999.9, null, ctrlMM)).toBe('9999.9 mm');
        });

        it('handles very small values', () => {
            expect(reduce(0.1, null, ctrlMM)).toBe('0.1 mm');
            expect(reduce(0.05, null, ctrlMM)).toBe('0.1 mm'); // rounds up
            expect(reduce(0.04, null, ctrlMM)).toBe('0.0 mm'); // rounds down
        });
    });

    // --- Inch Mode Tests ---
    describe('in inch mode', () => {
        it('converts mm to inches', () => {
            // 25.4mm = 1 inch
            expect(reduce(25.4, 1/64, ctrlInch)).toBe('1"');
            // 50.8mm = 2 inches
            expect(reduce(50.8, 1/64, ctrlInch)).toBe('2"');
        });

        it('formats decimal inches with decimal step', () => {
            expect(reduce(25.4, "decimal", ctrlInch)).toBe('1.00"');
            expect(reduce(50.8, "decimal", ctrlInch)).toBe('2.00"');
            expect(reduce(38.1, "decimal", ctrlInch)).toBe('1.50"');
        });

        it('formats decimal inches when step is NaN', () => {
            expect(reduce(25.4, NaN, ctrlInch)).toBe('1.00"');
            expect(reduce(12.7, NaN, ctrlInch)).toBe('0.50"');
        });
    });

    // --- Fractional Inch Tests ---
    describe('fractional inch formatting', () => {
        it('formats whole inches without fraction', () => {
            expect(reduce(50.8, 1/16, ctrlInch)).toBe('2"');
            expect(reduce(76.2, 1/16, ctrlInch)).toBe('3"');
            expect(reduce(25.4, 1/8, ctrlInch)).toBe('1"');
        });

        it('formats half inch fraction', () => {
            expect(reduce(12.7, 1/2, ctrlInch)).toBe('1⁄2"');
        });

        it('formats quarter inch fractions', () => {
            expect(reduce(6.35, 1/4, ctrlInch)).toBe('1⁄4"');
            expect(reduce(19.05, 1/4, ctrlInch)).toBe('3⁄4"');
        });

        it('formats eighth inch fractions', () => {
            expect(reduce(3.175, 1/8, ctrlInch)).toBe('1⁄8"');
            expect(reduce(9.525, 1/8, ctrlInch)).toBe('3⁄8"');
            expect(reduce(15.875, 1/8, ctrlInch)).toBe('5⁄8"');
        });

        it('formats sixteenth inch fractions', () => {
            expect(reduce(1.5875, 1/16, ctrlInch)).toBe('1⁄16"');
            expect(reduce(4.7625, 1/16, ctrlInch)).toBe('3⁄16"');
            expect(reduce(11.1125, 1/16, ctrlInch)).toBe('7⁄16"');
        });

        it('formats sixty-fourth inch fractions', () => {
            const oneOver64mm = 25.4 / 64; // ~0.396875mm
            expect(reduce(oneOver64mm, 1/64, ctrlInch)).toBe('1⁄64"');
            expect(reduce(oneOver64mm * 3, 1/64, ctrlInch)).toBe('3⁄64"');
        });

        it('reduces fractions to lowest terms', () => {
            // 2/4 should become 1/2
            expect(reduce(12.7, 1/4, ctrlInch)).toBe('1⁄2"');
            // 4/16 should become 1/4
            expect(reduce(6.35, 1/16, ctrlInch)).toBe('1⁄4"');
            // 8/16 should become 1/2
            expect(reduce(12.7, 1/16, ctrlInch)).toBe('1⁄2"');
            // 4/8 should become 1/2
            expect(reduce(12.7, 1/8, ctrlInch)).toBe('1⁄2"');
        });

        it('formats mixed fractions correctly', () => {
            // 1.5" = 38.1mm
            expect(reduce(38.1, 1/2, ctrlInch)).toBe('1 1⁄2"');
            // 2.25" = 57.15mm
            expect(reduce(57.15, 1/4, ctrlInch)).toBe('2 1⁄4"');
            // 3.75" = 95.25mm
            expect(reduce(95.25, 1/4, ctrlInch)).toBe('3 3⁄4"');
        });

        it('handles zero value returning 0"', () => {
            expect(reduce(0, 1/16, ctrlInch)).toBe('0"');
            expect(reduce(0, 1/8, ctrlInch)).toBe('0"');
        });

        it('handles exactly one inch', () => {
            expect(reduce(25.4, 1/16, ctrlInch)).toBe('1"');
            expect(reduce(25.4, 1/8, ctrlInch)).toBe('1"');
            expect(reduce(25.4, 1/4, ctrlInch)).toBe('1"');
        });
    });

    // --- Step Parameter Tests ---
    describe('step parameter handling', () => {
        it('uses ctrl.step when step parameter is null', () => {
            const ctrlWith16th = { inch: true, step: 1/16 };
            // 1/16" = 1.5875mm - should use ctrl.step of 1/16
            expect(reduce(1.5875, null, ctrlWith16th)).toBe('1⁄16"');
        });

        it('uses provided step parameter', () => {
            // Override ctrl.step with explicit step
            const ctrlWith64th = { inch: true, step: 1/64 };
            // Use 1/8 step instead of ctrl's 1/64
            expect(reduce(3.175, 1/8, ctrlWith64th)).toBe('1⁄8"');
        });

        it('handles 1/16 inch step', () => {
            expect(reduce(1.5875, 1/16, ctrlInch)).toBe('1⁄16"');
            expect(reduce(3.175, 1/16, ctrlInch)).toBe('1⁄8"'); // reduced
            expect(reduce(4.7625, 1/16, ctrlInch)).toBe('3⁄16"');
            expect(reduce(23.8125, 1/16, ctrlInch)).toBe('15⁄16"');
        });

        it('handles 1/8 inch step', () => {
            expect(reduce(3.175, 1/8, ctrlInch)).toBe('1⁄8"');
            expect(reduce(6.35, 1/8, ctrlInch)).toBe('1⁄4"'); // reduced
            expect(reduce(9.525, 1/8, ctrlInch)).toBe('3⁄8"');
            expect(reduce(22.225, 1/8, ctrlInch)).toBe('7⁄8"');
        });

        it('handles 1/32 inch step', () => {
            const oneOver32mm = 25.4 / 32; // ~0.79375mm
            expect(reduce(oneOver32mm, 1/32, ctrlInch)).toBe('1⁄32"');
            expect(reduce(oneOver32mm * 3, 1/32, ctrlInch)).toBe('3⁄32"');
            expect(reduce(oneOver32mm * 5, 1/32, ctrlInch)).toBe('5⁄32"');
        });
    });

    // --- Edge Cases ---
    describe('edge cases', () => {
        it('handles very small values near machine precision', () => {
            // Very small value should round to something reasonable
            const tinyValue = 0.001; // 0.001mm
            expect(reduce(tinyValue, null, ctrlMM)).toBe('0.0 mm');
        });

        it('rounds correctly at fraction boundaries', () => {
            // Just below 1/2" - should round to 1/2" at 1/16 precision
            const justBelow = 12.69; // slightly less than 12.7mm (1/2")
            expect(reduce(justBelow, 1/16, ctrlInch)).toBe('1⁄2"');
            
            // Just above 1/4" - should round to 1/4" at 1/16 precision
            const justAbove = 6.36; // slightly more than 6.35mm (1/4")
            expect(reduce(justAbove, 1/16, ctrlInch)).toBe('1⁄4"');
        });

        it('uses Unicode fraction slash (⁄) character', () => {
            const result = reduce(12.7, 1/2, ctrlInch);
            // Unicode fraction slash is U+2044 (⁄), not forward slash (/)
            expect(result).toContain('⁄');
            expect(result).not.toContain('/');
        });
    });
});
