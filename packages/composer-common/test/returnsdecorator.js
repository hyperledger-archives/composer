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

const ConceptDeclaration = require('../lib/introspect/conceptdeclaration');
const ModelFile = require('../lib/introspect/modelfile');
const ModelManager = require('../lib/modelmanager');
const ReturnsDecorator = require('../lib/returnsdecorator');
const ReturnsDecoratorFactory = require('../lib/returnsdecoratorfactory');

require('chai').should();

describe('ReturnsDecorator', () => {

    let modelManager;
    let conceptDeclaration;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addDecoratorFactory(new ReturnsDecoratorFactory());
        modelManager.addModelFile(`
        namespace org.acme
        concept C { }
        `);
        conceptDeclaration = modelManager.getType('org.acme.C');
    });

    describe('#process', () => {

        it('should throw if no arguments are specified', () => {
            (() => {
                new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [] } });
            }).should.throw(/@returns decorator expects 1 argument, but 0 arguments were specified. Line 1 column 1, to line 1 column 23./);
        });

        it('should throw if two arguments are specified', () => {
            (() => {
                new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [ { value: true }, { value: false } ] } });
            }).should.throw(/@returns decorator expects 1 argument, but 2 arguments were specified. Line 1 column 1, to line 1 column 23./);
        });

        it('should throw if a an incorrectly typed argument is specified', () => {
            (() => {
                new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [ { value: true } ] } });
            }).should.throw(/@returns decorator expects an identifier argument, but an argument of type boolean was specified. Line 1 column 1, to line 1 column 23./);
        });

    });

    describe('#validate', () => {

        it('should throw if a reference to a missing type is specified', () => {
            (() => {
                const decorator = new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [ { value: { type: 'Identifier', name: 'foo' } } ] } });
                decorator.validate();
            }).should.throw(/Undeclared type foo in @returns decorator. Line 1 column 1, to line 1 column 23./);
        });

        it('should work if a reference to a concept type is specified', () => {
            const decorator = new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [ { value: { type: 'Identifier', name: 'C' } } ] } });
            decorator.validate();
        });

        it('should work if a reference to a fully qualified concept type is specified', () => {
            const decorator = new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [ { value: { type: 'Identifier', name: 'org.acme.C' } } ] } });
            decorator.validate();
        });

        it('should work if a reference to a concept array type is specified', () => {
            const decorator = new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [ { value: { type: 'Identifier', name: 'C', array: true } } ] } });
            decorator.validate();
        });

        it('should work if a reference to a primitive type is specified', () => {
            const decorator = new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [ { value: { type: 'Identifier', name: 'String' } } ] } });
            decorator.validate();
        });

        it('should work if a reference to a primitive array type is specified', () => {
            const decorator = new ReturnsDecorator(conceptDeclaration, { location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }, name: 'returns', arguments: { list: [ { value: { type: 'Identifier', name: 'String', array: true } } ] } });
            decorator.validate();
        });

    });

    /**
     * Get the returns decorator for the transaction T in the specified model.
     * @param {string} model The specified model.
     * @returns {returnsDecorator} The returns declaration for the transaction T.
     */
    function getReturnsDecorator(model) {
        const modelFile = new ModelFile(modelManager, model);
        const transactionDeclaration = modelFile.getTransactionDeclaration('T');
        return transactionDeclaration.getDecorator('returns');
    }

    describe('#getType', () => {

        it('should return the type', () => {
            const model = `
            namespace org.acme
            @returns(C)
            transaction T {
                o String foo
            }`;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.getType().should.equal('C');
        });

    });

    describe('#getResolvedType', () => {

        it('should return null for a primitive type', () => {
            const model = `
            namespace org.acme
            @returns(String)
            transaction T {
                o String foo
            } `;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.validate();
            returnsDecorator.getResolvedType().should.equal('String');
        });

        it('should return the class declaration for a complex type', () => {
            const model = `
            namespace org.acme
            concept C {
                o String bar
            }
            @returns(C)
            transaction T {
                o String foo
            }`;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.validate();
            returnsDecorator.getResolvedType().should.be.an.instanceOf(ConceptDeclaration);
        });

    });

    describe('#isArray', () => {

        it('should return false for a non-array type', () => {
            const model = `
            namespace org.acme
            @returns(String)
            transaction T {
                o String foo
            }`;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.isArray().should.be.false;
        });

        it('should return true for an array type', () => {
            const model = `
            namespace org.acme
            @returns(String[])
            transaction T {
                o String foo
            }`;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.isArray().should.be.true;
        });

    });

    describe('#isPrimitive', () => {

        it('should return true for a primitive type', () => {
            const model = `
            namespace org.acme
            @returns(String)
            transaction T {
                o String foo
            }`;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.isPrimitive().should.be.true;
        });

        it('should return true for a complex type', () => {
            const model = `
            namespace org.acme
            @returns(C)
            transaction T {
                o String foo
            }`;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.isPrimitive().should.be.false;
        });

    });

    describe('#isTypeEnum', () => {

        it('should return true for an enum type', () => {
            const model = `
            namespace org.acme
            enum E {
                o VALUE_1
            }
            @returns(E)
            transaction T {
                o String foo
            }`;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.isTypeEnum().should.be.true;
        });

        it('should return false for a non-enum type', () => {
            const model = `
            namespace org.acme
            @returns(String)
            transaction T {
                o String foo
            }`;
            const returnsDecorator = getReturnsDecorator(model);
            returnsDecorator.isTypeEnum().should.be.false;
        });

    });

});
