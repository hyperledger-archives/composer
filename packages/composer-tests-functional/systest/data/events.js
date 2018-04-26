/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*eslint no-var: 0*/
'use strict';

function createSimpleEvent(factory) {
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

function createComplexEvent(factory) {
    var event = factory.newEvent('systest.events', 'ComplexEvent');
    var asset1 = factory.newRelationship('systest.events', 'SimpleAsset', 'ASSET_1');
    var asset2 = factory.newRelationship('systest.events', 'SimpleAsset', 'ASSET_2');
    event.simpleAsset = asset1;
    event.simpleAssets = [asset1, asset2];

    return event;

}

/**
 *
 * @param {systest.events.EmitSimpleEvent} transaction
 * @transaction
 */
function onEmitSimpleEvent(transaction) {
    var factory = getFactory();
    var event = createSimpleEvent(factory);

    emit(event);
}

/**
 *
 * @param {systest.events.EmitComplexEvent} transaction
 * @transaction
 */
function onEmitComplexEvent(transaction) {
    var factory = getFactory();
    var event = factory.newEvent('systest.events', 'ComplexEvent');

    var asset1 = factory.newRelationship('systest.events', 'SimpleAsset', 'ASSET_1');
    var asset2 = factory.newRelationship('systest.events', 'SimpleAsset', 'ASSET_2');
    event.simpleAsset = asset1;
    event.simpleAssets = [asset1, asset2];

    emit(event);
}

/**
 *
 * @param {systest.events.EmitMultipleEvents} transaction
 * @transaction
 */
function onEmitMultipleEvents(transaction) {
    var factory = getFactory();
    var event = createSimpleEvent(factory);

    emit(event);
    emit(event);
}

/**
 *
 * @param {systest.events.EmitMultipleDifferentEvents} transaction
 * @transaction
 */
function onEmitMultipleDifferentEvents(transaction) {
    var factory = getFactory();
    var event1 = createSimpleEvent(factory);
    var event2 = createComplexEvent(factory);

    emit(event1);
    emit(event2);
}

/**
 *
 * @param {systest.events.EmitBasicEvent} transaction
 * @transaction
 */
function onEmitBasicEvent(transaction) {
    var factory = getFactory();
    var event = factory.newEvent('systest.events', 'BasicEvent');
    event.nonDeterministic = false;

    emit(event);
}


/**
 *
 * @param {systest.events.EmitBasicEventNonDeterministic} transaction
 * @transaction
 */
async function onEmitBasicEventNonDeterministic(transaction) {
    var factory = getFactory();
    var event = factory.newEvent('systest.events', 'BasicEvent');
    event.nonDeterministic = true;

    let ar = await getAssetRegistry('systest.events.NonDeterministicAsset');
    var a = factory.newResource('systest.events', 'NonDeterministicAsset', 'badAsset');
    a.dateTime = '' + Date.now();
    a.random = Math.random();
    await ar.add(a);
    emit(event);
}

