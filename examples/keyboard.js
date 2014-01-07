if (!window.$) {
    window.$ = document;
}

var chat, input;

document.addEventListener('DOMContentLoaded', function() {
    chat = document.getElementById('chat');
    input = document.getElementById('input');
    
    etudriver.keyboard.send = {
        // required
        layout: '[\"!|!|1,?|?|2,:|:|3,;|;|4,\\u0027|\\u0027|5,\\u0022|\\u0022|6,&|&|7,@|@|8,(|(|9,)|)|0,backspace.png\"],\
                 [\"q|Q|+,w|W|-:,e|E|*,r|R|\\/,t|T|=,y|Y|%,u|U|$,i|I|#,o|O|(,p|P|),enter.png\"],\
                 [\"a|A|@,s|S|~,d|D|^,f|F|\\u005C,g|G|_,h|H|&,j|J|[,k|K|],l|L|\\u007B, | |\\u007D,symbols.png|symbols.png|upcase.png\"],\
                 [\"z|Z|dwellInc.png,x|X|dwell,c|C|dwellDec.png,v|V|\",{\"titles\":[\"b\",\"B\",\" \"], \"zoom\":[1,1,2]},\"n|N|,m|M|\",{\"titles\":[\",\",\"<\",\"<\"], \"commands\":[\",\",\"<\",\"<\"]},\".|>|>\",\"upcase.png|lowcase.png,send.png:custom\"]',
        // optional
        callbacks: {
            send: function (keyboard) {
                var kbdIE = keyboard ? keyboard.getInputElem() : input;
                var value = kbdIE.value;
                if (value.length > 0) {
                    insertMessage(value, 'sent');
                    kbdIE.value = '';
                    setTimeout(getRandomAnswer, 4000);
                }
            }
        },
        imageFolder: 'images/kbd/default-send/',     // location of images relative to the HTML file
    };
    
    etudriver.init({
        targets: [
            {
                selector: '#input',
                keyboard: 'send'
            }
        ]
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
            if (state.isTracking) {
                etudriver.getKeyboard('send').show(input);
            }
        }
    });
});

function getRandomAnswer() {
    var ip = Math.round(Math.random()*250 + 1) + '.' +
             Math.round(Math.random()*250 + 1) + '.' +
             Math.round(Math.random()*250 + 1) + '.' +
             Math.round(Math.random()*250 + 1);
    var request = ['country_name', 'city'];
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var data = JSON.parse(xmlhttp.responseText);
            var result = [];
            if (data['country_name']) {
                result.push(data['country_name']);
            }
            if (data['region_name']) {
                result.push(data['region_name']);
            }
            if (data['city']) {
                result.push(data['city']);
            }
            if (result.length > 0) {
                insertMessage(result.join(', '), 'received'); 
            } else {
                setTimeout(getRandomAnswer, 1000);
            }
        }
    };
    xmlhttp.open('GET', 'http://freegeoip.net/json/' + ip, true);
    xmlhttp.send();
}

function insertMessage(text, type) {
    var time = document.createElement('div');
    time.className = 'msg-time';
    time.classList.add('etud-animated');
    time.classList.add('etud-animated-fadeInUp');
    time.innerHTML = (new Date()).toLocaleTimeString().slice(0, 5);

    var msg = document.createElement('div');
    msg.className = 'msg msg-' + type;
    msg.classList.add('etud-animated');
    msg.classList.add('etud-animated-appearDown');
    if (msg.innerText) {
        msg.innerText = text;
    } else {
        msg.textContent = text;
    }

    msg.insertBefore(time, msg.firstChild);
    chat.insertBefore(msg, chat.firstChild);
}
