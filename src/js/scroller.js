(function (root) {

    'use strict';

    function Scroller (settings) {

        // Public methods

        // Initializes the panel and enables scrolling
        this.init = function () {
            enabled = true;
        };
        
        // Feeds eye-camera coordinates to detect scrolling actions
        // Params:
        //  - ec: eye-camera coordinates
        this.feed = function (ec) {
            if (settings.controller !== GazeTargets.scroller.controllers.headPose) {
                return;
            }

            if (!ref) {
                ref = getAvg(ec);
            }
            
            var pt = getAvg(ec);
            var dy = pt.y - ref.y;

            if (Math.abs(dy) >= settings.headPose.threshold) {
                headPose.speed = (Math.abs(dy) - settings.headPose.threshold) * 
                    (dy < 0 ? -1 : 1) * settings.headPose.transformParam;
                if (!headPose.timer) {
                    headPose.timer = setInterval(function () {
                        if (!enabled) {
                            clearInterval(headPose.timer);
                            headPose.timer = null;
                            return;
                        }
                        
                        if (headPose.speed) {
                            scrollBy(0, headPose.speed);
                        }
                    }, 20);
                }
            } else {
                headPose.speed = 0;
                if (headPose.timer) {
                    clearInterval(headPose.timer);
                    headPose.timer = null;
                }
            }
        };
        
        // Reset the scroller state and disables scrolling
        this.reset = function () {
            enabled = false;
            ref = null;
            headPose.speed = 0;
            if (headPose.timer) {
                clearInterval(headPose.timer);
                headPose.timer = null;
            }
            if (buttonInFocus) {
                fadeOut(buttonInFocus);
            }
        };

        // Internal 
        
        var enabled = false;
        var ref = null;
        var buttons = [];
        var buttonInFocus = null;
        var headPose = {
            speed: 0,
            timer: null
        };
        
        var fadeIn = function (element) {
            element.classList.remove('gt-animation');
            element.classList.remove('gt-animated-fadeOutHalf');
            element.classList.add(settings.className + '-keyOpaque');
            element.classList.add('gt-animated-fadeInHalf');
            element.classList.add('gt-animated');
            buttonInFocus = element;
        };
        
        var fadeOut = function (element) {
            element.classList.remove(settings.className + '-keyOpaque');
            element.classList.remove('gt-animation');
            element.classList.remove('gt-animated-fadeInHalf');
            element.classList.add('gt-animated-fadeOutHalf');
            element.classList.add('gt-animated');
            buttonInFocus = null;
        };
        
        var onKeySelected = function () {
            if (this.scroller.timer) {
                return;
            }
            
            var speed = this.scroller.speed;
            var direction  = this.scroller.direction;
            var that = this;
            this.scroller.timer = setInterval(function () {
                if (!enabled) {
                    clearInterval(that.scroller.timer);
                    that.scroller.timer = null;
                    fadeOut(that);
                    return;
                }
                
                if (speed > 0) {
                    scrollBy(0, speed * direction);
                } else if (speed < 0) {
                    scrollBy(0, Math.round(window.innerHeight * 0.9 * direction));
                }
            }, speed > 0 ? 20 : 1000);
        };
        
        var onKeyFocused = function () {
            fadeIn(this);
        };
        
        var onKeyLeft = function () {
            if (this.scroller.timer) {
                clearInterval(this.scroller.timer);
                this.scroller.timer = null;
            }
            fadeOut(this);
        };
        
        var createCells = function (container, isScrollingUp) {
            var row = container.insertRow(-1);
            for (var i = 0; i < settings.speeds.length; i += 1) {
                var speed = settings.speeds[i];
                
                var btn = document.createElement('div');
                btn.className = settings.className + '-key';
                
                var imgDir = isScrollingUp ? 'Up' : 'Down';
                var img = '';
                if (speed > 0) {
                    img = 'smooth' + imgDir;
                    btn.classList.add(settings.className + '-smooth');
                }
                else if (speed < 0) {
                    img = 'page' + imgDir;
                    btn.classList.add(settings.className + '-page');
                }
                if (img) {
                    btn.style.backgroundImage = 'url(\'' + settings.imageFolder + img + '.png\')';
                }
                
                btn.scroller = {
                    speed: speed,
                    direction: isScrollingUp ? -1 : 1,
                    timer: null
                };
                
                btn.addEventListener(root.GazeTargets.events.selected, onKeySelected);
                btn.addEventListener(root.GazeTargets.events.focused, onKeyFocused);
                btn.addEventListener(root.GazeTargets.events.left, onKeyLeft);
                
                var cell = row.insertCell(-1);
                cell.appendChild(btn);

                buttons.push(btn);
            }
        };
        
        var createContainer = function (isUpper) {
            var container = document.createElement('table');
            container.className = settings.className;
            container.classList.add(settings.className + (isUpper ? '-upper' : '-lower'));
            createCells(container, isUpper);
            
            document.body.appendChild(container);
        };
        
        var getAvg = function (ec) {
            var eyeCount = 0;
            var ecx = 0.0,
                ecy = 0.0;
            if (ec.xl) {
                ecx += ec.xl;
                ecy += ec.yl;
                eyeCount += 1;
            }
            if (ec.xr) {
                ecx += ec.xr;
                ecy += ec.yr;
                eyeCount += 1;
            }
            if (eyeCount) {
                ecx /= eyeCount;
                ecy /= eyeCount;
            }
            return {x: ecx, y: ecy};
        };

        // Initialization
        
        if (settings.controller === root.GazeTargets.scroller.controllers.fixation) {
            var upper = createContainer(true);
            var lower = createContainer(false);
        }
        
    }

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Scroller = Scroller;

})(window);