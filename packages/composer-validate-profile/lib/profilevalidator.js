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
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const ajv = require('ajv');
const chalk = require('chalk');

const ajvconfig = {
    allErrors : true
};

/**
 * validateProfile
 * validates connection profile
 * @param {String} filename the input filename
 * @param {String} schematype the desired schema 'composer' (default and more restrictive) or 'fabric'
 */
function validateProfile(filename, schematype) {
    let path = validateInputFilename(filename);
    let profile = loadProfile(path);
    let schema = loadSchema(schematype);
    let validate = new ajv(ajvconfig).compile(schema);
    console.log(chalk.blue('\nValidating profile file: ') + chalk.blue.bold(filename));
    validate(profile);
    if(validate.errors) {
        console.log(chalk.red.bold('ERROR: ') + chalk.red('the profile contains the following errors\n'));
        validate.errors.forEach(err => {
            this.reportError(err);
        });
    } else {
        console.log(chalk.blue.bold('SUCCESS: ') + chalk.blue('the profile is valid\n'));
    }
}

/**
 * reportErrors
 * @param {Object} error the error
 */
function reportError(error) {
    console.log(typeof error);
    console.log(error);
}

/**
 * Validate the input
 * @param {String} filename input file to validate
 * @return {String} the path to the file to load
 */
function validateInputFilename(filename) {
    if(!filename) {
        throw new Error('Error: no file name specified');
    }
    const isJSON = filename.toLowerCase().endsWith('json');
    const isYAML = filename.toLowerCase().endsWith('yaml');
    if(!isJSON && !isYAML) {
        throw Error( 'Usage ERROR: please supply a JSON or YAML connection profile');
    }
    const filePath = path.resolve(filename);
    return filePath;
}

/**
 * Loads the profile into an object for validation.
 * @param {String} inputPath the path to the file to load
 * @return {Object} JSON profile object
 */
function loadProfile(inputPath) {
    const filePath = path.resolve(inputPath);
    if (filePath.toLowerCase().endsWith('json')) {
        return JSON.parse(readFileSync(filePath));
    } else {
        return yaml.safeLoad(readFileSync(filePath));
    }
}

/**
 * Loads the JSON Schema into an object for compilation.
 * @param {String} schematype the desired schema 'composer' (more restrictive) or 'fabric'
 * @return {Object} JSON schema object
 */
function loadSchema(schematype) {
    let filepath;
    if(!schematype || schematype === 'composer') {
        filepath = path.resolve('./schema/ccpschema.json');
    } else if (schematype === 'fabric') {
        filepath = path.resolve('./schema/ccpschema.fabric.json');
    } else {
        throw new Error('Error: Invalid schema type specified');
    }
    return JSON.parse(readFileSync(filepath));
}

/**
 * Read a file from disc and return the result or throw an error.
 * @param {String} filePath file to load
 * @return {String} with contents or throws an error
*/
function readFileSync(filePath) {
    let content;
    content = fs.readFileSync(filePath, 'utf8');
    return content;
}

module.exports = { validateProfile, reportError };

