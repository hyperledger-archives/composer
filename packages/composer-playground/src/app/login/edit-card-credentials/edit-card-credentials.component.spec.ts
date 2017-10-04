/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, async, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import * as sinon from 'sinon';

import { EditCardCredentialsComponent } from './edit-card-credentials.component';
import { IdentityCardService } from '../../services/identity-card.service';
import { AlertService } from '../../basic-modals/alert.service';
import { FileImporterComponent } from '../../common/file-importer';
import { FileDragDropDirective } from '../../common/file-importer/file-drag-drop';

import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { expect } from 'chai';

describe('EditCardCredentialsComponent', () => {
    let component: EditCardCredentialsComponent;
    let fixture: ComponentFixture<EditCardCredentialsComponent>;

    let sandbox;
    let mockActiveModal;
    let mockIdentityCardService;
    let mockAlertService;

    beforeEach(() => {
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockAlertService = sinon.createStubInstance(AlertService);

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        sandbox = sinon.sandbox.create();

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
                EditCardCredentialsComponent,
                FileImporterComponent,
                FileDragDropDirective],
            providers: [
                {provide: AlertService, useValue: mockAlertService},
                {provide: IdentityCardService, useValue: mockIdentityCardService}
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EditCardCredentialsComponent);
        component = fixture.componentInstance;
    });

    it('should be created', () => {
        component.should.be.ok;
    });

    describe('#submitCard', () => {

        let mockValidate;
        let mockAddCard;
        let event;

        beforeEach(() => {
            mockValidate = sinon.stub(component, 'validContents').returns(false);
            mockAddCard = sinon.stub(component, 'addIdentityCard');
            event = document.createEvent('Events');
            event.initEvent('keydown"', true, true);
            event.keyCode = 40;
        });

        it('should not call addCard if no event', () => {
            component.submitCard(null);
            mockAddCard.should.not.have.been.called;
        });

        it('should not call addCard if invalid key press', () => {
            component.submitCard(event);
            mockAddCard.should.not.have.been.called;
        });

        it('should not call addCard if form contents invalid', () => {
            event.keyCode = 13;
            component.submitCard(event);
            mockValidate.should.have.been.called;
            mockAddCard.should.not.have.been.called;
        });

        it('should call addCard if valid keypress and form contents are valid', () => {
            event.keyCode = 13;
            mockValidate.returns(true);
            component.submitCard(event);
            mockValidate.should.have.been.called;
            mockAddCard.should.have.been.called;
        });

    });

    describe('#addIdentityCard', () => {

        beforeEach(() => {
            component['userId'] = 'bob';
            component['userSecret'] = 'suchSecret';
            component['busNetName'] = 'network';
            component['connectionProfile'] = {theProfile: 'muchProfile'};
            component['addInProgress'] = false;
            component['useCerts'] = false;
        });

        it('should set busy status upon entry', fakeAsync(() => {
            mockIdentityCardService.createIdentityCard.returns(Promise.resolve());

            component.addIdentityCard();

            tick();

            mockAlertService.busyStatus$.next.should.have.been.calledWith({
                title: 'Adding ID card',
                text: 'Adding ID card'
            });

        }));

        it('should call createIdentityCard(~) and inform success', fakeAsync(() => {
            mockIdentityCardService.createIdentityCard.returns(Promise.resolve());
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            mockIdentityCardService.createIdentityCard.should.have.been.calledWith('bob', 'network', 'suchSecret', {theProfile: 'muchProfile'}, null, []);
            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'ID Card Added',
                text: 'The ID card was successfully added to My Wallet.',
                icon: '#icon-role_24'
            });
            spy.should.have.been.calledWith(true);
        }));

        it('should call createIdentityCard(~) and inform success using certs', fakeAsync(() => {
            component['userSecret'] = null;
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'my-public-cert';
            component['addedPrivateCertificate'] = 'my-private-cert';

            mockIdentityCardService.createIdentityCard.returns(Promise.resolve());
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            let certs = {
                certificate: 'my-public-cert',
                privateKey: 'my-private-cert'
            };

            mockIdentityCardService.createIdentityCard.should.have.been.calledWith('bob', 'network', null, {theProfile: 'muchProfile'}, certs, []);
            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'ID Card Added',
                text: 'The ID card was successfully added to My Wallet.',
                icon: '#icon-role_24'
            });
            spy.should.have.been.calledWith(true);
        }));

        it('should call createIdentityCard(~) with roles and inform success', fakeAsync(() => {
            component['busNetName'] = null;
            component['peerAdmin'] = true;
            component['channelAdmin'] = true;

            mockIdentityCardService.createIdentityCard.returns(Promise.resolve());
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            mockIdentityCardService.createIdentityCard.should.have.been.calledWith('bob', null, 'suchSecret', {theProfile: 'muchProfile'}, null, ['PeerAdmin', 'ChannelAdmin']);
            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'ID Card Added',
                text: 'The ID card was successfully added to My Wallet.',
                icon: '#icon-role_24'
            });
            spy.should.have.been.calledWith(true);
        }));

        it('should handle an error from createIdentityCard(~) inform the user', fakeAsync(() => {
            mockIdentityCardService.createIdentityCard.returns(Promise.reject('test error'));
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            component['addInProgress'].should.be.false;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('test error');
            spy.should.have.been.calledWith(false);
        }));
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
            // Certs path
            component['useCerts'] = true;
            component['validContents']().should.be.false;
        });

        it('should not validate if an add is in progress when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('should not validate if the public certificate is empty when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = null;
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('it should not validate if the private certificate is empty when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = null;
            component['userId'] = 'userID';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('it should not validate if the user ID is empty when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = null;
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('it should not validate if the business network name is empty when using certificates and participant card', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = null;
            component['useParticipantCard'] = false;

            component['validContents']().should.be.false;
        });

        it('it should not validate if has no roles when using certificates and admin card', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['peerAdmin'] = false;
            component['channelAdmin'] = false;
            component['useParticipantCard'] = false;

            component['validContents']().should.be.false;
        });

        it('it should validate when using certificates and participant card', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = 'my-network';
            component['useParticipantCard'] = true;

            component['validContents']().should.be.true;
        });

        it('it should validate when using certificates and admin card', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['useParticipantCard'] = false;
            component['peerAdmin'] = true;

            component['validContents']().should.be.true;
        });

        it('should not validate if an add is in progress when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = true;
            component['userId'] = 'myId';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('should not validate if a userID field is empty when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = null;
            component['userSecret'] = 'mySecret';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('should not validate if a userSecret field is empty when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = null;
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('should not validate if a Business Network Name field is empty when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = null;

            component['validContents']().should.be.false;
        });

        it('should not validate if a Business Network Name field is empty when specifying user ID/Secret and participant card', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = null;
            component['useParticipantCard'] = true;

            component['validContents']().should.be.false;
        });

        it('should not validate if no role when specifying user ID/Secret and admin card', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['peerAdmin'] = false;
            component['channelAdmin'] = false;
            component['useParticipantCard'] = false;

            component['validContents']().should.be.false;
        });

        it('should validate if all text fields are added when specifying user ID/Secret and participant card', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = 'myName';
            component['useParticipantCard'] = true;

            component['validContents']().should.be.true;
        });

        it('should validate if all text fields are added when specifying user ID/Secret and admin card', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['useParticipantCard'] = false;
            component['channelAdmin'] = true;

            component['validContents']().should.be.true;
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

    describe('#useParticipantCardType', () => {
        it('should set flag to false when passed false', () => {
            component['useParticipantCardType'](false);
            component['useParticipantCard'].should.be.false;
        });

        it('should set flag to true when passed true', () => {
            component['useParticipantCardType'](true);
            component['useParticipantCard'].should.be.true;
        });
    });

    describe('#close', () => {
        it('should emit on close', () => {
            let spy = sinon.spy(component.idCardAdded, 'emit');
            component['close']();
            spy.should.have.been.calledWith(false);
        });
    });

    describe('#fileDetected', () => {
        it('should change this.expandInput to true', () => {
            component.fileDetected();
            component.expandInput.should.equal(true);
        });
    });

    describe('#fileLeft', () => {
        it('should change this.expectedInput to false', () => {
            component.fileLeft();
            component.expandInput.should.equal(false);
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

});
