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
const BusinessNetworkDefinition = require('../../lib/businessnetworkdefinition');
const PlantUMLVisitor = require('../../lib/codegen/fromcto/plantuml/plantumlvisitor');
const FileWriter = require('../../lib/codegen/filewriter');

const fs = require('fs');
const path = require('path');

describe('PlantUMLVisitor', function(){

    describe('#visit', function() {
        it('should generate PlantUML code from Mozart BusinessNetworkDefinition', function() {

            const mozartModel = fs.readFileSync(path.resolve(__dirname, '../data/model/mozart.cto'), 'utf8');
            const mozartScript = fs.readFileSync(path.resolve(__dirname, '../data/model/mozart.cto.js'), 'utf8');

            // create and populate the ModelManager with a model file
            const businessNetworkDefinition = new BusinessNetworkDefinition('com.ibm.concerto.mozart.DefraNetwork-1.0.0', 'DEFRA Animal Tracking Network');
            businessNetworkDefinition.getModelManager().addModelFile(mozartModel);
            const script = businessNetworkDefinition.getScriptManager().createScript('mozart.cto.js', 'JS', mozartScript);
            businessNetworkDefinition.getScriptManager().addScript(script);

            let visitor = new PlantUMLVisitor();
            let parameters = {};
            parameters.fileWriter = new FileWriter('./out/mozart');
            businessNetworkDefinition.accept(visitor, parameters);

            // check the file exists
            fs.accessSync('./out/mozart/model.uml', fs.F_OK);
        });
    });
});
