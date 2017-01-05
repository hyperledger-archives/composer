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

const BusinessNetworkDefinition = require('../businessnetwork');
const GoLangVisitor = require('./fromcto/golang/golangvisitor');
const JSONSchemaVisitor = require('./fromcto/jsonschema/jsonschemavisitor');
const PlantUMLVisitor = require('./fromcto/plantuml/plantumlvisitor');
const TypescriptVisitor = require('./fromcto/typescript/typescriptvisitor');
const FileWriter = require('./filewriter');
const fs = require('fs');
const program = require('commander');

/**
 * Runs a Code Generator over the ModelManager. Code Generators are pluggable
 * and may be specified using the --format command line argument.
 *
 * node ./lib/codegen/codegen.js --format Go
 * --outputDir /Users/dselman/dev/git/Concerto/chaincode/src/concerto/gen
 * /Users/dselman/dev/git/Concerto/test/data/model/concerto.cto
 * /Users/dselman/dev/git/Concerto/test/data/model/carlease.cto
 */
program
    .version('1.0')
    .description('convert a set of Concerto models to code')
    .usage('[options] <input model files ...>')
    .option('-f, --format <format>', 'Format of code to generate. Defaults to Go.', 'Go')
    .option('-o, --outputDir <outputDir>', 'Output directory')
    .parse(process.argv);

if (!program.args || !program.args.length) {
    program.help();
}

console.log('Code generation format: ' + program.format);
console.log('Output directory: ' + program.outputDir);

// create and populate the ModelManager with a model file
const businessNetworkDefinition = new BusinessNetworkDefinition('org.acme.MyBusinessNetwork-1.0.0', 'Test Business Network');
const modelFiles = [];

if (program.args) {
    for(let n=0; n < program.args.length; n++) {
        const modelFile = program.args[n];
        console.log('Parsing: ' + modelFile);
        let m = fs.readFileSync(modelFile, 'utf8');
        modelFiles.push(m);
    }

    console.log('Loaded ' + modelFiles.length + ' files.');
    businessNetworkDefinition.getModelManager().addModelFiles(modelFiles);
}

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
