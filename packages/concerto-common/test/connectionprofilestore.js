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

const ConnectionProfileStore = require('../lib/connectionprofilestore');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('ConnectionProfileStore', () => {

    describe('#load', () => {

        it('should throw as abstract method', () => {

            let cps = new ConnectionProfileStore();
            return cps.load('profile')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });
    });

    describe('#save', () => {

        it('should throw as abstract method', () => {

            let cps = new ConnectionProfileStore();
            return cps.save('profile', {})
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });
    });

    describe('#loadAll', () => {

        it('should throw as abstract method', () => {

            let cps = new ConnectionProfileStore();
            return cps.loadAll()
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });
    });

    describe('#delete', () => {

        it('should throw as abstract method', () => {

            let cps = new ConnectionProfileStore();
            return cps.delete('profile')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });
    });

});
