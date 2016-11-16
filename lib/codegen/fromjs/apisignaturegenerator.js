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
 */
class APISignatureGenerator {

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
                      method.methodArgs + ' ' + throws );
                }
                writer.writeLine(0, '}');
            }
            for(let n=0; n < methods.length; n++) {
                writer.writeLine(0, methods[n]);
            }

            fs.appendFileSync(program.outputDir + '/api.txt', writer.getBuffer());
        }
    }
}

module.exports = APISignatureGenerator;
