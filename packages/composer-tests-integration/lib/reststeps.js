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

const Composer = require('./composer');
const fs = require('fs');
const path = require('path');

module.exports = function () {

    /**
     * Start the REST server.
     * @param {string} name The name of the REST server.
     * @param {*} [additionalArguments] Any additional command line arguments for the REST server.
     */
    async function startRestServer(name, additionalArguments = []) {
        if(this.composer.tasks.REST_SVR) {
            await this.composer.killBackground('REST_SVR');
        }
        await this.composer.deployBusinessNetworkFromDirectory(name);
        const adminId = `admin@${name}`;
        const command = [`composer-rest-server --card ${adminId} -n never -w true`].concat(additionalArguments).join(' ');
        await this.composer.runBackground('REST_SVR', command, /Browse your REST API/);
    }

    this.Given(/^I have a REST API server for (.+?)$/, {timeout: 240 * 1000}, async function (name) {
        delete process.env.COMPOSER_PROVIDERS;
        await startRestServer.apply(this, [name]);
    });

    this.Given('I have a secured REST API server for {word} using API key {string}', {timeout: 240 * 1000}, async function (name, apiKey) {
        delete process.env.COMPOSER_PROVIDERS;
        await startRestServer.apply(this, [name, ['--apikey', apiKey]]);
    });

    this.Given(/^I have an authenticated REST API server for (.+?)$/, {timeout: 240 * 1000}, async function (name) {
        const port = fs.readFileSync(path.resolve(__dirname, '..', 'ldap.port'));
        process.env.COMPOSER_PROVIDERS = JSON.stringify({
            ldap: {
                provider: 'ldap',
                module: 'passport-ldapauth',
                authPath: '/auth/ldap',
                callbackURL: '/auth/ldap/callback',
                successRedirect: '/',
                failureRedirect: '/failure',
                authScheme: 'ldap',
                server: {
                    url: `ldap://localhost:${port}`,
                    bindDN: 'cn=root,dc=example,dc=org',
                    bindCredentials: 'secret',
                    searchBase: 'dc=example,dc=org',
                    searchFilter: '(uid={{username}})'
                }
            }
        });
        await startRestServer.apply(this, [name, ['-a']]);
    });

    this.Given(/^I have a multiple user REST API server for (.+?)$/, {timeout: 240 * 1000}, async function (name) {
        const port = fs.readFileSync(path.resolve(__dirname, '..', 'ldap.port'));
        process.env.COMPOSER_PROVIDERS = JSON.stringify({
            ldap: {
                provider: 'ldap',
                module: 'passport-ldapauth',
                authPath: '/auth/ldap',
                callbackURL: '/auth/ldap/callback',
                successRedirect: '/',
                failureRedirect: '/failure',
                authScheme: 'ldap',
                server: {
                    url: `ldap://localhost:${port}`,
                    bindDN: 'cn=root,dc=example,dc=org',
                    bindCredentials: 'secret',
                    searchBase: 'dc=example,dc=org',
                    searchFilter: '(uid={{username}})'
                }
            }
        });
        process.env.COMPOSER_DATASOURCES = JSON.stringify({
            db: {
                name: 'db',
                connector: 'mongodb',
                host: 'localhost'
            }
        });
        await startRestServer.apply(this, [name, ['-a', '-m']]);
    });

    this.Given('I have cleared the cookie jar', function () {
        return Composer.clearCookieJar();
    });

    this.When(/^I make a (GET|HEAD|DELETE) request to ([^ ]+?)$/, function (method, urlPath) {
        return this.composer.request(method, `http://localhost:3000${urlPath}`);
    });

    this.When(/^I make a POST request for an identity to (.+?)$/, function (urlPath, data) {
        const options = {
            encoding:null
        };
        return this.composer.request('POST', `http://localhost:3000${urlPath}`, data, options );
    });

    this.When(/^I make a (POST|PUT) request to (.+?)$/, function (method, urlPath, data) {
        return this.composer.request(method, `http://localhost:3000${urlPath}`, data);
    });

    this.When(/^I make a (POST|PUT) request with form data to (.+?)$/, function (method, urlPath, table) {
        const options = {
            formData: {}
        };
        table.hashes().forEach((hash) => {
            let { name, value } = hash;
            if (fs.existsSync(value)) {
                const fileName = value;
                const fileContents = fs.readFileSync(fileName);
                value = {
                    value: fileContents,
                    options: {
                        filename: path.basename(fileName)
                    }
                };
            }
            options.formData[name] = value;
        });
        return this.composer.request(method, `http://localhost:3000${urlPath}`, null, options);
    });

    this.When(/^I write the response data to a file (.+?)$/,function(name){
        return this.composer.writeResponseData(name);
    });

    this.When(/^I make a GET request to ([^ ]+?) with filter (.+?)$/, function (urlPath, filter) {
        return this.composer.request('GET', `http://localhost:3000${urlPath}` + '?filter=' + encodeURIComponent(filter));
    });

    this.When('I make a GET request to {word} with API key {string}', function (urlPath, apiKey) {
        const requestOptions = {
            headers: {
                'x-api-key': apiKey
            }
        };
        return this.composer.request('GET', `http://localhost:3000${urlPath}`, null, requestOptions);
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
