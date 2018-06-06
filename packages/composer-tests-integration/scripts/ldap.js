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

const fs = require('fs');
const ldap = require('ldapjs');

const authorize = function (req, res, next) {
    return next();
};

const suffix = 'dc=example, dc=org';
const domain = 'example.org';

const users = [{
    cn: 'root',
    name: 'Administrator',
    credentials: 'secret'
}, {
    cn: 'alice',
    name: 'Alice A',
    credentials: 'al1ceRuleZ'
}, {
    cn: 'bob',
    name: 'Bob B',
    credentials: 'b0bIsB3tt3r'
}, {
    cn: 'charlie',
    name: 'Charlie "Chuck" Norris',
    credentials: 'bl0ckn0rr1sw0zh3re'
}, {
    cn: 'dawn',
    name: 'Dawn Onme',
    credentials: 'itsN0tADataba5e'
}];

const db = {};
users.forEach((user) => {
    const { cn, name, credentials } = user;
    db[user.cn] = {
        dn: ldap.parseDN(`cn=${cn}, ${suffix}`),
        attributes: {
            uid: cn,
            name,
            mail: `${cn}@${domain}`
        },
        credentials
    };
});

process.on('SIGINT', function () {
    fs.unlinkSync('ldap.port');
});

(async () => {

    const server = ldap.createServer();

    server.bind(db.root.dn.toString(), function(req, res, next) {
        if (!req.dn.equals(db.root.dn) || req.credentials !== db.root.credentials) {
            return next(new ldap.InvalidCredentialsError());
        }
        res.end();
        return next();
    });

    server.bind(suffix, authorize, function(req, res, next) {
        for (const cn in db) {
            const user = db[cn];
            if (req.dn.equals(user.dn)) {
                if (req.credentials !== user.credentials) {
                    return next(new ldap.InvalidCredentialsError());
                }
                res.end();
                return next();
            }
        }
        return next(new ldap.InvalidCredentialsError());
    });

    server.search(suffix, authorize, function(req, res, next) {
        for (const cn in db) {
            const user = db[cn];
            if (user.attributes[req.filter.attribute] === req.filter.value) {
                res.send(user);
            }
        }
        res.end();
        return next();
    });

    await new Promise((resolve, reject) => {
        server.listen(0, (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        });
    });

    const port = server.address().port;
    fs.writeFileSync('ldap.port', port, { encoding: 'utf8' });
    process.send('ready');

})();
