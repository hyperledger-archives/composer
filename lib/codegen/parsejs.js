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
const program = require('commander');
const acorn = require('acorn');
const PlantUMLGenerator = require('./fromjs/plantumlgenerator');
const APISignatureGenerator = require('./fromjs/apisignaturegenerator');

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
    //console.log( 'Processing ' + path );
    fs.readdir(path, function(err, files) {
        if (err) {
            console.error('Could not list the directory.', err);
            process.exit(1);
        }

        files.forEach(function(file, index) {
            let stats = fs.statSync(path + '/' + file);
            if (stats.isFile()) {
                processFile(path + '/' + file, fileProcessor);
            } else if (stats.isDirectory()) {
                processDirectory(path + '/' + file, fileProcessor);
            }
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
        let comments = [],
            tokens = [];

        let ast = acorn.parse(fileContents, {
            // collect ranges for each node
            ranges: true,
            // collect comments in Esprima's format
            onComment: comments,
            // collect token ranges
            onToken: tokens
        });

        const includes = [];
        const classes = [];
        const methods = [];

        for (let n = 0; n < ast.body.length; n++) {
            let statement = ast.body[n];

            if (statement.type === 'VariableDeclaration') {
                let variableDeclarations = statement.declarations;

                for (let n = 0; n < variableDeclarations.length; n++) {
                    let variableDeclaration = variableDeclarations[n];

                    if (variableDeclaration.init && variableDeclaration.init.type === 'CallExpression' &&
                        variableDeclaration.init.callee.name === 'require') {
                        let requireName = variableDeclaration.init.arguments[0].value;
                        // we only care about the code we require with a relative path
                        if (requireName.startsWith('.')) {
                            includes.push(variableDeclaration.init.arguments[0].value);
                        }
                    }
                }
            } else if (statement.type === 'ClassDeclaration') {
                let closestComment = findCommentBefore(statement.start, statement.end, comments);
                let privateClass = false;
                if(closestComment >= 0) {
                    let comment = comments[closestComment].value;
                    privateClass = getVisibility(comment) === '-';
                }

                if(privateClass === false || program.private) {

                    const clazz = { name: statement.id.name};
                    clazz.methods = [];

                    for(let n=0; n < statement.body.body.length; n++) {
                        let thing = statement.body.body[n];

                        if (thing.type === 'MethodDefinition') {

                            let closestComment = findCommentBefore(thing.key.start, thing.key.end, comments);
                            let returnType = '';
                            let visibility = '+';
                            let methodArgs = '()';
                            let throws = '';
                            if(closestComment >= 0) {
                                let comment = comments[closestComment].value;
                                returnType = getReturnType(comment);
                                visibility = getVisibility(comment);
                                methodArgs = getMethodArguments(comment);
                                throws = getThrows(comment);
                            }

                            if(visibility === '+' || program.private) {
                                const method = {
                                    visibility: visibility,
                                    returnType: returnType,
                                    name: thing.key.name,
                                    methodArgs: methodArgs,
                                    throws: throws
                                };
                                clazz.methods.push(method);
                            }
                        }
                    }

                    if (statement.superClass) {
                        clazz.superClass = statement.superClass.name;
                    }

                    classes.push(clazz);
                }
            } else if (statement.type === 'MethodDefinition') {

                let closestComment = findCommentBefore(statement.key.start, statement.key.end, comments);
                let returnType = '';
                let visibility = '+';
                let methodArgs = '()';
                let throws = '';
                if(closestComment >= 0) {
                    let comment = comments[closestComment].value;
                    returnType = getReturnType(comment);
                    visibility = getVisibility(comment);
                    methodArgs = getMethodArguments(comment);
                    throws = getThrows(comment);
                }

                const method = {
                    visibility: visibility,
                    returnType: returnType,
                    name: statement.key.name,
                    methodArgs: methodArgs,
                    throws: throws
                };

                methods.push(method);
            }
        }

        fileProcessor.generate(program, file, includes, classes, methods);
    }
}

/**
 * Find the comments that is above and closest to the start of the range.
 *
 * @param {integer} rangeStart - the start of the range
 * @param {integer} rangeEnd - the end of the range
 * @param {string[]} comments - the end of the range
 * @return {integer} the comment index or -1 if there are no comments
 * @private
 */
function findCommentBefore(rangeStart, rangeEnd, comments) {
    let foundIndex = -1;
    let distance = -1;

    for(let n=0; n < comments.length; n++) {
        let comment = comments[n];
        let endComment = comment.end;
        if(rangeStart > endComment ) {
            if(distance === -1 || rangeStart - endComment < distance) {
                distance = rangeStart - endComment;
                foundIndex = n;
            }
        }
    }

    return foundIndex;
}

/**
 * Extracts the visibilty from a comment block
 * @param {string} comment - the comment block
 * @return {string} the return visibility (either + for public, or - for private)
 * @private
 */
function getVisibility(comment) {
    const PRIVATE = '@private';
    let result = '+';
    let index = comment.indexOf(PRIVATE);
    if(index>=0) {
        result = '-';
    }
    return result;
}

/**
 * Extracts the return type from a comment block.
 * @param {string} comment - the comment block
 * @return {string} the return type of the comment
 * @private
 */
function getReturnType(comment) {
    const RETURN = '@return {';
    const RETURNS = '@returns {';

    let result = 'void';
    const indexReturn = comment.indexOf(RETURN);
    const indexReturns = comment.indexOf(RETURNS);
    let index = -1;

    if(indexReturns >= 0) {
        index = indexReturns;
    }
    else {
        index = indexReturn;
    }

    if(index>=0) {
        let end = comment.indexOf('}', index+RETURN.length+1);

        if(end > index) {
            result = comment.substring(index + RETURN.length, end);
        }
    }
    return result;
}

/**
 * Extracts the return type from a comment block.
 * @param {string} comment - the comment block
 * @return {string} the return type of the comment
 * @private
 */
function getThrows(comment) {
    const THROWS = '@throws {';
    const EXCEPTION = '@exception {';

    let result = '';
    const indexThrows = comment.indexOf(THROWS);
    const indexException = comment.indexOf(EXCEPTION);
    let index = -1;

    if(indexThrows >= 0) {
        index = indexThrows;
    }
    else {
        index = indexException;
    }

    if(index>=0) {
        let end = comment.indexOf('}', index+THROWS.length+1);

        if(end > index) {
            result = comment.substring(index + THROWS.length, end);
        }
    }
    return result;
}

/**
 * Extracts the method arguments from a comment block.
 * @param {string} comment - the comment block
 * @return {string} the the argument types
 * @private
 */
function getMethodArguments(comment) {
    const PARAM = '@param {';
    let paramTypes = [];
    let index = comment.indexOf(PARAM);

    while(index>=0) {
        let end = comment.indexOf('}', index+PARAM.length+1);

        if(end > index) {
            let aParam = comment.substring(index + PARAM.length, end);
            paramTypes.push(aParam);
        }

        index = comment.indexOf(PARAM, end);
    }

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
