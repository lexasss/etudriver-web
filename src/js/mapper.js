// Mapping routine
// 
// Require objects in GazeTargets:
//         mapping.types
//      mapping.models
//         events: { focused, left }

(function (root) {

    'use strict';

    var Mapper = {
        init: function (_settings, _isTargetDisabled, _targetEvent) {
            settings = _settings;
            isTargetDisabled = _isTargetDisabled;
            targetEvent = (typeof _targetEvent === 'function') ? _targetEvent : null;
            
            mappingTypes = GazeTargets.mapping.types;

            createModel();
        },

        reset: function () {
            model.reset();
            focused = null;
            lastFocused = null;
        },

        setTargets: function (_targets) {
            targets = _targets;
        },

        feed: function (x, y, fixationDuration) {

            var mapped = null;

            if (targets) {
                var activeTargets = [];
                for (var i = 0; i < targets.length; i += 1) {
                    var target = targets[i];
                    if (isTargetDisabled(target)) {
                        continue;
                    }
                    activeTargets.push(target);
                }

                mapped = model.feed(activeTargets, x, y, fixationDuration);
            }

            var isNewFocused = false;
            if (mapped !== focused) {
                changeFocus(mapped);
                isNewFocused = !!focused;
            }

            return {
                focused: focused,
                lastFocused: lastFocused,
                isNewFocused: isNewFocused,
            };
        }
    };

    var createModel = function () {
        switch (settings.type) {
        case mappingTypes.naive:
            model = root.GazeTargets.Models.Naive;
            model.init(settings.naive);
            break;
        case mappingTypes.expanded:
            model = root.GazeTargets.Models.Expanded;
            model.init(settings.expanded);
            break;
        case mappingTypes.reading:
            model = root.GazeTargets.Models.Reading;
            model.init(settings.reading);
            break;
        default:
            model = {
                init: function () { },
                feed: function (targets, x, y) { return null; },
                reset: function () { }
            };
            break;
        }
    };

/*
    var map = function (x, y) {
        if (!targets) {
            return null;
        }
        
        var mapped = null;

        switch (settings.type) {
        case mappingTypes.naive:
            mapped = mapNaive(x, y);
            break;
        case mappingTypes.expanded:
            mapped = mapExpanded(x, y);
            break;
        default:
            break;
        }

        return mapped;
    };

    var mapNaive = function (x, y) {
        var mapped = null;
        var i;
        for (i = 0; i < targets.length; i += 1) {
            var target = targets[i];
            if (isTargetDisabled(target)) {
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
            if (isTargetDisabled(target)) {
                continue;
            }
            
            var rect = target.getBoundingClientRect();
            var dx = x < rect.left ? rect.left - x : (x > rect.right ? x - rect.right : 0);
            var dy = y < rect.top ? rect.top - y : (y > rect.bottom ? y - rect.bottom : 0);
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist && dist < settings.expansion) {
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
    };*/

    var changeFocus = function (mapped) {
        var event;

        if (focused) {
            focused.gaze.focused = false;
            if (focused.gaze.mapping.className) {
                focused.classList.remove(focused.gaze.mapping.className);
            }
            event = new Event(GazeTargets.events.left);
            focused.dispatchEvent(event);
            
            if (targetEvent) {
                targetEvent(GazeTargets.events.left, focused);
            }
        }

        if (mapped) {
            mapped.gaze.focused = true;
            if (mapped.gaze.mapping.className) {
                mapped.classList.add(mapped.gaze.mapping.className);
            }
            event = new Event(GazeTargets.events.focused);
            mapped.dispatchEvent(event);
            
            if (targetEvent) {
                targetEvent(GazeTargets.events.focused, mapped);
            }
        }

        focused = mapped;
        if (focused) {
            lastFocused = focused;
        }
    };


    var settings;
    var targets;
    var isTargetDisabled;
    var targetEvent;

    var focused = null;
    var lastFocused = null;

    var mappingTypes;

    var model;

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Mapper = Mapper;

})(window);