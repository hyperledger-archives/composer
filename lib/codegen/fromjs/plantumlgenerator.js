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

const fs = require('fs');
const path = require('path');
const FileWriter = require('../filewriter');

/**
 * Converts the includes, classes and methods in a Javascript
 * file into a PlantUML format file.
 * @private
 */
class PlantUMLGenerator {

    /**
     * @param {Object} program - the program arguments
     * @param {Object} file - the file instance being processed
     * @param {Object[]} includes - the includes (require statements) within the file
     * @param {Object[]} classes - the classes within the file
     * @param {Object[]} methods - the methods within the file
     */
    generate(program, file, includes, classes, methods) {
        // generate the output
        if(classes.length > 0 || methods.length > 0) {
            let fileWriter = new FileWriter(program.outputDir);
            const umlFilename = toUMLFilename(program.inputDir, program.outputDir, file);
            console.log('open file: ' + umlFilename);
            fileWriter.openFile(umlFilename);

            fileWriter.writeLine(0, '@startuml');
            for(let n=0; n < includes.length; n++) {
                // only include files that exist
                // the file may not exist if it was empty
                const includeFile = program.outputDir + '/' + includes[n] + '.uml';
                if (fs.existsSync(includeFile)) {
                    fileWriter.writeLine(0, '!include ' + includeFile);
                }
            }
            for(let n=0; n < classes.length; n++) {
                const clazz = classes[n];
                fileWriter.writeLine(0, 'class ' + clazz.name + '{');
                for(let i=0; i < clazz.methods.length; i++) {
                    const method = clazz.methods[i];
                    fileWriter.writeLine(1, method.visibility + ' ' + method.returnType + ' ' + method.name + method.methodArgs );
                }
                fileWriter.writeLine(0, '}');
                if(clazz.superClass) {
                    const filePath = path.parse(file);
                    fileWriter.writeBeforeLine(0, '!include ' +  filePath.dir + '/' + clazz.superClass.toLowerCase() + '.uml');
                    fileWriter.writeLine(0, clazz.name + ' --|> ' + clazz.superClass);
                }
            }
            for(let n=0; n < methods.length; n++) {
                fileWriter.writeLine(0, methods[n]);
            }
            fileWriter.writeLine(0, '@enduml');
            fileWriter.closeFile();
        }
    }
}

/**
 * @param {string} inputDir - the fully qualified input directory
 * @param {string} outputDir - the fully qualified output directory
 * @param {string} filename - the fully qualified input file name (.js)
 * @return {string} the UML file name to use
 * @private
 */
function toUMLFilename(inputDir, outputDir, filename) {
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

module.exports = PlantUMLGenerator;
