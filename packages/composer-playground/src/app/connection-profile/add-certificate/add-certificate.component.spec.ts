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

describe('AddCertificateComponent', () => {
    let sandbox;
    let component: AddCertificateComponent;
    let fixture: ComponentFixture<AddCertificateComponent>;

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
                {provide: AdminService, useClass: MockAdminService},
                {provide: AlertService, useClass: MockAlertService},
                NgbActiveModal
            ]
        });

        sandbox = sinon.sandbox.create();

        fixture = TestBed.createComponent(AddCertificateComponent);
        component = fixture.componentInstance;
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
        it('should call this.createCertificate if valid file', fakeAsync(() => {
            let b = new Blob(['/**PEM File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.pem');

            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                .returns(Promise.resolve('some data'));

            // Call method
            component.fileAccepted(file);

            tick();

            component.cert.should.equal('some data');
        }));

        it('should call this.fileRejected when there is an error reading the file', fakeAsync(() => {

            let b = new Blob(['/**PEM File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.pem');

            let createMock = sandbox.stub(component, 'fileRejected');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                .returns(Promise.reject('some bad data'));

            component.fileAccepted(file);

            tick();

            createMock.should.have.been.called;
        }));
    });

    describe('#fileRejected', () => {
        it('should return an error status', () => {
            component.fileRejected('long reason to reject file');

            component['alertService'].errorStatus$.subscribe(
                (message) => {
                    message.should.equal('long reason to reject file');
                }
            );
        });
    });

    describe('#addCertificate', () => {
        let mockModalSpy;

        beforeEach(inject([NgbActiveModal], (activeModal: NgbActiveModal) => {
            mockModalSpy = sinon.spy(activeModal, 'close');
        }));

        it('should call close the activeModal', () => {

            component['cert'] = 'MuchCertificate';
            component['sslTargetNameOverride'] = 'SuchOverride';

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.calledWith({cert: 'MuchCertificate', sslTargetNameOverride: 'SuchOverride'});
        });

        it('should handle strings with encoded newlines (windows format 1) in certs correctly', () => {

            component['cert'] = 'MuchCertificate\\r\\nFollowon\\r\\nFinal';
            component['sslTargetNameOverride'] = 'SuchOverride';

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.calledWith({cert: 'MuchCertificate\nFollowon\nFinal', sslTargetNameOverride: 'SuchOverride'});
        });

        it('should handle strings with encoded newlines (windows format 2) in certs correctly', () => {

            component['cert'] = 'MuchCertificate\\n\\rFollowon\\n\\rFinal';
            component['sslTargetNameOverride'] = 'SuchOverride';

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.calledWith({cert: 'MuchCertificate\nFollowon\nFinal', sslTargetNameOverride: 'SuchOverride'});
        });

        it('should handle strings with encoded newlines (unix format) in certs correctly', () => {

            component['cert'] = 'MuchCertificate\\nFollowon\\nFinal';
            component['sslTargetNameOverride'] = 'SuchOverride';

            // call the method
            component.addCertificate();

            mockModalSpy.should.have.been.calledWith({cert: 'MuchCertificate\nFollowon\nFinal', sslTargetNameOverride: 'SuchOverride'});
        });
    });

    describe('#removeCertificate', () => {
        let mockModalSpy;

        beforeEach(inject([NgbActiveModal], (activeModal: NgbActiveModal) => {
            mockModalSpy = sinon.spy(activeModal, 'close');
        }));

        it('should call close the activeModal', () => {

            // call the method
            component.removeCertificate();

            mockModalSpy.should.have.been.calledWith(null);
        });
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
