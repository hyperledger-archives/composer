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

const Query = require('../lib/query');

require('chai').should();

describe('Query', () => {

    let query;

    beforeEach(() => {
        query = new Query('5769993d7c0a008e0cb45e30a36e3f2797c47c065be7f214c5dcee90419d326f');
    });

    describe('#getIdentifier', () => {

        it('should return the identifier', () => {
            query.getIdentifier().should.equal('5769993d7c0a008e0cb45e30a36e3f2797c47c065be7f214c5dcee90419d326f');
        });

    });

});
