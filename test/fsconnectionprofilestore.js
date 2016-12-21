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

const BrowserFS = require('browserfs/dist/node/index');
const bfs_fs = BrowserFS.BFSRequire('fs');
const FSConnectionProfileStore = require('../lib/fsconnectionprofilestore');

const homedir = require('homedir');
const mkdirp = require('mkdirp');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('FSConnectionProfileStore', () => {

    let cps;

    beforeEach(() => {
        let inmemfs = new BrowserFS.FileSystem.InMemory();
        BrowserFS.initialize(inmemfs);
        cps = new FSConnectionProfileStore(bfs_fs);
    });

    describe('#constructor', () => {

        it('should handle missing fs', () => {
            (() => {
                new FSConnectionProfileStore();
            }).should.throw(Error,'Must create FSConnectionProfileStore with an fs implementation.');
        });

    });

    describe('#load', () => {

        it('should read all existing files', () => {
            let ccp = path.resolve(homedir(), '.concerto-connection-profiles');
            let ccp1 = path.resolve(ccp, 'profile1');
            mkdirp.sync(ccp1, { fs: bfs_fs });
            let ccp1f = path.resolve(ccp1, 'connection.json');
            bfs_fs.writeFileSync(ccp1f, JSON.stringify({
                profile: 'profile1'
            }));
            return cps.load('profile1')
                .should.eventually.be.deep.equal({
                    profile: 'profile1'
                });
        });

        it('should handle a missing connection JSON', () => {
            let ccp = path.resolve(homedir(), '.concerto-connection-profiles');
            let ccp1 = path.resolve(ccp, 'profile1');
            mkdirp.sync(ccp1, { fs: bfs_fs });
            // This one was accidentally deleted.
            // let ccp1f = path.resolve(ccp1, 'connection.json');
            // bfs_fs.writeFileSync(ccp1f, JSON.stringify({
            //     profile: 'profile1'
            // }));
            return cps.load('profile1')
                .should.be.rejectedWith(/Failed to load connection profile/);
        });

        it('should handle a missing connection profiles directory', () => {
            return cps.load('profile1')
                .should.be.rejectedWith(/Failed to load connection profile/);
        });

    });

    describe('#save', () => {

        it('should save the file', () => {
            let ccp = path.resolve(homedir(), '.concerto-connection-profiles');
            let ccp1 = path.resolve(ccp, 'profile1');
            let ccp1f = path.resolve(ccp1, 'connection.json');
            return cps.save('profile1', {
                profile: 'profile1'
            }).then(() => {
                let contents = bfs_fs.readFileSync(ccp1f);
                let profile = JSON.parse(contents);
                profile.should.be.deep.equal({
                    profile: 'profile1'
                });
            });
        });

        it('should handle any errors', () => {
            sinon.stub(cps.fs, 'writeFile').rejects();
            return cps.save('profile1', {
                profile: 'profile1'
            }).should.be.rejectedWith(/Failed to save connection profile/);
        });

    });

    describe('#loadAll', () => {

        it('should read all existing files', () => {
            let ccp = path.resolve(homedir(), '.concerto-connection-profiles');
            let ccp1 = path.resolve(ccp, 'profile1');
            let ccp2 = path.resolve(ccp, 'profile2');
            mkdirp.sync(ccp1, { fs: bfs_fs });
            mkdirp.sync(ccp2, { fs: bfs_fs });
            let ccp1f = path.resolve(ccp1, 'connection.json');
            let ccp2f = path.resolve(ccp2, 'connection.json');
            bfs_fs.writeFileSync(ccp1f, JSON.stringify({
                profile: 'profile1'
            }));
            bfs_fs.writeFileSync(ccp2f, JSON.stringify({
                profile: 'profile2'
            }));
            return cps.loadAll()
                .should.eventually.be.deep.equal({
                    profile1: {
                        profile: 'profile1'
                    }, profile2: {
                        profile: 'profile2'
                    }
                });
        });

        it('should handle a missing connection JSON', () => {
            let ccp = path.resolve(homedir(), '.concerto-connection-profiles');
            let ccp1 = path.resolve(ccp, 'profile1');
            let ccp2 = path.resolve(ccp, 'profile2');
            mkdirp.sync(ccp1, { fs: bfs_fs });
            mkdirp.sync(ccp2, { fs: bfs_fs });
            let ccp1f = path.resolve(ccp1, 'connection.json');
            // This one was accidentally deleted.
            // let ccp2f = path.resolve(ccp2, 'connection.json');
            bfs_fs.writeFileSync(ccp1f, JSON.stringify({
                profile: 'profile1'
            }));
            // bfs_fs.writeFileSync(ccp2f, JSON.stringify({
            //     profile: 'profile2'
            // }));
            return cps.loadAll()
                .should.eventually.be.deep.equal({
                    profile1: {
                        profile: 'profile1'
                    }
                });
        });

        it('should handle a missing connection profiles directory', () => {
            return cps.loadAll()
                .should.eventually.be.deep.equal({});
        });

    });

});
