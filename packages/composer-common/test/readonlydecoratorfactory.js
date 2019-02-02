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

const ReadOnlyDecorator = require('../lib/readonlydecorator');
const ReadOnlyDecoratorDecoratorFactory = require('../lib/readonlydecoratorfactory');
const ModelManager = require('../lib/modelmanager');

const should = require('chai').should();

describe('ReadOnlyDecoratorDecoratorFactory', () => {

    let modelManager;
    let transactionDeclaration;
    let factory;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        transaction T { }
        `);
        transactionDeclaration = modelManager.getType('org.acme.T');
        factory = new ReadOnlyDecoratorDecoratorFactory();
    });

    describe('#process', () => {

        it('should return null for a @foobar decorator', () => {
            should.equal(factory.newDecorator(transactionDeclaration, { name: 'foobar' }), null);
        });

        it('should return a readonly decorator instance for a @readonly decorator', () => {
            const decorator = factory.newDecorator(transactionDeclaration, { name: 'readonly' });
            decorator.should.be.an.instanceOf(ReadOnlyDecorator);
        });

    });

});
