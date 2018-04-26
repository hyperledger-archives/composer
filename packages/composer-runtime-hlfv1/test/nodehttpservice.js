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

const NodeHTTPService = require('../lib/nodehttpservice');
const HTTPService = require('composer-runtime').HTTPService;


const request = require('request');
const chai = require('chai');
const sinon = require('sinon');

chai.use(require('chai-as-promised'));
chai.should();
const expect = chai.expect;

describe('NodeHTTPService', () => {

    let httpService;
    let sandbox;

    beforeEach(() => {
        httpService = new NodeHTTPService();
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should create an instance', () => {
            httpService.should.be.an.instanceOf(HTTPService);
        });
    });

    describe('#post', () => {
        it('should return JS Object', () => {
            sandbox.stub(request, 'post').yields(null, {statusCode : 200}, {sum: 3});
            const data = {foo : 'bar'};
            return expect(httpService.post('url', data)).to.eventually.have.property('body');
        });

        it('should include error if present in JS Object', () => {
            sandbox.stub(request, 'post').yields('error', {statusCode : 200}, {sum: 3});
            const data = {foo : 'bar'};
            return expect(httpService.post('url', data)).to.eventually.deep.equal({statusCode : 200, body : 'error'});
        });

        it('should reject if there is no response', () => {
            sandbox.stub(request, 'post').yields(null, null, {sum: 3});
            const data = {foo : 'bar'};
            return expect(httpService.post('url', data)).to.eventually.be.rejected;
        });

        it('should reject if there is no response and return error', () => {
            sandbox.stub(request, 'post').yields('error', null, {sum: 3});
            const data = {foo : 'bar'};
            return expect(httpService.post('url', data)).to.eventually.be.rejected;
        });
    });
});
