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

require('chai').should();

describe('ReadOnlyDecorator', () => {

    let modelManager;
    let transactionDeclaration;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addDecoratorFactory(new ReadOnlyDecoratorDecoratorFactory());
        modelManager.addModelFile(`
        namespace org.acme
        transaction T { }
        `);
        transactionDeclaration = modelManager.getType('org.acme.T');
    });

    describe('#process', () => {

        it('should throw if arguments are specified', () => {
            (() => {
                new ReadOnlyDecorator(transactionDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'readonly', arguments: { list: [ { value: true }, { value: false } ] } });
            }).should.throw(/@readonly decorator expects 0 arguments, but 2 arguments were specified. Line 1 column 1, to line 1 column 23./);
        });
    });


});
