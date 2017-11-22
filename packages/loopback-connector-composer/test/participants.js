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

const AdminConnection = require('composer-admin').AdminConnection;
const MemoryCardStore = require('composer-common').MemoryCardStore;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const connector = require('..');
const IdCard = require('composer-common').IdCard;
const loopback = require('loopback');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));



['always', 'never'].forEach((namespaces) => {

    const prefix = namespaces === 'always' ? 'org_acme_bond_' : '';

    const participantData = [{
        $class: 'org.acme.bond.Issuer',
        memberId: 'MEMBER_1',
        name: 'Alice'
    }, {
        $class: 'org.acme.bond.Issuer',
        memberId: 'MEMBER_2',
        name: 'Bob'
    }, {
        $class: 'org.acme.bond.Issuer',
        memberId: 'MEMBER_3',
        name: 'Charlie'
    }, {
        // $class: 'org.acme.bond.Issuer',
        memberId: 'MEMBER_4',
        name: 'Daria'
    }];

    describe(`Participant persisted model unit tests namespaces[${namespaces}]`, () => {

        let app;
        let dataSource;
        let businessNetworkConnection;
        let participantRegistry;
        let serializer;
        let adminConnection;
        let idCard;

        before(() => {
            const cardStore = new MemoryCardStore();
            adminConnection = new AdminConnection({ cardStore });
            let metadata = { version:1, userName: 'admin', secret: 'adminpw', roles: ['PeerAdmin', 'ChannelAdmin'] };
            const deployCardName = 'deployer-card';

            let idCard_PeerAdmin = new IdCard(metadata, {type : 'embedded',name:'defaultProfile'});
            let businessNetworkDefinition;

            return adminConnection.importCard(deployCardName, idCard_PeerAdmin)
            .then(() => {
                return adminConnection.connect(deployCardName);
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory('./test/data/bond-network');
            })
            .then((result) => {
                businessNetworkDefinition = result;
                serializer = businessNetworkDefinition.getSerializer();
                return adminConnection.install(businessNetworkDefinition.getName());
            })
            .then(()=>{
                return adminConnection.start(businessNetworkDefinition,{networkAdmins :[{userName:'admin',enrollmentSecret :'adminpw'}] });
            })
            .then(() => {
                idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
                return adminConnection.importCard('admin@bond-network', idCard);
            })

            .then(() => {
                app = loopback();
                const connectorSettings = {
                    name: 'composer',
                    connector: connector,
                    card: 'admin@bond-network',
                    namespaces: namespaces,
                    cardStore
                };
                dataSource = app.loopback.createDataSource('composer', connectorSettings);
                return new Promise((resolve, reject) => {
                    console.log('Discovering types from business network definition ...');
                    dataSource.discoverModelDefinitions({}, (error, modelDefinitions) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(modelDefinitions);
                    });
                });
            })

            .then((modelDefinitions) => {
                console.log('Discovered types from business network definition');
                console.log('Generating schemas for all types in business network definition ...');
                return modelDefinitions.reduce((promise, modelDefinition) => {
                    return promise.then((schemas) => {
                        return new Promise((resolve, reject) => {
                            dataSource.discoverSchemas(modelDefinition.name, { visited: {}, associations: true }, (error, modelSchema) => {
                                if (error) {
                                    return reject(error);
                                }
                                schemas.push(modelSchema);
                                resolve(schemas);
                            });
                        });
                    });
                }, Promise.resolve([]));
            })
            .then((modelSchemas) => {
                console.log('Generated schemas for all types in business network definition');
                console.log('Adding schemas for all types to Loopback ...');
                modelSchemas.forEach((modelSchema) => {
                    let model = app.loopback.createModel(modelSchema);
                    app.model(model, {
                        dataSource: dataSource,
                        public: true
                    });
                });
                businessNetworkConnection = new BusinessNetworkConnection({ cardStore });
                return businessNetworkConnection.connect('admin@bond-network');
            })
            .then(() => {
                return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Issuer');
            })
            .then((participantRegistry_) => {
                participantRegistry = participantRegistry_;
                return participantRegistry.addAll([
                    serializer.fromJSON(participantData[0]),
                    serializer.fromJSON(participantData[1])
                ]);
            });
        });

        beforeEach(() => {
            return adminConnection.connect('admin@bond-network')
            .then( ()=>{
                return adminConnection.reset('bond-network');
            })
                .then(() => {
                    return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Issuer');
                })
                .then((participantRegistry_) => {
                    participantRegistry = participantRegistry_;
                    return participantRegistry.addAll([
                        serializer.fromJSON(participantData[0]),
                        serializer.fromJSON(participantData[1])
                    ]);
                });
        });

        describe(`#count namespaces[${namespaces}]`, () => {

            it('should count all of the participants', () => {
                return app.models[prefix + 'Issuer'].count()
                    .then((count) => {
                        count.should.equal(2);
                    });
            });

            it('should count an existing participant using the participant ID', () => {
                return app.models[prefix + 'Issuer'].count({ memberId: 'MEMBER_1' })
                    .then((count) => {
                        count.should.equal(1);
                    });
            });

            it('should count an non-existing participant using the participant ID', () => {
                return app.models[prefix + 'Issuer'].count({ memberId: 'MEMBER_999' })
                    .then((count) => {
                        count.should.equal(0);
                    });
            });
            it('should count all of the participants using the other peroperty', () => {
                return app.models[prefix + 'Issuer'].count({ name: 'Bob' })
                    .then((count) => {
                        count.should.equal(1);
                    });
            });
            it('should count all of the participants using the and|or operator', () => {
                return app.models[prefix + 'Issuer'].count({'or':[{name: 'Bob'}, {name: 'Alice'}]})
                    .then((count) => {
                        count.should.equal(2);
                    });
            });

        });

        describe(`#create namespaces[${namespaces}]`, () => {

            it('should create the specified participant', () => {
                return app.models[prefix + 'Issuer'].create(participantData[2])
                    .then(() => {
                        return participantRegistry.get('MEMBER_3');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        json.should.deep.equal(participantData[2]);
                    });
            });

            it('should create the specified participant without a $class property', () => {
                return app.models[prefix + 'Issuer'].create(participantData[3])
                    .then(() => {
                        return participantRegistry.get('MEMBER_4');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        delete json.$class;
                        json.should.deep.equal(participantData[3]);
                    });
            });

            it('should return an error if the specified participant already exists', () => {
                return app.models[prefix + 'Issuer'].create(participantData[0])
                    .should.be.rejected;
            });

            it('should create the specified array of participants', () => {
                return new Promise((resolve, reject) => {
                    return app.models[prefix + 'Issuer'].create([ participantData[2], participantData[3] ], (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                })
                .then(() => {
                    return participantRegistry.get('MEMBER_3');
                })
                .then((participant) => {
                    let json = serializer.toJSON(participant);
                    json.should.deep.equal(participantData[2]);
                })
                .then(() => {
                    return participantRegistry.get('MEMBER_4');
                })
                .then((participant) => {
                    let json = serializer.toJSON(participant);
                    delete json.$class;
                    json.should.deep.equal(participantData[3]);
                });
            });

        });

        describe(`#destroyAll namespaces[${namespaces}]`, () => {

            it('should throw without a where clause as it is unsupported', () => {
                return app.models[prefix + 'Issuer'].destroyAll()
                    .should.be.rejectedWith(/is not supported/);

            });

            it('should remove a single specified participant', () => {
                return app.models[prefix + 'Issuer'].destroyAll({ memberId: 'MEMBER_1' })
                    .then(() => {
                        return participantRegistry.exists('MEMBER_1');
                    })
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

            it('should return an error if the specified participant does not exist', () => {
                return app.models[prefix + 'Issuer'].destroyAll({ memberId: 'MEMBER_999' })
                    .should.be.rejected;
            });

        });

        describe(`#destroyById namespaces[${namespaces}]`, () => {

            it('should delete the specified participant', () => {
                return app.models[prefix + 'Issuer'].destroyById('MEMBER_1')
                    .then(() => {
                        return participantRegistry.exists('MEMBER_1');
                    })
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

            it('should return an error if the specified participant does not exist', () => {
                return app.models[prefix + 'Issuer'].destroyById('MEMBER_999')
                    .should.be.rejected;
            });

        });

        describe(`#exists namespaces[${namespaces}]`, () => {

            it('should check the existence of an existing participant using the participant ID', () => {
                return app.models[prefix + 'Issuer'].exists('MEMBER_1')
                    .then((exists) => {
                        exists.should.be.true;
                    });
            });

            it('should check the existence of an non-existing participant using the participant ID', () => {
                return app.models[prefix + 'Issuer'].exists('MEMBER_999')
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

        });

        describe(`#find namespaces[${namespaces}]`, () => {

            it('should find all existing participants', () => {
                return app.models[prefix + 'Issuer'].find()
                    .then((participants) => {
                        JSON.parse(JSON.stringify(participants)).should.deep.equal([participantData[0], participantData[1]]);
                    });
            });

            it('should find an existing participant using the participant ID', () => {
                return app.models[prefix + 'Issuer'].find({ where: { memberId: 'MEMBER_1' } })
                    .then((participants) => {
                        JSON.parse(JSON.stringify(participants)).should.deep.equal([participantData[0]]);
                    });
            });

        });

        describe(`#findById namespaces[${namespaces}]`, () => {

            it('should find an existing participant using the participant ID', () => {
                return app.models[prefix + 'Issuer'].findById('MEMBER_1')
                    .then((participant) => {
                        JSON.parse(JSON.stringify(participant)).should.deep.equal(participantData[0]);
                    });
            });

            it('should not find an non-existing participant using the participant ID', () => {
                return app.models[prefix + 'Issuer'].findById('MEMBER_999')
                    .then((participant) => {
                        should.equal(participant, null);
                    });
            });

        });

        describe(`#findOne namespaces[${namespaces}]`, () => {

            it('should find the first of all existing participants', () => {
                return app.models[prefix + 'Issuer'].findOne()
                    .then((participant) => {
                        JSON.parse(JSON.stringify(participant)).should.deep.equal(participantData[0]);
                    });
            });

            it('should find an existing participant using the participant ID', () => {
                return app.models[prefix + 'Issuer'].findOne({ where: { memberId: 'MEMBER_1' } })
                    .then((participant) => {
                        JSON.parse(JSON.stringify(participant)).should.deep.equal(participantData[0]);
                    });
            });

        });

        describe(`#findOrCreate namespaces[${namespaces}]`, () => {

            it('should find an existing participant using the input participant', () => {
                return app.models[prefix + 'Issuer'].findOrCreate(participantData[0])
                    .then((parts) => {
                        const participant = parts[0];
                        const created = parts[1];
                        JSON.parse(JSON.stringify(participant)).should.deep.equal(participantData[0]);
                        created.should.be.false;
                    });
            });

            it('should find an existing participant using a where clause', () => {
                return app.models[prefix + 'Issuer'].findOrCreate({ where: { memberId: 'MEMBER_1' } }, participantData[0])
                    .then((parts) => {
                        const participant = parts[0];
                        const created = parts[1];
                        JSON.parse(JSON.stringify(participant)).should.deep.equal(participantData[0]);
                        created.should.be.false;
                    });
            });

            it('should not find and create the specified participant using the input participant', () => {
                return app.models[prefix + 'Issuer'].findOrCreate(participantData[2])
                    .then(() => {
                        return participantRegistry.get('MEMBER_3');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        json.should.deep.equal(participantData[2]);
                    });
            });

            it('should not find and create the specified participant using a where clause', () => {
                return app.models[prefix + 'Issuer'].findOrCreate({ where: { memberId: 'MEMBER_3' } }, participantData[2])
                    .then(() => {
                        return participantRegistry.get('MEMBER_3');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        json.should.deep.equal(participantData[2]);
                    });
            });

        });

        describe(`#replaceById namespaces[${namespaces}]`, () => {

            const updatedParticipant = {
                $class: 'org.acme.bond.Issuer',
                memberId: 'MEMBER_1',
                name: 'Alexa'
            };

            it('should update the specified participant', () => {
                return app.models[prefix + 'Issuer'].replaceById('MEMBER_1', updatedParticipant)
                    .then(() => {
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        participant.name.should.equal('Alexa');
                    });
            });

            it('should return an error if the specified participant does not exist', () => {
                return app.models[prefix + 'Issuer'].replaceById('MEMBER_999', updatedParticipant)
                    .should.be.rejected;
            });

        });

        describe(`#replaceOrCreate namespaces[${namespaces}]`, () => {

            const updatedParticipant = {
                $class: 'org.acme.bond.Issuer',
                memberId: 'MEMBER_1',
                name: 'Alexa'
            };

            it('should update the specified participant', () => {
                return app.models[prefix + 'Issuer'].replaceOrCreate(updatedParticipant)
                    .then(() => {
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        participant.name.should.equal('Alexa');
                    });
            });

            it('should create a new participant if the specified participant does not exist', () => {
                return app.models[prefix + 'Issuer'].replaceOrCreate(participantData[2])
                    .then(() => {
                        return participantRegistry.get('MEMBER_3');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        json.should.deep.equal(participantData[2]);
                    });
            });

        });

        describe(`#updateAll namespaces[${namespaces}]`, () => {

            const updatedParticipant = {
                $class: 'org.acme.bond.Issuer',
                memberId: 'MEMBER_1',
                name: 'Alexa'
            };

            it('should throw without a where clause as it is unsupported', () => {
                return app.models[prefix + 'Issuer'].updateAll(updatedParticipant)
                    .should.be.rejectedWith(/is not supported/);

            });

            it('should remove a single specified participant', () => {
                return app.models[prefix + 'Issuer'].updateAll({ memberId: 'MEMBER_1' }, updatedParticipant)
                    .then(() => {
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        participant.name.should.equal('Alexa');
                    });
            });

            it('should return an error if the specified participant does not exist', () => {
                return app.models[prefix + 'Issuer'].updateAll({ memberId: 'MEMBER_999' }, updatedParticipant)
                    .should.be.rejected;
            });

        });

        describe(`#upsert namespaces[${namespaces}]`, () => {

            const updatedParticipant = {
                $class: 'org.acme.bond.Issuer',
                memberId: 'MEMBER_1',
                name: 'Alexa'
            };

            it('should update the specified participant', () => {
                return app.models[prefix + 'Issuer'].upsert(updatedParticipant)
                    .then(() => {
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        participant.name.should.equal('Alexa');
                    });
            });

            it('should create a new participant if the specified participant does not exist', () => {
                return app.models[prefix + 'Issuer'].upsert(participantData[2])
                    .then(() => {
                        return participantRegistry.get('MEMBER_3');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        json.should.deep.equal(participantData[2]);
                    });
            });

        });

        describe(`#upsertWithWhere namespaces[${namespaces}]`, () => {

            const updatedParticipant = {
                $class: 'org.acme.bond.Issuer',
                memberId: 'MEMBER_1',
                name: 'Alexa'
            };

            it('should throw without a where clause as it is unsupported', () => {
                return app.models[prefix + 'Issuer'].upsertWithWhere({}, updatedParticipant)
                    .should.be.rejectedWith(/is not supported/);

            });

            it('should update the specified participant', () => {
                return app.models[prefix + 'Issuer'].upsertWithWhere({ memberId: 'MEMBER_1' }, updatedParticipant)
                    .then(() => {
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        participant.name.should.equal('Alexa');
                    });
            });

            it('should create a new participant if the specified participant does not exist', () => {
                return app.models[prefix + 'Issuer'].upsertWithWhere({ memberId: 'MEMBER_3' }, participantData[2])
                    .then(() => {
                        return participantRegistry.get('MEMBER_3');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        json.should.deep.equal(participantData[2]);
                    });
            });

        });

        describe(`#destroy namespaces[${namespaces}]`, () => {

            it('should delete the specified participant', () => {
                return app.models[prefix + 'Issuer'].findById('MEMBER_1')
                    .then((participant) => {
                        return participant.destroy();
                    })
                    .then(() => {
                        return participantRegistry.exists('MEMBER_1');
                    })
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

        });

        describe(`#replaceAttributes namespaces[${namespaces}]`, () => {

            it('should replace attributes in the specified participant', () => {
                return app.models[prefix + 'Issuer'].findById('MEMBER_1')
                    .then((participant) => {
                        return participant.replaceAttributes({
                            name: 'Alexa'
                        });
                    })
                    .then(() => {
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        participant.name.should.equal('Alexa');
                    });
            });

        });

        describe(`#updateAttribute namespaces[${namespaces}]`, () => {

            it('should replace attribute in the specified participant', () => {
                return app.models[prefix + 'Issuer'].findById('MEMBER_1')
                    .then((participant) => {
                        return participant.updateAttribute('name', 'Alexa');
                    })
                    .then(() => {
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        participant.name.should.equal('Alexa');
                    });
            });

        });

        describe(`#updateAttributes namespaces[${namespaces}]`, () => {

            it('should replace attributes in the specified participant', () => {
                return app.models[prefix + 'Issuer'].findById('MEMBER_1')
                    .then((participant) => {
                        return participant.updateAttributes({
                            name: 'Alexa'
                        });
                    })
                    .then(() => {
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        participant.name.should.equal('Alexa');
                    });
            });

        });

    });

});
