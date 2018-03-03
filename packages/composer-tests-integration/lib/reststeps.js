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

    this.Given(/^I have a REST API server for (.+?)$/, {timeout: 240 * 1000}, async function (name) {
        // These steps assume that the arg «name» is the business network name,
        // and the business network resources are located at ./resources/sample-networks/«name»
        if(this.composer.tasks.REST_SVR) {
            // REST API server already running
            return;
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
        response = await this.composer.runCLI(true, `composer archive create -t dir -a ${bnaFile} -n ./resources/sample-networks/${name}`);
        checkOutput(response);
        response = await this.composer.runCLI(true, `composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ${bnaFile} --file networkadmin.card`);
        checkOutput(response);
        response = await this.composer.runCLI(undefined, `composer card delete -n ${adminId}`);
        // can't check the response here, if it exists the card is deleted and you get a success
        // if it didn't exist then you get a failed message. however if there is a problem then the
        // import won't work so check the response to this.
        response = await this.composer.runCLI(true, 'composer card import --file networkadmin.card');
        checkOutput(response);
        await this.composer.runBackground('REST_SVR', `composer-rest-server --card ${adminId} -n never -w true`, /Browse your REST API/);
    });

    this.When(/^I make a (GET|HEAD|DELETE) request to ([^ ]+?)$/, function (method, path) {
        return this.composer.request(method, path);
    });

    this.When(/^I make a (POST|PUT) request to (.+?)$/, function (method, path, data) {
        return this.composer.request(method, path, data);
    });

    this.When(/^I make a GET request to ([^ ]+?) with filter (.+?)$/, function (path, filter) {
        return this.composer.request('GET', path + '?filter=' + encodeURIComponent(filter));
    });

    this.When('I shutdown the REST server', function() {
        return this.composer.killBackground('REST_SVR');
    });

    this.Then(/^The response code should be ([0-9]+)$/, function (code) {
        return this.composer.checkResponseCode(code);
    });

    this.Then(/^The response body should include text matching \/(.+?)\/$/, function (regex) {
        return this.composer.checkResponseBody(new RegExp(regex));
    });

    this.Then('The response body should be JSON matching', function (pattern) {
        return this.composer.checkResponseJSON(pattern);
    });

};
