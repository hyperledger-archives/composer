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

const Query = require('../../lib/api/query');

require('chai').should();

describe('Query', () => {

    let query;

    beforeEach(() => {
        query = new Query('3194a9b0e7e3a9c808161fc86961c9ade07480be103267112a1fa684c9fee1b9');
    });

    describe('#constructor', () => {

        it('should obscure any implementation details', () => {
            Object.isFrozen(query).should.be.true;
            Object.getOwnPropertyNames(query).forEach((prop) => {
                query[prop].should.be.a('function');
            });
            Object.getOwnPropertySymbols(query).should.have.lengthOf(0);
        });

    });

    describe('#getIdentifier', () => {

        it('should return the identifier', () => {
            query.getIdentifier().should.equal('3194a9b0e7e3a9c808161fc86961c9ade07480be103267112a1fa684c9fee1b9');
        });

    });

});
