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
const QueryService = require('../lib/queryservice');

require('chai-as-promised');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('QueryService', () => {

    let queryService;

    beforeEach(() => {
        queryService = new QueryService();
    });

    describe('#queryNative', () => {
        it('should call the _queryNative method', () => {
            const queryString = '{\'selector\':{\'type\':\'Asset\'}}';
            queryService._queryNative = sinon.stub();
            queryService.queryNative(queryString);
            sinon.assert.calledWith(queryService._queryNative);
        });
    });

    describe('#_queryNative', () => {

        it('should throw as abstract method', () => {
            (() => {
                queryService._queryNative();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            queryService.toJSON().should.deep.equal({});
        });

    });

});
