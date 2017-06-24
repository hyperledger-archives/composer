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

const ConnectionManager = require('../lib/connectionmanager');
const ConnectionProfileManager = require('../lib/connectionprofilemanager');

const chai = require('chai');
chai.should();
const expect = require('chai').expect;
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('ConnectionManager', () => {

    let mockConnectionProfileManager;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
    });

    describe('#constructor', () => {

        it('should throw if no connection profile manager', () => {

            expect(() => {
                let cm = new ConnectionManager(null);
                cm.should.be.null;
            })
          .to.throw(/Must create ConnectionManager with a ConnectionProfileManager/);
        });

    });

    describe('#getConnectionProfileManager', () => {

        it('should get connection profile manager', () => {
            let cm = new ConnectionManager(mockConnectionProfileManager);
            cm.should.not.be.null;
            cm.getConnectionProfileManager().should.equal(mockConnectionProfileManager);
        });

    });

    describe('#connect', () => {

        it('should throw as abstract', () => {

            let cm = new ConnectionManager(mockConnectionProfileManager);
            cm.should.not.be.null;
            return cm.connect('profile', 'network')
                  .then(() => {
                      true.should.be.false;
                  })
                  .catch((err) => {
                      err.message.should.match(/abstract function called/);
                  });
        });
    });

});
