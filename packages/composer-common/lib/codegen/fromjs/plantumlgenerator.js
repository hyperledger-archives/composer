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

const fs = require('fs');
const path = require('path');
const FileWriter = require('../filewriter');

/**
 * Converts the includes, classes and methods in a Javascript
 * file into a PlantUML format file.
 * @private
 * @class
 * @memberof module:composer-common
 */
class PlantUMLGenerator {

    /**
     * @param {Object} program - the program arguments
     * @param {Object} file - the file instance being processed
     * @param {Object[]} includes - the includes (require statements) within the file
     * @param {Object[]} classes - the classes within the file
     * @param {Object[]} functions - the functions within the file
     */
    generate(program, file, includes, classes, functions) {
        // generate the output
        if (classes.length > 0 ) {
            let fileWriter = new FileWriter(program.outputDir);
            const umlFilename = this.toUMLFilename(program.inputDir, program.outputDir, file);
            console.log('open file: ' + umlFilename);
            fileWriter.openFile(umlFilename);

            fileWriter.writeLine(0, '@startuml');
            console.log('+');
            fileWriter.writeLine(0, '!include ' + program.outputDir + '/../../jsdoc-template/umlstyle.uml');
            for (let n = 0; n < includes.length; n++) {
                // only include files that exist
                // the file may not exist if it was empty
                const includeFile = program.outputDir + '/' + includes[n] + '.uml';
                if (fs.existsSync(includeFile)) {
                    fileWriter.writeLine(0, '!include ' + includeFile);
                }
            }
            for (let n = 0; n < classes.length; n++) {
                const clazz = classes[n];
                fileWriter.writeLine(0, 'class ' + clazz.name + '{');
                for (let i = 0; i < clazz.methods.length; i++) {
                    const method = clazz.methods[i];
                    fileWriter.writeLine(1, method.visibility + ' ' + method.returnType + ' ' + method.name + this.paramsToString(method.methodArgs));
                }
                fileWriter.writeLine(0, '}');
                if (clazz.superClass) {
                    const filePath = path.parse(file);
                    fileWriter.writeBeforeLine(0, '!include ' + filePath.dir + '/' + clazz.superClass.toLowerCase() + '.uml');
                    fileWriter.writeLine(0, clazz.name + ' --|> ' + clazz.superClass);
                }
            }

            fileWriter.writeLine(0, '@enduml');
            fileWriter.closeFile();
        }
    }



    /**
 * Converts an array of parameter types to a string
 * @param  {string[]} paramTypes array of parameter type names
 * @return {string} - string representation
 * @private
 */
    paramsToString(paramTypes) {
        let result = '(';
        for (let n = 0; n < paramTypes.length; n++) {
            result += paramTypes[n];
            if (n < paramTypes.length - 1) {
                result += ',';
            }
        }

        result += ')';
        return result;
    }

/**
 * @param {string} inputDir - the fully qualified input directory
 * @param {string} outputDir - the fully qualified output directory
 * @param {string} filename - the fully qualified input file name (.js)
 * @return {string} the UML file name to use
 * @private
 */
    toUMLFilename(inputDir, outputDir, filename) {
        console.log('inputDir' + inputDir);
        console.log('outputDir' + outputDir);
        console.log('filename' + filename);

        let index = filename.indexOf(inputDir);
        console.log('index ' + index);
        let rest = filename.substr(index + 1 + inputDir.length);
    // let out = outputDir + '/' + rest;
        let i = rest.lastIndexOf('.');
    // console.log('result' + out.substr(0, i) + '.uml' );
        return (i < 0) ? '' : rest.substr(0, i) + '.uml';
    }
}



module.exports = PlantUMLGenerator;
