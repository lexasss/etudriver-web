// Mapping routine
// 
// Require objects in GazeTargets:
//         selection.types
//         events: { selected }

(function (root) {

    'use strict';

    var Selector = {
        init: function (_settings, _isTargetDisabled, _nodDetector, _chgDetectors, _targetEvent) {
            settings = _settings;
            isTargetDisabled = _isTargetDisabled;
            nodDetector = _nodDetector;
            chgDetectors = _chgDetectors;
            targetEvent = (typeof _targetEvent === 'function') ? _targetEvent : null;

            selectionTypes = GazeTargets.selection.types;
        },

        setTargets: function (_targets) {
            targets = _targets;
        },

        reset: function () {
            selected = null;
        },

        feed: function (focused, duration) {
            var newSelected = detectSelection(focused, duration);
            if (newSelected !== selected) {
                select(newSelected);
            }
        }
    };

    var detectSelection = function (focused, duration) {
        var result = null;
        
        // check the focused target first, if exists
        var startIndex = focused ? -1 : 0;
        for (var i = startIndex; i < targets.length; i += 1) {
            var target = i < 0 ? focused : targets[i];
            if (i >= 0 && target === focused) {
                continue;
            }
            if (isTargetDisabled(target)) {
                continue;
            }
            
            switch (target.gaze.selection.type) {
            case selectionTypes.cumulativeDwell:
                if (duration) {
                    if (selectCumulativeDwell(target, duration, target === focused)) {
                        result = target;
                    }
                }
                break;
            case selectionTypes.simpleDwell:
                if (/*fixdet.currentFix && */duration) {
                    if (selectSimpleDwell(target, duration, target === focused)) {
                        result = target;
                    }
                }
                break;
            case selectionTypes.nod:
                if (nodDetector) {
                    result = nodDetector.current;
                }
                break;
            case selectionTypes.customHeadGesture:
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

        return result;
    };

    var selectCumulativeDwell = function (target, duration, isFocused) {
        var result = false;
        if (isFocused) {
            target.gaze.attention += duration;
            if (target.gaze.attention >= target.gaze.selection.dwellTime) {
                result = true;
                for (var i = 0; i < targets.length; i += 1) {
                    var t = targets[i];
                    if (t.gaze.selection.type === selectionTypes.cumulativeDwell) {
                        t.gaze.attention = 0;
                    }
                }
            }
        } else {
            target.gaze.attention = Math.max(0, target.gaze.attention - duration);
        }
        
        return result;
    };

    var selectSimpleDwell = function (target, duration, isFocused) {
        var result = false;
        if (isFocused) {
            target.gaze.attention += duration;
            for (var i = 0; i < targets.length; i += 1) {
                var t = targets[i];
                if (t.gaze.selection.type === selectionTypes.simpleDwell && t !== target) {
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

    var select = function (target) {
        if (selected) {
            selected.gaze.selected = false;
        }

        if (target) {
            var gazeObj = target.gaze;
            gazeObj.selected = true;
            if (gazeObj.selection.className) {
                target.classList.add(gazeObj.selection.className);
                setTimeout(function () {
                    target.classList.remove(gazeObj.selection.className);
                }, gazeObj.selection.duration);
            }

            if (gazeObj.selection.audio) {
                gazeObj.selection.audio.play();
            }
            var event = new Event(GazeTargets.events.selected);
            target.dispatchEvent(event);
            
            if (targetEvent) {
                targetEvent(GazeTargets.events.selected, target);
            }
            
            if (gazeObj.keyboard) {
                gazeObj.keyboard.show(target);
            }
        }

        selected = target;
    };

    var settings;
    var targets;
    var isTargetDisabled;
    var nodDetector;
    var chgDetectors;
    var targetEvent;
    
    var selected = null;
    
    var selectionTypes;
    
    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Selector = Selector;

})(window);