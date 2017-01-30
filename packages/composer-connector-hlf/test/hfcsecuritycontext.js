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

const HFCConnection = require('../lib/hfcconnection');
const hfc = require('hfc');
const hfcEventHub = hfc.EventHub;
const hfcMember = hfc.Member;
const HFCSecurityContext = require('../lib/hfcsecuritycontext');
const sinon = require('sinon');

const should = require('chai').should();

describe('HFCSecurityContext', function () {

    let mockConnection;
    let sandbox;

    const connectOptions = {
        type: 'hlf',
        networks: {
            testnetwork: '123'
        }
    };

    beforeEach(() => {
        mockConnection = sinon.createStubInstance(HFCConnection);
        mockConnection.getConnectionOptions.returns(connectOptions);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', function () {

        it('should store the username and password', function () {
            let securityContext = new HFCSecurityContext(mockConnection);
            should.equal(securityContext.user, null);
            should.equal(securityContext.enrolledMember, null);
            should.equal(securityContext.chaincodeID, null);
            should.equal(securityContext.eventHub, null);
        });

    });

    describe('#getUser', function () {

        it('should return the username', function () {
            let securityContext = new HFCSecurityContext(mockConnection);
            securityContext.user = 'doge';
            securityContext.getUser().should.equal('doge');
        });

    });

    describe('#setUser', function () {

        it('should set the username', function () {
            let securityContext = new HFCSecurityContext(mockConnection);
            securityContext.setUser('doge');
            securityContext.user.should.equal('doge');
        });

    });

    describe('#getEnrolledMember', function () {

        it('should return the enrolledMember', function () {
            let mockMember = sinon.createStubInstance(hfcMember);
            let securityContext = new HFCSecurityContext(mockConnection);
            securityContext.enrolledMember = mockMember;
            securityContext.getEnrolledMember().should.equal(mockMember);
        });

    });

    describe('#setEnrolledMember', function () {

        it('should store the enrolledMember', function () {
            let mockMember = sinon.createStubInstance(hfcMember);
            let securityContext = new HFCSecurityContext(mockConnection);
            securityContext.setEnrolledMember(mockMember);
            securityContext.enrolledMember.should.equal(mockMember);
        });

    });

    describe('#getChaincodeID', function () {

        it('should return the chaincodeID', function () {
            let chaincodeID = 'muchchaincodeID';
            let securityContext = new HFCSecurityContext(mockConnection);
            securityContext.chaincodeID = chaincodeID;
            securityContext.getChaincodeID().should.equal(chaincodeID);
        });

    });

    describe('#setChaincodeID', function () {

        it('should store the chaincodeID', function () {
            let chaincodeID = 'muchchaincodeID';
            let securityContext = new HFCSecurityContext(mockConnection);
            securityContext.setChaincodeID(chaincodeID);
            securityContext.chaincodeID.should.equal(chaincodeID);
        });

    });

    describe('#getEventHub', function () {

        it('should return the eventHub', function () {
            let eventHub = sinon.createStubInstance(hfcEventHub);
            let securityContext = new HFCSecurityContext(mockConnection);
            securityContext.eventHub = eventHub;
            securityContext.getEventHub().should.equal(eventHub);
        });

    });

    describe('#setEventHub', function () {

        it('should store the eventHub', function () {
            let eventHub = sinon.createStubInstance(hfcEventHub);
            let securityContext = new HFCSecurityContext(mockConnection);
            securityContext.setEventHub(eventHub);
            securityContext.eventHub.should.equal(eventHub);
        });

    });

});
