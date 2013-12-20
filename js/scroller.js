function Scroller (options) {

    var enabled = false;
    var ref = null;
    var headPose = {
        speed: 0,
        timer: null
    };
    
    var fadeIn = function (element) {
        element.classList.remove('etud-animation');
        element.classList.remove('etud-animated-fadeOutHalf');
        element.classList.add(options.className + '-keyOpaque');
        element.classList.add('etud-animated-fadeInHalf');
        element.classList.add('etud-animated');
    };
    
    var fadeOut = function (element) {
        element.classList.remove(options.className + '-keyOpaque');
        element.classList.remove('etud-animation');
        element.classList.remove('etud-animated-fadeInHalf');
        element.classList.add('etud-animated-fadeOutHalf');
        element.classList.add('etud-animated');
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
    }
    
    var onKeyLeft = function () {
        if (this.scroller.timer) {
            clearInterval(this.scroller.timer);
            this.scroller.timer = null;
        }
        fadeOut(this);
    };
    
    var createCells = function (container, isScrollingUp) {
        var row = container.insertRow(-1);
        for (var i = 0; i < options.speeds.length; i += 1) {
            var speed = options.speeds[i];
            
            var btn = document.createElement('div');
            btn.className = options.className + '-key';
            
            var imgDir = isScrollingUp ? 'Up' : 'Down';
            var img = '';
            if (speed > 0) {
                img = 'smooth' + imgDir;
            }
            else if (speed < 0) {
                img = 'page' + imgDir;
            }
            if (img) {
                btn.style.backgroundImage = 'url(\'' + options.imageFolder + img + '.png\')';
            }
            
            btn.scroller = {
                speed: speed,
                direction: isScrollingUp ? -1 : 1,
                timer: null
            };
            
            btn.addEventListener($.etudriver.event.selected, onKeySelected);
            btn.addEventListener($.etudriver.event.focused, onKeyFocused);
            btn.addEventListener($.etudriver.event.left, onKeyLeft);
            
            var cell = row.insertCell(-1);
            cell.appendChild(btn);
        }
    };
    
    var createContainer = function (isUpper) {
        var container = document.createElement('table');
        container.className = options.className;
        container.classList.add(options.className + (isUpper ? '-upper' : '-lower'));
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
    
    if (options.type === $.etudriver.scroller.fixation) {
        var upper = createContainer(true);
        var lower = createContainer(false);
    }
    
    this.init = function () {
        enabled = true;
    }
    
    this.feed = function (ec) {
        if (!ref) {
            ref = getAvg(ec);
        }
        
        var pt = getAvg(ec);
        var dy = pt.y - ref.y;

        if (Math.abs(dy) >= options.headPose.threshold) {
            headPose.speed = (Math.abs(dy) - options.headPose.threshold) * 
                (dy < 0 ? -1 : 1) * options.headPose.transformParam;
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
    
    this.reset = function () {
        enabled = false;
        ref = null;
        headPose.speed = 0;
        if (headPose.timer) {
            clearInterval(headPose.timer);
            headPose.timer = null;
        }
   }
}