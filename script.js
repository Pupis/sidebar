// jshint laxbreak: true 

(function(window, document) {

var items = {};
var site = {};
var _push;

initialize();

function initialize() {
    var queue = _sidebar;
    var args = queue.slice();

    _push = queue.push;
    queue.push = push;
    queue.on = on;
    queue.off = off;
    queue.length = 0;

    push.apply(queue, args);
}

function push() {
    var config = arguments;
    var instance, selector, key, value, prop, i, l;
    var changed = {};
    var changedSite = false;
    var reg = /^on\w+/;

    for (i = 0, l = config.length; i < l; i++) {
        selector = config[i][0].split('.');
        key = selector[0];
        prop = selector[1];
        value = config[i][1];

        if (prop) {
            instance = items[key];
            if ( ! instance) {
                instance = create();
                items[key] = instance;
            }

            changed[key] = instance;

            if (reg.exec(prop)) {
                on(instance, prop, value);

                if (prop === 'oninit') {
                    emit(instance, 'oninit');
                }
            } else {
                instance.params[prop] = value;
            }
        } else {
            if (reg.exec(key)){
                for (var item in items) {
                    on(items[item], key, value);
                }
            } else {
                site[key] = value;
                changed = items;
                if (key == 'contentWidth') {
                   changedSite = true;
                }
            }
        }
    }

    if (changedSite) {
        siteSetup(site);
    }

    for (key in changed) if (changed.hasOwnProperty(key)) {
        updateBanner(changed[key], site);
    }
}

function siteSetup(site) {
    var css = [];
    var node = document.createElement('style');
    node.type = 'text/css';

    css.push('.common { position: fixed; bottom: 0; }');
    css.push('.left { right: '+ site.contentWidth +'px; left: 0;}');
    css.push('.right { right: 0; left:'+ site.contentWidth +'px; }');
    css.push('.left-center { margin-right: '+ site.contentWidth/2 +'px; right: 50%; left: 0; }');
    css.push('.right-center { margin-left: '+ site.contentWidth/2 +'px; right: 0; left: 50%; }');

    node.appendChild(document.createTextNode(css.join('')));
    document.body.appendChild(node);
}

function create() {
    return {
        params: {
            id: "banner_"+ Math.random().toString().slice(2),
            topFrom: 0
        }
    };
}

function getNode(instance) {
    var node = instance._node;

    if ( ! node) {
        node = document.getElementById(instance.params.id);
        if ( ! node) {
            node = document.createElement('div');
            node.id = instance.params.id;            
            document.body.appendChild(node);
        }
    }

    return (instance._node = node);
}

function updateBanner(instance, site) {
    var div = getNode(instance);
    var side = instance.params.side === 'left' ? 'left' : 'right';

    div.className = 'side-banner common '+ side + (site.center ? '-center' : '');
    document.body.appendChild(div);

    if (instance.params.fixedTop) {
        div.style.top = instance.params.topFrom +'px';

        if (instance.params._onscroll) {
            window.removeEventListener('scroll', instance.params._onscroll, false);
            instance.params._onscroll = null;
        }
    } else {
        onscroll(instance)();

        if ( ! instance.params._onscroll) {
            instance.params._onscroll = onscroll(instance);
            window.addEventListener('scroll', instance.params._onscroll, false);
        }
    }

    emit(instance, 'onupdate');
}

function onscroll(instance) {
    var pos = -1;
    var div = getNode(instance);

    return function onscroll_() {
        var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        var p = Math.max(instance.params.topFrom - scrollTop, 0);

        if (p != pos) {
            pos = p;
            div.style.top = pos +'px';
        }
    };
}

function on(target, type, listener) {
    var events =  target._events;

    if ( ! events) {
        target._events = {};
        events = target._events;
    }

    if ( ! events[type]) {
        events[type] = [];
    }

    events[type].push(listener);
}

function off(target, type, listener) {
    var i;
    var events = target._events && target._events[type];

    if (events) {
        for (i = events.length; i--;) {
            if (events[i] == listener) {
                events.splice(i, 1);
            }
        }
    }
}

function emit(target, type) {
    var i, l;
    var events = target._events && target._events[type];

    if (events) {
        events = events.slice();
        for (i = 0, l = events.length; i < l; i++) {
            events[i].call(target);
        }
    }
}

})(window, document);
