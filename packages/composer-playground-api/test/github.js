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

//const Util = require('../lib/util');
//const bodyParser = require('body-parser');
const chai = require('chai');
const should = chai.should();
chai.use(require('chai-http'));
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const express = require('express');

describe('GitHub routes', () => {

    let npmError;
    let npmStdout;
    let npmSterr;
    let mock;
    let requestMock = sinon.stub();
    let configMock;

    let app;

    beforeEach(() => {
        //require('../routes/github')();

        let execStub = ((command, execFunction) => {
            execFunction(npmError, npmStdout, npmSterr);
        });

        let response = {
            body : {
                access_token : 'abcd'
            }
        };

        requestMock.callsArgWith(1, null, response);

        configMock = {
            clientId : 'myClient',
            clientSecret : 'mySecret'
        };

        mock = {
            child_process : {'exec' : execStub},
            request : requestMock,
            '../config/environment' : configMock
        };

        //app = Util.createApp();

        app = express();

        let router = proxyquire('../routes/github', mock);

        router(app);

        //app.use('/', ());

        app.listen();


    });

    /**afterEach(function (done) {

    });**/

    describe('GET /api/isOAuthEnabled', () => {

        it('should return true if config set', () => {
            return chai.request(app)
                .get('/api/isOAuthEnabled')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.an('boolean');
                    res.body.should.be.true;
                });
        });

        it('should return false if client id or secret is not set', () => {
            configMock = {
                clientId : null,
                clientSecret : null
            };

            mock['../config/environment'] = configMock;

            let appErr = express();
            let router = proxyquire('../routes/github', mock);
            router(appErr);
            appErr.listen();

            return chai.request(appErr)
                .get('/api/isOAuthEnabled')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.an('boolean');
                    res.body.should.be.false;
                });
        });

    });

    describe('#getNpmInfo', () => {
        it('should get npm info', () => {
            npmError = null;
            npmStdout = '{\n test: 123 \n } \n';
            npmSterr = '';

            return chai.request(app)
                .get('/api/getNpmInfo/myModule')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.deep.equal({test : 123});
                });
        });

        it('should deal with error with npm info', () => {
            npmError = 'some error';
            npmStdout = '';
            npmSterr = '';
            return chai.request(app)
                .get('/api/getNpmInfo/myModule')
                .then((res) => {
                    throw new Error('should not have got here');
                })
                .catch(err => {
                    err.response.body.error.should.equal('some error');

                });
        });

        it('should deal with error in json', () => {
            npmError = null;
            npmStdout = '{\n test: 123 \n \n';
            npmSterr = '';

            return chai.request(app)
                .get('/api/getNpmInfo/myModule')
                .then((res) => {
                    throw new Error('should not have got here');
                })
                .catch(err => {
                    err.response.body.error.should.equal('Unexpected token )');

                });
        });
    });

    describe('#getGitHubClientId', () => {
        it('should return the client id', () => {
            return chai.request(app)
                .get('/api/getGithubClientId')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.equal('myClient');
                });
        });

        it('should not return the client id if not set', () => {
            configMock.clientId = null;
            return chai.request(app)
                .get('/api/getGithubClientId')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    should.not.exist(res.body);
                });
        });
    });

    describe('#getGitHubAccessToken', () => {
        it('should get the access token from github', () => {
            return chai.request(app)
                .get('/api/getGitHubAccessToken/1234')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.access_token.should.equal('abcd');
                });
        });

        it('should deal with error from github', () => {
            requestMock.callsArgWith(1, 'some error');

            return chai.request(app)
                .get('/api/getGitHubAccessToken/1234')
                .then((res) => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.response.body.error.should.equal('some error');
                });
        });
    });
});
