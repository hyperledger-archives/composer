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

const Registry = require('../lib/registry');
const SecurityContext = require('@ibm/ibm-concerto-common').SecurityContext;
const Util = require('@ibm/ibm-concerto-common').Util;

require('chai').should();
const sinon = require('sinon');

describe('Registry', function () {

    let securityContext;
    let sandbox;

    before(function () {
        securityContext = new SecurityContext('suchuser', 'suchpassword');
    });

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#getAllAssetRegistries', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from('[]'));
            });
            return Registry
                .getAllRegistries(securityContext, 'Doge')
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when registryType not specified', function () {
            (function () {
                Registry.getAllRegistries(securityContext, null);
            }).should.throw(/registryType not specified/);
        });

        it('should invoke the chain-code and return the list of asset registries', function () {

            // Set up the responses from the chain-code.
            const registries = [
                {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'},
                {id: '6165d4c2-73ee-43a6-b5b5-bac512a4894e', name: 'wow such registry'}
            ];
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(registries))
                );
            });

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getAllRegistries(securityContext, 'Doge')
                .then(function (result) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'getAllRegistries', ['Doge']);

                    // Check that the asset registries were returned correctly.
                    result.should.deep.equal(registries);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getAllRegistries(securityContext, 'Doge')
                .then(function (assetRegistries) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#getAssetRegistry', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(new Error('fake error'));
            });
            return Registry
                .getRegistry(securityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d')
                .catch(function () {

                })
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when registryType not specified', function () {
            (function () {
                Registry.getRegistry(securityContext, null, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');
            }).should.throw(/registryType not specified/);
        });

        it('should throw when id not specified', function () {
            (function () {
                Registry.getRegistry(securityContext, 'Doge', null);
            }).should.throw(/id not specified/);
        });

        it('should invoke the chain-code and return the asset registry', function () {

            // Set up the responses from the chain-code.
            const registry = {
                id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'
            };
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(registry))
                );
            });

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getRegistry(securityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d')
                .then(function (result) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'getRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d']);

                    // Check that the asset registries were returned correctly.
                    result.should.deep.equal(registry);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getRegistry(securityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d')
                .then(function (assetRegistries) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#addRegistry', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return Registry
                .addRegistry(securityContext, 'Doge', 'such id', 'doge registry')
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when registryType not specified', function () {
            (function () {
                Registry.addRegistry(securityContext, null, 'such id', 'doge registry');
            }).should.throw(/registryType not specified/);
        });

        it('should throw when id not specified', function () {
            (function () {
                Registry.addRegistry(securityContext, 'Doge', null, 'doge registry');
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', function () {
            (function () {
                Registry.addRegistry(securityContext, 'Doge', 'such id', null);
            }).should.throw(/name not specified/);
        });

        it('should invoke the chain-code and return the asset registry', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the getAllAssetRegistries function.
            return Registry
                .addRegistry(securityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'doge registry')
                .then(function (registry) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'addRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'doge registry']);

                    // Check that the asset registry was returned successfully.
                    registry.should.deep.equal({
                        id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d',
                        name: 'doge registry'
                    });

                });

        });

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllAssetRegistries function.
            return Registry
                .addRegistry(securityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'doge registry')
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });


    describe('#constructor', function () {

        it('should throw when registryType not specified', function () {
            (function () {
                new Registry(null, 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            }).should.throw(/registryType not specified/);
        });

        it('should throw when id not specified', function () {
            (function () {
                new Registry('Doge', null, 'wowsuchregistry');
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', function () {
            (function () {
                new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', null);
            }).should.throw(/name not specified/);
        });

        it('should create a new registry', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            registry.registryType.should.equal('Doge');
            registry.id.should.equal('ad99fcfa-6d3c-4281-b47f-0ccda7998039');
            registry.name.should.equal('wowsuchregistry');
        });

    });

    describe('#add', function () {

        it('should throw when id not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            const json = '{"fake":"json for the test"}';
            (function () {
                registry.add(securityContext, null, json);
            }).should.throw(/id not specified/);
        });

        it('should throw when data not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            (function () {
                registry.add(securityContext, 'dogecar1', null);
            }).should.throw(/data not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            const json = '{"fake":"json for the test"}';
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .add(securityContext, 'dogecar1', json)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry
                .add(securityContext, 'dogecar1', json)
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'addResourceToRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1', json]);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .add(securityContext, 'dogecar1', json)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

        it('should allow the function name to be overridden', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry
                .add(securityContext, 'dogecar1', json, 'addModelToRegistry')
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'addModelToRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1', json]);

                });

        });

    });

    describe('#addAll', function () {

        it('should throw when resources not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            (function () {
                registry.addAll(securityContext, null);
            }).should.throw(/resources not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .addAll(securityContext, [{id: '1', data: '{}'}, {id: '2', data: '{}'}])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '[{"id":"1","data":"{}"},{"id":"2","data":"{}"}]';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry
                .addAll(securityContext, [{id: '1', data: '{}'}, {id: '2', data: '{}'}])
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'addAllResourcesToRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', json]);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .addAll(securityContext, [{id: '1', data: '{}'}, {id: '2', data: '{}'}])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

        it('should allow the function name to be overridden', function () {

            // Create the asset registry and other test data.
            const json = '[{"id":"1","data":"{}"},{"id":"2","data":"{}"}]';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry
                .addAll(securityContext, [{id: '1', data: '{}'}, {id: '2', data: '{}'}], 'addAllModelsToRegistry')
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'addAllModelsToRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', json]);

                });

        });

    });

    describe('#update', function () {

        it('should throw when id not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            const json = '{"fake":"json for the test"}';
            (function () {
                registry.update(securityContext, null, json);
            }).should.throw(/id not specified/);
        });

        it('should throw when data not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            (function () {
                registry.update(securityContext, 'dogecar1', null);
            }).should.throw(/data not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            const json = '{"fake":"json for the test"}';
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .update(securityContext, 'dogecar1', json)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry
                .update(securityContext, 'dogecar1', json)
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'updateResourceInRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1', json]);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the update function.
            return registry
                .update(securityContext, 'dogecar1', json)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

        it('should allow the function name to be overridden', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry
                .update(securityContext, 'dogecar1', json, 'updateModelInRegistry')
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'updateModelInRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1', json]);

                });

        });

    });

    describe('#updateAll', function () {

        it('should throw when resources not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            (function () {
                registry.updateAll(securityContext, null);
            }).should.throw(/resources not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .updateAll(securityContext, [{id: '1', data: '{}'}, {id: '2', data: '{}'}])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '[{"id":"1","data":"{}"},{"id":"2","data":"{}"}]';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry
                .updateAll(securityContext, [{id: '1', data: '{}'}, {id: '2', data: '{}'}])
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'updateAllResourcesInRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', json]);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .updateAll(securityContext, [{id: '1', data: '{}'}, {id: '2', data: '{}'}])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

        it('should allow the function name to be overridden', function () {

            // Create the asset registry and other test data.
            const json = '[{"id":"1","data":"{}"},{"id":"2","data":"{}"}]';
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry
                .updateAll(securityContext, [{id: '1', data: '{}'}, {id: '2', data: '{}'}], 'updateAllModelsInRegistry')
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'updateAllModelsInRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', json]);

                });

        });

    });

    describe('#remove', function () {

        it('should throw when id not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            (function () {
                registry.remove(securityContext, null);
            }).should.throw(/id not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .remove(securityContext, 'someid')
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry
                .remove(securityContext, 'dogecar1')
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'removeResourceFromRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1']);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the update function.
            return registry
                .remove(securityContext, 'id')
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

        it('should allow the function name to be overridden', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry
                .remove(securityContext, 'dogecar1', 'removeModelFromRegistry')
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'removeModelFromRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1']);

                });

        });

    });

    describe('#removeAll', function () {

        it('should throw when ids not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            (function () {
                registry.removeAll(securityContext, null);
            }).should.throw(/ids not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .removeAll(securityContext, ['someid', 'someid2'])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry
                .removeAll(securityContext, ['dogecar1', 'dogecar2'])
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'removeAllResourcesFromRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', '["dogecar1","dogecar2"]']);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the update function.
            return registry
                .removeAll(securityContext, ['dogecar1', 'dogecar2'])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

        it('should allow the function name to be overridden', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry
                .removeAll(securityContext, ['dogecar1', 'dogecar2'], 'removeAllModelsFromRegistry')
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'removeAllModelsFromRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', '["dogecar1","dogecar2"]']);

                });

        });

    });

    describe('#getAll', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from(JSON.stringify([])));
            });
            return registry
                .getAll(securityContext)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should query the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            let resources = [
                {'fake':'json for the test'},
                {'fake2':'json for the test'}
            ];
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(resources))
                );
            });

            // Invoke the add function.
            return registry
                .getAll(securityContext)
                .then(function (result) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'getAllResourcesInRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d']);

                    // Check that the assets were returned successfully.
                    result.should.deep.equal(resources);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .getAll(securityContext)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

    describe('#get', function () {

        it('should throw when id not specified', function () {
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            (function () {
                registry.get(securityContext, null);
            }).should.throw(/id not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry');
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from(JSON.stringify({})));
            });
            return registry
                .get(securityContext, 'dogecar1')
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should query the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            let resource = {'fake':'json for the test'};
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(resource))
                );
            });

            // Invoke the add function.
            return registry
                .get(securityContext, 'dogecar1')
                .then(function (result) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'getResourceInRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1']);
                    result.should.deep.equal(resource);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new Registry('Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .get(securityContext, 'dogecar1')
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

});
