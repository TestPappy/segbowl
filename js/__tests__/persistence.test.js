import { loadDesign, loadSettings, checkStorage, clearDesignAndSettings, saveDesignAndSettings } from "../persistence.js";
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
        };
        var ctrlMock = {
            inch: false
        };
        // Saving...
        saveDesignAndSettings(bowlpropMock, ctrlMock);
        expect(Object.keys(localStorage.__STORE__).length).toBe(2);
        expect(localStorage.setItem).toHaveBeenCalledWith("bowlDesign", JSON.stringify(bowlpropMock));
        expect(localStorage.setItem).toHaveBeenLastCalledWith("bowlSettings", JSON.stringify(ctrlMock));
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

    it('load an existing setting', () => {
        var ctrlMock = {
            inch: false
        };
        localStorage.setItem("bowlSettings", JSON.stringify(ctrlMock));
        var loadedSettings = loadSettings();
        expect(localStorage.getItem).toHaveBeenLastCalledWith("bowlSettings");
        expect(loadedSettings.inch).toBe(false);
    });

    it('remove an existing design', () => {
        var bowlpropMock = {
            test: "123",
            timestamp: "0815-4711"
        };
        localStorage.setItem("bowlDesign", JSON.stringify(bowlpropMock));
        localStorage.setItem("bowlSettings", JSON.stringify(bowlpropMock));
        // Deleting...
        clearDesignAndSettings();
        expect(Object.keys(localStorage.__STORE__).length).toBe(0);
        expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
    });
});