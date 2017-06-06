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

const Container = require('composer-runtime').Container;
const LoggingService = require('composer-runtime').LoggingService;
const EmbeddedContainer = require('..').EmbeddedContainer;
const uuid = require('uuid');
const version = require('../package.json').version;

require('chai').should();
const sinon = require('sinon');

describe('EmbeddedContainer', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should construct a new container', () => {
            let container = new EmbeddedContainer();
            container.should.be.an.instanceOf(Container);
        });

    });

    describe('#getVersion', () => {

        it('should return the container version', () => {
            let container = new EmbeddedContainer();
            container.getVersion().should.equal(version);
        });

    });

    describe('#getLoggingService', () => {

        it('should return the container logging service', () => {
            let container = new EmbeddedContainer();
            container.getLoggingService().should.be.an.instanceOf(LoggingService);
        });

    });

    describe('#getUUID', () => {

        it('should return the container UUID', () => {
            sandbox.stub(uuid, 'v4').returns('eaaf183b-7d22-4601-be96-833e2b342c7a');
            let container = new EmbeddedContainer();
            container.getUUID().should.equal('eaaf183b-7d22-4601-be96-833e2b342c7a');
        });

    });

});
