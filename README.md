# etudriver-web
=============

The JavaScript library to support eye-tracking on web pages. It communicates with [ETU-Driver](http://www.sis.uta.fi/~csolsp/projects.php) via WebSocket using plain-text commands and receives data in JSON format. The WebSocket server can be set up by launching on a local machine the "ETU-Driver service" application with the "Tracking > WerSocket server" checked.

## Features

- streams gaze data from `ETU-Driver` into a web-page (see [the 'camera' and 'heatmap' examples] (https://github.com/lexasss/etudriver-web/tree/master/examples))
- fires an event when the tracking or other `ETU-Driver` state changes
- contains methods to send commands to `ETU-Driver` to show options window, calibrate, and toggle gaze tracking
- embeds a panel with buttons to send these commands
- shows gaze pointer
- allows using head movements for the gaze pointer location correction
- applies smoothing for the gaze pointer
- allows selecting between raw data or fixation data in mapping gaze-to-target calculation routine
- provides several gaze-to-target mapping algorithms
- detects nodding head gesture
- allows to calibrate a custom head gesture
- uses dwell time (naive or cumulative), nodding or custom head gestures for target selection
- displays a progress of dwell time
- allows defining few categories of targets, each with its own method of selection and visual feedback for mapping and selection events (see [the 'targets' example] (https://github.com/lexasss/etudriver-web/tree/master/examples/targets.html))
- allows page scrolling using 1) dedicated transparent panels to fixate on, 2) head movements (see [the 'scroller' example] (https://github.com/lexasss/etudriver-web/tree/master/examples/scroller.html))
- contains a keyboard to display when a used selects a target of a certain category (see [the 'keyboard' example] (https://github.com/lexasss/etudriver-web/tree/master/examples))
- allows defining custom keyboards; on a key selection, a custom scenario can be executed, this making keyboards very flexible that can be used not only for text input  (see [the 'keyboardSC' example] (https://github.com/lexasss/etudriver-web/tree/master/examples))

## Usage

See [examples] (https://github.com/lexasss/etudriver-web/tree/master/examples) to get ideas of how and for what the library can be used. See [comments] (https://github.com/lexasss/etudriver-web/blob/master/js/main.js) in the JS file for the feature-by-feature explanation of the `etudriver` configuration

In HTML, include only the `etudriver-[version].js` or `etudriver-[version].min.js` file, the CSS file will be loaded automatically. The library exports `etudriver` variable. Initialize this variable when the page DOM is loaded (`DOMContentLoaded`). The basic code is shown in [this] (https://github.com/lexasss/etudriver-web/blob/master/examples/simplest.html) example.

### Methods

- `init (settings, callbacks)`: initializes the library; takes custom settings and callbacks (see the sections below for the description)
- `updateTargets ()`: updates targets, if they have been changed
- `calibrateCustomHeadGesture (name, onfinished)`: shows the custom head gesture calibration window; takes the detector name and a callback function that is called on closing the calibration window (arguments: 'name' the name of detector)
- `showOptions (onclosed)`: shows `ETU-Driver` options dialog; takes a callback function that is called when the options dialog is closed (arguments: accepted: boolean, true if a user pressed "OK" button, false otherwise)
- `calibrate (onfinished)`: calibrates the current device; takes a callaback function that is called when the calibration is finished (arguments: accepted: boolean, true if a new calibration was accepted, false otherwise)
- `toggleTracking ()`: toggles tracking
- `getKeyboard (name)`: returns the keyboard object; takes the keyboard name

### Settings

to appear; meanwhile, see the [js/main.js](https://github.com/lexasss/etudriver-web/blob/master/js/main.js).

### Callbacks

- `state`: fires when `ETU-Driver` state changes; arguments:
    - `state`: current state; the object consists of:
        - `isServiceRunning`: connected to the service via WebSocket
        - `isConnected`: connected to a tracker
        - `isCalibrated`: the tracker is calibrated
        - `isTracking`: the tracker is sending data
        - `isStopped`: the tracker was just stopped
        - `isBusy`: the service is temporally unavailable (calibration is in progress, 'Options' window is shown, etc.)
        - `device`: name of the device, if connected
- `sample`: fires when a new sample (average from both eyes) is available; arguments:
    - `timestamp`: data timestamp (integer)
    - `x`: gaze x (integer)
    - `y`: gaze y (integer)
    - `pupil`: pupil size (float)
    - `ec` = `{xl, yl, xr, yr}`: eye-camera values (float 0..1)
- `target`: fires on target enter, leave and selection; arguments:
    - `event`: a value from etudriver.event
    - `target`: the target
- `keyboard`: fires on a keyboard visibility change
    - `keyboard`: the keyboard
    - `visible`: the visibility flag

## Example

HTML
```html
<html>
<head>
    <script type="text/javascript" src="etudriver-0.1.1.min.js"></script>
</head>
<body>
    <div class="container">
        <div class="etud-target">left</div>
        <div class="etud-target">right</div>
    </div>
</body>
</html>
```

JS
```javascript
document.addEventListener('DOMContentLoaded', function() {
  etudriver.init({ /* use only default settings */ }, { /* no callbacks */});
});
```

CSS
```css
body {
    background-color: #CCCCCC;
}

.container {
    padding: 20px 0;
    width: 100%;
    text-align: center;
}

.container:after {
    content: '';
    display: inline-block;
    height: 90%;
    vertical-align: middle;
    width: 0;
}

.etud-target {
    display: inline-block;
    background-color: deepskyblue;
    margin: 20px 100px;
    width: 140px;
    height: 140px;
    
    border: 1px solid black;
    border-radius: 8px;
    text-align: center;
    font: 18pt arial, sans-serif;
    color: black;
    line-height: 140px;
    vertical-align: middle;
}

.etud-focused {
    background-color: tomato;
    color: white;
}        

.etud-selected {
    background-color: #CC4F39;
    color: white;
}        
```

## todo's

### High priority
- "system error correction" task: N x M targets on a full-screen fixed DIV
  (N=10, M=20 in Towards Effective Eye Pointing for Gaze-Enhanced Human-Computer Interaction)

### Moderate priority
- custom probability map
- online recalibration
- scrolling keyboard (by head pose) 

### Low priority
- find out a way to support multiple eye trackers stream data same time