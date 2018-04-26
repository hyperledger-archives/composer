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

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const expectedFiles = ['acls.html', 'assets.html', 'class.html', 'enums.html', 'events.html', 'index.html', 'participants.html', 'queries.html', 'transactions.html'];

let outputFolder = null;

module.exports = function () {
    this.Given(/The generated output is to be placed in/, (folder) => {
        outputFolder = path.join(__dirname, '..', folder);
    });

    this.Then(/The generated files do not have an image in the nav bar/, () => {
        if (!outputFolder) {
            throw new Error('You must set the folder to look in before running this command');
        }
        expectedFiles.forEach((row) => {
            let file = row;
            let $ = cheerio.load(fs.readFileSync(path.join(outputFolder, file), 'utf8'));
            if ($('.navbar-docs img').attr('src') !== '') {
                throw new Error(`File ${file} has image in nav bar`);
            }
        });
    });

    this.Then(/The generated files should have the following image in the nav bar/, (image) => {
        if (!outputFolder) {
            throw new Error('You must set the folder to look in before running this command');
        }
        expectedFiles.forEach((file) => {
            let $ = cheerio.load(fs.readFileSync(path.join(outputFolder, file), 'utf8'));
            if ($('.navbar-docs img').attr('src') !== image) {
                throw new Error(`File ${file} does not have the image in nav bar`);
            }
        });
    });

    this.Then(/The generated files should have the following network name in the nav bar/, (name) => {
        if (!outputFolder) {
            throw new Error('You must set the folder to look in before running this command');
        }
        expectedFiles.forEach((file) => {
            let $ = cheerio.load(fs.readFileSync(path.join(outputFolder, file), 'utf8'));
            if ($('.navbar-brand b').text() !== name) {
                throw new Error(`File ${file} does not have the network name in nav bar`);
            }
        });
    });

    this.Then(/The index page should contain the readme for the (.+?)$/, (network) => {
        if (!outputFolder) {
            throw new Error('You must set the folder to look in before running this command');
        }
        let $ = cheerio.load(fs.readFileSync(path.join(outputFolder, 'index.html'), 'utf8'));
        // Strip all html formatting
        let indexReadMe = $('#readme').text().replace(/\s+/g, '').split('_').join('');

        let readme = fs.readFileSync(path.join(__dirname, '../resources/sample-networks', network, 'stripped-README.txt'), 'utf8').replace(/\s+/g, '').split('_').join('');

        if (!indexReadMe.includes(readme)) {
            throw new Error(`README text for ${network} not found in index page`);
        }
    });

    this.Then(/The summary should contain ([0-9]+) (.+?)$/, (number, type) => {
        if (!outputFolder) {
            throw new Error('You must set the folder to look in before running this command');
        }
        let $ = cheerio.load(fs.readFileSync(path.join(outputFolder, 'index.html'), 'utf8'));

        let getType = null;

        switch (type) {
        case 'asset':
        case 'assets':
            getType = 'asset';
            break;
        case 'participant':
        case 'participants':
            getType = 'participant';
            break;
        case 'transaction':
        case 'transactions':
            getType = 'transaction';
            break;
        default:
            throw new Error('Can only request asset, particpant or transaction');
        }

        let len = $(`#${getType}-definition`).next().children('tbody').first().children('tr').length;

        if (len.toString() !== number) {
            throw new Error(`Expected ${number} ${type} got ${len}`);
        }
    });

    this.Then(/The (.+?) page should contain the following (.+?)$/, (page, type, table) => {
        if (!outputFolder) {
            throw new Error('You must set the folder to look in before running this command');
        }
        let $ = cheerio.load(fs.readFileSync(path.join(outputFolder, page+'.html'), 'utf8'));

        let data = table.rows();
        data.forEach((row) => {
            if ($('body').find('#'+row[0].toLowerCase()).length === 0) {
                throw new Error(`Failed to find ${row[0]} on the ${page} page`);
            }
        });
    });

    this.Then(/The (.+?) page should contain no (.+?)$/, (page, type) => {
        if (!outputFolder) {
            throw new Error('You must set the folder to look in before running this command');
        }

        let $ = cheerio.load(fs.readFileSync(path.join(outputFolder, page+'.html'), 'utf8'));

        if ($('body').find('h4').length !== 0 || $('body').find('h3').length !== 0) {
            throw new Error(`The ${page} page contains ${type}`);
        }
    });
};