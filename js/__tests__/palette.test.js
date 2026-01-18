import { 
    woodcolors, 
    brightcolors, 
    rgbToHex, 
    getWoodByColor, 
    getWoodColorKeys,
    isWoodColor 
} from '../palette.js';

// =============================================================================
// TEST CASES FOR: woodcolors Map
// =============================================================================
describe('woodcolors', () => {
    it('contains 20 wood species', () => {
        expect(woodcolors.size).toBe(20);
    });

    it('has all expected wood species', () => {
        const expectedWoods = [
            'holly', 'maple', 'yellowheart', 'red oak', 'mahogany',
            'cherry', 'walnut', 'sapele', 'teak', 'wenge',
            'ash', 'birch', 'beech', 'bubinga', 'bloodwood',
            'padauk', 'amaranth', 'rosewood', 'cocobolo', 'ebony'
        ];
        const actualWoods = Array.from(woodcolors.values());
        expectedWoods.forEach(wood => {
            expect(actualWoods).toContain(wood);
        });
    });

    it('has valid hex color format for all entries', () => {
        const hexRegex = /^#[0-9A-F]{6}$/;
        for (const [color, wood] of woodcolors) {
            expect(color).toMatch(hexRegex);
        }
    });

    it('has unique colors (no duplicates)', () => {
        const colors = Array.from(woodcolors.keys());
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBe(colors.length);
    });

    it('has unique wood names (no duplicates)', () => {
        const woods = Array.from(woodcolors.values());
        const uniqueWoods = new Set(woods);
        expect(uniqueWoods.size).toBe(woods.length);
    });

    it('contains common wood types with correct colors', () => {
        expect(woodcolors.get('#E2CAA0')).toBe('maple');
        expect(woodcolors.get('#995018')).toBe('cherry');
        expect(woodcolors.get('#7B4F34')).toBe('walnut');
        expect(woodcolors.get('#AD743F')).toBe('beech');
        expect(woodcolors.get('#623329')).toBe('teak');
        expect(woodcolors.get('#44252B')).toBe('cocobolo');
    });
});

// =============================================================================
// TEST CASES FOR: brightcolors Array
// =============================================================================
describe('brightcolors', () => {
    it('contains 20 bright colors', () => {
        expect(brightcolors.length).toBe(20);
    });

    it('has valid hex color format for all entries', () => {
        const hexRegex = /^#[0-9A-F]{6}$/;
        brightcolors.forEach(color => {
            expect(color).toMatch(hexRegex);
        });
    });

    it('includes basic colors', () => {
        expect(brightcolors).toContain('#FF0000'); // red
        expect(brightcolors).toContain('#00FF80'); // green variant
        expect(brightcolors).toContain('#0000FF'); // blue
        expect(brightcolors).toContain('#000000'); // black
    });
});

// =============================================================================
// TEST CASES FOR: rgbToHex
// =============================================================================
describe('rgbToHex', () => {
    describe('converts RGB format correctly', () => {
        it('converts basic RGB values', () => {
            expect(rgbToHex('rgb(255, 0, 0)')).toBe('#FF0000');
            expect(rgbToHex('rgb(0, 255, 0)')).toBe('#00FF00');
            expect(rgbToHex('rgb(0, 0, 255)')).toBe('#0000FF');
        });

        it('converts RGB to uppercase hex', () => {
            expect(rgbToHex('rgb(226, 202, 160)')).toBe('#E2CAA0'); // maple
            expect(rgbToHex('rgb(173, 116, 63)')).toBe('#AD743F');  // beech
            expect(rgbToHex('rgb(153, 80, 24)')).toBe('#995018');   // cherry
        });

        it('converts black and white', () => {
            expect(rgbToHex('rgb(0, 0, 0)')).toBe('#000000');
            expect(rgbToHex('rgb(255, 255, 255)')).toBe('#FFFFFF');
        });

        it('pads single digit values with zeros', () => {
            expect(rgbToHex('rgb(1, 2, 3)')).toBe('#010203');
            expect(rgbToHex('rgb(15, 15, 15)')).toBe('#0F0F0F');
        });

        it('handles spaces in RGB string', () => {
            expect(rgbToHex('rgb(255,0,0)')).toBe('#FF0000');
            expect(rgbToHex('rgb(255, 0, 0)')).toBe('#FF0000');
            expect(rgbToHex('rgb(255,  0,  0)')).toBe('#FF0000');
        });
    });

    describe('handles hex input', () => {
        it('returns uppercase hex when given lowercase hex', () => {
            expect(rgbToHex('#e2caa0')).toBe('#E2CAA0');
            expect(rgbToHex('#ff0000')).toBe('#FF0000');
        });

        it('returns hex unchanged when already uppercase', () => {
            expect(rgbToHex('#E2CAA0')).toBe('#E2CAA0');
            expect(rgbToHex('#FF0000')).toBe('#FF0000');
        });
    });

    describe('handles invalid input', () => {
        it('returns input unchanged for invalid format', () => {
            expect(rgbToHex('invalid')).toBe('invalid');
            expect(rgbToHex('red')).toBe('red');
            expect(rgbToHex('')).toBe('');
        });

        it('returns input unchanged for partial RGB', () => {
            expect(rgbToHex('rgb(255, 0)')).toBe('rgb(255, 0)');
            expect(rgbToHex('rgb(255)')).toBe('rgb(255)');
        });
    });
});

