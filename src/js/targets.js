// Target manager

(function (root) {

    'use strict';

    var Targets = {
        init: function (_settings, _keyboards) {
            settings = _settings;
            keyboards = _keyboards;
        },
        items: function () {
            return items;
        },
        update: function (kbd, scrollerItems) {
            items = [];
            var ts, elems, i;
            
            for (var idx in settings) {
                ts = settings[idx];
                elems = document.querySelectorAll(ts.selector);
                for (i = 0; i < elems.length; i += 1) {
                    add(elems[i], ts);
                }
            }
            
            if (kbd) {
                ts = kbd.keyboard.options;
                elems = kbd.keyboard.getDOM().querySelectorAll(kbd.selector);
                for (i = 0; i < elems.length; i += 1) {
                    add(elems[i], ts);
                }
            }
            
            for (var target in scrollerItems) {
                ts = scrollerItems[target];
                elems = document.querySelectorAll(ts.selector);
                for (i = 0; i < elems.length; i += 1) {
                    add(elems[i], ts);
                }
            }
        },
        reset: function () {
            for (var i = 0; i < items.length; i += 1) {
                var item = items[i];
                var gaze = item.gaze;
                gaze.focused = false;
                gaze.selected = false;
                if (gaze.mapping.className) {
                    item.classList.remove(gaze.mapping.className);
                }
            }
        }
    };

    var add = function (elem, settings) {
        elem.gaze = {
            focused: false,
            selected: false,
            attention: 0,
            selection: settings.selection,
            mapping: settings.mapping,
            keyboard: settings.keyboard ? keyboards[settings.keyboard] : null
        };
        items.push(elem);
    };

    var items = [];
    var settings;
    var keyboards;

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Targets = Targets;

})(window);