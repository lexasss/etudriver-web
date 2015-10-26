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
            mappingModels = GazeTargets.mapping.models;

            createModel();
        },

        reset: function () {
            model.reset();
            focused = null;
            lastFocused = null;
        },

        feed: function (targets, x, y, fixationDuration) {
            var correctedPoint = model.feed(targets, x, y, fixationDuration);
            var mapped = map(targets, correctedPoint.x, correctedPoint.y);
            model.setSelected(mapped);

            var isNewFocused = false;
            if (mapped !== focused) {
                changeFocus(mapped);
                isNewFocused = !!focused;
            }

            return {
                focused: focused,
                lastFocused: lastFocused,
                isNewFocused: isNewFocused
            };
        }
    };

    var createModel = function () {
        switch (settings.model) {
        case mappingModels.reading:
            model = root.GazeTargets.Models.Reading;
            model.init(settings.reading);
            break;
        default:
            model = {
                feed: function (targets, x, y) { return { x: x, y: y }; },
                setSelected: function () { },
                reset: function () { }
            };
            break;
        }
    };

    var map = function (targets, x, y) {
        var mapped = null;

        switch (settings.type) {
        case mappingTypes.naive:
            mapped = mapNaive(targets, x, y);
            break;
        case mappingTypes.expanded:
            mapped = mapExpanded(targets, x, y);
            break;
        default:
            break;
        }

        return mapped;
    };

    var mapNaive = function (targets, x, y) {
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

    var mapExpanded = function (targets, x, y) {
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
    };

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
    var isTargetDisabled;
    var targetEvent;

    var focused = null;
    var lastFocused = null;

    var mappingTypes;
    var mappingModels;

    var model;

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Mapper = Mapper;

})(window);