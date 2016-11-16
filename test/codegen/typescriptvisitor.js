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

require('chai').should();
const TypescriptVisitor = require('../../lib/codegen/fromcto/typescript/typescriptvisitor');
const FileWriter = require('../../lib/codegen/filewriter');
const ModelManager = require('../../lib/modelmanager');

const fs = require('fs');

describe('TypescriptVisitor', function(){
    describe('#visit', function() {
        it('should generate Typescript code', function() {

            // delete the files in case they already exist
            fs.unlink('./temp/concerto.ts');
            fs.unlink('./temp/org.acme.ts');

            const carleaseModel = fs.readFileSync('./test/data/model/carlease.cto', 'utf8');
            const concertoModel = fs.readFileSync('./test/data/model/concerto.cto', 'utf8');

            // create and populate the ModelManager with a model file
            const modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();
            modelManager.addModelFiles([carleaseModel,concertoModel]);

            let visitor = new TypescriptVisitor();
            let parameters = {};
            parameters.fileWriter = new FileWriter('./temp');
            modelManager.accept(visitor, parameters);

            // check 3 files where generated
            fs.statSync('./temp/concerto.ts');
            fs.statSync('./temp/org.acme.ts');

            // cleanup
            fs.unlink('./temp/concerto.ts');
            fs.unlink('./temp/org.acme.ts');
        });
    });
});
