/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const FileWriter = require('../../lib/codegen/filewriter');
const fs = require('fs');
const LoopbackVisitor = require('../../lib/codegen/fromcto/loopback/loopbackvisitor');
const ModelManager = require('../../lib/modelmanager');

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
        modelManager.addModelFile(fs.readFileSync('./test/data/model/model-base.cto', 'utf8'));
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
                'org.acme.base.MyTransactionEx.json'
            ];
            sinon.assert.callCount(mockFileWriter.openFile, expectedFiles.length);

            expectedFiles.forEach((expectedFile) => {
                sinon.assert.calledWith(mockFileWriter.openFile, expectedFile);
            });

        });

    });

});
