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
        it('should generate PlantUML code from animaltracking BusinessNetworkDefinition', function() {

            const animaltrackingModel = fs.readFileSync(path.resolve(__dirname, '../data/model/animaltracking.cto'), 'utf8');
            const animaltrackingScript = fs.readFileSync(path.resolve(__dirname, '../data/model/animaltracking.cto.js'), 'utf8');

            // create and populate the ModelManager with a model file
            const businessNetworkDefinition = new BusinessNetworkDefinition('com-ibm-composer-animaltracking-defranetwork@1.0.0', 'DEFRA Animal Tracking Network');
            businessNetworkDefinition.getModelManager().addModelFile(animaltrackingModel,'animaltracking.cto');
            const script = businessNetworkDefinition.getScriptManager().createScript('animaltracking.cto.js', 'JS', animaltrackingScript);
            businessNetworkDefinition.getScriptManager().addScript(script);

            let visitor = new PlantUMLVisitor();
            let parameters = {};
            parameters.fileWriter = new FileWriter('./out/animaltracking');
            businessNetworkDefinition.accept(visitor, parameters);

            // check the file exists
            fs.accessSync('./out/animaltracking/model.uml', fs.F_OK);
        });


        it('coverage for random object',function(){

            let fakeObj = {accept: function(){}};
            let visitor = new PlantUMLVisitor();
            (()=>{
                visitor.visit(fakeObj,{});
            })
            .should.throw(/Unrecognised/);
        });
    });
});
