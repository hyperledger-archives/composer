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

const Util = require('../lib/util');

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));

describe('GitHub routes', () => {

    let app;

    before(() => {
        app = Util.createApp();
    });

    beforeEach(() => {
        require('../routes/github')();
    });

    describe('GET /api/isOAuthEnabled', () => {

        it('should do something vaguely useful', () => {
            return chai.request(app)
                .get('/api/isOAuthEnabled')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.an('boolean');
                    res.body.should.be.false;
                });
        });

    });

    // describe('#getNpmInfo', () => {
    //     it('should get npm info', (done) => {
    //         npmError = null;
    //         npmStdout = '{\n test: 123 \n } \n';
    //         npmSterr = '';
    //         connectorServer.getNpmInfo('myModule', (err, response) => {
    //             should.not.exist(err);
    //             response.should.deep.equal({test : 123});
    //             done();
    //         });
    //     });

    //     it('should deal with error with npm info', (done) => {
    //         npmError = 'some error';
    //         npmStdout = '';
    //         npmSterr = '';
    //         connectorServer.getNpmInfo('myModule', (err) => {
    //             err.should.equal('some error');
    //             done();
    //         });
    //     });

    //     it('should deal with error in json', (done) => {
    //         npmError = null;
    //         npmStdout = '{\n test: 123 \n \n';
    //         npmSterr = '';
    //         //  nockExec('npm view myModule').reply(0, '{\n test: 123 \n  \n');
    //         connectorServer.getNpmInfo('myModule', (err) => {
    //             err.message.should.equal('Unexpected token )');
    //             done();
    //         });
    //     });
    // });

    // describe('#getGitHubClientId', () => {
    //     it('should return the client id', (done) => {
    //         connectorServer.getGithubClientId((err, response) => {
    //             response.should.equal('myClient');
    //             done();
    //         });
    //     });

    //     it('should not return the client id if not set', (done) => {
    //         configMock.clientId = null;
    //         connectorServer.getGithubClientId((err, response) => {
    //             should.not.exist(response);
    //             done();
    //         });
    //     });
    // });

    // describe('#getGitHubAccessToken', () => {
    //     it('should get the access token from github', (done) => {
    //         connectorServer.getGitHubAccessToken('1234', (err, response) => {
    //             response.access_token.should.equal('abcd');
    //             done();
    //         });
    //     });

    //     it('should deal with error from github', (done) => {
    //         requestMock.callsArgWith(1, 'some error');
    //         connectorServer.getGitHubAccessToken('1234', (err, response) => {
    //             err.should.equal('some error');
    //             done();
    //         });
    //     });
    // });

    // describe('#isOAuthEnabled', (done) => {
    //     it('should return true if client id and secret is set', (done) => {
    //         connectorServer.isOAuthEnabled((err, response) => {
    //             response.should.equal(true);
    //             done();
    //         });
    //     });

    //     it('should return false if client id or secret is not set', (done) => {
    //         configMock = {
    //             clientId: null,
    //             clientSecret: null
    //         };

    //         mock['../config/environment'] = configMock;

    //         const ConnectorServer = proxyquire('../lib/connectorserver', mock);

    //         connectorServer = new ConnectorServer(null, null, socketMock);

    //         connectorServer.isOAuthEnabled((err, response) => {
    //             response.should.equal(false);
    //             done();
    //         });
    //     });
    // });

});
