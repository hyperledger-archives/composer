/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const AccessException = require('../lib/accessexception');
const BaseException = require('@ibm/concerto-common').BaseException;
const Factory = require('@ibm/concerto-common').Factory;
const ModelManager = require('@ibm/concerto-common').ModelManager;

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
        asset = factory.newInstance('org.acme.test', 'TestAsset', 'A1234');
        participant = factory.newInstance('org.acme.test', 'TestParticipant', 'P5678');
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
