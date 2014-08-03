/**
 * @file Generate parallax page from html.
 * @namespace parari
 * @version 0.0.0
 * @require fabric.js 
 * @require one-color.js 
 */
window.parari = (function (parari) {
    "use strict";
    
    /**
	 * Utilitis for parari.
	 * @membrerof para
	 * @namespace utilities
	 */
	(function (pr, document) {
	    "use strict";
	    var u = {
	        URL: window.URL || window.webkitURL || window.mozURL || window,
	        /**
	         * Create an object url.
	         * @returns {string} - Object url
	         */
	        createObjectURL: function () {
	            return u.URL.createObjectURL.apply(u.URL, arguments);
	        },
	        /**
	         * Revoke an object url.
	         * @returns {*}
	         */
	        revokeObjectURL: function () {
	            return u.URL.revokeObjectURL.apply(u.URL, arguments);
	        },
	        /**
	         * Device pixel ratio.
	         */
	        devicePixelRatio: window.devicePixelRatio || 1,
	        /**
	         * Insert element
	         * @param {HTMLElement} newElement
	         * @param {HTMLElement} targetElement
	         */
	        insertAfter: function (newElement, targetElement) {
	            var parent = targetElement.parentNode;
	            if (!parent) {
	                return parent;
	            }
	            var isLast = parent.lastchild === targetElement;
	            if (isLast) {
	                parent.appendChild(newElement);
	            } else {
	                parent.insertBefore(newElement, targetElement.nextSibling);
	            }
	        },
	        /**
	         * Optimize canvas pixel rate.
	         * @param {HTMLElement} canvas
	         * @param ctx
	         */
	
	        optimizeCanvasRatio: function (canvas, ctx) {
	            var ratio = u.devicePixelRatio;
	            if (!ratio) {
	                return;
	            }
	            var w = canvas.width,
	                h = canvas.height;
	            canvas.width = w * ratio;
	            canvas.height = h * ratio;
	            ctx.scale(ratio, ratio);
	            canvas.style.width = w + 'px';
	            canvas.style.height = h + 'px';
	        },
	        /**
	         * Make sure that element is a HTML element.
	         * @param {HTMLElement|string} elm - Html element or element id.
	         * @returns {HTMLElement}
	         */
	        ensureElement: function (elm) {
	            if (typeof(elm) === 'string') {
	                return document.getElementById(elm);
	            }
	            return elm;
	        },
	        /**
	         * Convert an iteratable object to array.
	         * @param iteratable
	         * @returns {Array}
	         */
	        toArray: function (iteratable) {
	            return Array.prototype.slice.call(iteratable, 0);
	        },
	        /**
	         * Copy a object.
	         * @param {object} src - Object to copy from.
	         * @param {object} dest - Object to copy to.
	         * @returns {object} - Destination object.
	         */
	        copy: function (src, dest) {
	            for (var key in src) {
	                if (src.hasOwnProperty(key)) {
	                    dest[key] = src[key];
	                }
	            }
	            return dest;
	        },
	        /**
	         * Get css texts
	         * @returns {string} css string.
	         */
	        getDocumentStyleString: function () {
	            var result = '';
	            var styleSheets = document.styleSheets;
	            for (var i = 0; i < styleSheets.length; i++) {
	                var rules = styleSheets[i].cssRules;
	                for (var j = 0; j < rules.length; j++) {
	                    result += rules[j].cssText + ' ';
	                }
	            }
	            return result;
	        },
	        /**
	         * Get style object.
	         * @param {HTMLElement} elm - The element.
	         * @returns {object} - Element styles.
	         */
	        getStyles: function (elm) {
	            var style = window.getComputedStyle(elm, ''),
	                result = {};
	            for (var i = 0, len = style.length; i < len; i++) {
	                var key = style[i],
	                    val = style.getPropertyValue(key);
	                if (val) {
	                    result[key] = val;
	                }
	            }
	            return result;
	        },
	        /**
	         * Get style string for a element.
	         * @param {HTMLElement} elm - The element.
	         * @returns {string} - Element style string.
	         */
	        getStyleString: function (elm) {
	            var styles = u.getStyles(elm);
	            return Object.keys(styles)
	                .map(function (key) {
	                    var val = styles[key];
	                    return [key, val].join(':');
	                })
	                .join(';');
	        },
	        /**
	         * Get offset from window.
	         * @param {HTMLElement} elm
	         * @returns {{top: number, left: number}}
	         */
	        offsetSum: function (elm) {
	            var top = 0, left = 0;
	            while (elm) {
	                top = top + parseInt(elm.offsetTop, 10);
	                left = left + parseInt(elm.offsetLeft, 10);
	                elm = elm.offsetParent;
	            }
	            return {top: top, left: left};
	        },
	        /**
	         * Get rating value.
	         * @param {number} min - Minimum value.
	         * @param {number} max - Maxmium value.
	         * @param {number} value - Value to rate.
	         * @returns {number} - Rate value (betewee 0 and 1).
	         */
	        rate: function (min, max, value) {
	            var range = max - min;
	            return (value - min ) / range;
	        },
	        /**
	         * Visible elm in window.
	         * @param {HTMLElement} elm
	         */
	        visibleRect: function (elm) {
	            var offset = u.offsetSum(elm),
	                w = elm.offsetWidth,
	                h = elm.offsetHeight;
	            var left = offset.left,
	                right = left + w,
	                top = offset.top,
	                bottom = top + h;
	            if (window.innerWidth < right) {
	                w = window.innerWidth - left;
	            }
	            if (window.innerHeight < bottom) {
	                h = window.innerHeight - top;
	            }
	            return {
	                left: left,
	                top: top,
	                width: w,
	                height: h
	            };
	        },
	        /**
	         * Center point for a element.
	         * @param {HTMLElement} elm
	         * @returns {{x: *, y: *}}
	         */
	        centerPoint: function (elm) {
	            var w = elm.offsetWidth,
	                h = elm.offsetHeight;
	            var offset = u.offsetSum(elm);
	            return {
	                x: offset.left + (w / 2),
	                y: offset.top + (h / 2)
	            };
	        },
	        /**
	         * Convert html to svg embeddable.
	         * @param {string} html - Html string.
	         * @returns {string} - Converted html string.
	         */
	        toSVGEmbeddableHtml: function (html) {
	            var workingDiv = document.createElement('div');
	            workingDiv.innerHTML = html;
	            var imgs = workingDiv.querySelectorAll('img');
	            for (var i = 0; i < imgs.length; i++) {
	                var img = imgs[i];
	                img.parentNode.removeChild(img);
	            }
	            return workingDiv.outerHTML.replace(/&nbsp;/g, '');
	        },
	        /**
	         * Convert an html to a image.
	         * @param {string} html -  Html string.
	         * @param {number} width - Render width.
	         * @param {number} height - Render height.
	         * @param {function} callback - Callback when done.
	         */
	        htmlToImage: function (html, width, height, callback) {
	            html = u.toSVGEmbeddableHtml(html);
	            var svgString = [
	                        '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">',
	                    '<foreignObject width="100%" height="100%">',
	                        '<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%">' + html + '</div>',
	                    '</foreignObject>' ,
	                    '</svg>'
	                ].join(''),
	                svg = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'}),
	                src = u.createObjectURL(svg),
	                image = new Image();
	            image.onload = function () {
	                callback(image);
	            };
	            image.onerror = function (err) {
	                console.error(err.stack || err);
	                console.log('Failed to create image from html:', html);
	                callback(null);
	            };
	            image.src = src;
	        },
	        /**
	         * Get min value.
	         * @param {number...} values - Values to compare.
	         */
	        min: function () {
	            return u.toArray(arguments)
	                .sort(function (a, b) {
	                    return a - b;
	                })[0];
	        },
	        /**
	         * Get a random int.
	         * @param {number} min - Min value.
	         * @param {number} max - Max value.
	         */
	        randomInt: function (min, max) {
	            var range = max - min;
	            return parseInt(min + range * Math.random());
	        },
	        hsv2rgb: function (h, s, v) {
	            //r, g, b means  red, blue, green, 0 ~ 255.
	            //a means alpha, 0.0 ~ 1.0
	            //h means hue, 0 ~ 360
	            //s, v means saturation, value of brgitness, 0 ~ 100
	            var rgb = (function (h, s, v) {
	                if (s == 0) return ({r: v, g: v, b: v});//gray
	                h = h % 360;
	                var i = Math.floor(h / 60);
	                var f = h / 60 - i;
	                v = v * 255 / 100;
	                var m = v * (1 - s / 100);
	                var n = v * (1 - s / 100 * f);
	                var k = v * (1 - s / 100 * (1 - f));
	                switch (i) {
	                    case 0:
	                        return {r: v, g: k, b: m};
	                    case 1:
	                        return {r: n, g: v, b: m};
	                    case 2:
	                        return {r: m, g: v, b: k};
	                    case 3:
	                        return {r: m, g: n, b: v};
	                    case 4:
	                        return {r: k, g: m, b: v};
	                    case 5:
	                        return {r: v, g: m, b: n};
	                }
	            })(h, s, v);
	            rgb.r = parseInt(rgb.r);
	            rgb.g = parseInt(rgb.g);
	            rgb.b = parseInt(rgb.b);
	            return rgb;
	        },
	        rgba2string: function (r, g, b, a) {
	            if (!a) a = 1;
	            return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
	        },
	        hsv2rgbaString: function (h, s, v) {
	            var rgba = this.hsv2rgb(h, s, v)
	            return this.rgba2string(rgba.r, rgba.g, rgba.b);
	        }
	    };
	
	    pr.utilities = u;
	
	})(window.parari = window.parari || {}, document);
    
    /**
	 * Constants for parari.
	 * @membrerof para
	 * @namespace constants
	 */
	(function (pr) {
	    "use strict";
	
	    var u = pr.utilities;
	
	    /**
	     * @lends para.constants
	     */
	    var c = {
	        PREFIX: 'pr'
	    };
	
	    pr.constants = c;
	
	
	})(window.parari = window.parari || {});
    
    /**
	 * Append prefix.
	 * @membrerof para
	 * @function prefixed
	 */
	(function (pr) {
	    "use strict";
	
	    var u = pr.utilities,
	        c = pr.constants;
	
	    /** @lends prefixed */
	    function prefixed(value) {
	        return [c.PREFIX, value].join('-');
	    }
	
	    pr.prefixed = prefixed;
	
	
	})(window.parari = window.parari || {});
    
    /**
	 * Parari object.
	 * @memberof parari
	 * @constructor Object
	 * @param {object} options
	 */
	(function (pr, document) {
	    "use strict";
	
	    var u = pr.utilities,
	        c = pr.constants;
	
	    /** @lends Object */
	    function PrObject(data) {
	        var s = this;
	        u.copy(data || {}, s);
	        s.invalidate();
	    }
	
	    PrObject.prototype = {
	        /**
	         * Load object data as image.
	         * @param {function} callback - Callback when done.
	         */
	        load: function (callback) {
	            var s = this;
	            u.htmlToImage(s.html, s.width, s.height, function (image) {
	                s.image = image;
	                s.invalidate();
	                if (callback) {
	                    callback(s);
	                }
	            });
	        },
	        /**
	         * Get left position.
	         * @returns {*}
	         */
	        getLeft: function () {
	            var s = this;
	            return s.x - s.width / 2;
	        },
	        /**
	         * Get right position.
	         * @returns {*}
	         */
	        getRight: function () {
	            var s = this;
	            return s.x + s.width / 2;
	        },
	        /**
	         * Get top position.
	         * @returns {*}
	         */
	        getTop: function () {
	            var s = this;
	            return s.y - s.height / 2;
	        },
	        /**
	         * Get bottom position.
	         * @returns {*}
	         */
	        getBottom: function () {
	            var s = this;
	            return s.y + s.height / 2;
	        },
	        dx: 0,
	        dy: 0,
	        /**
	         * Draw object.
	         * @param {CanvasRenderingContext2D} ctx
	         * @param {number} scrollX
	         * @param {number} scrollY
	         */
	        draw: function (ctx, scrollX, scrollY) {
	            var s = this;
	            if (!s.image) {
	                return;
	            }
	            var left = s.getLeft(),
	                top = s.getTop(),
	                speed = s.speed;
	
	            var dx = s.hLock ? 0 : s.dx * (1 - speed),
	                dy = s.vLock ? 0 : s.dy * (1 - speed);
	
	            var x = left - scrollX * speed - dx,
	                y = top - scrollY * speed - dy,
	                w = s.width,
	                h = s.height;
	
	            var valid = w > 0 && h > 0;
	            if (!valid) {
	                return;
	            }
	            var factor = s.factor(x, y);
	            ctx.drawImage(s.image, x, y, w, h);
	        },
	        /**
	         * Transform factor value.
	         * @param {number} x - X position.
	         * @param {number} y - Y position.
	         * @returns {number} - Factor value. -1 ~ +1.
	         */
	        factor: function (x, y) {
	            var s = this,
	                facor = s._factor(x, y);
	            return isNaN(facor) ? 0 : facor;
	        },
	        _factor: function (x, y) {
	            var s = this;
	            if (s.vLock) {
	                return u.rate(s.minX, s.maxX, x) * 2 - 1;
	            }
	            if (s.hLock) {
	                return u.rate(s.minY, s.maxY, y) * 2 - 1;
	            }
	            return 0;
	        },
	        /**
	         * Set object bounds.
	         * @param {number} minX - Minimum x vlaue.
	         * @param {number} minY - Minimum y value.
	         * @param {number} maxX - Maximum x value.
	         * @param {number} maxY - Maximum y value.
	         */
	        setBounds: function (minX, minY, maxX, maxY) {
	            var s = this;
	            s.minX = minX;
	            s.minY = minY;
	            s.maxX = maxX;
	            s.maxY = maxY;
	        },
	        /**
	         * Get bound object.
	         * @returns {object} - Boudns object.
	         */
	        getBounds: function () {
	            var s = this;
	            return {
	                minX: s.minX,
	                minY: s.minY,
	                maxX: s.maxX,
	                maxY: s.maxY,
	            }
	        },
	        /**
	         * Invalidate object rendering.
	         */
	        invalidate: function () {
	            var s = this,
	                elm = s.elm;
	            if (!elm) {
	                return;
	            }
	            var data = elm.dataset,
	                point = u.centerPoint(elm),
	                w = elm.offsetWidth,
	                h = elm.offsetHeight;
	            s.x = point.x;
	            s.y = point.y;
	            s.z = Number(data.prZ || 1);
	            s.speed = Number(data.prSpeed || 1);
	            s.width = w;
	            s.height = h;
	        },
	        /**
	         * Reload element.
	         */
	        reload: function (callback) {
	            var s = this;
	            s.html = PrObject.elmToHtml(s.elm, s.style);
	            s.load(callback);
	        }
	    };
	
	    PrObject.elmStyleString = function (elm) {
	        var styles = u.getStyles(elm);
	        return Object.keys(styles)
	            .filter(PrObject.elmStyleString._keyFilter)
	            .map(function (key) {
	                var val = styles[key];
	                return [key, val].join(':');
	            })
	            .join(';');
	    };
	
	    PrObject.elmStyleString._keyFilter = function (key) {
	        var _keys = PrObject.elmStyleString._keys;
	        for (var i = 0; i < _keys.length; i++) {
	            var valid = key.match(_keys[i]);
	            if (valid) {
	                return true;
	            }
	        }
	        return false;
	    }
	
	    PrObject.elmStyleString._keys = [
	        'height',
	        'width',
	        'left',
	        'top',
	        'color',
	        'position',
	        'opacity',
	        'float',
	        'justify-content',
	        'display',
	        'letter-spacing',
	        'font-size',
	        'font-style',
	        'vertical-align',
	        'line-height',
	        /^padding\-/,
	        /^margin\-/,
	        /^background\-/,
	        /^text\-/,
	        /^list\-/,
	        /^outline\-/,
	        /^justify\-/,
	        /^white\-/,
	        /^word\-/,
	    ];
	
	
	    /**
	     * Create html from elm.
	     * @param {HTMLElement} elm - Element to create form.
	     * @returns {string}
	     */
	    PrObject.elmToHtml = function (elm) {
	        var elmStyle = PrObject.elmStyleString(elm) || '';
	        return  [
	                '<div class="pr-object" style="' + elmStyle + '">',
	            elm.innerHTML,
	            '</div>'
	        ].join('');
	    };
	
	    /**
	     * Create a parari object from element.
	     * @param {HTMLElement} elm - Element to create form.
	     * @returns {PrObject}
	     */
	    PrObject.fromElement = function (elm) {
	        var elmStyle = u.getStyleString(elm);
	        var obj = new PrObject({
	            elm: elm,
	            html: PrObject.elmToHtml(elm)
	        });
	
	
	        u.toArray(elm.querySelectorAll('img')).forEach(function (img) {
	            img.onload = function () {
	                setTimeout(function () {
	                    if (obj.onPrImgLoad) {
	                        obj.onPrImgLoad(img);
	                    }
	                }, 100);
	            }
	        });
	
	        return  obj;
	    };
	
	    pr.Object = PrObject;
	
	})(window.parari = window.parari || {}, document);
    
    /**
	 * Create src element, which holds src markuped elements.
	 * @memberof parari
	 * @constructor Src
	 */
	(function (pr, document) {
	    "use strict";
	
	    var u = pr.utilities,
	        c = pr.constants;
	
	    /** @lends Src */
	    function Src(elm, style) {
	        var s = this;
	        s.style = style;
	        s.elm = elm;
	        s.elm.classList.add(Src._className);
	    }
	
	    Src.prototype = {
	        /**
	         * Find pr objects included in the src.
	         * @returns {*}
	         */
	        _findElements: function () {
	            var s = this,
	                selector = Src._objectSelector,
	                objects = s.elm.querySelectorAll(selector);
	            return u.toArray(objects);
	        },
	        /**
	         * Get parari objects.
	         * @param options
	         * @returns {*}
	         */
	        getObjects: function (options) {
	            var s = this;
	            return s._findElements().map(function (elm) {
	                var object = pr.Object.fromElement(elm);
	                u.copy(options || {}, object);
	                return object;
	            });
	        }
	    }
	
	    Src._objectSelector = '[data-' + pr.prefixed('object') + ']';
	    Src._className = pr.prefixed('src');
	
	    pr.Src = Src;
	
	})(window.parari = window.parari || {}, document);
    
    /**
	 * Screen element.
	 * @memberof parari
	 * @constructor Screen
	 */
	(function (pr, document) {
	    "use strict";
	
	    var u = pr.utilities;
	
	
	    /**
	     * @lends Screen
	     * @param {HTMLElement} canvas - Canvas element
	     */
	    function Screen(canvas) {
	        var s = this;
	        s.canvas = canvas;
	        s.objects = [];
	        s.wrapCanvas(s.canvas);
	    };
	
	    Screen.prototype = {
	        /**
	         * Wrap canvas element with screen div.
	         */
	        wrapCanvas: function (canvas) {
	            var div = document.createElement('div');
	            div.classList.add(Screen._className);
	            u.insertAfter(div, canvas);
	            div.appendChild(canvas);
	        },
	        /**
	         * Get canvas context.
	         * @returns {CanvasRenderingContext2D}
	         */
	        getContext: function () {
	            var s = this,
	                ctx = s._ctx;
	            if (!ctx) {
	                ctx = s._ctx = s.canvas.getContext('2d');
	            }
	            return ctx;
	        },
	
	        /**
	         * Load objects.
	         * @param {para.Object[]} objects - Objects to load.
	         * @param {function} callback - Callback when done.
	         */
	        loadObjects: function (objects, callback) {
	            var s = this;
	            var queue = [].concat(objects);
	            var object = queue.shift();
	            if (!object) {
	                callback(s);
	                return;
	            }
	            object.load(function () {
	                var center = u.centerPoint(s.canvas);
	                object.dx = object.x - center.x;
	                object.dy = object.y - center.y;
	                s.objects.push(object);
	                s.loadObjects(queue, callback);
	            });
	            object.onPrImgLoad = function (img) {
	                s.addImgElement(img);
	                s.redraw();
	            };
	        },
	        /**
	         * Resort objects.
	         */
	        resort: function () {
	            var s = this;
	            s.objects = s.objects.sort(function (a, b) {
	                return Number(a.z || 0) - Number(b.z || 0);
	            });
	        },
	        /**
	         * Add a image elemnt.
	         * @param img
	         */
	        addImgElement: function (img) {
	
	            var s = this,
	                obj = new pr.Object(img);
	            obj.image = img;
	            obj.z = 10;
	            obj.load = function (callback) {
	                var center = u.centerPoint(s.canvas);
	                obj.dx = obj.x - center.x;
	                obj.dy = obj.y - center.y;
	                s.objects.push(obj);
	                s.resort();
	                callback && callback(null);
	            };
	            obj.invalidate = function () {
	                var s = this;
	                s.offset = u.offsetSum(img);
	            };
	            obj.invalidate();
	            obj.draw = function (ctx, scrollX, scrollY) {
	                var s = this;
	                if (!s.image) {
	                    return;
	                }
	
	                var w = s.width || s.image.width,
	                    h = s.height || s.image.height;
	                var left = s.offset.left,
	                    top = s.offset.top;
	                var x = left - scrollX,
	                    y = top - scrollY;
	                ctx.drawImage(s.image, x, y, w, h);
	            }
	
	            obj.load(function () {
	                setTimeout(function () {
	                    s.invalidate();
	                    s.redraw();
	                }, 100);
	            });
	        },
	        /**
	         * Draw screen.
	         */
	        draw: function (scrollX, scrollY) {
	            var s = this,
	                ctx = s.getContext();
	            ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
	
	            for (var i = 0, len = s.objects.length; i < len; i++) {
	                s.objects[i].draw(ctx, scrollX, scrollY);
	            }
	        },
	        /**
	         * Set screen size.
	         * @param {number} w - Screen width.
	         * @param {number} h - Screen height.
	         */
	        size: function (w, h) {
	            var s = this;
	            s.canvas.width = w;
	            s.canvas.height = h;
	            u.optimizeCanvasRatio(s.canvas, s.getContext());
	            for (var i = 0; i < s.objects.length; i++) {
	                s.objects[i].setBounds(0, 0, w, h);
	            }
	            s.redraw();
	        },
	        /**
	         * Element to tell the scroll position.
	         */
	        scroller: null,
	        /**
	         * Element to toll the sieze.
	         */
	        sizer: null,
	        /**
	         * Redraw screen with scroller position.
	         */
	        redraw: function () {
	            var s = this,
	                x = s.scroller.scrollLeft,
	                y = s.scroller.scrollTop;
	            s.draw(x, y);
	        },
	        invalidate: function () {
	            var s = this;
	            for (var i = 0; i < s.objects.length; i++) {
	                var object = s.objects[i];
	                object && object.invalidate();
	            }
	        },
	        /**
	         * Resize screen with sizer size.
	         */
	        resize: function () {
	            var s = this,
	                rect = u.visibleRect(s.sizer),
	                w = rect.width,
	                h = rect.height;
	            s.size(w, h);
	            setTimeout(function () {
	                s.invalidate();
	                s.redraw();
	            }, 1);
	        }
	    };
	
	    Screen._className = pr.prefixed('screen');
	
	    pr.Screen = Screen;
	
	})(window.parari = window.parari || {}, document);
    
    /**
	 * Parari layers.
	 * @memberof parari
	 * @constructor layers
	 */
	(function (pr, document) {
	    "use strict";
	    pr.layers = {};
	})(window.parari = window.parari || {}, document);
    
    /**
	 * Parari layers.
	 * @memberof layers
	 * @constructor Layer
	 */
	(function (pr, document) {
	    "use strict";
	
	    var u = pr.utilities;
	
	    /** @lends Layer*/
	    function Layer() {
	
	    };
	
	    Layer.prototype = new pr.Object({});
	
	    u.copy(
	        /** @lends Layer.prototype */
	        {
	            load: function (callback) {
	                var s = this;
	                s.invalidate();
	                callback && callback(s);
	            },
	            /**
	             * Invalidate object rendering.
	             */
	            invalidate: function () {
	                var s = this;
	                s.x = (s.minX + s.maxX) / 2;
	                s.y = (s.minY + s.maxY) / 2;
	                s.width = s.maxX - s.minX;
	                s.height = s.maxY - s.minY;
	            },
	        },
	        Layer.prototype
	    )
	
	    pr.layers.Layer = Layer;
	
	
	})(window.parari = window.parari || {}, document);
    
    /**
	 * Parari object.
	 * @memberof layers
	 * @constructor NightSkyLayer
	 * @param {object} options
	 */
	(function (pr, document) {
	    "use strict";
	
	    var u = pr.utilities,
	        Layer = pr.layers.Layer;
	
	    /** @lends NightSkyLayer */
	    function NightSkyLayer(data) {
	        var s = this;
	        u.copy(data || {}, s);
	        s.invalidate();
	    };
	
	    NightSkyLayer.prototype = new Layer({});
	
	    u.copy(
	        /** @lends NightSkyLayer.prototype */
	        {
	            z: -10,
	            setBounds: function () {
	                var s = this;
	                Layer.prototype.setBounds.apply(s, arguments);
	                s.stars = NightSkyLayer.stars(s.getBounds());
	            },
	            reload: function (callback) {
	                var s = this;
	                s.stars = NightSkyLayer.stars(s.getBounds());
	                s.load(callback);
	            },
	            stars: [],
	            draw: function (ctx, scrollX, scrollY) {
	                var s = this,
	                    bounds = s.getBounds();
	                ctx.save();
	
	                for (var i = 0; i < s.stars.length; i++) {
	                    var star = s.stars[i];
	                    star.move(-scrollX, -scrollY, bounds);
	                    star.draw(ctx);
	                }
	                ctx.restore();
	            }
	        },
	        NightSkyLayer.prototype);
	
	    NightSkyLayer.numberStartsForBounds = function (bounds) {
	        var w = bounds.maxX - bounds.minX,
	            h = bounds.maxY - bounds.minY;
	        return w * h / 400;
	    };
	
	    NightSkyLayer.randomColor = function () {
	        var rgb = u.hsv2rgb(u.randomInt(0, 360), 10, 100);
	        return u.rgba2string(rgb.r, rgb.g, rgb.b, 0.8);
	    };
	
	    /**
	     * Create stars.
	     * @returns {Star[]} - Stars.
	     */
	    NightSkyLayer.stars = function (bounds) {
	        var count = NightSkyLayer.numberStartsForBounds(bounds);
	        var stars = [];
	        for (var i = 0; i < count; i++) {
	            var radius = Math.random(),
	                star = new Star({
	                        baseX: u.randomInt(bounds.minX, bounds.maxX),
	                        baseY: u.randomInt(bounds.minY, bounds.maxY),
	                        radius: radius,
	                        color: NightSkyLayer.randomColor(),
	                        speed: radius
	                    }
	                );
	            stars.push(star);
	        }
	        return stars;
	    };
	
	    /**
	     * @memberof NightSkyLayer
	     * @constructor Star
	     * @param {object} options
	     * @private
	     */
	    function Star(data) {
	        var s = this;
	        u.copy(data, s);
	    }
	
	    Star.prototype = {
	        radius: 1,
	        speed: 1,
	        baseX: 0,
	        baseY: 0,
	        x: 0,
	        y: 0,
	        color: '#FFF',
	        /**
	         * Change the coordinate.
	         * @param {number} dx
	         * @param {number} dy
	         * @param {object} bounds
	         */
	        move: function (dx, dy, bounds) {
	            var s = this;
	            s.x = (dx * s.speed + s.baseX) % bounds.maxX;
	            s.y = (dy * s.speed + s.baseY) % bounds.maxY;
	            if (s.x < bounds.minX) {
	                s.x += (bounds.maxX - bounds.minX);
	            }
	            if (s.y < bounds.minY) {
	                s.y += (bounds.maxY - bounds.minY);
	            }
	
	        },
	        /**
	         * Draw a star.
	         * @param ctx
	         */
	        draw: function (ctx) {
	            var s = this;
	            ctx.fillStyle = s.color;
	            ctx.beginPath();
	            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2, true);
	            ctx.closePath();
	            ctx.fill();
	        }
	    };
	
	
	    pr.layers.NightSkyLayer = NightSkyLayer;
	
	    pr.layers.NightSkyLayer.Star = Star;
	
	})
	(window.parari = window.parari || {}, document);
    
    /**
	 * Parari object.
	 * @memberof layers
	 * @constructor LightRaysLayer
	 * @param {object} options
	 */
	(function (pr, document) {
	    "use strict";
	
	    var u = pr.utilities,
	        Layer = pr.layers.Layer;
	
	    /** @lends LightRaysLayer */
	    function LightRaysLayer(data) {
	        var s = this;
	        u.copy(data || {}, s);
	        s.invalidate();
	    };
	
	    LightRaysLayer.prototype = new Layer({});
	
	    u.copy(
	        /** @lends LightRaysLayer.prototype */
	        {
	            z: -11,
	            setBounds: function () {
	                var s = this;
	                Layer.prototype.setBounds.apply(s, arguments);
	            },
	            reload: function (callback) {
	                var s = this;
	                s.load(callback);
	            },
	            draw: function (ctx, scrollX, scrollY) {
	                var s = this,
	                    bounds = s.getBounds();
	
	                var minX = bounds.minX,
	                    minY = bounds.minY,
	                    maxX = bounds.maxX,
	                    maxY = bounds.maxY;
	
	                ctx.save();
	
	                ctx.rect(minX, minY, maxX, maxY);
	
	                var x = scrollX % maxX, y = scrollY % maxY,
	                    factor = s.factor(x, y),
	                    radius = (maxY - minY) / 3,
	                    rx = radius * 0.8,
	                    ry = rx;
	
	                var gradient = ctx.createRadialGradient(rx, ry, radius, rx, ry, radius * (2 + Math.abs(factor)));
	
	                gradient.addColorStop(0, '#8ED6FF');
	                gradient.addColorStop(1, '#004CB3');
	
	                ctx.fillStyle = gradient;
	                ctx.fill();
	                ctx.restore();
	            }
	        },
	        LightRaysLayer.prototype);
	
	    pr.layers.LightRaysLayer = LightRaysLayer;
	})
	(window.parari = window.parari || {}, document);
    
    /**
	 * Start para.
	 * @function start
	 */
	
	(function (pr, document, window) {
	    "use strict";
	
	    var u = pr.utilities;
	
	    var layers = {
	        lightRays: pr.layers.LightRaysLayer,
	        nightSky: pr.layers.NightSkyLayer
	    };
	
	    /**
	     * @lends start
	     * @param {HTMLElement|string} root - Root element.
	     * @param {object} options - OPtional settings.
	     * @param {HTMLElement} [options.scroller=document.body] - Elemnt to scroll with.
	     * @param {Window|HTMLElement} - [options.sizer=window] - Element to size fit.
	     */
	    pr.start = function (root, options) {
	        root = u.ensureElement(root);
	        if (!root) {
	            throw new Error('Root not found: "' + root + '"');
	        }
	        options = options || {};
	
	        var canvas = document.createElement('canvas');
	        u.insertAfter(canvas, root);
	
	        var vLock = options.vLock,
	            hLock = options.hLock;
	
	        var style = u.getDocumentStyleString(),
	            src = new pr.Src(root, style),
	            objects = src.getObjects({
	                vLock: !!vLock,
	                hLock: !!hLock
	            }),
	            screen = new pr.Screen(canvas);
	
	        screen.scroller = options.scroller || {
	            _scrollValueForKey: function (key) {
	                return document.documentElement[key] || document.body[key];
	            },
	            get scrollLeft() {
	                var s = this;
	                return s._scrollValueForKey('scrollLeft');
	            },
	            get scrollTop() {
	                var s = this;
	                return s._scrollValueForKey('scrollTop');
	            }
	        };
	        screen.sizer = src.elm;
	
	
	        var redraw = screen.redraw.bind(screen),
	            resize = screen.resize.bind(screen);
	
	        window.addEventListener('scroll', redraw, false);
	        window.addEventListener('resize', resize, false);
	
	
	        Object.keys(options.layers || {})
	            .forEach(function (name) {
	                var Layer = layers[name] || pr.layers[name];
	                if (!Layer) {
	                    throw new Error('Unknwon layer: ' + name)
	                }
	                var option = options.layers[name];
	                u.copy({
	                    vLock: !!vLock,
	                    hLock: !!hLock
	                }, option);
	                var layer = new Layer(option);
	                objects.push(layer);
	            });
	
	
	        screen.loadObjects(objects, function () {
	            resize();
	            redraw();
	            canvas.classList.add(pr.prefixed('canvas-ready'));
	            screen.resort();
	        });
	
	
	        var onload = window.onload && window.onload.bind(window);
	        window.onload = function () {
	            resize();
	            screen.invalidate();
	            screen.redraw();
	            onload && onload();
	        }
	
	
	        resize();
	        redraw();
	    };
	
	})(window.parari = window.parari || {}, document, window);
    

    return parari;
})(window.parari = window.parari || {});



