/*eslint no-var: 0*/
/* eslint-disable no-unused-vars*/
/* eslint-disable no-undef*/
/* eslint-disable func-names*/
/* eslint-disable no-var*/
'use strict';

function createPlayer(factory, email, fn, ln){
    var player = factory.newParticipant('org.fabric_composer.marbles', 'Player', email);
    player.firstName = fn;
    player.lastName = ln;

    return player;
}

function createMarble(factory, player, size, colour, marbleId) {
    var marble = factory.newResource('org.fabric_composer.marbles', 'Marble', marbleId);
    marble.size = size;
    marble.color = colour;
    marble.owner = factory.newRelationship('org.fabric_composer.marbles', 'Player', player.email);
    return marble;
}


/**
 *
 * @param {org.fabric_composer.marbles.CreateMarble} transaction
 * @transaction
 */
function onCreateMable(transaction) {
    var factory = getFactory();
    var player = createPlayer(factory, transaction.email, 'Fenglian', 'Xu');
    return getParticipantRegistry('org.fabric_composer.marbles.Player').then(function(participantRegitry){
        return participantRegitry.add(player);
    }).then(function(){
        return getAssetRegistry('org.fabric_composer.marbles.Marble');
    }).then(function(assetRegistry){
        var marble = createMarble(factory, player, transaction.size, transaction.colour, transaction.marbleId);
        return assetRegistry.add(marble);
    });
}

/**
 *
 * @param {org.fabric_composer.marbles.QueryMarbleByOwner} transaction
 * @transaction
 */
function onQueryMarbleByOwner(transaction) {
    var factory = getFactory();
    var q= {'selector':{'owner.firstname:' : 'Fenglian'}};
  //  var q= "{\"selector\":{\"chaincodeid\": \"query-network\",\"data.name\": \"Asset registry for org.fabric_composer.marbles.Marble\"}}";
    var queryString = JSON.stringify(q);
    return queryNative(queryString)
        .then(function (result) {
       // print('querystring is: ' + queryTransaction.queryString )
            print('TP function got result of query: ' + result );
        });
}