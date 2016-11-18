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
const BusinessNetwork = require('../../lib/businessnetwork');
const PlantUMLVisitor = require('../../lib/codegen/fromcto/plantuml/plantumlvisitor');
const FileWriter = require('../../lib/codegen/filewriter');

const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

describe('PlantUMLVisitor', function(){

    let mockFileWriter;

    beforeEach(() => {
        mockFileWriter = sinon.createStubInstance(FileWriter);
    });

    describe('#visit', function() {
        it('should generate PlantUML code', function() {

            const mozart = fs.readFileSync(path.resolve(__dirname, '../data/model/mozart.cto'), 'utf8');

            // create and populate the ModelManager with a model file

            const businessNetwork = new BusinessNetwork('TEST');
            businessNetwork.getModelManager().addModelFile(mozart);

            let visitor = new PlantUMLVisitor();
            let parameters = {};
            parameters.fileWriter = mockFileWriter;
            businessNetwork.accept(visitor, parameters);

            sinon.assert.calledWith(mockFileWriter.openFile, 'model.uml');
        });
    });
});
