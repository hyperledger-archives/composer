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

const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const PlantUMLGenerator = require('./fromjs/plantumlgenerator');
const APISignatureGenerator = require('./fromjs/apisignaturegenerator');
const JavaScriptParser = require('./javascriptparser');

/**
 * Generates Plant UML files from Javascript source files
 *
 * node ./lib/codegen/umlgen.js
 * --outputDir <location to write UML files>
 * --inputDir <location to recursively read .js files>
 */
program
    .version('0.0.1')
    .description('Parses Javascript source and generates output from class and method definitions')
    .usage('[options]')
    .option('-o, --outputDir <outputDir>', 'Output directory')
    .option('-i, --inputDir <inputDir>', 'Input source directory')
    .option('-f, --format <format>', 'Format of code to generate. Defaults to PlantUML.', 'PlantUML')
    .option('-p, --private', 'Include classes that have the @private JSDoc annotation')
    .parse(process.argv);

let fileProcessor;

switch(program.format) {
case 'PlantUML':
    fileProcessor = new PlantUMLGenerator();
    break;
case 'APISignature':
    fileProcessor = new APISignatureGenerator();
    break;
}

console.log('Input dir ' + program.inputDir);

// Loop through all the files in the input directory
processDirectory(program.inputDir,fileProcessor);

/**
 * Processes all the Javascript files within a directory.
 *
 * @param {string} path - the path to process
 * @param {Object} fileProcessor - the processor instance to use to generate code
 * @private
 */
function processDirectory(path, fileProcessor) {
    let items = [];
    fs.walk(path)
        .on('readable', function (item) {
            while ((item = this.read())) {
                if (item.stats.isFile()) {
                    items.push(item.path);
                }
            }
        })
        .on('end', () => {
            items.sort();
            items.forEach((item) => {
                processFile(item, fileProcessor);
            });
        });
}

/**
 * Processes a single Javascript file (.js extension)
 *
 * @param {string} file - the file to process
 * @param {Object} fileProcessor - the processor instance to use to generate code
 * @private
 */
function processFile(file, fileProcessor) {
    let filePath = path.parse(file);
    if (filePath.ext === '.js') {
        //console.log('%s is a file.', file);
        let fileContents = fs.readFileSync(file, 'utf8');
        const parser = new JavaScriptParser(fileContents, program.private);
        fileProcessor.generate(program, file, parser.getIncludes(), parser.getClasses(), parser.getFunctions());
    }
}
