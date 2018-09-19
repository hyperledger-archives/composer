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

const Logger = require('../../lib/log/logger');
const Tree = require('../../lib/log/tree.js');
const TreeNode = require('../../lib/log/node.js');
const fs = require('fs');
const mkdirp = require('mkdirp');
const WinstonInjector = require('../../lib/log/winstonInjector.js');
const Identifiable = require('../../lib/model/identifiable');
const Typed = require('../../lib/model/typed');

const chai = require('chai');

chai.use(require('chai-things'));
const mockery = require('mockery');
const sinon = require('sinon');

describe('Logger', () => {


    describe('#constructor', () => {

        it ('should setup default padding', ()=>{
            let logger = new Logger('testcode');
            logger.className.should.equals('testcode');
            logger.str25.length.should.equal(25);
            logger.str25.should.equals('                         ');
        });

    });

    describe('#intlog', ()=>{

        let sandbox;

        beforeEach(()=>{
            delete Logger._envDebug;
            delete process.env.DEBUG;
            delete Logger._config;
            delete Logger._clInstances;
            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            delete Logger._envDebug;
            delete process.env.DEBUG;
            delete Logger._config;
            delete Logger._clInstances;
            sandbox.restore();
        });

        it('should log to the functional logger', () => {
            let stubLogger=  {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            let logger = new Logger('ScriptManager');

            logger.intlog('debug','methodname','message');
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message');
        });

        it('should make the callback to get extra data', () => {
            let stubLogger=  {
                log: sinon.stub()
            };

            let callbackFn = sinon.stub().returns('data');
            Logger.setCallBack(callbackFn);
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            let logger = new Logger('ScriptManager');

            logger.intlog('debug','methodname','message');
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message');
            sinon.assert.calledOnce(callbackFn);
        });

        it('should make the callback to get extra data - but it returns undefined', () => {
            let stubLogger=  {
                log: sinon.stub()
            };

            let callbackFn = sinon.stub().returns(undefined);
            Logger.setCallBack(callbackFn);
            Logger.getCallBack().should.equal(callbackFn);
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            let logger = new Logger('ScriptManager');

            logger.intlog('debug','methodname','message');
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message');
            sinon.assert.calledOnce(callbackFn);
        });

        it('should log to the functional logger, multiargs', () => {
            let stubLogger=  {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            let logger = new Logger('ScriptManager');

            logger.intlog('debug','methodname','message','arg1','arg2','arg3');
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message',['arg1','arg2','arg3']);
        });

        it('should handle internal logger throwing an error', () => {
            let stubLogger=  {
                log: sinon.stub().onFirstCall().throws(new Error('I do not like the args'))
            };

            let stubArg2 = {
                toString: sinon.stub().returns('My To String')
            };

            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            let logger = new Logger('ScriptManager');

            logger.intlog('debug','methodname','message','arg1',stubArg2,'arg3');
            sinon.assert.calledTwice(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log.firstCall, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message',['arg1',stubArg2,'arg3']);
            sinon.assert.calledWith(stubLogger.log.secondCall, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message',['arg1','My To String','arg3']);
        });

        it('should log to the functional logger, errors', () => {
            let stubLogger=  {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            let logger = new Logger('ScriptManager');

            let err = new Error('Computer says no');
            err.cause = new Error('The diodes on my left side hurt');

            logger.intlog('debug','methodname','message','arg1',err,'arg3');
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message',['arg1',{'stack':sinon.match.any},'arg3']);
        });

        it('should log the `FullyQualifiedIdentifier` if of type Identifiable', () => {
            let stubLogger=  {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            const logger = new Logger('ScriptManager');

            // Create and send an 'Identifiable'
            const suchId = sinon.createStubInstance(Identifiable);
            suchId.getFullyQualifiedIdentifier.returns('suchQualifiedIdentifier');
            logger.intlog('debug','methodname','message',suchId);

            // Be assertive
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message',['suchQualifiedIdentifier']);
        });

        it('should log the `FullyQualifiedType` if of type Typed', () => {
            let stubLogger=  {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            const logger = new Logger('ScriptManager');

            // Create and send a 'Typed'
            const suchType = sinon.createStubInstance(Typed);
            suchType.getFullyQualifiedType.returns('suchQualifiedType');
            logger.intlog('debug','methodname','message',suchType);

            // Be assertive
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message',['suchQualifiedType']);
        });

        it('should truncate buffers that exceed the log length limit', () => {
            let stubLogger=  {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            const logger = new Logger('ScriptManager');

            // override the bufferLimit
            logger._maxLength = 10;

            // Create and send a buffer that exceed the limit set above
            const longBuff = Buffer.from('long message that is long for the sake of being long');
            logger.intlog('debug','methodname','message',longBuff);

            // Be assertive
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message',['long messa... truncated from original length of 52']);
        });

        it('should not truncate buffers that are under the log length limit', () => {
            let stubLogger=  {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(stubLogger);
            Logger._envDebug='composer[debug]:*';
            const logger = new Logger('ScriptManager');

            // override the bufferLimit
            logger._maxLength = 10000;

            // Create and send a buffer that is under the limit set above
            const shortBuff = Buffer.from('short message');
            logger.intlog('debug','methodname','message',shortBuff);

            // Be assertive
            sinon.assert.calledOnce(stubLogger.log);
            sinon.assert.calledWith(stubLogger.log, 'debug', sinon.match(/ScriptManager.*methodname\(\)/), 'message',['short message']);
        });

    });

    describe('#specificLevelMethods', () => {
        let logger;
        let levelsandbox;

        before(()=>{
            Logger._envDebug='composer[debug]:*';
            logger = Logger.getLog('ScriptManager');
            logger.logLevel=99;
        });

        beforeEach(() => {
            levelsandbox = sinon.sandbox.create();
            levelsandbox.stub(logger,'intlog');
        });

        afterEach(() => {
            levelsandbox.restore();
        });



        it('warn method should call warn level, no args', () => {
            logger.warn('Method', 'Message', 'Data');
            sinon.assert.calledOnce(logger.intlog);
            sinon.assert.calledWith(logger.intlog, 'warn', 'Method','Message','Data');
        });

        it('debug method should call debug level, no args', () => {
            logger.debug('Method', 'Message', 'Data');
            sinon.assert.calledOnce(logger.intlog);
            sinon.assert.calledWith(logger.intlog, 'debug', 'Method','Message','Data');
        });

        it('info method should call debug level, no args', () => {
            logger.info('Method', 'Message', 'Data');
            sinon.assert.calledOnce(logger.intlog);
            sinon.assert.calledWith(logger.intlog, 'info', 'Method','Message','Data');
        });

        it('verbose method should call debug level, no args', () => {
            logger.verbose('Method', 'Message', 'Data');
            sinon.assert.calledOnce(logger.intlog);
            sinon.assert.calledWith(logger.intlog, 'verbose', 'Method','Message','Data');
        });

        it('error method should call debug level, no args', () => {
            logger.error('Method', 'Message', 'Data');
            sinon.assert.calledOnce(logger.intlog);
            sinon.assert.calledWith(logger.intlog, 'error', 'Method','Message','Data');
        });

        it('entry method should call debug level, no args', () => {
            logger.entry('Method', 'Message', 'Data');
            sinon.assert.calledOnce(logger.intlog);
            sinon.assert.calledWith(logger.intlog, 'debug', 'Method','>','Message','Data');
        });

        it('exit method should call debug level, no args', () => {
            logger.exit('Method', 'Message', 'Data');
            sinon.assert.calledOnce(logger.intlog);
            sinon.assert.calledWith(logger.intlog, 'debug', 'Method','<','Message','Data');
        });
    });

    describe('#specificLevelMethods notincluded', () => {
        let logger;
        let levelsandbox;

        before(()=>{
            Logger._envDebug='composer[debug]:*';
            logger = Logger.getLog('ScriptManager');
            logger.logLevel=99;
            logger.include=false;
        });

        beforeEach(() => {
            levelsandbox = sinon.sandbox.create();
            levelsandbox.stub(logger,'intlog');
        });

        afterEach(() => {
            Logger.__reset();
            levelsandbox.restore();
        });

        it('warn method should call warn level, no args', () => {
            logger.warn('Method', 'Message', 'Data');
            sinon.assert.notCalled(logger.intlog);
        });

        it('debug method should call debug level, no args', () => {
            logger.debug('Method', 'Message', 'Data');
            sinon.assert.notCalled(logger.intlog);
        });

        it('info method should call debug level, no args', () => {
            logger.info('Method', 'Message', 'Data');
            sinon.assert.notCalled(logger.intlog);
        });

        it('verbose method should call debug level, no args', () => {
            logger.verbose('Method', 'Message', 'Data');
            sinon.assert.notCalled(logger.intlog);
        });

        it('error method should call debug level, no args', () => {
            logger.error('Method', 'Message', 'Data');
            sinon.assert.notCalled(logger.intlog);
        });

        it('entry method should call debug level, no args', () => {
            logger.entry('Method', 'Message', 'Data');
            sinon.assert.notCalled(logger.intlog);
        });

        it('exit method should call debug level, no args', () => {
            logger.exit('Method', 'Message', 'Data');
            sinon.assert.notCalled(logger.intlog);
        });
    });

    describe('#setLoggerCfg',()=>{
        let sandbox;

        beforeEach(()=>{
            Logger.__reset();
            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            Logger.__reset();
            sandbox.restore();
        });

        it('set the cfg, with force defaulting to false',()=>{
            let cfg = {
                'logger': './winstonInjector.js',
                'debug': 'composer[debug]:*',
                'console': {
                    'maxLevel': 'error'
                },
                'file': {
                    'maxLevel': 'none'
                }
            };

            sandbox.stub(Logger,'_loadLogger');
            sandbox.stub(Logger,'_setupLog');
            Logger.setLoggerCfg(cfg);
            sinon.assert.calledOnce(Logger._loadLogger);
            sinon.assert.notCalled(Logger._setupLog);

        });
        it('set the cfg, with force true',()=>{
            let cfg = {
                'logger': './winstonInjector.js',
                'debug': 'composer[debug]:*',
                'console': {
                    'maxLevel': 'error'
                },
                'file': {
                    'maxLevel': 'none'
                }
            };


            sandbox.stub(Logger,'_loadLogger');
            sandbox.stub(Logger,'_setupLog');
            Logger.getLog('wibble');
            Logger.setLoggerCfg(cfg,true);


            sinon.assert.calledOnce(Logger._loadLogger);
            sinon.assert.calledTwice(Logger._setupLog);
        });
        it('set the cfg twice, with force true',()=>{
            let cfg = {
                'logger': './winstonInjector.js',
                'debug': 'composer[debug]:*',
                'console': {
                    'maxLevel': 'error'
                },
                'file': {
                    'maxLevel': 'none'
                }
            };

            sandbox.stub(Logger,'_loadLogger');
            sandbox.stub(Logger,'_setupLog');
            Logger.setLoggerCfg(cfg,true);
            Logger.getLog('wibble');
            Logger.setLoggerCfg(cfg,true);
            sinon.assert.calledTwice(Logger._loadLogger);
            sinon.assert.calledTwice(Logger._setupLog);
        });

    });

    describe('#getLoggerCfg', () => {
        let sandbox;

        beforeEach(()=>{
            Logger.__reset();

            mockery.enable({
                warnOnReplace: false,
                warnOnUnregistered: false
            });

            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            mockery.deregisterAll();
            Logger.__reset();
            sandbox.restore();
        });


        it('should load the config module and use settings from that', () => {
            const mockConfig = {
                has: sinon.stub(),
                get: sinon.stub()
            };
            mockConfig.has.withArgs('composer.log.logger').returns(true);
            mockConfig.get.withArgs('composer.log.logger').returns('./myOwnLogger.js');
            mockConfig.has.withArgs('composer.log.file').returns(true);
            mockConfig.get.withArgs('composer.log.file').returns('filename');
            mockConfig.has.withArgs('composer.log.debug').returns(true);
            mockConfig.get.withArgs('composer.log.debug').returns('composer[debug]:*');
            mockConfig.has.withArgs('composer.log.console').returns(true);
            mockConfig.get.withArgs('composer.log.console').returns('console');
            mockery.registerMock('config', mockConfig);

            let treeStub = sinon.createStubInstance(Tree);
            sandbox.stub(Logger,'_parseLoggerConfig').returns(treeStub);


            let localConfig = Logger.processLoggerConfig();
            sinon.assert.calledOnce(Logger._parseLoggerConfig);
            localConfig.logger.should.equal('./myOwnLogger.js');
            localConfig.file.should.equal('filename');
            localConfig.debug.should.equal('composer[debug]:*');
            localConfig.console.should.equal('console');
        });


        it('should load the config module and use no settings as not present', () => {
            const mockConfig = {
                has: sinon.stub(),
                get: sinon.stub()
            };
            mockConfig.has.withArgs('composer.log.logger').returns(false);
            mockConfig.has.withArgs('composer.log.file').returns(false);
            mockConfig.has.withArgs('composer.log.debug').returns(false);
            mockConfig.has.withArgs('composer.log.console').returns(false);

            mockery.registerMock('config', mockConfig);

            let treeStub = sinon.createStubInstance(Tree);
            sandbox.stub(Logger,'_parseLoggerConfig').returns(treeStub);

            let localConfig = Logger.processLoggerConfig();
            sinon.assert.calledOnce(Logger._parseLoggerConfig);
            localConfig.logger.should.equal('./winstonInjector.js');

            localConfig.file.maxLevel.should.equal('silly');
            localConfig.debug.should.equal('composer[error]:*');
            localConfig.console.maxLevel.should.equal('none');
        });

    });

    describe('#getLoggerCfg', () => {
        let sandbox;

        beforeEach(()=>{
            Logger.__reset();
            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            Logger.__reset();
            sandbox.restore();
        });

        it('should return the correct set of cfg',()=>{
            Logger.getLog('randomname');
            sinon.assert.match(Logger.getLoggerCfg(),{});
        });

    });

    describe('#getLog', () => {
        let sandbox;

        beforeEach(()=>{
            Logger.__reset();
            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            Logger.__reset();
            sandbox.restore();
        });

        it('should return a new logger', () => {
            Logger.getLog('ScriptManager').should.be.an.instanceOf(Logger);
        });

        it('should return an existing logger', () => {
            const logger = Logger.getLog('ScriptManager');
            logger.should.be.an.instanceOf(Logger);
            const logger2 = Logger.getLog('ScriptManager');
            logger2.should.be.an.instanceOf(Logger);
            logger.should.equal(logger2);
        });

    });

    describe('#_setupLog', () => {

        let sandbox;

        afterEach(()=>{
            Logger.__reset();
            sandbox.restore();
        });

        beforeEach(() => {
            Logger.__reset();
            sandbox = sinon.sandbox.create();
        });

        it('should handle a logger class that should be included', () => {
            const composerLogger = {
                className: 'Connection'
            };
            let treeStub = sinon.createStubInstance(Tree);
            let nodeStub = sinon.createStubInstance(TreeNode);
            sandbox.stub(Logger, 'getLoggerCfg').returns({'config':'set'});
            sandbox.stub(Logger, '_loadLogger').returns(composerLogger);
            sandbox.stub(Logger,'getSelectionTree').returns(treeStub);
            treeStub.getNode.returns(nodeStub);
            nodeStub.isIncluded.returns(true);
            nodeStub.getLogLevel.returns(4);
            Logger._setupLog(composerLogger);
            composerLogger.include.should.be.true;
            composerLogger.logLevel.should.equal(4);
        });

        it('should handle a logger class that should be included (called twice)', () => {
            const composerLogger = {
                className: 'Connection'
            };
            let treeStub = sinon.createStubInstance(Tree);
            let nodeStub = sinon.createStubInstance(TreeNode);
            sandbox.stub(Logger, 'getLoggerCfg').returns({'config':'set'});
            sandbox.stub(Logger, '_loadLogger').returns(composerLogger);
            sandbox.stub(Logger,'getSelectionTree').returns(treeStub);
            treeStub.getNode.returns(nodeStub);
            nodeStub.isIncluded.returns(true);
            nodeStub.getLogLevel.returns(4);
            Logger._setupLog(composerLogger);

            // call twice to test the protection logic
            Logger._setupLog(composerLogger);
            composerLogger.include.should.be.true;
            composerLogger.logLevel.should.equal(4);
        });
    });

    describe('#_parseLoggerConfig', () => {
        let sandbox;

        beforeEach(()=>{
            Logger.__reset();
            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            Logger.__reset();
            sandbox.restore();
        });

        it('should not parse anything that is not composer', () => {
            const configElements = {'debug':'express'};
            sandbox.stub(Logger, 'getDebugEnv').returns();
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.false;
        });

        it('should parse a very wildcard logger configuration', () => {
            const configElements = {'debug':'*'};
            sandbox.stub(Logger, 'getDebugEnv').returns();
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.true;
        });

        it('should parse a wildcard logger configuration', () => {
            const configElements = {'debug':'composer:*'};
            sandbox.stub(Logger, 'getDebugEnv').returns();
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.true;
        });

        it('should parse a single logger configuration', () => {
            const configElements ={ 'debug':'composer:ScriptManager'};
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.false;
            tree.getInclusion('Connection').should.be.false;
            tree.getInclusion('ModelUtil').should.be.false;
            tree.getInclusion('ScriptManager').should.be.true;
        });

        it('should parse a single profile configuration', () => {
            const configElements ={ 'debug':'composer:acls'};
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.false;
            tree.getInclusion('AccessController').should.be.true;
        });

        it('should parse a multiple logger configuration', () => {
            const configElements = {'debug':'composer:Connection,composer:ScriptManager'};
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.false;
            tree.getInclusion('Connection').should.be.true;
            tree.getInclusion('ModelUtil').should.be.false;
            tree.getInclusion('ScriptManager').should.be.true;
        });

    });

    describe('#_loadLogger', () => {
        let sandbox;

        beforeEach(()=>{
            Logger.__reset();
            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            Logger.__reset();
            sandbox.restore();
        });

        it('should load a logger', () => {
            const loggerConfig = {
                logger: 'foolog',
                config: {
                    log: 'config',
                    more: 'details'
                }
            };
            const loggerModule = {
                getLogger: sinon.stub()
            };
            let stubLogger =  {
                log: sinon.stub()
            };
            loggerModule.getLogger.withArgs(loggerConfig).returns(stubLogger);
            mockery.registerMock('foolog', loggerModule);

            let actualLogger = Logger._loadLogger(loggerConfig);
            sinon.assert.calledOnce(loggerModule.getLogger);
            sinon.assert.calledWith(loggerModule.getLogger, loggerConfig);
            actualLogger.should.equal(stubLogger);
        });

        it('should use the null logger if the specified logger cannot be loaded', () => {
            const spy = sandbox.spy(console, 'error');
            const loggerConfig = {
                logger: 'dontexist',
                config: {
                    log: 'config',
                    more: 'details'
                }
            };
            const loggerModule = {
                getLogger: sinon.stub()
            };
            const mockLogger = {};
            loggerModule.getLogger.withArgs(loggerConfig).returns(mockLogger);
            sandbox.stub(Logger, 'getLoggerCfg').returns(loggerConfig);
            const actualLogger = Logger._loadLogger(loggerConfig);
            sinon.assert.calledWith(spy, sinon.match(/Failed to load logger module dontexist/));
            actualLogger.log('foo', 'bar');
        });

    });

    describe('#setCLIDefaults', () => {
        let sandbox;

        beforeEach(()=>{
            Logger.__reset();
            delete process.env.DEBUG;
            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            Logger.__reset();
            sandbox.restore();
        });

        it('should call setLoggerCfg with defaults for the cli', () => {
            sandbox.stub(Logger,'setLoggerCfg');
            Logger.setCLIDefaults();
            sinon.assert.calledOnce(Logger.setLoggerCfg);
            sinon.assert.calledWith(Logger.setLoggerCfg,{
                'console': {
                    'maxLevel': 'silly'
                },
                'debug' : 'composer[info]:*'
            },true);
        });

        it('should call setLoggerCfg with defaults for the cli, custom debug string', () => {
            sandbox.stub(Logger,'setLoggerCfg');
            process.env.DEBUG='Everything';
            Logger.setCLIDefaults();
            sinon.assert.calledOnce(Logger.setLoggerCfg);
            sinon.assert.calledWith(Logger.setLoggerCfg,{
                'console': {
                    'maxLevel': 'silly'
                },
                'debug' : 'Everything'
            },true);
        });
    });

    describe('#WinstonInjector',()=>{

        let sandbox;

        beforeEach(()=>{
            Logger.__reset();
            sandbox = sinon.sandbox.create();
        });

        afterEach(()=>{
            Logger.__reset();
            sandbox.restore();
        });
        it('additional code paths ',()=>{
            let config = {
                'console': {
                    'enabledLevel': 'info',
                    'alwaysLevel': 'none'

                },
                'file': {

                    'filename': 'trace_TIMESTAMP.log',
                    'enabledLevel': 'debug',
                    'alwaysLevel': 'error'
                }};

            WinstonInjector.getLogger(config);


        });

        it('dir for trace file can not be created',()=>{
            let config = {
                'console': {
                    'enabledLevel': 'info',
                    'alwaysLevel': 'none'

                },
                'file': {
                    'enabledLevel': 'debug',
                    'alwaysLevel': 'error'
                }};

            WinstonInjector.getLogger(config);
        });

        it('no filename specified',()=>{
            let config = {
                'console': {
                    'enabledLevel': 'info',
                    'alwaysLevel': 'none'

                },
                'file': {
                    'filename':'not/createable/at/all',
                    'enabledLevel': 'debug',
                    'alwaysLevel': 'error',
                    'maxFiles':'42'
                }};
            sandbox.stub(fs,'existsSync').returns(false);
            let syncStub = sandbox.stub(mkdirp, 'sync');
            syncStub.returns();

            WinstonInjector.getLogger(config);


        });

    });

    describe('#invokeAllLevels', ()=>{
        let logger = {
            debug:   sinon.stub(),
            entry: sinon.stub(),
            exit:  sinon.stub(),
            verbose: sinon.stub(),
            info: sinon.stub(),
            warn:  sinon.stub(),
            error: sinon.stub()
        };

        Logger.invokeAllLevels(logger);

        sinon.assert.calledOnce(logger.debug);
        sinon.assert.calledOnce(logger.entry);
        sinon.assert.calledOnce(logger.exit);
        sinon.assert.calledOnce(logger.verbose);
        sinon.assert.calledOnce(logger.info);
        sinon.assert.calledOnce(logger.warn);
        sinon.assert.calledOnce(logger.error);


    });

});
