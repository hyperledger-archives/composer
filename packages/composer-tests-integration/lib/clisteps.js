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

module.exports = function () {

    this.Given(/^I have admin business cards available/, function () {
        return this.composer.setup();
    });

    this.Given(/^I have the following (.+?)$/, function (type, table) {
        return this.composer.checkExists(type, table);
    });

    this.Given(/^I have saved the secret in file to (.+?)$/, function(alias, cardFile) {
        return this.composer.extractSecret(alias, cardFile);
    });

    this.Given(/^I have deployed the business network (.+?)$/, {timeout: 360 * 1000}, async function (name) {
        // These steps assume that the arg «name» is the business network path,
        // and is located in ./resource/sample-networks

        if(this.composer.busnets[name]) {
            // Already deployed
            return;
        } else {
            this.composer.busnets[name] = name;
        }

        const bnaFile = `./tmp/${name}.bna`;
        const adminId = `admin@${name}`;
        const success = /Command succeeded/;
        const checkOutput = (response) => {
            if(!response.stdout.match(success)) {
                throw new Error(response);
            }
        };

        let response = await this.composer.runCLI(true, `composer runtime install --card TestPeerAdmin@org1 --businessNetworkName ${name}`);
        checkOutput(response);
        response = await this.composer.runCLI(true, `composer runtime install --card TestPeerAdmin@org2 --businessNetworkName ${name}`);
        checkOutput(response);
        response = await this.composer.runCLI(true, `composer archive create -t dir -a ./tmp/${name}.bna -n ./resources/sample-networks/${name}`);
        checkOutput(response);
        response = await this.composer.runCLI(true, `composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ${bnaFile} --file networkadmin.card`);
        checkOutput(response);
        response = await this.composer.runCLI(undefined, `composer card delete -n ${adminId}`);
        // can't check the response here, if it exists the card is deleted and you get a success
        // if it didn't exist then you get a failed message. however if there is a problem then the
        // import won't work so check the response to this.
        response = await this.composer.runCLI(true, 'composer card import --file networkadmin.card');
        checkOutput(response);
    });

    this.Given(/^I have a deployed the bna (.+?)$/, {timeout: 360 * 1000}, async function (name) {
        // These steps assume that the arg «name» is the business network archive file name,
        // and is located in ./tmp/«name».bna

        const bnaFile = `./tmp/${name}.bna`;
        const adminId = `admin@${name}`;
        const success = /Command succeeded/;
        const checkOutput = (response) => {
            if(!response.stdout.match(success)) {
                throw new Error(response);
            }
        };

        let response = await this.composer.runCLI(true, `composer runtime install --card TestPeerAdmin@org1 --businessNetworkName ${name}`);
        checkOutput(response);
        response = await this.composer.runCLI(true, `composer runtime install --card TestPeerAdmin@org2 --businessNetworkName ${name}`);
        checkOutput(response);
        response = await this.composer.runCLI(true, `composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ${bnaFile} --file networkadmin.card`);
        checkOutput(response);
        response = await this.composer.runCLI(undefined, `composer card delete -n ${adminId}`);
        // can't check the response here, if it exists the card is deleted and you get a success
        // if it didn't exist then you get a failed message. however if there is a problem then the
        // import won't work so check the response to this.
        response = await this.composer.runCLI(true, 'composer card import --file networkadmin.card');
        checkOutput(response);
    });

    this.When(/^I run the following expected (.*?) CLI command/, {timeout: 240 * 1000}, function (condition, table) {
        let pass = condition === 'pass' ? true : false;
        return this.composer.runCLI(pass, table);
    });

    this.When(/^I substitue the alias (.*?) and run an expected (.*?) CLI command$/, {timeout: 240 * 1000}, function (alias, pass, table) {
        return this.composer.runCLIWithAlias(alias, pass, table);
    });

    this.When(/^I spawn the following background task (.+?), and wait for \/(.+?)\/$/, {timeout: 240 * 1000}, function (label, regex, table) {
        return this.composer.runBackground(label, table, new RegExp(regex));
    });

    this.When(/^I kill task named (.+?)$/, {timeout: 240 * 1000}, function (label) {
        return this.composer.killBackground(label);
    });

    this.When(/^I save group (.+?) from the console output matching pattern (.+?) as alias (.*?)$/, function (group, regex, alias) {
        return this.composer.saveMatchingGroupAsAlias(new RegExp(regex, 'g'), group, alias);
    });

    this.When(/^I convert a card to be HSM managed$/, function (cardFile) {
        return this.composer.convertToHSM(cardFile);
    });

    this.Then(/^The stdout information should include text matching \/(.+?)\/$/, function (regex) {
        return this.composer.checkConsoleOutput(new RegExp(regex), false);
    });

    this.Then(/^The stderr information should include text matching \/(.+?)\/$/, function (regex) {
        return this.composer.checkConsoleOutput(new RegExp(regex), true);
    });

    this.Then(/^A new file matching this regex should be created \/(.+?)\/$/, function (regex) {
        return this.composer.checkFileWasCreated(new RegExp(regex));
    });
};
