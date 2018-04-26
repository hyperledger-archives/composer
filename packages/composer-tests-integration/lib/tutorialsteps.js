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
const MDCodeExtractor = require('./md-code-extractor');

const codeBlocks = {
    developer: MDCodeExtractor.extract(path.join(__dirname, '../../composer-website/jekylldocs/tutorials/developer-tutorial.md'))
};

let selectedTutorial = null;
let selectedNetwork = null;
let currentFolder = null;

/**
 * @param {object} object - the object to find the key in
 * @param {string} identifier - the key to be found in the object preceded by identifiedBy: e.g. identifiedBy:penguin
 * @returns {string} the value in the object stored against the key passed, if the identifier value did not contain identifiedBy: it simply returns that value
 */
function getTextFromIdentifier(object, identifier) {
    if (/^identifiedBy\:/.test(identifier)) {
        return object[identifier.replace(/^identifiedBy\:/, '')];
    }
    return identifier;
}

/**
 * @param {string} subType a string of the sub-type attribute to be used for selecting the commands and arguments from code-blocks
 * @param {DataTable} table a data table containing the command and arguments along with values
 * @param {boolean} allowCD whether command can be run in a set directory
 * @returns {string} the command generated from the table
 */
function tableToCommand(subType, table, allowCD) {
    const tutorialCommands = codeBlocks[selectedTutorial].commands[subType];
    const tutorialArguments = codeBlocks[selectedTutorial].arguments[subType];

    let command = '';
    if (allowCD && currentFolder) {
        command = 'cd ' + currentFolder + ' && ';
    }

    const data = table.rowsHash();
    let previousType = tutorialCommands;
    Object.keys(data).forEach((key) => {
        let identifier = data[key];

        if (key === 'command') {
            command += getTextFromIdentifier(tutorialCommands, identifier) + ' ';
            previousType = tutorialCommands;
        } else if (key === '' ) {
            command = command.trim() + getTextFromIdentifier(previousType, identifier);
        } else {
            command += key + ' ' + getTextFromIdentifier(tutorialArguments, identifier) + ' ';
            previousType = tutorialArguments;
        }
    });
    return command;
}

module.exports = function () {

    this.Given(/^I am doing the (.*?) tutorial/, function(tutorial) {
        selectedTutorial = tutorial;
        return 1;
    });

    this.Given(/^I have used the tutorial to create a network called (.*?)$/, function(networkName) {
        selectedNetwork = networkName;
        return 1;
    });

    this.Given(/^I run the (.*?) command from the tutorial:/, {timeout: 240 * 1000}, function (subType, table) {
        if (!selectedTutorial) {
            throw new Error('A tutorial must be selected before running this command');
        }

        let command = tableToCommand(subType, table, true);

        return this.composer.runCLI(true, command);
    });

    this.Given(/^I run the (.*?) command from the tutorial substituting (.*?) with (.*?):/, {timeout: 240 * 1000}, function (subType, find, replace, table) {
        if (!selectedTutorial) {
            throw new Error('A tutorial must be selected before running this command');
        }

        let command = tableToCommand(subType, table, true);

        command = command.split(find).join(replace);

        return this.composer.runCLI(true, command);
    });

    this.Given(/^I run in the background the (.*?) command from the tutorial:/, {timeout: 240 * 1000}, async function (subType, table) {
        if (!selectedTutorial) {
            throw new Error('A tutorial must be selected before running this command');
        }

        const data = table.rowsHash();
        const identifier = data['wait for'];
        const tutorialArguments = codeBlocks[selectedTutorial].arguments[subType];

        let waitFor = new RegExp(getTextFromIdentifier(tutorialArguments, identifier));

        delete data['wait for'];

        let cleanTable = {
            rowsHash: () => {
                return data;
            }
        };

        let command = tableToCommand(subType, cleanTable, false);

        if(this.composer.tasks[subType.toUpperCase()]) {
            await this.composer.killBackground(subType.toUpperCase());
        }

        await this.composer.runBackground(subType.toUpperCase(), command, waitFor);
    });

    this.Given(/^I replace the contents of the following files made by the tutorial:/, function (table) {
        if (!selectedTutorial) {
            throw new Error('A tutorial must be selected before running this command');
        } else if (!selectedNetwork) {
            throw new Error('A network must be selected before running this command');
        }

        const tutorialFilepaths = codeBlocks[selectedTutorial].files.paths;
        const tutorialFileContents = codeBlocks[selectedTutorial].files.contents;

        const data = table.hashes();
        data.forEach((row) => {
            let filepath = path.join(__dirname, '../', selectedNetwork, row.folder, getTextFromIdentifier(tutorialFilepaths, row.filename));

            fs.writeFileSync(filepath, getTextFromIdentifier(tutorialFileContents, row.content), 'utf8');
        });
    });

    this.Given(/^I have navigated to the folder:/, function (folder) {
        currentFolder = path.join(process.cwd(), getTextFromIdentifier(codeBlocks[selectedTutorial].directories.paths, folder));
        return 1;
    });

    this.Given(/^I have navigated to the sub folder:/, function (folder) {
        if (!currentFolder) {
            throw new Error('You must navigate to a folder before you can navigate to a sub folder');
        }
        currentFolder = path.join(currentFolder, getTextFromIdentifier(codeBlocks[selectedTutorial].directories.paths, folder));
        return 1;
    });

    this.Given(/^I make a request to the tutorials suggested app url:/, function(url) {
        return this.composer.request('GET', getTextFromIdentifier(codeBlocks[selectedTutorial].arguments.request, url));
    });
};