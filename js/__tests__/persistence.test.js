import { loadDesign, saveDesign, checkStorage, clearDesign } from "../persistence.mjs";
require('jest-localstorage-mock');

describe('persistence can', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem.mockClear();
        localStorage.getItem.mockClear();
        localStorage.removeItem.mockClear();
      });

    it('save a design', () => {
        var bowlpropMock = {
            test: "123"
        }
        // Saving...
        saveDesign(bowlpropMock);
        expect(Object.keys(localStorage.__STORE__).length).toBe(1);
        expect(localStorage.setItem).toHaveBeenLastCalledWith("bowlDesign", JSON.stringify(bowlpropMock));

    });

    it('can check for an existing design', () => {
        var bowlpropMock = {
            test: "123",
            timestamp: "0815-4711"
        };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        var timestamp = checkStorage();
        expect(localStorage.getItem).toHaveBeenLastCalledWith("bowlDesign");
        expect(timestamp).toBe(bowlpropMock.timestamp);
    });

    it('load an existing design', () => {
        var bowlpropMock = {
            test: "123",
            timestamp: "0815-4711"
        };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        var loadedBowlprop = loadDesign();
        expect(localStorage.getItem).toHaveBeenLastCalledWith("bowlDesign");
        expect(loadedBowlprop.test).toBe("123");
    });

    it('remove an existing design', () => {
        var bowlpropMock = {
            test: "123",
            timestamp: "0815-4711"
        };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        // Deleting...
        clearDesign();
        expect(Object.keys(localStorage.__STORE__).length).toBe(0);
        expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
    });
});