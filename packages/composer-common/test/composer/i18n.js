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

require('chai').should();
const expect = require('chai').expect;
const Globalize = require('./../../lib/globalize');
const fs = require('fs');
const IllegalModelException = require('./../../lib/introspect/illegalmodelexception');
const Factory = require('./../../lib/factory');
const Serializer = require('./../../lib/serializer');
const ModelManager = require('./../../lib/modelmanager');
const ModelUtil = require('./../../lib/modelutil');

describe('Globalization', function() {

    beforeEach(function() {
    });

    describe('#check globalization library works', function() {
        it('numbered variables using Array', function() {
            const formatter = Globalize('en').messageFormatter('test-hello-array');
            formatter([ 'Wolfgang', 'Amadeus', 'Mozart' ]).should.equal('Hello, Wolfgang Amadeus Mozart');
        });

        it('named variables using Object key-value pairs', function() {
            const formatter = Globalize('en').messageFormatter('test-hello-object');
            formatter({
                first: 'Wolfgang',
                middle: 'Amadeus',
                last: 'Mozart'
            }).should.equal('Hello, Wolfgang Amadeus Mozart');
        });

        it('repeated numbered variables using Array', function() {
            const formatter = Globalize('en').messageFormatter('test-repeat-array');
            formatter([ 'Bonkers' ]).should.equal('Bonkers Bonkers Bonkers');
        });

        it('repeated named variables using Object key-value pairs', function() {
            const formatter = Globalize('en').messageFormatter('test-repeat-object');
            formatter({
                value: 'Bonkers'
            }).should.equal('Bonkers Bonkers Bonkers');
        });

        it.skip('check formatters', function() {
            // Use Globalize to format a message with plural inflection.
            let like = Globalize.messageFormatter('like');
            like(0).should.equal('Be the first to like this');
            Globalize.dateFormatter()( new Date() ).should.not.be.null;
            Globalize('pt').formatMessage('hello').should.equal('Olá');

            let formatter = Globalize.messageFormatter('hello');

            // Numbered variables using Array.
            formatter([ 'Wolfgang', 'Amadeus', 'Mozart' ]).should.equal('Hello, Wolfgang Amadeus Mozart');
            // > "Hello, Wolfgang Amadeus Mozart"

            // Numbered variables using function arguments.
            formatter( 'Wolfgang', 'Amadeus', 'Mozart' ).should.equal('Hello, Wolfgang Amadeus Mozart');
            // > "Hello, Wolfgang Amadeus Mozart"

            // Named variables using Object key-value pairs.
            formatter = Globalize( 'en' ).messageFormatter( 'hey' );
            formatter({
                first: 'Wolfgang',
                middle: 'Amadeus',
                last: 'Mozart'
            }).should.equal('Hey, Wolfgang Amadeus Mozart');
        });
    });

    describe('#check ClassDeclaration messages are correct', function() {

        it('check message in process()', function() {
            let formatter = Globalize('en').messageFormatter('classdeclaration-process-unrecmodelelem');
            formatter({
                'type': 'Cow'
            }).should.equal('Unrecognised model element Cow');
        });

        it('check message in getFields()', function() {
            let formatter = Globalize('en').messageFormatter('classdeclaration-getfield-notfindsupertype');
            formatter({
                'type': 'Bar'
            }).should.equal('Could not find super type Bar');

            // TODO (LG) functionally test this function
        });

        describe('check messages in validate()', function() {
            it('where identifier is not a property', function() {
                let formatter = Globalize('en').messageFormatter('classdeclaration-validate-identifiernotproperty');
                formatter({
                    'class': 'Cow',
                    'idField': 'CowID'
                }).should.equal('Class Cow is identified by field (CowID) but does not contain this property.');

                // create and polulate the modelManager with a model file
                const modelManager = new ModelManager();

                let fileName = './test/composer/models/classdeclaration/validate/foo-identifiernotproperty.cto';
                let invalidFile = fs.readFileSync(fileName, 'utf8');
                invalidFile.should.not.be.null;

                expect(function() {
                    modelManager.addModelFile(invalidFile,fileName);
                }).to.throw(IllegalModelException, 'Class foo is identified by field (fooID) but does not contain this property.');
            });

            it('where identifier is not a string', function() {
                let formatter = Globalize.messageFormatter('classdeclaration-validate-identifiernotstring');
                formatter({
                    'class': 'Cow',
                    'idField': 'CowID'
                }).should.equal('Class Cow is identified by field (CowID) but the type of the field is not String.');

                // create and polulate the modelManager with a model file
                const modelManager = new ModelManager();

                let fileName = './test/composer/models/classdeclaration/validate/foo-identifiernotstring.cto';
                let invalidFile = fs.readFileSync(fileName, 'utf8');
                invalidFile.should.not.be.null;
                expect(function() {
                    modelManager.addModelFile(invalidFile,fileName);
                }).to.throw(IllegalModelException, 'Class foo is identified by field (fooID) but the type of the field is not String.');
            });
        });
    });

    describe('#check ModelFile messages are correct', function() {
        it('check message in constructor()', function() {
            let formatter = Globalize.messageFormatter('modelfile-constructor-unrecmodelelem');
            formatter({
                'type': 'Person',
            }).should.equal('Unrecognised model element Person');

            // TODO (LG) functionally test this function
        });

        it('check message in resolveType()', function() {
            let formatter = Globalize.messageFormatter('modelfile-resolvetype-undecltype');
            formatter({
                'type': 'Person',
                'context': 'Context'
            }).should.equal('Undeclared type Person in Context');

            // create and polulate the modelManager with a model file
            const modelManager = new ModelManager();

            let fileName = './test/composer/models/modelfile/resolvetype/foo-undecltype.cto';
            let invalidFile = fs.readFileSync(fileName, 'utf8');
            invalidFile.should.not.be.null;
            expect(function() {
                modelManager.addModelFile(invalidFile,fileName);
            }).to.throw(IllegalModelException, 'Undeclared type Person in property Bar.foo.fooProperty');
        });

        it('check message in resolveImport()', function() {
            let formatter = Globalize.messageFormatter('modelfile-resolveimport-failfindimp');
            formatter({
                'type': 'Type',
                'imports': 'Imports',
                'namespace': 'Namespace'
            }).should.equal('Failed to find Type in list of imports [Imports] for namespace Namespace');
            // TODO (LG) functionally test this function (will never be thrown)
        });
    });

    describe('#check TransactionDeclaration messages are correct', function() {
        it('check message in getIdentifierFieldName()', function() {
            let formatter = Globalize.messageFormatter('transactiondeclaration-getidentifierfieldname-noidentifyingfield');
            formatter().should.equal('Transactions do not have an identifying field.');

            // TODO (LG) functionally test this function (will never be thrown)
        });
    });

    describe.skip('#check Factory messages are correct', function() {
        describe('check messages in newResource()', function() {
            it('where namespace hasn\'t been registered in the model manager', function() {
                let formatter = Globalize.messageFormatter('factory-newinstance-notregisteredwithmm');
                formatter({
                    'namespace': 'foo'
                }).should.equal('ModelFile for namespace foo has not been registered with the ModelManager');

                const modelManager = new ModelManager();

                expect(function() {
                    let factory = new Factory(modelManager);
                    factory.newResource('foo', 'bar', '123');
                }).to.throw(Error, 'ModelFile for namespace foo has not been registered with the ModelManager');
            });

            it('where a type is\'t declared in a namespace', function() {
                let formatter = Globalize.messageFormatter('factory-newinstance-typenotdeclaredinns');
                formatter({
                    namespace: 'foo',
                    type: 'bar'
                }).should.equal('Type bar is not declared in namespace foo');

                const modelManager = new ModelManager();

                let fileName = './test/composer/models/factory/newinstance/foo-typenotdeclaredinns.cto';
                let file = fs.readFileSync(fileName, 'utf8');
                file.should.not.be.null;
                modelManager.addModelFile(file,fileName);

                expect(function() {
                    let factory = new Factory(modelManager);
                    factory.newResource('foo', 'bar', '123');
                }).to.throw(Error, 'Type bar is not declared in namespace foo');
            });
        });

        describe('check messages in newResource()', function() {
            it('where namespace hasn\'t been registered in the model manager', function() {
                let formatter = Globalize.messageFormatter('factory-newinstance-notregisteredwithmm');
                formatter({
                    'namespace': 'foo'
                }).should.equal('ModelFile for namespace foo has not been registered with the ModelManager');

                const modelManager = new ModelManager();

                expect(function() {
                    let factory = new Factory(modelManager);
                    factory.newResource('foo', 'bar', '123');
                }).to.throw(Error, 'ModelFile for namespace foo has not been registered with the ModelManager');
            });

            it('where a type is\'t declared in a namespace', function() {
                let formatter = Globalize.messageFormatter('factory-newinstance-typenotdeclaredinns');
                formatter({
                    namespace: 'foo',
                    type: 'bar'
                }).should.equal('Type bar is not declared in namespace foo');

                const modelManager = new ModelManager();

                let fileName = './test/composer/models/factory/newinstance/foo-typenotdeclaredinns.cto';
                let file = fs.readFileSync(fileName, 'utf8');
                file.should.not.be.null;
                modelManager.addModelFile(file,fileName);

                expect(function() {
                    let factory = new Factory(modelManager);
                    factory.newResource('foo', 'bar', '123');
                }).to.throw(Error, 'Type bar is not declared in namespace foo');
            });
        });

        describe('check messages in newRelationship()', function() {
            it('where namespace hasn\'t been registered in the model manager', function() {
                let formatter = Globalize.messageFormatter('factory-newrelationship-notregisteredwithmm');
                formatter({
                    'namespace': 'foo'
                }).should.equal('ModelFile for namespace foo has not been registered with the ModelManager');

                const modelManager = new ModelManager();

                expect(function() {
                    let factory = new Factory(modelManager);
                    factory.newRelationship('foo', 'bar', '123');
                }).to.throw(Error, 'ModelFile for namespace foo has not been registered with the ModelManager');
            });

            it('where a type is\'t declared in a namespace', function() {
                let formatter = Globalize.messageFormatter('factory-newrelationship-typenotdeclaredinns');
                formatter({
                    namespace: 'foo',
                    type: 'bar'
                }).should.equal('Type bar is not declared in namespace foo');

                const modelManager = new ModelManager();

                let fileName = './test/composer/models/factory/newrelationship/foo-typenotdeclaredinns.cto';
                let file = fs.readFileSync(fileName, 'utf8');
                file.should.not.be.null;
                modelManager.addModelFile(file,fileName);

                expect(function() {
                    let factory = new Factory(modelManager);
                    factory.newRelationship('foo', 'bar', 123);
                }).to.throw(Error, 'Type bar is not declared in namespace foo');
            });
        });
    });

    describe('ModelManager messages', function() {
        describe('check messages in resolveType()', function() {
            it('when no namespace is registered for type', function(){
                let formatter = Globalize.messageFormatter('modelmanager-resolvetype-nonsfortype');
                formatter({
                    type: 'bar',
                    context: 'foo'
                }).should.equal('No registered namespace for type bar in foo');

                const modelManager = new ModelManager();

                expect(function() {
                    modelManager.resolveType('foo', 'bar');
                }).to.throw(IllegalModelException, 'No registered namespace for type bar in foo');
            });

            it('when a type doesn\'t exist in a namespace for a context', function() {
                let formatter = Globalize.messageFormatter('modelmanager-resolvetype-notypeinnsforcontext');
                formatter({
                    namespace: 'baz',
                    type: 'bar',
                    context: 'foo'
                }).should.equal('No type bar in namespace baz for foo');

                // Cannot be tested - will throw error on line 85 modelmanager.js first
            });
        });

        describe('#getType()', function() {
            it('Namespace does not exist', function() {
                let formatter = Globalize.messageFormatter('modelmanager-gettype-noregisteredns');
                formatter({
                    type: 'TYPE'
                }).should.equal('Namespace is not defined for type TYPE');

                const modelManager = new ModelManager();

                expect(function() {
                    modelManager.getType('NAMESPACE.TYPE');
                }).to.throw(Error, 'Namespace is not defined for type NAMESPACE.TYPE');
            });

            it('check type exists in namespace', function() {
                let formatter = Globalize.messageFormatter('modelmanager-gettype-notypeinns');
                formatter({
                    type: 'TYPE',
                    namespace: 'NAMESPACE'
                }).should.equal('Type TYPE is not defined in namespace NAMESPACE');

                // Cannot be tested - will throw error on line 139 modelmanager.js first
            });
        });
    });

    describe('#check Serializer messages are correct', function() {
        it('check message in constructor()', function() {
            let formatter = Globalize.messageFormatter('serializer-constructor-factorynull');
            formatter().should.equal('Factory cannot be null');

            const modelManager = new ModelManager();
            expect(function() {
                new Serializer(null, modelManager);
            }).to.throw(Error, 'Factory cannot be null');
        });

        it('check message in toJSON()', function() {
            let formatter = Globalize.messageFormatter('serializer-tojson-notcobject');
            formatter().should.equal('Serializer.toJSON only accepts Concept, Event, Asset, Participant or Transaction.');

            const modelManager = new ModelManager();
            expect(function() {
                let serializer = new Serializer(true, modelManager);
                serializer.toJSON({});
            }).to.throw(Error, 'Serializer.toJSON only accepts Concept, Event, Asset, Participant or Transaction.');
        });
    });

    describe('#check ModelUtil messages are correct', function() {
        it('check message in getNamespace()', function() {
            let formatter = Globalize.messageFormatter('modelutil-getnamespace-nofnq');
            formatter().should.equal('FQN is invalid.');

            expect(function() {
                ModelUtil.getNamespace();
            }).to.throw(Error, 'FQN is invalid.');
        });
    });
});
