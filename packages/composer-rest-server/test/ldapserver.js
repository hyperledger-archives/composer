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

const ldap = require('ldapjs');

const authorize = function (req, res, next) {
    return next();
};

const SUFFIX = 'dc=example, dc=org';
let server = null;

const db = {
    alice: {
        dn: 'cn=alice, dc=example, dc=org',
        attributes:  {
            uid: 'alice',
            name: 'Alice',
            mail: 'alice@example.org'
        }
    }
};

exports.start = function () {
    if (server) {
        return Promise.resolve();
    }

    server = ldap.createServer();

    server.bind('cn=root, dc=example, dc=org', function(req, res, next) {
        if (req.dn.toString() !== 'cn=root, dc=example, dc=org' || req.credentials !== 'secret') {
            return next(new ldap.InvalidCredentialsError());
        }
        res.end();
        return next();
    });

    server.bind(SUFFIX, authorize, function(req, res, next) {
        let dn = req.dn.toString();
        if (dn !== 'cn=alice, dc=example, dc=org' || req.credentials !== 'secret') {
            return next(new ldap.InvalidCredentialsError());
        }
        res.end();
        return next();
    });

    server.search(SUFFIX, authorize, function(req, res, next) {
        if (req.filter.attribute === 'uid' && req.filter.value === 'alice') {
            res.send(db.alice);
        }
        res.end();
        return next();
    });

    return new Promise((resolve, reject) => {
        server.listen(0, (error) => {
            if (error) {
                return reject(error);
            }
            resolve(server.address().port);
        });
    });
};

exports.close = function () {
    if (server) {
        server.close();
        server = null;
    }
};