// =============================================================================
// TEST CASES FOR: getWoodByColor
// =============================================================================
describe('getWoodByColor', () => {
    describe('finds wood by RGB color', () => {
        it('returns maple for its RGB color', () => {
            expect(getWoodByColor('rgb(226, 202, 160)')).toBe('maple');
        });

        it('returns cherry for its RGB color', () => {
            expect(getWoodByColor('rgb(153, 80, 24)')).toBe('cherry');
        });

        it('returns walnut for its RGB color', () => {
            expect(getWoodByColor('rgb(123, 79, 52)')).toBe('walnut');
        });

        it('returns beech for its RGB color', () => {
            expect(getWoodByColor('rgb(173, 116, 63)')).toBe('beech');
        });

        it('returns teak for its RGB color', () => {
            expect(getWoodByColor('rgb(98, 51, 41)')).toBe('teak');
        });
    });

    describe('finds wood by hex color', () => {
        it('returns maple for #E2CAA0', () => {
            expect(getWoodByColor('#E2CAA0')).toBe('maple');
        });

        it('returns cherry for #995018', () => {
            expect(getWoodByColor('#995018')).toBe('cherry');
        });

        it('returns walnut for #7B4F34', () => {
            expect(getWoodByColor('#7B4F34')).toBe('walnut');
        });

        it('handles lowercase hex', () => {
            expect(getWoodByColor('#e2caa0')).toBe('maple');
            expect(getWoodByColor('#995018')).toBe('cherry');
        });
    });

    describe('returns unknown for unrecognized colors', () => {
        it('returns unknown for arbitrary RGB', () => {
            expect(getWoodByColor('rgb(100, 100, 100)')).toBe('unknown');
        });

        it('returns unknown for arbitrary hex', () => {
            expect(getWoodByColor('#123456')).toBe('unknown');
        });

        it('returns unknown for invalid color format', () => {
            expect(getWoodByColor('notacolor')).toBe('unknown');
        });
    });

    describe('finds all wood species', () => {
        const woodMappings = [
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
        ];

        it.each(woodMappings)('returns %s for color %s', (hex, expectedWood) => {
            expect(getWoodByColor(hex)).toBe(expectedWood);
        });
    });
});

// =============================================================================
// TEST CASES FOR: getWoodColorKeys
// =============================================================================
describe('getWoodColorKeys', () => {
    it('returns an array', () => {
        expect(Array.isArray(getWoodColorKeys())).toBe(true);
    });

    it('returns 20 color keys', () => {
        expect(getWoodColorKeys().length).toBe(20);
    });

    it('returns all hex colors from woodcolors map', () => {
        const keys = getWoodColorKeys();
        for (const [color] of woodcolors) {
            expect(keys).toContain(color);
        }
    });

    it('returns a new array instance each time', () => {
        const keys1 = getWoodColorKeys();
        const keys2 = getWoodColorKeys();
        expect(keys1).not.toBe(keys2);
        expect(keys1).toEqual(keys2);
    });
});

// =============================================================================
// TEST CASES FOR: isWoodColor
// =============================================================================
describe('isWoodColor', () => {
    it('returns true for known wood colors (hex)', () => {
        expect(isWoodColor('#E2CAA0')).toBe(true);  // maple
        expect(isWoodColor('#995018')).toBe(true);  // cherry
        expect(isWoodColor('#7B4F34')).toBe(true);  // walnut
    });

    it('returns true for known wood colors (RGB)', () => {
        expect(isWoodColor('rgb(226, 202, 160)')).toBe(true);  // maple
        expect(isWoodColor('rgb(153, 80, 24)')).toBe(true);    // cherry
    });

    it('returns true for lowercase hex', () => {
        expect(isWoodColor('#e2caa0')).toBe(true);
    });

    it('returns false for unknown colors', () => {
        expect(isWoodColor('#123456')).toBe(false);
        expect(isWoodColor('rgb(100, 100, 100)')).toBe(false);
        expect(isWoodColor('#FFFFFF')).toBe(false);
    });

    it('returns false for invalid color formats', () => {
        expect(isWoodColor('notacolor')).toBe(false);
        expect(isWoodColor('')).toBe(false);
    });
});
