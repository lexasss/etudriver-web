/*!
 *  ETU-Driver for web pages and applications
 *  
 *  @version    0.1.1
 *  @license    GNU Lesser General Public License v3, http://www.gnu.org/copyleft/lesser.html
 *  @author     Oleg Spakov, University of Tampere
 *  @created    01.11.2013
 *  @updated    20.11.2013
 *  @link       http://wwww.sis.uta.fi/~csolsp/projects.html
 *  @decsription    To create gaze-responsive interaction with a web-page objects.
 *                  Uses WebSocket to communicate with "ETU-Driver test" application which acts as a gaze data server.
 *  
 *  Usage:
 *  
 *  1. Create an HTML with elements that will be modified visually when gaze lands on them
 *  
 *  2. Create a JS file where you set the event handler and 
 *     initialize the plugin after the document content is loaded:
 *      
 *      document.addEventListener("DOMContentLoaded", function() {
 *      
 *          // Optionally, define some common settings in $.etudriver.settings, for example:
 *          $.etudriver.settings.selection.className = 'selected';
 *          
 *          // Init the library, with some settings and callbacks.
 *          //   For other majority of settings, look below for the definition of 'settings' variable 
 *          //   to learn about the available settings to customize and their default values
 *          // Note that the second argument accepts a callback as "function(event, target)" that is
 *          //   called on gaze enter and leave, and on target selection
 *          $.etudriver.init({
 *              panel: {
 *                  show: true
 *              },
 *              targets: [
 *                  {
 *                      className: 'gazeObj',
 *                      selection: {
 *                          type: $.etudriver.selection.competitiveDwell
 *                      }
 *                  },
 *                  {
 *                      className: 'gazeObj2',
 *                      selection: {
 *                          type: $.etudriver.selection.simpleDwell,
 *                          className: 'selected2',
 *                          dwellTime: 1500
 *                      },
 *                      mapping: {
 *                          className: 'focused2'
 *                      }
 *                  }
 *              ],
 *              mapping: {
 *                  type: $.etudriver.mapping.expanded,
 *                  source: $.etudriver.source.fixations,
 *              },
 *              pointer: {
 *                  show: true
 *              }
 *          }, {
 *              
 *              state: function (state) {
 *                  if (state.isStopped)
 *                      console.log('tracking stopped');
 *              },
 *          
 *              sample: function (ts, x, y, pupil, ec) {
 *                  console.log('gazeX = ' + x + ', gazeY = ' + y);
 *              }
 *          
 *          });
 *          
 *          // Set handlers for the gaze events on individual elements 
 *          //   (see $.etudriver.event for the list of events)
 *          $('#gazeButton').on($.etudriver.event.selected, function () {
 *              // the element with id 'gazeButton' has been selected
 *          });
 *      });
 *
*/

