import { capitalize, dfltclrs, dfltlens, dfltwood } from '../common.mjs';

test('set default colors to be 12x #E2CAA0', () => {
    const isSameColor = (element) => element == "#E2CAA0";
    var result = dfltclrs();
    expect(result.length).toBe(12);
    expect(result.every(isSameColor)).toBeTruthy();
});

test('set default wood to be 12x maple', () => {
    const isSameWood = (element) => element == "maple";
    var result = dfltwood();
    expect(result.length).toBe(12);
    expect(result.every(isSameWood)).toBeTruthy();
});

test('default amount of segments is 12', () => {
    var result = dfltlens();
    expect(result.length).toBe(12);
    expect(result.every((element) => element == 1)).toBeTruthy();
});

test('capitalize converts first letter to upper case', () => {
    var result = capitalize("test");
    expect(result).toBe("Test");
})