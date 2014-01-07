var logDebug = true;
var logException = true;

var debug = function (name, message) {
    console.log(name + ': ' + message);
}

var exception = function (name, message) {
    console.error(name + ': ' + message);
}

var storageAccessible = function () {
    var result = true;
    try {
        result = !!localStorage;
    } catch (ex) {
        result = false;
    }
    return result;
};

/*! Modified 'detectDir' from
 * jscolor, JavaScript Color Picker v1.3.13, by Jan Odvarko, http://odvarko.cz
 */
var detectPath = function () {
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

    var re = /(^|\/)etudriver(-(\d+)\.(\d+)\.(\d+))?\.js([?#].*)?$/i;
    e = document.getElementsByTagName('script');
    for (i = 0; i < e.length; i += 1) {
        if (e[i].src) { // && re.test(e[i].src))
            var m = re.exec(e[i].src)
            if (m) {
                var src = new URI(e[i].src);
                var srcAbs = src.toAbsolute(base);
                srcAbs.path = srcAbs.path.replace(/[^\/]+$/, ''); 
                srcAbs.query = null;
                srcAbs.fragment = null;
                return {
                    path: srcAbs.toString(),
                    version: typeof m[2] !== 'undefined' ? m[3] + '.' + m[4] + '.' + m[5] : ''
                }
            }
        }
    }
    return false;
};

/*! Modified 'extend' from
 * jQuery JavaScript Library v2.0.3, by jQuery Foundation, Inc. and other contributors, http://jquery.com/
 */
var extend = function() {
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
                    target[ name ] = extend( deep, clone, copy );

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

// In some functions, the boolean arguments may appear as not just a boolean value, 
// but as a function that returns a boolean value
var bool = function (value) {
    if (typeof value === 'function') {
        return value();
    }
    return !!value;
};