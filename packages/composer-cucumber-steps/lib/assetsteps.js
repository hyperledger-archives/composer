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

    this.Given(/^I have added the following assets? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.addAssets(namespace, name, table);
    });

    this.Given(/^I have added the following assets?$/, function (docString) {
        return this.composer.addAssets(null, null, docString);
    });

    this.When(/^I add the following assets? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.addAssets(namespace, name, table);
    });

    this.When(/^I add the following assets?$/, function (docString) {
        return this.composer.addAssets(null, null, docString);
    });

    this.When(/^I update the following assets? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.updateAssets(namespace, name, table);
    });

    this.When(/^I update the following assets?$/, function (docString) {
        return this.composer.updateAssets(null, null, docString);
    });

    this.When(/^I remove the following assets? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.removeAssets(namespace, name, table);
    });

    this.When(/^I remove the following assets?$/, function (docString) {
        return this.composer.removeAssets(null, null, docString);
    });

    this.Then(/^I should have the following assets? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.testAssets(namespace, name, table);
    });

    this.Then(/^I should have the following assets?$/, function (docString) {
        return this.composer.testAssets(null, null, docString);
    });

    this.Then(/^I should not have the following assets? of type ([.\w]+)\.(\w+)$/, function (namespace, name, table) {
        return this.composer.testNoAssets(namespace, name, table);
    });

    this.Then(/^I should not have the following assets?$/, function (docString) {
        return this.composer.testNoAssets(null, null, docString);
    });

};
