// Main script
// Dependencies:
//      utils.js
//      etudPanel.js
//      etudriver.js
//      keyboard.js
//      fixdet.js
//      headCorr.js
//      scroller.js
//      calibVerifier.js
//      fullScreen.js
//      smoother.js
//      pointer.js
//      mapper.js
//      selector.js
//      targets.js
// Depended style sheets:
//      chgd.css
//      etudPanel.css
//      keyboard.css
//      scroller.css
//      calibverifier.css
//      pointer.css
//      progress.css

(function (root) {

    'use strict';

    var GazeTargets = root.GazeTargets || (root.GazeTargets = {});

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
        // extra settings for settings.mapping are listed in GazeTargets.mapping.settings.expanded
        expanded: 2
    };

    GazeTargets.mapping.models = {
        // no model
        none: 0,
        
        // tries to follow the reading lines
        // extra settings for settings.mapping are listed in GazeTargets.mapping.settings.models.reading
        reading: 1
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
            expansion: 50       // expansion size in pixels
        },
        
        // model-dependent settings
        models: {
            reading: {
                maxSaccadeLength: 250,      // maximum progressing saccade length, in pixels
                maxSaccadeAngleRatio: 0.7   // |sacc.y| / sacc.dx
            }
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

    GazeTargets.selection.settings = {  // default settings for all targets
        defaults: {                     // default selection settings
            className: 'gt-selected',   // this class is added to the selected element
            duration: 200,              // the duration to stay the 'className' in the list of classes
            audio: 'sounds/click.wav'   // audio file played on selection
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

    GazeTargets.scroller.selection = {
        type: GazeTargets.selection.types.cumulativeDwell,
        className: '',
        duration: 0,  
        audio: '',
        dwellTime: 800,
        showProgress: false
    };

    GazeTargets.keyboards = {     // available keyboards
        /**
            Keyboards consist of the required layout, and optional custom callback functions, image folder 
            (with '/' at the end), and keyboard and button (key) class names
            
            A layout is described using JSON notation without opening tags.
            
            Rows are separated by periods. Each row is either a string (strings are always surrounded by quotation marks), 
            or an array denoted using brackets "[" and "]". For example:
                " ", [ ]        - two rows.
                
            Arrays consist of strings and objects. Objects are denoted using curly brackets "{" and "}". For example:
                [ " ", { } ]    - a row with 1 buttons described by a string and one button described by an object.
               
            1. Defining buttons with strings

            A string holds a list of buttons separated by period (","). Spaces after periods are not allowed 
            (unless this is a button that will print the space). For example:
                "a,b,c"         - three buttons that will display "a", "b" and "c" letters, and print them when pressed.
                
            Each button may have up to 3 states (lowcase, upcase and other) and states are divided by the vertical line ("|").
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
                
            Certain words used as commands to trigger special functions rather than entering text:
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
                                                  the function GazeTargets.keyboards.[NAME].callbacks.mycommand()
                                                  when selected
            
            2. Defining buttons with JSON objects

            The object general structure is the following:
                { 
                    "titles" : [ ],     - displaying titles, one per state; use the empty string "" for 
                                          not displaying the button in a certain state
                    "commands" : [ ],   - printed signs or functions to be called, one per state
                    "zoom" : [ ]        - horizontal expansion factor; integer or array of integers; the default is 1
                }
            For example: 
                { 
                    "titles" : [ "lowcase.png", "upcase.png", "mycommand.png" ],
                    "commands" : [ "lowcase", "upcase", "custom" ]
                }
                    - the button with lowcase, upcase and custom functions

            If titles (without ".png") and commands coincide, only one array is sufficient. For example:
                { "titles" : ["a", "3", "#"], "zoom" : 2 }
                    - the button is displayed in all 3 states, will print "a", "3" and "#", 
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
    var settings = {
        etudPanel: {                // default control panel settings with eye-tracking control buttons
            show: true,             // boolean flag
            displaySamples: false,  // flag to display sample data, if panel is visible
            id: 'gt-etudpanel',     // the panel id
            connectedClassName: 'gt-etudpanel-connected'  // the class to apply then WebSocket is connected
        },
        etudriver: {
            port: 8086,         // the port the WebSocket works on
            frequency: 0        // sampling frequency in Hz, between 10 and 1000 (other values keep the original tracker frequency)
        },
        targets: [          // list of target definitions
            {
                selector: '.gt-target',   // elements with this class name will be used 
                                          //   in gaze-to-element mapping procedure
                keyboard: null,           // keyboard to shown on selection, 'name' from GazeTargets.keyboard
                selection: {              // target selection settings that what happens on selection; accepts:
                                          //  - 'type', see GazeTargets.selection.types
                                          //  - the keys from GazeTargets.selection.settings.defaults
                                          //  - the keys from GazeTargets.selection.settings.[TYPE] 
                                          //    (see comments to the corresponding type in GazeTargets.selection)
                    type: GazeTargets.selection.types.cumulativeDwell   // the default selection type
                },
                mapping: {                // specifies what happens when a target gets attention; accepts:
                                          //  - the keys from GazeTargets.mapping.settings.defaults
                }
            }
        ],
        mapping: {          // mapping setting for all targets; accepts:
                            //  - 'type' and 'sources', see below
                            //  - the keys from GazeTargets.mapping.settings.[TYPE]
                            //  - the keys from GazeTargets.mapping.settings.[MODEL]
                            //    (see comments to the corresponding type and model in GazeTargets.mapping)
            type: GazeTargets.mapping.types.naive,       // mapping type, see GazeTargets.mapping.types
            source: GazeTargets.mapping.sources.samples, // data source for mapping, see GazeTargets.source
            model: GazeTargets.mapping.models.none       // mapping model, see GazeTargets.mapping.models
        },
        pointer: {          // gaze pointer settings
            show: true,             // boolean or a function returning boolean
            size: 8,                // pointer size (pixels)
            color: 'MediumSeaGreen',// CSS color
            opacity: 0.5            // CSS opacity
        },
        smoother: {            // Olsson filter
            enabled: true,
            low: 300,
            high: 10,
            timeWindow: 50,
            threshold: 25
        },
        progress: {         // dwell time progress settings
            color: 'Teal',  // progress indicator (arc) color
            opacity: 0.5,   // CSS opacity
            size: 60,       // widget size (pixels)
            minWidth: 5,    // progress indicator (arc) min width
            delay: 200      // >0ms, if the progress is not shown immediately after gaze enters a target
        },
        fixdet: {
            maxFixSize: 50,     // pixels
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
            calibration: {             // gesture calibration settings
                trials: 5,             // number of trials
                threshold: 0.0120,     // minimum signal from the baseline
                trialDuration: 2000,   // ms
                pauseDuration: 2000,   // ms
                plotSizeFactor: 1.0,   // a factor for 320x240
                ui: {
                    menu: 'gt-chgd-calibMenu',
                    list: 'gt-chgd-calibList'
                }
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
                                    //    >0: speed per step in pixels,
                                    //    0: no scrolling,
                                    //    -1: scrolling by page
            controller: GazeTargets.scroller.controllers.headPose,    // the scrolling controller
            className: 'gt-scroller',   // class name
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
        //   event - a value from GazeTargets.event
        //   target - the target
        target: null,
        
        // Fires on a keyboard visibility change
        // arguments:
        //   keyboard - the keyboard
        //   visible - the visibility flag
        keyboard: null
    };

    // variable to store in browser's storage
    var storage = {
        etudriver: {
            device: {
                id: 'gt-etud-device',
                default: 'Mouse'
            }
        }
    };

    // Initialization.
    //   Must be called when a page is loaded
    //   arguments:
    //      - customSettings: overwrites the default settings, see settings variable
    //      - customCallbacks: fills the 'callbacks' object with handlers
    GazeTargets.init = function (customSettings, customCallbacks) {
        utils = root.GazeTargets.Utils;

        // get the lib path
        var script = utils.detectPath();
        homePath = script !== false ? script.path : '';
        
        // combine the default and custom settings add callbacks
        utils.extend(true, settings, customSettings);
        utils.extend(true, callbacks, customCallbacks);

        // configure settings, get a list of required component
        var requiredComponents = configureSettings();
        
        // load CSS
        loadCSS(settings.css.useVersion && script.version ? script.version : null);

        // Create and initialize components
        createAndInitComponents(requiredComponents);
        
        GazeTargets.updateTargets();

        // initialize ETUDriver
        root.GazeTargets.ETUDriver.init(settings.etudriver, { 
                data: onDataReceived,
                state: onStateChanged
            }, 
            storage.etudriver);
    };

    // Updates the list of targets
    // Must be called when a target was added, removed, or relocated
    // Adds an object "gaze" to the target DOM element with the following properties:
    //  - focused: boolean
    //  - selected: boolean
    //  - attention: integer, holds the accumulated attention time (used for GazeTraker.selection.types.cumulativeDwell)
    //  - selection: type of selection method (from  GazeTraker.selection.types)
    //  - mapping: type of mapping method (from GazeTraker.mapping.types)
    //  - keyboard: null, or the keyboard that is available currently for the input into this element
    GazeTargets.updateTargets = function () {
        var keyboardTargets = null;
        if (currentKeyboard) {
            keyboardTargets = {
                keyboard: currentKeyboard,
                selector: '.' + keyboardMarkers.button
            };
        }
        targets.update(keyboardTargets, settings.scroller.targets);
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

    // Returns the keyboard object
    GazeTargets.getKeyboard = function (name) {
        return keyboards[name];
    };

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
    GazeTargets.verifyCalibration = function (customSettings, customCallbacks) {
        calibVerifier.run(customSettings, customCallbacks);
    };


    // Internal

    // shortcuts
    var utils;

    // privat members
    var keyboardMarkers = {
        button: 'gt-keyboard-keyMarker',
        indicator: 'gt-keyboard-indicator'
    };

    // operation variables, must be reset when the tracking starts
    var lastSample = null;

    // other objects
    var targets = null;
    var fixdet = null;
    var progress = null;
    var headCorrector = null;
    var smoother = null;
    var nodDetector = null;
    var chgDetectors = {};
    var keyboards = {};
    var currentKeyboard = null;
    var scroller = null;
    var calibVerifier = null;
    var pointer = null;
    var mapper = null;
    var selector = null;

    var homePath = '';


    var onStateChanged = function (state) {
        if (utils.bool(settings.pointer.show)) {
            pointer.show(state.isTracking);
        }
        if (progress) {
            progress.show(state.isTracking);
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
            
            mapper.reset();
            selector.reset();

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

            targets.reset();
            
            if (currentKeyboard) {
                currentKeyboard.hide();
            }
            
            if (state.isStopped && scroller) {
                scroller.reset();
            }
        }
    };

    // Gaze data processing
    var onDataReceived = function (ts, x, y, pupil, ec) {
        // Feed unprocessed gaze points to calibration verifier
        if (calibVerifier.isActive()) {
            calibVerifier.feed(ts, x, y);
        }
        
        // Now make gaze point correction before feeding to any consumer
        var point = utils.screenToClient(x, y);
        if (headCorrector && ec) {
            if (!lastSample) {
                headCorrector.init(ec);
            }
            point = headCorrector.correct(point, ec);
        }

        // Next, update the fixation point
        fixdet.feed(ts, point.x, point.y);
        
        // External script should receive the sample before a possible selection happens
        if (typeof callbacks.sample === 'function') {
            callbacks.sample(ts, point.x, point.y, pupil, ec);
        }

        // Find the focused target
        var useFix = settings.mapping.source == GazeTargets.mapping.sources.fixations && fixdet.currentFix;
        var mappingX = useFix ? fixdet.currentFix.x : point.x,
            mappingY = useFix ? fixdet.currentFix.y : point.y,
            fixationDuration = useFix ? fixdet.currentFix.duration : 0;
        
        var mappingResult = mapper.feed(targets.items(), mappingX, mappingY, fixationDuration);
        if (progress && mappingResult.isNewFocused) {
            progress.moveTo(mappingResult.focused);
        }

        // Detect selection
        if (ec) {
            utilizeEyeCameraPoints(mappingResult.focused, ts, point, pupil, ec);
        }
        
        selector.feed(targets.items(), mappingResult.focused, lastSample ? ts - lastSample.ts : 0);
        
        // Finally, update dwell-time progress and gaze pointer
        if (mappingResult.lastFocused && progress) {
            progress.update(utils.bool(mappingResult.lastFocused.gaze.selection.showProgress) ? mappingResult.lastFocused : null);
        }
        
        updatePointer(ts, point);
        
        lastSample = {
            ts: ts,
            x: x,
            y: y,
            pupil: pupil,
            ec: ec
        };
    };

    var utilizeEyeCameraPoints = function (focused, ts, point, pupil, ec) {
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

        if (scroller) {
            scroller.feed(ec);
        }
    };

    function updatePointer(ts, point) {
        if (utils.bool(settings.pointer.show)) {
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
            pointer.moveTo(pt);
        } 
        else {
            pointer.show(false);
        }
    }

    // Callback for mapping
    var isTargetDisabled = function (target) {
        return (!!currentKeyboard && !target.classList.contains(keyboardMarkers.button)) ||
                target.style.visibility === 'hidden' ||
                target.classList.contains(keyboardMarkers.indicator);
    };

    // Configurations
    function configureSettings() {
        var reqComp;
        var requiredComponents = {
            dwellProgress: false,
            nodDetector: false,
            customHeadGestureDetectors: {}
        };

        for (var idx in settings.targets) {
            var targetSettings = settings.targets[idx];
            reqComp = configureTargetSettings(targetSettings);
            utils.extend(true, requiredComponents, reqComp);
        }
        
        for (var kbd in GazeTargets.keyboards) {
            reqComp = createKeyboard(kbd);
            utils.extend(true, requiredComponents, reqComp);
        }

        switch (settings.mapping.type) {
            case GazeTargets.mapping.types.expanded:    
                utils.extend(true, true, settings.mapping, GazeTargets.mapping.settings.expanded);
                break;
        }
        
        utils.extend(true, true, settings.mapping, GazeTargets.mapping.settings.models);
        
        reqComp = createScrollerSettings();
        utils.extend(true, requiredComponents, reqComp);

        return requiredComponents;
    }

    function createScrollerSettings() {
        var selection = settings.scroller.controller === GazeTargets.scroller.controllers.fixation ? 
                    GazeTargets.scroller.selection : 
                    { type: GazeTargets.selection.types.none };

        var mapping = { className: '' };

        var requiredComponents = { };
        for (var scrollTypeIdx in GazeTargets.scroller.types) {
            var scrollType = GazeTargets.scroller.types[scrollTypeIdx];
            var targetSettings = {
                selector: '.' + settings.scroller.className + '-' + scrollType,
                selection: selection,
                mapping: mapping
            };
            
            settings.scroller.targets[scrollType] = targetSettings;
            requiredComponents = configureTargetSettings(targetSettings);
        }

        return requiredComponents;
    }

    function configureTargetSettings(targetSettings) {
        // shortcuts
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
        
        var requiredComponents = { };
        if (targetSettings.selection.dwellTime !== undefined) {
            requiredComponents.dwellProgress = true;
        }
        if (targetSettings.selection.type === selection.types.nod) {
            requiredComponents.nodDetector = true;
        }
        if (targetSettings.selection.type === selection.types.customHeadGesture) {
            var name = targetSettings.selection.name || 'default';
            requiredComponents.customHeadGestureDetectors[name] = true;
        }

        if (targetSettings.selection.audio) {
            targetSettings.selection.audio = new Audio(homePath + targetSettings.selection.audio);
        }

        return requiredComponents;
    }

    // Component loading, creation, initilization
    function loadCSS(version) {
        if (!settings.css.file) {
            return;
        }

        var fileName = homePath + settings.css.file;
        if (version) {
            fileName += '-' + version;
        }
        fileName += '.css';

        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = fileName;
        link.media = 'all';
        head.appendChild(link);
    }

    function createAndInitComponents(requiredComponents) {
        root.GazeTargets.ETUDPanel.init(settings.etudPanel);

        pointer = root.GazeTargets.Pointer;
        pointer.init(settings.pointer);

        fixdet = new GazeTargets.FixationDetector(settings.fixdet);
        calibVerifier = new GazeTargets.CalibrationVerifier(settings.calibVerifier);

        if (utils.bool(settings.scroller.enabled)) {        
            scroller = new GazeTargets.Scroller(settings.scroller);
        }
        if (utils.bool(settings.headCorrector.enabled)) {        
            headCorrector = new GazeTargets.HeadCorrector(settings.headCorrector);
        }
        if (utils.bool(settings.smoother.enabled)) {
            smoother = new GazeTargets.Smoother(settings.smoother);
        }

        if (requiredComponents.dwellProgress) {
            progress = GazeTargets.Progress;
            progress.init(settings.progress);
        }
        
        if (requiredComponents.nodDetector) {
            nodDetector = new GazeTargets.HeadGestureDetector(GazeTargets.selection.settings.nod, settings.headGesture);
        }
        
        createCustomHeadGestureDetectors(requiredComponents.customHeadGestureDetectors);
        
        mapper = root.GazeTargets.Mapper;
        mapper.init(settings.mapping, isTargetDisabled, callbacks.target);
        
        selector = root.GazeTargets.Selector;
        selector.init(settings.selection, isTargetDisabled, nodDetector, chgDetectors, callbacks.target);
        
        targets = root.GazeTargets.Targets;
        targets.init(settings.targets, keyboards);
    }

    function createCustomHeadGestureDetectors(requiredDetectors) {
        
        var addClickHandler = function (btn, name) {
            btn.addEventListener('click', function () { 
                GazeTargets.calibrateCustomHeadGesture(name, function (state) {
                    if (state === 'finished') {
                        // TODO: handle finished event;
                    }
                });
            });
        };

        for (var name in requiredDetectors) {
            if (!chgDetectors[name]) {
                chgDetectors[name] = new GazeTargets.CustomHeadGestureDetector(name, settings.customHeadGestureDetector);
            }
        }
        
        GazeTargets.CustomHeadGestureCalibrator.createUI(settings.customHeadGestureDetector.calibration.ui,
            chgDetectors, addClickHandler);
    }

    function createKeyboard(name) {
        var params = GazeTargets.keyboards[name];
        if (!params.selection || !params.selection.type) {
            params.selection = { type: GazeTargets.selection.types.cumulativeDwell };
        }

        // extend the keyboard parameter with 'selection' and 'mapping'
        var requiredComponents = configureTargetSettings(params);
        params.name = name;
        
        keyboards[name] = new root.GazeTargets.Keyboard(params, keyboardMarkers, {
            hide: function () {
                if (callbacks.keyboard) {
                    callbacks.keyboard(currentKeyboard, false);
                }
                currentKeyboard = null;
                GazeTargets.updateTargets();
            },
            show: function (keyboard) {
                currentKeyboard = keyboard;
                if (callbacks.keyboard) {
                    callbacks.keyboard(currentKeyboard, true);
                }
                GazeTargets.updateTargets();
            }
        });

        return requiredComponents;
    }

})(window);