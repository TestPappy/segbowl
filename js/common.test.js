const common = require('./common');

test('set default colors to be 12x #E2CAA0', () => {
    const isSameColor = (element) => element == "#E2CAA0";
    var result = common.dfltclrs();
    expect(result.length).toBe(12);
    expect(result.every(isSameColor)).toBe(true);
});

