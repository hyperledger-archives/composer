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

'use strict';

const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;

const fs = require('fs');
const path = require('path');

const TestUtil = require('./testutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-subset'));
chai.use(require('chai-as-promised'));

describe('Participant system tests', function () {
    let bnID;
    beforeEach(() => {
        return TestUtil.resetBusinessNetwork(bnID);
    });
    let businessNetworkDefinition;
    let client;

    before(function () {
        // In this systest we are intentionally not fully specifying the model file with a fileName, and supplying undefined as the value
        const modelFiles = [
            { fileName: undefined, contents: fs.readFileSync(path.resolve(__dirname, 'data/participants.cto'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-participants@0.0.1', 'The network for the participant system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        bnID = businessNetworkDefinition.getName();
        return TestUtil.deploy(businessNetworkDefinition)
            .then(() => {
                return TestUtil.getClient('systest-participants')
                    .then((result) => {
                        client = result;
                    });
            });
    });

    after(function () {
        return TestUtil.undeploy(businessNetworkDefinition);
    });

    let createParticipant = (participantId) => {
        let factory = client.getBusinessNetwork().getFactory();
        let participant = factory.newResource('systest.participants', 'SimpleParticipant', participantId);
        participant.stringValue = 'hello world';
        participant.stringValues = [ 'hello', 'world' ];
        participant.doubleValue = 3.142;
        participant.doubleValues = [ 4.567, 8.901 ];
        participant.integerValue = 1024;
        participant.integerValues = [ 32768, -4096 ];
        participant.longValue = 131072;
        participant.longValues = [ 999999999, -1234567890 ];
        participant.dateTimeValue = new Date('1994-11-05T08:15:30-05:00');
        participant.dateTimeValues = [ new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z') ];
        participant.booleanValue = true;
        participant.booleanValues = [ false, true ];
        participant.enumValue = 'WOW';
        participant.enumValues = [ 'SUCH', 'MANY', 'MUCH' ];
        return participant;
    };

    let createParticipantContainer = () => {
        let factory = client.getBusinessNetwork().getFactory();
        let participant = factory.newResource('systest.participants', 'SimpleParticipantContainer', 'dogeParticipantContainer');
        return participant;
    };

    let createParticipantRelationshipContainer = () => {
        let factory = client.getBusinessNetwork().getFactory();
        let participant = factory.newResource('systest.participants', 'SimpleParticipantRelationshipContainer', 'dogeParticipantRelationshipContainer');
        return participant;
    };

    let validateParticipant = (participant, participantId) => {
        participant.getIdentifier().should.equal(participantId);
        participant.stringValue.should.equal('hello world');
        participant.stringValues.should.deep.equal([ 'hello', 'world' ]);
        participant.doubleValue.should.equal(3.142);
        participant.doubleValues.should.deep.equal([ 4.567, 8.901 ]);
        participant.integerValue.should.equal(1024);
        participant.integerValues.should.deep.equal([ 32768, -4096 ]);
        participant.longValue.should.equal(131072);
        participant.longValues.should.deep.equal([ 999999999, -1234567890 ]);
        let expectedDate = new Date('1994-11-05T08:15:30-05:00');
        participant.dateTimeValue.getTime().should.equal(expectedDate.getTime());
        let expectedDates = [ new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z') ];
        participant.dateTimeValues[0].getTime().should.equal(expectedDates[0].getTime());
        participant.dateTimeValues[1].getTime().should.equal(expectedDates[1].getTime());
        participant.booleanValue.should.equal(true);
        participant.booleanValues.should.deep.equal([ false, true ]);
        participant.enumValue.should.equal('WOW');
        participant.enumValues.should.deep.equal([ 'SUCH', 'MANY', 'MUCH' ]);
    };

    let validateParticipantContainer = (participantContainer, participantId) => {
        participantContainer.getIdentifier().should.equal(participantId);
        validateParticipant(participantContainer.simpleParticipant, 'dogeParticipant1');
        participantContainer.simpleParticipants.length.should.equal(2);
        validateParticipant(participantContainer.simpleParticipants[0], 'dogeParticipant2');
        validateParticipant(participantContainer.simpleParticipants[1], 'dogeParticipant3');
    };

    let validateParticipantRelationshipContainer = (participantContainer, participantId) => {
        participantContainer.getIdentifier().should.equal(participantId);
        participantContainer.simpleParticipant.$class.should.equal('Relationship');
        participantContainer.simpleParticipant.getFullyQualifiedIdentifier().should.equal('systest.participants.SimpleParticipant#dogeParticipant1');
        participantContainer.simpleParticipants.length.should.equal(2);
        participantContainer.simpleParticipants[0].$class.should.equal('Relationship');
        participantContainer.simpleParticipants[0].getFullyQualifiedIdentifier().should.equal('systest.participants.SimpleParticipant#dogeParticipant2');
        participantContainer.simpleParticipants[1].$class.should.equal('Relationship');
        participantContainer.simpleParticipants[1].getFullyQualifiedIdentifier().should.equal('systest.participants.SimpleParticipant#dogeParticipant3');
    };

    let validateResolvedParticipant = (participant, participantId) => {
        participant.participantId.should.equal(participantId);
        participant.stringValue.should.equal('hello world');
        participant.stringValues.should.deep.equal([ 'hello', 'world' ]);
        participant.doubleValue.should.equal(3.142);
        participant.doubleValues.should.deep.equal([ 4.567, 8.901 ]);
        participant.integerValue.should.equal(1024);
        participant.integerValues.should.deep.equal([ 32768, -4096 ]);
        participant.longValue.should.equal(131072);
        participant.longValues.should.deep.equal([ 999999999, -1234567890 ]);
        let expectedDate = new Date('1994-11-05T08:15:30-05:00');
        (new Date(participant.dateTimeValue)).getTime().should.equal(expectedDate.getTime());
        let expectedDates = [ new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z') ];
        (new Date(participant.dateTimeValues[0])).getTime().should.equal(expectedDates[0].getTime());
        (new Date(participant.dateTimeValues[1])).getTime().should.equal(expectedDates[1].getTime());
        participant.booleanValue.should.equal(true);
        participant.booleanValues.should.deep.equal([ false, true ]);
        participant.enumValue.should.equal('WOW');
        participant.enumValues.should.deep.equal([ 'SUCH', 'MANY', 'MUCH' ]);
    };

    let validateResolvedParticipantContainer = (participantContainer, participantId) => {
        participantContainer.participantId.should.equal(participantId);
        validateResolvedParticipant(participantContainer.simpleParticipant, 'dogeParticipant1');
        participantContainer.simpleParticipants.length.should.equal(2);
        validateResolvedParticipant(participantContainer.simpleParticipants[0], 'dogeParticipant2');
        validateResolvedParticipant(participantContainer.simpleParticipants[1], 'dogeParticipant3');
    };

    it('should get all the participant registries', function () {
        return client
            .getAllParticipantRegistries()
            .then(function (participantRegistries) {
                participantRegistries.length.should.equal(4);
                participantRegistries.should.containSubset([
                    {'id': 'systest.participants.SimpleParticipant', 'name': 'Participant registry for systest.participants.SimpleParticipant'},
                    {'id': 'systest.participants.SimpleParticipantContainer', 'name': 'Participant registry for systest.participants.SimpleParticipantContainer'},
                    {'id': 'systest.participants.SimpleParticipantRelationshipContainer', 'name': 'Participant registry for systest.participants.SimpleParticipantRelationshipContainer'},
                    {'id': 'systest.participants.SimpleParticipantCircle', 'name': 'Participant registry for systest.participants.SimpleParticipantCircle'}
                ]);
            });
    });

    it('should get a participant registry', function () {
        return client
            .getParticipantRegistry('systest.participants.SimpleParticipant')
            .then(function (participantRegistry) {
                participantRegistry.should.containSubset({'id': 'systest.participants.SimpleParticipant', 'name': 'Participant registry for systest.participants.SimpleParticipant'});
            });
    });

    it('should throw when getting a non-existent participant registry', function () {
        return client
            .getParticipantRegistry('e92074d3-935b-4c75-98e5-5dc2505aa971')
            .then(function (participantRegistry) {
                throw new Error('should not get here');
            }).catch(function (error) {
                error.should.match(/Object with ID '.+?' in collection with ID '.+?' does not exist/);
            });
    });

    it('should throw when getting a non-existent participant in a participant registry', function () {
        return client
            .getParticipantRegistry('systest.participants.SimpleParticipant')
            .then(function (participantRegistry) {
                return participantRegistry.get('doesnotexist');
            })
            .should.be.rejectedWith(/does not exist/);
    });

    it('should return false for a participant that does not exist', function () {
        return client
            .getParticipantRegistry('systest.participants.SimpleParticipant')
            .then(function (participantRegistry) {
                return participantRegistry.exists('doesnotexist');
            })
            .should.eventually.equal(false);
    });

    it('should add a participant registry', function () {
        return client
            .addParticipantRegistry('myregistry', 'my new participant registry')
            .then(function () {
                return client.getAllParticipantRegistries();
            })
            .then(function (participantRegistries) {
                participantRegistries.should.have.length.of.at.least(4);
                participantRegistries.should.containSubset([{'id': 'myregistry', 'name': 'my new participant registry'}]);
                return client.getParticipantRegistry('myregistry');
            })
            .then(function (participantRegistry) {
                participantRegistry.should.containSubset({'id': 'myregistry', 'name': 'my new participant registry'});
            });
    });

    it('should add a participant to a participant registry', function () {
        let participantRegistry;
        return client
            .addParticipantRegistry('myregistry', 'my new participant registry')
            .then(function (result) {
                participantRegistry = result;
                let participant = createParticipant('dogeParticipant1');
                return participantRegistry.add(participant);
            })
            .then(function () {
                return participantRegistry.getAll();
            })
            .then(function (participants) {
                participants.length.should.equal(1);
                validateParticipant(participants[0], 'dogeParticipant1');
                return participantRegistry.get('dogeParticipant1');
            })
            .then(function (participant) {
                participant.getIdentifier().should.equal('dogeParticipant1');
            });
    });

    it('should bulk add participants to a participant registry', function () {
        let participantRegistry;
        return client
            .addParticipantRegistry('myregistry', 'my new participant registry')
            .then(function (result) {
                participantRegistry = result;
                let participant1 = createParticipant('dogeParticipant1');
                let participant2 = createParticipant('dogeParticipant2');
                return participantRegistry.addAll([participant1, participant2]);
            })
            .then(function () {
                return participantRegistry.getAll();
            })
            .then(function (participants) {
                participants.length.should.equal(2);
                participants.sort((a, b) => {
                    return a.getIdentifier().localeCompare(b.getIdentifier());
                });
                validateParticipant(participants[0], 'dogeParticipant1');
                validateParticipant(participants[1], 'dogeParticipant2');
            });
    });

    it('should update a participant in a participant registry', () => {
        let participantRegistry;
        return client
            .addParticipantRegistry('myregistry', 'my new participant registry')
            .then(function (result) {
                participantRegistry = result;
                let participant = createParticipant('dogeParticipant1');
                return participantRegistry.add(participant);
            })
            .then(function (participant) {
                return participantRegistry.get('dogeParticipant1');
            })
            .then(function (participant) {
                validateParticipant(participant, 'dogeParticipant1');
                participant.stringValue = 'ciao mondo';
                participant.stringValues = [ 'ciao', 'mondo' ];
                return participantRegistry.update(participant);
            })
            .then(function () {
                return participantRegistry.get('dogeParticipant1');
            })
            .then(function (participant) {
                participant.stringValue.should.equal('ciao mondo');
                participant.stringValues.should.deep.equal([ 'ciao', 'mondo' ]);
            });
    });

    it('should bulk update participants in a participant registry', function () {
        let participantRegistry;
        return client
            .addParticipantRegistry('myregistry', 'my new participant registry')
            .then(function (result) {
                participantRegistry = result;
                let participant1 = createParticipant('dogeParticipant1');
                let participant2 = createParticipant('dogeParticipant2');
                return participantRegistry.addAll([participant1, participant2]);
            })
            .then(function () {
                return participantRegistry.getAll();
            })
            .then(function (participants) {
                participants.length.should.equal(2);
                participants.sort((a, b) => {
                    return a.getIdentifier().localeCompare(b.getIdentifier());
                });
                validateParticipant(participants[0], 'dogeParticipant1');
                participants[0].stringValue = 'ciao mondo';
                participants[0].stringValues = [ 'ciao', 'mondo' ];
                validateParticipant(participants[1], 'dogeParticipant2');
                participants[1].stringValue = 'hei maailma';
                participants[1].stringValues = [ 'hei', 'maailma' ];
                return participantRegistry.updateAll(participants);
            })
            .then(function () {
                return participantRegistry.getAll();
            })
            .then(function (participants) {
                participants.length.should.equal(2);
                participants.sort((a, b) => {
                    return a.getIdentifier().localeCompare(b.getIdentifier());
                });
                participants[0].stringValue.should.equal('ciao mondo');
                participants[0].stringValues.should.deep.equal([ 'ciao', 'mondo' ]);
                participants[1].stringValue.should.equal('hei maailma');
                participants[1].stringValues.should.deep.equal([ 'hei', 'maailma' ]);
            });
    });

    it('should remove a participant from a participant registry', () => {
        let participantRegistry;
        return client
            .addParticipantRegistry('myregistry', 'my new participant registry')
            .then(function (result) {
                participantRegistry = result;
                let participant = createParticipant('dogeParticipant1');
                return participantRegistry.add(participant);
            })
            .then(function (participant) {
                return participantRegistry.get('dogeParticipant1');
            })
            .then(function (participant) {
                validateParticipant(participant, 'dogeParticipant1');
                return participantRegistry.remove('dogeParticipant1');
            })
            .then(function (participant) {
                return participantRegistry.get('dogeParticipant1');
            })
            .then(function () {
                throw new Error('should not get here');
            })
            .catch(function (error) {
                error.should.match(/Object with ID '.+?' in collection with ID '.+?' does not exist/);
            });
    });

    it('should bulk remove participants from a participant registry', () => {
        let participantRegistry;
        return client
            .addParticipantRegistry('myregistry', 'my new participant registry')
            .then(function (result) {
                participantRegistry = result;
                let participant1 = createParticipant('dogeParticipant1');
                let participant2 = createParticipant('dogeParticipant2');
                return participantRegistry.addAll([participant1, participant2]);
            })
            .then(function (participant) {
                return participantRegistry.getAll();
            })
            .then(function (participants) {
                participants.length.should.equal(2);
                participants.sort((a, b) => {
                    return a.getIdentifier().localeCompare(b.getIdentifier());
                });
                validateParticipant(participants[0], 'dogeParticipant1');
                validateParticipant(participants[1], 'dogeParticipant2');
                return participantRegistry.removeAll(['dogeParticipant1', participants[1]]);
            })
            .then(function (participant) {
                return participantRegistry.getAll();
            })
            .then(function (participants) {
                participants.length.should.equal(0);
            });
    });

    it('should store participants containing participants in a participant registry', () => {
        let participantRegistry;
        let participantContainerRegistry;
        return client
            .getParticipantRegistry('systest.participants.SimpleParticipant')
            .then(function (result) {
                participantRegistry = result;
                let participant = createParticipant('dogeParticipant1');
                return participantRegistry.add(participant);
            })
            .then(function () {
                let participant = createParticipant('dogeParticipant2');
                return participantRegistry.add(participant);
            })
            .then(function () {
                let participant = createParticipant('dogeParticipant3');
                return participantRegistry.add(participant);
            })
            .then(function () {
                return client.getParticipantRegistry('systest.participants.SimpleParticipantContainer');
            })
            .then(function (result) {
                participantContainerRegistry = result;
                let participantContainer = createParticipantContainer();
                participantContainer.simpleParticipant = createParticipant('dogeParticipant1');
                participantContainer.simpleParticipants = [
                    createParticipant('dogeParticipant2'),
                    createParticipant('dogeParticipant3')
                ];
                return participantContainerRegistry.add(participantContainer);
            })
            .then(function () {
                return participantContainerRegistry.getAll();
            })
            .then(function (participantContainers) {
                participantContainers.length.should.equal(1);
                validateParticipantContainer(participantContainers[0], 'dogeParticipantContainer');
                return participantContainerRegistry.get('dogeParticipantContainer');
            })
            .then(function (participantContainer) {
                validateParticipantContainer(participantContainer, 'dogeParticipantContainer');
            });
    });

    it('should store participants containing participant relationships in a participant registry', () => {
        let participantRegistry;
        let participantContainerRegistry;
        return client
            .getParticipantRegistry('systest.participants.SimpleParticipant')
            .then(function (result) {
                participantRegistry = result;
                let participant = createParticipant('dogeParticipant1');
                return participantRegistry.add(participant);
            })
            .then(function () {
                let participant = createParticipant('dogeParticipant2');
                return participantRegistry.add(participant);
            })
            .then(function () {
                let participant = createParticipant('dogeParticipant3');
                return participantRegistry.add(participant);
            })
            .then(function () {
                return client.getParticipantRegistry('systest.participants.SimpleParticipantRelationshipContainer');
            })
            .then(function (result) {
                participantContainerRegistry = result;
                let participantContainer = createParticipantRelationshipContainer();
                let factory = client.getBusinessNetwork().getFactory();
                participantContainer.simpleParticipant = factory.newRelationship('systest.participants', 'SimpleParticipant', 'dogeParticipant1');
                participantContainer.simpleParticipants = [
                    factory.newRelationship('systest.participants', 'SimpleParticipant', 'dogeParticipant2'),
                    factory.newRelationship('systest.participants', 'SimpleParticipant', 'dogeParticipant3')
                ];
                return participantContainerRegistry.add(participantContainer);
            })
            .then(function () {
                return participantContainerRegistry.getAll();
            })
            .then(function (participantContainers) {
                participantContainers.length.should.equal(1);
                validateParticipantRelationshipContainer(participantContainers[0], 'dogeParticipantRelationshipContainer');
                return participantContainerRegistry.get('dogeParticipantRelationshipContainer');
            })
            .then(function (participantContainer) {
                validateParticipantRelationshipContainer(participantContainer, 'dogeParticipantRelationshipContainer');
            });
    });

    it('should resolve participants containing participant relationships from a participant registry', () => {
        let participantRegistry;
        let participantContainerRegistry;
        return client
            .getParticipantRegistry('systest.participants.SimpleParticipant')
            .then(function (result) {
                participantRegistry = result;
                let participant = createParticipant('dogeParticipant1');
                return participantRegistry.add(participant);
            })
            .then(function () {
                let participant = createParticipant('dogeParticipant2');
                return participantRegistry.add(participant);
            })
            .then(function () {
                let participant = createParticipant('dogeParticipant3');
                return participantRegistry.add(participant);
            })
            .then(function () {
                return client.getParticipantRegistry('systest.participants.SimpleParticipantRelationshipContainer');
            })
            .then(function (result) {
                participantContainerRegistry = result;
                let participantContainer = createParticipantRelationshipContainer();
                let factory = client.getBusinessNetwork().getFactory();
                participantContainer.simpleParticipant = factory.newRelationship('systest.participants', 'SimpleParticipant', 'dogeParticipant1');
                participantContainer.simpleParticipants = [
                    factory.newRelationship('systest.participants', 'SimpleParticipant', 'dogeParticipant2'),
                    factory.newRelationship('systest.participants', 'SimpleParticipant', 'dogeParticipant3')
                ];
                return participantContainerRegistry.add(participantContainer);
            })
            .then(function () {
                return participantContainerRegistry.resolveAll();
            })
            .then(function (participantContainers) {
                participantContainers.length.should.equal(1);
                validateResolvedParticipantContainer(participantContainers[0], 'dogeParticipantRelationshipContainer');
                return participantContainerRegistry.resolve('dogeParticipantRelationshipContainer');
            })
            .then(function (participantContainer) {
                validateResolvedParticipantContainer(participantContainer, 'dogeParticipantRelationshipContainer');
            });
    });

    it('should resolve participants containing circular relationships from a participant registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let participantRegistry;
        return client
            .getParticipantRegistry('systest.participants.SimpleParticipantCircle')
            .then(function (result) {
                participantRegistry = result;
                let participant = factory.newResource('systest.participants', 'SimpleParticipantCircle', 'circle1');
                participant.next = factory.newRelationship('systest.participants', 'SimpleParticipantCircle', 'circle2');
                return participantRegistry.add(participant);
            })
            .then(function () {
                let participant = factory.newResource('systest.participants', 'SimpleParticipantCircle', 'circle2');
                participant.next = factory.newRelationship('systest.participants', 'SimpleParticipantCircle', 'circle3');
                return participantRegistry.add(participant);
            })
            .then(function () {
                let participant = factory.newResource('systest.participants', 'SimpleParticipantCircle', 'circle3');
                participant.next = factory.newRelationship('systest.participants', 'SimpleParticipantCircle', 'circle1');
                return participantRegistry.add(participant);
            })
            .then(function () {
                return participantRegistry.resolveAll();
            })
            .then(function (participants) {
                participants.sort((a, b) => {
                    return a.participantId.localeCompare(b.participantId);
                });
                participants.length.should.equal(3);
                participants[0].next.next.participantId.should.equal('circle3');
                participants[1].next.next.participantId.should.equal('circle1');
                participants[2].next.next.participantId.should.equal('circle2');
                return participantRegistry.resolve('circle1');
            })
            .then(function (participant) {
                participant.next.next.participantId.should.equal('circle3');
            });
    });




});
