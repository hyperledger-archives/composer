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

const WinstonInjector = require('../../lib/log/winstonInjector.js');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-things'));
const mockery = require('mockery');
const sinon = require('sinon');

describe('Logger', () => {

    let sandbox;

    beforeEach(() => {
        Logger.reset();
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
        mockery.deregisterAll();
        Logger.reset();
    });

    describe('#setLogLevel', () => {

        it('should fail for an unrecognized log level', () => {
            (() => {
                Logger.setLogLevel('BLAH');
            }).should.throw(/Unrecognized log level BLAH/);
        });

        ['info', 'debug', 'warn', 'error', 'verbose', 'INFO', 'DEBUG', 'WARN', 'ERROR', 'VERBOSE'].forEach((logLevel) => {
            it(`should not fail for a recognized log level ${logLevel}`, () => {
                (() => {
                    Logger.setLogLevel(logLevel);
                }).should.not.throw();
            });
        });


    });

    ['info', 'debug', 'warn', 'error', 'verbose'].forEach((logLevel) => {

        describe(`#${logLevel}`, () => {

            it('should log the message to the functional logger', () => {
                const functionalLogger = {
                    log: sinon.stub()
                };
                Logger.setFunctionalLogger(functionalLogger);
                const logger = Logger.getLog('ScriptManager');
                logger[logLevel]('Method', 'Message');
                sinon.assert.calledOnce(functionalLogger.log);
                sinon.assert.calledWith(functionalLogger.log, logLevel, sinon.match(/ScriptManager.*Method\(\)/), 'Message');
            });

            it('should log the message and arguments to the functional logger', () => {
                const functionalLogger = {
                    log: sinon.stub()
                };
                Logger.setFunctionalLogger(functionalLogger);
                const logger = Logger.getLog('ScriptManager');
                logger[logLevel]('Method', 'Message', 'Data');
                sinon.assert.calledOnce(functionalLogger.log);
                sinon.assert.calledWith(functionalLogger.log, logLevel, sinon.match(/ScriptManager.*Method\(\)/), 'Message', ['Data']);
            });

            it('should log an error to the functional logger', () => {
                const functionalLogger = {
                    log: sinon.stub()
                };
                Logger.setFunctionalLogger(functionalLogger);
                const logger = Logger.getLog('ScriptManager');
                const error = new Error('such error');
                logger[logLevel]('Method', 'Message', error);
                sinon.assert.calledOnce(functionalLogger.log);
                sinon.assert.calledWith(functionalLogger.log, logLevel, sinon.match(/ScriptManager.*Method\(\)/), 'Message', [{
                    stack: `{${error.name}}${error.message} ${error.stack}`.match(/[^\r\n]+/g)
                }]);
            });

            it('should not log the message to the functional logger if the log level is lower', () => {
                const useLogLevels = {
                    error: 'none',
                    warn: 'error',
                    info: 'warn',
                    verbose: 'info',
                    debug: 'verbose'
                };
                const useLogLevel = useLogLevels[logLevel];
                Logger.setLogLevel(useLogLevel);
                const functionalLogger = {
                    log: sinon.stub()
                };
                Logger.setFunctionalLogger(functionalLogger);
                const logger = Logger.getLog('ScriptManager');
                logger[logLevel]('Method', 'Message');
                sinon.assert.notCalled(functionalLogger.log);
            });

        });

    });

    describe('#entry', () => {

        it('should log to the functional logger', () => {
            const functionalLogger = {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(functionalLogger);
            const logger = Logger.getLog('ScriptManager');
            logger.entry('Method', 'Message', 'Data');
            sinon.assert.calledOnce(functionalLogger.log);
            sinon.assert.calledWith(functionalLogger.log, 'debug', sinon.match(/ScriptManager.*Method\(\)/), '>', ['Message', 'Data']);
        });

        it('should not log the message to the functional logger if the log level is lower', () => {
            Logger.setLogLevel('none');
            const functionalLogger = {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(functionalLogger);
            const logger = Logger.getLog('ScriptManager');
            logger.entry('Method', 'Message', 'Data');
            sinon.assert.notCalled(functionalLogger.log);
        });

    });

    describe('#exit', () => {

        it('should log to the functional logger', () => {
            const functionalLogger = {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(functionalLogger);
            const logger = Logger.getLog('ScriptManager');
            logger.exit('Method', 'Message', 'Data');
            sinon.assert.calledOnce(functionalLogger.log);
            sinon.assert.calledWith(functionalLogger.log, 'debug', sinon.match(/ScriptManager.*Method\(\)/), '<', ['Message', 'Data']);
        });

        it('should not log the message to the functional logger if the log level is lower', () => {
            Logger.setLogLevel('none');
            const functionalLogger = {
                log: sinon.stub()
            };
            Logger.setFunctionalLogger(functionalLogger);
            const logger = Logger.getLog('ScriptManager');
            logger.exit('Method', 'Message', 'Data');
            sinon.assert.notCalled(functionalLogger.log);
        });

    });

    describe('#getSelectionTree', () => {

        it('should return null by default', () => {
            should.equal(Logger.getSelectionTree(), null);
        });

    });

    describe('#setSelectionTree', () => {

        it('should set a new selection tree', () => {
            const tree = sinon.createStubInstance(Tree);
            Logger.setSelectionTree(tree);
            Logger.getSelectionTree().should.equal(tree);
        });

    });

    describe('#getFunctionalLogger', () => {

        it('should return null by default', () => {
            should.equal(Logger.getFunctionalLogger(), null);
        });

    });

    describe('#setFunctionalLogger', () => {

        it('should set a new functional logger', () => {
            const logger = {
                log: () => {

                }
            };
            Logger.setFunctionalLogger(logger);
            Logger.getFunctionalLogger().should.equal(logger);
        });

    });

    describe('#getDebugEnv', () => {

        beforeEach(() => {
            delete process.env.DEBUG;
            delete Logger._envDebug;
        });

        afterEach(() => {
            delete process.env.DEBUG;
            delete Logger._envDebug;
        });

        it('should return DEBUG environment variable if set', () => {
            process.env.DEBUG = 'composer:ScriptManager';
            Logger.getDebugEnv().should.equal('composer:ScriptManager');
        });

        it('should return _envDebug property if set', () => {
            Logger._envDebug = 'composer:Connection';
            Logger.getDebugEnv().should.equal('composer:Connection');
        });

        it('should return empty string when neither DEBUG or _envDebug are set', () => {
            Logger.getDebugEnv().should.equal('');
        });

    });

    describe('#getLoggerConfig', () => {

        it('should return the default winston logger', () => {
            Logger.getLoggerConfig().logger.should.equal('./winstonInjector.js');
        });

        it('should load the config module but ignore a missing composer.debug setting', () => {
            const mockConfig = {
                has: sinon.stub(),
                get: sinon.stub()
            };
            mockConfig.has.withArgs('composer.debug').returns(false);
            mockConfig.get.withArgs('composer.debug').throws(new Error('such error'));
            mockery.registerMock('config', mockConfig);
            Logger.getLoggerConfig().logger.should.equal('./winstonInjector.js');
        });

        it('should load the config module and use a present composer.debug setting', () => {
            const mockConfig = {
                has: sinon.stub(),
                get: sinon.stub()
            };
            mockConfig.has.withArgs('composer.debug').returns(true);
            mockConfig.get.withArgs('composer.debug').returns({
                logger: 'foolog'
            });
            mockery.registerMock('config', mockConfig);
            Logger.getLoggerConfig().logger.should.equal('foolog');
        });

    });

    describe('#getLog', () => {

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

        beforeEach(() => {
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
            const mockLogger = {};
            loggerModule.getLogger.returns(mockLogger);
            mockery.registerMock('foolog', loggerModule);
            sandbox.stub(Logger, 'getLoggerConfig').returns(loggerConfig);
        });

        it('should handle a logger class that should be included', () => {
            const composerLogger = {
                className: 'Connection'
            };
            sandbox.stub(Logger, 'getDebugEnv').returns('composer:Connection');
            Logger._setupLog(composerLogger);
            composerLogger.include.should.be.true;
        });

        it('should handle a logger class that should be included and cache the tree/logger', () => {
            const composerLogger = {
                className: 'Connection'
            };
            sandbox.stub(Logger, 'getDebugEnv').returns('composer:Connection');
            Logger._setupLog(composerLogger);
            const tree = Logger.getSelectionTree();
            const logger = Logger.getFunctionalLogger();
            Logger._setupLog(composerLogger);
            tree.should.equal(Logger.getSelectionTree());
            logger.should.equal(Logger.getFunctionalLogger());
            composerLogger.include.should.be.true;
        });

        it('should handle a logger class that should not be included', () => {
            const composerLogger = {
                className: 'Connection'
            };
            sandbox.stub(Logger, 'getDebugEnv').returns('composer:ScriptManager');
            Logger._setupLog(composerLogger);
            composerLogger.include.should.be.false;
        });

        it('should handle a logger class that should not be included and cache the tree/logger', () => {
            const composerLogger = {
                className: 'Connection'
            };
            sandbox.stub(Logger, 'getDebugEnv').returns('composer:ScriptManager');
            Logger._setupLog(composerLogger);
            const tree = Logger.getSelectionTree();
            const logger = Logger.getFunctionalLogger();
            Logger._setupLog(composerLogger);
            tree.should.equal(Logger.getSelectionTree());
            logger.should.equal(Logger.getFunctionalLogger());
            composerLogger.include.should.be.false;
        });

    });

    describe('#_parseLoggerConfig', () => {

        it('should parse a wildcard logger configuration', () => {
            const configElements = [];
            sandbox.stub(Logger, 'getDebugEnv').returns('composer:*');
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.true;
        });

        it('should parse a single logger configuration', () => {
            const configElements = [];
            sandbox.stub(Logger, 'getDebugEnv').returns('composer:ScriptManager');
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.false;
            tree.getInclusion('Connection').should.be.false;
            tree.getInclusion('ModelUtil').should.be.false;
            tree.getInclusion('ScriptManager').should.be.true;
        });

        it('should parse a multiple logger configuration', () => {
            const configElements = [];
            sandbox.stub(Logger, 'getDebugEnv').returns('composer:Connection,composer:ScriptManager');
            const tree = Logger._parseLoggerConfig(configElements);
            tree.should.be.an.instanceOf(Tree);
            tree.root.isIncluded().should.be.false;
            tree.getInclusion('Connection').should.be.true;
            tree.getInclusion('ModelUtil').should.be.false;
            tree.getInclusion('ScriptManager').should.be.true;
        });

    });

    describe('#_loadLogger', () => {

        const configElements = [ 'Connection', 'ModelUtil', 'ScriptManager' ];

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
            const mockLogger = {};
            loggerModule.getLogger.withArgs(loggerConfig.config, { debug: configElements }).returns(mockLogger);
            mockery.registerMock('foolog', loggerModule);
            sandbox.stub(Logger, 'getLoggerConfig').returns(loggerConfig);
            const actualLogger = Logger._loadLogger(configElements);
            sinon.assert.calledOnce(loggerModule.getLogger);
            sinon.assert.calledWith(loggerModule.getLogger, loggerConfig.config, { debug: configElements });
            actualLogger.should.equal(mockLogger);
        });

        it('should use the null logger if the specified logger cannot be loaded', () => {
            const spy = sandbox.spy(console, 'error');
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
            const mockLogger = {};
            loggerModule.getLogger.withArgs(loggerConfig.config, { debug: configElements }).returns(mockLogger);
            sandbox.stub(Logger, 'getLoggerConfig').returns(loggerConfig);
            const actualLogger = Logger._loadLogger(configElements);
            sinon.assert.calledWith(spy, sinon.match(/Failed to load logger module foolog/));
            actualLogger.log('foo', 'bar');
        });

    });

    describe('#WinstonInjector',()=>{
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
            let configElements = {debug: {things:'here'}};
            WinstonInjector.getLogger(config,configElements);


        });
    });

});
