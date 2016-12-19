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

const ScriptManager = require('../lib/scriptmanager');
const ModelManager = require('../lib/modelmanager');
const sinon = require('sinon');

describe('ScriptManager', () => {
    let modelManager;
    let scriptManager;

    beforeEach(() => {
        modelManager = new ModelManager();
        scriptManager = new ScriptManager(modelManager);
    });

    afterEach(() => {
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let visitor = {
                visit: sinon.stub()
            };
            scriptManager.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, scriptManager, ['some', 'args']);
        });
    });

    describe('#createScript', () => {

        it('should work with valid args', () => {
            const FUNC_TEXT = 'function foo() {return 0;}';
            const script = scriptManager.createScript('SCRIPT_001', 'JS', FUNC_TEXT );
            script.getFunctionDeclarations().length.should.equal(1);
            script.getLanguage().should.equal('JS');
            script.getContents().should.equal(FUNC_TEXT);
        });
    });

    describe('#addScript', () => {

        it('should be able to add multiple scripts', () => {
            const FUNC_TEXT = 'function foo() {return 0;}';
            const script = scriptManager.createScript('SCRIPT_001', 'JS', FUNC_TEXT );
            scriptManager.addScript(script);

            const script2 = scriptManager.createScript('SCRIPT_002', 'JS', FUNC_TEXT );
            scriptManager.addScript(script2);

            scriptManager.getScripts().length.should.equal(2);
            scriptManager.getScriptIdentifiers().should.deep.equal(['SCRIPT_001','SCRIPT_002']);
        });
    });

    describe('#updateScript', () => {

        it('should be able to update a script', () => {
            const FUNC_TEXT = 'function foo() {return 0;}';
            let script = scriptManager.createScript('SCRIPT_001', 'JS', FUNC_TEXT );
            scriptManager.addScript(script);

            const FUNC_TEXT2 = 'function foo() {return 1;}';
            script = scriptManager.createScript('SCRIPT_001', 'JS', FUNC_TEXT2 );
            scriptManager.updateScript(script);
            scriptManager.getScript('SCRIPT_001').getContents().should.equal(FUNC_TEXT2);

            scriptManager.getScripts().length.should.equal(1);
        });

        it('should throw updating a non-existent script', () => {

            (() => {
                const FUNC_TEXT = 'function foo() {return 0;}';
                let script = scriptManager.createScript('SCRIPT_001', 'JS', FUNC_TEXT );
                scriptManager.updateScript(script);
            }).should.throw(/Script file does not exist/);
        });
    });

    describe('#deleteScript', () => {

        it('should be able to delete a script', () => {
            const FUNC_TEXT = 'function foo() {return 0;}';
            let script = scriptManager.createScript('SCRIPT_001', 'JS', FUNC_TEXT );
            scriptManager.addScript(script);
            scriptManager.getScripts().length.should.equal(1);
            scriptManager.deleteScript(script.getIdentifier());
            scriptManager.getScripts().length.should.equal(0);
        });

        it('should throw deleting a non-existent script', () => {

            (() => {
                scriptManager.deleteScript('MISSING');
            }).should.throw(/Script file does not exist/);
        });
    });

    describe('#clearScripts', () => {

        it('should be able to clear the scripts', () => {
            const FUNC_TEXT = 'function foo() {return 0;}';
            let script = scriptManager.createScript('SCRIPT_001', 'JS', FUNC_TEXT );
            scriptManager.addScript(script);
            scriptManager.getScripts().length.should.equal(1);
            scriptManager.clearScripts();
            scriptManager.getScripts().length.should.equal(0);
        });
    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let mm = new ModelManager();
            mm.toJSON().should.deep.equal({});
        });

    });

});
