(function (root) {

    'use strict';

    var Utils = {};
    
    // Debugging
    var logDebug = true;
    var logException = true;

    Utils.debug = function () {
        var text = Array.prototype.join.call(arguments, ': ');
        console.log(text);
    };

    Utils.exception = function () {
        var text = Array.prototype.join.call(arguments, ': ');
        console.error(text);
    };

    // Storage
    var storageAccessible = function () {
        var result = true;
        try {
            result = !!localStorage;
        } catch (ex) {
            result = false;
        }
        return result;
    };

    Utils.getStoredValue = function (entry) {
        var result = entry.default;
        if (storageAccessible()) {
            result = localStorage[entry.id] || result;
        }
        return result;
    };

    Utils.store = function (entry, value) {
        if (storageAccessible()) {
            localStorage[entry.id] = value;
        }
    };

    // Other
    var zoom = {x: 1.0, y: 1.0};
    var offset = {x: 0, y: 0};

    Utils.updatePixelConverter = function () {

        if (typeof devicePixelRatio === 'undefined') {    // old Firefox

            var zoomLevel = (function (precision) {
                var cycles = 0;
                var searchZoomLevel = function (level, min, divisor) {
                    var wmq = window.matchMedia;
                    while (level >= min && !wmq('(min-resolution: ' + (level / divisor) + 'dppx)').matches) {
                        level -= 1;
                        cycles += 1;
                    }
                    return level;
                };

                var maxSearchLevel = 5.0;
                var minSearchLevel = 0.1;
                var divisor = 1;
                var result;
                var i;
                for (i = 0; i < precision; i += 1) {
                    result = 10 * searchZoomLevel(maxSearchLevel, minSearchLevel, divisor);
                    maxSearchLevel = result + 9;
                    minSearchLevel = result;
                    divisor *= 10;
                }

                //debug('updatePixelConverter', 'zoom = ' + (result / divisor) + ', calculated in ' + cycles + ' cycles');
                return result / divisor;
            })(5);

            zoom = {
                x: zoomLevel,
                y: zoomLevel
            };
        } 
        else {    // Chrome, new Firefox
            zoom = {
                x: devicePixelRatio,
                y: devicePixelRatio
            };
        }

        if (window.mozInnerScreenX) {   // Firefox
            offset = {
                x: window.mozInnerScreenX * zoom.x,
                y: window.mozInnerScreenY * zoom.y
            };
        } 
        else {  // Chrome
            var innerWidth = window.innerWidth * zoom.x;
            var innerHeight = window.innerHeight * zoom.y;

            offset = {
                x: window.screenX + (window.outerWidth - innerWidth) / 2,
                y: window.screenY + (window.outerHeight - innerHeight) - (window.outerWidth - innerWidth) / 2
            };
        }
    };

    Utils.screenToClient = function (x, y) {
        return {
            x: (x - offset.x) / zoom.x,
            y: (y - offset.y) / zoom.y
        };
    };

    Utils.clientToScreen = function (x, y) {
        return {
            x: x * zoom.x + offset.x,
            y: y * zoom.x + offset.y
        };
    };

    Utils.getScreenSize = function () {
        var result;
        if (window.mozInnerScreenX) {
            result = {
                width: Math.round(screen.width * zoom.x), 
                height: Math.round(screen.height * zoom.y)
            };
        }
        else {
            result = {width: screen.width, height: screen.height};
        }
        return result;
    };

    Utils.getRandomInt = function () {
        var min = arguments.length > 1 ? arguments[0] : 0;
        var max = arguments.length > 0 ? arguments[arguments.length - 1] : 0xFFFFFFFF; // 32-bit value
        return Math.floor(Math.random() * (max - min + 0.99999)) + min;
    };

    Utils.clone = function (obj) {
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (obj === null || obj === undefined || typeof obj !== 'object') {
            return obj;
        }
        
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = Utils.clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = obj.constructor();
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    if (obj[attr] === obj) {    // recursion handing
                        copy[attr] = copy;
                    } else {
                        copy[attr] = Utils.clone(obj[attr]);
                    }
                }
            }
            return copy;
        }
        
        return undefined;
    };

    // Imported
    /*! Modified 'detectDir' from
     * jscolor, JavaScript Color Picker v1.3.13, by Jan Odvarko, http://odvarko.cz
     */
    Utils.detectPath = function (_re) {
        var URI = function (uri) { // See RFC3986

            this.scheme = null;
            this.authority = null;
            this.path = '';
            this.query = null;
            this.fragment = null;

            this.parse = function(uri) {
                var m = uri.match(/^(([A-Za-z][0-9A-Za-z+.-]*)(:))?((\/\/)([^\/?#]*))?([^?#]*)((\?)([^#]*))?((#)(.*))?/);
                this.scheme = m[3] ? m[2] : null;
                this.authority = m[5] ? m[6] : null;
                this.path = m[7];
                this.query = m[9] ? m[10] : null;
                this.fragment = m[12] ? m[13] : null;
                return this;
            };

            this.toString = function() {
                var result = '';
                if (this.scheme !== null) { result = result + this.scheme + ':'; }
                if (this.authority !== null) { result = result + '//' + this.authority; }
                if (this.path !== null) { result = result + this.path; }
                if (this.query !== null) { result = result + '?' + this.query; }
                if (this.fragment !== null) { result = result + '#' + this.fragment; }
                return result;
            };

            this.toAbsolute = function (base) {
                base = new URI(base);
                var r = this;
                var t = new URI();

                if(base.scheme === null) { return false; }

                if(r.scheme !== null && r.scheme.toLowerCase() === base.scheme.toLowerCase()) {
                    r.scheme = null;
                }

                if(r.scheme !== null) {
                    t.scheme = r.scheme;
                    t.authority = r.authority;
                    t.path = removeDotSegments(r.path);
                    t.query = r.query;
                } else {
                    if(r.authority !== null) {
                        t.authority = r.authority;
                        t.path = removeDotSegments(r.path);
                        t.query = r.query;
                    } else {
                        if(r.path === '') { 
                            t.path = base.path;
                            if(r.query !== null) {
                                t.query = r.query;
                            } else {
                                t.query = base.query;
                            }
                        } else {
                            if(r.path.substr(0,1) === '/') {
                                t.path = removeDotSegments(r.path);
                            } else {
                                if(base.authority !== null && base.path === '') { 
                                    t.path = '/'+r.path;
                                } else {
                                    t.path = base.path.replace(/[^\/]+$/,'')+r.path;
                                }
                                t.path = removeDotSegments(t.path);
                            }
                            t.query = r.query;
                        }
                        t.authority = base.authority;
                    }
                    t.scheme = base.scheme;
                }
                t.fragment = r.fragment;

                return t;
            };

            function removeDotSegments(path) {
                var out = '';
                while(path) {
                    if(path.substr(0,3)==='../' || path.substr(0,2)==='./') {
                        path = path.replace(/^\.+/,'').substr(1);
                    } else if(path.substr(0,3)==='/./' || path==='/.') {
                        path = '/'+path.substr(3);
                    } else if(path.substr(0,4)==='/../' || path==='/..') {
                        path = '/'+path.substr(4);
                        out = out.replace(/\/?[^\/]*$/, '');
                    } else if(path==='.' || path==='..') {
                        path = '';
                    } else {
                        var rm = path.match(/^\/?[^\/]*/)[0];
                        path = path.substr(rm.length);
                        out = out + rm;
                    }
                }
                return out;
            }

            if(uri) {
                this.parse(uri);
            }

        };

        var i;
        var base = location.href;

        var e = document.getElementsByTagName('base');
        for (i = 0; i < e.length; i += 1) {
            if (e[i].href) { 
                base = e[i].href; 
            }
        }

        var re = _re || /(^|\/)gazeTargets(-(\d+)\.(\d+)\.(\d+))?\.js([?#].*)?$/i;
        e = document.getElementsByTagName('script');
        for (i = 0; i < e.length; i += 1) {
            if (e[i].src) { // && re.test(e[i].src))
                var m = re.exec(e[i].src);
                if (m) {
                    var src = new URI(e[i].src);
                    var srcAbs = src.toAbsolute(base);
                    srcAbs.path = srcAbs.path.replace(/[^\/]+$/, ''); 
                    srcAbs.query = null;
                    srcAbs.fragment = null;
                    return {
                        path: srcAbs.toString(),
                        version: typeof m[2] !== 'undefined' ? m[3] + '.' + m[4] + '.' + m[5] : ''
                    };
                }
            }
        }
        return false;
    };

    /*! Modified 'extend' from
     * jQuery JavaScript Library v2.0.3, by jQuery Foundation, Inc. and other contributors, http://jquery.com/
     */
    Utils.extend = function() {
        var isPlainObject = function( obj ) {
            if ( typeof obj !== 'object' || obj.nodeType || obj === obj.window ) {
                return false;
            }

            return true;
        };
        
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false,
            onlyIfUndefined = false;

        // Handle a deep copy situation
        if ( typeof target === 'boolean' ) {
            deep = target;
            target = arguments[i] || {};
            // skip the boolean and the target
            i += 1;
        }

        if ( typeof target === 'boolean' ) {
            onlyIfUndefined = target;
            target = arguments[i] || {};
            i += 1;
        
        }
        // Handle case when target is a string or something (possible in deep copy)
        if ( typeof target !== 'object' && typeof target !== 'function' ) {
            
            target = {};
        }

        if ( length === i ) {
            return target;
        }

        for ( ; i < length; i += 1 ) {
            // Only deal with non-null/undefined values
            if ( (options = arguments[ i ]) != null ) {
                // Extend the base object
                for ( name in options ) {
                    src = target[ name ];
                    copy = options[ name ];

                    // Prevent never-ending loop
                    if ( target === copy ) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            clone = src && Array.isArray(src) ? src : [];

                        } else {
                            clone = src && isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[ name ] = Utils.extend( deep, clone, copy );

                    // Don't bring in undefined values
                    } else if ( copy !== undefined ) {
                        if (!onlyIfUndefined || target[ name ] === undefined) {
                            target[ name ] = copy;
                        }
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };

    // In some cases, a boolean setting may appear rather as a function that returns a boolean value, 
    // than just a boolean value itself
    Utils.bool = function (value) {
        var type = typeof value;
        if (type === 'function') {
            return value();
        } else if (value instanceof Array) {
            return value.length > 0;
        } else if (type === 'object') {
            for (var prop in value) {
                return true;
            }
            return false;
        }
        return !!value;
    };

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Utils = Utils;

})(window);