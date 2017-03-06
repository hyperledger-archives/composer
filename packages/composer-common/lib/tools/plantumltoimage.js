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
const program = require('commander');
const plantuml = require('node-plantuml');

/**
 * Generate an image file from a PlantUML source file
 * @private
 */
program
    .version('0.0.1')
    .description('Generates images from PlantUML file')
    .usage('[options]')
    .option('-i, --inputDir <inputDir>', 'Input directory containing PlantUML files')
    .option('-o, --outputDir <outputDir>', 'Output directory to store generated images')
    .option('-f, --format <format>', 'Image format, defaults to SVG', 'svg')
    .parse(process.argv);

console.log('Input dir ' + program.inputDir);

// Loop through all the files in the input directory
processDirectory(program.inputDir);

/**
 * Processes all the UML files within a directory.
 *
 * @param {string} path - the path to process
 * @private
 */
function processDirectory(path) {
    //console.log( 'Processing ' + path );
    fs.readdir(path, function(err, files) {
        if (err) {
            console.error('Could not list the directory.', err);
            process.exit(1);
        }

        files.forEach(function(file, index) {
            let stats = fs.statSync(path + '/' + file);
            if (stats.isFile()) {
                processFile(path + '/' + file);
            } else if (stats.isDirectory()) {
                processDirectory(path + '/' + file);
            }
        });
    });
}

/**
 * Processes a single UML file (.uml extension)
 *
 * @param {string} file - the file to process
 * @private
 */
function processFile(file) {
    let filePath = path.parse(file);
    if (filePath.ext === '.uml') {
        let gen = plantuml.generate(file, {
            format: program.format
        });
        const imageFile = program.outputDir + '/' + filePath.name + '.' + program.format;
        fs.ensureFileSync(imageFile);
        gen.out.pipe(fs.createWriteStream(imageFile));
    }
}
