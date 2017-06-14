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
            const businessNetworkDefinition = new BusinessNetworkDefinition('com-ibm-concerto-mozart-defranetwork@1.0.0', 'DEFRA Animal Tracking Network');
            businessNetworkDefinition.getModelManager().addModelFile(mozartModel,'mozart.cto');
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
