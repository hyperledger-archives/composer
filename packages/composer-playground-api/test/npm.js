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

const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
chai.use(require('chai-http'));
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const express = require('express');

let tarParserResult = [];

let callCount = 0;

/**
 *
 */
let RegClient = function () {
};

RegClient.prototype.fetch = function (url, options, callback) {

    let data = Buffer.from('1234');

    let entry = {
        path : 'my path',
        on : sinon.stub().callsArgWith(1, data)
    };

    let stream = {
        pipe : function (tarParser) {
            tarParserResult = tarParser.filter('bob.bna');

            return {
                on : sinon.stub().callsArgWith(1, entry)
            };
        }
    };

    if (url === 'error') {
        return callback('some error');
    } else {

        return callback(null, stream);
    }
};

// class methods
RegClient.prototype.get = function (url, options, callback) {
    callCount++;
    let getSampleNames = {
        objects : [{
            package : {
                name : 'bob'
            }
        }]
    };

    let getMetaData = {
        versions : {
            '0.1.0' : {
                engines : {
                    composer : '0.9.0'
                },
                name : 'bob',
                description : 'bob package',
                version : '1.0',
                dist : {
                    tarball : 'my tar'
                }
            },
            '0.2.0' : {
                name : 'jim',
                description : 'bob package',
                version : '1.0',
                dist : {
                    tarball : 'my tar'
                }
            },
            '0.3.0' : {
                engines : {},
                name : 'harry',
                description : 'bob package',
                version : '1.0',
                dist : {
                    tarball : 'my tar'
                }
            },
            '0.4.0' : {
                engines : {
                    composer : '0.7.0'
                },
                name : 'fred',
                description : 'fred package',
                version : '1.0',
                dist : {
                    tarball : 'my tar'
                }
            },
        }
    };

    if (url.startsWith('https://registry.npmjs.org/-/v1/search') && callCount === 3) {
        return callback('some error');
    } else if (url.startsWith('https://registry.npmjs.org/-/v1/search')) {
        return callback(null, getSampleNames);
    }

    if (url.startsWith('https://registry.npmjs.org/bob') && callCount === 5) {
        return callback('some error');
    } else if (url.startsWith('https://registry.npmjs.org/bob')) {
        return callback(null, getMetaData);
    }
};

describe('npm routes', () => {
    let mock;

    let app;

    beforeEach(() => {

        let pkginfo = function (module, thing) {
            module.exports[thing] = {
                'composer-common' : '^0.9.0'
            };
        };

        mock = {
            'pkginfo' : pkginfo,
            'npm-registry-client' : RegClient
        };

        app = express();

        let router = proxyquire('../routes/npm', mock);

        router(app);

        app.listen();


    });

    describe('GET /api/getSampleList', () => {
        it('should get the list of samples and exclude invalid ones', () => {
            return chai.request(app)
                .get('/api/getSampleList')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.an('array');
                    res.body.should.deep.equal([{
                        name : 'bob',
                        description : 'bob package',
                        version : '1.0',
                        tarball : 'my tar'
                    }]);
                });
        });

        it('should handle error  in getting list', () => {
            return chai.request(app)
                .get('/api/getSampleList')
                .then((res) => {
                    throw new Error('should not have got here');
                })
                .catch((err) => {
                    err.response.body.error.should.equal('some error');
                });
        });

        it('should handle error in getting metaData', () => {
            return chai.request(app)
                .get('/api/getSampleList')
                .query({tarball : 'error'})
                .then((res) => {
                    throw new Error('should not have got here');
                })
                .catch((err) => {
                    err.response.body.error.should.equal('some error');
                });
        });
    });

    describe('GET /api/downloadSample', () => {
        it('should download the chosen sample', () => {
            return chai.request(app)
                .get('/api/downloadSample')
                .query({tarball : 'my tarball'})
                .then((res) => {
                    res.should.have.status(200);
                    res.charset.should.equal('x-user-defined');
                    res.should.be.text;
                    res.text.should.equal('1234');

                    tarParserResult.length.should.equal(1);
                    tarParserResult[0].should.equal('.bna');
                });
        });

        it('should handle error', () => {
            return chai.request(app)
                .get('/api/downloadSample')
                .query({tarball : 'error'})
                .then((res) => {
                    throw new Error('should not have got here');
                })
                .catch((err) => {
                    err.response.body.error.should.equal('some error');
                });
        });
    });
});
