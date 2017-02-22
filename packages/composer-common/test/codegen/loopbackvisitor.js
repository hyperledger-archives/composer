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

const FileWriter = require('../../lib/codegen/filewriter');
const fs = require('fs');
const LoopbackVisitor = require('../../lib/codegen/fromcto/loopback/loopbackvisitor');
const ModelManager = require('../../lib/modelmanager');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('LoopbackVisitor', () => {

    let mockFileWriter;
    let modelManager;
    let visitor;

    let sandbox;

    beforeEach(() => {
        mockFileWriter = sinon.createStubInstance(FileWriter);
        modelManager = new ModelManager();
        modelManager.addModelFile(fs.readFileSync(path.resolve(__dirname, '../data/model/model-base.cto'), 'utf8'), 'model-base.cto');
        visitor = new LoopbackVisitor();
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#visit', () => {

        it('should throw for an unrecognised type', () => {
            (() => {
                visitor.visit({}, {});
            }).should.throw(/Unrecognised type: /);
        });

        it('should handle processing if no writer provided', () => {

            // Visit all of the loaded model files.
            modelManager.accept(visitor, { fileWriter: null });

        });

        it('should generate Loopback model files for each type in the Concerto model', () => {

            // Visit all of the loaded model files.
            modelManager.accept(visitor, { fileWriter: mockFileWriter });

            // Check that the Loopback model files were generated, and extract the
            // generated schemas from the stub writer.
            const expectedFiles = [
                'org.acme.base.SimpleAsset.json',
                'org.acme.base.BaseAsset.json',
                'org.acme.base.DerivedAsset.json',
                'org.acme.base.DerivedDerivedAsset.json',
                'org.acme.base.MyBasicTransaction.json',
                'org.acme.base.MyTransaction.json',
                'org.acme.base.MyTransactionEx.json',
                'org.acme.base.Person.json',
                'org.acme.base.Bloke.json'
            ];
            sinon.assert.callCount(mockFileWriter.openFile, expectedFiles.length);

            expectedFiles.forEach((expectedFile) => {
                sinon.assert.calledWith(mockFileWriter.openFile, expectedFile);
            });

        });

    });

});
