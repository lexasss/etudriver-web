// Logging utils

(function (root) {

    'use strict';

    var Logger = {

        log: function (...args) {
            if (args.length > 1 && typeof args[0] === 'symbol') {
                var type = args[0];
                args = args.slice(1);
                
                if (type === this.Type['error']) {
                    console.error(header, 'ERROR: ', ...args);
                    return true;
                }
                
                if (type === this.Type['info']) {
                    console.info(header, ...args);
                    return true;
                }
            }

            if (level === this.Level.debug) {
                console.log(header, ...args);
                return true;
            }

            return false;
        },

        level: function (_level) {
            if (_level !== undefined) {
                level = _level;
            }
            else {
                return level;
            }
        },

        header: function (_header) {
            if (_header !== undefined) {
                header = _header;
            }
            else {
                return header;
            }
        },

        Level: {
            silent: 'silent',
            info: 'info',
            debug: 'debug'
        },

        Type: {
            info: Symbol('info'),       // default
            debug: Symbol('debug'),
            error: Symbol('error')
        }
    };

    // internal
    var level = Logger.Level.silent;
    var header = '[GT/R]  ';

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Logger = Logger;

})(window);