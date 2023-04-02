import { dfltclrs, dfltlens } from './common.mjs';

test('set default colors to be 12x #E2CAA0', () => {
    const isSameColor = (element) => element == "#E2CAA0";
    var result = dfltclrs();
    expect(result.length).toBe(12);
    expect(result.every(isSameColor)).toBe(true);
});

test('default amount of segments is 12', () => {
    var result = dfltlens();
    expect(result.length).toBe(12);
});