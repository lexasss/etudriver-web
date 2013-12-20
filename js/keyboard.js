// Keyboard
// arguments:
//  - options: 
//      - className: keyboard class name
//      - layout: keyboard layout
//      - imageFolder: the folder to lookup images
//      - callbacks: callbacks of custom events, whose name correspond to a button title 
//               (the command must be 'custom'; the title is likely to be an image, but the callback,
//               must not have ".png")
//               passed params:
//                  - keyboard: the keyboard
//  - markers: 
//      - button: a class that is common for all keys in all keyboards
//      - indicator: a class to mark indicators
//  - events: the following callbacks
//      - show: the keyboard was shown; arguments:
//          - keyboard: the keyboard displayed
//      - hide: the keyboard has hidden
function Keyboard(options, markers, _events) {
    this.options = options;
    var validOptions = {};
    
	//validOptions.layout = layout || '[\"!|!|1,?|?|2,:|:|3,;|;|4,\\u0027|\\u0027|5,\\u0022|\\u0022|6,&|&|7,@|@|8,(|(|9,)|)|0\",{\"titles\":[\"backspace.png\"], \"commands\":[\"backspace\"]}],\n[\"q|Q|+,w|W|-:,e|E|*,r|R|\\/,t|T|=,y|Y|%,u|U|$,i|I|#,o|O|(,p|P|)\",{\"titles\":[\"enter.png\"], \"commands\":[\"enter\"]}],\n[\"a|A|@,s|S|~,d|D|^,f|F|\\u005C,g|G|_,h|H|&,j|J|[,k|K|],l|L|\\u007B, | |\\u007D\",{\"titles\":[\"symbols.png\",\"symbols.png\",\"upcase.png\"], \"commands\":[\"symbols\",\"symbols\",\"upcase\"]}],\n[\"z|Z|,x|X|,c|C|,v|V|,b|B| ,n|N|,m|M|\",{\"titles\":[\",\",\"<\",\"<\"], \"commands\":[\",\",\"<\",\"<\"]},\".|>|>\",{\"titles\":[\"upcase.png\",\"lowcase.png\"], \"commands\":[\"upcase\",\"lowcase\"]},{\"titles\":[\"close.png\"], \"commands\":[\"hide\"]}]';
	validOptions.layout = options.layout || '[\"!|!|1,?|?|2,:|:|3,;|;|4,\\u0027|\\u0027|5,\\u0022|\\u0022|6,&|&|7,@|@|8,(|(|9,)|)|0\",{\"titles\":[\"backspace.png\"], \"commands\":[\"backspace\"]}],\n[\"q|Q|+,w|W|-:,e|E|*,r|R|\\/,t|T|=,y|Y|%,u|U|$,i|I|#,o|O|(,p|P|)\",{\"titles\":[\"enter.png\"], \"commands\":[\"enter\"]}],\n[\"a|A|@,s|S|~,d|D|^,f|F|\\u005C,g|G|_,h|H|&,j|J|[,k|K|],l|L|\\u007B, | |\\u007D\",{\"titles\":[\"symbols.png\",\"symbols.png\",\"upcase.png\"], \"commands\":[\"symbols\",\"symbols\",\"upcase\"]}],\n[\"z|Z|,x|X|,c|C|,v|V|,b|B| ,n|N|,m|M|\",{\"titles\":[\",\",\"<\",\"<\"], \"commands\":[\",\",\"<\",\"<\"]},\".|>|>\",{\"titles\":[\"upcase.png\",\"lowcase.png\"], \"commands\":[\"upcase\",\"lowcase\"]},{\"titles\":[\"send.png\"], \"commands\":[\"custom\"]}]';
	//validOptions.layout = options.layout || '[\"q|Q|+,w|W|-:,e|E|*,r|R|\\/,t|T|=,y|Y|%,u|U|$,i|I|#,o|O|(,p|P|)\",{\"titles\":[\"enter.png\"], \"commands\":[\"enter\"]}],\n[\"a|A|@,s|S|~,d|D|^,f|F|\\u005C,g|G|_,h|H|&,j|J|[,k|K|],l|L|\\u007B, | |\\u007D\",{\"titles\":[\"symbols.png\",\"symbols.png\",\"upcase.png\"], \"commands\":[\"symbols\",\"symbols\",\"upcase\"]}],\n[\"z|Z|,x|X|,c|C|,v|V|,b|B| ,n|N|,m|M|\",{\"titles\":[\",\",\"<\",\"<\"], \"commands\":[\",\",\"<\",\"<\"]},\".|>|>\",{\"titles\":[\"upcase.png\",\"lowcase.png\"], \"commands\":[\"upcase\",\"lowcase\"]},{\"titles\":[\"send.png\"], \"commands\":[\"custom\"]}]';
    
    validOptions.callbacks = options.callbacks || {};
    validOptions.imageFolder = options.imageFolder || '/images/kbd/' + options.name + '/';
    validOptions.className = {
        container: 'etud-keyboard ' + ((options.className ? options.className.container : '') || 'etud-keyboardDefault'),
        button: 'etud-keyboard-button ' + ((options.className ? options.className.button : '') || 'etud-keyboard-buttonDefault')
    };
    
    var events = _events || {};
    
	var container = document.createElement('table');
	container.className = validOptions.className.container;
    container.classList.add('etud-keyboard-invisible');
	
	var state = 0;
	var layouts = {
        lowcase: 0,
        upcase: 1,
        symbols: 2
    };
    var indicators = {
        dwell: 'dwell'
    };
	
	var rows = [];   
    var inputElem = null;
    var dwellTime = new DwellTime(options.selection);
    
    var that = this;

	var functions = {
		hide: function () {
			fadeOut();
		},
		backspace: function () {
            var input = inputElem || document.activeElement;
			if (input) {
				var caretPos = input.selectionStart;
				var value = input.value;
				if (caretPos !== undefined && value !== undefined && caretPos > 0) {
					var start = value.substr(0, caretPos - 1);
					var end = value.substr(caretPos);
					input.value = start + end;
					input.selectionStart = caretPos - 1;
					input.selectionEnd = caretPos - 1;
				}
			}
		},
		enter: function () {
			simulateKeyPress('Enter', 13);
		},
		left: function () {
			simulateKeyPress('Left', 37);
		},
		right: function () {
			simulateKeyPress('Left', 39);
		},
		up: function () {
			simulateKeyPress('Up', 38);
		},
		down: function () {
			simulateKeyPress('Down', 40);
		},
		home: function () {
			simulateKeyPress('Home', 36);
		},
		end: function () {
			simulateKeyPress('End', 35);
		},
		pageup: function () {
			simulateKeyPress('PageUp', 33);
		},
		pagedown: function () {
			simulateKeyPress('PageDown', 34);
		},
        dwellInc: function () {
            dwellTime.increase();
        },
        dwellDec: function () {
            dwellTime.decrease();
        },
        custom: function (value) {
            if (value in validOptions.callbacks) {
                validOptions.callbacks[value](that);
            }
        }
	};
    
    var getIndicatorValue = function (command) {
        if (command === indicators.dwell) {
            return options.selection.dwellTime;
        }
    };
    
    var display = function (button, content, command) {
        var value = getIndicatorValue(command);
        if (value != button.indicator.value) {
            button.indicator.value = value;
            content.innerHTML = value;
        }
    };

    function DwellTime (selOptions) {
        var options = selOptions;
        var minValue = 150;
        var changeA = 150;
        var changeB = 300.0;
        var changeC = 12.0;
        var changeStep = 20;

        var change = function (step) {
            var val = Math.log((options.dwellTime + changeA) / changeB) * changeC;
            val += step;
            options.dwellTime = Math.round((changeB * Math.exp(val / changeC) - changeA) / changeStep) * changeStep;

            if (options.dwellTime < minValue) {
                options.dwellTime = minValue;
            }
        };

        this.increase = function () {
            change(1);
        };

        this.decrease = function () {
            change(-1);
        };
    }
    
    // Utils
    var is = function (type, obj) {
        var cls = Object.prototype.toString.call(obj).slice(8, -1);
        return obj !== undefined && obj !== null && cls === type;
    };

    var simulateKeyPress = function (keyName, keyCode) {
        function enter(elm) {
            if (elm.tagName.toLowerCase() == 'textarea') {
                var start = elm.value.substr(0, elm.selectionEnd);
                var end = elm.value.substr(elm.selectionEnd);
                elm.value = start + '\n' + end;
            } else {
                var event = new KeyboardEvent('keydown', {'key': 'Enter', 'code': 13, shiftKey: false});
                elm.dispatchEvent(event);
            }
        }
        
        function homeKey(elm) {
            elm.selectionEnd = elm.selectionStart =                            
                elm.value.lastIndexOf('\n', elm.selectionEnd - 1) + 1;
        }

        function endKey(elm) {
            var pos = elm.selectionEnd,
                    i = elm.value.indexOf('\n', pos);
            if (i === -1) i = elm.value.length;
            elm.selectionStart = elm.selectionEnd = i;
        }

        function arrowLeft(elm) {
            elm.selectionStart = elm.selectionEnd -= 1;
        }

        function arrowRight(elm) {
            elm.selectionStart = elm.selectionEnd += 1;
        }

        function arrowDown(elm) {
            var pos = elm.selectionEnd,
                    prevLine = elm.value.lastIndexOf('\n', pos),
                    nextLine = elm.value.indexOf('\n', pos + 1);
            if (nextLine === -1) return;
            pos = pos - prevLine;
            elm.selectionStart = elm.selectionEnd = nextLine + pos;
        }

        function arrowUp(elm) {
            var pos = elm.selectionEnd,
                    prevLine = elm.value.lastIndexOf('\n', pos),
                    TwoBLine = elm.value.lastIndexOf('\n', prevLine - 1);
            if (prevLine === -1) return;
            pos = pos - prevLine;
            elm.selectionStart = elm.selectionEnd = TwoBLine + pos;
        }
        
        var input = inputElem || document.activeElement;
        if (!input)
            return;
        
        if (keyCode == 13)
            enter(input);
        else if (keyCode == 33)
            ;//pageUp
        else if (keyCode == 34)
            ;//pageDown	
        else if (keyCode == 35)
            endKey(input);
        else if (keyCode == 36)
            homeKey(input);
        else if (keyCode == 37)
            arrowLeft(input);
        else if (keyCode == 38)
            arrowUp(input);
        else if (keyCode == 39)
            arrowRight(input);
        else if (keyCode == 40)
            arrowDown(input);
    };

    var switchTo = function (_state) {
        state = _state;
        
        var r, b, row;
        
        for (r = 0; r < rows.length; r++) {
            row = rows[r];
            for (b = 0; b < row.length; b++) {
                if (!row[b].invalid)
                    row[b].dom.parentElement.style.display = 'table-cell';
            }
        }
        
        for (r = 0; r < rows.length; r++) {
            row = rows[r];
            for (b = 0; b < row.length; b++) {
                if (!row[b].invalid)
                    row[b].update();
            }
        }
    };
    
    // Layout creator
    var parseLayout = function (layout) {
        var result = [];
        try {
            var layoutString = '{"layout": [' + layout + '] }';
            var json = JSON.parse(layoutString);
            if (json.layout !== undefined && is('Array', json.layout)) {
                result = json.layout;
            } else {
                throw '- the JSON object has no "layout" property, or it is not an array';
            }
        } catch (e) {
            console.log('The definition of layout\n' + layout + '\n\nis not valid:\n' + e.message);
        }
        return result;
    };

    var getButtonText = function (titles, state) {
        var result = '';
        if (titles) {
            if (titles.length > state) {
                result = titles[state];
            } else if (titles.length > 0) {
                result = titles[0];
            }
        }
        return result;
    };

    var createButtons = function (text) {
        var letters = text.split(',');
        var buttons = [];
        for (var i = 0; i < letters.length; i++) {
            buttons.push(createButton(letters[i]));
        }
        return buttons;
    };

    var createButton = function (data) {
        var result = {titles: [], commands: []};
        if (is('String', data)) {
            var states = data.split('|');
            var i, state;
            if (states.length) {
                for (i = 0; i < states.length; i++) {
                    state = states[i];
                    if (!state) {
                        result.titles.push('');
                        result.commands.push('');
                    } else {
                        var v = state.split(':');
                        if (!v[0] && v.length > 1) {
                            result.titles.push(':');
                            result.commands.push(v[1] || ':');
                        } else if (v.length == 1) {
                            result.titles.push(state);
                            result.commands.push(state);
                        } else {
                            result.titles.push(v[0]);
                            result.commands.push(v[1]);
                        }
                    }
                }
            }
        }
        
        validateButton(result);
        
        return result;
    };

    var validateButton = function (button) {
        button.titles = is('Array', button.titles) ? button.titles : [];
        button.commands = is('Array', button.commands) ? button.commands : [];

        // make equal length of titles and commands
        var i;
        if (button.titles.length < button.commands.length) {
            for (i = button.titles.length; i < button.commands.length; i++)
                button.titles.push(button.commands[i]);
        } else if (button.commands.length < button.titles.length){
            for (i = button.commands.length; i < button.titles.length; i++)
                button.commands.push(button.titles[i]);
        }
        
        // fill all undefined layouts with the last defined state
        var nextTitle = '', nextCommand = '';
        if (button.titles.length) {
            nextTitle = button.titles.slice(-1)[0];
            nextCommand = button.commands.slice(-1)[0];
        }
        
        for (i = button.titles.length; i < Object.keys(layouts).length; i++) {
            button.titles.push(nextTitle);
            button.commands.push(nextCommand);
        }

        // remove 'png' from commands constructed from titles
        for (i = 0; i < button.commands.length; i++) {
            var p = button.commands[i].split('.');
            if (p.length > 1 && p[p.length - 1].toLowerCase() == 'png') {
                p.pop();
                button.commands[i] = p.join('.');
            }
        }
        
        if (typeof button.zoom !== 'undefined') {
            // if zoom is defined and not an array, convert it to array
            if (!button.zoom.length) {
                button.zoom = [button.zoom, button.zoom, button.zoom];
            }
        }
    };

    var addRow = function () {
        var row = container.insertRow(-1);
        return row;
    };

    var addButton = function (row, button, w, h) {
        var btn = document.createElement('div');
        btn.className = validOptions.className.button;
        
        btn.classList.add(markers.button);
        
        btn.addEventListener('mousedown', function(e) {
            click(button);
            e.preventDefault();
            e.stopPropagation();
        }, false);
        
        var content = document.createElement('div');
        btn.appendChild(content);
        
        var cell = row.insertCell(-1);
        cell.appendChild(btn);
        
        if (!button) {
            btn.invalid = true;
            return;
        }
        
        button.dom = btn;
        button.update = function () {
            if (button.indicator) {
                clearInterval(button.indicator.timer);
                button.indicator = null;
            }
            
            var title = button ? getButtonText(button.titles, state) : '';
            btn.style.visibility = title.length ? 'visible' : 'hidden';
            
            var command = button.commands[state];
            var isIndicator = command in indicators;
            if (isIndicator) {
                btn.classList.add(markers.indicator);
            } else {
                btn.classList.remove(markers.indicator);
            }
            
            content.innerHTML = '';
            content.style.backgroundImage = '';
            
            var p = title.split('.');
            if (p.length > 1 && p[p.length - 1].toLowerCase() == 'png') {
                content.style.backgroundImage = 'url(\'' + validOptions.imageFolder + title + '\')';
            }
            else if (isIndicator) {
                button.indicator = {
                    timer: setInterval(function () {
                        display(button, content, command);
                    }, 50),
                    value: null
                };
            }
            else {
                content.innerHTML = title;
            }

            // if zoomed, extend the cell to right...
            var zoom = button.zoom ? Math.round(button.zoom[state]) : 1;
            cell.colSpan = zoom > 1 ? zoom : 1;
            
            // ... and hide next cells
            if (zoom > 1) {
                var nextCell = cell.nextElementSibling;
                while (nextCell && zoom > 1) {
                    nextCell.style.display = 'none';
                    nextCell = nextCell.nextElementSibling;
                    zoom -= 1;
                }
            }
        };
        
        button.update();
    };

    var createLayout = function (layout) {
        while (container.hasChildNodes()) {	
              container.removeChild(container.lastChild);
        }
        
        if (!is('Array', layout)) {
            rows = parseLayout(layout);
        } else {
            rows = layout;
        }
        
        var r, b, row, button, buttons, a, obj, obj2;
        var rowCount = rows.length;

        for (r = 0; r < rowCount; r++) {
            row = rows[r];
            if (!is('Array', row)) {
                row = [row];
                rows[r] = row;
            }
            for (b = 0; b < row.length; b++) {
                obj = row[b];
                if (is('String', obj)) {
                    buttons = createButtons(obj);
                    row.splice.apply(row, [b, 1].concat(buttons)); // replace the string object by buttons
                    b += buttons.length - 1;
                } else if (is('Object', obj)) {
                    validateButton(obj);
                }
            }
        }

       for (r = 0; r < rowCount; r++) {
            row = addRow();
            buttons = rows[r];
            for (b = 0; b < buttons.length; b++) {
                addButton(row, buttons[b]);
            }
        }
    };

    // Output
    var click = function (button) {
        execute(button.commands[state], button.titles[state]);
    };

    var execute = function (command, title) {
        if (!command)
            return;
            
        if (command in functions) {
            var arg = title;
            var p = arg.split('.');
            if (p.length > 1 && p[p.length - 1].toLowerCase() == 'png') {
                p.pop();
                arg = p.join('.');
            }
            functions[command](arg);
        }
        else if (command in layouts) {
            switchTo(layouts[command]);
        }
        else {
            var input = inputElem || document.activeElement;
            if (input) {
                var caretPos = input.selectionStart;
                var value = input.value;
                if (caretPos !== undefined && value !== undefined) {
                    var start = value.substr(0, caretPos);
                    var end = value.substr(caretPos);
                    input.value = start + command + end;
                    input.selectionStart = caretPos + command.length;
                    input.selectionEnd = caretPos + command.length;
                }
            }
        }
    };

    // Animation
    var fadeIn = function () {
        container.classList.remove('etud-animated');
        container.classList.remove('etud-animated-fadeOutDown');
        container.classList.add('etud-animated-fadeInUp');
        container.classList.add('etud-animated');
        
        if (events.show) {
            events.show(that);
        }
    };
    
    var fadeOut = function () {
        container.classList.remove('etud-animated');
        container.classList.remove('etud-animated-fadeInUp');
        container.classList.add('etud-animated-fadeOutDown');
        container.classList.add('etud-animated');
        
        if (events.hide) {
            events.hide();
        }
    };
    
    
    // Public

    // Resets the keyboard state to initial (0)
    this.reset = function () {
        switchTo(0);
    };

    // Sets the input element and shows the keyboard
    // arguments:
    //  - _inputElem: input element
    this.show = function (_inputElem) {
        if (is('String', _inputElem)) {
            inputElem = document.getElementById(_inputElem);
        } else {
            inputElem = _inputElem;
        }
        
        container.classList.remove('etud-keyboard-invisible');
        
        if (inputElem) {
            var locationClass = 'etud-keyboard-stickBottom';
            var fixedBoxInput = inputElem.getBoundingClientRect();
            
            var keyboardOverlapAtBottom = (window.innerHeight - fixedBoxInput.bottom) < container.offsetHeight;
            var keyboardOverlapAtTop = fixedBoxInput.top < container.offsetHeight;

            var docElem = inputElem.ownerDocument.documentElement;
            var offsetBottom  = docElem.clientHeight - (inputElem.offsetTop + inputElem.offsetHeight);
            var canScrollUp   = offsetBottom > container.offsetHeight;
            var canScrollDown = inputElem.offsetTop > container.offsetHeight;

            var getScrollYBy = null;
            var scrollUp = function () {
                var fixedBoxKeyboard = container.getBoundingClientRect();
                return fixedBoxInput.top + fixedBoxInput.height - fixedBoxKeyboard.top + 20;
            };
            var scrollDown = function () {
                return -(container.offsetHeight - fixedBoxInput.top) - 20;
            };
            
            if (!keyboardOverlapAtBottom || canScrollUp) {
                if (keyboardOverlapAtBottom) {
                    getScrollYBy = scrollUp;
                }
            } else if (!keyboardOverlapAtTop || canScrollDown) {
                locationClass = 'etud-keyboard-stickTop';
                if (keyboardOverlapAtTop) {
                    getScrollYBy = scrollDown;
                }
            } else {
                container.classList.add(validOptions.className.container + '-shrinked');
                getScrollYBy = scrollUp;
            }
            
            container.classList.add(locationClass);
           
            var adjustPosition = function () {
                var scrollYBy = getScrollYBy ? getScrollYBy() : 0;
                if (scrollYBy) {
                    var maxStep = 10;
                    var stepDuration = 20;
                    var slidePage = function () {
                        var step = scrollYBy < 0 ? Math.max(-maxStep, scrollYBy) : Math.min(maxStep, scrollYBy);
                        scrollYBy -= step;
                        window.scrollBy(0, step);
                        
                        if (scrollYBy) {
                            setTimeout(slidePage, stepDuration);
                        }
                    };
                    setTimeout(slidePage, stepDuration);
                }

                container.removeEventListener('animationend', adjustPosition, false);
                container.removeEventListener('webkitAnimationEnd', adjustPosition, false);
            };
            
            container.addEventListener('animationend', adjustPosition, false);
            container.addEventListener('webkitAnimationEnd', adjustPosition, false);
            
            inputElem.focus();
        }
        
        fadeIn();
    };
    
    // Hides the keyboard
    this.hide = function () {
        fadeOut();
        var onfinished = function () {
            container.classList.add('etud-keyboard-invisible');
            
            container.classList.remove('etud-keyboard-shrinked');
            container.classList.remove('etud-keyboard-stickTop');
            
            container.removeEventListener('animationend', onfinished, false);
            container.removeEventListener('webkitAnimationEnd', onfinished, false);
        };
        container.addEventListener('animationend', onfinished, false);
        container.addEventListener('webkitAnimationEnd', onfinished, false);
    };

    // Returns true if keyboard is visible
    this.isVisible = function () {
        return container.style.display !== 'none';
    };
    
    // Return the keyboard DOM element (table)
    this.getDOM = function () {
        return container;
    };
    
    // Return the keyboard state
    this.getState = function () {
        return state;
    };
    
    // Returns the keyboard input element
    this.getInputElem = function () {
        return inputElem;
    };
    
    // Execute a command by external call
    this.print = function (command, title) {
        execute(command, title);
    };
    
    
    createLayout(validOptions.layout);
    document.body.appendChild(container);
};

