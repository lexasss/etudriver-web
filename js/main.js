    //////////////////////////////////// DOCUMENTATION START ///////////////////////////////////
    
    // Plugin constants and settings
    $.etudriver = {
        mapping: {      // mapping methods
            // no mapping (= samples are not processed)
            none: 0,
            
            // mapping is based on the exact location and size of targets 
            // no extra settings
            naive: 1,
            
            // mapping is based on the extended size of targets
            // extra settings for settings.mapping:
            //   expansion      - expansion size in pixels
            expanded: 2
        },
        selection: {    // selection methods
            // no extra  settings for targets[].selection
            none: 0,
            
            // extra settings for settings.targets[].selection:
            //   dwellTime      - dwell time in ms
            competitiveDwell: 1,
            
            // extra settings for settings.targets[].selection:
            //   dwellTime      - dwell time in ms
            simpleDwell: 2,
            
            // settings.targets[].selection.nod is the array of 4 rules of the following structure:
            //  - matchAll: 'true' for stable signal, 'false' for changing signal
            //  - interval: {min, max}, time range in ms for this rule
            //  - left, right: {amplitude, angle} (each is an interval {min, max} ), amplitude (>=0) 
            //          and angle (0 - 360) of the required movement
            nod: 3,
            
            // extra settings for settings.targets[].selection:
            //   name      - the name of gesture
            customHeadGesture: 4
        },
        source: {       // source of data in mapping and for gaze pointer
            samples: 0,
            fixations: 1
        },
        event: {        // generated events
            focused: 'focused',
            left: 'left',
            selected: 'selected'
        },
        scroller: {     // scroller type
            fixation: 0,
            headPose: 1
        },
        keyboard: {     // available keyboards
            /**
                Keyboards consist of the required layout, and optional custom callback functions, image folder 
                (with '/' at the end), and keyboard and key class names
                
                A layout is described using JSON notation without opening tags.
                
                Rows are separated by periods. Each row is either a string (strings are always surrounded by quotation marks), 
                or an array denoted using brackets "[" and "]". FOr example:
                    " ", [ ]        - two rows.
                    
                Arrays consist of strings and objects. Objects are denoted using curly brackets "{" and "}". For example:
                    [ " ", { } ]    - several buttons described by a string and one button described by an object.
                    
                A string holds a list of buttons separated by period (","). Spaces after periods are not allowed 
                (unless this is a button that will print the space). For example:
                    "a,b,c"         - three buttons that will display "a", "b" and "c" letters, and print them when pressed.
                    
                Each key may have up to 3 states (lowcase, upcase and other) and states are divided by the vertical line ("|").
                For example:
                    "a|A,b|B|,c||$$,d|"
                        - the first button will be displayed in lower case in the first state, 
                          and in upper case for all other states
                        - the second button will be displayed in lower case in the first state, 
                          in upper case in the second state, and not displayed in the third state
                        - the third button will be displayed as "c" in the first state, 
                           not displayed in the second state, and displayed as "$$" in the third state
                        - the last button will be displayed as "d" in the first state, and not displayed in other state
                        
                The default keyboard state is "lowcase". A special functional key described further may change 
                the state when pressed.
                
                It is possible to separate the visible and printed text using a colon (":"). For example:
                    "-a-:a,-b-:b,-c-:c"     - the label of each button contains two "-" signs, 
                                              but the buttons print a single letter only.
                    
                If the string to be displayed (title) ends with ".png", then an image from the extension's folder 
                "/images/glyphs/"  will be displayed if it exists. For example:
                    "smile.png:8),upcase.png:upcase"
                    
                The signs used as a part of format except colons ":" must be described as Unicode codes. For example,
                    "\u007B"    - prints "{"
                    
                Certain words used as commands trigger special functions rather than entering text:
                    "lowcase"   - changes the state of each button to "lowcase"
                    "upcase"    - changes the state of each button to "upcase"
                    "other"     - changes the state of each button to "other"
                    "hide"      - hides the keyboard
                    "backspace" - remove the preceding character
                    "enter"     - simulates "Enter"
                    "left"      - pushes the caret left
                    "right"     - pushes the caret right
                    "up"        - pushes the caret up
                    "down"      - pushes the caret down
                    "home"      - pushes the caret to line start
                    "end"       - pushes the caret to line end
                    "pageup"    - pushes the caret one page up
                    "pagedown"  - pushes the caret one page down
                    "dwellInc"  - increases the dwell time for the keyboard
                    "dwellDec"  - decreases the dwell time for the keyboard
                    "custom"    - runs a custom function from the passed list. The function name is the value of title 
                        (if the title ends with ".png" then the function to be called should have no such ending).
                        For example:
                            "mycommand.png:custom"  - the button displays "/path/to/mycommand.png" image and calls
                                                      the function $.etudriver.keyboard.[NAME].callbacks.mycommand
                                                      when selected
                
                The other way to describe a button is to define a JSON object. The object general structure is the following:
                    { 
                        "titles" : [ ],     - displaying titles, one per state; use the empty string "" for 
                                              not displaying the button in a certain state
                        "commands" : [ ],   - printed signs or functions, one per state
                        "zoom" : [ ]        - horizontal expansion factor; integer or array of integers; the default is 1
                    }
                For example: 
                    { 
                        "titles" : [ "lowcase.png", "upcase.png", "mycommand.png" ],
                        "commands" : [ "lowcase", "upcase", "custom" ]
                    }
                        - the button with lowcase, upcase and custom functions

                If titles (without ".png") and commands coincide, only one array is sufficient. For example:
                    { "titles" : ["3", "#", "ˆ"], "zoom" : 2 }
                        - the button has all 3 states, will print 3, # and ˆ, 
                          and will appear 2 times larger (horizontally) than other keys.
            */
            default: {  // the default QWERTY keyboard
                // required
                layout: '[\"!|!|1,?|?|2,:|:|3,;|;|4,\\u0027|\\u0027|5,\\u0022|\\u0022|6,&|&|7,@|@|8,(|(|9,)|)|0\",{\"titles\":[\"backspace.png\"], \"commands\":[\"backspace\"]}],\n[\"q|Q|+,w|W|-:,e|E|*,r|R|\\/,t|T|=,y|Y|%,u|U|$,i|I|#,o|O|(,p|P|)\",{\"titles\":[\"enter.png\"], \"commands\":[\"enter\"]}],\n[\"a|A|@,s|S|~,d|D|^,f|F|\\u005C,g|G|_,h|H|&,j|J|[,k|K|],l|L|\\u007B, | |\\u007D\",{\"titles\":[\"symbols.png\",\"symbols.png\",\"upcase.png\"], \"commands\":[\"symbols\",\"symbols\",\"upcase\"]}],\n[\"z|Z|,x|X|,c|C|,v|V|,b|B| ,n|N|,m|M|\",{\"titles\":[\",\",\"<\",\"<\"], \"commands\":[\",\",\"<\",\"<\"]},\".|>|>\",{\"titles\":[\"upcase.png\",\"lowcase.png\"], \"commands\":[\"upcase\",\"lowcase\"]},{\"titles\":[\"close.png\"], \"commands\":[\"hide\"]}]',
                // optional
                callbacks: { },     // callbacks of custom events, whose name correspond to a button title 
                                    // (the command must be 'custom'; the title is likely to be an image, 
                                    // but the callback must not have ".png")
                                    // passed params:
                                    //  - keyboard: the keyboard 
                imageFolder: 'images/kbd/default/',     // location of images relative to the HTML file
                className: {
                    container: 'etud-keyboardDefault',      // keyboard container CSS class
                    button: 'etud-keyboard-buttonDefault'   // keyboard button CSS class
                },
                selection: {    // see settings.targets.selection for comments
                    type: 1
                },
                mapping: { },   // see settings.targets.mapping for comments
            }
        },
        settings: {     // default settings for all targets
            selection: {
                defaults: {                     // default selection settings
                    className: 'etud-selected', // this class is added to the selected element
                    duration: 200,              // the duration to stay the 'className' in the list of classes
                    audio: 'click.wav'          // audio file played on selection
                },
                
                // type-dependent settings
                competitiveDwell: {
                    dwellTime: 1000,
                    showProgress: true
                },
                simpleDwell: {
                    dwellTime: 1000,
                    showProgress: true
                },
                nod: [  // 4 stages
                    {   // stay still
                        matchAll: true,
                        interval: {
                            min: 80,
                            max: 120
                        },
                        left: {
                            amplitude: { min: 0.000, max: 0.005 },
                            angle:     { min: 0.000, max: 0.000 }
                        },
                        right: {
                            amplitude: { min: 0.000, max: 0.005 },
                            angle:     { min: 0.000, max: 0.000 }
                        }
                    },
                    {   // move down
                        matchAll: false,
                        interval: {
                            min: 100,
                            max: 200
                        },
                        left: {
                            amplitude: { min: 0.015, max: 0.040 },
                            angle:     { min:  70.0, max: 110.0 }
                        },
                        right: {
                            amplitude: { min: 0.015, max: 0.040 },
                            angle:     { min:  70.0, max: 110.0 }
                        }
                    },
                    {   // move up
                        matchAll: false,
                        interval: {
                            min: 100,
                            max: 200
                        },
                        left: {
                            amplitude: { min: 0.015, max: 0.040 },
                            angle:     { min: 250.0, max: 290.0 }
                        },
                        right: {
                            amplitude: { min: 0.015, max: 0.040 },
                            angle:     { min: 250.0, max: 290.0 }
                        }
                    },
                    {   // stay still
                        matchAll: true,
                        interval: {
                            min: 80,
                            max: 120
                        },
                        left: {
                            amplitude: { min: 0.000, max: 0.005 },
                            angle:     { min: 0.000, max: 0.000 }
                        },
                        right: {
                            amplitude: { min: 0.000, max: 0.005 },
                            angle:     { min: 0.000, max: 0.000 }
                        }
                    }
                ]
            },
            mapping: {
                defaults: {                 // default mapping settings
                    className: 'etud-focused'       // this class is added to the focused element
                },
                
                // type-dependent settings
                expanded: {
                    expansion: 50
                }
            }
        }
    };
    
    // The default settings
    var settings = {
        panel: {            // default control panel settings with eye-tracking control buttons
            show: true,               // boolean flag
            displaySamples: false,    // flag to display sample data, if panel is visible
            id: 'etud-panel',     // the panel id
            connectedClassName: 'etud-panel-connected'  // the class to apply then WebSocket is connected
        },
        targets: [          // list of target definitions
            {
                selector: '.etud-target',   // elements with this class name will be used 
                                            //   in gaze-to-element mapping procedure
                keyboard: null,             // keyboard to shown on selection, 'name' from $.etudriver.keyboard
                selection: {                // target selection settings that what happens on selection; accepts:
                                            //  - 'type', see $.etudriver.selection
                                            //  - the keys from $.etudriver.settings.selection.defaults
                                            //  - the keys from $.etudriver.settings.selection.[TYPE] 
                                            //    (see comments to the corresponding type in $.etudriver.selection)
                    type: $.etudriver.selection.competitiveDwell   // the default selection type
                },
                mapping: {                  // specifies what happens when a target gets attention; accepts:
                                            //  - the keys from $.etudriver.settings.mapping.defaults
                }
            }
        ],
        mapping: {          // mapping setting for all targets; accepts:
                                                //  - 'type' and 'sources', see below
                                                //  - the keys from $.etudriver.settings.mapping.[TYPE]
                                                //    (see comments to the corresponding type in $.etudriver.mapping)
            type: $.etudriver.mapping.naive,    // mapping type, see $.etudriver.mapping
            source: $.etudriver.source.samples, // data source for mapping, see $.etudriver.source
        },
        pointer: {          // gaze pointer settings
            show: true,             // boolean or a function returning boolean
            size: 8,                // pointer size (pixels)
            color: 'MediumSeaGreen',// CSS color
            opacity: 0.5,           // CSS opacity
            smoothing: {            // Olsson filter
                enabled: true,
                low: 300,
                high: 10,
                timeWindow: 50,
                threshold: 25
            }
        },
        progress: {         // dwell time progress settings
            color: 'Teal',  // progress indicator (arc) color
            opacity: 0.5,   // CSS opacity
            size: 60,       // widget size (pixels)
            minWidth: 5,    // progress indicator (arc) min width
            delay: 200      // >0ms, if the progress is not shown immediately after gaze enters a target
        },
        fixdet: {
            maxFixSize: 50,		// pixels
            bufferLength: 10    // samples
        },
        headCorrector: {    // gaze point correction my head movements
            enabled: true,          // boolean or a function returning boolean
            transformParam: 500     // transformation coefficient
        },
        headGesture: {
            timeWindow: 800
        },
        customHeadGestureDetector: {
            calibration: {          // gesture calibration settings
                trials: 5,             // number of trials
                threshold: 0.0120,     // minimum signal from the baseline
                trialDuration: 2000,   // ms
                pauseDuration: 2000,   // ms
                plotSizeFactor: 1.0    // a factor for 320x240
            },
            detection: {        // detector settings
                maxAmplitudeError: 0.20,    // 0..1 
                minCorrelation: 0.85,       // 0.05..0.95
                minPause: 500,              // the minimum pause between gestures
                alterRefSignalOnDetection: false    // if true, the baseline changes on the gesture detection
            }
        },
        css: {                  // the CSS to load at the initialization 
            file: 'etudriver',  // CSS file
            useVersion: true    // the flag to search for the same version as the JS file is; if false, searches for <file>.css
        },
        scroller: {         // scroller settings                   
            enabled: false,         // enabled/disabled
            speeds: [2, 7, 15, -1], // definition of cells: 
                // >0: speed per step in pixels,
                // 0: no scrolling,
                // -1: scrolling by page
            type: $.etudriver.scroller.headPose,    // the scrolling type
            className: 'etud-scroller', // class name
            imageFolder: 'images/scroller/', // location of images
            size: 80,                   // height in pixels
            delay: 800,                 // ms
            headPose: {                 // settings for the head-pose mode
                threshold: 0.005,       // threshold
                transformParam: 500     // transformation coefficient
            }
        },
        port: 8086,         // the port the WebSocket works on
        frequency: 0        // sampling frequency in Hz, between 10 and 1000 (other values keep the original tracker frequency)
    };

    // event handlers
    var callbacks = {
        // Fires when the eye tracker state changes
        // arguments:
        //   state - a container of flags representing an eye tracker state:
        //      isServiceRunning - connected to the service via WebSocket
        //      isConnected  - connected to a tracker
        //      isCalibrated - the tracker is calibrated
        //      isTracking   - the tracker is sending data
        //      isStopped    - the tracker was just stopped
        //      isBusy       - the service is temporally unavailable (calibration is in progress, 'Options' window is shown, etc.)
        //      device       - name of the device, if connected
        state: null,

        // Fires when a new sample arrives from an eye tracker
        // arguments:
        //   timestamp - data timestamp (integer)
        //   x - gaze x (integer)
        //   y - gaze y (integer)
        //   pupil - pupil size (float)
        //   ec = {xl, yl, xr, yr} - eye-camera values (float 0..1)
        sample: null,
        
        // Fires on target enter, leave and selection
        // arguments:
        //   event - a value from $.etudriver.event
        //   target - the target
        target: null,
        
        // Fires on a keyboard visibility change
        // arguments:
        //  - keyboard: the keyboard
        //  - visible: the visibility flag
        keyboard: null
    };

    //////////////////////////////////// DOCUMENTATION END ///////////////////////////////////
 
    // Plugin functions
    
    // Initialization.
    //   Must be called when a page is loaded
    //   arguments:
    //      - _settings: overwrites the default settings, see settings variable
    //      - _callbacks: fills the 'callbacks' object with handlers
    $.etudriver.init = function (_settings, _callbacks) {

        // Helping functions
        var loadCSS = function (href) {
            var head  = document.getElementsByTagName('head')[0];
            var link  = document.createElement('link');
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            link.media = 'all';
            head.appendChild(link);
        };

        var createPanel = function () {
        
            var isMSIE = function () {
                return navigator.userAgent.indexOf('MSIE') !== -1;
            };

            var controlPanelHtml = '\n\
                <span id="etud-device"></span>\n\
                <input id="etud-showOptions" type="button" value="Options" disabled />\n\
                <input id="etud-calibrate" type="button" value="Calibrate" disabled />\n\
                <input id="etud-toggleTracking" type="button" value="Start" disabled />\n\
                <span id="etud-chgd-calibMenu"><ul><li><a href="#">Calibrate gesture</a><ul id="etud-chgd-calibList"></ul></li></ul></span>\n\
                <span id="etud-log"></span>\n\
                ';

            controlPanel = document.createElement('div');
            controlPanel.id = settings.panel.id;
            controlPanel.innerHTML = controlPanelHtml;
            
            var bodyPaddingTop = window.getComputedStyle(document.body).paddingTop;
            document.body.insertBefore(controlPanel, document.body.firstChild);
            document.body.style.margin = '0px';
            
            if (!isMSIE()) {
                setTimeout(function () {
                    document.body.style.paddingTop = Math.max(parseInt(bodyPaddingTop, 10), controlPanel.scrollHeight) + 'px';
                }, 100);
            }

            lblDevice = document.getElementById('etud-device');
            btnShowOptions = document.getElementById('etud-showOptions');
            btnCalibrate = document.getElementById('etud-calibrate');
            btnStartStop = document.getElementById('etud-toggleTracking');
            lblLog = document.getElementById('etud-log');

            btnShowOptions.addEventListener('click', function () {
                sendToWebSocket(request.showOptions);
            });
            btnCalibrate.addEventListener('click', function () {
                sendToWebSocket(request.calibrate);
            });
            btnStartStop.addEventListener('click', function () {
                sendToWebSocket(request.toggleTracking);
            });
        };

        var createCalibrationList = function (required) {
            if (!controlPanel) {
                return;
            }
            
            var list = document.getElementById('etud-chgd-calibList');
            for (var name in required) {
                if (!chgDetectors[name]) {
                    chgDetectors[name] = new CustomHeadGestureDetector(name);
                    var li = document.createElement('li');
                    var btn = document.createElement('input');
                    btn.type = 'button';
                    btn.value = name.charAt(0).toUpperCase() + name.slice(1);
                    var addHandler = function (btn, name) {
                        btn.addEventListener('click', function () { 
                            $.etudriver.calibrateCustomHeadGesture(name, function (state) {
                                if (state === 'finished') {
                                    // TODO: handle finished event;
                                }
                            });
                        });
                    };
                    addHandler(btn, name);
                    li.appendChild(btn);
                    list.appendChild(li);
                }
            }
            
            if (list.hasChildNodes()) {
                document.getElementById('etud-chgd-calibMenu').style.display = 'inline';
            }
        };
        
        var createPointer = function () {
            pointer = document.createElement('div');
            pointer.className = 'etud-pointer';
            var s = pointer.style;
            s.display = 'none'
            s.backgroundColor = settings.pointer.color;
            s.opacity = settings.pointer.opacity;
            s.borderRadius = (settings.pointer.size / 2).toFixed(0) + 'px';
            s.height = settings.pointer.size + 'px';
            s.width = settings.pointer.size + 'px';
            document.body.appendChild(pointer);
        };
        
        // get the lib path
        var etudScript = detectPath();
        path = etudScript !== false ? etudScript.path : '';
        
        // combine the default and custom settings
        extend(true, settings, _settings);
        
        // add callbacks
        extend(true, callbacks, _callbacks);
        
        var needProgress = false;
        var needNodDetector = false;
        var requiredCustomHeadGestureDetectors = {};
        
        var configureTargetSettings = function (ts) {
            ts.selection = extend(true, {}, $.etudriver.settings.selection.defaults, ts.selection);
            ts.mapping = extend(true, {}, $.etudriver.settings.mapping.defaults, ts.mapping);
            switch (ts.selection.type) {
            case $.etudriver.selection.competitiveDwell:
                extend(true, true, ts.selection, $.etudriver.settings.selection.competitiveDwell);
                break;
            case $.etudriver.selection.simpleDwell:
                extend(true, true, ts.selection, $.etudriver.settings.selection.simpleDwell);
                break;
            case $.etudriver.selection.nod:
                extend(true, true, ts.selection, $.etudriver.settings.selection.nod);
                break;
            }
            
            if (ts.selection.dwellTime !== undefined) {
                needProgress = true;
            }
            if (ts.selection.type === $.etudriver.selection.nod) {
                needNodDetector = true;
            }
            if (ts.selection.type === $.etudriver.selection.customHeadGesture) {
                var name = ts.selection.name || 'default';
                requiredCustomHeadGestureDetectors[name] = true;
            }

            if (ts.selection.audio) {
                ts.selection.audio = new Audio(path + ts.selection.audio);
            }
        };
        
        for (var idx in settings.targets) {
            var ts = settings.targets[idx];
            configureTargetSettings(ts);
        }
        
        for (var kbd in $.etudriver.keyboard) {
            var keyboardParams = $.etudriver.keyboard[kbd];
            if (!keyboardParams.selection || !keyboardParams.selection.type) {
                keyboardParams.selection = { type: $.etudriver.selection.competitiveDwell };
            }

            // extend the keyboard parameter with 'selection' and 'mapping'
            configureTargetSettings(keyboardParams);
            keyboardParams.name = kbd;
            
            keyboards[kbd] = new Keyboard(keyboardParams, keyboardMarkers, {
                hide: function () {
                    if (callbacks.keyboard) {
                        callbacks.keyboard(currentKeyboard, false);
                    }
                    currentKeyboard = null;
                    $.etudriver.updateTargets();
                },
                show: function (keyboard) {
                    currentKeyboard = keyboard;
                    if (callbacks.keyboard) {
                        callbacks.keyboard(currentKeyboard, true);
                    }
                    $.etudriver.updateTargets();
                }
            });
        }

        switch (settings.mapping.type) {
        case $.etudriver.mapping.expanded:    
            extend(true, true, settings.mapping, $.etudriver.settings.mapping.expanded);
            break;
        }
        
        if (settings.css.file) {
            var fileName = path + settings.css.file;
            if (settings.css.useVersion && etudScript.version) {
                fileName += '-' + etudScript.version;
            }
            fileName += '.css';
            loadCSS(fileName);
        }

        if (settings.panel.show) {
            createPanel();
        }
        
        createPointer();
        
        if (needProgress) {
            progress = document.createElement('canvas');
            progress.className = 'etud-progress';
            progress.height = settings.progress.size;
            progress.width = settings.progress.size;
            progress.style.display = 'none';
            document.body.appendChild(progress);
        }
        
        headCorrector = new HeadCorrector();

        // scroller
        var scrollerSelection = {
            type: $.etudriver.selection.competitiveDwell,
            className: '',
            duration: 0,  
            audio: '',
            dwellTime: 800,
            showProgress: false
        };
        settings.scroller.targets = {
            smooth: {
                selector: '.' + settings.scroller.className + '-smooth',
                selection: settings.scroller.type === $.etudriver.scroller.fixation ? 
                    scrollerSelection : { type: $.etudriver.selection.none },
                mapping: { className: '' }
            },
            page: {
                selector: '.' + settings.scroller.className + '-page',
                selection: settings.scroller.type === $.etudriver.scroller.fixation ? 
                    scrollerSelection : { type: $.etudriver.selection.none },
                mapping: { className: '' }
            }
        };
        for (var target in settings.scroller.targets) {
            var ts = settings.scroller.targets[target];
            configureTargetSettings(ts);
        }
        
        scroller = new Scroller(settings.scroller);
        
        // Smoother
        if (settings.pointer.smoothing.enabled) {
            smoother = new Smoother();
        }
        
        // Multiple node detectors may exists, the settings should come from settings.targets[type == 'nod'].selection
        if (needNodDetector) {
            nodDetector = new HeadGestureDetector($.etudriver.settings.selection.nod);
        }
        
        createCalibrationList(requiredCustomHeadGestureDetectors);
        
        $.etudriver.updateTargets();

        initWebSocket(settings.port);
    };

    // Updates the list of targets
    // Must be called when a target was added, removed, or relocated
    // Add an object "gaze" to the DOM element with the following properties:
    //  - focused: boolean
    //  - selected: boolean
    //  - attention: integer, holds the accumulated attention time (used for $.etudriver.selection.competitiveDwell)
    //  - selection: type of selection method (from $.etudriver.selection)
    //  - mapping: type of mapping method (from $.etudriver.mapping)
    //  - keyboard: null, or the keyboard that is available currently for the input into this element
    $.etudriver.updateTargets = function () {
        targets = [];
        var ts, elems, i;
        var updateElement = function (elem, settings) {
            elem.gaze = {
                focused: false,
                selected: false,
                attention: 0,
                selection: settings.selection,
                mapping: settings.mapping,
                keyboard: settings.keyboard ? keyboards[settings.keyboard] : null
            };
            targets.push(elem);
        };
        
        for (var idx in settings.targets) {
            ts = settings.targets[idx];
            elems = document.querySelectorAll(ts.selector);
            for (i = 0; i < elems.length; i += 1) {
                updateElement(elems[i], ts);
            }
        }
        
        if (currentKeyboard) {
            ts = currentKeyboard.options;
            elems = currentKeyboard.getDOM().querySelectorAll('.' + keyboardMarkers.button);
            for (i = 0; i < elems.length; i += 1) {
                updateElement(elems[i], ts);
            }
        }
        
        for (var target in settings.scroller.targets) {
            ts = settings.scroller.targets[target];
            elems = document.querySelectorAll(ts.selector);
            for (i = 0; i < elems.length; i += 1) {
                updateElement(elems[i], ts);
            }
        }
    };

    // Triggers calibration of a custom head gesture detector
    // arguments: 
    //  - name: the name of detector
    //  - onfinished: the callback function called on the end of calibration; arguments:
    //      - name: the name of detector
    // returns: false if no detector of the name passed, true otherwise
    $.etudriver.calibrateCustomHeadGesture = function (name, onfinished) {
        var chgd = chgDetectors[name];
        if (!chgd) {
            return false;
        }
        chgd.init(chgd.modes.calibration, function (state) {
            if (state === 'finished' && onfinished) {
                onfinished(name);
            }
        });
        return true;
    };

    // Shows ETU-Driver options dialog
    // arguments:
    //  - onclosed: the function that is called when the options dialog is closed; arguments:
    //      - accepted: boolean, true if a user pressed "OK" button, false otherwise
    $.etudriver.showOptions = function (onclosed) {
        sendToWebSocket(request.showOptions);
    }

    // Calibrate the current device
    // arguments:
    //  - onfinished: the function that is called when the calibration is finished; arguments:
    //      - accepted: boolean, true if a new calibration was accepted, false otherwise
    $.etudriver.calibrate = function (onfinished) {
        sendToWebSocket(request.calibrate);
    }

    // Toggles tracking
    $.etudriver.toggleTracking = function () {
        sendToWebSocket(request.toggleTracking);
    }

    // Return the keyboard of the given name
    $.etudriver.getKeyboard = function (name) {
        return keyboards[name];
    }


    // Internal
    
    // consts
    var request = {
        showOptions: 'SHOW_OPTIONS',
        calibrate: 'CALIBRATE',
        toggleTracking: 'TOGGLE_TRACKING',
        setDevice: 'SET_DEVICE'
    };

    var respondType = {
        sample: 'sample',
        state: 'state',
        device: 'device'
    };

    var stateFlags = {
        none: 0,            // not connected, or unknown
        connected: 1,       // some tracker is online and is ready to be used
        calibrated: 2,      // the tracker is calibrated and ready to stream data
        tracking: 4,        // the tracker is streaming data
        busy: 8             // the service is temporally unavailable (calibration is in progress, 'Options' window is shown, etc.)
    };

    var stateLabel = {
        disconnected: 'DISCONNECTED',
        connecting: 'CONNECTING...',
        connected: 'CONNECTED'
    };
    
    // privat members
    var targets = [];

    var zoom = {x: 1.0, y: 1.0};
    var offset = {x: 0, y: 0};
    var keyboardMarkers = {
        button: 'etud-keyboard-keyMarker',
        indicator: 'etud-keyboard-indicator'
    };
    
    var samplingTimer = 0;

    // operation variables, must be reset when the tracking starts
    var focused = null;
    var lastFocused = null;
    var selected = null;
    var lastSample = null;

    var currentStateFlags = stateFlags.none;
    var currentDevice = '';
    
    var buffer = [];
    var sampleCount = 0;
    var samplingStart = 0;

    // interface
    var controlPanel = null;
    var lblDevice = null;
    var btnShowOptions = null;
    var btnCalibrate = null;
    var btnStartStop = null;
    var lblLog = null;
    
    // other objects
    var pointer = null;
    var progress = null;
    var headCorrector = null;
    var smoother = null;
    var nodDetector = null;
    var chgDetectors = {};
    var keyboards = {};
    var currentKeyboard = null;
    var scroller = null;

    var path = '';

    // WebSocket
    var websocket = null;
    var deviceName = 'Mouse';

    var onWebSocketOpen = function (evt) {
        //console.log(evt);
        if (controlPanel) {
            setWebSocketStatus(stateLabel.connected);
            controlPanel.classList.add(settings.panel.connectedClassName);
            var state = updateState(stateFlags.none);
            updateControlPanel(state);
            
            if (deviceName) {
                sendToWebSocket(request.setDevice + ' ' + deviceName);
            }
        }
    };

    var onWebSocketClose = function (evt) {
        //console.log(evt);
        websocket = null;
        if (controlPanel) {
            currentDevice = '';
            setWebSocketStatus(stateLabel.disconnected);
            controlPanel.classList.remove(settings.panel.connectedClassName);
            var state = updateState(stateFlags.none);
            updateControlPanel(state);
        }
    };

    var onWebSocketMessage = function (evt) {
        //console.log(evt.data);
        try {
            var state;
            var ge = JSON.parse(evt.data);
            if (ge.type === respondType.sample) {
                if (samplingTimer) {
                    buffer.push({ts: ge.ts, x: ge.x, y: ge.y, pupil: ge.p, ec: ge.ec});
                } else {
                    ondata(ge.ts, ge.x, ge.y, ge.p, ge.ec);
                }
            } else if (ge.type === respondType.state) {
                console.log('WebSocket got state: ' + evt.data);
                state = updateState(ge.value);
                onstate(state);
            } else if (ge.type === respondType.device) {
                console.log('WebSocket got device: ' + evt.data);
                deviceName = ge.name;
                state = updateState(undefined, ge.name);
                onstate(state);
            }
        } catch (e) {
            console.log(e);
            console.log(evt.data);
        }
    };

    var onWebSocketError = function (evt) {
        //console.log(evt);
        if (lblLog) {
            lblLog.innerHTML = 'Problems in the connection to WebSocket server';
            setTimeout(function () {
                lblLog.innerHTML = '';
            }, 5000);
        }
    };

    var initWebSocket = function (port) {
        setWebSocketStatus(stateLabel.connecting);

        var wsURI = 'ws://localhost:' + port + '/';
        websocket = new WebSocket(wsURI);
        websocket.onopen    = onWebSocketOpen;
        websocket.onclose   = onWebSocketClose;
        websocket.onmessage = onWebSocketMessage;
        websocket.onerror   = onWebSocketError;
    };

    var sendToWebSocket = function (message) {
        console.log('WebSocket sent: ' + message);
        websocket.send(message);
    };

    var setWebSocketStatus = function (label) {
        if (lblDevice) {
            lblDevice.innerHTML = label;
        }
    };


    // Gaze-tracking events
    var onstate = function (state) {
        updatePixelConverter();
        if (controlPanel) {
            updateControlPanel(state);
        }
        if (bool(settings.pointer.show)) {
            pointer.style.display = state.isTracking ? 'block' : 'none';
        }
        if (progress) {
            progress.style.display = state.isTracking ? 'block' : 'none';
        }
        if (typeof callbacks.state === 'function') {
            callbacks.state(state);
        }

        var key, chgd;
        if (state.isTracking) {
            if (settings.frequency >= 10 && settings.frequency <= 100) {
                samplingTimer = setTimeout(processData, 1000 / settings.frequency);
                samplingStart = (new Date()).getTime();
                sampleCount = 0;
            }
            if (smoother) {
                smoother.init();
            }
            if (scroller) {
                scroller.init();
            }
            
            focused = null;
            lastFocused = null;
            selected = null;
            lastSample = null;

            $.etudriver.updateTargets();

            FixationDetector.reset();
            for (key in chgDetectors) {
                chgd = chgDetectors[key];
                chgd.init(chgd.modes.detection);
            }
        }
        else {
            for (key in chgDetectors) {
                chgd = chgDetectors[key];
                chgd.finilize();
            }
            if (samplingTimer) {
                clearTimeout(samplingTimer);
                samplingTimer = 0;
            }
            var i;
            for (i = 0; i < targets.length; i += 1) {
                var target = targets[i];
                target.gaze.focused = false;
                target.gaze.selected = false;
                if (target.gaze.mapping.className) {
                    target.classList.remove(target.gaze.mapping.className);
                }
            }
            if (currentKeyboard) {
                currentKeyboard.hide();
            }
            
            if (state.isStopped && scroller) {
                scroller.reset();
            }
        }
    };

    var ondata = function (ts, x, y, pupil, ec) {
        var point = screenToClient(x, y);
        if (bool(settings.headCorrector.enabled) && ec) {
            if (!lastSample) {
                headCorrector.init(ec);
            }
            point = headCorrector.correct(point, ec);
        }

        if (typeof callbacks.sample === 'function') {
            callbacks.sample(ts, point.x, point.y, pupil, ec);
        }

        if (controlPanel && settings.panel.displaySamples) {
            var formatValue = function (value, size) {
                var result = value + ',';
                while (result.length < size) {
                    result += ' ';
                }
                return result;
            };
            var log = 't = ' + formatValue(ts, 6) +
                ' x = ' + formatValue(point.x, 5) +
                ' y = ' + formatValue(point.y, 5) +
                ' p = ' + formatValue(pupil, 4);

            if (ec !== undefined) {
                log += 'ec: { ';
                var v;
                for (v in ec) {
                    log += v + ' = ' + ec[v] + ', ';
                }
                log += '}';
            }

            lblLog.innerHTML = log;
        }

        FixationDetector.feed(ts, point.x, point.y);
        
        map(settings.mapping.type, point.x, point.y);
        if (ec) {
            var canSelect;
            if (nodDetector) {
                canSelect = focused &&
                                focused.gaze.selection.type === $.etudriver.selection.nod;
                nodDetector.feed(ts, point.x, point.y, pupil, ec, canSelect ? focused : null);
            }
            for (var key in chgDetectors) {
                var chgd = chgDetectors[key];
                canSelect = focused &&
                                focused.gaze.selection.type === $.etudriver.selection.customHeadGesture && 
                                focused.gaze.selection.name === chgd.getName();
                chgd.feed(ts, ec, canSelect ? focused : null);
            }
            if (settings.scroller.type === $.etudriver.scroller.headPose) {
                scroller.feed(ec);
            }
        }
        
        checkIfSelected(ts, point.x, point.y, pupil, ec);
        
        if (lastFocused) {
            updateProgress(bool(lastFocused.gaze.selection.showProgress) ? lastFocused : null);
        }
        
        if (bool(settings.pointer.show)) {
            if (pointer.style.display !== 'block') {
                pointer.style.display = 'block';
            }
            var pt = {x: 0, y: 0};
            if (settings.mapping.source == $.etudriver.source.samples) {
                pt.x = point.x; 
                pt.y = point.y;
            } else if (settings.mapping.source == $.etudriver.source.fixations) {
                if (FixationDetector.currentFix) {
                    pt.x = FixationDetector.currentFix.x; 
                    pt.y = FixationDetector.currentFix.y;
                }
            }
            if (smoother) {
                pt = smoother.smooth(ts, pt.x, pt.y);
            }
            pointer.style.left = (pt.x - settings.pointer.size / 2) + 'px';
            pointer.style.top = (pt.y - settings.pointer.size / 2) + 'px';
        } else if (pointer.style.display !== 'none') {
            pointer.style.display = 'none';
        }
        
        lastSample = {
            ts: ts,
            x: x,
            y: y,
            pupil: pupil,
            ec: ec
        };
    };

    // Mapping
    var isDisabled = function (target) {
        var result = (!!currentKeyboard && !target.classList.contains(keyboardMarkers.button))
                    || target.style.visibility === 'hidden' 
                    || target.classList.contains(keyboardMarkers.indicator);
        return result;
    }
    
    var map = function (type, x, y) {
        var choices = $.etudriver.mapping;
        var source = $.etudriver.source;
        var mapped = null;

        if (settings.mapping.source == source.fixations && FixationDetector.currentFix) {
            x = FixationDetector.currentFix.x;
            y = FixationDetector.currentFix.y;
        }
        
        switch (type) {
        case choices.naive:
            mapped = mapNaive(x, y);
            break;
        case choices.expanded:
            mapped = mapExpanded(x, y);
            break;
        default:
            break;
        }

        if (mapped !== focused) {
            var event;
            if (focused) {
                focused.gaze.focused = false;
                if (focused.gaze.mapping.className) {
                    focused.classList.remove(focused.gaze.mapping.className);
                }
                event = new Event($.etudriver.event.left);
                focused.dispatchEvent(event);
                
                if (typeof callbacks.target === 'function') {
                    callbacks.target($.etudriver.event.left, focused);
                }
            }
            if (mapped) {
                mapped.gaze.focused = true;
                if (mapped.gaze.mapping.className) {
                    mapped.classList.add(mapped.gaze.mapping.className);
                }
                event = new Event($.etudriver.event.focused);
                mapped.dispatchEvent(event);
                
                if (typeof callbacks.target === 'function') {
                    callbacks.target($.etudriver.event.focused, mapped);
                }
                
                relocateProgress(mapped);
            }
            focused = mapped;
            if (focused) {
                lastFocused = focused;
            }
        }
    };

    var mapNaive = function (x, y) {
        var mapped = null;
        var i;
        for (i = 0; i < targets.length; i += 1) {
            var target = targets[i];
            if (isDisabled(target)) {
                continue;
            }
            
            var rect = target.getBoundingClientRect();
            if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) {
                if (mapped) {
                    if (document.elementFromPoint(x, y) === target) {
                        mapped = target;
                        break;
                    }
                } else {
                    mapped = target;
                }
            }
        }
        return mapped;
    };

    var mapExpanded = function (x, y) {
        var mapped = null;
        var i;
        var minDist = Number.MAX_VALUE;
        for (i = 0; i < targets.length; i += 1) {
            var target = targets[i];
            if (isDisabled(target)) {
                continue;
            }
            
            var rect = target.getBoundingClientRect();
            var dx = x < rect.left ? rect.left - x : (x > rect.right ? x - rect.right : 0);
            var dy = y < rect.top ? rect.top - y : (y > rect.bottom ? y - rect.bottom : 0);
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist && dist < settings.mapping.expansion) {
                mapped = target;
                minDist = dist;
            } else if (dist === 0) {
                if (document.elementFromPoint(x, y) === target) {
                    mapped = target;
                    break;
                }
            }
        }
        return mapped;
    };

    // Selection
    var checkIfSelected = function (ts, x, y, pupil, ec) {
        var choices = $.etudriver.selection;
        var result = null;
        var i;
        
        for (i = 0; i < targets.length; i += 1) {
            var target = targets[i];
            if (isDisabled(target)) {
                continue;
            }
            
            switch (target.gaze.selection.type) {
            case choices.competitiveDwell:
                if (lastSample) {
                    if (selectCompetitiveDwell(target, ts - lastSample.ts)) {
                        result = target;
                    }
                }
                break;
            case choices.simpleDwell:
                if (FixationDetector.currentFix && lastSample) {
                    if (selectSimpleDwell(target, ts - lastSample.ts)) {
                        result = target;
                    }
                }
                break;
            case choices.nod:
                result = nodDetector.current;
                break;
            case choices.customHeadGesture:
                for (var key in chgDetectors) {
                    var chgd = chgDetectors[key];
                    result = chgd.current || result;
                }
                break;
            default:
                break;
            }
            
            if (result) {
                break;
            }
        }

        if (result !== selected) {
            if (selected) {
                selected.gaze.selected = false;
            }

            if (result) {
                result.gaze.selected = true;
                if (result.gaze.selection.className) {
                    result.classList.add(result.gaze.selection.className);
                    setTimeout(function () {
                        result.classList.remove(result.gaze.selection.className);
                    }, result.gaze.selection.duration);
                }

                if (result.gaze.selection.audio) {
                    result.gaze.selection.audio.play();
                }
                var event = new Event($.etudriver.event.selected);
                result.dispatchEvent(event);
                
                if (typeof callbacks.target === 'function') {
                    callbacks.target($.etudriver.event.selected, result);
                }
                
                if (result.gaze.keyboard) {
                    result.gaze.keyboard.show(result);
                }
            }

            selected = result;
        }
    };

    var selectCompetitiveDwell = function (target, duration) {
        var result = false;
        var i;
        if (target === focused) {
            target.gaze.attention += duration;
            if (target.gaze.attention >= target.gaze.selection.dwellTime) {
                result = true;
                for (i = 0; i < targets.length; i += 1) {
                    var t = targets[i];
                    if (t.gaze.selection.type === $.etudriver.selection.competitiveDwell) {
                        t.gaze.attention = 0;
                    }
                }
            }
        } else {
            target.gaze.attention = Math.max(0, target.gaze.attention - duration);
        }
        
        return result;
    };

    var selectSimpleDwell = function (target, duration) {
        var result = false;
        if (target === focused) {
            target.gaze.attention += duration;
            for (var i = 0; i < targets.length; i += 1) {
                var t = targets[i];
                if (t.gaze.selection.type === $.etudriver.selection.simpleDwell && t !== target) {
                    t.gaze.attention = 0;
                }
            }
            if (target.gaze.attention >= target.gaze.selection.dwellTime) {
                result = true;
                target.gaze.attention = 0;
            }
        } else {
            target.gaze.attention = 0;
        }
        return result;
    };

    // Progress
    var relocateProgress = function (mapped) {
        if (progress && typeof mapped.gaze.selection.dwellTime !== 'undefined') {
            var rect = mapped.getBoundingClientRect();
            progress.style.left = Math.round(rect.left + (rect.width - settings.progress.size) / 2) + 'px';
            progress.style.top = Math.round(rect.top + (rect.height - settings.progress.size) / 2) + 'px';
        }
    };

    var updateProgress = function (target) {
        if (progress) {
            var ctx = progress.getContext('2d');
            var size = settings.progress.size;
            ctx.clearRect(0, 0, size, size);
            
            if (target) {
                var p = Math.min(1.0, (target.gaze.attention - settings.progress.delay) / (target.gaze.selection.dwellTime - settings.progress.delay));
                if (p > 0.0) {
                    ctx.beginPath();
                    ctx.lineWidth = Math.max(settings.progress.minWidth, size / 10);
                    ctx.arc(size / 2, size / 2, 0.45 * size, -0.5 * Math.PI,
                        -0.5 * Math.PI + 2.0 * Math.PI * p);
                    ctx.strokeStyle = settings.progress.color;
                    ctx.stroke();
                }
            }
        }
    };
    
    // Panel
    var updateControlPanel = function (state) {
        if (state.device) {
            lblDevice.innerHTML = state.device;
        }
        btnShowOptions.disabled = !websocket || state.isTracking || state.isBusy;
        btnCalibrate.disabled = !state.isConnected || state.isTracking || state.isBusy;
        btnStartStop.disabled = !state.isCalibrated || state.isBusy;
        btnStartStop.value = state.isTracking ? 'Stop' : 'Start';

        if (!state.isTracking && state.isCalibrated) {
            lblLog.innerHTML = '';
        }
    };

    // Helpers
    var updateState = function (flags, device) {
        var isStopped = false;
        if (flags !== undefined) {
            isStopped = (currentStateFlags & stateFlags.tracking) > 0 && (flags & stateFlags.tracking) === 0;
            currentStateFlags = flags;
        } else {
            flags = currentStateFlags;
        }

        if (device !== undefined) {
            currentDevice = device;
        } else {
            device = currentDevice;
        }
        
        return {
            isServiceRunning: !!websocket,
            isConnected:  (currentStateFlags & stateFlags.connected) > 0,
            isCalibrated: (currentStateFlags & stateFlags.calibrated) > 0,
            isTracking:   (currentStateFlags & stateFlags.tracking) > 0,
            isBusy:       (currentStateFlags & stateFlags.busy) > 0,
            isStopped:    isStopped,
            device:       currentDevice
        };
    };

    var updatePixelConverter = function () {

        if (window.mozInnerScreenX !== undefined) {    // Firefox

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

                //console.log('zoom = ' + (result / divisor) + ', calculated in ' + cycles + ' cycles');
                return result / divisor;
            })(5);

            zoom = {
                x: zoomLevel,
                y: zoomLevel
            };

            offset = {
                x: window.mozInnerScreenX * zoomLevel,
                y: window.mozInnerScreenY * zoomLevel
            };
        } else {    // Chrome
            zoom = {
                x: devicePixelRatio,
                y: devicePixelRatio
            };

            var innerWidth = window.innerWidth * zoom.x;
            var innerHeight = window.innerHeight * zoom.y;

            offset = {
                x: window.screenX + (window.outerWidth - innerWidth) / 2,
                y: window.screenY + (window.outerHeight - innerHeight) - (window.outerWidth - innerWidth) / 2
            };
        }
    };

    var screenToClient = function (x, y) {
        return {
            x: (x - offset.x) / zoom.x,
            y: (y - offset.y) / zoom.y
        };
    };

    var processData = function () {
        sampleCount += 1;
        var s = null;
        if (buffer.length) {
            var x = 0.0;
            var y = 0.0;
            var p = 0.0;
            var ec = {xl: 0.0, yl: 0.0, xr: 0.0, yr: 0.0};
            for (var i = 0; i < buffer.length; i += 1) {
                var sample = buffer[i];
                x += sample.x;
                y += sample.y;
                p += sample.pupil;
                if (sample.ec) {
                    ec.xl += sample.ec.xl;
                    ec.yl += sample.ec.yl;
                    ec.xr += sample.ec.xr;
                    ec.yr += sample.ec.yr;
                }
            }
            s = {ts: Math.round(sampleCount * (1000.0 / settings.frequency)),
                x: x / buffer.length,
                y: y / buffer.length,
                pupil: p / buffer.length,
                ec: {
                    xl: ec.xl / buffer.length,
                    yl: ec.yl / buffer.length,
                    xr: ec.xr / buffer.length,
                    yr: ec.yr / buffer.length
                }
            };
            buffer = [];
        } else if (lastSample) {
            s = lastSample;
        }
        if (s) {
            ondata(s.ts, s.x, s.y, s.pupil, s.ec);
        }
        var now = (new Date()).getTime();
        var nextAt = Math.round(samplingStart + (sampleCount + 1) * (1000.0 / settings.frequency));
        var pause = Math.max(0, nextAt - now);
        samplingTimer = setTimeout(processData, pause);
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
     * http://jquery.com/
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

    var bool = function (value) {
        if (typeof value === 'function') {
            return value();
        }
        return !!value;
    };