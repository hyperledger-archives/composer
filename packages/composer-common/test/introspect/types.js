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
const ClassDeclaration = require('../../lib/introspect/classdeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('ModelFile type parsing', () => {

    const invalidModel = fs.readFileSync(path.resolve(__dirname, '../data/parser/types.cto'), 'utf8');
    let mockClassDeclaration;
    let mockModelManager;
    let sandbox;

    beforeEach(() => {
        const SYSTEM_MODEL_CONTENTS = [
            'namespace org.hyperledger.composer.system',
            'abstract asset $Asset {  }',
            'abstract participant $Participant {   }',
            'abstract transaction $Transaction identified by transactionId{',
            '  o String transactionId',
            '  o DateTime timestamp',
            '}',
            'abstract event $Event identified by eventId{',
            '   o String eventId',
        /*  '  --> _cst_Transaction transaction',*/
            '   }'
        ];
        const mockSystemModel = SYSTEM_MODEL_CONTENTS.join('\n');
        let mockSystemModelFile = new ModelFile(mockModelManager, mockSystemModel);
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockModelManager.getModelFile.withArgs('org.hyperledger.composer.system').returns(mockSystemModelFile);
        mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
        mockModelManager.getType.returns(mockClassDeclaration);
        mockClassDeclaration.getProperties.returns([]);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should be valid', () => {
            const mf = new ModelFile(mockModelManager,invalidModel, 'types.cto');
            mf.validate();
        });

        it('should be invalid due to decimal default', () => {
            const model = `
            namespace org.acme

            concept Address {
                o Integer foo default=104.0
            }
            `;
            (() => {
                const mf = new ModelFile(mockModelManager, model, 'test.cto');
                mf.validate();
            }).should.throw();
        });

        it('should be invalid due to no decimal default', () => {
            const model = `
            namespace org.acme

            concept Address {
                o Double foo default=104
            }
            `;
            (() => {
                const mf = new ModelFile(mockModelManager, model, 'test.cto');
                mf.validate();
            }).should.throw();
        });

        it('should be invalid due to decimal range', () => {
            const model = `
            namespace org.acme

            concept Address {
                o Integer foo range=[0.1, 0.2]
            }
            `;
            (() => {
                const mf = new ModelFile(mockModelManager, model, 'test.cto');
                mf.validate();
            }).should.throw();
        });

        it('should be invalid due to decimal default', () => {
            const model = `
            namespace org.acme

            concept Address {
                o Integer foo default=104.0
            }
            `;
            (() => {
                const mf = new ModelFile(mockModelManager, model, 'test.cto');
                mf.validate();
            }).should.throw();
        });

        it('should be invalid due to no decimal range', () => {
            const model = `
            namespace org.acme

            concept Address {
                o Double foo range=[0, 1]
            }
            `;
            (() => {
                const mf = new ModelFile(mockModelManager, model, 'test.cto');
                mf.validate();
            }).should.throw();
        });
    });
});
