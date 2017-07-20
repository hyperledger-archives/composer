/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:use-host-property-decorator*/
/* tslint:disable:no-input-rename*/
/* tslint:disable:member-ordering*/
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Input, Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IdentityService } from '../services/identity.service';
import { ClientService } from '../services/client.service';
import { BehaviorSubject } from 'rxjs/Rx';

import { Router, NavigationEnd, NavigationStart } from '@angular/router';

import * as chai from 'chai';

import * as sinon from 'sinon';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AdminService } from '../services/admin.service';
import { InitializationService } from '../services/initialization.service';

import { LoginComponent } from './login.component';
import { AlertService } from '../basic-modals/alert.service';
import { WalletService } from '../services/wallet.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

let should = chai.should();

class RouterStub {

    // Route.events is Observable
    private subject = new BehaviorSubject(this.eventParams);
    public events = this.subject.asObservable();

    // Event parameters
    private _eventParams;
    get eventParams() {
        return this._eventParams;
    }

    set eventParams(event) {
        let nav;
        if (event.nav === 'end') {
            nav = new NavigationEnd(0, event.url, event.urlAfterRedirects);
        } else {
            nav = new NavigationStart(0, event.url);
        }
        this._eventParams = nav;
        this.subject.next(nav);
    }

    // Route.snapshot.events
    get snapshot() {
        return {params: this.events};
    }

    navigateByUrl(url: string) {
        return url;
    }

    navigate = sinon.stub();

}

@Component({
    selector: 'connection-profile',
    template: ''
})
class MockConnectionProfileComponent {

    @Input()
    public connectionProfile;
    @Output()
    public profileUpdated: EventEmitter<any> = new EventEmitter<any>();
}

@Component({
    selector: 'identity-card',
    template: ''
})
class MockIdentityCardComponent {
    @Input() identity: any;
}

describe(`LoginComponent`, () => {

    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    let mockAdminService;
    let mockIdentityService;
    let mockClientService;
    let mockConnectionProfileService;
    let mockInitializationService;
    let routerStub;
    let mockAlertService;
    let mockWalletService;
    let mockModal;

    beforeEach(() => {

        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockInitializationService = sinon.createStubInstance(InitializationService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockWalletService = sinon.createStubInstance(WalletService);
        mockModal = sinon.createStubInstance(NgbModal);

        routerStub = new RouterStub();

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        mockWalletService.removeFromWallet = sinon.stub().returns(Promise.resolve(true));

        TestBed.configureTestingModule({
            declarations: [
                LoginComponent,
                MockConnectionProfileComponent,
                MockIdentityCardComponent
            ],
            providers: [
                {provide: IdentityService, useValue: mockIdentityService},
                {provide: ClientService, useValue: mockClientService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: Router, useValue: routerStub},
                {provide: AdminService, useValue: mockAdminService},
                {provide: InitializationService, useValue: mockInitializationService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: WalletService, useValue: mockWalletService},
                {provide: NgbModal, useValue: mockModal}
            ]
        });

        fixture = TestBed.createComponent(LoginComponent);

        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        it('should create the component', () => {
            component.should.be.ok;
        });

        it('should load identities', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            let loadConnectionProfilesStub = sinon.stub(component, 'loadConnectionProfiles');
            component.ngOnInit();

            tick();

            mockInitializationService.initialize.should.have.been.called;
            loadConnectionProfilesStub.should.have.been.called;
        }));
    });

    describe('loadConnectionProfiles', () => {
        it('should load the connection profile', fakeAsync(() => {
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve({myProfile: {name: 'myProfile'}}));

            mockIdentityService.getIdentities.returns(Promise.resolve(['bob']));

            component.loadConnectionProfiles();

            tick();

            mockConnectionProfileService.getAllProfiles.should.have.been.called;

            mockIdentityService.getIdentities.should.have.been.calledWith('myProfile');

            component['connectionProfiles'].should.deep.equal([{
                name: 'myProfile',
                profile: {name: 'myProfile'},
                default: false,
                identities: [{
                    userId: 'bob',
                    businessNetwork: 'org-acme-biznet'
                }]
            }]);
        }));
    });

    describe('changeIdentity', () => {
        it('should change identity', fakeAsync(() => {
            mockAdminService.list.returns(Promise.resolve(['myNetwork']));
            mockClientService.ensureConnected.returns(Promise.resolve());

            component.changeIdentity('myProfile', 'bob');

            tick();

            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('myProfile');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('bob');
            mockAdminService.list.should.have.been.called;
            mockClientService.ensureConnected.should.have.been.calledWith('myNetwork', true);

            mockIdentityService.setLoggedIn.should.have.been.calledWith(true);
            routerStub.navigate.should.have.been.calledWith(['editor']);
        }));

        it('should handle error', fakeAsync(() => {
            mockAdminService.list.returns(Promise.reject('some error'));
            mockClientService.ensureConnected.returns(Promise.resolve());

            component.changeIdentity('myProfile', 'bob');

            tick();

            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('myProfile');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('bob');
            mockAdminService.list.should.have.been.called;
            mockClientService.ensureConnected.should.not.have.been.called;

            mockIdentityService.setLoggedIn.should.not.have.been.called;
            routerStub.navigate.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));
    });

    describe('editConnectionProfile', () => {
        it('should edit the connection profile', () => {
            component.should.be.ok;
            component.editConnectionProfile('myProfile');

            component['editingConectionProfile'].should.equal('myProfile');
        });
    });

    describe('finishedEditingConnectionProfile', () => {
        it('should close editing connection profile screen', () => {
            let loadConnectionProfilesStub = sinon.stub(component, 'loadConnectionProfiles');
            component.finishedEditingConnectionProfile();

            should.not.exist(component['editingConectionProfile']);
            loadConnectionProfilesStub.should.have.been.called;
        });
    });

    describe('removeIdentity', () => {
        it('should open the delete-confirm modal', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(0)
            });

            component.removeIdentity('profile', 'name');
            tick();
            mockModal.open.should.have.been.called;
        }));

        it('should open delete-confirm modal and handle error', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.removeIdentity('profile', 'name');
            tick();
            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should open delete-confirm modal and handle cancel', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            component.removeIdentity('profile', 'name');
            tick();
            mockAlertService.busyStatus$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should refresh the connection profiles after successfully calling walletService.removeFromWallet()', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            component.loadConnectionProfiles = sinon.stub();

            component.removeIdentity('profile', 'name');
            tick();

            // check services called
            component.loadConnectionProfiles.should.have.been.called;
            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;

            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should handle errors when calling walletService.removeFromWallet()', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            component.loadConnectionProfiles = sinon.stub();
            mockWalletService.removeFromWallet = sinon.stub().returns(Promise.reject('some error'));

            component.removeIdentity('profile', 'name');
            tick();

            // check services called
            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;

            mockAlertService.successStatus$.next.should.not.have.been.called;
            component.loadConnectionProfiles.should.not.have.been.called;
        }));
    });
});
