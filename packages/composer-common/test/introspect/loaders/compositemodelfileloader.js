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

const CompositeModelFileLoader = require('../../../lib/introspect/loaders/compositemodelfileloader');
const HTTPModelFileLoader = require('../../../lib/introspect/loaders/httpmodelfileloader');

require('chai').should();
const sinon = require('sinon');

describe('CompositeModelFileLoader', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should have no loaders', () => {
            const cmfl = new CompositeModelFileLoader();
            cmfl.getModelFileLoaders().length.should.equal(0);
        });

    });

    describe('#addModelFileLoader', () => {

        it('should be able to add/get a model file loader', () => {
            const cmfl = new CompositeModelFileLoader();
            const ml = sinon.createStubInstance(HTTPModelFileLoader);
            cmfl.addModelFileLoader(ml);
            cmfl.getModelFileLoaders().length.should.equal(1);
        });

    });

    describe('#clearModelFileLoader', () => {

        it('should be able to add/get a model file loader', () => {
            const cmfl = new CompositeModelFileLoader();
            const ml = sinon.createStubInstance(HTTPModelFileLoader);
            cmfl.addModelFileLoader(ml);
            cmfl.getModelFileLoaders().length.should.equal(1);
            cmfl.clearModelFileLoaders();
            cmfl.getModelFileLoaders().length.should.equal(0);
        });

    });

    describe('#accepts', () => {

        it('should delegate accepts call to model file loader', () => {
            const cmfl = new CompositeModelFileLoader();
            const ml = sinon.createStubInstance(HTTPModelFileLoader);
            ml.accepts.withArgs('yes').returns(true);
            ml.accepts.withArgs('no').returns(false);
            cmfl.addModelFileLoader(ml);
            cmfl.accepts('yes').should.equal(true);
            cmfl.accepts('no').should.equal(false);
        });

    });

    describe('#load', () => {

        it('should delegate load call to model file loader', () => {
            const cmfl = new CompositeModelFileLoader();
            const ml = sinon.createStubInstance(HTTPModelFileLoader);
            ml.load.returns('result');
            ml.accepts.withArgs('yes').returns(true);
            ml.accepts.withArgs('no').returns(false);
            cmfl.addModelFileLoader(ml);
            cmfl.load('yes').should.equal('result');
            cmfl.load('yes', {foo: 1}).should.equal('result');

            (() => {
                cmfl.load({url: 'no'});
            }).should.throw(/Failed to find a model file loader/);
        });
    });
});
