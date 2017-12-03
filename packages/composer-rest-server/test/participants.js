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
const IdCard = require('composer-common').IdCard;
require('loopback-component-passport');
const server = require('../server/server');

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));
const clone = require('clone');


['always', 'never'].forEach((namespaces) => {

    const prefix = namespaces === 'always' ? 'org.acme.bond.' : '';

    describe(`Participant REST API unit tests namespaces[${namespaces}]`, () => {

        const participantData = [{
            $class: 'org.acme.bond.Member',
            memberId: 'MEMBER_1',
            name: 'Alice',
            lastName: 'Stone'
        }, {
            $class: 'org.acme.bond.Member',
            memberId: 'MEMBER_2',
            name: 'Bob',
            lastName: 'Bond'
        }, {
            $class: 'org.acme.bond.Member',
            memberId: 'MEMBER_3',
            name: 'Charlie',
            lastName: 'Chow'
        }, {
            // $class: 'org.acme.bond.Member',
            memberId: 'MEMBER_4',
            name: 'Doge'
        }];

        let app;
        let businessNetworkConnection;
        let participantRegistry;
        let serializer;
        let idCard;

        before(() => {
            const cardStore = new MemoryCardStore();
            const adminConnection = new AdminConnection({ cardStore });
            let metadata = { version:1, userName: 'admin', enrollmentSecret: 'adminpw', roles: ['PeerAdmin', 'ChannelAdmin'] };
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
                return adminConnection.start(businessNetworkDefinition,{networkAdmins :[{userName:'admin',enrollmentSecret:'adminpw'}] });
            })
            .then(() => {
                idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
                return adminConnection.importCard('admin@bond-network', idCard);
            })
            .then(() => {
                return server({
                    card: 'admin@bond-network',
                    cardStore,
                    namespaces: namespaces
                });
            })
            .then((result) => {
                app = result.app;
                businessNetworkConnection = new BusinessNetworkConnection({ cardStore });
                return businessNetworkConnection.connect('admin@bond-network');
            })            .then(() => {
                return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Member');
            })
            .then((participantRegistry_) => {
                participantRegistry = participantRegistry_;
                return participantRegistry.addAll([
                    serializer.fromJSON(participantData[0]),
                    serializer.fromJSON(participantData[1])
                ]);
            });
        });

        describe(`GET / namespaces[${namespaces}]`, () => {

            it('should return all of the participants', () => {
                return chai.request(app)
                    .get(`/api/${prefix}Member`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            participantData[0],
                            participantData[1],
                        ]);
                    });
            });

        });

        describe(`POST / namespaces[${namespaces}]`, () => {

            it('should create the specified participant', () => {
                return chai.request(app)
                    .post(`/api/${prefix}Member`)
                    .send(participantData[2])
                    .then((res) => {
                        res.should.have.status(200);
                        return participantRegistry.get('MEMBER_3');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        json.should.deep.equal(participantData[2]);
                        return participantRegistry.remove('MEMBER_3');
                    });
            });

            it('should create the specified participant without a $class property', () => {
                return chai.request(app)
                    .post(`/api/${prefix}Member`)
                    .send(participantData[3])
                    .then((res) => {
                        res.should.have.status(200);
                        return participantRegistry.get('MEMBER_4');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        delete json.$class;
                        json.should.deep.equal(participantData[3]);
                        return participantRegistry.remove('MEMBER_4');
                    });
            });

            it('should return a 500 if the specified participant already exists', () => {
                return chai.request(app)
                    .post(`/api/${prefix}Member`)
                    .send(participantData[0])
                    .catch((err) => {
                        err.response.should.have.status(500);
                    });
            });

            it('should create the specified array of assets', () => {
                return chai.request(app)
                    .post(`/api/${prefix}Member`)
                    .send([participantData[2], participantData[3]])
                    .then(() => {
                        return participantRegistry.get('MEMBER_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(participantData[2]);
                        return participantRegistry.remove('MEMBER_3');
                    })
                    .then(() => {
                        return participantRegistry.get('MEMBER_4');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        delete json.$class;
                        json.should.deep.equal(participantData[3]);
                        return participantRegistry.remove('MEMBER_4');
                    });
            });

        });

        describe(`GET /:id namespaces[${namespaces}]`, () => {

            it('should return the specified participant', () => {
                return chai.request(app)
                    .get(`/api/${prefix}Member/MEMBER_1`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal(participantData[0]);
                    });
            });

            it('should return a 404 if the specified participant does not exist', () => {
                return chai.request(app)
                    .get(`/api/${prefix}Member/MEMBER_999`)
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });

        });

        describe(`HEAD /:id namespaces[${namespaces}]`, () => {

            it('should check to see if the specified participant exists', () => {
                return chai.request(app)
                    .head(`/api/${prefix}Member/MEMBER_1`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.have.lengthOf(0);
                    });
            });

            it('should return a 404 if the specified participant does not exist', () => {
                return chai.request(app)
                    .get(`/api/${prefix}Member/MEMBER_999`)
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });

        });

        describe(`PUT /:id namespaces[${namespaces}]`, () => {

            it('should update the specified participant', () => {
                const newParticipantData = clone(participantData[0]);
                newParticipantData.name = 'DogeCorp';
                return chai.request(app)
                    .put(`/api/${prefix}Member/MEMBER_1`)
                    .set('content-type', 'application/json')
                    .send(newParticipantData)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        return participantRegistry.get('MEMBER_1');
                    })
                    .then((participant) => {
                        let json = serializer.toJSON(participant);
                        json.should.deep.equal(newParticipantData);
                    });
            });

            it('should return a 404 if the specified participant does not exist', () => {
                const newParticipantData = clone(participantData[0]);
                newParticipantData.memberId = 'MEMBER_999';
                newParticipantData.name = 'DogeCorp';
                return chai.request(app)
                    .put(`/api/${prefix}Member/MEMBER_999`)
                    .send(newParticipantData)
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });

        });

        describe(`DELETE /:id namespaces[${namespaces}]`, () => {

            it('should delete the specified participant', () => {
                return chai.request(app)
                    .delete(`/api/${prefix}Member/MEMBER_1`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(204);
                        res.body.should.have.lengthOf(0);
                        return participantRegistry.exists('1');
                    })
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

            it('should return a 404 if the specified participant does not exist', () => {
                return chai.request(app)
                    .delete(`/api/${prefix}Member/MEMBER_999`)
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });

        });

    });

});
