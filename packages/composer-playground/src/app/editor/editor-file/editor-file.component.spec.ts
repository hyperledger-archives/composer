/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EditorFileComponent } from './editor-file.component';

import { ClientService } from '../../services/client.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

@Directive({
    selector: 'codemirror'
})

class MockCodeMirrorDirective {
    @Input()
    public config;
}

@Directive({
    selector: 'perfect-scrollbar'
})

class MockPerfectScrollBarDirective {
}

@Directive({
    selector: '[debounce]'
})
class MockDebounceDirective {
    @Input() delay;
}

describe('EditorFileComponent', () => {
    let component: EditorFileComponent;
    let fixture: ComponentFixture<EditorFileComponent>;

    let mockClientService = sinon.createStubInstance(ClientService);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [EditorFileComponent, MockCodeMirrorDirective, MockPerfectScrollBarDirective, MockDebounceDirective],
            providers: [
                {provide: ClientService, useValue: mockClientService}]
        });

        fixture = TestBed.createComponent(EditorFileComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.should.be.ok;
    });

    describe('set editorFile', () => {

        beforeEach(() => {
            mockClientService.validateFile.returns(null);
            mockClientService.getModelFile.returns({getDefinitions: sinon.stub().returns({})});
            mockClientService.getScriptFile.returns({getContents: sinon.stub().returns({})});
            mockClientService.getAclFile.returns({getDefinitions: sinon.stub().returns({})});
        });

        it('should set editor file', () => {
            let mockLoadFile = sinon.stub(component, 'loadFile');
            component.editorFile = {editorFile: 'my file'};

            mockLoadFile.should.have.been.called;
            component['_editorFile'].should.deep.equal({editorFile: 'my file'});
        });

        it('should not set editor file if null', () => {
            let mockLoadFile = sinon.stub(component, 'loadFile');
            component.editorFile = null;

            mockLoadFile.should.not.have.been.called;
        });

        it('should validate model file content once set', () => {
            component.editorFile = {model: true};
            mockClientService.validateFile.should.have.been.called;
        });

        it('should validate script file content once set', () => {
            component.editorFile = {script: true};
            mockClientService.validateFile.should.have.been.called;
        });

        it('should validate acl file content once set', () => {
            component.editorFile = {acl: true};
            mockClientService.validateFile.should.have.been.called;
        });
    });

    describe('loadFile', () => {
        it('should load a model file', () => {
            mockClientService.getModelFile.returns({
                getDefinitions: sinon.stub().returns('my model')
            });

            component['_editorFile'] = {
                model: true,
                id: 'model'
            };

            component.loadFile();

            mockClientService.getModelFile.should.have.been.calledWith('model');
            component['editorContent'].should.equal('my model');
            component['editorType'].should.equal('code');
        });

        it('should load a model file but not find it', () => {
            mockClientService.getModelFile.returns(null);

            component['_editorFile'] = {
                model: true,
                id: 'model'
            };

            component.loadFile();

            should.not.exist(component['editorContent']);
        });

        it('should load a script file', () => {
            mockClientService.getScriptFile.returns({
                getContents: sinon.stub().returns('my script')
            });

            component['_editorFile'] = {
                script: true,
                id: 'script'
            };

            component.loadFile();

            mockClientService.getScriptFile.should.have.been.calledWith('script');
            component['editorContent'].should.equal('my script');
            component['editorType'].should.equal('code');
        });

        it('should load a script file but not find it', () => {
            mockClientService.getScriptFile.returns(null);

            component['_editorFile'] = {
                script: true,
                id: 'script'
            };

            component.loadFile();

            should.not.exist(component['editorContent']);
        });

        it('should load a acl file', () => {
            mockClientService.getAclFile.returns({
                getDefinitions: sinon.stub().returns('my acl')
            });

            component['_editorFile'] = {
                acl: true,
            };

            component.loadFile();

            component['editorContent'].should.equal('my acl');
            component['editorType'].should.equal('code');
        });

        it('should load acl file but not find it', () => {
            mockClientService.getAclFile.returns(null);

            component['_editorFile'] = {
                acl: true,
            };

            component.loadFile();

            should.not.exist(component['editorContent']);
        });

        it('should load a package file', () => {
            mockClientService.getMetaData.returns({
                getPackageJson: sinon.stub().returns({name: 'my network'})
            });

            component['_editorFile'] = {
                package: true,
            };

            component.loadFile();

            component['editorContent'].should.deep.equal(`{\n  "name": "my network"\n}`);
            component['editorType'].should.equal('code');
        });

        it('should load package file but not find it', () => {
            mockClientService.getMetaData.returns({
                getPackageJson: sinon.stub()
            });

            component['_editorFile'] = {
                package: true,
            };

            component.loadFile();

            should.not.exist(component['editorContent']);
        });

        it('should load a readme file', () => {
            mockClientService.getMetaData.returns({
                getREADME: sinon.stub().returns('readme')
            });

            component['_editorFile'] = {
                readme: true,
            };

            component['_previewReadmeActive'] = false;

            component.loadFile();

            component['editorContent'].should.deep.equal(`readme`);
            component['previewContent'].should.deep.equal(`<p>readme</p>\n`);
            component['editorType'].should.equal('readme');
        });

        it('should load readme file but not find it', () => {
            mockClientService.getMetaData.returns({
                getREADME: sinon.stub()
            });

            component['_editorFile'] = {
                readme: true,
            };

            component['_previewReadmeActive'] = false;

            component.loadFile();

            should.not.exist(component['editorContent']);
        });

        it('should load a query file', () => {
            mockClientService.getQueryFile.returns({
                getDefinitions: sinon.stub().returns('my query')
            });

            component['_editorFile'] = {
                query: true,
            };

            component.loadFile();

            component['editorContent'].should.equal('my query');
            component['editorType'].should.equal('code');
        });

        it('should load a query file but not find it', () => {
            mockClientService.getQueryFile.returns(null);

            component['_editorFile'] = {
                query: true,
            };

            component.loadFile();

            should.not.exist(component['editorContent']);
        });
    });

    describe('setCurrentCode', () => {
        it('should set model file', () => {
            component['_editorFile'] = {
                model: true,
                id: 'model'
            };

            component['editorContent'] = 'my model';

            component.setCurrentCode();

            mockClientService.updateFile.should.have.been.calledWith('model', 'my model', 'model');
            should.not.exist(component['currentError']);
        });

        it('should set script file', () => {
            component['_editorFile'] = {
                script: true,
                id: 'script'
            };

            component['editorContent'] = 'my script';

            component.setCurrentCode();

            mockClientService.updateFile.should.have.been.calledWith('script', 'my script', 'script');
            should.not.exist(component['currentError']);
        });

        it('should set acl file', () => {
            component['_editorFile'] = {
                acl: true,
                id: 'acl'
            };

            component['editorContent'] = 'my acl';

            component.setCurrentCode();

            mockClientService.updateFile.should.have.been.calledWith('acl', 'my acl', 'acl');
            should.not.exist(component['currentError']);
        });

        it('should set query file', () => {
            component['_editorFile'] = {
                query: true,
                id: 'query'
            };

            component['editorContent'] = 'my query';

            component.setCurrentCode();

            mockClientService.updateFile.should.have.been.calledWith('query', 'my query', 'query');
            should.not.exist(component['currentError']);
        });

        it('should set package file', () => {
            component['_editorFile'] = {
                package: true,
            };

            component['editorContent'] = '{"name": "my network"}';

            mockClientService.businessNetworkChanged$ = {
                next: sinon.stub()
            };

            component.setCurrentCode();

            mockClientService.setBusinessNetworkPackageJson.should.have.been.calledWith({name: 'my network'});
            mockClientService.businessNetworkChanged$.next.should.have.been.calledWith(true);
            should.not.exist(component['currentError']);
        });

        it('should set the readme file', () => {
            component['_editorFile'] = {
                readme: true,
                id: 'readme'
            };

            component['editorContent'] = 'my readme';

            component.setCurrentCode();

            mockClientService.updateFile.should.have.been.calledWith('readme', 'my readme', 'readme');
        });

        it('should compile the readme file', () => {
            component['_editorFile'] = {
                readme: true,
                id: 'readme'
            };

            component['_previewReadmeActive'] = true;

            component['editorContent'] = 'my readme';

            component.setCurrentCode();

            component['previewContent'].should.equal(`<p>my readme</p>\n`);
        });

        it('should set current error on error', () => {
            mockClientService.updateFile.returns('some error');
            component['_editorFile'] = {
                acl: true,
                id: 'acl'
            };

            component['editorContent'] = 'my acl';

            component.setCurrentCode();

            mockClientService.updateFile.should.have.been.calledWith('acl', 'my acl', 'acl');
            component['currentError'].should.equal('some error');
        });

        it('should set handle on error', () => {
            mockClientService.setBusinessNetworkPackageJson.reset();
            component['_editorFile'] = {
                package: true,
            };

            component['editorContent'] = '{"name": "my network"';

            mockClientService.businessNetworkChanged$ = {
                next: sinon.stub()
            };

            component.setCurrentCode();

            mockClientService.setBusinessNetworkPackageJson.should.not.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.have.been.calledWith(false);
            component['currentError'].should.equal('SyntaxError: Unexpected end of JSON input');
        });
    });

    describe('onCodeChanged', () => {
        let mockSetCurrentCode;

        beforeEach(() => {
            mockSetCurrentCode = sinon.stub(component, 'setCurrentCode');
            component['editorContent'] = 'my code';
        });

        it('should update the code', () => {
            component.onCodeChanged();

            mockSetCurrentCode.should.have.been.called;
            component['previousCode'].should.equal('my code');
        });

        it('should not update if changing file', () => {
            mockSetCurrentCode.reset();
            component['changingCurrentFile'] = true;

            component.onCodeChanged();

            mockSetCurrentCode.should.not.have.been.called;
        });

        it('should not update if code hasn\'t changed', () => {
            mockSetCurrentCode.reset();
            component['previousCode'] = 'my code';

            component.onCodeChanged();

            mockSetCurrentCode.should.not.have.been.called;
        });

        it('should compile the readme on preview', () => {
            mockSetCurrentCode.reset();
            component['_previewReadmeActive'] = true;

            component.onCodeChanged();

            mockSetCurrentCode.should.have.been.called;
        });
    });
});
