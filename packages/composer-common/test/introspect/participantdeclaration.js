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

const ParticipantDeclaration = require('../../lib/introspect/participantdeclaration');
const ClassDeclaration = require('../../lib/introspect/classdeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

require('chai').should();
const sinon = require('sinon');

describe('ParticipantDeclaration', () => {

    let mockModelManager;
    let mockClassDeclaration;
    let mockSystemParticipant;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockModelManager =  sinon.createStubInstance(ModelManager);
        mockSystemParticipant = sinon.createStubInstance(ParticipantDeclaration);
        mockSystemParticipant.getFullyQualifiedName.returns('org.hyperledger.composer.system.Participant');
        mockModelManager.getSystemTypes.returns([mockSystemParticipant]);
        mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
        mockModelManager.getType.returns(mockClassDeclaration);
        mockClassDeclaration.getProperties.returns([]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    let loadParticipantDeclaration = (modelFileName) => {
        let modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
        let modelFile = new ModelFile(mockModelManager, modelDefinitions);
        let assets = modelFile.getParticipantDeclarations();
        assets.should.have.lengthOf(1);

        return assets[0];
    };

    describe('#constructor', () => {

        it('should throw if modelFile not specified', () => {
            (() => {
                new ParticipantDeclaration(null, {});
            }).should.throw(/required/);
        });

        it('should throw if ast not specified', () => {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            (() => {
                new ParticipantDeclaration(mockModelFile, null);
            }).should.throw(/required/);
        });

    });

    describe('#isRelationshipTarget', () => {
        it('should return true', () => {
            let p = loadParticipantDeclaration('test/data/parser/participantdeclaration.valid.cto');
            p.isRelationshipTarget().should.be.true;
        });
    });

    describe('#getSystemType', () => {
        it('should return Participant', () => {
            let p = loadParticipantDeclaration('test/data/parser/participantdeclaration.valid.cto');
            p.getSystemType().should.equal('Participant');
        });
    });

    describe('#validate', () => {
        it('should throw error if system type and name Participant', () => {
            let p = loadParticipantDeclaration('test/data/parser/participantdeclaration.systypename.cto');
            (() => {
                p.validate();
            }).should.throw(/Participant is a reserved type name./);
        });
    });

});
