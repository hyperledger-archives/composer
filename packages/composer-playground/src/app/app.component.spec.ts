/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:use-host-property-decorator*/
/* tslint:disable:no-input-rename*/
/* tslint:disable:member-ordering*/
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Subject } from 'rxjs/Rx';
import { Directive, Input, Injectable } from '@angular/core';
import { AppComponent } from './app.component';
import { ClientService } from './services/client.service';
import { InitializationService } from './services/initialization.service';
import { ConnectionProfileService } from './services/connectionprofile.service';
import { IdentityService } from './services/identity.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { AlertService } from './basic-modals/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { BusinessNetworkConnection } from 'composer-client';
import { AdminService } from './services/admin.service';
import { WalletService } from './services/wallet.service';
import { AboutService } from './services/about.service';
import { TransactionService } from './services/transaction.service';

import { FileWallet } from 'composer-common';

import * as sinon from 'sinon';

import * as chai from 'chai';
import { AdminConnection } from 'composer-admin';

let should = chai.should();

class MockAlertService {
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<any> = new BehaviorSubject<any>(null);
    public successStatus$: Subject<any> = new BehaviorSubject<any>(null);
}

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
            nav = new NavigationEnd(0, event.url, null);
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

@Directive({
    selector: '[routerLink]',
    host: {
        '(click)': 'onClick()'
    }
})
class MockRouterLinkDirective {
    @Input('routerLink') linkParams: any;
    navigatedTo: any = null;

    onClick() {
        this.navigatedTo = this.linkParams;
    }
}

@Directive({
    selector: '[routerLinkActive]'
})
class MockRouterLinkActiveDirective {
    @Input('routerLinkActive') linkParams: any;
}

@Directive({
    selector: 'router-outlet'
})
class MockRouterOutletDirective {
}

@Directive({
    selector: 'success'
})
class MockSuccessDirective {
}

@Directive({
    selector: 'ngbModalContainer'
})
class MockNgbModalContainerDirective {
}

@Injectable()
export class ActivatedRouteStub {

    // ActivatedRoute.queryParams is Observable
    private subject = new BehaviorSubject(this.testParams);
    public queryParams = this.subject.asObservable();

    // Test parameters
    private _testParams: {};
    get testParams() {
        return this._testParams;
    }

    set testParams(queryParams: {}) {
        this._testParams = queryParams;
        this.subject.next(queryParams);
    }

