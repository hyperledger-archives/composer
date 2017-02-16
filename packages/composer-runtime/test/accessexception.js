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

const AccessException = require('../lib/accessexception');
const BaseException = require('composer-common').BaseException;
const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;

require('chai').should();

describe('AccessException', function () {

    let modelManager;
    let factory;
    let asset;
    let participant;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme.test
        asset TestAsset identified by assetId {
            o String assetId
        }
        participant TestParticipant identified by participantId {
            o String participantId
        }`);
        factory = new Factory(modelManager);
        asset = factory.newResource('org.acme.test', 'TestAsset', 'A1234');
        participant = factory.newResource('org.acme.test', 'TestParticipant', 'P5678');
    });

    describe('#constructor', function () {

        it('should return an instance of BaseException', function () {
            let exc = new AccessException(asset, 'READ', participant);
            exc.should.be.an.instanceOf(BaseException);
        });

        it('should have a useful message', function () {
            let exc = new AccessException(asset, 'READ', participant);
            exc.should.match(/org.acme.test.TestParticipant#P5678.*READ.*org.acme.test.TestAsset#A1234/);
        });

    });

});
