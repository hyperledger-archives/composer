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

const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs');
const PlantUMLGenerator = require('./fromjs/plantumlgenerator');
const APISignatureGenerator = require('./fromjs/apisignaturegenerator');
const JavaScriptParser = require('./javascriptparser');
const JSONGenerator = require('./fromjs/jsongenerator');
let program;
/**
 * Processes a single Javascript file (.js extension)
 *
 * @param {string} file - the file to process
 * @param {Object} fileProcessor - the processor instance to use to generate code
 * @private
 */
function processFile(file, fileProcessor) {
    let filePath = path.parse(file);
    if (filePath.ext === '.js' && filePath.base !== 'parser.js') {  //ignore the generated parsers
        let fileContents = fs.readFileSync(file, 'utf8');
        // Specify ES2017 (ES8) as that has async/await, which we use in our APIs.
        const parser = new JavaScriptParser(fileContents, program.private, 8, false);
        fileProcessor.generate(program, file, parser.getIncludes(), parser.getClasses(), parser.getFunctions());
    }
}

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
 * Parses Javascript source and generates output from class and method definitions
 * @private
 */
program = yargs
    .usage('[options]')
    .options({
        'outputDir' : {alias : 'o',required:true,describe: 'Output directory'},
        'inputDir' :  {alias : 'i',required:false,describe: 'Input source directory'},
        'single' :  {alias : 's',required:false,describe: 'Single file to process'},
        'format' :  {alias : 'f',required:true,describe: 'Format of code to generate. Defaults to PlantUML.',type:'string',default:'PlantUML'},
        'private' :  {alias : 'p',required:false,describe: 'Include classes that have the @private JSDoc annotation'},
    })
    .argv;

let fileProcessor;

switch(program.format) {
case 'PlantUML':
    fileProcessor = new PlantUMLGenerator();
    break;
case 'APISignature':
    fileProcessor = new APISignatureGenerator();
    break;
case 'JSON':
    fileProcessor = new JSONGenerator();
    break;
}


if (program.inputDir){
    // Loop through all the files in the input directory
    // eslint-disable-next-line no-console
    console.log('Input dir ' + program.inputDir);
    processDirectory(program.inputDir,fileProcessor);
}
else if (program.single){
    // eslint-disable-next-line no-console
    console.log('Single file '+program.single);
    processFile(path.resolve(program.single),fileProcessor);
} else {
    // eslint-disable-next-line no-console
    console.log('no file option given');
}

