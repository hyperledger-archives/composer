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

const ComboConnectionProfileStore = require('../lib/comboconnectionprofilestore');
const ConnectionProfileStore = require('../lib/connectionprofilestore');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('ComboConnectionProfileStore', () => {

    let cps1, cps2;

    beforeEach(() => {
        cps1 = sinon.createStubInstance(ConnectionProfileStore);
        cps2 = sinon.createStubInstance(ConnectionProfileStore);
    });

    describe('#constructor', () => {

        it('should create a new instance with two connection profile stores', () => {
            const cps = new ComboConnectionProfileStore(cps1, cps2);
            cps.connectionProfileStores.should.deep.equal([cps1, cps2]);
        });

        it('should throw an error if anything other than a connection profile store is specified', () => {
            process.env.COMPOSER_CONFIG = 'ir32u98mx38829&#C(#&(*#2##()U@)*(@';
            (() => {
                new ComboConnectionProfileStore(cps1, cps2, { hello: 'world' });
            }).should.throw(/is not a connection profile store/);
        });

    });

    describe('#load', () => {

        it('should return the specified connection profile from the first connection profile manager', () => {
            cps1.load.withArgs('hlfabric1').resolves({ type: 'hlfv1' });
            cps2.load.rejects();
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.load('hlfabric1')
                .then((connectionProfile) => {
                    connectionProfile.should.deep.equal({
                        type: 'hlfv1'
                    });
                });
        });

        it('should return the specified connection profile from the second connection profile manager', () => {
            cps1.load.rejects();
            cps2.load.withArgs('hlfabric2').resolves({ type: 'hlfv2' });
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.load('hlfabric2')
                .then((connectionProfile) => {
                    connectionProfile.should.deep.equal({
                        type: 'hlfv2'
                    });
                });
        });

        it('should throw if the specified connection profile does not exist', () => {
            cps1.load.rejects();
            cps2.load.rejects();
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.load('hlfabric1')
                .should.be.rejectedWith(/does not exist/);
        });

    });

    describe('#save', () => {

        it('should throw if nowhere to save the connection profile', () => {
            let cps = new ComboConnectionProfileStore();
            return cps.save('profile', {})
                .should.be.rejectedWith(/could not be saved/);
        });

        it('should save to the first connection profile manager', () => {
            cps1.save.withArgs('profile', {}).resolves();
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.save('profile', {})
                .then(() => {
                    sinon.assert.calledOnce(cps1.save);
                    sinon.assert.notCalled(cps2.save);
                });
        });

        it('should save to the second connection profile manager', () => {
            cps1.save.rejects();
            cps2.save.withArgs('profile', {}).resolves();
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.save('profile', {})
                .then(() => {
                    sinon.assert.calledOnce(cps1.save);
                    sinon.assert.calledOnce(cps2.save);
                });
        });

    });

    describe('#loadAll', () => {

        it('should return the specified connection profile', () => {
            cps1.loadAll.resolves({
                hlfabric1: {
                    type: 'hlfv1'
                },
                hlfabric2: {
                    type: 'hlfv2'
                }
            });
            cps2.loadAll.resolves({
                hlfabric1: {
                    type: 'hlfv3'
                },
                hlfabric3: {
                    type: 'hlfv4'
                }
            });
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.loadAll()
                .then((connectionProfiles) => {
                    connectionProfiles.should.deep.equal({
                        hlfabric1: {
                            type: 'hlfv1'
                        },
                        hlfabric2: {
                            type: 'hlfv2'
                        },
                        hlfabric3: {
                            type: 'hlfv4'
                        }
                    });
                });
        });

        it('should handle any errors', () => {
            cps1.loadAll.resolves({
                hlfabric1: {
                    type: 'hlfv1'
                },
                hlfabric2: {
                    type: 'hlfv2'
                }
            });
            cps2.loadAll.rejects(new Error('such error'));
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.loadAll()
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#delete', () => {

        it('should delete the specified connection profile', () => {
            cps1.delete.withArgs('hlfabric1').resolves();
            cps2.delete.withArgs('hlfabric1').resolves();
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.delete('hlfabric1');
        });

        it('should ignore any errors', () => {
            cps1.delete.withArgs('hlfabric1').resolves();
            cps2.delete.withArgs('hlfabric1').rejects(new Error('such error'));
            let cps = new ComboConnectionProfileStore(cps1, cps2);
            return cps.delete('hlfabric1');
        });

    });

});
