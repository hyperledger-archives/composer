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
const HFCSecurityContext = require('../lib/hfcsecuritycontext');
const HFCUtil = require('../lib/hfcutil');
const EventEmitter = require('events');
const fs = require('fs-extra');
const hfc = require('hfc');
const path = require('path');
const SecurityException = require('composer-common').SecurityException;
const temp = require('temp').track();
const uuid = require('uuid');
const version = require('../package.json').version;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

const runtimeModulePath = path.dirname(require.resolve('composer-runtime-hlf'));

describe('HFCUtil', function () {

    let mockConnection;
    let securityContext;
    let enrolledMember;
    let chain;
    let sandbox;

    let connectOptions = {
        type: 'hlf',
        networks: {
            testnetwork: '123'
        }
    };

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        mockConnection = sinon.createStubInstance(HFCConnection);
        mockConnection.getConnectionOptions.returns(connectOptions);
        securityContext = new HFCSecurityContext(mockConnection);
        enrolledMember = sinon.createStubInstance(hfc.Member);
        chain = sinon.createStubInstance(hfc.Chain);
        enrolledMember.getChain.returns(chain);
        securityContext.setEnrolledMember(enrolledMember);
        securityContext.setChaincodeID('wowsuchchaincodeID');
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#securityCheck', function () {

        it('should throw for an undefined security context', function () {
            (function () {
                HFCUtil.securityCheck(undefined);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should throw for a null security context', function () {
            (function () {
                HFCUtil.securityCheck(null);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should throw for an invalid type of security context', function () {
            (function () {
                HFCUtil.securityCheck([{}]);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should work for a valid security context', function () {
            HFCUtil.securityCheck(securityContext);
        });

    });

    describe('#queryChainCode', function () {

        it('should perform a security check', function () {
            let transactionContext = new EventEmitter();
            process.nextTick(() => transactionContext.emit('submitted'));
            process.nextTick(() => transactionContext.emit('complete', {
                result: Buffer.from('hello world')
            }));
            enrolledMember.query.returns(transactionContext);
            let stub = sandbox.stub(HFCUtil, 'securityCheck');
            return HFCUtil
                .queryChainCode(securityContext, 'init', [])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should throw when functionName is not specified', function () {
            (function () {
                HFCUtil.queryChainCode(securityContext, null, []);
            }).should.throw(/functionName not specified/);
        });

        it('should throw when args is not specified', function () {
            (function () {
                HFCUtil.queryChainCode(securityContext, 'function', null);
            }).should.throw(/args not specified/);
        });

        it('should throw when args contains an invalid value', function () {
            (function () {
                HFCUtil.queryChainCode(securityContext, 'function', [undefined]);
            }).should.throw(/invalid arg specified: undefined/);
        });

        it('should query the chain-code and return the result', function () {

            // Set up the responses from the chain-code.
            let transactionContext = new EventEmitter();
            process.nextTick(() => transactionContext.emit('submitted'));
            process.nextTick(() => transactionContext.emit('complete', {
                result: Buffer.from('hello world')
            }));
            enrolledMember.query.returns(transactionContext);

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.queryChainCode(securityContext, 'dogeFunction', ['wow', 'such', 'args'])
                .then(function (buffer) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(enrolledMember.query);
                    sinon.assert.calledWith(enrolledMember.query, sinon.match(function (queryRequest) {
                        queryRequest.chaincodeID.should.equal('wowsuchchaincodeID');
                        queryRequest.fcn.should.equal('dogeFunction');
                        queryRequest.args.should.deep.equal(['wow', 'such', 'args']);
                        queryRequest.attrs.should.deep.equal(['userID']);
                        return true;
                    }));

                    // Check that the asset registries were returned correctly.
                    buffer.should.be.an.instanceOf(Buffer);
                    (buffer.compare(Buffer.from('hello world'))).should.equal(0);

                });

        });

        it('should handle an error from querying the chain-code', function () {

            // Set up the responses from the chain-code.
            let transactionContext = new EventEmitter();
            process.nextTick(() => transactionContext.emit('submitted'));
            process.nextTick(() => transactionContext.emit('error',
                new Error('failed to invoke chain-code with some reason')
            ));
            enrolledMember.query.returns(transactionContext);

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.queryChainCode(securityContext, 'dogeFunction', ['wow', 'such', 'args'])
                .then(function (buffer) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

        it('should handle an hfc transaction error from querying the chain-code', function () {

            // Set up the responses from the chain-code.
            let transactionContext = new EventEmitter();
            process.nextTick(() => transactionContext.emit('submitted'));
            process.nextTick(() => transactionContext.emit('error',
                new hfc.EventTransactionError('failed to invoke chain-code')
            ));
            enrolledMember.query.returns(transactionContext);

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.queryChainCode(securityContext, 'dogeFunction', ['wow', 'such', 'args'])
                .then(function (buffer) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#invokeChainCode', function () {

        it('should perform a security check', function () {
            let transactionContext = new EventEmitter();
            process.nextTick(() => transactionContext.emit('submitted'));
            process.nextTick(() => transactionContext.emit('complete', {
                result: Buffer.from('hello world')
            }));
            enrolledMember.invoke.returns(transactionContext);
            let stub = sandbox.stub(HFCUtil, 'securityCheck');
            return HFCUtil
                .invokeChainCode(securityContext, 'init', [])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should throw when functionName is not specified', function () {
            (function () {
                HFCUtil.invokeChainCode(securityContext, null, []);
            }).should.throw(/functionName not specified/);
        });

        it('should throw when args is not specified', function () {
            (function () {
                HFCUtil.invokeChainCode(securityContext, 'function', null);
            }).should.throw(/args not specified/);
        });

        it('should throw when args contains an invalid value', function () {
            (function () {
                HFCUtil.invokeChainCode(securityContext, 'function', [undefined]);
            }).should.throw(/invalid arg specified: undefined/);
        });

        it('should invoke the chain-code and return the result', function () {

            // Set up the responses from the chain-code.
            let transactionContext = new EventEmitter();
            process.nextTick(() => transactionContext.emit('submitted'));
            process.nextTick(() => transactionContext.emit('complete', {}));
            enrolledMember.invoke.returns(transactionContext);

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.invokeChainCode(securityContext, 'dogeFunction', ['wow', 'such', 'args'])
                .then(function (buffer) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(enrolledMember.invoke);
                    sinon.assert.calledWith(enrolledMember.invoke, sinon.match(function (invokeRequest) {
                        invokeRequest.chaincodeID.should.equal('wowsuchchaincodeID');
                        invokeRequest.fcn.should.equal('dogeFunction');
                        invokeRequest.args.should.deep.equal(['wow', 'such', 'args']);
                        invokeRequest.attrs.should.deep.equal(['userID']);
                        return true;
                    }));

                });

        });

        it('should handle an error from invoking the chain-code', function () {

            // Set up the responses from the chain-code.
            let transactionContext = new EventEmitter();
            process.nextTick(() => transactionContext.emit('submitted'));
            process.nextTick(() => transactionContext.emit('error',
                new Error('failed to invoke chain-code with some reason')
            ));
            enrolledMember.invoke.returns(transactionContext);

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.invokeChainCode(securityContext, 'dogeFunction', ['wow', 'such', 'args'])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

        it('should handle an hfc transaction error from invoking the chain-code', function () {

            // Set up the responses from the chain-code.
            let transactionContext = new EventEmitter();
            process.nextTick(() => transactionContext.emit('submitted'));
            process.nextTick(() => transactionContext.emit('error',
                new hfc.EventTransactionError('failed to invoke chain-code')
            ));
            enrolledMember.invoke.returns(transactionContext);

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.invokeChainCode(securityContext, 'dogeFunction', ['wow', 'such', 'args'])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#deployChainCode', function () {

        beforeEach(() => {
            sandbox.stub(fs, 'copy').callsArgWith(3, null);
            sandbox.stub(fs, 'remove').callsArgWith(1, null);
            sandbox.stub(temp, 'mkdir').callsArgWith(1, null, '/tmp/concerto');
            sandbox.stub(fs, 'outputFile').callsArgWith(2, null);
        });

        it('should perform a security check', function () {
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });
            let stub = sandbox.stub(HFCUtil, 'securityCheck');
            return HFCUtil
                .deployChainCode(securityContext, 'concerto', 'init', [])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should throw when chaincodePath is not specified', function () {
            (function () {
                HFCUtil.deployChainCode(securityContext, null, 'function', []);
            }).should.throw(/chaincodePath not specified/);
        });

        it('should throw when functionName is not specified', function () {
            (function () {
                HFCUtil.deployChainCode(securityContext, 'chaincode', null, []);
            }).should.throw(/functionName not specified/);
        });

        it('should throw when args is not specified', function () {
            (function () {
                HFCUtil.deployChainCode(securityContext, 'chaincode', 'function', null);
            }).should.throw(/args not specified/);
        });

        it('should throw when args contains an invalid value', function () {
            (function () {
                HFCUtil.deployChainCode(securityContext, 'chaincode', 'function', [undefined]);
            }).should.throw(/invalid arg specified: undefined/);
        });

        it('should throw when a temporary directory cannot be created due to throw', function () {
            temp.mkdir.onFirstCall().throws(new Error('cannot create temporary directory'));
            return HFCUtil
                .deployChainCode(securityContext, 'chaincode', 'function', [])
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.should.match(/cannot create temporary directory/);
                });
        });

        it('should throw when a temporary directory cannot be created due to error', function () {
            temp.mkdir.onFirstCall().callsArgWith(1, new Error('cannot create temporary directory'));
            return HFCUtil
                .deployChainCode(securityContext, 'chaincode', 'function', [])
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.should.match(/cannot create temporary directory/);
                });
        });

        it('should throw when chaincode cannot be copied into temporary directory due to throw', function () {
            fs.copy.onFirstCall().throws(new Error('cannot copy chaincode into temporary directory'));
            return HFCUtil
                .deployChainCode(securityContext, 'chaincode', 'function', [])
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.should.match(/cannot copy chaincode into temporary directory/);
                });
        });

        it('should throw when chaincode cannot be copied into temporary directory due to error', function () {
            fs.copy.onFirstCall().callsArgWith(3, new Error('cannot copy chaincode into temporary directory'));
            return HFCUtil
                .deployChainCode(securityContext, 'chaincode', 'function', [])
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.should.match(/cannot copy chaincode into temporary directory/);
                });
        });

        it('should throw when the temporary directory cannot be deleted due to throw', function () {
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });
            fs.remove.onFirstCall().throws(new Error('cannot delete temporary directory'));
            return HFCUtil
                .deployChainCode(securityContext, 'chaincode', 'function', [])
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.should.match(/cannot delete temporary directory/);
                });
        });

        it('should throw when the temporary directory cannot be deleted due to error', function () {
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });
            fs.remove.onFirstCall().callsArgWith(1, new Error('cannot delete temporary directory'));
            return HFCUtil
                .deployChainCode(securityContext, 'chaincode', 'function', [])
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.should.match(/cannot delete temporary directory/);
                });
        });

        it('should throw the right error when the temporary directory cannot be deleted after a deploy error due to throw', function () {
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('error',
                    new hfc.EventTransactionError('failed to deploy chain-code')
                ));
                return transactionContext;
            });
            fs.remove.onFirstCall().throws(new Error('cannot delete temporary directory'));
            return HFCUtil
                .deployChainCode(securityContext, 'chaincode', 'function', [])
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    sinon.assert.calledOnce(fs.remove);
                    err.should.match(/failed to deploy chain-code/);
                });
        });

        it('should throw the right error when the temporary directory cannot be deleted after a deploy error due to error', function () {
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('error',
                    new hfc.EventTransactionError('failed to deploy chain-code')
                ));
                return transactionContext;
            });
            fs.remove.onFirstCall().callsArgWith(1, new Error('cannot delete temporary directory'));
            return HFCUtil
                .deployChainCode(securityContext, 'chaincode', 'function', [])
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    sinon.assert.calledOnce(fs.remove);
                    err.should.match(/failed to deploy chain-code/);
                });
        });

        it('should deploy the chain-code and return the result', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [])
                .then(function (result) {

                    // Check that the chaincode was copied elsewhere.
                    sinon.assert.calledOnce(temp.mkdir);
                    sinon.assert.calledWith(temp.mkdir, 'concerto');
                    sinon.assert.calledOnce(fs.copy);
                    sinon.assert.calledWith(fs.copy, path.resolve(runtimeModulePath), '/tmp/concerto/src/concerto');

                    // Check the filter ignores any relevant node modules files.
                    fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    fs.copy.firstCall.args[2].filter('composer-runtime-hlf/node_modules/here').should.be.false;

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(enrolledMember.deploy);
                    sinon.assert.calledWith(enrolledMember.deploy, sinon.match(function (deployRequest) {
                        process.env.GOPATH.should.equal('/tmp/concerto');
                        deployRequest.fcn.should.equal('init');
                        deployRequest.args.should.deep.equal([]);
                        deployRequest.chaincodePath.should.equal('concerto');
                        return true;
                    }));

                    // Check that the security context was updated correctly.
                    result.chaincodeID.should.equal('muchchaincodeID');

                    // Check that the chaincode copy was deleted.
                    sinon.assert.calledOnce(fs.remove);
                    sinon.assert.calledWith(fs.remove, '/tmp/concerto');

                });

        });

        it('should write the version into the chain-code', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [])
                .then(function (result) {

                    // Check that the chaincode was copied with an additional file.
                    sinon.assert.called(fs.outputFile);
                    sinon.assert.calledWith(fs.outputFile, '/tmp/concerto/src/concerto/version.go', sinon.match(new RegExp(`const version = "${version}"`)));

                });

        });

        it('should forcibly deploy the chain-code and return the result', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .then(function (result) {

                    // Check that the chaincode was copied with an additional file.
                    sinon.assert.called(fs.outputFile);
                    sinon.assert.calledWith(fs.outputFile, '/tmp/concerto/src/concerto/unique_id.go', sinon.match(/const uniqueID = "cf43e0df-36fa-4223-802e-de68d679b959"/));

                });

        });

        it('should handle an error from deploying the chain-code', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('error',
                    new Error('failed to deploy chain-code with some reason')
                ));
                return transactionContext;
            });

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'dogecode', 'dogeFunction', ['wow', 'such', 'args'])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to deploy chain-code/);
                });

        });

        it('should handle an hfc transaction error from deploying the chain-code', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('error',
                    new hfc.EventTransactionError('failed to deploy chain-code')
                ));
                return transactionContext;
            });

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'dogecode', 'dogeFunction', ['wow', 'such', 'args'])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to deploy chain-code/);
                });

        });

        it('should handle an error from forcibly deploying the chain-code due to throw', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');
            fs.outputFile.onSecondCall().throws(new Error('failed to create unique chaincode ID file'));

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .then(function (result) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to create unique chaincode ID file/);
                });

        });

        it('should handle an error from deploying the chain-code due to error writing version', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');
            fs.outputFile.onFirstCall().callsArgWith(2, new Error('failed to create version file'));

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .then(function (result) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to create version file/);
                });

        });

        it('should handle an error from deploying the chain-code due to throw writing version', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');
            fs.outputFile.onFirstCall().throws(new Error('failed to create version file'));

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .then(function (result) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to create version file/);
                });

        });

        it('should handle an error from forcibly deploying the chain-code due to error', function () {

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');
            fs.outputFile.onSecondCall().callsArgWith(2, new Error('failed to create unique chaincode ID file'));

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .then(function (result) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to create unique chaincode ID file/);
                });

        });

        it('should write the certificate to the chain-code folder if specified', function () {

            // Set the "certificate".
            connectOptions.certificate = '==== such certificate, much security ====';

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .then(function (result) {

                    // Check that the chaincode was copied with an additional file.
                    sinon.assert.called(fs.outputFile);
                    sinon.assert.calledWith(fs.outputFile, '/tmp/concerto/src/concerto/certificate.pem', connectOptions.certificate);

                });

        });

        it('should handle a throw writing the certificate to the chain-code folder if specified', function () {

            // Set the "certificate".
            connectOptions.certificate = '==== such certificate, much security ====';
            fs.outputFile.withArgs('/tmp/concerto/src/concerto/certificate.pem', connectOptions.certificate).throws(new Error('failed to create certificate file'));

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .should.be.rejectedWith(/failed to create certificate file/);

        });

        it('should handle an error writing the certificate to the chain-code folder if specified', function () {

            // Set the "certificate".
            connectOptions.certificate = '==== such certificate, much security ====';
            fs.outputFile.withArgs('/tmp/concerto/src/concerto/certificate.pem', connectOptions.certificate).callsArgWith(2, new Error('failed to create certificate file'));

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .should.be.rejectedWith(/failed to create certificate file/);

        });

        it('should set the certificatePath property in the deploy request if specified', function () {

            // Set the "certificate".
            connectOptions.certificatePath = '/certs/peer/cert.pem';

            // Set up the responses from the chain-code.
            enrolledMember.deploy.restore();
            sandbox.stub(enrolledMember, 'deploy', () => {
                let transactionContext = new EventEmitter();
                process.nextTick(() => transactionContext.emit('submitted'));
                process.nextTick(() => transactionContext.emit('complete', {chaincodeID: 'muchchaincodeID'}));
                return transactionContext;
            });

            // Fake the UUID we'll get.
            sandbox.stub(uuid, 'v4').returns('cf43e0df-36fa-4223-802e-de68d679b959');

            // Invoke the getAllAssetRegistries function.
            return HFCUtil.deployChainCode(securityContext, 'concerto', 'init', [], true)
                .then(function (result) {

                    // Check that the chaincode was copied with an additional file.
                    sinon.assert.called(enrolledMember.deploy);
                    sinon.assert.calledWith(enrolledMember.deploy, sinon.match((deployRequest) => {
                        deployRequest.certificatePath.should.equal('/certs/peer/cert.pem');
                        return true;
                    }));

                });

        });

    });

    describe('#createIdentity', () => {

        let memberServices;

        beforeEach(() => {
            memberServices = {
                register: sinon.stub()
            };
            chain.getMemberServices.returns(memberServices);
        });

        it('shoud throw if enrollment ID not specified', () => {
            (() => {
                HFCUtil.createIdentity(securityContext, null);
            }).should.throw(/userID not specified/);
        });

        it('should register a new user and return the user secret', () => {
            let registerRequest = {
                enrollmentID: 'doge',
                affiliation: 'institution_a',
                attributes: [{
                    name: 'userID',
                    value: 'doge'
                }]
            };
            memberServices.register.withArgs(registerRequest, sinon.match.any).yields(null, 'suchpassword');
            return HFCUtil.createIdentity(securityContext, 'doge')
                .then((identity) => {
                    sinon.assert.calledOnce(memberServices.register);
                    sinon.assert.calledWith(memberServices.register, registerRequest);
                    identity.should.deep.equal({
                        userID: 'doge',
                        userSecret: 'suchpassword'
                    });
                });
        });

        it('should register a new user who can issue new identities and return the enrollment secret', () => {
            let registerRequest = {
                enrollmentID: 'doge',
                affiliation: 'institution_a',
                attributes: [{
                    name: 'userID',
                    value: 'doge'
                }],
                registrar: {
                    roles: ['client'],
                    delegateRoles: ['client']
                }
            };
            memberServices.register.withArgs(registerRequest, sinon.match.any).yields(null, 'suchpassword');
            return HFCUtil.createIdentity(securityContext, 'doge', { issuer: true })
                .then((identity) => {
                    sinon.assert.calledOnce(memberServices.register);
                    sinon.assert.calledWith(memberServices.register, registerRequest);
                    identity.should.deep.equal({
                        userID: 'doge',
                        userSecret: 'suchpassword'
                    });
                });
        });

        it('should register a new user with a non default affiliation and return the enrollment secret', () => {
            let registerRequest = {
                enrollmentID: 'doge',
                affiliation: 'dogecorp',
                attributes: [{
                    name: 'userID',
                    value: 'doge'
                }]
            };
            memberServices.register.withArgs(registerRequest, sinon.match.any).yields(null, 'suchpassword');
            return HFCUtil.createIdentity(securityContext, 'doge', { affiliation: 'dogecorp' })
                .then((identity) => {
                    sinon.assert.calledOnce(memberServices.register);
                    sinon.assert.calledWith(memberServices.register, registerRequest);
                    identity.should.deep.equal({
                        userID: 'doge',
                        userSecret: 'suchpassword'
                    });
                });
        });

        it('should handle an error from registering a new user', () => {
            memberServices.register.yields(new Error('such error'));
            return HFCUtil.createIdentity(securityContext, 'doge')
                .should.be.rejectedWith(/such error/);
        });

    });

});
