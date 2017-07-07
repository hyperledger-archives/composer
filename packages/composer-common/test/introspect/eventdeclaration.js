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

const EventDeclaration = require('../../lib/introspect/eventdeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

require('chai').should();
const sinon = require('sinon');

describe('EventDeclaration', () => {

    let mockModelManager;
    let mockSystemEvent;

    /**
     * Load an arbitrary number of model files.
     * @param {String[]} modelFileNames array of model file names.
     * @param {ModelManager} modelManager the model manager to which the created model files will be registered.
     * @return {ModelFile[]} array of loaded model files, matching the supplied arguments.
     */
    const loadModelFiles = (modelFileNames, modelManager) => {
        const modelFiles = [];
        for (let modelFileName of modelFileNames) {
            const modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
            const modelFile = new ModelFile(modelManager, modelDefinitions);
            modelFiles.push(modelFile);
        }
        modelManager.addModelFiles(modelFiles, modelFileNames);
        return modelFiles;
    };

    const loadModelFile = (modelFileName) => {
        return loadModelFiles([modelFileName], mockModelManager)[0];
    };

    const loadLastDeclaration = (modelFileName, type) => {
        const modelFile = loadModelFile(modelFileName);
        const declarations = modelFile.getDeclarations(type);
        return declarations[declarations.length - 1];
    };

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockSystemEvent = sinon.createStubInstance(EventDeclaration);
        mockSystemEvent.getFullyQualifiedName.returns('org.hyperledger.composer.system.Event');
        mockModelManager.getSystemTypes.returns([mockSystemEvent]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw if modelFile not specified', () => {
            (() => {
                new EventDeclaration(null, {});
            }).should.throw(/required/);
        });

        it('should throw if ast not specified', () => {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            (() => {
                new EventDeclaration(mockModelFile, null);
            }).should.throw(/required/);
        });
    });

    describe('#validate', () => {
        it('should throw if event is not a system type but named event', () => {
            let event = loadLastDeclaration('test/data/parser/eventdeclaration.systypename.cto', EventDeclaration);
            event.superType = null;
            (() => {
                event.validate();
            }).should.throw(/Event is a reserved type name./);
        });
    });


    describe('#parse', () => {

        it('should parse a valid file', () => {

            const fileName = 'test/data/model/events.cto';
            let modelDefinitions = fs.readFileSync(fileName, 'utf8');
            const modelManager = new ModelManager();
            const modelFile = modelManager.addModelFile(modelDefinitions, fileName );

            const abstractEvent = modelFile.getEventDeclaration('AbstractEvent');
            abstractEvent.getFullyQualifiedName().should.equal('org.acme.AbstractEvent');
            abstractEvent.isAbstract().should.be.true;
            abstractEvent.isEvent().should.be.true;
            abstractEvent.validate();

            const concreteEvent = modelFile.getEventDeclaration('ConcreteEvent');
            concreteEvent.getFullyQualifiedName().should.equal('org.acme.ConcreteEvent');
            concreteEvent.isAbstract().should.be.false;

            const derivedEvent = modelFile.getEventDeclaration('DerivedEvent');
            derivedEvent.getFullyQualifiedName().should.equal('org.acme.DerivedEvent');
            derivedEvent.isAbstract().should.be.false;
        });
    });
});
