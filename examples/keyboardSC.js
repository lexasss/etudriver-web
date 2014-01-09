if (!window.$) {
    window.$ = document;
}

var chat, input;

document.addEventListener('DOMContentLoaded', function() {    
    var sc = new SymbolCreator();
    var callbacks = sc.getCallbacks();
    
    etudriver.keyboard.sc = {
        layout: '[\"c.png:custom,f.png:custom,n.png:custom,o.png:custom,i.png:custom,j.png:custom,t.png:custom,_.png:custom,backspace.png,hide.png\"]',
        callbacks: callbacks,
        className: {
            container: 'symbolCreator-kbd',
            button: 'symbolCreator-btn'
        },
        imageFolder: 'images/kbd/sc/',
    };
    
    etudriver.init({
        targets: [
            {
                selector: '.data',
                keyboard: 'sc'
            }
        ],
        progress: {
            color: '#FF3333',
            size: 80,
            minWidth: 10
        }
    }, {
        // callbacks
        target: function (event, target) {
            if (event === etudriver.event.selected) {
                var evObj = new MouseEvent('mousedown', {
                    'view': window,
                    'bubbles': false,
                    'cancelable': true
                });
                target.dispatchEvent(evObj);
            }
        },
        state: function (state) {
            if (state.isConnected) {
                document.getElementById('warning').classList.add('hidden');
            }
        }
    });
});

function SymbolCreator () {
    var state = '';
    
    var parts = {
        c: 'c',
        f: 'f',
        n: 'n',
        o: 'o',
        i: 'i',
        j: 'j',
        t: 't',
        _: '_'
    };
    
    var alphabet = {
        a: parts.o + parts.i,
        b: parts.f + parts.o,
        c: parts.c + parts._,
        d: parts.o + parts.f,
        e: parts.t + parts.c,
        f: parts.f + parts.t,
        g: parts.o + parts.j,
        h: parts.f + parts.n,
        i: parts.i + parts._,
        j: parts.t + parts.j,
        k: parts.f + parts.c,
        l: parts.f + parts.i,
        m: parts.n + parts.n + parts.n,
        n: parts.n + parts.n + parts._,
        o: parts.o + parts._,
        p: parts.j + parts.o,
        q: parts.o + parts.t,
        r: parts.n + parts.t,
        s: parts.t + parts._,
        t: parts.i + parts.t,
        u: parts.i + parts.i + parts._,
        v: parts.j + parts._,
        w: parts.i + parts.i + parts.i,
        x: parts.n + parts.i,
        y: parts.i + parts.j,
        z: parts.t + parts.t
    };
    
    var insert = function (str, input) {
        var caretPos = input.selectionStart;
        var value = input.value;
        if (typeof caretPos !== 'undefined' && typeof value !== 'undefined') {
            var start = value.substr(0, caretPos);
            var end = value.substr(caretPos);
            input.value = start + str + end;
            input.selectionStart = caretPos + str.length;
            input.selectionEnd = caretPos + str.length;
        }
    };
    
    var parse = function (str, input) {
        var result;
        for (var letter in alphabet) {
            var code = alphabet[letter];
            if (str === code) {
                result = letter;
                break;
            }
        }
        
        if (str.length === 3 && !result) {
            state = str.substr(1);
            parse(state);
        }
    
        if (result) {
            insert(result, input);
            state = '';
        }
    };
    
    var feed = function (part, input) {
        state += part[0];

        if (state.length > 1) {
            parse(state, input);
        }
        
        if (part[0] === parts._) {
            state = '';
        }
    };
    
    this.getCallbacks = function () {
        var result = {};
        var assign = function (p) {
            result[p] = function (keyboard) { 
                feed(p, keyboard.getInputElem()); 
            }
        };
        
        for (var part in parts) {
            assign(part);
        }

        return result;
    };
}