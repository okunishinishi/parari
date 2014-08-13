/**
 * Parari fragment.
 * @memberof parari
 * @constructor Fragment
 * @param {HTMLElement} elm - Html element.
 * @requires fabric
 */
(function (pr, f, document) {
    "use strict";

    var u = pr.utilities,
        c = pr.constants;

    /** @lends Fragment */
    function Fragment(elm) {
        elm.classList.add(c.classNames.FRAGMENT);


        var s = this;
        s.load(elm);
    };

    Fragment.prototype = {

        /**
         * Drawable object.
         * @type fabric.Oect
         */
        drawable: null,
        /**
         * Load data from fragment elment.
         * @param {HTMLElement} elm
         */
        load: function (elm) {
            var s = this;

            s.elm = elm;
            s.drawable = new pr.Drawable(elm);

            var properties = Fragment.fromDataset(elm.dataset);
            u.copy(properties, s);

            s.refresh();
        },
        /**
         *  Unload fragment element data.
         */
        unload: function () {
            var s = this;
            if (s.drawable) {
                s.drawable.removeAll();
                s.drawable = null;
            }
            if (s.elm) {
                s.elm.removeEventListener('pr-img-load');
                s.elm = null;
            }
        },
        /**
         * Reload element.
         */
        reload: function () {
            var s = this;
            s.unload();
            s.load(s.elm);
        },
        /**
         * Refresh fragments.
         */
        refresh: function () {
            var s = this;
            s.toggleVisibility(s.isVisible());
        },
        /**
         * Move to point.
         * @param {number} scrollX - X position.
         * @param {number} scrollY - Y position.
         */
        move: function (scrollX, scrollY) {
            var s = this;

            var w = s.frame.width,
                h = s.frame.height;

            var amount = s._moveAmount(scrollX, scrollY),
                x = amount.x,
                y = amount.y;

            var round = Math.round;
            s.drawable.set({
                width: round(w),
                height: round(h),
                left: round(x - w / 2),
                top: round(y - h / 2),
            });

            s.refresh();
        },
        /**
         * Get move amount.
         * @param {number} scrollX - Horizontal Scroll amount.
         * @param {number} scrollY - Vertical scroll amount.
         * @returns {{x: number, y: number}}
         * @private
         */
        _moveAmount: function (scrollX, scrollY) {
            var s = this,
                v = s.velocity;
            var dx = s.hLock ? 0 : s.dx * (1 - v),
                dy = s.vLock ? 0 : s.dy * (1 - v);
            return {
                x: s.frame.left - scrollX * v - dx,
                y: s.frame.top - scrollY * v - dy
            }
        },
        /**
         * Synchorize with source element.
         * @param {pr.Rect} bounds - Canvas bounds.
         */
        sync: function (bounds) {
            var s = this;
            var frame = pr.Rect.ofElement(s.elm, bounds);
            s.dx = frame.center.x - bounds.width / 2;
            s.dy = frame.center.y - bounds.height / 2;
            s.frame = frame;
            s._bounds = bounds;
            s.drawable.layout();
        },
        resync: function () {
            var s = this;
            s.sync(s._bounds);
        },
        isVisible: function (bounds) {
            var s = this;
            return s.isVisibleInBounds(s._bounds);
        },
        /**
         * Detect that the drawable visible or not.
         * @param {parari.Rect} bounds - Bounds to work with.
         */
        isVisibleInBounds: function (bounds) {
            if (!bounds) {
                return false;
            }
            var s = this,
                f = s.drawable.getFrame();
            return   (bounds.top < f.bottom)
                && (f.top < bounds.bottom)
                && (bounds.left < f.right)
                && (f.left < bounds.right);
        },
        /**
         * Hits a point or not.
         * @param {number} x
         * @param {number} y
         * @param {boolean} - Hit or not.
         */
        hits: function (x, y) {
            var s = this,
                f = s.drawable.getFrame();
            return f.contains(x, y);
        },
        /**
         * Handle an event.
         * @param {event} e - Event to handle.
         * @returns {boolean} - Should render or not.
         */
        handleEvent: function (e) {
            var s = this;
            switch (e.type) {
                case 'mousedown':
                    s.onmousedown(e);
                    return true;
                case 'mouseup':
                    s.onmouseup(e);
                    return true;
                case 'cick':
                    s.onclick(e);
                    return false;
            }
        },
        /**
         * Handle mouse down event.
         * @param {Event} e - Mousedown event.
         */
        onmousedown: function (e) {
            var s = this;
            s.drawable.setOpacity(0.9);
        },
        /**
         * Handle mouse up event.
         * @param {Event} e - Mouseup event.
         */
        onmouseup: function (e) {
            var s = this;
            s.drawable.setOpacity(1);
        },
        /**
         * Handle click event.
         * @param {Event} e - Click event.
         */
        onclick: function (e) {
            var s = this;

        },
        /**
         * Toggle drawable visibility.
         * @param {boolean} visible - Is visible or not.
         */
        toggleVisibility: function (visible) {
            var s = this,
                d = s.drawable;
            var needsChange = d.getVisible() !== visible;
            if (needsChange) {
                d.setVisible(visible);
            }
        },
        /**
         * Frame of the element.
         */
        frame: pr.Rect.RectZero(),
        velocity: 1,
        /** Horizontal distance from bounds center. */
        dx: 0,
        /** Vertical distance from bounds center. */
        dy: 0,
        /** Should lock horizontaly. */
        hLock: true,
        /** Should lock verticaly. */
        vLock: false
    };


    /**
     * Get proeprty data from dataset.
     * @param {DOMStringMap} dataset - Element data set.
     * @returns {object} - Parari property values.
     */
    Fragment.fromDataset = function (dataset) {
        var values = {},
            keys = Object.keys(dataset).filter(Fragment.fromDataset._keyFilter);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            values[pr.unprefixed(key)] = dataset[key];
        }
        return values;
    };
    Fragment.fromDataset._keyFilter = function (key) {
        return !!key.match(c.PREFIX_PATTERN);
    }


    pr.Fragment = Fragment;

})(
    window.parari = window.parari || {},
    window.fabric,
    document
);