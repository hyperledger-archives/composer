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

const WebHTTPService = require('..').WebHTTPService;

const chai = require('chai');
const sinon = require('sinon');

require('chai-as-promised');
chai.should();
//const expect = chai.expect;
const xhr = require('xhr');

/**
 * Returns fake responses to URLs
 * @param {XMLHttpRequest} xhr - the request
 */
function spoofResponse (xhr) {
    // Allow `onCreate` to complete so `xhr` can finish instantiating.
    setTimeout(function() {

        if(xhr.url === 'good') {
            xhr.respond( 200, null, JSON.stringify({sum : 3}) );
        }
        else if(xhr.url === 'error') {
            xhr.respond( 500, null, 'error' );
        }
        else {
            xhr.error();
        }
    }, 10);
}

describe('WebHTTPService', () => {

    let httpService;
    let sandbox;
    let mockXhr;

    beforeEach(() => {
        httpService = new WebHTTPService();
        sandbox = sinon.sandbox.create();

        mockXhr = sinon.useFakeXMLHttpRequest();
        xhr.XMLHttpRequest = mockXhr;

        mockXhr.onCreate = function (xhr) {
            spoofResponse(xhr);
        };
    });

    afterEach(() => {
        sandbox.restore();
        mockXhr.restore();
    });

    describe('#constructor', () => {
        it('should create an instance', () => {
            httpService = new WebHTTPService();
        });
    });

    describe('#post', () => {
        it('should return JS Object', () => {
            const data = {foo : 'bar'};
            return httpService.post('good', data)
                .then( (response) => {
                    response.statusCode.should.equal(200);
                    response.body.sum.should.equal(3);
                });
        });

        it('should include error if present in JS Object', () => {
            const data = {foo : 'bar'};
            return httpService.post('error', data)
                .catch( (error) => {
                    error.should.equal('{\"statusCode\":500,\"body\":\"error\"}');
                });
        });

        it('should include error if present in JS Object', () => {
            const data = {foo : 'bar'};
            return httpService.post('bad', data)
                .catch( (error) => {
                    error.should.equal('{"statusCode":0,"body":{"statusCode":0}}');
                });
        });
    });
});