//=========================================
// Borrows marked.min.js
//=========================================

(function(){function e(e){this.tokens=[],this.tokens.links={},this.options=e||a.defaults,this.rules=p.normal,this.options.gfm&&(this.rules=this.options.tables?p.tables:p.gfm)}function t(e,t){if(this.options=t||a.defaults,this.links=e,this.rules=u.normal,this.renderer=this.options.renderer||new n,this.renderer.options=this.options,!this.links)throw new Error("Tokens array requires a `links` property.");this.options.gfm?this.rules=this.options.breaks?u.breaks:u.gfm:this.options.pedantic&&(this.rules=u.pedantic)}function n(e){this.options=e||{}}function r(e){this.tokens=[],this.token=null,this.options=e||a.defaults,this.options.renderer=this.options.renderer||new n,this.renderer=this.options.renderer,this.renderer.options=this.options}function s(e,t){return e.replace(t?/&/g:/&(?!#?\w+;)/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function i(e){return e.replace(/&([#\w]+);/g,function(e,t){return t=t.toLowerCase(),"colon"===t?":":"#"===t.charAt(0)?String.fromCharCode("x"===t.charAt(1)?parseInt(t.substring(2),16):+t.substring(1)):""})}function l(e,t){return e=e.source,t=t||"",function n(r,s){return r?(s=s.source||s,s=s.replace(/(^|[^\[])\^/g,"$1"),e=e.replace(r,s),n):new RegExp(e,t)}}function o(){}function h(e){for(var t,n,r=1;r<arguments.length;r++){t=arguments[r];for(n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e}function a(t,n,i){if(i||"function"==typeof n){i||(i=n,n=null),n=h({},a.defaults,n||{});var l,o,p=n.highlight,u=0;try{l=e.lex(t,n)}catch(c){return i(c)}o=l.length;var g=function(){var e,t;try{e=r.parse(l,n)}catch(s){t=s}return n.highlight=p,t?i(t):i(null,e)};if(!p||p.length<3)return g();if(delete n.highlight,!o)return g();for(;u<l.length;u++)!function(e){return"code"!==e.type?--o||g():p(e.text,e.lang,function(t,n){return null==n||n===e.text?--o||g():(e.text=n,e.escaped=!0,void(--o||g()))})}(l[u])}else try{return n&&(n=h({},a.defaults,n)),r.parse(e.lex(t,n),n)}catch(c){if(c.message+="\nPlease report this to https://github.com/chjj/marked.",(n||a.defaults).silent)return"<p>An error occured:</p><pre>"+s(c.message+"",!0)+"</pre>";throw c}}var p={newline:/^\n+/,code:/^( {4}[^\n]+\n*)+/,fences:o,hr:/^( *[-*_]){3,} *(?:\n+|$)/,heading:/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,nptable:o,lheading:/^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,blockquote:/^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,list:/^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,html:/^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,table:o,paragraph:/^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,text:/^[^\n]+/};p.bullet=/(?:[*+-]|\d+\.)/,p.item=/^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/,p.item=l(p.item,"gm")(/bull/g,p.bullet)(),p.list=l(p.list)(/bull/g,p.bullet)("hr","\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))")("def","\\n+(?="+p.def.source+")")(),p.blockquote=l(p.blockquote)("def",p.def)(),p._tag="(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b",p.html=l(p.html)("comment",/<!--[\s\S]*?-->/)("closed",/<(tag)[\s\S]+?<\/\1>/)("closing",/<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)(/tag/g,p._tag)(),p.paragraph=l(p.paragraph)("hr",p.hr)("heading",p.heading)("lheading",p.lheading)("blockquote",p.blockquote)("tag","<"+p._tag)("def",p.def)(),p.normal=h({},p),p.gfm=h({},p.normal,{fences:/^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,paragraph:/^/}),p.gfm.paragraph=l(p.paragraph)("(?!","(?!"+p.gfm.fences.source.replace("\\1","\\2")+"|"+p.list.source.replace("\\1","\\3")+"|")(),p.tables=h({},p.gfm,{nptable:/^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,table:/^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/}),e.rules=p,e.lex=function(t,n){var r=new e(n);return r.lex(t)},e.prototype.lex=function(e){return e=e.replace(/\r\n|\r/g,"\n").replace(/\t/g,"    ").replace(/\u00a0/g," ").replace(/\u2424/g,"\n"),this.token(e,!0)},e.prototype.token=function(e,t,n){for(var r,s,i,l,o,h,a,u,c,e=e.replace(/^ +$/gm,"");e;)if((i=this.rules.newline.exec(e))&&(e=e.substring(i[0].length),i[0].length>1&&this.tokens.push({type:"space"})),i=this.rules.code.exec(e))e=e.substring(i[0].length),i=i[0].replace(/^ {4}/gm,""),this.tokens.push({type:"code",text:this.options.pedantic?i:i.replace(/\n+$/,"")});else if(i=this.rules.fences.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"code",lang:i[2],text:i[3]});else if(i=this.rules.heading.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"heading",depth:i[1].length,text:i[2]});else if(t&&(i=this.rules.nptable.exec(e))){for(e=e.substring(i[0].length),h={type:"table",header:i[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:i[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:i[3].replace(/\n$/,"").split("\n")},u=0;u<h.align.length;u++)h.align[u]=/^ *-+: *$/.test(h.align[u])?"right":/^ *:-+: *$/.test(h.align[u])?"center":/^ *:-+ *$/.test(h.align[u])?"left":null;for(u=0;u<h.cells.length;u++)h.cells[u]=h.cells[u].split(/ *\| */);this.tokens.push(h)}else if(i=this.rules.lheading.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"heading",depth:"="===i[2]?1:2,text:i[1]});else if(i=this.rules.hr.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"hr"});else if(i=this.rules.blockquote.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"blockquote_start"}),i=i[0].replace(/^ *> ?/gm,""),this.token(i,t,!0),this.tokens.push({type:"blockquote_end"});else if(i=this.rules.list.exec(e)){for(e=e.substring(i[0].length),l=i[2],this.tokens.push({type:"list_start",ordered:l.length>1}),i=i[0].match(this.rules.item),r=!1,c=i.length,u=0;c>u;u++)h=i[u],a=h.length,h=h.replace(/^ *([*+-]|\d+\.) +/,""),~h.indexOf("\n ")&&(a-=h.length,h=this.options.pedantic?h.replace(/^ {1,4}/gm,""):h.replace(new RegExp("^ {1,"+a+"}","gm"),"")),this.options.smartLists&&u!==c-1&&(o=p.bullet.exec(i[u+1])[0],l===o||l.length>1&&o.length>1||(e=i.slice(u+1).join("\n")+e,u=c-1)),s=r||/\n\n(?!\s*$)/.test(h),u!==c-1&&(r="\n"===h.charAt(h.length-1),s||(s=r)),this.tokens.push({type:s?"loose_item_start":"list_item_start"}),this.token(h,!1,n),this.tokens.push({type:"list_item_end"});this.tokens.push({type:"list_end"})}else if(i=this.rules.html.exec(e))e=e.substring(i[0].length),this.tokens.push({type:this.options.sanitize?"paragraph":"html",pre:"pre"===i[1]||"script"===i[1]||"style"===i[1],text:i[0]});else if(!n&&t&&(i=this.rules.def.exec(e)))e=e.substring(i[0].length),this.tokens.links[i[1].toLowerCase()]={href:i[2],title:i[3]};else if(t&&(i=this.rules.table.exec(e))){for(e=e.substring(i[0].length),h={type:"table",header:i[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:i[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:i[3].replace(/(?: *\| *)?\n$/,"").split("\n")},u=0;u<h.align.length;u++)h.align[u]=/^ *-+: *$/.test(h.align[u])?"right":/^ *:-+: *$/.test(h.align[u])?"center":/^ *:-+ *$/.test(h.align[u])?"left":null;for(u=0;u<h.cells.length;u++)h.cells[u]=h.cells[u].replace(/^ *\| *| *\| *$/g,"").split(/ *\| */);this.tokens.push(h)}else if(t&&(i=this.rules.paragraph.exec(e)))e=e.substring(i[0].length),this.tokens.push({type:"paragraph",text:"\n"===i[1].charAt(i[1].length-1)?i[1].slice(0,-1):i[1]});else if(i=this.rules.text.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"text",text:i[0]});else if(e)throw new Error("Infinite loop on byte: "+e.charCodeAt(0));return this.tokens};var u={escape:/^\\([\\`*{}\[\]()#+\-.!_>])/,autolink:/^<([^ >]+(@|:\/)[^ >]+)>/,url:o,tag:/^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,link:/^!?\[(inside)\]\(href\)/,reflink:/^!?\[(inside)\]\s*\[([^\]]*)\]/,nolink:/^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,strong:/^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,em:/^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,code:/^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,br:/^ {2,}\n(?!\s*$)/,del:o,text:/^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/};u._inside=/(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/,u._href=/\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/,u.link=l(u.link)("inside",u._inside)("href",u._href)(),u.reflink=l(u.reflink)("inside",u._inside)(),u.normal=h({},u),u.pedantic=h({},u.normal,{strong:/^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,em:/^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/}),u.gfm=h({},u.normal,{escape:l(u.escape)("])","~|])")(),url:/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,del:/^~~(?=\S)([\s\S]*?\S)~~/,text:l(u.text)("]|","~]|")("|","|https?://|")()}),u.breaks=h({},u.gfm,{br:l(u.br)("{2,}","*")(),text:l(u.gfm.text)("{2,}","*")()}),t.rules=u,t.output=function(e,n,r){var s=new t(n,r);return s.output(e)},t.prototype.output=function(e){for(var t,n,r,i,l="";e;)if(i=this.rules.escape.exec(e))e=e.substring(i[0].length),l+=i[1];else if(i=this.rules.autolink.exec(e))e=e.substring(i[0].length),"@"===i[2]?(n=this.mangle(":"===i[1].charAt(6)?i[1].substring(7):i[1]),r=this.mangle("mailto:")+n):(n=s(i[1]),r=n),l+=this.renderer.link(r,null,n);else if(this.inLink||!(i=this.rules.url.exec(e))){if(i=this.rules.tag.exec(e))!this.inLink&&/^<a /i.test(i[0])?this.inLink=!0:this.inLink&&/^<\/a>/i.test(i[0])&&(this.inLink=!1),e=e.substring(i[0].length),l+=this.options.sanitize?s(i[0]):i[0];else if(i=this.rules.link.exec(e))e=e.substring(i[0].length),this.inLink=!0,l+=this.outputLink(i,{href:i[2],title:i[3]}),this.inLink=!1;else if((i=this.rules.reflink.exec(e))||(i=this.rules.nolink.exec(e))){if(e=e.substring(i[0].length),t=(i[2]||i[1]).replace(/\s+/g," "),t=this.links[t.toLowerCase()],!t||!t.href){l+=i[0].charAt(0),e=i[0].substring(1)+e;continue}this.inLink=!0,l+=this.outputLink(i,t),this.inLink=!1}else if(i=this.rules.strong.exec(e))e=e.substring(i[0].length),l+=this.renderer.strong(this.output(i[2]||i[1]));else if(i=this.rules.em.exec(e))e=e.substring(i[0].length),l+=this.renderer.em(this.output(i[2]||i[1]));else if(i=this.rules.code.exec(e))e=e.substring(i[0].length),l+=this.renderer.codespan(s(i[2],!0));else if(i=this.rules.br.exec(e))e=e.substring(i[0].length),l+=this.renderer.br();else if(i=this.rules.del.exec(e))e=e.substring(i[0].length),l+=this.renderer.del(this.output(i[1]));else if(i=this.rules.text.exec(e))e=e.substring(i[0].length),l+=s(this.smartypants(i[0]));else if(e)throw new Error("Infinite loop on byte: "+e.charCodeAt(0))}else e=e.substring(i[0].length),n=s(i[1]),r=n,l+=this.renderer.link(r,null,n);return l},t.prototype.outputLink=function(e,t){var n=s(t.href),r=t.title?s(t.title):null;return"!"!==e[0].charAt(0)?this.renderer.link(n,r,this.output(e[1])):this.renderer.image(n,r,s(e[1]))},t.prototype.smartypants=function(e){return this.options.smartypants?e.replace(/--/g,"—").replace(/(^|[-\u2014/(\[{"\s])'/g,"$1‘").replace(/'/g,"’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g,"$1“").replace(/"/g,"”").replace(/\.{3}/g,"…"):e},t.prototype.mangle=function(e){for(var t,n="",r=e.length,s=0;r>s;s++)t=e.charCodeAt(s),Math.random()>.5&&(t="x"+t.toString(16)),n+="&#"+t+";";return n},n.prototype.code=function(e,t,n){if(this.options.highlight){var r=this.options.highlight(e,t);null!=r&&r!==e&&(n=!0,e=r)}return t?'<pre><code class="'+this.options.langPrefix+s(t,!0)+'">'+(n?e:s(e,!0))+"\n</code></pre>\n":"<pre><code>"+(n?e:s(e,!0))+"\n</code></pre>"},n.prototype.blockquote=function(e){return"<blockquote>\n"+e+"</blockquote>\n"},n.prototype.html=function(e){return e},n.prototype.heading=function(e,t,n){return"<h"+t+' id="'+this.options.headerPrefix+n.toLowerCase().replace(/[^\w]+/g,"-")+'">'+e+"</h"+t+">\n"},n.prototype.hr=function(){return this.options.xhtml?"<hr/>\n":"<hr>\n"},n.prototype.list=function(e,t){var n=t?"ol":"ul";return"<"+n+">\n"+e+"</"+n+">\n"},n.prototype.listitem=function(e){return"<li>"+e+"</li>\n"},n.prototype.paragraph=function(e){return"<p>"+e+"</p>\n"},n.prototype.table=function(e,t){return"<table>\n<thead>\n"+e+"</thead>\n<tbody>\n"+t+"</tbody>\n</table>\n"},n.prototype.tablerow=function(e){return"<tr>\n"+e+"</tr>\n"},n.prototype.tablecell=function(e,t){var n=t.header?"th":"td",r=t.align?"<"+n+' style="text-align:'+t.align+'">':"<"+n+">";return r+e+"</"+n+">\n"},n.prototype.strong=function(e){return"<strong>"+e+"</strong>"},n.prototype.em=function(e){return"<em>"+e+"</em>"},n.prototype.codespan=function(e){return"<code>"+e+"</code>"},n.prototype.br=function(){return this.options.xhtml?"<br/>":"<br>"},n.prototype.del=function(e){return"<del>"+e+"</del>"},n.prototype.link=function(e,t,n){if(this.options.sanitize){try{var r=decodeURIComponent(i(e)).replace(/[^\w:]/g,"").toLowerCase()}catch(s){return""}if(0===r.indexOf("javascript:"))return""}var l='<a href="'+e+'"';return t&&(l+=' title="'+t+'"'),l+=">"+n+"</a>"},n.prototype.image=function(e,t,n){var r='<img src="'+e+'" alt="'+n+'"';return t&&(r+=' title="'+t+'"'),r+=this.options.xhtml?"/>":">"},r.parse=function(e,t,n){var s=new r(t,n);return s.parse(e)},r.prototype.parse=function(e){this.inline=new t(e.links,this.options,this.renderer),this.tokens=e.reverse();for(var n="";this.next();)n+=this.tok();return n},r.prototype.next=function(){return this.token=this.tokens.pop()},r.prototype.peek=function(){return this.tokens[this.tokens.length-1]||0},r.prototype.parseText=function(){for(var e=this.token.text;"text"===this.peek().type;)e+="\n"+this.next().text;return this.inline.output(e)},r.prototype.tok=function(){switch(this.token.type){case"space":return"";case"hr":return this.renderer.hr();case"heading":return this.renderer.heading(this.inline.output(this.token.text),this.token.depth,this.token.text);case"code":return this.renderer.code(this.token.text,this.token.lang,this.token.escaped);case"table":var e,t,n,r,s,i="",l="";for(n="",e=0;e<this.token.header.length;e++)r={header:!0,align:this.token.align[e]},n+=this.renderer.tablecell(this.inline.output(this.token.header[e]),{header:!0,align:this.token.align[e]});for(i+=this.renderer.tablerow(n),e=0;e<this.token.cells.length;e++){for(t=this.token.cells[e],n="",s=0;s<t.length;s++)n+=this.renderer.tablecell(this.inline.output(t[s]),{header:!1,align:this.token.align[s]});l+=this.renderer.tablerow(n)}return this.renderer.table(i,l);case"blockquote_start":for(var l="";"blockquote_end"!==this.next().type;)l+=this.tok();return this.renderer.blockquote(l);case"list_start":for(var l="",o=this.token.ordered;"list_end"!==this.next().type;)l+=this.tok();return this.renderer.list(l,o);case"list_item_start":for(var l="";"list_item_end"!==this.next().type;)l+="text"===this.token.type?this.parseText():this.tok();return this.renderer.listitem(l);case"loose_item_start":for(var l="";"list_item_end"!==this.next().type;)l+=this.tok();return this.renderer.listitem(l);case"html":var h=this.token.pre||this.options.pedantic?this.token.text:this.inline.output(this.token.text);return this.renderer.html(h);case"paragraph":return this.renderer.paragraph(this.inline.output(this.token.text));case"text":return this.renderer.paragraph(this.parseText())}},o.exec=o,a.options=a.setOptions=function(e){return h(a.defaults,e),a},a.defaults={gfm:!0,tables:!0,breaks:!1,pedantic:!1,sanitize:!1,smartLists:!1,silent:!1,highlight:null,langPrefix:"lang-",smartypants:!1,headerPrefix:"",renderer:new n,xhtml:!1},a.Parser=r,a.parser=r.parse,a.Renderer=n,a.Lexer=e,a.lexer=e.lex,a.InlineLexer=t,a.inlineLexer=t.output,a.parse=a,"object"==typeof exports?module.exports=a:"function"==typeof define&&define.amd?define(function(){return a}):this.marked=a}).call(function(){return this||("undefined"!=typeof window?window:global)}());
;

