/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, async, fakeAsync, tick, inject } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { BusinessNetworkDefinition } from 'composer-admin';
import { ModelManager, ScriptManager, Script } from 'composer-common';

import { AddCertificateComponent } from './add-certificate.component';
import { FileImporterComponent } from '../../common/file-importer';
import { FileDragDropDirective } from '../../common/file-importer/file-drag-drop';

import { AdminService } from '../../services/admin.service';
import { AlertService } from '../../basic-modals/alert.service';
import { ConnectionProfileService } from '../../services/connectionprofile.service';

import * as sinon from 'sinon';
import { expect } from 'chai';

class MockAdminService {
    ensureConnection(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    deploy(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(new BusinessNetworkDefinition('org-acme-biznet@0.0.1', 'Acme Business Network'));
        });
    }

    update(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(new BusinessNetworkDefinition('org-acme-biznet@0.0.1', 'Acme Business Network'));
        });
    }

    generateDefaultBusinessNetwork(): BusinessNetworkDefinition {
        return new BusinessNetworkDefinition('org-acme-biznet@0.0.1', 'Acme Business Network');
    }

    isInitialDeploy(): boolean {
        return true;
    }
}

class MockAlertService {
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<string> = new BehaviorSubject<string>(null);
}

class MockConnectionProfileService {
    getCertificate(): string {
        return 'base_cert';
    }
}

describe('AddCertificateComponent', () => {
    let sandbox;
    let component: AddCertificateComponent;
    let fixture: ComponentFixture<AddCertificateComponent>;
    let mockBusinessNetwork;
    let mockModelManager;
    let mockScriptManager;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                FileImporterComponent,
                AddCertificateComponent,
                FileDragDropDirective
            ],
            imports: [
                FormsModule
            ],
            providers: [
                {provide: ConnectionProfileService, useClass: MockConnectionProfileService},
                {provide: AdminService, useClass: MockAdminService},
                {provide: AlertService, useClass: MockAlertService},
                NgbActiveModal
            ]
        });

        sandbox = sinon.sandbox.create();

        fixture = TestBed.createComponent(AddCertificateComponent);
        component = fixture.componentInstance;

        mockModelManager = sinon.createStubInstance(ModelManager);
        mockScriptManager = sinon.createStubInstance(ScriptManager);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetwork.getModelManager.returns(mockModelManager);
        mockBusinessNetwork.getScriptManager.returns(mockScriptManager);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#fileDetected', () => {
        it('should change this.expandInput to true', () => {
            // Explicitly set false
            component['expandInput'] = false;
            // Run method
            component.fileDetected();
            // Check
            component.expandInput.should.equal(true);
        });
    });

    describe('#fileLeft', () => {
        it('should change this.expectedInput to false', () => {
            // Explicitly set true
            component['expandInput'] = true;
            // Run method
            component.fileLeft();
            // Check
            component.expandInput.should.equal(false);
        });
    });

    describe('#fileAccepted', () => {
        it('should call this.createCertificate if valid file', async(() => {
            let b = new Blob(['/**PEM File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.pem');

            let createMock = sandbox.stub(component, 'createCertificate');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            // Call method
            component.fileAccepted(file);
            // Check
            createMock.called;
        }));

        it('should set this.expandInput=true if a valid file', fakeAsync(() => {
            let b = new Blob(['/**PEM File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.pem');
            let createMock = sandbox.stub(component, 'createCertificate');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            // Call method
            component.fileAccepted(file);
            tick();

            // Check
            component.expandInput.should.equal(true);
        }));

        it('should call this.fileRejected when there is an error reading the file', () => {

            let b = new Blob(['/**PEM File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.pem');

            let createMock = sandbox.stub(component, 'fileRejected');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.reject('some bad data'));

            component.fileAccepted(file);
            createMock.called;
        });

        it('should throw when given incorrect file type', () => {

            let b = new Blob(['/**PNG File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.png');

            let createMock = sandbox.stub(component, 'fileRejected');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            component.fileAccepted(file);
            createMock.called;
        });
    });

    describe('#fileRejected', () => {
        it('should return an error status', async(() => {
            component.fileRejected('long reason to reject file');

            component['alertService'].errorStatus$.subscribe(
                (message) => {
                    expect(message).to.be.equal('long reason to reject file');
                }
            );
        }));
    });

    describe('#createCertificate', () => {

        it('should set the file type', () => {
            let type = 'setFileType';
            component.createCertificate(type, '');
            component['fileType'].should.equal(type);
        });

        it('should set the certificate string to the dataBuffer string content', async(() => {
            let data = 'someData';
            component.createCertificate('', data);
            component['addedCertificate'].should.equal(data);
        }));

    });

    describe('#addCertificate', () => {

        let mockModal;
        let mockModalSpy;

        beforeEach(inject([NgbActiveModal], (activeModal: NgbActiveModal) => {
            mockModalSpy = sinon.spy(activeModal, 'close');
        }));

        it('should call close the activeModal', async(() => {

            component['addedCertificate'] = 'MuchCertificate';

            let additionalData = {};
            additionalData['cert'] = 'MuchCertificate'.replace(/[\\n\\r]/g, '');

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.called;
        }));

        it('should handle strings with encoded newlines (windows format 1) in certs correctly', async(() => {

            component['addedCertificate'] = 'MuchCertificate\\r\\nFollowon\\r\\nFinal';

            let additionalData = {};
            additionalData['cert'] = 'MuchCertificate\nFollowon\nFinal';

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.calledWith(additionalData);
        }));

        it('should handle strings with encoded newlines (windows format 2) in certs correctly', async(() => {

            component['addedCertificate'] = 'MuchCertificate\\n\\rFollowon\\n\\rFinal';

            let additionalData = {};
            additionalData['cert'] = 'MuchCertificate\nFollowon\nFinal';

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.calledWith(additionalData);
        }));

        it('should handle strings with encoded newlines (unix format) in certs correctly', async(() => {

            component['addedCertificate'] = 'MuchCertificate\\nFollowon\\nFinal';

            let additionalData = {};
            additionalData['cert'] = 'MuchCertificate\nFollowon\nFinal';

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.calledWith(additionalData);
        }));

        it('should return a constructed json object', async(() => {

            component['addedCertificate'] = 'MuchCertificate';

            let additionalData = {};
            additionalData['cert'] = 'MuchCertificate';

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.calledWith(additionalData);
        }));
    });

    describe('#getDataBuffer', () => {
        let file;
        let mockFileReadObj;
        let mockBuffer;
        let mockFileRead;
        let content;

        beforeEach(() => {
            content = 'hello world';
            let data = new Blob([content], {type: 'text/plain'});
            file = new File([data], 'mock.bna');

            mockFileReadObj = {
                readAsArrayBuffer: sandbox.stub(),
                result: content,
                onload: sinon.stub(),
                onerror: sinon.stub()
            };

            mockFileRead = sinon.stub((<any> window), 'FileReader');
            mockFileRead.returns(mockFileReadObj);
        });

        afterEach(() => {
            mockFileRead.restore();
        });

        it('should return data from a file', () => {
            let promise = component.getDataBuffer(file);
            mockFileReadObj.onload();
            return promise
            .then((data) => {
                data.toString().should.equal(content);
            });
        });

        it('should give error in promise chain', () => {
            let promise = component.getDataBuffer(file);
            mockFileReadObj.onerror('error');
            return promise
            .then((data) => {
                data.should.be.null;
            })
            .catch((err) => {
                err.should.equal('error');
            });
        });
    });
});
