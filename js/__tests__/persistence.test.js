import { loadDesign, saveDesign, checkStorage, clearDesign } from "../persistence.mjs";
require('jest-localstorage-mock');

describe('persistence can', () => {
    it('save, load and clear a design', () => {
        var bowlpropMock = {
            test: "123"
        }
        // Saving...
        saveDesign(bowlpropMock);
        expect(Object.keys(localStorage.__STORE__).length).toBe(1);
        expect(localStorage.setItem).toHaveBeenLastCalledWith("bowlDesign", JSON.stringify(bowlpropMock));
        // Checking...
        var timestamp = checkStorage();
        expect(localStorage.getItem).toHaveBeenLastCalledWith("bowlDesign");
        expect(timestamp).toBe(bowlpropMock.timestamp);
        // Loading...
        var loadedBowlprop = loadDesign();
        expect(loadedBowlprop.test).toBe("123");
        // Deleting...
        clearDesign();
        expect(Object.keys(localStorage.__STORE__).length).toBe(0);
        expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
    });
});