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

const JavascriptParser = require('./../../lib/codegen/javascriptparser');
const fs = require('fs');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

const readTestExample = function(exampleName) {
    const exampleFile = path.resolve(__dirname, '../data/commentparsing/', exampleName);
    return fs.readFileSync(exampleFile).toString();
};

describe('JavascriptParser', () => {

    describe('#constructor', () => {
        it('should use a default ECMAScript version of 7', () => {
            const contents = `
                let num = 3 ** 2;
                num **= 2;
                [ 81 ].includes(num);
            `;

            const parser = new JavascriptParser(contents);
            parser.should.exist;
        });

        it('should accept a non-default ECMAScript version of 5', () => {
            const contents = `
                class cls { }
            `;

            (() => {
                new JavascriptParser(contents, false, 5);
            }).should.throw(/The keyword .*class.* is reserved/);
        });
    });

    describe('#getClasses', () => {
        it('should return the classes', () => {
            const contents = `
                class cls {

                }
            `;

            const parser = new JavascriptParser(contents);
            parser.getClasses().should.deep.equal([{ name: 'cls', methods: [] }]);
        });
    });

    describe('#getFunctions', () => {
        it('should return the functions', () => {
            const contents = `
                /**
                 * Get the Animals, but do not resolve contained relationships
                 * @query
                 * @param {String} farmerId - the email of the farmer
                 * @returns {Animal[]} - the animals that belong to the farmer
                */
                function findAnimalsByOwnerId(farmerId) {
                    return query('select a from Animal a where a.owner == :farmerId');
                }
            `;

            const parser = new JavascriptParser(contents);
            parser.getFunctions().should.deep.equal([{
                'decorators': [
                    'query',
                    'param',
                    'returns',
                ],
                'example': '',
                'functionText': 'function findAnimalsByOwnerId(farmerId) {\n                    return query(\'select a from Animal a where a.owner == :farmerId\');\n                }',
                'name': 'findAnimalsByOwnerId',
                'parameterNames': [
                    'farmerId'
                ],
                'parameterTypes': [
                    'String'
                ],
                'returnType': 'Animal[]',
                'throws': '',
                'visibility': '+',
            }]);
        });
    });

    describe('#getTokens', () => {
        it('should return all of the tokens', () => {
            const contents = 'eval(true)';
            const parser = new JavascriptParser(contents);
            const tokens = parser.getTokens();
            tokens.should.have.lengthOf(5);
            tokens.should.all.have.property('loc');
        });
    });

    describe('#getText', () => {
        it('should use the substring method correctly', () => {
            JavascriptParser.getText(0, 6, 'strings are cool').should.equal('string');
        });
    });

    describe('#findCommentBefore', () => {
        it('should handle the basic of examples', () => {
            const code = readTestExample('BasicExample.js.txt');
            const parser = new JavascriptParser(code);
            parser.getFunctions().length.should.equal(1);
            const func = parser.getFunctions()[0];
            func.decorators.should.deep.equal(['param', 'transaction']);
            func.parameterTypes.length.should.equal(1);
            func.parameterTypes[0].should.equal('org.acme.mynetwork.Trade');
            func.name.should.equal('tradeCommodity');
        });

        it('should handle the uncommented function following commented function', () => {
            const code = readTestExample('UncommentedFollowingCommented.js.txt');
            const parser = new JavascriptParser(code);
            parser.getFunctions().length.should.equal(2);
            const func = parser.getFunctions()[0];
            func.decorators.should.deep.equal(['param', 'transaction']);
            func.name.should.equal('tradeCommodity');
            func.parameterTypes.length.should.equal(1);
            func.parameterTypes[0].should.equal('org.acme.mynetwork.Trade');
            const func2 = parser.getFunctions()[1];
            func2.decorators.length.should.equal(0);
            func2.parameterTypes.length.should.equal(0);
        });

        it('should handle the class methods', () => {
            const code = readTestExample('ClassExample.js.txt');
            const parser = new JavascriptParser(code, false, 7);
            const clazz = parser.getClasses();
            clazz.length.should.equal(1);
            const methods = clazz[0].methods;
            methods.length.should.equal(3);
            methods[0].decorators.length.should.equal(0);
            methods[1].decorators.should.deep.equal(['param', 'transaction']);
            methods[2].decorators.length.should.equal(0);
        });

        it('should handle the a complex example', () => {
            const code = readTestExample('ComplexExample.js.txt');
            const parser = new JavascriptParser(code);
            const funcs = parser.getFunctions();
            funcs.length.should.equal(12);
            const noDecorators = [0, 1, 2, 3, 5, 6, 9, 10];
            const allDecorators = [7, 8, 11];
            noDecorators.forEach((value) => {
                funcs[value].decorators.length.should.equal(0);
            });
            allDecorators.forEach((value) => {
                funcs[value].decorators.length.should.equal(2);
                funcs[value].decorators.should.deep.equal(['param', 'transaction']);
            });
            funcs[4].decorators.length.should.equal(1);
            funcs[4].decorators[0].should.equal('transaction');
        });
    });

    describe('#getDecorators', () => {
        it('should return all decorators in the comment', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @private
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            const returns  = JavascriptParser.getDecorators(comment);
            returns.should.deep.equal(['query', 'private', 'param', 'returns', 'throws']);
        });
    });

    describe('#getVisibility', () => {
        it('should return the visibility as private (-)', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @private
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            const returns  = JavascriptParser.getVisibility(comment);
            returns.should.equal('-');
        });

        it('should return the visibility as public (+)', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @public
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            const returns  = JavascriptParser.getVisibility(comment);
            returns.should.equal('+');
        });
    });

    describe('#getReturnType', () => {
        it('should return the returns tag', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            const returns  = JavascriptParser.getReturnType(comment);
            returns.should.equal('Animal[]');
        });

        it('should return the return tag', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @return {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            const returns  = JavascriptParser.getReturnType(comment);
            returns.should.equal('Animal[]');
        });

        it('should throw if there is more than one return/returns tag', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @return {Animal[]} - the animals that belong to the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            (() => {
                JavascriptParser.getReturnType(comment);
            }).should.throw(Error);
        });

        it('should throw if there is more than one return/returns tag', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @return {Animal[]} - the animals that belong to the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            (() => {
                JavascriptParser.getReturnType(comment);
            }).should.throw(Error);
        });

        it('should throw if there no return type', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @return - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            (() => {
                JavascriptParser.getReturnType(comment);
            }).should.throw(Error);
        });

        it('should throw if there no return type name', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @return - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            (() => {
                JavascriptParser.getReturnType(comment);
            }).should.throw(Error);
        });
    });

    describe('#getThrows', () => {
        it('should return the throws tag', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
            */
           `;

            const throws  = JavascriptParser.getThrows(comment);
            throws.should.equal('Error');
        });

        it('should throw if there is more then one throws/exception tag', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {Error} - Description
             * @exception {Error} - Description
            */
           `;
            (() => {
                JavascriptParser.getThrows(comment);
            }).should.throw(Error);
        });

        it('should throw if a type isn\'t included', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws - Description
            */
           `;
            (() => {
                JavascriptParser.getThrows(comment);
            }).should.throw(Error);
        });

        it('should throw if there is no type name', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
             * @throws {} - Description
            */`;

            (() => {
                JavascriptParser.getThrows(comment);
            }).should.throw(Error);
        });
    });

    describe('#getMethodArguments', () => {
        it('should return the correct method arguments defined in the comment', () => {
            const comment = `
                /**
                 * Get the Animals, but do not resolve contained relationships
                 * @query
                 * @param {String} farmerId - the email of the farmer
                 * @param {String[]} farmerTest - test @param
                 * @param {Animal[]} animalTest - test @param
                 * @returns {Animal[]} - the animals that belong to the farmer
                */
            `;

            const argTypes = JavascriptParser.getMethodArguments(comment);

            argTypes.should.deep.equal(['String', 'String[]', 'Animal[]']);
        });

        it('should return the correct method argument defined in the comment', () => {
            const comment = `
                /**
                 * Get the Animals, but do not resolve contained relationships
                 * @query
                 * @param {String} farmerId - the email of the farmer
                 * @returns {Animal[]} - the animals that belong to the farmer
                */
            `;

            const argTypes = JavascriptParser.getMethodArguments(comment);

            argTypes.should.deep.equal(['String']);
        });

        it('throws an error if type name contains a space', () => {
            const comment = `
                /**
                 * Get the Animals, but do not resolve contained relationships
                 * @query
                 * @param {Silly String} farmerId - the email of the farmer
                 * @returns {Animal[]} - the animals that belong to the farmer
                */
            `;

            (() => {
                JavascriptParser.getMethodArguments(comment);
            }).should.throw(Error);
        });

        it('throws an error if there is no closing curly brace', () => {
            const comment = `
                /**
                 * Get the Animals, but do not resolve contained relationships
                 * @query
                 * @param {String farmerId - the email of the farmer
                 * @returns {Animal[]} - the animals that belong to the farmer
                */
            `;

            (() => {
                JavascriptParser.getMethodArguments(comment);
            }).should.throw(Error);
        });

        it ('doesn\'t throw an error if no description is given', () => {
            const comment = `
                /**
                 * Get the Animals, but do not resolve contained relationships
                 * @query
                 * @param {String} farmerId
                 * @returns {Animal[]}
                */
            `;

            JavascriptParser.getMethodArguments(comment);
        });
    });

    describe('#getExample', () => {
        it('should return the example in the jsdoc', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @example
             * let test = 'test';
             * return test;
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
            */
           `;

            const example = JavascriptParser.getExample(comment);

            example.should.equal('let test = \'test\';\nreturn test;');
        });

        it('should throw an error if the javascript syntax aren\'t valid', () => {
            const comment = `
            /**
             * Get the Animals, but do not resolve contained relationships
             * @query
             * @example
             * let test != 'test';
             * return test;
             * @param {String} farmerId - the email of the farmer
             * @returns {Animal[]} - the animals that belong to the farmer
            */
           `;

            (() => {
                JavascriptParser.getExample(comment);
            }).should.throw(Error);
        });
    });

});
