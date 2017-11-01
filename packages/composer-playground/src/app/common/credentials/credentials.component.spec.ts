/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick, async } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import * as sinon from 'sinon';

import { CredentialsComponent } from './credentials.component';
import { AlertService } from '../../basic-modals/alert.service';

import { FileImporterComponent } from '../../common/file-importer';
import { FileDragDropDirective } from '../../common/file-importer/file-drag-drop';

describe('CredentialsComponent', () => {
    let component: CredentialsComponent;
    let fixture: ComponentFixture<CredentialsComponent>;

    let mockAlertService;
    let sandbox;

    beforeEach(() => {
        mockAlertService = sinon.createStubInstance(AlertService);

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        sandbox = sinon.sandbox.create();

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [CredentialsComponent,
                FileImporterComponent,
                FileDragDropDirective],
            providers: [
                {provide: AlertService, useValue: mockAlertService}
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CredentialsComponent);
        component = fixture.componentInstance;
    });

    it('should be created', () => {
        component.should.be.ok;
    });

    describe('#formatCert', () => {
        it('should remove all instances of \n from a given certificate', () => {
            let testCert = 'this is the\\n\\ntest cert';
            let result = component.formatCert(testCert);
            result.should.equal('this is the\n\ntest cert');
        });

        it('should remove all instances of \r\n from a given certificate', () => {
            let testCert = 'this is the\\r\\ntest cert';
            let result = component.formatCert(testCert);
            result.should.equal('this is the\ntest cert');
        });

        it('should remove all instances of \n\r from a given certificate', () => {
            let testCert = 'this is the\\n\\rtest cert';
            let result = component.formatCert(testCert);
            result.should.equal('this is the\ntest cert');
        });
    });

    describe('#validContents', () => {
        it('should not enable validation if trying to set certificates', () => {
            let credentialsSpy = sinon.spy(component.credentials, 'emit');
            component.credentials.subscribe((result) => {
                result.should.deep.equal({});
            });
            // Certs path
            component['useCerts'] = true;
            component.validContents();
            credentialsSpy.should.have.been.called;
        });

        it('should not validate if the public certificate is empty when using certificates', () => {
            let credentialsSpy = sinon.spy(component.credentials, 'emit');
            component.credentials.subscribe((result) => {
                result.should.deep.equal({});
            });
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = null;
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';

            component.validContents();

            credentialsSpy.should.have.been.called;
        });

        it('it should not validate if the private certificate is empty when using certificates', () => {
            let credentialsSpy = sinon.spy(component.credentials, 'emit');
            component.credentials.subscribe((result) => {
                result.should.deep.equal({});
            });
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = null;
            component['userId'] = 'userID';

            component.validContents();

            credentialsSpy.should.have.been.called;
        });

        it('it should not validate if the user ID is empty when using certificates', () => {
            let credentialsSpy = sinon.spy(component.credentials, 'emit');
            component.credentials.subscribe((result) => {
                result.should.deep.equal({});
            });
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = null;

            component.validContents();

            credentialsSpy.should.have.been.called;
        });

        it('it should validate when using certificates', () => {
            let credentialsSpy = sinon.spy(component.credentials, 'emit');
            component.credentials.subscribe((result) => {
                result.should.deep.equal({
                    userId: 'userID',
                    cert: 'publicKey',
                    key: 'privateKey'
                });
            });

            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';

            component.validContents();

            credentialsSpy.should.have.been.called;
        });

        it('should not validate if a userID field is empty when specifying user ID/Secret', () => {
            let credentialsSpy = sinon.spy(component.credentials, 'emit');
            component.credentials.subscribe((result) => {
                result.should.deep.equal({});
            });
            // Secret/ID path
            component['useCerts'] = false;
            component['userId'] = null;
            component['userSecret'] = 'mySecret';

            component.validContents();

            credentialsSpy.should.have.been.called;
        });

        it('should not validate if a userSecret field is empty when specifying user ID/Secret', () => {
            let credentialsSpy = sinon.spy(component.credentials, 'emit');
            component.credentials.subscribe((result) => {
                result.should.deep.equal({});
            });

            // Secret/ID path
            component['useCerts'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = null;

            component.validContents();

            credentialsSpy.should.have.been.called;
        });

        it('should validate if all text fields are added when specifying user ID/Secret', () => {
            let credentialsSpy = sinon.spy(component.credentials, 'emit');
            component.credentials.subscribe((result) => {
                result.should.deep.equal({userId: 'myID', secret: 'mySecret'});
            });

            // Secret/ID path
            component['useCerts'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';

            component.validContents();

            credentialsSpy.should.have.been.called;
        });
    });

    describe('#useCertificates', () => {
        it('should set flag to false when passed false', () => {
            component['useCertificates'](false);
            component['useCerts'].should.be.false;
        });

        it('should set flag to true when passed true', () => {
            component['useCertificates'](true);
            component['useCerts'].should.be.true;
        });
    });

    describe('#fileDetected', () => {
        it('should change this.expandInput to true', () => {
            component.fileDetected();
            component['expandInput'].should.equal(true);
        });
    });

    describe('#fileLeft', () => {
        it('should change this.expectedInput to false', () => {
            component.fileLeft();
            component['expandInput'].should.equal(false);
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
                    // Assertions
                    data.toString().should.equal(content);
                });
        });

        it('should give error in promise chain', () => {
            let promise = component.getDataBuffer(file);
            mockFileReadObj.onerror('error');
            return promise
                .then((data) => {
                    // Assertions
                    data.should.be.null;
                })
                .catch((err) => {
                    // Assertions
                    err.should.equal('error');
                });
        });
    });

    describe('#fileAccepted', () => {
        it('should only accept PEM (.pem) files', fakeAsync(() => {
            let b = new Blob(['-----BEGIN CERTIFICATE-----'], {type: 'text/plain'});
            let file = new File([b], 'certificate.pem');

            component.fileAccepted(file);
            tick();
        }));

        it('should detect if the file is a certificate', fakeAsync(() => {
            component['certType'] = '-----BEGIN CERTIFICATE-----';

            let b = new Blob(['-----BEGIN CERTIFICATE-----'], {type: 'text/plain'});
            let file = new File([b], 'certificate.pem');

            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                .returns(Promise.resolve('-----BEGIN CERTIFICATE-----'));

            let formatSpy = sinon.spy(component, 'setPublicCert');

            component.fileAccepted(file);
            tick();

            formatSpy.called;
        }));

        it('should detect if the file is a private key', fakeAsync(() => {
            component['certType'] = '-----BEGIN PRIVATE KEY-----';

            let b = new Blob(['-----BEGIN PRIVATE-----'], {type: 'text/plain'});
            let file = new File([b], 'privateKey.pem');

            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                .returns(Promise.resolve('-----BEGIN PRIVATE KEY-----'));

            let formatSpy = sinon.spy(component, 'setPrivateCert');

            component.fileAccepted(file);
            tick();

            formatSpy.called;
        }));

        it('should detect if .pem file contents are not of the correct format', fakeAsync(() => {
            component['certType'] = 'x';

            let b = new Blob(['bad cert format'], {type: 'text/plain'});
            let file = new File([b], 'privateKey.pem');

            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                .returns(Promise.resolve('bad cert format'));

            let formatSpy = sinon.spy(component, 'setPrivateCert');

            component.fileAccepted(file);
            tick();

            formatSpy.called;
        }));

        it('should reject any file that is not a PEM file', fakeAsync(() => {
            let b = new Blob(['/**PNG File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.png');

            let createMock = sandbox.stub(component, 'fileRejected');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                .returns(Promise.resolve('some data'));

            component.fileAccepted(file);
            tick();

            createMock.calledWith('Unexpected File Type: png');
        }));
    });

    describe('#setPublicCert', () => {
        it('should set the public certificate', () => {
            component.setPublicCert('-----BEGIN CERTIFICATE-----');
            component['addedPublicCertificate'].should.equal('-----BEGIN CERTIFICATE-----');
        });
    });

    describe('#setPrivateCert', () => {
        it('should set the private certificate', () => {
            component.setPrivateCert('-----BEGIN PRIVATE KEY-----');
            component['addedPrivateCertificate'].should.equal('-----BEGIN PRIVATE KEY-----');
        });
    });

    describe('#fileRejected', () => {
        it('should return an error status', async(() => {
            component.fileRejected('long reason to reject file');
            mockAlertService.errorStatus$.next.should.have.been.calledWith('long reason to reject file');
        }));
    });

    describe('ngAfterViewInit', () => {
        it('should validate changes on change of the form', async(() => {
            let validStub = sinon.stub(component, 'validContents');

            component['userId'] = 'newValue';

            fixture.detectChanges();

            fixture.whenStable().then(() => {
                validStub.should.have.been.called;
            });
        }));
    });
});
