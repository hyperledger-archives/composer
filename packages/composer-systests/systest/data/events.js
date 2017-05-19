/*eslint no-var: 0*/
'use strict';

function createSimpleEvent() {
    var factory = getFactory();
    var event = factory.newEvent('systest.events', 'SimpleEvent');
    event.stringValue = 'hello world';
    event.stringValues = [ 'hello', 'world' ];
    event.doubleValue = 3.142;
    event.doubleValues = [ 4.567, 8.901 ];
    event.integerValue = 1024;
    event.integerValues = [ 32768, -4096 ];
    event.longValue = 131072;
    event.longValues = [ 999999999, -1234567890 ];
    event.dateTimeValue = new Date('1994-11-05T08:15:30-05:00');
    event.dateTimeValues = [ new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z') ];
    event.booleanValue = true;
    event.booleanValues = [ false, true ];
    event.enumValue = 'WOW';
    event.enumValues = [ 'SUCH', 'MANY', 'MUCH' ];
    return event;
}

function createComplexEvent() {
    var factory = getFactory();
    var event = factory.newEvent('systest.events', 'ComplexEvent');
    var asset1 = factory.newRelationship('systest.events', 'SimpleAsset', 'ASSET_1');
    var asset2 = factory.newRelationship('systest.events', 'SimpleAsset', 'ASSET_2');
    event.simpleAsset = asset1;
    event.simpleAssets = [asset1, asset2];

    return event;

}

function onEmitSimpleEvent(transaction) {
    var event = createSimpleEvent();

    emit(event);
}

function onEmitComplexEvent(transaction) {
    var factory = getFactory();
    var event = factory.newEvent('systest.events', 'ComplexEvent');

    var asset1 = factory.newRelationship('systest.events', 'SimpleAsset', 'ASSET_1');
    var asset2 = factory.newRelationship('systest.events', 'SimpleAsset', 'ASSET_2');
    event.simpleAsset = asset1;
    event.simpleAssets = [asset1, asset2];

    emit(event);
}

function onEmitMultipleEvents(transaction) {
    var event = createSimpleEvent();

    emit(event);
    emit(event);
}

function onEmitMultipleDifferentEvents(transaction) {
    var event1 = createSimpleEvent();
    var event2 = createComplexEvent();

    emit(event1);
    emit(event2);
}