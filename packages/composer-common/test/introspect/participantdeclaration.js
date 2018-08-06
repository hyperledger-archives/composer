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

const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

require('chai').should();

describe('ParticipantDeclaration', () => {

    let modelManager;

    beforeEach(() => {
        modelManager = new ModelManager();
    });

    let loadParticipantDeclaration = (modelFileName) => {
        let modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
        let modelFile = new ModelFile(modelManager, modelDefinitions);
        let assets = modelFile.getParticipantDeclarations();
        assets.should.have.lengthOf(1);

        return assets[0];
    };

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
