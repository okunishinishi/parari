/**
 * Brower unit test for pr.Drawable
 * Runs with Kamra.
 */

"use strict";

describe('pr.Drawable', function () {

    var pr = window.parari;

    it('pr.Drawable', function () {
        var drawable = new pr.Drawable(document.body);
        expect(drawable).toBeDefined();
    });

    it('From element.', function () {
        var drawable = new pr.Drawable(document.body);
        expect(drawable).toBeDefined();
    });
});