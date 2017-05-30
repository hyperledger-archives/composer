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

    this.Given(/^I have added the following participants? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.addParticipants(namespace, name, table);
    });

    this.Given(/^I have added the following participants?$/, function (docString) {
        return this.composer.addParticipants(null, null, docString);
    });

    this.When(/^I add the following participants? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.addParticipants(namespace, name, table);
    });

    this.When(/^I add the following participants?$/, function (docString) {
        return this.composer.addParticipants(null, null, docString);
    });

    this.When(/^I update the following participants? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.updateParticipants(namespace, name, table);
    });

    this.When(/^I update the following participants?$/, function (docString) {
        return this.composer.updateParticipants(null, null, docString);
    });

    this.When(/^I remove the following participants? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.removeParticipants(namespace, name, table);
    });

    this.When(/^I remove the following participants?$/, function (docString) {
        return this.composer.removeParticipants(null, null, docString);
    });

    this.Then(/^I should have the following participants? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.testParticipants(namespace, name, table);
    });

    this.Then(/^I should have the following participants?$/, function (docString) {
        return this.composer.testParticipants(null, null, docString);
    });

    this.Then(/^I should not have the following participants? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.testNoParticipants(namespace, name, table);
    });

    this.Then(/^I should not have the following participants?$/, function (docString) {
        return this.composer.testNoParticipants(null, null, docString);
    });

};
