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
const WebContainer = require('..').WebContainer;
const uuid = require('uuid');
const version = require('../package.json').version;

require('chai').should();
const sinon = require('sinon');

describe('WebContainer', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should construct a new container with a new UUID', () => {
            sandbox.stub(uuid, 'v4').returns('eaaf183b-7d22-4601-be96-833e2b342c7a');
            let container = new WebContainer();
            container.should.be.an.instanceOf(Container);
            container.uuid.should.equal('eaaf183b-7d22-4601-be96-833e2b342c7a');
        });

        it('should construct a new container with the specified UUID', () => {
            let container = new WebContainer('761df21b-f620-434c-ad44-15d66c4d8575');
            container.should.be.an.instanceOf(Container);
            container.uuid.should.equal('761df21b-f620-434c-ad44-15d66c4d8575');
        });

    });

    describe('#getVersion', () => {

        it('should return the container version', () => {
            let container = new WebContainer();
            container.getVersion().should.equal(version);
        });

    });

    describe('#getLoggingService', () => {

        it('should return the container logging service', () => {
            let container = new WebContainer();
            container.getLoggingService().should.be.an.instanceOf(LoggingService);
        });

    });

    describe('#getUUID', () => {

        it('should return the container UUID', () => {
            sandbox.stub(uuid, 'v4').returns('eaaf183b-7d22-4601-be96-833e2b342c7a');
            let container = new WebContainer();
            container.getUUID().should.equal('eaaf183b-7d22-4601-be96-833e2b342c7a');
        });

    });

});