    // ActivatedRoute.snapshot.params
    get snapshot() {
        return {params: this.testParams};
    }
}

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;

    let mockClientService;
    let mockInitializationService;
    let mockAlertService: MockAlertService;
    let mockModal;
    let mockAdminService;
    let mockTransactionService;
    let mockConnectionProfileService;
    let mockBusinessNetworkConnection;
    let mockWalletService;
    let mockIdentityService;
    let mockLocalStorageService;
    let mockAboutService;
    let mockAdminConnection;
    let mockWindow;

    let linkDes;
    let links;

    let activatedRoute: ActivatedRouteStub;
    let routerStub: RouterStub;

    beforeEach(async(() => {
        mockClientService = sinon.createStubInstance(ClientService);
        mockInitializationService = sinon.createStubInstance(InitializationService);

        mockModal = sinon.createStubInstance(NgbModal);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockWalletService = sinon.createStubInstance(WalletService);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockLocalStorageService = sinon.createStubInstance(LocalStorageService);
        mockAboutService = sinon.createStubInstance(AboutService);
        mockAdminConnection = sinon.createStubInstance(AdminConnection);
        mockTransactionService = sinon.createStubInstance(TransactionService);
        mockTransactionService.event$ = new BehaviorSubject<string>(null);

        mockAlertService = new MockAlertService();

        activatedRoute = new ActivatedRouteStub();
        routerStub = new RouterStub();

        mockWindow = {
            location: {
                reload: sinon.stub()
            }
        };

        TestBed.configureTestingModule({
            declarations: [AppComponent, MockRouterOutletDirective, MockRouterLinkDirective, MockRouterLinkActiveDirective, MockSuccessDirective, MockNgbModalContainerDirective],
            providers: [
                {provide: NgbModal, useValue: mockModal},
                {provide: InitializationService, useValue: mockInitializationService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: ClientService, useValue: mockClientService},
                {provide: ActivatedRoute, useValue: activatedRoute},
                {provide: Router, useValue: routerStub},
                {provide: AdminService, useValue: mockAdminService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: WalletService, useValue: mockWalletService},
                {provide: IdentityService, useValue: mockIdentityService},
                {provide: LocalStorageService, useValue: mockLocalStorageService},
                {provide: AboutService, useValue: mockAboutService},
                {provide: TransactionService, useValue: mockTransactionService}
            ]
        })

        .compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
    }));

    function updateComponent() {
        // trigger initial data binding
        fixture.detectChanges();

        // find DebugElements with an attached RouterLinkStubDirective
        linkDes = fixture.debugElement
        .queryAll(By.directive(MockRouterLinkDirective));

        // get the attached link directive instances using the DebugElement injectors
        links = linkDes
        .map((de) => de.injector.get(MockRouterLinkDirective) as MockRouterLinkDirective);
    }

    describe('ngOnInit', () => {
        let mockOnBusy;
        let mockOnError;
        let mockOnEvent;
        let mockUpdateConnectionData;
        let mockQueryParamUpdated;
        let busyStatusSubscribeSpy;
        let errorStatusSubscribeSpy;
        let eventSubscribeSpy;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnEvent = sinon.stub(component, 'onEvent');
            mockUpdateConnectionData = sinon.stub(component, 'updateConnectionData');
            mockQueryParamUpdated = sinon.stub(component, 'queryParamsUpdated');
            busyStatusSubscribeSpy = sinon.spy(mockAlertService.busyStatus$, 'subscribe');
            errorStatusSubscribeSpy = sinon.spy(mockAlertService.errorStatus$, 'subscribe');
            eventSubscribeSpy = sinon.spy(mockTransactionService.event$, 'subscribe');
        }));

        it('should create', () => {
            updateComponent();

            component.should.be.ok;
        });

        it('should call the busy function', fakeAsync(() => {
            updateComponent();

            mockAlertService.busyStatus$.next('message');

            tick();

            mockOnBusy.should.have.been.calledWith('message');
        }));

        it('should call the error function', fakeAsync(() => {
            updateComponent();

            mockAlertService.errorStatus$.next('message');

            tick();

            mockOnError.should.have.been.calledWith('message');
        }));

        it('should call the query param updated function', () => {
            activatedRoute.testParams = {name: 'bob'};

            updateComponent();

            mockQueryParamUpdated.should.have.been.calledWith({name: 'bob'});
        });

        it('should open the welcome modal', () => {
            let welcomeModalStub = sinon.stub(component, 'openWelcomeModal');

            routerStub.eventParams = {url: '/', nav: 'end'};

            updateComponent();

            welcomeModalStub.should.have.been.called;
        });

        it('should check version and open version modal', fakeAsync(() => {
            let checkVersionStub = sinon.stub(component, 'checkVersion').returns(Promise.resolve(false));
            let openVersionModalStub = sinon.stub(component, 'openVersionModal');

            routerStub.eventParams = {url: '/bob', nav: 'end'};

            updateComponent();

            tick();

            checkVersionStub.should.have.been.called;
            openVersionModalStub.should.have.been.called;

        }));

        it('should check version and not open version modal', fakeAsync(() => {
            let checkVersionStub = sinon.stub(component, 'checkVersion').returns(Promise.resolve(true));
            let openVersionModalStub = sinon.stub(component, 'openVersionModal');

            routerStub.eventParams = {url: '/bob', nav: 'end'};

            updateComponent();

            tick();

            checkVersionStub.should.have.been.called;
            openVersionModalStub.should.not.have.been.called;

        }));

        it('should not do anything on non navigation end events', fakeAsync(() => {
            let checkVersionStub = sinon.stub(component, 'checkVersion');
            let welcomeModalStub = sinon.stub(component, 'openWelcomeModal');

            routerStub.eventParams = {url: '/', nav: 'start'};

            updateComponent();

            tick();

            checkVersionStub.should.not.have.been.called;
            welcomeModalStub.should.not.have.been.called;

        }));
    });

    describe('RouterLink', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamUpdated;
        let busyStatusSubscribeSpy;
        let errorStatusSubscribeSpy;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamUpdated = sinon.stub(component, 'queryParamsUpdated');
            busyStatusSubscribeSpy = sinon.spy(mockAlertService.busyStatus$, 'subscribe');
            errorStatusSubscribeSpy = sinon.spy(mockAlertService.errorStatus$, 'subscribe');
        }));

        it('can get RouterLinks from template', () => {
            activatedRoute.testParams = {};

            updateComponent();

            links.length.should.equal(3);
            links[0].linkParams.should.deep.equal(['editor']);
            links[1].linkParams.should.deep.equal(['test']);
            links[2].linkParams.should.deep.equal(['identity']);
        });

        it('can get RouterLinks from template when using locally', () => {
            activatedRoute.testParams = {};

            component['usingLocally'] = true;

            updateComponent();

            links.length.should.equal(4);
            links[0].linkParams.should.deep.equal(['editor']);
            links[1].linkParams.should.deep.equal(['test']);
            links[2].linkParams.should.deep.equal(['identity']);
            links[3].linkParams.should.deep.equal(['profile']);
        });

        it('can click test link in template', () => {
            updateComponent();

            const testLinkDe = linkDes[1];
            const testLink = links[1];

            should.not.exist(testLink.navigatedTo);

            testLinkDe.triggerEventHandler('click', null);
            fixture.detectChanges();

            testLink.navigatedTo.should.deep.equal(['test']);
        });

        it('can click editor link in template', () => {
            updateComponent();

            const testLinkDe = linkDes[0];
            const testLink = links[0];

            should.not.exist(testLink.navigatedTo);

            testLinkDe.triggerEventHandler('click', null);
            fixture.detectChanges();

            testLink.navigatedTo.should.deep.equal(['editor']);
        });

        it('can click identity link in template', () => {
            updateComponent();

            const testLinkDe = linkDes[2];
            const testLink = links[2];

            should.not.exist(testLink.navigatedTo);

            testLinkDe.triggerEventHandler('click', null);
            fixture.detectChanges();

            testLink.navigatedTo.should.deep.equal(['identity']);
        });

        it('can click profile link in template', () => {
            component['usingLocally'] = true;

            updateComponent();

            const testLinkDe = linkDes[3];
            const testLink = links[3];

            should.not.exist(testLink.navigatedTo);

            testLinkDe.triggerEventHandler('click', null);
            fixture.detectChanges();

            testLink.navigatedTo.should.deep.equal(['profile']);
        });
    });

    describe('queryParamsUpdated', () => {
        let mockWallet;
        let mockOnBusy;
        let mockOnError;
        let errorStatusSpy;

        beforeEach(async(() => {
            mockWallet = sinon.createStubInstance(FileWallet);
            routerStub.navigate.returns(Promise.resolve(false));

            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            errorStatusSpy = sinon.spy(mockAlertService.errorStatus$, 'next');
        }));

        it('should deal with an invitation when already in wallet', fakeAsync(() => {
            mockIdentityService.setIdentity.returns(Promise.resolve());
            mockAdminService.getAdminConnection.returns(mockAdminConnection);
            mockWallet.contains.returns(Promise.resolve(true));
            mockWalletService.getWallet.returns(mockWallet);
            activatedRoute.testParams = {invitation: 'N4Igxg9gdlCmYBcCW0AKAnCAzJAbWAcgIYC2sIABAFwUgBGEdIANLZDPMmpjvpTSBIBPDNjzlWIAK4BnWOgCSAEX61hAVTmKVk2fIDK8dLASrBQw2GOmAvkA'};

            updateComponent();

            tick();

            mockAdminService.getAdminConnection.should.have.been.called;
            mockAdminConnection.createProfile.should.have.been.calledWith('bob', 'myProfile');
            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('bob');
            mockWalletService.getWallet.should.have.been.calledWith('bob');

            mockWallet.contains.should.have.been.called; // With('myUserID');
            mockWallet.update.should.have.been.calledWith('myUserID', 'mySecret');
            mockIdentityService.setIdentity.should.have.been.calledWith('bob', 'myUserID');

            routerStub.navigate.should.have.been.calledWith(['/editor']);

            // This happens to avoid doing the window.location.reload which breaks the test and is really hard to stub
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should deal with an invitation when not in wallet', fakeAsync(() => {
            mockIdentityService.setIdentity.returns(Promise.resolve());
            mockAdminService.getAdminConnection.returns(mockAdminConnection);
            mockWallet.contains.returns(Promise.resolve(false));
            mockWalletService.getWallet.returns(mockWallet);
            activatedRoute.testParams = {invitation: 'N4Igxg9gdlCmYBcCW0AKAnCAzJAbWAcgIYC2sIABAFwUgBGEdIANLZDPMmpjvpTSBIBPDNjzlWIAK4BnWOgCSAEX61hAVTmKVk2fIDK8dLASrBQw2GOmAvkA'};

            updateComponent();

            tick();

            mockAdminService.getAdminConnection.should.have.been.called;
            mockAdminConnection.createProfile.should.have.been.calledWith('bob', 'myProfile');
            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('bob');
            mockWalletService.getWallet.should.have.been.calledWith('bob');

            mockWallet.contains.should.have.been.calledWith('myUserID');
            mockWallet.add.should.have.been.calledWith('myUserID', 'mySecret');
            mockIdentityService.setIdentity.should.have.been.calledWith('bob', 'myUserID');

            routerStub.navigate.should.have.been.calledWith(['/editor']);

            // This happens to avoid doing the window.location.reload which breaks the test and is really hard to stub
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should deal with an invitation that errors', fakeAsync(() => {
            mockIdentityService.setIdentity.returns(Promise.resolve());
            mockAdminService.getAdminConnection.returns(mockAdminConnection);
            mockWallet.contains.returns(Promise.reject('some error'));
            mockWalletService.getWallet.returns(mockWallet);
            activatedRoute.testParams = {invitation: 'N4Igxg9gdlCmYBcCW0AKAnCAzJAbWAcgIYC2sIABAFwUgBGEdIANLZDPMmpjvpTSBIBPDNjzlWIAK4BnWOgCSAEX61hAVTmKVk2fIDK8dLASrBQw2GOmAvkA'};

            updateComponent();

            tick();

            mockAdminService.getAdminConnection.should.have.been.called;
            mockAdminConnection.createProfile.should.have.been.calledWith('bob', 'myProfile');
            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('bob');
            mockWalletService.getWallet.should.have.been.calledWith('bob');

            mockWallet.contains.should.have.been.calledWith('myUserID');
            mockWallet.add.should.not.have.been.called;
            mockWallet.update.should.not.have.been.called;
            mockIdentityService.setIdentity.should.not.have.been.called;

            routerStub.navigate.should.not.have.been.called;

            // This happens to avoid doing the window.location.reload which breaks the test and is really hard to stub
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should load the connection profiles when local', fakeAsync(() => {
            mockIdentityService.getCurrentIdentity.returns(Promise.resolve('bob'));
            mockInitializationService.isWebOnly.returns(Promise.resolve(false));
            mockBusinessNetworkConnection.ping.returns(Promise.resolve({version: 1.0, participant: 'bob'}));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
            let updateConnectionDataMock = sinon.stub(component, 'updateConnectionData').returns(Promise.resolve());

            activatedRoute.testParams = {};

            updateComponent();

            tick();

            // update now got info back about if local or not
            updateComponent();

            mockConnectionProfileService.getCurrentConnectionProfile.should.have.been.called;
            updateConnectionDataMock.should.have.been.calledTwice;

            mockInitializationService.initialize.should.have.been.called;
            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.ping.should.have.been.called;

            mockIdentityService.getCurrentIdentity.should.have.been.called;

            component['usingLocally'].should.equal(true);
            component['currentIdentity'].should.equal('bob');
            component['composerRuntimeVersion'].should.equal(1.0);
            component['participantFQI'].should.equal('bob');

            links.length.should.equal(4);
            links[0].linkParams.should.deep.equal(['editor']);
            links[1].linkParams.should.deep.equal(['test']);
            links[2].linkParams.should.deep.equal(['identity']);
            links[3].linkParams.should.deep.equal(['profile']);
        }));

        it('should load the connection profiles but get no info from ping', fakeAsync(() => {
            component['composerRuntimeVersion'] = '1.0';
            component['participantFQI'] = 'bob';
            mockIdentityService.getCurrentIdentity.returns(Promise.resolve('bob'));
            mockInitializationService.isWebOnly.returns(Promise.resolve(true));
            mockBusinessNetworkConnection.ping.returns(Promise.resolve({}));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
            let updateConnectionDataMock = sinon.stub(component, 'updateConnectionData').returns(Promise.resolve());

            activatedRoute.testParams = {};

            updateComponent();

            tick();

            mockConnectionProfileService.getCurrentConnectionProfile.should.have.been.called;
            updateConnectionDataMock.should.have.been.calledTwice;

            mockInitializationService.initialize.should.have.been.called;
            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.ping.should.have.been.called;

            mockIdentityService.getCurrentIdentity.should.have.been.called;

            component['usingLocally'].should.equal(false);
            component['currentIdentity'].should.equal('bob');
            component['composerRuntimeVersion'].should.equal('1.0');
            component['participantFQI'].should.equal('bob');
        }));
    });

    describe('updateConnectionData', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
        }));

        it('should update the connection profile data', fakeAsync(() => {
            mockAdminConnection.getAllProfiles.returns(Promise.resolve(Promise.resolve({bob: {type: 'web'}})));
            mockAdminService.getAdminConnection.returns(mockAdminConnection);
            mockIdentityService.getCurrentIdentities.returns(Promise.resolve(['bob', 'fred']));

            activatedRoute.testParams = {};

            updateComponent();

            component.updateConnectionData();

            tick();

            component['connectionProfiles'].length.should.equal(1);
            component['connectionProfiles'].should.deep.equal([{default: false, name: 'bob', profile: {type: 'web'}}]);

            component['identities'].should.deep.equal(['bob', 'fred']);
        }));
    });

    describe('onBusyStatus', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
            mockModal.open.returns({componentInstance: {}, close: sinon.stub()});
        }));

        it('should not show if in web mode', () => {
            mockConnectionProfileService.getCurrentConnectionProfile.returns('$default');

            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus('message');

            mockModal.open.should.not.have.been.called;
        });

        it('should open the modal', () => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus('message');

            mockModal.open.should.have.been.called;

            component['busyModalRef'].componentInstance.busy.should.equal('message');
        });

        it('should open the modal and update the status', () => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus('message');

            component['busyModalRef'].componentInstance.busy.should.equal('message');

            component.onBusyStatus('bob');

            component['busyModalRef'].componentInstance.busy.should.equal('bob');

            mockModal.open.should.have.been.calledOnce;
        });

        it('should open the modal and close it', () => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus('message');

            component['busyModalRef'].componentInstance.busy.should.equal('message');

            component.onBusyStatus(null);

            should.not.exist(component['busyModalRef']);

            mockModal.open.should.have.been.calledOnce;
        });

        it('should not open the modal if no message', () => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus(null);

            mockModal.open.should.not.have.been.calledOnce;

        });
    });

    describe('onErrorStatus', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
            mockModal.open.returns({componentInstance: {}});

        }));

        it('should deal with error status', () => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnError.restore();

            component.onErrorStatus('message');

            mockModal.open.should.have.been.called;

        });

        it('shouldnot show if no message', () => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnError.restore();

            component.onErrorStatus(null);

            mockModal.open.should.not.have.been.called;
        });
    });

    describe('openWelcomeModal', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
            mockModal.open.returns({componentInstance: {}});

        }));

        it('should open the welcome modal', fakeAsync(() => {
            let checkVersionStub = sinon.stub(component, 'checkVersion').returns(Promise.resolve(true));

            activatedRoute.testParams = {};

            updateComponent();

            component['openWelcomeModal']();

            tick();

            checkVersionStub.should.have.been.called;

            mockModal.open.should.have.been.called;
        }));

        it('should open the version modal', fakeAsync(() => {
            let checkVersionStub = sinon.stub(component, 'checkVersion').returns(Promise.resolve(false));

            activatedRoute.testParams = {};

            updateComponent();

            component['openWelcomeModal']();

            tick();

            checkVersionStub.should.have.been.called;

            mockModal.open.should.have.been.called;
        }));
    });

    describe('openVersionModal', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
            mockModal.open.returns({componentInstance: {}});

        }));

        it('should open version modal', () => {
            activatedRoute.testParams = {};

            updateComponent();

            component['openVersionModal']();

            mockModal.open.should.have.been.called;
        });
    });

    describe('openVersionModal', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');

        }));

        it('should check the version return true', fakeAsync(() => {
            let getPlayGroundDetailsStub = sinon.stub(component, 'getPlaygroundDetails').returns(null);
            let setPlayGroundDetailsStub = sinon.stub(component, 'setPlaygroundDetails').returns(Promise.resolve());

            activatedRoute.testParams = {};

            updateComponent();

            component['checkVersion']().then((result) => {
                result.should.equal(true);
            });

            tick();

            getPlayGroundDetailsStub.should.have.been.called;
            setPlayGroundDetailsStub.should.have.been.called;
        }));

        it('should check the version when already have playground details and return true', fakeAsync(() => {
            let getPlayGroundDetailsStub = sinon.stub(component, 'getPlaygroundDetails').returns(1.0);
            let setPlayGroundDetailsStub = sinon.stub(component, 'setPlaygroundDetails');

            mockAboutService.getVersions.returns(Promise.resolve({playground: {version: 1.0}}));

            activatedRoute.testParams = {};

            updateComponent();

            component['checkVersion']().then((result) => {
                result.should.equal(true);
            });

            tick();

            getPlayGroundDetailsStub.should.have.been.called;
            setPlayGroundDetailsStub.should.not.have.been.called;
            mockAboutService.getVersions.should.have.been.called;
        }));

        it('should check the version when already have playground details and return false when versions don\'t match', fakeAsync(() => {
            let getPlayGroundDetailsStub = sinon.stub(component, 'getPlaygroundDetails').returns(1.4);
            let setPlayGroundDetailsStub = sinon.stub(component, 'setPlaygroundDetails');

            mockAboutService.getVersions.returns(Promise.resolve({playground: {version: 1.0}}));

            activatedRoute.testParams = {};

            updateComponent();

            component['checkVersion']().then((result) => {
                result.should.equal(false);
            });

            tick();

            getPlayGroundDetailsStub.should.have.been.called;
            setPlayGroundDetailsStub.should.not.have.been.called;
            mockAboutService.getVersions.should.have.been.called;
        }));
    });

    describe('setPlaygroundDetails', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');

        }));

        it('should set the playground details', fakeAsync(() => {
            mockAboutService.getVersions.returns(Promise.resolve({playground: {version: 1.0}}));

            activatedRoute.testParams = {};

            updateComponent();

            component['setPlaygroundDetails']();

            tick();

            mockAboutService.getVersions.should.have.been.called;
            mockLocalStorageService.set.should.have.been.calledWith('playgroundVersion', 1.0);
        }));
    });

    describe('getPlaygroundDetails', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');

        }));

        it('should get the playground details', () => {
            mockLocalStorageService.get.returns('1.0');

            activatedRoute.testParams = {};

            updateComponent();

            let result = component['getPlaygroundDetails']();

            mockLocalStorageService.get.should.have.been.calledWith('playgroundVersion');

            result.should.equal('1.0');
        });
    });

});
