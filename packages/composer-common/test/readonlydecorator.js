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

describe('RaedOnlyDecorator', () => {

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

        it('should throw if no arguments are specified', () => {
            (() => {
                new ReadOnlyDecorator(transactionDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'readonly', arguments: { list: [] } });
            }).should.throw(/@readonly decorator expects 1 argument, but 0 arguments were specified. Line 1 column 1, to line 1 column 23./);
        });

        it('should throw if two arguments are specified', () => {
            (() => {
                new ReadOnlyDecorator(transactionDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'readonly', arguments: { list: [ { value: true }, { value: false } ] } });
            }).should.throw(/@readonly decorator expects 1 argument, but 2 arguments were specified. Line 1 column 1, to line 1 column 23./);
        });

        it('should throw if a an incorrectly typed argument is specified', () => {
            (() => {
                new ReadOnlyDecorator(transactionDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'readonly', arguments: { list: [ { value: 'hello world' } ] } });
            }).should.throw(/@readonly decorator expects a boolean argument, but an argument of type string was specified. Line 1 column 1, to line 1 column 23./);
        });

    });

    describe('#getValue', () => {

        it('should return true if the argument is true', () => {
            const decorator = new ReadOnlyDecorator(transactionDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'readonly', arguments: { list: [ { value: true } ] } });
            decorator.getValue().should.be.true;
        });

        it('should return false if the argument is false', () => {
            const decorator = new ReadOnlyDecorator(transactionDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'readonly', arguments: { list: [ { value: false } ] } });
            decorator.getValue().should.be.false;
        });

    });

});
