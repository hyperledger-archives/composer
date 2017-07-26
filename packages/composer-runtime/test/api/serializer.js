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

const Serializer = require('../../lib/api/serializer');
const realSerializer = require('composer-common').Serializer;
const Resource = require('composer-common').Resource;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('Serializer', () => {

    let mockSerializer;
    let serializer;
    let mockResource;

    beforeEach(() => {
        mockSerializer = sinon.createStubInstance(realSerializer);
        serializer = new Serializer(mockSerializer);
        mockResource = sinon.createStubInstance(Resource);
    });

    describe('#constructor', () => {

        it('should obscure any implementation details', () => {
            Object.isFrozen(serializer).should.be.true;
            Object.getOwnPropertyNames(serializer).forEach((prop) => {
                serializer[prop].should.be.a('function');
            });
            Object.getOwnPropertySymbols(serializer).should.have.lengthOf(0);
        });

    });

    describe('#toJSON', () => {

        it('should proxy to the serializer', () => {
            mockSerializer.toJSON.withArgs(mockResource, { option1: true }).returns({ thing1: 'value 1' });
            serializer.toJSON(mockResource, { option1: true }).should.deep.equal({ thing1: 'value 1' });
        });

    });

    describe('#fromJSON', () => {

        it('should proxy to the serializer', () => {
            mockSerializer.fromJSON.withArgs({ thing1: 'value 1' }, { option1: true }).returns(mockResource);
            serializer.fromJSON({ thing1: 'value 1' }, { option1: true }).should.equal(mockResource);
        });

    });

});
