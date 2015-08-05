// FullScreen API

(function (root) {

    'use strict';

    function FullScreen() {}

    FullScreen.prototype.request = function (elem) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    };

    FullScreen.prototype.exit = function () {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            // This is a hack, as mozCancelFullScreen 
            // does not work if the action was not initiated by user
            var elem = document.mozFullScreenElement;
            var elemParent = elem.parentNode;
            elemParent.removeChild(elem);
            elemParent.appendChild(elem);
            //document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };

    Object.defineProperty(FullScreen.prototype, 'isActive', {
        get: function() {
            return document.fullscreenElement ||
               (document.mozFullScreenElement || window.fullScreen) ||
                document.webkitFullscreenElement || 
                document.msFullscreenElement;
        }
    });

    FullScreen.prototype.addEventListener = function (event, callback) {
        var fs = 'fullscreen';
        var titlize = function (s) { 
            return Array.prototype.map.apply(s, [function(c,i,a) {return i === 0 ? c.toUpperCase() : c; }]).join('');
        };
        document.addEventListener(fs + event, callback);
        document.addEventListener('webkit' + fs + event, callback);
        document.addEventListener('moz' + fs + event, callback);
        document.addEventListener('MS' + titlize(fs) + titlize(event), callback);
    };


    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.FullScreen = FullScreen;

})(window);