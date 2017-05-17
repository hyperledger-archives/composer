/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityComponent } from './identity.component';
import { AlertService } from '../services/alert.service';
import { IdentityService } from '../services/identity.service';
import { ClientService } from '../services/client.service';

import * as chai from 'chai';

import * as sinon from 'sinon';

let should = chai.should();

describe(`IdentityComponent`, () => {

    let component: IdentityComponent;
    let fixture: ComponentFixture<IdentityComponent>;

    let mockModal;
    let mockAlertService;
    let mockIdentityService;
    let mockClientService;

    beforeEach(() => {

        mockModal = sinon.createStubInstance(NgbModal);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockClientService = sinon.createStubInstance(ClientService);

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
                IdentityComponent
            ],
            providers: [
                {provide: NgbModal, useValue: mockModal},
                {provide: AlertService, useValue: mockAlertService},
                {provide: IdentityService, useValue: mockIdentityService},
                {provide: ClientService, useValue: mockClientService}
            ]
        });

        fixture = TestBed.createComponent(IdentityComponent);

        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        it('should create the component', () => {
            component.should.be.ok;
        });

        it('should load the component', () => {
            let loadMock = sinon.stub(component, 'loadIdentities');

            component.ngOnInit();

            loadMock.should.have.been.called;
        });
    });

    describe('load identities', () => {
        it('should load the identities', fakeAsync(() => {
            mockIdentityService.getCurrentIdentities.returns(Promise.resolve(['idOne', 'idTwo']));
            mockIdentityService.getCurrentIdentity.returns(Promise.resolve('my identity'));

            component.loadIdentities();

            tick();

            component['identities'].should.deep.equal(['idOne', 'idTwo']);
            component['currentIdentity'].should.equal('my identity');
        }));

        it('should give an alert if there is an error', fakeAsync(() => {
            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            mockIdentityService.getCurrentIdentities.returns(Promise.resolve(['idOne', 'idTwo']));
            mockIdentityService.getCurrentIdentity.returns(Promise.reject('some error'));

            component.loadIdentities();

            tick();

            component['identities'].should.deep.equal(['idOne', 'idTwo']);
            should.not.exist(component['currentIdentity']);

            mockAlertService.errorStatus$.next.should.have.been.called;
        }));
    });

    describe('addId', () => {
        it('should add the id', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                result: Promise.resolve()
            });

            let mockLoadIdentities = sinon.stub(component, 'loadIdentities');

            component.addId();

            tick();

            mockLoadIdentities.should.have.been.called;
            mockModal.open.should.have.been.called;
        }));

        it('should handle an error', fakeAsync(() => {
            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            mockModal.open = sinon.stub().returns({
                result: Promise.reject('some error')
            });

            let mockLoadIdentities = sinon.stub(component, 'loadIdentities');

            component.addId();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
            mockLoadIdentities.should.not.have.been.called;
            mockModal.open.should.have.been.called;
        }));

        it('should handle escape being pressed', fakeAsync(() => {
            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            mockModal.open = sinon.stub().returns({
                result: Promise.reject(1)
            });

            let mockLoadIdentities = sinon.stub(component, 'loadIdentities');

            component.addId();

            tick();

            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockLoadIdentities.should.not.have.been.called;
            mockModal.open.should.have.been.called;
        }));
    });

    describe('issueNewId', () => {
        beforeEach(() => {
            mockModal.open.reset();
        });

        it('should issue id', fakeAsync(() => {
            let mockLoadIdentities = sinon.stub(component, 'loadIdentities');
            mockModal.open.onFirstCall().returns({
                result: Promise.resolve({userID: 'myId', userSecret: 'mySecret'})
            });

            mockModal.open.onSecondCall().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            component.issueNewId();

            tick();

            mockLoadIdentities.should.have.been.called;
        }));

        it('should handle error in id creation', fakeAsync(() => {
            let mockLoadIdentities = sinon.stub(component, 'loadIdentities');

            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            mockModal.open.onFirstCall().returns({
                result: Promise.reject('some error')
            });

            component.issueNewId();

            tick();

            mockModal.open.should.have.been.calledOnce;

            mockAlertService.errorStatus$.next.should.have.been.called;

            mockLoadIdentities.should.have.been.called;
        }));

        it('should handle escape being pressed', fakeAsync(() => {
            let mockLoadIdentities = sinon.stub(component, 'loadIdentities');

            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            mockModal.open.onFirstCall().returns({
                result: Promise.reject(1)
            });

            component.issueNewId();

            tick();

            mockModal.open.should.have.been.calledOnce;

            mockAlertService.errorStatus$.next.should.not.have.been.called;

            mockLoadIdentities.should.have.been.called;
        }));

        it('should handle id in id displaying', fakeAsync(() => {
            let mockLoadIdentities = sinon.stub(component, 'loadIdentities');

            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            mockModal.open.onFirstCall().returns({
                result: Promise.resolve({userID: 'myId', userSecret: 'mySecret'})
            });

            mockModal.open.onSecondCall().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.issueNewId();

            tick();

            mockLoadIdentities.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should not issue identity if cancelled', fakeAsync(() => {
            let mockLoadIdentities = sinon.stub(component, 'loadIdentities');

            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            mockModal.open.onFirstCall().returns({
                result: Promise.resolve()
            });

            component.issueNewId();

            tick();

            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockLoadIdentities.should.have.been.called;

        }));
    });

    describe('setCurrentIdentity', () => {
        it('should set the current identity', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockAlertService.busyStatus$ = {next: sinon.stub()};

            component.setCurrentIdentity('bob');

            tick();

            component['currentIdentity'].should.equal('bob');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('bob');
            mockClientService.ensureConnected.should.have.been.calledWith(true);
            mockAlertService.busyStatus$.next.should.have.been.calledTwice;
        }));

        it('should do nothing if the new identity matches the current identity', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockAlertService.busyStatus$ = {next: sinon.stub()};
            component['currentIdentity'] = 'bob';

            component.setCurrentIdentity('bob');

            tick();

            component['currentIdentity'].should.equal('bob');
            mockIdentityService.setCurrentIdentity.should.not.have.been.called;
            mockClientService.ensureConnected.should.not.have.been.called;
            mockAlertService.busyStatus$.next.should.not.have.been.called;
        }));

        it('should handle errors', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.reject('Testing'));
            mockAlertService.busyStatus$ = {next: sinon.stub()};
            mockAlertService.errorStatus$ = {next: sinon.stub()};

            component.setCurrentIdentity('bob');

            tick();

            mockAlertService.busyStatus$.next.should.have.been.calledTwice;
            mockAlertService.busyStatus$.next.should.have.been.calledWith(null);
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));
    });
});
