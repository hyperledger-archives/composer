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
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const fs = require('fs');
require('loopback-component-passport');
const path = require('path');
const server = require('../server/server');
const version = require('../package.json').version;

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('System REST API unit tests', () => {

    const participantData = [{
        $class: 'org.acme.bond.Member',
        memberId: 'MEMBER_1',
        name: 'Alice'
    }, {
        $class: 'org.acme.bond.Member',
        memberId: 'MEMBER_2',
        name: 'Bob'
    }];

    let app;
    let businessNetworkConnection;
    let participantRegistry;
    let serializer;

    before(() => {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type : 'embedded'
        })
        .then(() => {
            return adminConnection.connect('defaultProfile', 'admin', 'Xurw3yU9zI0l');
        })
        .then(() => {
            const banana = fs.readFileSync(path.resolve(__dirname, 'bond-network.bna'));
            return BusinessNetworkDefinition.fromArchive(banana);
        })
        .then((businessNetworkDefinition) => {
            serializer = businessNetworkDefinition.getSerializer();
            return adminConnection.deploy(businessNetworkDefinition);
        })
        .then(() => {
            return server({
                connectionProfileName: 'defaultProfile',
                businessNetworkIdentifier: 'bond-network',
                participantId: 'admin',
                participantPwd: 'adminpw',
                fs: bfs_fs,
                namespaces: 'never'
            });
        })
        .then((app_) => {
            app = app_;
            businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
            return businessNetworkConnection.connect('defaultProfile', 'bond-network', 'admin', 'Xurw3yU9zI0l');
        })
        .then(() => {
            return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Member');
        })
        .then((participantRegistry_) => {
            participantRegistry = participantRegistry_;
            return participantRegistry.addAll([
                serializer.fromJSON(participantData[0]),
                serializer.fromJSON(participantData[1])
            ]);
        })
        .then(() => {
            return businessNetworkConnection.issueIdentity('org.acme.bond.Member#MEMBER_2', 'bob1', { issuer: true });
        });
    });

    describe('GET /ping', () => {

        it('should ping the business network', () => {
            return chai.request(app)
                .get('/api/system/ping')
                .then((res) => {
                    res.should.be.json;
                    res.body.should.deep.equal({
                        version: version,
                        participant: null
                    });
                });
        });

    });

    describe('POST /issueIdentity', () => {

        it('should issue an identity for a participant in the business network', () => {
            return chai.request(app)
                .post('/api/system/issueIdentity')
                .send({
                    participant: 'org.acme.bond.Member#MEMBER_1',
                    userID: 'alice1',
                    options: {
                        issuer: true
                    }
                })
                .then((res) => {
                    res.should.be.json;
                    res.body.userID.should.equal('alice1');
                    res.body.userSecret.should.be.a('string');
                });
        });

        it('should return a 500 if the specified participant does not exist', () => {
            return chai.request(app)
                .post('/api/system/issueIdentity')
                .send({
                    participant: 'org.acme.bond.Member#MEMBER_X',
                    userID: 'alice1',
                    options: {
                        issuer: true
                    }
                })
                .catch((err) => {
                    err.response.should.have.status(500);
                });
        });

    });

    describe('POST /revokeIdentity', () => {

        it('should revoke an identity for a participant in the business network', () => {
            return chai.request(app)
                .post('/api/system/revokeIdentity')
                .send({
                    userID: 'bob1'
                })
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(204);
                    res.body.should.have.lengthOf(0);
                });
        });

        it('should return a 500 if the specified identity does not exist', () => {
            return chai.request(app)
                .post('/api/system/revokeIdentity')
                .send({
                    userID: 'bobX'
                })
                .catch((err) => {
                    err.response.should.have.status(500);
                });
        });

    });

});
