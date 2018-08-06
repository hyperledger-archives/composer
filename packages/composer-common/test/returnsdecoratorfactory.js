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

const ModelManager = require('../lib/modelmanager');
const ReturnsDecorator = require('../lib/returnsdecorator');
const ReturnsDecoratorFactory = require('../lib/returnsdecoratorfactory');

const should = require('chai').should();

describe('ReturnsDecoratorFactory', () => {

    let modelManager;
    let conceptDeclaration;
    let factory;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        concept C { }
        `);
        conceptDeclaration = modelManager.getType('org.acme.C');
        factory = new ReturnsDecoratorFactory();
    });

    describe('#process', () => {

        it('should return null for a @foobar decorator', () => {
            should.equal(factory.newDecorator(conceptDeclaration, { name: 'foobar' }), null);
        });

        it('should return a returns decorator instance for a @returns decorator', () => {
            const decorator = factory.newDecorator(conceptDeclaration, { name: 'returns', arguments: { list: [ { value: { type: 'Identifier', name: 'C' } } ] } });
            decorator.should.be.an.instanceOf(ReturnsDecorator);
        });

    });

});
