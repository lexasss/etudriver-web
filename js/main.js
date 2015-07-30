(function (root) {

    'use strict';

    var GazeTargets = GazeTargets|| {};

    GazeTargets.mapping = {};
    GazeTargets.selection = {};
    GazeTargets.scroller = {};
    GazeTargets.keyboard = {};

    GazeTargets.mapping.types = {
        // no mapping (= samples are not processed)
        none: 0,
        
        // mapping is based on the exact location and size of targets 
        // no extra settings
        naive: 1,
        
        // mapping is based on the extended size of targets
        // extra settings for settings.mapping:
        //   expansion      - expansion size in pixels
        expanded: 2
    };

    GazeTargets.mapping.sources = {
        samples: 0,
        fixations: 1
    };

    GazeTargets.mapping.settings = {
        defaults: {                 // default mapping settings
            className: 'gt-focused'       // this class is added to the focused element
        },
        
        // type-dependent settings
        expanded: {
            expansion: 50
        }
    };

    GazeTargets.selection.types = {
        // no extra  settings for targets[].selection
        none: 0,
        
        // extra settings for settings.targets[].selection:
        //   dwellTime      - dwell time in ms
        cumulativeDwell: 1,
        
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
    };

    GazeTargets.selection.settings = {     // default settings for all targets
        defaults: {                     // default selection settings
            className: 'gt-selected', // this class is added to the selected element
            duration: 200,              // the duration to stay the 'className' in the list of classes
            audio: 'click.wav'          // audio file played on selection
        },
        
        // type-dependent settings
        cumulativeDwell: {
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
    };

    GazeTargets.events = {        // generated events
        focused: 'focused',
        left: 'left',
        selected: 'selected'
    };

    GazeTargets.scroller.types = [
        'smooth',
        'page'
    ];

    GazeTargets.scroller.controllers = {
        fixation: 0,
        headPose: 1
    };

    GazeTargets.scroller.settings = {
        type: GazeTargets.selection.types.cumulativeDwell,
        className: '',
        duration: 0,  
        audio: '',
        dwellTime: 800,
        showProgress: false
    };

    GazeTargets.keyboard.types = {     // available keyboards
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
                                                  the function GazeTargets.keyboard.[NAME].callbacks.mycommand
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
                container: 'gt-keyboardDefault',      // keyboard container CSS class
                button: 'gt-keyboard-buttonDefault'   // keyboard button CSS class
            },
            selection: {    // see settings.targets.selection for comments
                type: 1
            },
            mapping: { },   // see settings.targets.mapping for comments
        }
    };

    // Settings with defaults values
    GazeTargets.settings = {
        etudriver: {
            panel: {            // default control panel settings with eye-tracking control buttons
                show: true,               // boolean flag
                displaySamples: false,    // flag to display sample data, if panel is visible
                id: 'gt-panel',     // the panel id
                connectedClassName: 'gt-panel-connected'  // the class to apply then WebSocket is connected
            },
            communicator: {
                port: 8086,         // the port the WebSocket works on
                frequency: 0        // sampling frequency in Hz, between 10 and 1000 (other values keep the original tracker frequency)
            }
        }
        targets: [          // list of target definitions
            {
                selector: '.gt-target',   // elements with this class name will be used 
                                            //   in gaze-to-element mapping procedure
                keyboard: null,             // keyboard to shown on selection, 'name' from GazeTargets.keyboard
                selection: {                // target selection settings that what happens on selection; accepts:
                                            //  - 'type', see GazeTargets.selection
                                            //  - the keys from GazeTargets.settings.selection.defaults
                                            //  - the keys from GazeTargets.settings.selection.[TYPE] 
                                            //    (see comments to the corresponding type in GazeTargets.selection)
                    type: GazeTargets.selection.types.cumulativeDwell   // the default selection type
                },
                mapping: {                  // specifies what happens when a target gets attention; accepts:
                                            //  - the keys from GazeTargets.settings.mapping.defaults
                }
            }
        ],
        mapping: {          // mapping setting for all targets; accepts:
                                                //  - 'type' and 'sources', see below
                                                //  - the keys from GazeTargets.settings.mapping.[TYPE]
                                                //    (see comments to the corresponding type in GazeTargets.mapping)
            type: GazeTargets.mapping.types.naive,    // mapping type, see GazeTargets.mapping
            source: GazeTargets.mapping.sources.samples, // data source for mapping, see GazeTargets.source
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
        css: {                    // the CSS to load at the initialization 
            file: 'gazeTargets',  // CSS file
            useVersion: true      // the flag to search for the same version as the JS file is; if false, searches for <file>.css
        },
        scroller: {         // scroller settings                   
            enabled: false,         // enabled/disabled
            targets: {},            // to be filled dynamically
            speeds: [2, 7, 15, -1], // definition of cells: 
                // >0: speed per step in pixels,
                // 0: no scrolling,
                // -1: scrolling by page
            controller: GazeTargets.scroller.controllers.headPose,    // the scrolling controller
            className: 'gt-scroller', // class name
            imageFolder: 'images/scroller/', // location of images
            size: 80,                   // height in pixels
            delay: 800,                 // ms
            headPose: {                 // settings for the head-pose mode
                threshold: 0.005,       // threshold
                transformParam: 500     // transformation coefficient
            }
        },
        calibVerifier: {
            display: true,              // set to false if custom targets will be displayed
            rows: 4,
            columns: 5,
            size: 12,                   // target size in pixels
            duration: 1500,             // target exposition time; note that sample gathering starts 500ms after a target is displayed
            transitionDuration: 800,    // time to travel from one location to another; set to 0 for no animation
            displayResults: 60,         // results display time in seconds; set to 0 not to display the result
            interpretationThreshold: 20,// amplitude difference threshold (px) used in the interpretation of the verification results
            pulsation: {
                enabled: false,         // if set to "true", the target has "aura" that pulsates
                duration: 600,          // pulsation cycle duration, ms
                size: 20                // size of "aura", px
            },
            className: {
                container: 'gt-calibVerifier-containerDefault',
                target: 'gt-calibVerifier-targetDefault',
                pulsator: 'gt-calibVerifier-pulsatorDefault'
            },
            resultColors: {                // colors of the object painted in the resulting view
                target: '#444',
                sample: '#48C',
                offset: 'rgba(224,160,64,0.5)',
                text: '#444'
            }
        }
    };

    // event handlers
    GazeTargets.callbacks = {
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
        //   event - a value from GazeTargets.event
        //   target - the target
        target: null,
        
        // Fires on a keyboard visibility change
        // arguments:
        //  - keyboard: the keyboard
        //  - visible: the visibility flag
        keyboard: null
    };

    // Initialization.
    //   Must be called when a page is loaded
    //   arguments:
    //      - customSettings: overwrites the default settings, see settings variable
    //      - customCallbacks: fills the 'callbacks' object with handlers
    GazeTargets.init = function (customSettings, customCallbacks) {
        // shortcuts
        var settings = GazeTargets.settings;
        var utils = GazeTargets.utils;
        var keyboardTypes = GazeTargets.keyboard.types;
        
        // get the lib path
        var script = utils.detectPath();
        var path = script !== false ? script.path : '';
        
        // combine the default and custom settings
        utils.extend(true, GazeTargets.settings, customSettings);
        
        // add callbacks
        utils.extend(true, GazeTargets.callbacks, customCallbacks);
        
        // initialize ETUDriver
        root.ETUDriver.init(settings.etudriver, 
            { 
                ondata: ondata,
                onstate: onstate
            }, 
            storage.etudriver);

        // create and configure the rest components
        var required = {
            dwellProgress: false,
            nodDetector: false,
            customHeadGestureDetectors = {}
        };
        
        for (var idx in settings.targets) {
            var targetSettings = settings.targets[idx];
            configureTargetSettings(targetSettings, required, path);
        }
        
        for (var kbd in keyboardTypes) {
            createKeyboard(keyboardTypes[kbd]);
        }

        switch (settings.mapping.type) {
        case GazeTargets.mapping.types.expanded:    
            utils.extend(true, true, settings.mapping, GazeTargets.mapping.settings.expanded);
            break;
        }
        
        if (settings.css.file) {
            var fileName = path + settings.css.file;
            if (settings.css.useVersion && script.version) {
                fileName += '-' + script.version;
            }
            fileName += '.css';
            loadCSS(fileName);
        }

        createPointer();
        
        fixdet = new GazeTargets.FixationDetector(settings.fixdet);
        
        headCorrector = new GazeTargets.HeadCorrector(settings.headCorrector);

        createScrollerSettings();

        scroller = new GazeTargets.Scroller(settings.scroller);
        calibVerifier = new GazeTargets.CalibrationVerifier(settings.calibVerifier);
        
        // Smoother
        if (root.Utils.bool(settings.pointer.smoothing.enabled)) {
            smoother = new GazeTargets.Smoother(settings.pointer.smoothing);
        }

        // Dwell progress       
        if (required.dwellProgress) {
            progress = createDwellProgress();
        }
        
        // Multiple node detectors may exists, the settings should come from settings.targets[type == 'nod'].selection
        if (required.nodDetector) {
            nodDetector = new GazeTargets.HeadGestureDetector(GazeTargets.selection.settings.nod, settings.headGesture);
        }
        
        createCalibrationList(required.customHeadGestureDetectors);
        
        GazeTargets.updateTargets();
    };

    // Updates the list of targets
    // Must be called when a target was added, removed, or relocated
    // Adds an object "gaze" to the DOM element with the following properties:
    //  - focused: boolean
    //  - selected: boolean
    //  - attention: integer, holds the accumulated attention time (used for GazeTraker.selection.types.cumulativeDwell)
    //  - selection: type of selection method (from  GazeTraker.selection.types)
    //  - mapping: type of mapping method (from GazeTraker.mapping.types)
    //  - keyboard: null, or the keyboard that is available currently for the input into this element
    GazeTargets.updateTargets = function () {
        // shortcuts
        var settings = GazeTargets.settings;
        
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
    GazeTargets.calibrateCustomHeadGesture = function (name, onfinished) {
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

    // Return the keyboard of the given name
    GazeTargets.getKeyboard = function (name) {
        return keyboards[name];
    }

    // Starts calibration verification routine
    // arguments:
    //  - settings:
    //      see settings.calibVerifier for description
    //  - callback:
    //      - started: is call before the first target is displayed
    //          - target = {
    //              location: {x, y},   : the normalized (0..1) target location on screen
    //              cell: {row, col}}   : the cell in whose center the target is displayed
    //      - pointStarted: is call for every target when it appears. arguments:
    //          - target = {
    //              location: {x, y},   : the normalized (0..1) target location on screen
    //              cell: {row, col}}   : the cell in whose center the target is displayed
    //      - pointFinished: is call for every target after data collection is finished. arguments:
    //          - finished = {          : the target just finished
    //              location: {x, y},   : the normalized (0..1) target location on screen
    //              cell: {row, col},   : cell indexes (>= 0)
    //              samples: []}        : samples collected
    //          - next = {              : next target to appear, or null if the finished target was the last
    //              location: {x, y},   : the normalized (0..1) target location on screen
    //              cell: {row, col}}   : the cell in whose center the target is displayed
    //      - finished: the verification is finished. arguments:
    //          - result = {
    //              targets: [{              : the array of means of the offset, its angle and STD for each target,
    //                  amplitude, angle, std,      elements also contains the target's cell and 
    //                  location, cell}],           the displayed location in PIXELS
    //              amplitude: {mean, std},  : mean and deviation of the offsets
    //              angle: {mean, std},      : mean and deviation of the offset angles (radians)
    //              std: {mean, std},        : mean and deviation of the deviations of offsets
    //              apx: {h: [], v: []},     : arrays of "a" for horizontal and vertical approximation by a0 + a1*x + a2*x^2
    //              interpretation: {        : interpretation of the calibration verification:
    //                  text: [s, f],        : 2 strings with the (s)uccessful and (f)ailed interpretation results, 
    //                  rating}              : and the calibration rating
    //            }
    GazeTargets.verifyCalibration  = function (customSettings, customCallbacks) {
        calibVerifier.run(customSettings, customCallbacks);
    }


    // Internal

    // consts
    
    // variable to store in browser's storage
    var storage = {
        etudriver: {
            device: {
                id: 'gt-device',
                default: 'Mouse'
            }
        }
    };

    // privat members
    var targets = [];

    var keyboardMarkers = {
        button: 'gt-keyboard-keyMarker',
        indicator: 'gt-keyboard-indicator'
    };

    // operation variables, must be reset when the tracking starts
    var focused = null;
    var lastFocused = null;
    var selected = null;
    var lastSample = null;

    // other objects
    var fixdet = null;
    var pointer = null;
    var progress = null;
    var headCorrector = null;
    var smoother = null;
    var nodDetector = null;
    var chgDetectors = {};
    var keyboards = {};
    var currentKeyboard = null;
    var scroller = null;
    var calibVerifier = null;

    var path = '';


    // Gaze-tracking events
    var ondata = function (ts, x, y, pupil, ec) {
        var point = root.Utils.screenToClient(x, y);
        
        if (calibVerifier.isActive()) { // feed unprocessed gaze points to calibration verifier
            calibVerifier.feed(ts, x, y);
        }
        
        if (root.Utils.bool(settings.headCorrector.enabled) && ec) {
            if (!lastSample) {
                headCorrector.init(ec);
            }
            point = headCorrector.correct(point, ec);
        }

        if (typeof callbacks.sample === 'function') {
            callbacks.sample(ts, point.x, point.y, pupil, ec);
        }

        if (controlPanel && root.Utils.bool(settings.panel.displaySamples)) {
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

        fixdet.feed(ts, point.x, point.y);
        
        map(settings.mapping.type, point.x, point.y);
        if (ec) {
            var canSelect;
            if (nodDetector) {
                canSelect = focused &&
                                focused.gaze.selection.type === GazeTargets.selection.types.nod;
                nodDetector.feed(ts, point.x, point.y, pupil, ec, canSelect ? focused : null);
            }
            for (var key in chgDetectors) {
                var chgd = chgDetectors[key];
                canSelect = focused &&
                                focused.gaze.selection.type === GazeTargets.selection.types.customHeadGesture && 
                                focused.gaze.selection.name === chgd.getName();
                chgd.feed(ts, ec, canSelect ? focused : null);
            }
            if (GazeTargets.settings.scroller.controller === GazeTargets.scroller.controllers.headPose) {
                scroller.feed(ec);
            }
        }
        
        checkIfSelected(ts, point.x, point.y, pupil, ec);
        
        if (lastFocused) {
            updateProgress(root.Utils.bool(lastFocused.gaze.selection.showProgress) ? lastFocused : null);
        }
        
        if (root.Utils.bool(settings.pointer.show)) {
            if (pointer.style.display !== 'block') {
                pointer.style.display = 'block';
            }
            var pt = {x: 0, y: 0};
            if (settings.mapping.source == GazeTargets.mapping.sources.samples) {
                pt.x = point.x; 
                pt.y = point.y;
            } else if (settings.mapping.source == GazeTargets.mapping.sources.fixations) {
                if (fixdet.currentFix) {
                    pt.x = fixdet.currentFix.x; 
                    pt.y = fixdet.currentFix.y;
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

    var onstate = function (state) {
        if (root.Utils.bool(settings.pointer.show)) {
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

            GazeTargets.updateTargets();

            fixdet.reset();
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
    }

    // Mapping
    var isDisabled = function (target) {
        var result = (!!currentKeyboard && !target.classList.contains(keyboardMarkers.button))
                    || target.style.visibility === 'hidden' 
                    || target.classList.contains(keyboardMarkers.indicator);
        return result;
    }

    var map = function (type, x, y) {
        var mappingTypes = GazeTargets.mapping.types;
        var mapped = null;

        if (settings.mapping.source == GazeTargets.mapping.sources.fixations && fixdet.currentFix) {
            x = fixdet.currentFix.x;
            y = fixdet.currentFix.y;
        }
        
        switch (type) {
        case mappingTypes.naive:
            mapped = mapNaive(x, y);
            break;
        case mappingTypes.expanded:
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
                event = new Event(GazeTargets.events.left);
                focused.dispatchEvent(event);
                
                if (typeof callbacks.target === 'function') {
                    callbacks.target(GazeTargets.events.left, focused);
                }
            }
            if (mapped) {
                mapped.gaze.focused = true;
                if (mapped.gaze.mapping.className) {
                    mapped.classList.add(mapped.gaze.mapping.className);
                }
                event = new Event(GazeTargets.events.focused);
                mapped.dispatchEvent(event);
                
                if (typeof callbacks.target === 'function') {
                    callbacks.target(GazeTargets.events.focused, mapped);
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
        var selTypes = GazeTargets.selection.types;
        var result = null;
        var i;
        
        for (i = 0; i < targets.length; i += 1) {
            var target = targets[i];
            if (isDisabled(target)) {
                continue;
            }
            
            switch (target.gaze.selection.type) {
            case selTypes.cumulativeDwell:
                if (lastSample) {
                    if (selectCumulativeDwell(target, ts - lastSample.ts)) {
                        result = target;
                    }
                }
                break;
            case selTypes.simpleDwell:
                if (fixdet.currentFix && lastSample) {
                    if (selectSimpleDwell(target, ts - lastSample.ts)) {
                        result = target;
                    }
                }
                break;
            case selTypes.nod:
                result = nodDetector.current;
                break;
            case selTypes.customHeadGesture:
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
                var event = new Event(GazeTargets.events.selected);
                result.dispatchEvent(event);
                
                if (typeof callbacks.target === 'function') {
                    callbacks.target(GazeTargets.events.selected, result);
                }
                
                if (result.gaze.keyboard) {
                    result.gaze.keyboard.show(result);
                }
            }

            selected = result;
        }
    };

    var selectCumulativeDwell = function (target, duration) {
        var result = false;
        var i;
        if (target === focused) {
            target.gaze.attention += duration;
            if (target.gaze.attention >= target.gaze.selection.dwellTime) {
                result = true;
                for (i = 0; i < targets.length; i += 1) {
                    var t = targets[i];
                    if (t.gaze.selection.type === GazeTargets.selection.types.cumulativeDwell) {
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
                if (t.gaze.selection.type === GazeTargets.selection.types.simpleDwell && t !== target) {
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

    // Helping functions
    function loadCSS(href) {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        link.media = 'all';
        head.appendChild(link);
    };

    function createCalibrationList(required) {
        // if (!controlPanel) {
        //     return;
        // }
        
        var addClickHandler = function (btn, name) {
            btn.addEventListener('click', function () { 
                GazeTargets.calibrateCustomHeadGesture(name, function (state) {
                    if (state === 'finished') {
                        // TODO: handle finished event;
                    }
                });
            });
        };

        var list = document.getElementById('gt-chgd-calibList');
        for (var name in required) {
            if (!chgDetectors[name]) {
                chgDetectors[name] = new GazeTargets.CustomHeadGestureDetector(name, GazeTargets.settings.customHeadGestureDetector);
                var li = document.createElement('li');
                var btn = document.createElement('input');
                btn.type = 'button';
                btn.value = name.charAt(0).toUpperCase() + name.slice(1);
                addClickHandler(btn, name);
                li.appendChild(btn);
                list.appendChild(li);
            }
        }
        
        if (list.hasChildNodes()) {
            document.getElementById('gt-chgd-calibMenu').style.display = 'inline';
        }
    };

    function createPointer() {
        var pointerSettings = GazeTargets.settings.pointer;
        pointer = document.createElement('div');
        pointer.className = 'gt-pointer';
        var s = pointer.style;
        s.display = 'none'
        s.backgroundColor = pointerSettings.pointer.color;
        s.opacity = pointerSettings.opacity;
        s.borderRadius = (pointerSettings.size / 2).toFixed(0) + 'px';
        s.height = pointerSettings.size + 'px';
        s.width = pointerSettings.size + 'px';
        document.body.appendChild(pointer);
    };

    function createDwellProgress() {
        var progressSettings = GazeTargets.settings.progress;
        var progress = document.createElement('canvas');
        progress.className = 'gt-progress';
        progress.height = progressSettings.size;
        progress.width = progressSettings.size;
        progress.style.display = 'none';
        document.body.appendChild(progress);
        return progress;
    }

    function createKeyboard(keyboardParams) {
        // shortcuts
        var callbacks = GazeTargets.callbacks;
        
        if (!keyboardParams.selection || !keyboardParams.selection.type) {
            keyboardParams.selection = { type: GazeTargets.selection.types.cumulativeDwell };
        }

        // extend the keyboard parameter with 'selection' and 'mapping'
        configureTargetSettings(keyboardParams);
        keyboardParams.name = kbd;
        
        GazeTargets.keyboards[kbd] = new Keyboard(keyboardParams, keyboardMarkers, {
            hide: function () {
                if (callbacks.keyboard) {
                    callbacks.keyboard(currentKeyboard, false);
                }
                GazeTargets.currentKeyboard = null;
                GazeTargets.updateTargets();
            },
            show: function (keyboard) {
                GazeTargets.currentKeyboard = keyboard;
                if (callbacks.keyboard) {
                    callbacks.keyboard(currentKeyboard, true);
                }
                GazeTargets.updateTargets();
            }
        });
    }

    function createScrollerSettings() {
        // shortcuts
        var settings = GazeTargets.settings;
        
        var selection = settings.scroller.controller === GazeTargets.scroller.controllers.fixation ? 
                    GazeTargets.scroller.selection : 
                    { type: GazeTargets.selection.types.none };

        var mapping = { className: '' };

        for (var scrollTypeIdx in GazeTargets.scroller.types) {
            var scrollType = GazeTargets.scroller.types[scrollTypeIdx]
            var targetSettings = {
                selector: '.' + settings.scroller.className + '-' + scrollType,
                selection: selection,
                mapping: mapping
            };
            
            settings.scroller.targets[scrollType] = targetSettings;
            configureTargetSettings(targetSettings);
        }
    }

    function configureTargetSettings(targetSettings, required, path) {
        // shortcuts
        var settings = GazeTargets.settings;
        var utils = GazeTargets.utils;
        var selection = GazeTargets.selection;
        var mapping = GazeTargets.mapping;
        
        targetSettings.selection = utils.extend(true, {}, selection.settings.defaults, targetSettings.selection);
        targetSettings.mapping = utils.extend(true, {}, mapping.settings.defaults, targetSettings.mapping);
        switch (targetSettings.selection.type) {
        case selection.types.cumulativeDwell:
            utils.extend(true, true, targetSettings.selection, selection.settings.cumulativeDwell);
            break;
        case selection.types.simpleDwell:
            utils.extend(true, true, targetSettings.selection, selection.settings.simpleDwell);
            break;
        case selection.types.nod:
            utils.extend(true, true, targetSettings.selection, selection.settings.nod);
            break;
        }
        
        if (targetSettings.selection.dwellTime !== undefined) {
            required.dwellProgress = true;
        }
        if (targetSettings.selection.type === selection.types.nod) {
            required.nodDetector = true;
        }
        if (targetSettings.selection.type === selection.types.customHeadGesture) {
            var name = targetSettings.selection.name || 'default';
            required.customHeadGestureDetectors[name] = true;
        }

        if (targetSettings.selection.audio) {
            targetSettings.selection.audio = new Audio(path + targetSettings.selection.audio);
        }
    };

    root.GazeTargets = GazeTargets;

})(window);