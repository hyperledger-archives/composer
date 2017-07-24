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
const HTTPService = require('../lib/httpservice');

require('chai-as-promised');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

const expect = chai.expect;

describe('HTTPService', () => {

    let httpService;

    beforeEach(() => {
        httpService = new HTTPService();
    });

    describe('#post', () => {
        it('should call the _post method', () => {
            const data = {foo : 'bar'};
            httpService._post = function() {return(Promise.resolve({statusCode : 200, body : data}));};
            httpService.post( 'url', data);
            return expect(httpService.post('url', data)).to.eventually.have.property('statusCode');
        });

        it('should call the _post method and convert result to JS Object', () => {
            const data = {foo : 'bar'};
            httpService._post = function() {return(Promise.resolve(JSON.stringify({statusCode : 200, body : data})));};
            httpService.post( 'url', data);
            return expect(httpService.post('url', data)).to.eventually.have.property('statusCode');
        });

        it('should call the _post method and convert body to JS Object', () => {
            const data = {foo : 'bar'};
            httpService._post = function() {return(Promise.resolve({statusCode : 200, body : JSON.stringify(data)}));};
            httpService.post( 'url', data);
            return expect(httpService.post('url', data)).to.eventually.have.property('statusCode');
        });

        it('should call the _post method and return string for non JSON data', () => {
            const data = {foo : 'bar'};
            httpService._post = function() {return(Promise.resolve({statusCode : 200, body : 'string'}));};
            httpService.post( 'url', data);
            return expect(httpService.post('url', data)).to.eventually.deep.equal( {statusCode : 200, body: 'string'});
        });

        it('should reject the promise on bad statusCode', () => {
            const data = {foo : 'bar'};
            httpService._post = function() {return(Promise.resolve({statusCode : 300, body : data}));};
            httpService.post( 'url', data);
            return expect(httpService.post('url', data)).to.eventually.be.rejected;
        });
    });

    describe('#_post', () => {

        it('should throw as abstract method', () => {
            (() => {
                httpService._post();
            }).should.throw(/abstract function called/);
        });

    });

});
