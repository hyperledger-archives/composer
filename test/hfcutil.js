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

const Connection = require('@ibm/ibm-concerto-common').Connection;
const HFCSecurityContext = require('../lib/hfcsecuritycontext');
const HFCUtil = require('../lib/hfcutil');
const EventEmitter = require('events');
const fs = require('fs-extra');
const hfc = require('hfc');
const path = require('path');
const SecurityException = require('@ibm/ibm-concerto-common').SecurityException;
const temp = require('temp').track();
const uuid = require('node-uuid');
const version = require('../package.json').version;

require('chai').should();
const sinon = require('sinon');

const runtimeModulePath = path.dirname(require.resolve('@ibm/ibm-concerto-runtime-hlf'));

describe('HFCUtil', function () {

    let mockConnection;
    let securityContext;
    let enrolledMember;
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        mockConnection = sinon.createStubInstance(Connection);
        securityContext = new HFCSecurityContext(mockConnection);
        enrolledMember = sinon.createStubInstance(hfc.Member);
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

    });

});
