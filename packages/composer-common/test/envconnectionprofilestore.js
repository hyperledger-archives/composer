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

const EnvConnectionProfileStore = require('../lib/envconnectionprofilestore');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('EnvConnectionProfileStore', () => {

    beforeEach(() => {
        delete process.env.COMPOSER_CONFIG;
    });

    afterEach(() => {
        delete process.env.COMPOSER_CONFIG;
    });

    describe('#constructor', () => {

        it('should handle no COMPOSER_CONFIG environment variable', () => {
            const cps = new EnvConnectionProfileStore();
            cps.env.should.deep.equal({
                connectionProfiles: {}
            });
        });

        it('should parse the COMPOSER_CONFIG environment variable', () => {
            const config = {
                connectionProfiles: {
                    hlfabric1: {
                        type: 'hlfv1'
                    },
                    hlfabric2: {
                        type: 'hlfv2'
                    }
                }
            };
            process.env.COMPOSER_CONFIG = JSON.stringify(config);
            const cps = new EnvConnectionProfileStore();
            cps.env.should.deep.equal(config);
        });

        it('should parse the COMPOSER_CONFIG environment variable without any connection profiles', () => {
            const config = { };
            process.env.COMPOSER_CONFIG = JSON.stringify(config);
            const cps = new EnvConnectionProfileStore();
            cps.env.should.deep.equal({
                connectionProfiles: {}
            });
        });

        it('should throw an error if the COMPOSER_CONFIG environment variable contains invalid JSON', () => {
            process.env.COMPOSER_CONFIG = 'ir32u98mx38829&#C(#&(*#2##()U@)*(@';
            (() => {
                new EnvConnectionProfileStore();
            }).should.throw(/Failed to parse the value/);
        });

    });

    describe('#load', () => {

        it('should return the specified connection profile', () => {
            const config = {
                connectionProfiles: {
                    hlfabric1: {
                        type: 'hlfv1'
                    },
                }
            };
            process.env.COMPOSER_CONFIG = JSON.stringify(config);
            let cps = new EnvConnectionProfileStore();
            return cps.load('hlfabric1')
                .then((connectionProfile) => {
                    connectionProfile.should.deep.equal({
                        type: 'hlfv1'
                    });
                });
        });

        it('should throw if the specified connection profile does not exist', () => {
            const config = {
                connectionProfiles: {
                    hlfabric1: {
                        type: 'hlfv1'
                    },
                }
            };
            process.env.COMPOSER_CONFIG = JSON.stringify(config);
            let cps = new EnvConnectionProfileStore();
            return cps.load('hlfabric2')
                .should.be.rejectedWith(/does not exist in the environment/);
        });

    });

    describe('#save', () => {

        it('should throw as unsupported method', () => {
            let cps = new EnvConnectionProfileStore();
            return cps.save('profile', {})
                .should.be.rejectedWith(/Cannot save connection profile/);
        });

    });

    describe('#loadAll', () => {

        it('should return the specified connection profile', () => {
            const config = {
                connectionProfiles: {
                    hlfabric1: {
                        type: 'hlfv1'
                    },
                    hlfabric2: {
                        type: 'hlfv2'
                    }
                }
            };
            process.env.COMPOSER_CONFIG = JSON.stringify(config);
            let cps = new EnvConnectionProfileStore();
            return cps.loadAll()
                .then((connectionProfiles) => {
                    connectionProfiles.should.deep.equal({
                        hlfabric1: {
                            type: 'hlfv1'
                        },
                        hlfabric2: {
                            type: 'hlfv2'
                        }
                    });
                });
        });

    });

    describe('#delete', () => {

        it('should throw as unsupported method', () => {
            let cps = new EnvConnectionProfileStore();
            return cps.delete('profile')
                .should.be.rejectedWith(/Cannot delete connection profile/);
        });

    });

});
