/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const MemoryConnectionProfileStore = require('../lib/memoryconnectionprofilestore');

const homedir = require('homedir');
const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
//const sinon = require('sinon');

describe('MemoryConnectionProfileStore', () => {

    describe('#loadConnectionProfile', () => {

        it('should save and load data', () => {

            let cps = new MemoryConnectionProfileStore();
            const profileData = { one : 'one', two: 'two'};
            return cps.save('test', profileData )
                .then(() => {
                    cps.fileSystem.statSync( homedir() + '/concerto-connection-profiles/test/connection.json');
                    return cps.load('test');
                })
                .then((loadedProfile) => {
                    loadedProfile.should.deep.equal(profileData);
                });
        });
    });
});
