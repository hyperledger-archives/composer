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

const Admin = require('composer-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const CodeGen = require('composer-common').CodeGen;
const FileWriter = CodeGen.FileWriter;
const fs = require('fs');
const GoLangVisitor = CodeGen.GoLangVisitor;
const JavaVisitor = CodeGen.JavaVisitor;
const JSONSchemaVisitor = CodeGen.JSONSchemaVisitor;
const PlantUMLVisitor = CodeGen.PlantUMLVisitor;
const TypescriptVisitor = CodeGen.TypescriptVisitor;
const XmlSchemaVisitor = CodeGen.XmlSchemaVisitor;
const cmdUtil = require('../../utils/cmdutils');
/**
 * Composer Create Archive command
 *
 * composer archive create --archiveFile digitialPropertyNetwork.zip --sourceType module --sourceName digitalproperty-network
 *
 * @private
 */
class Create {

    /**
    * Command process for generate command
    * @param {string} argv argument list from composer command

    * @return {Promise} promise when command complete
    */
    static handler(argv) {


        cmdUtil.log('Listing Business Network Archive from '+argv.archiveFile);
        let readFile = fs.readFileSync(argv.archiveFile);
        return BusinessNetworkDefinition.fromArchive(readFile).then((businessNetwork) => {
            cmdUtil.log('Identifier:'+businessNetwork.getIdentifier());
            cmdUtil.log('Name:'+businessNetwork.getName());
            cmdUtil.log('Version:'+businessNetwork.getVersion());

            let visitor = null;

            switch(argv.format) {
            case 'Go':
                visitor = new GoLangVisitor();
                break;
            case 'PlantUML':
                visitor = new PlantUMLVisitor();
                break;
            case 'Typescript':
                visitor = new TypescriptVisitor();
                break;
            case 'Java':
                visitor = new JavaVisitor();
                break;
            case 'JSONSchema':
                visitor = new JSONSchemaVisitor();
                break;
            case 'XmlSchema':
                visitor = new XmlSchemaVisitor();
                break;
            default:
                throw new Error ('Unrecognized code generator: ' + argv.format );
            }

            let parameters = {};
            parameters.fileWriter = new FileWriter(argv.outputDir);
            businessNetwork.accept(visitor, parameters);

            return;

        });



    }
}

module.exports = Create;
