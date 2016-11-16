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
const ModelManager = require('../../lib/modelmanager');
const GoLangVisitor = require('../../lib/codegen/fromcto/golang/golangvisitor');
const FileWriter = require('../../lib/codegen/filewriter');

const fs = require('fs');

describe('GoLangVisitor', function(){
    describe('#visit', function() {
        it('should generate Go code', function() {

            // delete the files in case they already exist
            fs.unlink('./temp/concerto.go');
            fs.unlink('./temp/main.go');
            fs.unlink('./temp/orgacme.go');

            const carleaseModel = fs.readFileSync('./test/data/model/carlease.cto', 'utf8');
            const concertoModel = fs.readFileSync('./test/data/model/concerto.cto', 'utf8');

            // create and populate the ModelManager with a model file
            const modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();
            modelManager.addModelFiles([carleaseModel,concertoModel]);

            let visitor = new GoLangVisitor();
            let parameters = {};
            parameters.fileWriter = new FileWriter('./temp');
            modelManager.accept(visitor, parameters);

            // check 3 files where generated
            fs.statSync('./temp/concerto.go');
            fs.statSync('./temp/main.go');
            fs.statSync('./temp/orgacme.go');

            // cleanup
            fs.unlink('./temp/concerto.go');
            fs.unlink('./temp/main.go');
            fs.unlink('./temp/orgacme.go');
        });
    });
});
