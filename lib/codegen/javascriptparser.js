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

const acorn = require('acorn');

/**
 * Processes a single Javascript file (.js extension)
 *
 * @param {string} file - the file to process
 * @param {Object} fileProcessor - the processor instance to use to generate code
 * @private
 */
class JavaScriptParser {

  /**
   * Create a JavaScriptParser.
   *
   * @param {string} fileContents - the text of the JS file to parse
   * @param {boolean} includePrivates - if true methods tagged as private are also returned
   */
    constructor(fileContents, includePrivates) {
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

        this.includes = [];
        this.classes = [];
        this.functions = [];

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
                            this.includes.push(variableDeclaration.init.arguments[0].value);
                        }
                    }
                }
            }
            else if (statement.type === 'FunctionDeclaration') {
                //console.log(JSON.stringify(statement));
                let closestComment = findCommentBefore(statement.start, statement.end, comments);
                let returnType = '';
                let visibility = '+';
                let parameterTypes = [];
                let parameterNames = [];
                let throws = '';
                if(closestComment >= 0) {
                    let comment = comments[closestComment].value;
                    //console.log('Found comment: ' + comment );
                    returnType = getReturnType(comment);
                    visibility = getVisibility(comment);
                    parameterTypes = getMethodArguments(comment);
                    throws = getThrows(comment);
                }

                if(visibility === '+' || includePrivates) {
                    for(let n=0; n < statement.params.length; n++) {
                        parameterNames.push(statement.params[n].name);
                    }
                    const func = {
                        visibility: visibility,
                        returnType: returnType,
                        name: statement.id.name,
                        parameterTypes: parameterTypes,
                        parameterNames: parameterNames,
                        throws: throws,
                        functionText : getText(statement.start, statement.end, fileContents)
                    };
                    console.log('Function: ' + JSON.stringify(func));
                    this.functions.push(func);
                }
            } else if (statement.type === 'ClassDeclaration') {
                let closestComment = findCommentBefore(statement.start, statement.end, comments);
                let privateClass = false;
                if(closestComment >= 0) {
                    let comment = comments[closestComment].value;
                    privateClass = getVisibility(comment) === '-';
                }

                if(privateClass === false || includePrivates) {

                    const clazz = { name: statement.id.name};
                    clazz.methods = [];

                    for(let n=0; n < statement.body.body.length; n++) {
                        let thing = statement.body.body[n];

                        if (thing.type === 'MethodDefinition') {

                            let closestComment = findCommentBefore(thing.key.start, thing.key.end, comments);
                            let returnType = '';
                            let visibility = '+';
                            let methodArgs = [];
                            let throws = '';
                            if(closestComment >= 0) {
                                let comment = comments[closestComment].value;
                                returnType = getReturnType(comment);
                                visibility = getVisibility(comment);
                                methodArgs = getMethodArguments(comment);
                                throws = getThrows(comment);
                            }

                            if(visibility === '+' || includePrivates) {
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

                    this.classes.push(clazz);
                }
            }
        }
    }

    /**
     * Return the includes that were extracted from the JS file.
     *
     * @return {Object[]} information about each include
     */
    getIncludes() {
        return this.includes;
    }

    /**
     * Return the classes that were extracted from the JS file.
     *
     * @return {Object[]} information about each class
     */
    getClasses() {
        return this.classes;
    }

    /**
     * Return the methods that were extracted from the JS file.
     *
     * @return {Object[]} information about each method
     */
    getFunctions() {
        return this.functions;
    }
}

/**
 * Grab the text between a range§
 *
 * @param {integer} rangeStart - the start of the range
 * @param {integer} rangeEnd - the end of the range
 * @param {string} source - the source text
 * @return {string} the text between start and end
 * @private
 */
function getText(rangeStart, rangeEnd, source) {
    return source.substring(rangeStart, rangeEnd);
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
    const PARAM = '@param';
    let paramTypes = [];
    let index = comment.indexOf(PARAM);

    while(index>=0) {
        let end = comment.indexOf('}', index+PARAM.length+1);

        if(end > index) {
            let aParam = comment.substring(index + PARAM.length, end);
            let openIndex = aParam.indexOf('{');
            if(openIndex >= 0) {
                paramTypes.push(aParam.substring(openIndex+1));
            }
            else {
                throw new Error('Malformed JSDoc comment: ' + comment );
            }
        }

        index = comment.indexOf(PARAM, end);
    }
    return paramTypes;
}

module.exports = JavaScriptParser;
