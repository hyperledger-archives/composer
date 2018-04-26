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

const DefaultModelFileLoader = require('../../../lib/introspect/loaders/defaultmodelfileloader');

require('chai').should();
const sinon = require('sinon');

describe('DefaultModelFileLoader', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should have two loaders (HTTP and GitHub)', () => {
            const dmfl = new DefaultModelFileLoader();
            dmfl.getModelFileLoaders().length.should.equal(2);
        });

    });
});
