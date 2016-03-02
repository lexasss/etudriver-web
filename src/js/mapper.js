// Mapping routine
// 
// Require objects in GazeTargets:
//      mapping:: { types }
//      events: { focused, left }
//      Models: { Naive, Expanded, Reading }

(function (root) {

    'use strict';

    var Mapper = {
        init: function (_settings, _isTargetDisabled, _targetEvent) {
            settings = _settings;
            isTargetDisabled = _isTargetDisabled;
            targetEvent = (typeof _targetEvent === 'function') ? _targetEvent : null;
            
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

        // Arguments: 
        //  if both data1 and data2 are defined: this is x and y of a sample
        //  if daat2 is undefined: daat1 is a fixation
        feed: function (data1, data2) {

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

                mapped = model.feed(activeTargets, data1, data2);
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
        var types = GazeTargets.mapping.types;

        switch (settings.type) {
        case types.naive:
            model = root.GazeTargets.Models.Naive;
            model.init(settings.naive);
            break;
        case types.expanded:
            model = root.GazeTargets.Models.Expanded;
            model.init(settings.expanded);
            break;
        case types.reading:
            model = root.GazeTargets.Models.Reading[ settings.readingModel ];
            model.init(settings.reading[ settings.readingModel ], settings.reading.commons);
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

    var model;

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Mapper = Mapper;

})(window);