(function ($) {
    'use strict';

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
                { "titles" : ["3", "#", "�"], "zoom" : 2 }
                    - the button has all 3 states, will print 3, # and �, 
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
                type: $.etudriver.selection.cumulativeDwell   // the default selection type
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
            container: 'etud-calibVerifier-containerDefault',
            target: 'etud-calibVerifier-targetDefault',
            pulsator: 'etud-calibVerifier-pulsatorDefault'
        },
        resultColors: {                // colors of the object painted in the resulting view
            target: '#444',
            sample: '#48C',
            offset: 'rgba(224,160,64,0.5)',
            text: '#444'
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
//      - customSettings: overwrites the default settings, see settings variable
//      - customCallbacks: fills the 'callbacks' object with handlers
$.etudriver.init = function (customSettings, customCallbacks) {

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
                chgDetectors[name] = new CustomHeadGestureDetector(name, settings.customHeadGestureDetector);
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
    extend(true, settings, customSettings);
    
    // add callbacks
    extend(true, callbacks, customCallbacks);
    
    var needProgress = false;
    var needNodDetector = false;
    var requiredCustomHeadGestureDetectors = {};
    
    var configureTargetSettings = function (ts) {
        ts.selection = extend(true, {}, $.etudriver.settings.selection.defaults, ts.selection);
        ts.mapping = extend(true, {}, $.etudriver.settings.mapping.defaults, ts.mapping);
        switch (ts.selection.type) {
        case $.etudriver.selection.cumulativeDwell:
            extend(true, true, ts.selection, $.etudriver.settings.selection.cumulativeDwell);
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
            keyboardParams.selection = { type: $.etudriver.selection.cumulativeDwell };
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

    if (bool(settings.panel.show)) {
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
    
    fixdet = new FixationDetector(settings.fixdet);
    
    headCorrector = new HeadCorrector(settings.headCorrector);

    // scroller
    var scrollerSelection = {
        type: $.etudriver.selection.cumulativeDwell,
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
    calibVerifier = new CalibrationVerifier(settings.calibVerifier);
    
    // Smoother
    if (bool(settings.pointer.smoothing.enabled)) {
        smoother = new Smoother(settings.pointer.smoothing);
    }
    
    // Multiple node detectors may exists, the settings should come from settings.targets[type == 'nod'].selection
    if (needNodDetector) {
        nodDetector = new HeadGestureDetector($.etudriver.settings.selection.nod, settings.headGesture);
    }
    
    createCalibrationList(requiredCustomHeadGestureDetectors);
    
    $.etudriver.updateTargets();

    initWebSocket(settings.port);
};

// Updates the list of targets
// Must be called when a target was added, removed, or relocated
// Adds an object "gaze" to the DOM element with the following properties:
//  - focused: boolean
//  - selected: boolean
//  - attention: integer, holds the accumulated attention time (used for $.etudriver.selection.cumulativeDwell)
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
$.etudriver.verifyCalibration  = function (customSettings, customCallbacks) {
    calibVerifier.run(customSettings, customCallbacks);
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

// variable to store in browser's storage
var storage = {
    device: {
        id: 'etudriver-device',
        default: 'Mouse'
    }
};

// privat members
var targets = [];

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

// WebSocket
var websocket = null;

var onWebSocketOpen = function (evt) {
    //debug('onWebSocketOpen', evt);
    if (controlPanel) {
        setWebSocketStatus(stateLabel.connected);
        controlPanel.classList.add(settings.panel.connectedClassName);
        var state = updateState(stateFlags.none);
        updateControlPanel(state);
        
        var device = getStoreValue(storage.device);
        if (device) {
            sendToWebSocket(request.setDevice + ' ' + device);
        }
    }
};

var onWebSocketClose = function (evt) {
    //debug('onWebSocketClose', evt);
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
    //debug('onWebSocketMessage', evt.data);
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
            debug('onWebSocketMessage', 'WebSocket got state: ' + evt.data);
            state = updateState(ge.value);
            onstate(state);
        } else if (ge.type === respondType.device) {
            debug('onWebSocketMessage', 'WebSocket got device: ' + evt.data);
            store(storage.device, ge.name);
            state = updateState(undefined, ge.name);
            onstate(state);
        }
    } catch (e) {
        exception('onWebSocketMessage', e);
        exception('onWebSocketMessage', evt.data);
    }
};

var onWebSocketError = function (evt) {
    debug('onWebSocketError', evt);
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
    debug('sendToWebSocket', 'WebSocket sent: ' + message);
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
    
    if (calibVerifier.isActive()) { // feed unprocessed gaze points to calibration verifier
        calibVerifier.feed(ts, x, y);
    }
    
    if (bool(settings.headCorrector.enabled) && ec) {
        if (!lastSample) {
            headCorrector.init(ec);
        }
        point = headCorrector.correct(point, ec);
    }

    if (typeof callbacks.sample === 'function') {
        callbacks.sample(ts, point.x, point.y, pupil, ec);
    }

    if (controlPanel && bool(settings.panel.displaySamples)) {
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

    if (settings.mapping.source == source.fixations && fixdet.currentFix) {
        x = fixdet.currentFix.x;
        y = fixdet.currentFix.y;
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
        case choices.cumulativeDwell:
            if (lastSample) {
                if (selectCumulativeDwell(target, ts - lastSample.ts)) {
                    result = target;
                }
            }
            break;
        case choices.simpleDwell:
            if (fixdet.currentFix && lastSample) {
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

var selectCumulativeDwell = function (target, duration) {
    var result = false;
    var i;
    if (target === focused) {
        target.gaze.attention += duration;
        if (target.gaze.attention >= target.gaze.selection.dwellTime) {
            result = true;
            for (i = 0; i < targets.length; i += 1) {
                var t = targets[i];
                if (t.gaze.selection.type === $.etudriver.selection.cumulativeDwell) {
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

// Debugging
var logDebug = true;
var logException = true;

var debug = function () {
    var text = Array.prototype.join.call(arguments, ': ');
    console.log(text);
};

var exception = function () {
    var text = Array.prototype.join.call(arguments, ': ');
    console.error(text);
}

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

var getStoredValue = function (entry) {
    var result = entry.default;
    if (storageAccessible()) {
        result = localStorage[entry.id] || result;
    }
    return result;
};

var store = function (entry, value) {
    if (storageAccessible()) {
        localStorage[entry.id] = value;
    }
};

// Other
var zoom = {x: 1.0, y: 1.0};
var offset = {x: 0, y: 0};

var updatePixelConverter = function () {

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

var screenToClient = function (x, y) {
    return {
        x: (x - offset.x) / zoom.x,
        y: (y - offset.y) / zoom.y
    };
};

var clientToScreen = function (x, y) {
    return {
        x: x * zoom.x + offset.x,
        y: y * zoom.x + offset.y
    };
};

var getScreenSize = function () {
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

var getRandomInt = function () {
    var min = arguments.length > 1 ? arguments[0] : 0;
    var max = arguments.length > 0 ? arguments[arguments.length - 1] : 0xFFFFFFFF; // 32-bit value
    return Math.floor(Math.random() * (max - min + 0.99999)) + min;
};

var clone = function (obj) {
    // Handle the 3 simple types, and null or undefined
    if (obj == null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                if (obj[attr] === obj) {    // recursion handing
                    copy[attr] = copy;
                } else {
                    copy[attr] = clone(obj[attr]);
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

// In some cases, a boolean setting may appear rather as a function that returns a boolean value, 
// than just a boolean value itself
var bool = function (value) {
    if (typeof value === 'function') {
        return value();
    }
    return !!value;
};
// FullScreen API
function FullScreen() {};

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
    }
    document.addEventListener(fs + event, callback);
    document.addEventListener('webkit' + fs + event, callback);
    document.addEventListener('moz' + fs + event, callback);
    document.addEventListener('MS' + titlize(fs) + titlize(event), callback);
}


// Fixation and FixationDetector

// Fixation
// The constructor takes data of its first sample
function Fixation (ts, x, y) {
    this.ts = ts;
    this.x = x;
    this.y = y;
    this.duration = 0;
    this.saccade = {dx: 0, dy: 0};
    this.samples = [];
}

// params:
//	ts: timestamp in milliseconds
//	x: gaze x in pixels
//	y: gaze y in pixels
Fixation.prototype.addSample = function (bufferLength, ts, x, y) {
    if(this.samples.length == bufferLength) {
        this.samples.shift();
    }

    this.samples.push({x: x, y: y});
    this.duration = ts - this.ts;

    var fx = 0;
    var fy = 0;
    for (var i = 0; i < this.samples.length; i += 1) {
        var sample = this.samples[i];
        fx += sample.x;
        fy += sample.y;
    }
    this.x = fx / this.samples.length;
    this.y = fy / this.samples.length;
};

// Fixation detector
function FixationDetector(settings) {
    
    this.currentFix = null;

    // Operational variables
    var candidateFix = null;

    // Must be called when new sample is available
    // params:
    //	ts: timestamp in milliseconds
    //	x: gaze x in pixels
    //	y: gaze y in pixels
    // returns:
    //	true if a new fixation starts, false otherwise
    this.feed = function (ts, x, y) {
        var result = false;
        if (!this.currentFix) {
            this.currentFix = new Fixation(ts, x, y);
            result = true;
        }
        else if (!candidateFix) {
            var dx = this.currentFix.x - x;
            var dy = this.currentFix.y - y;
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < settings.maxFixSize) {
                this.currentFix.addSample(settings.bufferLength, ts, x, y);
            } else {
                candidateFix = new Fixation(ts, x, y);
                candidateFix.saccade.dx = x - this.currentFix.x;
                candidateFix.saccade.dy = y - this.currentFix.y;
            }
        } else {
            var dxCurr = this.currentFix.x - x;
            var dyCurr = this.currentFix.y - y;
            var distCurr = Math.sqrt(dxCurr*dxCurr + dyCurr*dyCurr);
            var dxCand = candidateFix.x - x;
            var dyCand = candidateFix.y - y;
            var distCand = Math.sqrt(dxCand*dxCand + dyCand*dyCand);
            if (distCurr < settings.maxFixSize) {
                this.currentFix.addSample(settings.bufferLength, ts, x, y);
            }
            else if(distCand < settings.maxFixSize) {
                this.currentFix = candidateFix;
                candidateFix = null;
                this.currentFix.addSample(settings.bufferLength, ts, x, y);
                result = true;
            }
            else {
                candidateFix = new Fixation(ts, x, y);
                candidateFix.saccade.dx = x - this.currentFix.x;
                candidateFix.saccade.dy = y - this.currentFix.y;
            }
        }

        return result;
    };
    
    this.reset = function () {
        this.currentFix = null;
        candidateFix = null;
    };
};

// Head corrector

function HeadCorrector(settings) {
    var ref = null;
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
    this.init = function (ec) {
        ref = getAvg(ec);
    };
    this.correct = function (point, ec) {
        var pt = getAvg(ec);
        var dx = (pt.x - ref.x) * settings.transformParam;
        var dy = (pt.y - ref.y) * settings.transformParam;
        return {
            x: Math.round(point.x - dx), 
            y: Math.round(point.y + dy)
        };
    };
}

function Smoother(settings) {
    this.x = -1.0;
    this.y = -1.0;
    this.t = 0;
    this.interval = 0;

    this.buffer = [];

    this.init = function () {
        this.x = -1.0;
        this.y = -1.0;
        this.t = 0;
        this.buffer = [];
    };
    
    this.smooth = function (ts, x, y) {
        if (this.x < 0 && this.y < 0 && this.t === 0) {
            this.x = x;
            this.y = y;
            this.t = settings.low;
        }

        var i;
        var avgXB = 0,
            avgYB = 0,
            avgXA = 0,
            avgYA = 0,
            ptsBeforeCount = 0,
            ptsAfterCount = 0,
            validFilter = false;

        this.buffer.push({ts: ts, x: x, y: y});

        for (i = 0; i < this.buffer.length; i += 1) {
            var smp = this.buffer[i];
            var dt = ts - smp.ts;
            if (dt > (2 * settings.timeWindow)) {
                this.buffer.shift();
                validFilter = true;
            }
            else if (dt > settings.timeWindow) {
                avgXB += smp.x;
                avgYB += smp.y;
                ptsBeforeCount++;
            }
            else {
                avgXA += smp.x;
                avgYA += smp.y;
                ptsAfterCount++;
            }
        }

        if (ptsBeforeCount && ptsAfterCount) {
            avgXB = avgXB / ptsBeforeCount;
            avgYB = avgYB / ptsBeforeCount;
            avgXA = avgXA / ptsAfterCount;
            avgYA = avgYA / ptsAfterCount;

            var dx = avgXB - avgXA;
            var dy = avgYB - avgYA;
            var dist = Math.sqrt(dx*dx + dy*dy);

            this.t = dist > settings.threshold ? settings.high : settings.low;
        }

        if (validFilter && !this.interval && this.buffer.length > 1) {
            var avgDT = 0;
            for (i = 1; i < this.buffer.length; i += 1) {
                avgDT += this.buffer[i].ts - this.buffer[i - 1].ts;
            }

            this.interval = avgDT / (this.buffer.length - 1);
        }

        if (this.interval) {
            var alfa = this.t / this.interval;
            this.x = (x + alfa * this.x) / (1.0 + alfa);
            this.y = (y + alfa * this.y) / (1.0 + alfa);
        }

        return {x: this.x, y: this.y};
    };
}

// Head gesture detecting classes

// Sample class
// params:
//  - ts:      timestamp
//  - x, y:    gaze x and y
//  - ec:      eye points in camera, {xl, yl, xr, yr}
//  - focused: the currently focused object
function HGDSample(ts, x, y, ec, focused) {  
    this.matched = 0;
    this.ts = ts;
    this.x = x;
    this.y = y;
    this.ec = ec;
    this.focused = focused;
}

HGDSample.prototype.isMatched = function (ruleIndex) {
    var mask = 1 << ruleIndex;
    return (this.matched & mask) > 0;
};

HGDSample.prototype.setMatched = function (ruleIndex, matched) {
    var mask = ~(1 << ruleIndex);
    this.matched = (this.matched & mask) + (matched ? 1 << ruleIndex : 0);
};

// Head gesture detector
// params:
//   - rules: a list of rules
function HeadGestureDetector(rules, settings) {
    this.settings = settings;
    this.rules = rules;
    this.buffer = [];
    this.eventIsOn = false;
    this.canTest = false;
    this.current = null;
}

// resets the internal state
HeadGestureDetector.prototype.init = function () {
    this.buffer = [];
    this.eventIsOn = false;
    this.canTest = false;
    this.current = null;
};

// feed sample data
// returns:
//  - gesture matching result, either null, or {object} if the gesture was recognized
HeadGestureDetector.prototype.feed = function (ts, x, y, ec, focused) {
    var result = null;
    if (ec) {
        for (var i = 0; i < this.buffer.length; i++) {
            if (ts - this.buffer[i].ts > this.settings.timeWindow) {
                this.buffer.shift();
                this.canTest = true;
            } else {
                break;
            }
        }
        this.canTest = this.canTest && this.buffer.length > 0;
        var sample = new HGDSample(ts, x, y, ec, focused);
        if (this.canTest) {
            this.test(sample);
        }
        this.buffer.push(sample);
        if (this.canTest) {
            result = this.searchPattern();
        }
    }
    this.current = result ? result.object : null;
    return result;
};

HeadGestureDetector.prototype.isRangeTestable = function (range) {
    return range.min !== 0.0 || range.max !== 0.0;
};

HeadGestureDetector.prototype.normalizeAngles = function (range, angle) {
    var min = range.min;
    var max = range.max;
    if (min === 0.0 && max === 0.0) {
        max = 360.0;
    } else if (max < min) {
        if (angle < 180.0) {
            min = 0.0;
        } else {
            max = 360.0;
        }
    }
    return {min: min, max: max};
};

HeadGestureDetector.prototype.testRule = function (rule, side, amplitude, angle) {
    var result = false;
    var angles = this.normalizeAngles(rule[side].angle, angle);
    var amps = rule[side].amplitude;
    result = amplitude >= amps.min && amplitude <= amps.max && angle >= angles.min && angle <= angles.max;
    return result;
};

HeadGestureDetector.prototype.test = function (sample) {
    var i;
    for (i = 0; i < this.rules.length; i += 1) {
        // Time-Threshold Detector
        var rule = this.rules[i];
        var index = this.buffer.length - 1;
        var minTS = sample.ts - rule.interval.max;
        var maxTS = sample.ts - rule.interval.min;
        while (index >= 0 && this.buffer[index].ts > maxTS) {
            index -= 1;
        }

        var detected = rule.matchAll;
        while (index >= 0 && this.buffer[index].ts > minTS) {
            var s = this.buffer[index];
            index -= 1;
            var dLX = sample.ec.xl - s.ec.xl;
            var dLY = sample.ec.yl - s.ec.yl;
            var dRX = sample.ec.xr - s.ec.xr;
            var dRY = sample.ec.yr - s.ec.yr;
            
            var ampLeft = Math.sqrt(dLX * dLX + dLY * dLY);
            var angLeft = Math.atan2(dLY, dLX) * 180.0 / Math.PI;
            var ampRight = Math.sqrt(dRX * dRX + dRY * dRY);
            var angRight = Math.atan2(dRY, dRX) * 180.0 / Math.PI;
            if (angLeft < 0.0)
                angLeft += 360.0;
            if (angRight < 0.0)
                angRight += 360.0;

            var result = 
                (this.isRangeTestable(rule.left.amplitude) ? this.testRule(rule, 'left', ampLeft, angLeft) : true) &&
                (this.isRangeTestable(rule.right.amplitude) ? this.testRule(rule, 'right', ampRight, angRight) : true);

            if (rule.matchAll) {
                detected = detected && result;
                if (!result) {
                    break;
                }
            } else {
                detected = detected || result;
                if (result) {
                    break;
                }
            }
        }

        sample.setMatched(i, detected);
    }
    
    if (debug) {
        debug(sample.matched); 
    }
};

HeadGestureDetector.prototype.searchPattern = function () {
    var result = null;
    
    var ri = this.rules.length - 1;
    var pri = -1;
    var priTimestamp = 0;
    var start = null;
    var end = null;
    var i;
    for (i = this.buffer.length - 1; i >= 0; i -= 1) {
        var s = this.buffer[i];
        if (s.isMatched(ri)) {
            if (priTimestamp > 0 && priTimestamp - s.ts > this.rules[pri].interval.max) {
                break;
            }

            if (ri === this.rules.length - 1) {
                end = s;
            } else if (ri === 0) {
                var startTS = s.ts - this.rules[0].interval.max;
                while (i > 0 && this.buffer[i - 1].ts > startTS) {
                    i -= 1;
                }
                start = this.buffer[i];
                break;
            }
            priTimestamp = s.ts;
            pri = ri;
            ri -= 1;
        }
        else if (pri >= 0 && s.isMatched(pri)) {
            priTimestamp = s.ts;
        }
    }

    var maxInterval = 0;
    var minInterval = 0;
    for (i = 0; i < this.rules.length; i += 1) {
        var rule = this.rules[i];
        maxInterval += rule.interval.max;
        minInterval += rule.interval.min;
    }

    var allMatched = start && end && (end.ts - start.ts) < maxInterval && (end.ts - start.ts) > minInterval ? true : false;
    if (allMatched && !this.eventIsOn) {
        result = {name: 'nod', object: start.focused};
        //extend(true, result, this.computeEyeGazePoints(i));
        
        while (this.buffer.length > 0) {
            var sample = this.buffer[0];
            if (sample.ts < end.ts)
                this.buffer.shift();
            else
                break;
        }
    }
    this.eventIsOn = allMatched;
    
    return result;
};

HeadGestureDetector.prototype.computeEyeGazePoints = function (startIndex) {
    var gx = 0.0,
        gy = 0.0,
        count = 0,
        exl = 0.0,
        eyl = 0.0,
        countl = 0,
        exr = 0.0,
        eyr = 0.0,
        countr = 0;
    var i = Math.max(startIndex, 9);
    var maxTimestamp = this.buffer[i].ts;
    var timestamp = maxTimestamp;
    while (maxTimestamp - timestamp < 150 && i >= 0) {
        var s = this.buffer[i];
        gx += s.x;
        gy += s.y;
        count += 1;
        if (s.ec.xl > 0.0) {
            exl += s.ec.xl;
            eyl += s.ec.yl;
            countl += 1;
        }
        if (s.ec.xr > 0.0) {
            exr += s.ec.xr;
            eyr += s.ec.yr;
            countr += 1;
        }
        timestamp = s.ts;
        i -= 1;
    }
    if (count > 0) {
        gx /= count;
        gy /= count;
    }
    if (countl > 0) {
        exl /= countl;
        eyl /= countl;
    }
    if (countr > 0) {
        exr /= countr;
        eyr /= countr;
    }

    return {
        gaze: {
            x: gx, y: gy
        }, 
        eye: {
            left: {x: exl, y: eyl},
            right: {x: exr, y: eyr}
        }
    };
};

// Custom Head Gesture Detector
function CHGD_Point(timestamp, ec, focused) {
    this.ec = ec || {xl: 0.0, yl: 0.0, xr: 0.0, yr: 0.0};
    this.timestamp = timestamp || -1;
    this.focused = focused || null;
}

CHGD_Point.prototype.isSet = function () {
    return !(this.ec.xl === 0.0 && this.ec.yl === 0.0 && this.ec.xr === 0.0 && this.ec.yr === 0.0);
};

CHGD_Point.prototype.isValid = function () {
    return this.timestamp !== -1;
};

function CHGD_EC(xl, yl, xr, yr) {
    this.xl = xl || 0.0;
    this.yl = yl || 0.0;
    this.xr = xr || 0.0;
    this.yr = yr || 0.0;
}

function CHGD_Error(left, right) {
    this.left = left || 0.0;
    this.right = right || 0.0;
}

function CustomHeadGestureCalibrator(settings, callback) {
    var onClosed = callback;
    var onCalibStateChanged = null;
    
    var errorThreshold = 0.3;
    var correlThreshold = 0.8;
    var pauseDuration = 2000;
    
    var signals = [];
    var text = [];
    
    var currentSignal = null;
    var controllerCmd = 0;
    var detectedOnLastAttempt = false;
    var canAddSignal = true;
    var calibrationTimer = null;
    
    var durationAvg = 0;
    var durationSTD = 0;
    var avgSignal = null;
    var maxSignalChange = new CHGD_EC();
    
    var calibCount = settings.calibration.trials;
    
    var calibrationPanel = document.createElement('div');
    calibrationPanel.id = 'etud-chgd-calibOverlay';
    calibrationPanel.innerHTML = '\
        <div id="etud-chgd-calib">\
            <a id="etud-chgd-calibClose" href="#">X</button>\
        </div>';
    
    document.body.insertBefore(calibrationPanel, document.body.firstChild);
    
    var that = this;
    document.getElementById('etud-chgd-calibClose').addEventListener('click', function() {
        that.hide(true);
        return false;
    });
    
    var canvas = document.createElement('canvas');
    canvas.id = 'etud-chgd-calibCanvas';
    canvas.width = Math.round(320 * settings.calibration.plotSizeFactor);
    canvas.height = Math.round(240 * settings.calibration.plotSizeFactor);
    document.getElementById('etud-chgd-calib').appendChild(canvas);
    
    var calibPlot = canvas.getContext('2d');
    
    var findSignificantChange = function (signal, refIdx, from, to, inc) {
        var result = -1;
        var threshold = settings.calibration.threshold;
        var ref = signal[refIdx];
        for (var i = from; inc > 0 ? (i < to) : (i >= to); i += inc) {
            var pt = signal[i];
            var dxl = pt.ec.xl - ref.ec.xl;
            var dyl = pt.ec.yl - ref.ec.yl;
            var dxr = pt.ec.xr - ref.ec.xr;
            var dyr = pt.ec.yr - ref.ec.yr;
            var distLeft = Math.sqrt(dxl * dxl + dyl * dyl);
            var distRight = Math.sqrt(dxr * dxr + dyr * dyr);
            if (distLeft > threshold || distRight > threshold) {
                result = i;
                break;
            }
        }

        return result;
    };
    
    var getMinGestureDuration = function () {
        return Math.max(5.0, durationAvg - Math.max(2 * durationSTD, 0.2 * durationAvg));
    };
    
    var getMaxGestureDuration = function () {
        return Math.max(10.0, durationAvg + Math.max(2 * durationSTD, 0.2 * durationAvg));
    };
    
    var findAverage = function (signal, from, to) {
        var result = new CHGD_EC();

        if (from < to) {
            for (var i = from; i <= to; i += 1) {
                var value = signal[i];
                result.xl += value.ec.xl;
                result.yl += value.ec.yl;
                result.xr += value.ec.xr;
                result.yr += value.ec.yr;
            }

            var count = to - from + 1;
            result.xl /= count;
            result.yl /= count;
            result.xr /= count;
            result.yr /= count;
        }

        return result;
    };
    
    var shiftSignal = function (signal, from, to, value) {
        if (from < to) {
            for (var i = from; i <= to; i += 1) {
                var pt = signal[i];
                pt.ec.xl -= value.xl;
                pt.ec.yl -= value.yl;
                pt.ec.xr -= value.xr;
                pt.ec.yr -= value.yr;
            }
        }
    };
    
    var compareSignal = function (signal, from, to, offset) {
        var result = {error: new CHGD_Error(), correl: new CHGD_Error()};

        if (to > from) {
            var xy = new CHGD_Error(),
                x = new CHGD_Error(),
                y = new CHGD_Error(),
                x2 = new CHGD_Error(),
                y2 = new CHGD_Error();
                
            for (var i = from; i <= to; i += 1) {
                var refIdx = Math.round((i - from) / (to - from) * (avgSignal.length - 1));
                var ref = avgSignal[refIdx];
                var _pt = signal[i];
                var pt = new CHGD_EC(_pt.ec.xl - offset.xl, _pt.ec.yl - offset.yl, _pt.ec.xr - offset.xr, _pt.ec.yr - offset.yr);

                result.error.left += Math.sqrt(Math.pow(pt.xl - ref.xl, 2) + Math.pow(pt.yl - ref.yl, 2));
                result.error.right += Math.sqrt(Math.pow(pt.xr - ref.xr, 2) + Math.pow(pt.yr - ref.yr, 2));

                var r1 = new CHGD_Error(
                    Math.sqrt(Math.pow(pt.xl, 2) + Math.pow(pt.yl, 2)),
                    Math.sqrt(Math.pow(pt.xr, 2) + Math.pow(pt.yr, 2)));
                var r2 = new CHGD_Error(
                    Math.sqrt(Math.pow(ref.xl, 2) + Math.pow(ref.yl, 2)),
                    Math.sqrt(Math.pow(ref.xr, 2) + Math.pow(ref.yr, 2)));

                xy.left += r1.left * r2.left;
                x.left += r1.left;
                y.left += r2.left;
                x2.left += Math.pow(r1.left, 2);
                y2.left += Math.pow(r2.left, 2);

                xy.right += r1.right * r2.right;
                x.right += r1.right;
                y.right += r2.right;
                x2.right += Math.pow(r1.right, 2);
                y2.right += Math.pow(r2.right, 2);
            }

            var ampl = new CHGD_Error(
                Math.sqrt(Math.pow(maxSignalChange.xl, 2) + Math.pow(maxSignalChange.yl, 2)),
                Math.sqrt(Math.pow(maxSignalChange.xr, 2) + Math.pow(maxSignalChange.yr, 2)));

            var count = to - from + 1;
            result.error.left = result.error.left / count / ampl.left;
            result.error.right = result.error.right / count / ampl.right;

            try {
                result.correl.left += (count * xy.left - x.left * y.left) /
                        Math.sqrt(count * x2.left - Math.pow(x.left, 2)) /
                        Math.sqrt(count * y2.left - Math.pow(y.left, 2));
                result.correl.right += (count * xy.right - x.right * y.right) /
                        Math.sqrt(count * x2.right - Math.pow(x.right, 2)) /
                        Math.sqrt(count * y2.right - Math.pow(y.right, 2));
            }
            catch(e) { }
        }

        return result;
    };
    
    var addSignal = function (signal, from, to, offset, coef) {
        if (to > from) {
            for (var i = from; i <= to; i++) {
                var refIdx = Math.round((i - from) / (to - from) * (avgSignal.length - 1));
                var ref = avgSignal[refIdx];
                var pt = signal[i];

                ref.xl = (1.0 - coef)*ref.xl + coef*(pt.ec.xl - offset.xl);
                ref.yl = (1.0 - coef)*ref.yl + coef*(pt.ec.yl - offset.yl);
                ref.xr = (1.0 - coef)*ref.xr + coef*(pt.ec.xr - offset.xr);
                ref.yr = (1.0 - coef)*ref.yr + coef*(pt.ec.yr - offset.yr);
            }
        }
    };
    
    var removeEmptySignals = function () {
        for (var i = 0; i < signals.length; i += 1) {
            var signal = signals[i];
            if (signal.length < 2)  {
                signals.splice(i, 1);
                i -= 1;
            }
        }
    };
    
    var getAvg = function (values, invalidValue) {
        var result = 0.0;
        var count = 0;
        for (var i = 0; i < values.length; i += 1) {
            if (values[i] != invalidValue) {
                result += values[i];
                count += 1;
            }
        }

        return count ? result / count : 0.0;
    };

    var getSTD = function (values, avg, invalidValue) {
        var result = 0.0;
        var count = 0;
        for (var i = 0; i < values.length; i += 1) {
            if (values[i] != invalidValue) {
                result += Math.pow(values[i] - avg, 2);
                count += 1;
            }
        }

        return count ? Math.sqrt(result / count) : 0.0;
    };

    var getMaxSignalChange = function (signal) {
        var xlu = Number.MIN_VALUE, xll = Number.MAX_VALUE;
        var ylu = Number.MIN_VALUE, yll = Number.MAX_VALUE;
        var xru = Number.MIN_VALUE, xrl = Number.MAX_VALUE;
        var yru = Number.MIN_VALUE, yrl = Number.MAX_VALUE;
        for (var i = 0; i < signal.length; i += 1) {
            var pt = signal[i];
            if (xlu < pt.xl) xlu = pt.xl;
            if (xll > pt.xl) xll = pt.xl;
            if (ylu < pt.yl) ylu = pt.yl;
            if (yll > pt.yl) yll = pt.yl;
            if (xru < pt.xr) xru = pt.xr;
            if (xrl > pt.xr) xrl = pt.xr;
            if (yru < pt.yr) yru = pt.yr;
            if (yrl > pt.yr) yrl = pt.yr;
        }
        return new CHGD_EC(xlu - xll, ylu - yll, xru - xrl, yru - yrl);
    };

    var getAverageSignal = function (durations, startIndexes) {
        var result = [];

        durationAvg = getAvg(durations, 0);
        durationSTD = getSTD(durations, durationAvg, 0);

        var signalSTD = new CHGD_EC();
        var i, j, idx, s;

        var size = Math.round(durationAvg);
        for (i = 0; i < size; i += 1) {
            var relIdx = i / (size - 1);
            var avgPt = new CHGD_EC();
            var count = 0;

            // find mass center
            for (j = 0; j < signals.length; j += 1) {
                if (!durations[j]) {
                    continue;
                }

                idx = startIndexes[j] + Math.round(relIdx * durations[j]);
                s = signals[j][idx];
                avgPt.xl += s.ec.xl;
                avgPt.yl += s.ec.yl;
                avgPt.xr += s.ec.xr;
                avgPt.yr += s.ec.yr;
                count += 1;
            }
            if (count) {
                avgPt.xl /= count;
                avgPt.yl /= count;
                avgPt.xr /= count;
                avgPt.yr /= count;
            }

            result.push(avgPt);

            // find STD from mass center
            /* signalSTD never used 
            var std = new CHGD_EC();
            for (j = 0; j < signals.length; j += 1) {
                if (!durations[j]) {
                    continue;
                }

                idx = startIndexes[j] + Math.round(relIdx * durations[j]);
                s = signals[j][idx];
                std.xl += Math.pow(avgPt.xl - s.ec.xl, 2);
                std.yl += Math.pow(avgPt.yl - s.ec.yl, 2);
                std.xr += Math.pow(avgPt.xr - s.ec.xr, 2);
                std.yr += Math.pow(avgPt.yr - s.ec.yr, 2);
            }
            if (count) {
                signalSTD.xl += Math.sqrt(std.xl / count);
                signalSTD.yl += Math.sqrt(std.yl / count);
                signalSTD.xr += Math.sqrt(std.xr / count);
                signalSTD.yr += Math.sqrt(std.yr / count);
            }
            */
        }

        /*
        if (size) {
            signalSTD.xl /= size;
            signalSTD.yl /= size;
            signalSTD.xr /= size;
            signalSTD.yr /= size;
        }*/
        
        return result;
    };
    
    var getTrialsMetadata = function () {
        var startIndexes = [];
        var durations = [];
        var zeroSignalSizeCount = 0;
        
        var threshold = settings.calibration.threshold;
        var i, j, idx, s, endIdx;

        // search gesture start, end and duration in each trial
        for (i = 0; i < signals.length; i += 1) {
            var signal = signals[i];
            startIndexes[i] = findSignificantChange(signal, 0, 1, signal.length, 1);
            endIdx = findSignificantChange(signal, signal.length - 1, signal.length - 2, 0, -1);

            var to = startIndexes[i] < 0 ? signal.length - 1 : startIndexes[i] - 1;
            var startAvg = findAverage(signal, 0, to);
            var from = endIdx < 0 ? 0 : endIdx + 1;
            var endAvg = findAverage(signal, from, signal.length - 1);
            shiftSignal(signal, 0, signal.length - 1, startAvg);

            var dl = Math.sqrt(Math.pow(startAvg.xl - endAvg.xl, 2) + Math.pow(startAvg.yl - endAvg.yl, 2));
            var dr = Math.sqrt(Math.pow(startAvg.xr - endAvg.xr, 2) + Math.pow(startAvg.yr - endAvg.yr, 2));
            if (startIndexes[i] >= 0 && endIdx >= 0 && startIndexes[i] < endIdx && dl < threshold && dr < threshold) {
                durations.push(endIdx - startIndexes[i] + 1);
            }
            else {
                durations.push(0);
                zeroSignalSizeCount++;
            }
        }
        
        return {
            startIndexes: startIndexes,
            durations: durations,
            zeroSignalSizeCount: zeroSignalSizeCount
        };
    };

    var processTrialsData = function () {
        if (signals.length < calibCount) {
            return;
        }

        removeEmptySignals();
        
        var processed = getTrialsMetadata();

        var success = processed.zeroSignalSizeCount < signals.length / 2;
        if (success) {
            avgSignal = getAverageSignal(processed.durations, processed.startIndexes);
            maxSignalChange = getMaxSignalChange(avgSignal);
        }
    };

    var invalidate = function () {
        calibPlot.fillStyle = 'white';
        calibPlot.fillRect(0, 0, canvas.width, canvas.height);
        
        if (text.length > 0) {
            drawText(text);
        }
    };
    
    var drawText = function (lines) {
        var w = canvas.width,
            h = canvas.height;
        var textSize = 24;
        calibPlot.font = textSize + 'px Arial';
        calibPlot.textAlign = 'center';
        calibPlot.textBaseline = 'middle';
        calibPlot.fillStyle = '#444';
        lines.forEach(function (line, i) {
            calibPlot.fillText(line, Math.round(w/2), Math.round(h/2) + textSize * 1.5 * (i - (lines.length - 1) / 2));
        });
    };
    
    var drawSignal = function (signal) {
        var w = canvas.width,
            h = canvas.height;
        var drawEye = function (eye) {
            calibPlot.beginPath();
            for (var i = 0; i < signal.length; i += 1) {
                var pt = signal[i];
                if (i === 0) {
                    calibPlot.moveTo(pt.ec['x' + eye] * w, pt.ec['y' + eye] * h);
                } else {
                    calibPlot.lineTo(pt.ec['x' + eye] * w, pt.ec['y' + eye] * h);
                }
            }
            calibPlot.stroke();
        };
        calibPlot.strokeStyle = 'black';
        calibPlot.lineWidth = 2;
        if (signal) {
            drawEye('l');
            drawEye('r');
        }
    };
    
    var drawPoint = function (point) {
        var w = canvas.width,
            h = canvas.height;
        calibPlot.fillStyle = 'red';
        calibPlot.beginPath();
        calibPlot.arc(point.ec.xl * w, point.ec.yl * h, 3, 0, 2 * Math.PI);
        calibPlot.arc(point.ec.xr * w, point.ec.yr * h, 3, 0, 2 * Math.PI);
        calibPlot.fill();
    };

    var onTrainingDetectorTimeout = function () {
        detectedOnLastAttempt = false;
    };
    
    var nextStep = function (self) {
        calibrationTimer = null;
        var interval = 0;
        controllerCmd += 1;
        if (controllerCmd < 2 * calibCount) {
            if (controllerCmd % 2 === 1) {
                currentSignal = [];
                signals.push(currentSignal);
                interval = settings.calibration.trialDuration;
                text = [];
                if (onCalibStateChanged) {
                    onCalibStateChanged('start');
                }
            }
            else {
                currentSignal = null;
                interval = settings.calibration.pauseDuration;
                text = ['Gesture recorded', 'Prepare for the next'];
                if (onCalibStateChanged) {
                    onCalibStateChanged('stop');
                }
            }
        }
        else if (controllerCmd === 2 * calibCount) {
            currentSignal = null;
            interval = 1000;
            text = [];
            if (onCalibStateChanged) {
                onCalibStateChanged('stop');
            }
        }
        else if (controllerCmd === 2 * calibCount + 1) {
            text = ['Processing data', 'Please wait...'];
            invalidate();
            if (onCalibStateChanged) {
                onCalibStateChanged('processing');
            }

            processTrialsData();
            interval = 2000;

            text = ['Done!'];
            if (onCalibStateChanged) {
                onCalibStateChanged('processed');
            }
        }
        else if (controllerCmd === 2 * (calibCount + 1)) {
            text = [];
            self.hide(true);
            if (onCalibStateChanged) {
                onCalibStateChanged('finished');
            }
        }
        
        invalidate();
        if (interval) {
            calibrationTimer = setTimeout(nextStep, interval, self);
        }
    };
    
    //-------------------------------------------------
    this.getBufferSize = function () {
        return durationAvg + 4 * durationSTD + 20;
    };
    
    this.init = function (callback) {
        onCalibStateChanged = callback;
        
        signals = [];
        avgSignal = null;
        currentSignal = null;
        controllerCmd = 0;
        detectedOnLastAttempt = false;
        canAddSignal = true;

        this.show();
        calibrationTimer = setTimeout(nextStep, pauseDuration + 1500, this);
        
        text = ['Task: ' + calibCount + ' head gesture' + (calibCount > 1 ? 's' : ''), 'Prepare for the first gesture'];
        invalidate();
    };
    
    this.finilize = function () {
        currentSignal = null;
    };
    
    this.detect = function (signal, canUseAsRef) {
        var result = { detected: false };
        
        if (!avgSignal)
            return result;

        var frontChangeIdx = findSignificantChange(signal, 0, 1, signal.length - 1, 1);
        var backChangeIdx = findSignificantChange(signal, signal.length - 1, signal.length - 1, 0, -1);
        
        var offset, r = {error: new CHGD_Error(), correl: new CHGD_Error()};

        var size = backChangeIdx - frontChangeIdx + 1;
        if (frontChangeIdx > 0 && backChangeIdx > 0 && backChangeIdx > frontChangeIdx &&
                size > getMinGestureDuration() && size < getMaxGestureDuration()) {
            result.detected = true;
            offset = findAverage(signal, 0, frontChangeIdx - 1);
            r = compareSignal(signal, frontChangeIdx, backChangeIdx, offset);

            if (r.error.left > errorThreshold || r.error.right > errorThreshold ||
                r.correl.left < correlThreshold || r.correl.right < correlThreshold) {
                
                result.detected = false;
                canAddSignal = true;
            }

            if (result.detected && canUseAsRef && canAddSignal && frontChangeIdx > 10 && backChangeIdx < signal.length - 1) {
                addSignal(signal, frontChangeIdx, backChangeIdx, offset, 0.3);
                canAddSignal = false;
            }
        }

        if (result.detected) {
            result.detected = signal[frontChangeIdx - 1].focused;
        }

        if (result.detected && !detectedOnLastAttempt) {
            detectedOnLastAttempt = true;
            setTimeout(onTrainingDetectorTimeout, 1000);
        }

        return result;
    };
    
    this.feed = function (point) {
        if (currentSignal) {
            currentSignal.push(point);
        }
        invalidate();
        if (text.length === 0) {
            drawSignal(currentSignal);
            drawPoint(point);
        }
    };
    
    this.show = function () {
        calibrationPanel.style.display = 'block';
    };
    
    this.hide = function (closedByUser) {
        calibrationPanel.style.display = 'none';
        if (calibrationTimer) {
            clearTimeout(calibrationTimer);
            calibrationTimer = null;
        }
        if (closedByUser && onClosed) {
            onClosed();
        }
    };
}

function CustomHeadGestureDetector(_name, settings) {
    this.modes = {
        none: 0,
        calibration: 1,
        training: 2,
        detection: 3,
    };
    
    this.current = null;
    
    var calibrator = new CustomHeadGestureCalibrator(settings, function () {
        // handle the closing event caused by user (the calibration was terminated)
    });
    
    var name = _name;
    var mode = this.modes.none;
    var signal = null;
    
    var isGesture = false;
    var lastGestureDetectionTime = 0;
    var lastValidPoint = new CHGD_Point();
    var isLastWasValid = true;
    
    var correctInvalidPoints = function (timestamp, ec) {
        var i;
        var prevValidIdx = signal.length;
        for (i = signal.length - 1; i >= 0; i -= 1) {
            if (signal[i].isValid()) {
                prevValidIdx = i;
                break;
            }
        }
        if (prevValidIdx < signal.length) {
            var count = signal.length - prevValidIdx;
            var vp = signal[prevValidIdx];
            for (i = prevValidIdx + 1; i < signal.length; i += 1) {
                var rate = (i - prevValidIdx) / count;
                signal[i] = new CHGD_Point(vp.timestamp + (timestamp - vp.timestamp) * rate, {
                            xl: vp.ec.xl + (ec.xl - vp.xl) * rate,
                            yl: vp.ec.yl + (ec.yl - vp.yl) * rate,
                            xr: vp.ec.xr + (ec.xr - vp.xr) * rate,
                            yr: vp.ec.yr + (ec.yr - vp.yr) * rate
                        },
                        signal[i].focused);
            }
        }
    };

    var processSignal = function (timestamp) {
        var isRelieableTime = (timestamp - lastGestureDetectionTime) > settings.detection.minPause;
        var canUseAsRef = settings.detection.alterRefSignalOnDetection && !isGesture && isRelieableTime;

        var result = {};
        if (mode === this.modes.training) {
            result = calibrator.detect(signal, canUseAsRef);
            calibrator.feed(lastValidPoint);
        }
        else if (mode === this.modes.detection) {
            result = calibrator.detect(signal, canUseAsRef);
            if (!isGesture && isRelieableTime) {
                result.valid = true;
            }
        }

        if (result.detected) {
            lastGestureDetectionTime = timestamp;
        }

        isGesture = !!result.detected;
        
        return result;
    };
    
    this.getName = function () {
        return name;
    };
    
    this.init = function (_mode, callback) {
        mode = _mode;
        
        this.current = null;
        
        signal = mode === this.modes.calibration ? null : [];

        isGesture = false;
        lastGestureDetectionTime = 0;
        lastValidPoint = new CHGD_Point();
        isLastWasValid = true;
        
        if (mode === this.modes.calibration) {
            calibrator.init(callback);
        }
    };

    this.finilize = function () {
        calibrator.finilize();
        signal = null;
        mode = this.modes.none;
    };

    this.feed = function(timestamp, ec, focused) {
        if (mode == this.modes.none) {
            return null;
        }

        var valid = true;
        if (lastValidPoint.isSet())
        {
            var dxl = lastValidPoint.ec.xl - ec.xl;
            var dyl = lastValidPoint.ec.yl - ec.yl;
            var dxr = lastValidPoint.ec.xr - ec.xr;
            var dyr = lastValidPoint.ec.yr - ec.yr;
            valid = Math.sqrt(Math.pow(dxl, 2) + Math.pow(dyl, 2)) < 0.2 &&
                    Math.sqrt(Math.pow(dxr, 2) + Math.pow(dyr, 2)) < 0.2;
        }

        if (valid) {
            lastValidPoint = new CHGD_Point(timestamp, ec, focused);

            if (!isLastWasValid && signal && signal.length > 0) {
                correctInvalidPoints(timestamp, ec);
            }
        } else {
            lastValidPoint.timestamp = -1;
        }

        isLastWasValid = valid;

        if (mode === this.modes.calibration) {
            calibrator.feed(lastValidPoint);
        }
        else if (signal.length === calibrator.getBufferSize()) {
            signal.shift();
            signal.push(lastValidPoint);

            if (valid) {
                var result = processSignal.call(this, timestamp);
                this.current = result.valid ? result.detected : null;
            }
        }
        else {
            signal.push(lastValidPoint);
        }
        
        return this.current;
    };
}

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


function Scroller (settings) {

    var enabled = false;
    var ref = null;
    var headPose = {
        speed: 0,
        timer: null
    };
    
    var fadeIn = function (element) {
        element.classList.remove('etud-animation');
        element.classList.remove('etud-animated-fadeOutHalf');
        element.classList.add(settings.className + '-keyOpaque');
        element.classList.add('etud-animated-fadeInHalf');
        element.classList.add('etud-animated');
    };
    
    var fadeOut = function (element) {
        element.classList.remove(settings.className + '-keyOpaque');
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
        for (var i = 0; i < settings.speeds.length; i += 1) {
            var speed = settings.speeds[i];
            
            var btn = document.createElement('div');
            btn.className = settings.className + '-key';
            
            var imgDir = isScrollingUp ? 'Up' : 'Down';
            var img = '';
            if (speed > 0) {
                img = 'smooth' + imgDir;
            }
            else if (speed < 0) {
                img = 'page' + imgDir;
            }
            if (img) {
                btn.style.backgroundImage = 'url(\'' + settings.imageFolder + img + '.png\')';
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
    
    if (settings.type === $.etudriver.scroller.fixation) {
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
// Calibration verification routine.
// Calibration verification routine.
// User have to look at targets located in the center of grid's cells.
// The target are displayed sequentially for a short time.
// When the verification routine is finished, it computes a value representing the accuracy of gaze pointing.
//
// requires utils.js

function CalibrationVerifier(customSettings) {
    'use strict';

    var container;
    var target;
    var pulsator;
    var canvas, ctx;
    var ratingContainer;
    var close;
    var testPoints = [];
    var settings = customSettings;
    var callbacks;

    var moveStepDuration = 20;
    var dataCollectionDelay = 500;
    var pulsationInterval = 20;

    var delayedFullScreenExitTimer, pulsationTimer = 0;
    var moveFromLocation, moveTo, moveStepCount;
    var currentMoveStep;
    var currentPointIndex = -1;
    var dataCollectionStartTime;
    var canCollectData = false;
    var screenSize;

    var fullScreen = new FullScreen();

    var onFullScreenChanged = function (e) {
        debug('CalibrationVerifier', 'onFullScreenChanged, e = ');
        console.log(e);

        if (currentPointIndex >= 0) {
            return;
        }
        if (fullScreen.isActive) {
            start();
        }
    };

    var onFullScreenError = function (e) {
        debug('CalibrationVerifier', 'onFullScreenError, e = ');
        console.log(e);
    };

    fullScreen.addEventListener('change', onFullScreenChanged);
    fullScreen.addEventListener('error', onFullScreenError);

    this.run = function (customSettings, customCallbacks) {
        callbacks = extend(true, {}, customCallbacks);
        settings = extend(true, {}, settings, customSettings);
        screenSize = getScreenSize();

        fillLocations();
        if (!container) {
            createUI();
        }
        pulsator.style.display = 'none';
        canvas.style.display = 'none';
        ratingContainer.style.display = 'none';
        close.style.display = 'none';
        
        if (settings.display) {
            container.style.display = 'block';
            target.style.display = 'block';

            if (!fullScreen.isActive) {
                fullScreen.request(container);
            } else if (currentPointIndex < 0) {
                start();
            }
        } else if (currentPointIndex < 0) {
            container.style.display = 'none';
            target.style.display = 'none';
            start();
        }
    };

    this.feed = function (ts, x, y) {
        if (canCollectData) {
            testPoints[currentPointIndex].samples.push({ts: ts, x: x, y: y});
        }
    };

    this.isActive = function () {
        return canCollectData;
    };

    // Private methods
    var createUI = function () {
        container = document.createElement('div');
        container.className = 'etud-calibVerifier-container';
        container.classList.add(settings.className.container);

        target = document.createElement('div');
        target.className = 'etud-calibVerifier-target';
        target.classList.add(settings.className.target);
        target.style.width = settings.size + 'px';
        target.style.height = settings.size + 'px';
        target.style.borderRadius = settings.size / 2 + 'px';

        pulsator = document.createElement('div');
        pulsator.className = 'etud-calibVerifier-pulsator';
        pulsator.classList.add(settings.className.pulsator);

        canvas = document.createElement('canvas');
        canvas.width = screenSize.width;
        canvas.height = screenSize.height;
        canvas.className = 'etud-calibVerifier-canvas';
        canvas.addEventListener('click', hideUI);
        canvas.addEventListener('keyup', hideUI);

        ratingContainer = document.createElement('div');
        ratingContainer.className = 'etud-calibVerifier-rating';
        var ratingLabels = ['Amplitude', 'Uniformity'];
        
        for (var i = 0; i < 2; ++i) {
            if (i > 0) {
                var spacer = document.createElement('div');
                spacer.className = 'spacer';
                ratingContainer.appendChild(spacer);
            }
            
            var label = document.createElement('span');
            label.textContent = ratingLabels[i];
            ratingContainer.appendChild(label);
            
            for (var j = 0; j < 5; ++j) {
                var star = document.createElement('div');
                star.className = 'star empty';
                ratingContainer.appendChild(star);
            }
        }
        
        close = document.createElement('div');
        close.className = 'close';
        close.addEventListener('click', hideUI);

        container.appendChild(canvas);
        container.appendChild(pulsator);
        container.appendChild(target);
        container.appendChild(ratingContainer);
        container.appendChild(close);
        document.body.appendChild(container);

        ctx = canvas.getContext('2d');
    };

    var fillLocations = function () {
        testPoints = [];

        for (var i = 0; i < settings.rows; i++) {
            for (var j = 0; j < settings.columns; j++) {
                testPoints.push({
                    location: {
                        x: (j + 0.5) / settings.columns,
                        y: (i + 0.5) / settings.rows
                    },
                    cell: {
                        row: i,
                        col: j
                    },
                    samples: []
                });
            }
        }

        for (i = 0; i < 3*testPoints.length; i++) {
            var idx1 = getRandomInt(testPoints.length - 1);
            var idx2 = getRandomInt(testPoints.length - 1);
            var tmp = testPoints[idx1];
            testPoints[idx1] = testPoints[idx2];
            testPoints[idx2] = tmp;
        }
    };

    var start = function () {
        debug('CalibrationVerifier', 'starting the verification');
        currentMoveStep = 0;
        moveStepCount = Math.floor(settings.transitionDuration / moveStepDuration) + 1;
        next();
    };

    var next = function () {
        canCollectData = false;
        pulsator.style.display = 'none';
        clearInterval(pulsationTimer);
        pulsationTimer = 0;

        if (currentPointIndex >= 0 && callbacks.targetFinished) {
            debug('CalibrationVerifier', 'collected ' + moveTo.samples.length + ' samples');
            var nextTarget = currentPointIndex + 1 === testPoints.length ? null : testPoints[currentPointIndex + 1];
            if (nextTarget) {
                nextTarget = {
                    location: clone(nextTarget.location),
                    cell: clone(nextTarget.cell)
                }
            };
            callbacks.targetFinished(moveTo, nextTarget);
        }

        currentPointIndex++;

        if (currentPointIndex === 0 && callbacks.started) {
            var firstTarget = testPoints[0];
            var nextTarget = {
                location: clone(firstTarget.location),
                cell: clone(firstTarget.cell)
            };
            callbacks.started(nextTarget);
        }

        if (currentPointIndex < testPoints.length) {
            debug('CalibrationVerifier', 'target #' + currentPointIndex);
            if (settings.transitionDuration > 0) {
                debug('CalibrationVerifier', 'animating');
                moveFromLocation = currentPointIndex === 0 ? {x: 0, y: 0} : moveTo.location;
                moveTo = testPoints[currentPointIndex];
                setTimeout(move, moveStepDuration);
            } else {
                moveTo = testPoints[currentPointIndex];
                show();
            }
        } else {
            if (settings.displayResults) {
                delayedFullScreenExitTimer = setTimeout(hideUI, 1000 * settings.displayResults);
            }
            currentPointIndex = -1;
            reportResult();
        }
    };

    var move = function () {
        currentMoveStep++;
        if (currentMoveStep < moveStepCount) {
            var dx = (moveTo.location.x - moveFromLocation.x) / moveStepCount;
            var dy = (moveTo.location.y - moveFromLocation.y) / moveStepCount;
            showAt(moveFromLocation.x + dx * currentMoveStep, moveFromLocation.y + dy * currentMoveStep);
            setTimeout(move, moveStepDuration);
        }
        else {
            currentMoveStep = 0;
            show();
        }
    };

    var showAt = function (x, y) {
        target.style.left = (Math.round(x * screenSize.width) - settings.size/2) + 'px';
        target.style.top = (Math.round(y * screenSize.height) - settings.size/2) + 'px';
    };

    var show = function () {
        debug('CalibrationVerifier', 'target is displaying');
        var testPoint = testPoints[currentPointIndex];
        showAt(testPoint.location.x, testPoint.location.y);

        setTimeout(startDataCollection, dataCollectionDelay);
        setTimeout(next, settings.duration);

        if (callbacks.targetStarted) {
            var currentTarget = {
                location: clone(testPoint.location),
                cell: clone(testPoint.cell)
            }
            callbacks.targetStarted(currentTarget);
        }
    };

    var startDataCollection = function () {
        if (settings.pulsation.enabled) {
            pulsate();
            pulsator.style.display = 'block';
            dataCollectionStartTime = (new Date()).getTime();
            pulsationTimer = setInterval(pulsate, pulsationInterval);
        }
        canCollectData = true;
    };

    var pulsate = function () {
        var duration = (new Date()).getTime() - dataCollectionStartTime;
        var angle = Math.PI * ((duration / settings.pulsation.duration) % 1);
        var size = Math.sin(angle) * settings.pulsation.size;

        var testPoint = testPoints[currentPointIndex];
        pulsator.style.left = (Math.round(testPoint.location.x * screenSize.width) - settings.size/2 - size) + 'px';
        pulsator.style.top = (Math.round(testPoint.location.y * screenSize.height) - settings.size/2 - size) + 'px';
        pulsator.style.width = (settings.size + 2*size) + 'px';
        pulsator.style.height = (settings.size + 2*size) + 'px';
        pulsator.style.borderRadius = (settings.size + 2*size)/2 + 'px';
    };

    var reportResult = function () {
        debug('CalibrationVerifier', 'reporting results');
        var i, len;

        target.style.display = 'none';
        canvas.style.display = 'block';
        ratingContainer.style.display = 'block';
        close.style.display = 'block';

        ctx.clearRect(0, 0, screenSize.width, screenSize.height);
        ctx.font = '16pt Arial';

        var pointStats = [];
        var avg = {
            amplitude: {mean: 0, std: 0},
            angle: {mean: {sin: 0, cos: 0}, std: 0},
            std: {mean: 0, std: 0},
            targets: [],
            apx: {},
            interpretation: []
        };

        // creates zeroed array for approximation
        var avgH = Array.apply(null, new Array(settings.columns)).map(function() { return 0; });
        var avgV = Array.apply(null, new Array(settings.rows)).map(function() { return 0; });

        // for each location
        for (i = 0, len = testPoints.length; i < len; ++i) {
            var testPoint = testPoints[i];
            var point = {
                x: testPoint.location.x * screenSize.width, 
                y: testPoint.location.y * screenSize.height
            };

            ctx.fillStyle = settings.resultColors.target;
            ctx.beginPath();
            ctx.arc(Math.round(point.x), Math.round(point.y), settings.size/2, 0, 2*Math.PI);
            ctx.fill();

            var stats = calcTargetStats(testPoint.samples, point);
            if (stats) {
                stats.location = point;
                stats.cell = testPoint.cell;
                avg.targets.push(stats);
                avg.amplitude.mean += stats.amplitude.abs;
                avg.angle.mean.sin += Math.sin(stats.angle);
                avg.angle.mean.cos += Math.cos(stats.angle);
                avg.std.mean += stats.std;

                avgH[testPoint.cell.col] += stats.amplitude.h;
                avgV[testPoint.cell.row] += stats.amplitude.v;

                ctx.fillStyle = settings.resultColors.offset;
                ctx.beginPath();
                ctx.arc(Math.round(point.x + stats.amplitude.abs * Math.cos(stats.angle)),
                        Math.round(point.y + stats.amplitude.abs * Math.sin(stats.angle)),
                        stats.std, 0, 2*Math.PI);
                ctx.fill();
            }
        }

        if (avg.targets.length > 0) {
            avg.amplitude.mean /= avg.targets.length;
            avg.angle.mean.sin /= avg.targets.length;
            avg.angle.mean.cos /= avg.targets.length;
            avg.std.mean /= avg.targets.length;

            for (i = 0, len = avg.targets.length; i < len; ++i) {
                var targetStat = avg.targets[i];
                avg.amplitude.std += Math.pow(targetStat.amplitude.abs - avg.amplitude.mean, 2);
                avg.std.std += Math.pow(targetStat.std - avg.std.mean, 2);
            }
            avg.amplitude.std = Math.sqrt(avg.amplitude.std / (len - 1));
            avg.std.std = Math.sqrt(avg.std.std / (len - 1));

            avg.angle.std = Math.sqrt(Math.pow(avg.angle.mean.sin, 2) + Math.pow(avg.angle.mean.cos, 2));
            avg.angle.mean = Math.atan2(avg.angle.mean.sin, avg.angle.mean.cos);

            // Modify the approximation arrays
            avgH = avgH.map(function (elem, index) {
                return {
                    x: (2 * index + 1) / settings.columns - 1,
                    y: elem / settings.rows
                };
            });
            avgV = avgV.map(function (elem, index) {
                return {
                    x: (2 * index + 1) / settings.rows - 1,
                    y: elem / settings.columns
                };
            });

            avg.apx =  {
                h: approximate(avgH, 2),
                v: approximate(avgV, 2)
            };

            var canInterpretate = !!(avg.apx.h && avg.apx.v);
            if (canInterpretate) {
                var interpretationH = interpretateDirection(avg.apx.h, ['left', 'right']);
                var interpretationV = interpretateDirection(avg.apx.v, ['top', 'bottom']);
                avg.interpretation = interpretate(interpretationH, interpretationV, avg.amplitude);

                ctx.fillStyle = settings.resultColors.text;
                ctx.fillText(avg.interpretation.text[1], 10, screenSize.height - 50);
                ctx.fillText(avg.interpretation.text[0], 10, screenSize.height - 25);

                var stars = ratingContainer.querySelectorAll('.star');
                for (i = 0, len = stars.length; i < len; ++i) {
                    var star = stars[i];
                    var rating = i < 5 ? avg.interpretation.rating.amplitude : avg.interpretation.rating.uniformity;
                    var value = rating / 2 - (i % 5);
                    if (value > 0.75) {
                        star.className = 'star full';
                    } else if (value > 0.25) {
                        star.className = 'star half';
                    } else {
                        star.className = 'star empty';
                    }
                }
            }
        }

        if (callbacks.finished) {
            callbacks.finished(avg);
        }
    };

    var calcTargetStats = function (samples, point) {
        var offset = {x: 0, y: 0};
        var result = null;
        var sample, i, len;

        ctx.fillStyle = settings.resultColors.sample;

        for (i = 0, len = samples.length; i < len; ++i) {
            sample = samples[i];

            // TODO: some outliers filtering

            offset.x += sample.x - point.x;
            offset.y += sample.y - point.y;

            ctx.beginPath();
            ctx.arc(Math.round(sample.x), Math.round(sample.y), 2, 0, 2*Math.PI);
            ctx.fill();
        }

        if (samples.length > 1) {
            offset.x /= samples.length;
            offset.y /= samples.length;

            var amplitude = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
            var angle = Math.atan2(offset.y, offset.x);

            var std = 0;
            var avg = {x: point.x + offset.x, y: point.y + offset.y};
            for (i = 0, len = samples.length; i < len; ++i) {
                sample = samples[i];
                var dx = sample.x - avg.x;
                var dy = sample.y - avg.y;
                std += dx * dx + dy * dy;   // ^2 and sqrt compensate each other
            }
            std = Math.sqrt(std / (len - 1));
            result = {
                amplitude: {
                    h: Math.abs(offset.x),
                    v: Math.abs(offset.y),
                    abs: amplitude
                },
                angle: angle,
                std: std
            };
        }

        return result;
    };

    // Approximation of a polynomial function using the least-squares method
    // from http://www.alexeypetrov.narod.ru/C/sqr_less_about.html
    var approximate = function (data, K) {
        // init
        var i, j, k;
        var N = data.length;
        if (N < K + 1) {
            return null;
        }

        var a = new Array(K + 1);
        var b = new Array(K + 1);
        var x = new Array(N);
        var y = new Array(N);
        var sums = new Array(K + 1);
        for (k = 0; k < N; ++k) {
            var d = data[k];
            x[k] = d.x;
            y[k] = d.y;
        }
        for (i = 0; i <= K; ++i) {
            a[i] = 0;
            b[i] = 0;
            sums[i] = new Array(K + 1);
            for (j = 0; j <= K; ++j) {
                sums[i][j] = 0;
                for (k = 0; k < N; ++k) {
                    sums[i][j] += Math.pow(x[k], i+j);
                }
            }
        }
        for (i = 0; i <= K; ++i) {
            for (k = 0; k < N; ++k) {
                b[i] += Math.pow(x[k], i) * y[k];
            }
        }

        // diagonal
        var temp = 0;
        for (i = 0; i <= K; ++i) {
            if (sums[i][i] === 0) {
                for (j = 0; j <= K; ++j) {
                    if (j === i) continue;
                    if (sums[j][i] !== 0 && sums[i][j] !== 0) {
                        for (k = 0; k <= K; ++k) {
                            temp = sums[j][k];
                            sums[j][k] = sums[i][k];
                            sums[i][k] = temp;
                        }
                        temp = b[j];
                        b[j] = b[i];
                        b[i] = temp;
                        break;
                    }
                }
            }
        }

        for (k = 0; k <= K; ++k) {
           for (i = k + 1; i <= K; ++i) {
                if (sums[k][k] === 0) {
                   //printf("\nSolution does not exist.\n");
                   return null;
                }
                var M = sums[i][k] / sums[k][k];
                for (j = k; j <= K; ++j) {
                    sums[i][j] -= M * sums[k][j];
                }
                b[i] -= M*b[k];
            }
        }

        for (i = K; i >= 0; --i) {
            var s = 0;
            for (j = i; j <= K; ++j) {
                s += sums[i][j] * a[j];
            }
            a[i] = (b[i] - s) / sums[i][i];
        }

        return a;
    };

    var interpretateDirection = function (a, sides) {
        var compute = function (a, x) {
            var result = 0;
            for (var i = 0, len = a.length; i < len; ++i) {
                result += a[i] * Math.pow(x, i);
            }
            return result;
        };

        var threshold = settings.interpretationThreshold;

        // compute the values on the one side, center and other side of the screen
        var y = [compute(a, -1), compute(a, 0), compute(a, 1)];

        // compute relative differences: side1/center, side2/center, side1/side2
        var diff = [(y[0] - y[1]) / threshold, (y[2] - y[1]) / threshold, (y[0] - y[2]) / threshold];

        // comparison states
        var better = -1;
        var same = 0;
        var worse = 1;

        // convert the relative differences into states
        var diff2state = function (value) {
            var result = same;
            if (value <= -1) {
                result = better;
            }
            else if (value >= 1) {
                result = worse;
            }
            return result;
        };

        // lets have states for each comparison pair
        diff = diff.map(diff2state);

        var side1 = 0,
            center = 1,
            side2 = 2;

        var intrp = [Number.NaN, Number.NaN, Number.NaN];
        var intrpVal = {
            muchWorse: -2,
            worse: -1,
            equal: 0,
            better: 1,
            muchBetter: 2
        };

        var interpTypes = {
            flat: 'flat',
            lowGradient: 'low gradient',
            highGradient: 'high gradient',
            side: 'high side',
            lowCone: 'low cone',
            highCone: 'high cone'
        };
        var interpType;

        if (diff[0] === better && diff[1] === better) {
            intrp[center] = intrpVal.muchWorse;
            interpType = interpTypes.highCone;
        } else if (diff[0] === worse && diff[1] === worse) {
            intrp[center] = intrpVal.muchBetter;
            interpType = interpTypes.highCone;
        } else if (diff[0] === better && diff[1] === same && diff[2] === better) {
            intrp[side1] = intrpVal.muchBetter;
            interpType = interpTypes.side;
        } else if (diff[0] === better && diff[1] === same && diff[2] === same) {
            intrp[side1] = intrpVal.better;
            intrp[center] = intrpVal.worse;
            interpType = interpTypes.lowCone;
        } else if (diff[0] === better && diff[1] === worse && diff[2] === better) {
            intrp[side1] = intrpVal.better;
            intrp[side2] = intrpVal.worse;
            interpType = interpTypes.highGradient;
        } else if (diff[0] === same && diff[1] === better && diff[2] === same) {
            intrp[side2] = intrpVal.better;
            intrp[center] = intrpVal.worse;
            interpType = interpTypes.lowCone;
        } else if (diff[0] === same && diff[1] === better && diff[2] === worse) {
            intrp[side2] = intrpVal.muchBetter;
            interpType = interpTypes.side;
        } else if (diff[0] === same && diff[1] === same && diff[2] === better) {
            intrp[side1] = intrpVal.better;
            interpType = interpTypes.lowGradient;
        } else if (diff[0] === same && diff[1] === same && diff[2] === same) {
            intrp[center] = intrpVal.equal;
            interpType = interpTypes.flat;
        } else if (diff[0] === same && diff[1] === same && diff[2] === worse) {
            intrp[side2] = intrpVal.better;
            interpType = interpTypes.lowGradient;
        } else if (diff[0] === same && diff[1] === worse && diff[2] === better) {
            intrp[side2] = intrpVal.muchWorse;
            interpType = interpTypes.side;
        } else if (diff[0] === same && diff[1] === worse && diff[2] === same) {
            intrp[side2] = intrpVal.worse;
            intrp[center] = intrpVal.better;
            interpType = interpTypes.lowCone;
        } else if (diff[0] === worse && diff[1] === better && diff[2] === worse) {
            intrp[side1] = intrpVal.worse;
            intrp[side2] = intrpVal.better;
            interpType = interpTypes.highGradient;
        } else if (diff[0] === worse && diff[1] === same && diff[2] === same) {
            intrp[side1] = intrpVal.worse;
            intrp[center] = intrpVal.better;
            interpType = interpTypes.lowCone;
        } else if (diff[0] === worse && diff[1] === same && diff[2] === worse) {
            intrp[side1] = intrpVal.muchWorse;
            interpType = interpTypes.side;
        }

        var rating = ['much worse', 'worse', '', 'better', 'much better'];

        var at = ' at ';
        var to = ' to ';
        var worseningFrom = 'gradually worsening from ';

        var result = [];
        if (!isNaN(intrp[center])) {
            if (!isNaN(intrp[side1])) {
                result.push(rating[intrp[side1]+2] + at + sides[0]);
            } else if (!isNaN(intrp[side2])) {
                result.push(rating[intrp[side2]+2] + at + sides[1]);
            }
            if (intrp[center] !== 0) {
                result.push(rating[intrp[center]+2] + at + 'center');
            } else {
                result.push('about equal');
            }
        } else if (!isNaN(intrp[side1])) {
            if (!isNaN(intrp[side2])) {
                if (intrp[side1] > intrp[side2]) {
                    result.push(worseningFrom + sides[0] + to + sides[1]);
                } else {
                    result.push(worseningFrom + sides[1] + to + sides[0]);
                }
            } else {
                result.push(rating[intrp[side1]+2] + at + sides[0]);
            }
        } else if (!isNaN(intrp[side2])) {
            result.push(rating[intrp[side2]+2] + at + sides[1]);
        }

        return {text: result, type: interpType};
    };

    var interpretate = function (intrpH, intrpV, amplitude) {
        var success = [];
        var failed = [];
        var text;

        // compound the interpretations, successful and failed separately
        if (intrpH.text.length) {
            success.push(intrpH.text.join(', ') + ' in the horizontal dimension');
        } else {
            failed.push(' horizontal');
        }

        if (intrpV.text.length) {
            success.push(intrpV.text.join(', ') + ' in the vertical dimension');
        } else {
            failed.push(' vertical');
        }

        if (success.length > 0) {
            text = success.join(', ');
            success = ['Interpretation: calibration is ', text, '.'];
        }
        if (failed.length > 0) {
            text = failed.join(' and ');
            failed = ['Cannot interpretate results for the ', text, ' dimension.'];
        }

        // estimate the overall calibration quality ratings
        var amplitude = 10 - Math.floor(2 * amplitude.mean / settings.interpretationThreshold);

        var test = function (what, where) {
            return (new RegExp(what)).test(where);
        };

        var uniformity = 10;
        uniformity -= test('gradient|cone|side', intrpH.type) ? 2 : 0;
        uniformity -= test('gradient|cone|side', intrpV.type) ? 2 : 0;
        uniformity -= test('high', intrpH.type) ? 2 : 0;
        uniformity -= test('high', intrpV.type) ? 2 : 0;

        var result = {
            text: [
                success.join(''), 
                failed.join('')
            ], 
            rating: {
                amplitude: Math.max(1, amplitude),
                uniformity: Math.max(1, uniformity),
            }
        };
        return result;
    };

    var hideUI = function () {
        container.style.display = 'none';
        fullScreen.exit();

        if (delayedFullScreenExitTimer) {
            clearTimeout(delayedFullScreenExitTimer);
            delayedFullScreenExitTimer = 0;
        }
    };
}

})(window);