# etudriver-web
=============

The JavaScript library to support eye-tracking on web pages. It communicates with [ETU-Driver](http://www.sis.uta.fi/~csolsp/projects.php) via WebSocket using plain-text commands and receives data in JSON format. The WebSocket server can be set up by launching on a local machine the "ETU-Driver service" application with the "Tracking > WerSocket server" checked.

## Features

- gaze data from `ETU-Driver`
- event when the tracking or other `ETU-Driver` state changes
- commands for `ETU-Driver` to show options dilaog, calibrate, and toggle gaze tracking
- embed a panel with buttons to execute thesse commands
- shows gaze pointer
- allows heads movements to be used for correcting the gaze pointer location
- applies smooting for gaze pointer
- allows using raw data or fixation data for pointing at targets
- allows naive or advanced gaze-to-target mapping algorithms
- detect nodding head gesture
- allows to calibrate a custom head gesture
- uses dwell time (naive of cumulative), nodding or custom head gestures for target selection
- displays a progress of dwell time
- developers may define few categories of targets, each with its own method of selection and visual feedback for mapping and selection events
- page scrolling using 1) dedicated panels to fixate on, 2) head movements 
- default or customized keyboard to display when a used selects a target of a certain category
- keyboard customization is very flexible and allows controlling selections of each key

## Usage

See [examples] (https://github.com/lexasss/etudriver-web/tree/master/examples) to get ideas of how and for what the library can be used. See comments in the JS file for the feature-by-feature explanation of the `etudriver` configuration

In HTML, include only the `etudriver-[version].js` or `etudriver-[version].min.js` file, the CSS file will be loaded automatically. The library exports `etudriver` variable. Initialize this variable when the page DOM is loaded (`DOMContentLoaded`).

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