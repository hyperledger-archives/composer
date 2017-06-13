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

const EmbeddedQueryService = require('..').EmbeddedQueryService;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EmbeddedQueryService', () => {

    let queryService;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        queryService = new EmbeddedQueryService();
    });

    afterEach(() => {
        sandbox.restore();
    });


    describe('#queryNative', () => {
        it ('should return the query string', () => {
            return queryService.queryNative('dummyString')
                .then((result) => {
                    result.should.deep.equal({data: 'not implemented'});
                });
        });
    });
});
