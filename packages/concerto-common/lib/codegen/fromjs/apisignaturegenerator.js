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
const Writer = require('../writer');

/**
 * Converts the includes, classes and methods in a Javascript
 * file into an API Signature File called api.txt, stored in the
 * output directory.
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class APISignatureGenerator {

    /**
     * @param {Object} program - the program arguments
     * @param {Object} file - the file instance being processed
     * @param {Object[]} includes - the includes (require statements) within the file
     * @param {Object[]} classes - the classes within the file
     * @param {Object[]} functions - the functions within the file
     */
    generate(program, file, includes, classes, functions) {
        // generate the output
        if(classes.length > 0 || functions.length > 0) {
            let writer = new Writer();
            for(let n=0; n < classes.length; n++) {
                const clazz = classes[n];
                let superType = '';
                if(clazz.superClass) {
                    superType = ' extends ' + clazz.superClass;
                }
                writer.writeLine(0, 'class ' + clazz.name + superType + ' {' );
                for(let i=0; i < clazz.methods.length; i++) {
                    const method = clazz.methods[i];
                    let throws = '';
                    if(method.throws) {
                        throws = 'throws ' + method.throws;
                    }
                    writer.writeLine(1, method.visibility +
                      ' ' + method.returnType + ' ' + method.name +
                      paramsToString(method.methodArgs) + ' ' + throws );
                }
                writer.writeLine(0, '}');
            }
            for(let n=0; n < functions.length; n++) {
                const func = functions[n];
                let throws = '';
                if(func.throws) {
                    throws = 'throws ' + func.throws;
                }
                writer.writeLine(1, func.visibility +
                ' ' + func.returnType + ' ' + func.name +
                paramsToString(func.methodArgs) + ' ' + throws );
            }

            fs.appendFileSync(program.outputDir + '/api.txt', writer.getBuffer());
        }
    }
}

/**
 * Converts an array of parameter types to a string
 * @param  {string[]} paramTypes array of parameter type names
 * @return {string} - string representation
 * @private
 */
function paramsToString(paramTypes) {
    let result = '(';
    for(let n=0; n < paramTypes.length; n++) {
        result += paramTypes[n];
        if(n < paramTypes.length-1) {
            result += ',';
        }
    }

    result += ')';
    return result;
}

module.exports = APISignatureGenerator;
