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
import { ComponentFixture, TestBed, fakeAsync, tick, async, inject } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Component, DebugElement } from '@angular/core';

import * as sinon from 'sinon';

import { CredentialsComponent } from './credentials.component';
import { AlertService } from '../../basic-modals/alert.service';

import { FileImporterComponent } from '../../common/file-importer';
import { FileDragDropDirective } from '../../common/file-importer/file-drag-drop';

@Component({
    template: `
        <credentials (credentials)="credentials($event)"></credentials>`
})
class TestHostComponent {
    public result;

    credentials(data) {
        this.result = data;
    }
}

describe('CredentialsComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let credentialsElement: DebugElement;

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [TestHostComponent,
                CredentialsComponent,
                FileImporterComponent,
                FileDragDropDirective],
            providers: [AlertService]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        component.result = null;
        credentialsElement = fixture.debugElement.query(By.css('credentials'));
    });

    it('should be created', () => {
        component.should.be.ok;
    });

    describe('#formatCert', () => {
        it('should remove all instances of \n from a given certificate', () => {
            let testCert = 'this is the\\n\\ntest cert';
            let credentialsComponent = credentialsElement.componentInstance;
            let result = credentialsComponent.formatCert(testCert);
            result.should.equal('this is the\n\ntest cert');
        });

        it('should remove all instances of \r\n from a given certificate', () => {
            let testCert = 'this is the\\r\\ntest cert';
            let credentialsComponent = credentialsElement.componentInstance;
            let result = credentialsComponent.formatCert(testCert);
            result.should.equal('this is the\ntest cert');
        });

        it('should remove all instances of \n\r from a given certificate', () => {
            let testCert = 'this is the\\n\\rtest cert';
            let credentialsComponent = credentialsElement.componentInstance;
            let result = credentialsComponent.formatCert(testCert);
            result.should.equal('this is the\ntest cert');
        });
    });

    describe('#validContents', () => {
        it('should emit empty object if no certs entered when trying to set certificates', fakeAsync(() => {
            fixture.detectChanges();

            let useCertElement = credentialsElement.query(By.css('#useCert'));
            useCertElement.nativeElement.checked = true;
            useCertElement.nativeElement.dispatchEvent(new Event('change'));

            tick();
            fixture.detectChanges();

            component.result.should.deep.equal({});
        }));

        it('should emit empty object if public certificate is empty when using certificates', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let privateKeyElement = credentialsElement.query(By.css('#privateKey'));
            privateKeyElement.nativeElement.value = 'privateKey';
            privateKeyElement.nativeElement.dispatchEvent(new Event('input'));

            let userIdElement = credentialsElement.query(By.css('#name'));
            userIdElement.nativeElement.value = 'userID';
            userIdElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            component.result.should.deep.equal({});
        }));

        it('it should not validate if the private certificate is empty when using certificates', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let certificateElement = credentialsElement.query(By.css('#publicKey'));
            certificateElement.nativeElement.textContent = 'myCert';
            certificateElement.nativeElement.dispatchEvent(new Event('input'));

            let userIdElement = credentialsElement.query(By.css('#name'));
            userIdElement.nativeElement.textContent = 'userID';
            userIdElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            component.result.should.deep.equal({});
        }));

        it('it should not validate if the user ID is empty when using certificates', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let certificateElement = credentialsElement.query(By.css('#publicKey'));
            certificateElement.nativeElement.textContent = 'myCert';
            certificateElement.nativeElement.dispatchEvent(new Event('input'));

            let privateKeyElement = credentialsElement.query(By.css('#privateKey'));
            privateKeyElement.nativeElement.textContent = 'privateKey';
            privateKeyElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            component.result.should.deep.equal({});
        }));

        it('should validate when using certificates', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let useCertElement = credentialsElement.query(By.css('#useCert'));
            useCertElement.nativeElement.checked = true;
            useCertElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            let certificateElement = credentialsElement.query(By.css('#publicKey'));
            certificateElement.nativeElement.value = 'myCert';
            certificateElement.nativeElement.dispatchEvent(new Event('input'));

            let privateKeyElement = credentialsElement.query(By.css('#privateKey'));
            privateKeyElement.nativeElement.value = 'privateKey';
            privateKeyElement.nativeElement.dispatchEvent(new Event('input'));

            let userIdElement = credentialsElement.query(By.css('#name'));
            userIdElement.nativeElement.value = 'userID';
            userIdElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            component.result.should.deep.equal({
                userId: 'userID',
                cert: 'myCert',
                key: 'privateKey'
            });
        }));

        it('should not validate if a userID field is empty when specifying user ID/Secret', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let useSecretElement = credentialsElement.query(By.css('#noCert'));
            useSecretElement.nativeElement.checked = true;
            useSecretElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            let userSecretElement = credentialsElement.query(By.css('#userSecret'));
            userSecretElement.nativeElement.value = 'mySecret';
            userSecretElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            component.result.should.deep.equal({});
        }));

        it('should not validate if a userSecret field is empty when specifying user ID/Secret', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let useSecretElement = credentialsElement.query(By.css('#noCert'));
            useSecretElement.nativeElement.checked = true;
            useSecretElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            let userIdElement = credentialsElement.query(By.css('#userId'));
            userIdElement.nativeElement.value = 'userID';
            userIdElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            component.result.should.deep.equal({});
        }));

        it('should validate if all text fields are added when specifying user ID/Secret', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let useSecretElement = credentialsElement.query(By.css('#noCert'));
            useSecretElement.nativeElement.checked = true;
            useSecretElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            let userIdElement = credentialsElement.query(By.css('#userId'));
            userIdElement.nativeElement.value = 'userID';
            userIdElement.nativeElement.dispatchEvent(new Event('input'));

            let userSecretElement = credentialsElement.query(By.css('#userSecret'));
            userSecretElement.nativeElement.value = 'mySecret';
            userSecretElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            component.result.should.deep.equal({userId: 'userID', secret: 'mySecret'});
        }));
    });

    describe('#fileDetected', () => {
        it('should change this.expandInput to true', () => {
            fixture.detectChanges();

            credentialsElement.componentInstance['expandInput'] = false;

            let dragDropElement = credentialsElement.query(By.css('.create-route'));
            dragDropElement.triggerEventHandler('fileDragDropDragOver', null);

            credentialsElement.componentInstance['expandInput'].should.equal(true);
        });
    });

    describe('#fileLeft', () => {
        it('should change this.expectedInput to false', () => {
            fixture.detectChanges();

            credentialsElement.componentInstance['expandInput'] = true;

            let dragDropElement = credentialsElement.query(By.css('.create-route'));
            dragDropElement.triggerEventHandler('fileDragDropDragLeave', null);

            credentialsElement.componentInstance['expandInput'].should.equal(false);
        });
    });

    describe('#fileAccepted', () => {
        let mockFileReadObj;
        let mockFileRead;
        let content;

        beforeEach(() => {
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

        it('should detect if the file is a certificate', fakeAsync(() => {
            content = '-----BEGIN CERTIFICATE-----';
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'certificate.pem');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = credentialsElement.query(By.css('.create-route'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();
            tick();

            credentialsElement.componentInstance.addedPublicCertificate.should.equal('-----BEGIN CERTIFICATE-----');
        }));

        it('should detect if the file is a certificate and allow when type set to public', fakeAsync(() => {
            content = '-----BEGIN CERTIFICATE-----';
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'certificate.pem');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let fileImporterElement = credentialsElement.query(By.css('#publicKeyImporter'));
            fileImporterElement.triggerEventHandler('fileAccepted', file);
            mockFileReadObj.onload();
            tick();

            credentialsElement.componentInstance.addedPublicCertificate.should.equal('-----BEGIN CERTIFICATE-----');
        }));

        it('should detect if the file is a certificate and disallow when type set but not to public', fakeAsync(() => {
            credentialsElement.componentInstance.addedPublicCertificate = 'UNCHANGED';

            content = '-----BEGIN CERTIFICATE-----';
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'certificate.pem');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let fileImporterElement = credentialsElement.query(By.css('#privateKeyImporter'));
            fileImporterElement.triggerEventHandler('fileAccepted', file);
            mockFileReadObj.onload();
            tick();

            credentialsElement.componentInstance.addedPublicCertificate.should.equal('UNCHANGED');
        }));

        it('should detect if the file is a private key', fakeAsync(() => {
            content = '-----BEGIN PRIVATE KEY-----';
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'privateKey.pem');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = credentialsElement.query(By.css('.create-route'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();
            tick();

            credentialsElement.componentInstance.addedPrivateCertificate.should.equal('-----BEGIN PRIVATE KEY-----');
        }));

        it('should detect if the file is a private key and allow when type set to private', fakeAsync(() => {
            content = '-----BEGIN PRIVATE KEY-----';
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'certificate.pem');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let fileImporterElement = credentialsElement.query(By.css('#privateKeyImporter'));
            fileImporterElement.triggerEventHandler('fileAccepted', file);
            mockFileReadObj.onload();
            tick();

            credentialsElement.componentInstance.addedPrivateCertificate.should.equal('-----BEGIN PRIVATE KEY-----');
        }));

        it('should detect if the file is a private key and disallow when type set but not to public', fakeAsync(() => {
            credentialsElement.componentInstance.addedPrivateCertificate = 'UNCHANGED';

            content = '-----BEGIN PRIVATE KEY-----';
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'certificate.pem');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let fileImporterElement = credentialsElement.query(By.css('#publicKeyImporter'));
            fileImporterElement.triggerEventHandler('fileAccepted', file);
            mockFileReadObj.onload();
            tick();

            credentialsElement.componentInstance.addedPrivateCertificate.should.equal('UNCHANGED');
        }));

        it('should detect if file contents are not of the correct format', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            content = 'bad cert format';
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'privateKey.pem');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            alertService.errorStatus$.subscribe((message) => {
                if (message !== null) {
                    message.toString().should.equal('Error: Certificate content in unexpected format.');
                }
            });

            let errorStatusSpy = sinon.spy(alertService.errorStatus$, 'next');

            let dragDropElement = credentialsElement.query(By.css('.create-route'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();
            tick();

            errorStatusSpy.should.have.been.called;
        })));

        it('handle file read problem', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            content = '-----BEGIN PRIVATE KEY-----';
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'privateKey.pem');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            alertService.errorStatus$.subscribe((message) => {
                if (message !== null) {
                    message.toString().should.equal('Error: File has an error');
                }
            });

            let errorStatusSpy = sinon.spy(alertService.errorStatus$, 'next');

            let dragDropElement = credentialsElement.query(By.css('.create-route'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onerror(new Error('File has an error'));
            tick();

            errorStatusSpy.should.have.been.called;
        })));
    });
});
