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

const LoggingService = require('composer-runtime').LoggingService;
const Logger = require('composer-common').Logger;
const NodeLoggingService = require('../lib/nodeloggingservice');
const ChaincodeStub = require('fabric-shim/lib/stub');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
let chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('NodeLoggingService', () => {

    let loggingService;
    let sandbox, mockStub;


    beforeEach(() => {
        loggingService = new NodeLoggingService();
        sandbox = sinon.sandbox.create();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        mockStub.putState.resolves();
        mockStub.getTxID.returns('1548a95f57863bce4566');
        loggingService.stub = mockStub;
        mockStub.putState.resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should create a logging service', () => {
            loggingService.should.be.an.instanceOf(LoggingService);
        });

    });

    describe('#setLoggerCfg',()=>{
        it('should call the putState method',()=>{
            let cfg = {debug:'everything'};
            loggingService.setLoggerCfg(cfg);
            sinon.assert.calledOnce(mockStub.putState);
            sinon.assert.calledWith(mockStub.putState,'ComposerLogCfg',Buffer.from(JSON.stringify(cfg)));
        });
    });


    describe('#getDefaultCfg', () => {

        it('should return the default values', () => {
            delete  process.env.CORE_CHAINCODE_LOGGING_LEVEL;
            let value = loggingService.getDefaultCfg();
            value.debug.should.equal('composer[warn]:*');
        });

        it('should return the default value if the enviroment variable is invalid', () => {
            process.env.CORE_CHAINCODE_LOGGING_LEVEL='wibble';
            let value = loggingService.getDefaultCfg();
            value.debug.should.equal('composer[warn]:*');
        });

        it('should map fabric container values to valid composer debug strings', () => {
            process.env.CORE_CHAINCODE_LOGGING_LEVEL='CRITICAL';
            loggingService.getDefaultCfg().debug.should.equal('composer[error]:*');

            process.env.CORE_CHAINCODE_LOGGING_LEVEL='ERROR';
            loggingService.getDefaultCfg().debug.should.equal('composer[error]:*');


            process.env.CORE_CHAINCODE_LOGGING_LEVEL='WARNING';
            loggingService.getDefaultCfg().debug.should.equal('composer[warn]:*');

            process.env.CORE_CHAINCODE_LOGGING_LEVEL='NOTICE';
            loggingService.getDefaultCfg().debug.should.equal('composer[info]:*');

            process.env.CORE_CHAINCODE_LOGGING_LEVEL='INFO';
            loggingService.getDefaultCfg().debug.should.equal('composer[info]:*');

            process.env.CORE_CHAINCODE_LOGGING_LEVEL='DEBUG';
            loggingService.getDefaultCfg().debug.should.equal('composer[debug]:*');
        });

    });

    describe('#getLoggerCfg',async  () => {

        it('should default if nothing in state', async () => {
            loggingService.stub.getState.returns([]);
            let result = await loggingService.getLoggerCfg();
            chai.expect(result).to.containSubset({'origin':'default-runtime-hlfv1'});
        });

        it('should return what was in state',async () => {
            loggingService.stub.getState.returns(JSON.stringify({batman:'hero'}));
            let result = await loggingService.getLoggerCfg();
            chai.expect(result).to.containSubset({batman:'hero'});
        });

        it('should have state set by the default logger module ',async ()=>{
            loggingService.stub.getState.returns(JSON.stringify({origin:'default-logger-module'}));
            let result = await loggingService.getLoggerCfg();
            chai.expect(result).to.containSubset(loggingService.getDefaultCfg());
        });

    });

    describe('#initLogging', async  () => {

        it('should set the logging state to the current logger config, on first call only', async () => {
            sandbox.stub(Logger, 'setLoggerCfg');
            sandbox.stub(loggingService, 'getLoggerCfg').returns('some config');
            await loggingService.initLogging(mockStub);
            sinon.assert.calledOnce(Logger.setLoggerCfg);
            sinon.assert.calledWith(Logger.setLoggerCfg, 'some config', true);

            // call it again
            await loggingService.initLogging(mockStub);
            sinon.assert.calledOnce(Logger.setLoggerCfg);
            sinon.assert.calledWith(Logger.setLoggerCfg, 'some config', true);
        });
    });

    describe('#mapCfg', async ()=>{
        let expectedDefault = 'composer[warn]:*';
        it('should handle an empty string with default value',()=>{
            loggingService.mapCfg('').should.equal(expectedDefault);
        });
        it('should handle an empt-ish string with default value',()=>{
            loggingService.mapCfg(',').should.equal(expectedDefault);
        });
        it('should handle a valid fabric value',()=>{
            loggingService.mapCfg('CRITICAL').should.equal('composer[error]:*');
            loggingService.mapCfg('ERROR').should.equal('composer[error]:*');
            loggingService.mapCfg('WARNING').should.equal('composer[warn]:*');
            loggingService.mapCfg('NOTICE').should.equal('composer[info]:*');
            loggingService.mapCfg('INFO').should.equal('composer[info]:*');
            loggingService.mapCfg('DEBUG').should.equal('composer[debug]:*');
        });

        it('should handle a valid composer value',()=>{
            loggingService.mapCfg('composer[info]:*').should.equal('composer[info]:*');
            loggingService.mapCfg('composer[debug]:classname,composer[info]:someother,composer[error]:*').should.equal('composer[debug]:classname,composer[info]:someother,composer[error]:*');
        });
        it('should handle a * (everything)',()=>{
            loggingService.mapCfg('*').should.equal(expectedDefault);
        });
        it('should handle a mix of composer and fabric, with fabric the answer',()=>{
            loggingService.mapCfg('composer[info]:*,Critical').should.equal('composer[error]:*');
        });
        it('should handle incorrect strings',()=>{
            loggingService.mapCfg('wibble').should.equal(expectedDefault);
            loggingService.mapCfg('wibble,stuff').should.equal(expectedDefault);
            loggingService.mapCfg('composer[stuff]').should.equal(expectedDefault);
        });

    });
});
