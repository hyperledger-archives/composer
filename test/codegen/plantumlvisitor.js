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
const PlantUMLVisitor = require('../../lib/codegen/fromcto/plantuml/plantumlvisitor');
const FileWriter = require('../../lib/codegen/filewriter');
const ModelManager = require('../../lib/modelmanager');

const fs = require('fs');

describe('PlantUMLVisitor', function(){
    describe('#visit', function() {
        it('should generate PlantUML code', function() {

            // delete the files in case they already exist
            fs.unlink('./temp/model.uml');
            const mozart = fs.readFileSync('./test/data/model/mozart.cto', 'utf8');

            // create and populate the ModelManager with a model file
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();
            modelManager.addModelFile(mozart);

            let visitor = new PlantUMLVisitor();
            let parameters = {};
            parameters.fileWriter = new FileWriter('./temp');
            modelManager.accept(visitor, parameters);

            // check 1 file was generated
            fs.statSync('./temp/model.uml');

            // cleanup
            fs.unlink('./temp/model.uml');
        });
    });
});
