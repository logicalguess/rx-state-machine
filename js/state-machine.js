var reduce = Array.prototype.reduce;

function precompileTemplates(){
    window.TEMPLATES =
        reduce.call($("[data-template-name]"), function(templates, tag){
            tag = $(tag);
            var name = tag.attr("data-template-name");
            templates[name] = Handlebars.compile(tag.html());
            return templates;
        }, {});
}


precompileTemplates();

function click(selector){
    //return Rx.Observable.fromEvent($(selector), 'click');
    //return $(selector).onAsObservable('click');
    return Rx.DOM.fromEvent(document.querySelector(selector), 'click');
}


var cssMapping = {
    'close': 'moon',
    'open': 'sun',
    'lock': 'lock',
    'unlock': 'unlock',
    'break': 'settings',
    'fix': 'wrench'
};

var view = {
    render: function(data) {
        for (var i in data.events) {
            data.events[i] = {
                'name': data.events[i],
                'css': cssMapping[data.events[i]]
            };
        }
        $("#state").html(TEMPLATES["state"](data.state));
        $("#events").html(template = TEMPLATES["event-list"](data));
    },
    onEvent: function() {
        return click("#events").map(function(ev) {
           return ev.target.text.toLocaleLowerCase().trim();
        });
    }
};


var door = Stately.machine({
    'CLOSED': {
        'open':   /* => */ 'OPEN',
        'lock':   /* => */ 'LOCKED'
    },
    'OPEN': {
        'close':  /* => */ 'CLOSED'
    },
    'LOCKED': {
        'unlock': /* => */ 'CLOSED',
        'break':  /* => */ 'BROKEN'
    },
    'BROKEN': {
        'fix':  /* => */ 'OPEN'
    }
});


var transition = function (door, event) {
    console.log(door.getMachineState(), '->', event);
    return door[event]();
};

var doorStatus = function (door) {
    return {
        'state': door.getMachineState(),
        'events': door.getMachineEvents()
    }
};


//var events = Rx.Observable.for(
//    ['close', 'lock', 'unlock', 'open'],
//    function (item) {
//        return Rx.Observable
//            .return(item)
//            .delay(1000);
//    });

//var events = Rx.Observable.return('close').delay(1000).concat(Rx.Observable.return('lock').delay(1000)
//    .concat(Rx.Observable.return('unlock').delay(1000).concat(Rx.Observable.return('open').delay(1000))))
//    .concat(view.onEvent());


var events = Rx.Observable.return('close').concat(view.onEvent());

events.scan(door, transition).map(doorStatus)
    .subscribe(function (value) {
        view.render(value);
    });
