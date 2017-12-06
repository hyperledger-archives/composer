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

    this.When(/^I make a (GET|DELETE) request to (.+?)$/, function (method, path) {
        return this.composer.request(method, path);
    });

    this.When(/^I make a (POST|PUT) request to (.+?)$/, function (method, path, data) {
        return this.composer.request(method, path, data);
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
