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

const BusinessNetworkDefinition = require('../businessnetworkdefinition');
const GoLangVisitor = require('./fromcto/golang/golangvisitor');
const JSONSchemaVisitor = require('./fromcto/jsonschema/jsonschemavisitor');
const PlantUMLVisitor = require('./fromcto/plantuml/plantumlvisitor');
const TypescriptVisitor = require('./fromcto/typescript/typescriptvisitor');
const FileWriter = require('./filewriter');
const program = require('commander');

/**
 * Runs a Code Generator over a BusinessNetworkDefinition. Code Generators are pluggable
 * and may be specified using the --format command line argument.
 *
 * node ./lib/codegen/codegen.js --format Go
 * --outputDir /Users/dselman/dev/git/Fabric-Composer/chaincode/src/fabric-composer/gen
 * --archiveFile mynetwork.bna
 */
program
    .version('1.0')
    .description('convert a Business Network Definition to code')
    .usage('[options] <input model files ...>')
    .option('-f, --format <format>', 'Format of code to generate: Go, PlantUML, Typescript, JSONSchema. Defaults to Go.', 'Go')
    .option('-o, --outputDir <outputDir>', 'Output directory')
    .option('-a, --archiveFile <businessNetworkArchive>', 'Business Network Archive');

console.log('Code generation format: ' + program.format);
console.log('Output directory: ' + program.outputDir);

// create the BusinessNetworkDefinition from an archive on disk
const businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(process.businessNetworkArchive);

let visitor = null;

switch(program.format) {
case 'Go':
    visitor = new GoLangVisitor();
    break;
case 'PlantUML':
    visitor = new PlantUMLVisitor();
    break;
case 'Typescript':
    visitor = new TypescriptVisitor();
    break;
case 'JSONSchema':
    visitor = new JSONSchemaVisitor();
    break;
default:
    throw new Error ('Unrecognized code generator: ' + program.format );
}

let parameters = {};
parameters.fileWriter = new FileWriter(program.outputDir);
businessNetworkDefinition.accept(visitor, parameters);
