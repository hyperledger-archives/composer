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

const BrowserFS = require('browserfs/dist/node/index');
const bfs_fs = BrowserFS.BFSRequire('fs');
const FileWallet = require('../lib/filewallet');
const fs = require('fs');
const homedir = require('homedir');
const mkdirp = require('mkdirp');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('FileWallet', () => {

    let sandbox;
    let inmemfs;
    let fileWallet;
    let directory;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        inmemfs = new BrowserFS.FileSystem.InMemory();
        BrowserFS.initialize(inmemfs);
        fileWallet = new FileWallet({ fs: bfs_fs });
        directory = fileWallet.directory;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getHomeDirectory', () => {

        it('should return the home directory', () => {
            FileWallet.getHomeDirectory().should.equal(homedir());
        });

    });

    describe('#constructor', () => {

        it('should use the system fs implementation by default', () => {
            sandbox.stub(fs, 'readdir').yields(null, ['hello', 'there']);
            fileWallet = new FileWallet();
            return fileWallet.fs.readdir('hello')
                .should.eventually.be.deep.equal(['hello', 'there']);
        });

        it('should use the BrowserFS implementation if specified', () => {
            sandbox.stub(bfs_fs, 'readdir').yields(null, ['hello', 'there']);
            fileWallet = new FileWallet({ fs: bfs_fs });
            return fileWallet.fs.readdir('hello')
                .should.eventually.be.deep.equal(['hello', 'there']);
        });

        it('should use the home directory by default', () => {
            sandbox.stub(FileWallet, 'getHomeDirectory').returns('/home/doge1');
            fileWallet = new FileWallet();
            fileWallet.directory.should.equal(path.resolve('/home/doge1', '.composer-credentials'));
        });

        it('should use the root directory by default if no home directory available', () => {
            sandbox.stub(FileWallet, 'getHomeDirectory').returns(null);
            fileWallet = new FileWallet();
            fileWallet.directory.should.equal(path.resolve('/', '.composer-credentials'));
        });

        it('should use the specified directory', () => {
            fileWallet = new FileWallet({
                directory: '/var/composer'
            });
            fileWallet.directory.should.equal('/var/composer');
        });

    });

    describe('#list', () => {

        it('should return an empty array if directory does not exist', () => {
            return fileWallet.list()
                .should.eventually.be.deep.equal([]);
        });

        it('should return an empty array if directory exists but is empty', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            return fileWallet.list()
                .should.eventually.be.deep.equal([]);
        });

        it('should return an array of file names if directory exists and is not empty', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            bfs_fs.writeFileSync(path.resolve(directory, 'member.bob1'), 'hello world');
            bfs_fs.writeFileSync(path.resolve(directory, 'member.WebAppAdmin'), 'hello world');
            bfs_fs.writeFileSync(path.resolve(directory, 'member.alice1'), 'hello world');
            return fileWallet.list()
                .should.eventually.be.deep.equal(['member.WebAppAdmin', 'member.alice1', 'member.bob1']);
        });

    });

    describe('#contains', () => {

        it('should return false if directory does not exist', () => {
            return fileWallet.contains('member.bob1')
                .should.eventually.be.false;
        });

        it('should return false if directory exists but is empty', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            return fileWallet.contains('member.bob1')
                .should.eventually.be.false;
        });

        it('should return true if specified file exists', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            bfs_fs.writeFileSync(path.resolve(directory, 'member.bob1'), 'hello world');
            return fileWallet.contains('member.bob1')
                .should.eventually.be.true;
        });

    });

    describe('#get', () => {

        it('should throw if directory does not exist', () => {
            return fileWallet.get('member.bob1')
                .should.be.rejectedWith(/ENOENT/);
        });

        it('should throw if directory exists but is empty', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            return fileWallet.get('member.bob1')
                .should.be.rejectedWith(/ENOENT/);
        });

        it('should return file contents if specified file exists', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            bfs_fs.writeFileSync(path.resolve(directory, 'member.bob1'), 'hello world');
            return fileWallet.get('member.bob1')
                .should.eventually.be.equal('hello world');
        });

    });

    describe('#add', () => {

        it('should write the file if directory does not exist', () => {
            return fileWallet.add('member.bob1', 'hello world')
                .then(() => {
                    bfs_fs.readFileSync(path.resolve(directory, 'member.bob1'), 'utf8').should.equal('hello world');
                });
        });

        it('should write the file if directory exists but is empty', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            return fileWallet.add('member.bob1', 'hello world')
                .then(() => {
                    bfs_fs.readFileSync(path.resolve(directory, 'member.bob1'), 'utf8').should.equal('hello world');
                });
        });

        it('should throw if specified file exists', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            bfs_fs.writeFileSync(path.resolve(directory, 'member.bob1'), 'hello world');
            return fileWallet.add('member.bob1', 'hello world')
                .should.be.rejectedWith(/EEXIST/);
        });

    });

    describe('#update', () => {

        it('should throw if directory does not exist', () => {
            return fileWallet.update('member.bob1', 'hello world')
                .should.be.rejectedWith(/ENOENT/);
        });

        it('should throw if directory exists but is empty', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            return fileWallet.update('member.bob1', 'hello world')
                .should.be.rejectedWith(/ENOENT/);
        });

        it('should write the file if specified file exists', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            bfs_fs.writeFileSync(path.resolve(directory, 'member.bob1'), 'hello world');
            return fileWallet.update('member.bob1', 'world hello')
                .then(() => {
                    bfs_fs.readFileSync(path.resolve(directory, 'member.bob1'), 'utf8').should.equal('world hello');
                });
        });

    });

    describe('#remove', () => {

        it('should throw if directory does not exist', () => {
            return fileWallet.remove('member.bob1')
                .should.be.rejectedWith(/ENOENT/);
        });

        it('should throw if directory exists but is empty', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            return fileWallet.remove('member.bob1')
                .should.be.rejectedWith(/ENOENT/);
        });

        it('should delete the file if specified file exists', () => {
            mkdirp.sync(directory, { fs: bfs_fs });
            bfs_fs.writeFileSync(path.resolve(directory, 'member.bob1'), 'hello world');
            return fileWallet.remove('member.bob1')
                .then(() => {
                    bfs_fs.existsSync(path.resolve(directory, 'member.bob1'), 'utf8').should.be.false;
                });
        });

    });

});
