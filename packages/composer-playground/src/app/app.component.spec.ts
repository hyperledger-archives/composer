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
/* tslint:disable:use-host-property-decorator*/
/* tslint:disable:no-input-rename*/
/* tslint:disable:member-ordering*/
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Subject } from 'rxjs/Rx';
import { Directive, Injectable, Input } from '@angular/core';
import { AppComponent } from './app.component';
import { ClientService } from './services/client.service';
import { InitializationService } from './services/initialization.service';
import { IdentityCardService } from './services/identity-card.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { AlertService } from './basic-modals/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { BusinessNetworkConnection } from 'composer-client';
import { AdminService } from './services/admin.service';
import { AboutService } from './services/about.service';
import { ConfigService } from './services/config.service';
import { Config } from './services/config/configStructure.service';
import { FileService } from './services/file.service';

import { IdCard } from 'composer-common';
import { AdminConnection } from 'composer-admin';

import * as sinon from 'sinon';

import * as chai from 'chai';

let should = chai.should();

class MockAlertService {
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<any> = new BehaviorSubject<any>(null);
    public successStatus$: Subject<any> = new BehaviorSubject<any>(null);
    public transactionEvent$: Subject<object> = new BehaviorSubject<object>(null);
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
    let mockBusinessNetworkConnection;
    let mockIdCard;
    let mockIdentityCardService;
    let mockLocalStorageService;
    let mockAboutService;
    let mockConfigService;
    let mockConfig;
    let mockAdminConnection;
    let mockFileService;

    let linkDes;
    let links;

    let activatedRoute: ActivatedRouteStub;
    let routerStub: RouterStub;

    let checkVersionStub;

    let analyticsMock;

    beforeEach(async(() => {
        mockClientService = sinon.createStubInstance(ClientService);
        mockInitializationService = sinon.createStubInstance(InitializationService);
        mockFileService = sinon.createStubInstance(FileService);
        mockModal = sinon.createStubInstance(NgbModal);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockIdCard = sinon.createStubInstance(IdCard);
        mockIdCard.getConnectionProfile.returns({'name': '$default', 'x-type': 'web'});
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockIdentityCardService.getCurrentIdentityCard.returns(mockIdCard);
        mockLocalStorageService = sinon.createStubInstance(LocalStorageService);
        mockAboutService = sinon.createStubInstance(AboutService);
        mockConfigService = sinon.createStubInstance(ConfigService);
        mockConfig = sinon.createStubInstance(Config);
        mockConfig.setToDefault();
        mockConfigService.getConfig.returns(mockConfig);
        mockAdminConnection = sinon.createStubInstance(AdminConnection);

        mockAlertService = new MockAlertService();

        activatedRoute = new ActivatedRouteStub();
        routerStub = new RouterStub();

        analyticsMock = global['window'].ga = sinon.stub();

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
                {provide: IdentityCardService, useValue: mockIdentityCardService},
                {provide: LocalStorageService, useValue: mockLocalStorageService},
                {provide: AboutService, useValue: mockAboutService},
                {provide: ConfigService, useValue: mockConfigService},
                {provide: FileService, useValue: mockFileService}
            ]
        })

            .compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        checkVersionStub = sinon.stub(component, 'checkVersion');
    }));

    function updateComponent(checkVersion = true) {
        checkVersionStub.returns(Promise.resolve(checkVersion));

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
        let mockOnTransactionEvent;
        let mockQueryParamUpdated;
        let busyStatusSubscribeSpy;
        let errorStatusSubscribeSpy;
        let eventSubscribeSpy;
        let myConfig;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
            mockQueryParamUpdated = sinon.stub(component, 'queryParamsUpdated');
            busyStatusSubscribeSpy = sinon.spy(mockAlertService.busyStatus$, 'subscribe');
            errorStatusSubscribeSpy = sinon.spy(mockAlertService.errorStatus$, 'subscribe');
            eventSubscribeSpy = sinon.spy(mockAlertService.transactionEvent$, 'subscribe');

            myConfig = new Config();
            myConfig.webonly = true;
            myConfig.title = 'My Title';
            myConfig.banner = ['My', 'Banner'];
            myConfig.links = {
              docs: 'My Docs',
              tutorial: 'My Tutorial',
              community: 'My Community',
              github: 'My Github',
              install: 'My Install'
            };
            myConfig.analyticsID = 'myID';

            mockConfigService.getConfig.returns(myConfig);
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

        it('should call the transactionEvent function', fakeAsync(() => {
            updateComponent();

            mockAlertService.transactionEvent$.next({message: 'message'});

            tick();

            mockOnTransactionEvent.should.have.been.calledWith({message: 'message'});
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

            routerStub.eventParams = {url: '/login', nav: 'end'};

            updateComponent();

            welcomeModalStub.should.have.been.called;
        });

        it('should not send analytics', fakeAsync(() => {
            let openVersionModalStub = sinon.stub(component, 'openVersionModal');
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockClientService.getBusinessNetwork.returns({getName: sinon.stub().returns('bob')});

            routerStub.eventParams = {url: '/bob', urlAfterRedirects: '/bob', nav: 'end'};

            updateComponent(false);

            tick();

            analyticsMock.should.not.have.been.called;

            checkVersionStub.should.have.been.called;
            openVersionModalStub.should.have.been.called;
        }));

        it('should send analytics', fakeAsync(() => {
            let openVersionModalStub = sinon.stub(component, 'openVersionModal');
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockClientService.getBusinessNetwork.returns({getName: sinon.stub().returns('bob')});

            component['submitAnalytics'] = true;

            routerStub.eventParams = {url: '/bob', urlAfterRedirects: '/banana', nav: 'end'};

            updateComponent(false);

            tick();

            analyticsMock.firstCall.should.have.been.calledWith('set', 'page', '/banana');
            analyticsMock.secondCall.should.have.been.calledWith('send', 'pageview');

            checkVersionStub.should.have.been.called;
            openVersionModalStub.should.have.been.called;
        }));

        it('should check version and open version modal', fakeAsync(() => {
            let openVersionModalStub = sinon.stub(component, 'openVersionModal');
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockClientService.getBusinessNetwork.returns({getName: sinon.stub().returns('bob')});

            routerStub.eventParams = {url: '/bob', urlAfterRedirects: '/bob', nav: 'end'};

            updateComponent(false);

            tick();

            checkVersionStub.should.have.been.called;
            openVersionModalStub.should.have.been.called;

        }));

        it('should check version and not open version modal', fakeAsync(() => {
            let openVersionModalStub = sinon.stub(component, 'openVersionModal');
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockClientService.getBusinessNetwork.returns({getName: sinon.stub().returns('bob')});

            routerStub.eventParams = {url: '/bob', urlAfterRedirects: '/bob', nav: 'end'};

            updateComponent();

            tick();

            checkVersionStub.should.have.been.called;
            openVersionModalStub.should.not.have.been.called;

        }));

        it('should not do anything on non navigation end events', fakeAsync(() => {
            let welcomeModalStub = sinon.stub(component, 'openWelcomeModal');

            routerStub.eventParams = {url: '/', nav: 'start'};

            updateComponent();

            tick();

            welcomeModalStub.should.not.have.been.called;
        }));

        it('should show header links if logged in', fakeAsync(() => {
            routerStub.eventParams = {url: '/editor', urlAfterRedirects: '/editor', nav: 'end'};
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockClientService.getBusinessNetwork.returns({getName: sinon.stub().returns('bob')});

            updateComponent();

            tick();

            component['showHeaderLinks'].should.equal(true);

            checkVersionStub.should.have.been.called;
        }));

        it('should not show header links if not logged in', fakeAsync(() => {
            routerStub.eventParams = {url: '/login', nav: 'end'};

            updateComponent();

            tick();

            component['showHeaderLinks'].should.equal(false);

            checkVersionStub.should.have.been.called;
        }));

        it('should not show header links if redirected to login', fakeAsync(() => {
            routerStub.eventParams = {url: '/editor', nav: 'end', urlAfterRedirects: '/login'};

            updateComponent();

            tick();

            component['showHeaderLinks'].should.equal(false);

            checkVersionStub.should.have.been.called;
        }));

        it('should set the config using get config if config is loaded', fakeAsync(() => {
            let myTitleSpy = sinon.spy(component, 'setTitle');

            updateComponent();

            tick();

            component['config'].should.deep.equal(myConfig);
            myTitleSpy.should.have.been.called;
        }));

        it('should set the config using load config if getConfig fails', fakeAsync(() => {
            mockConfigService.getConfig.throws(new Error('error'));
            mockConfigService.loadConfig.returns(Promise.resolve(myConfig));

            let myTitleSpy = sinon.spy(component, 'setTitle');

            updateComponent();

            tick();

            component['config'].should.deep.equal(myConfig);
            myTitleSpy.should.have.been.called;
        }));
    });

    describe('RouterLink', () => {
        let mockOnBusy;
        let mockOnError;
        let mockOnTransactionEvent;
        let mockQueryParamUpdated;
        let busyStatusSubscribeSpy;
        let errorStatusSubscribeSpy;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
            mockQueryParamUpdated = sinon.stub(component, 'queryParamsUpdated');
            busyStatusSubscribeSpy = sinon.spy(mockAlertService.busyStatus$, 'subscribe');
            errorStatusSubscribeSpy = sinon.spy(mockAlertService.errorStatus$, 'subscribe');
        }));

        it('can get RouterLinks from template', () => {
            activatedRoute.testParams = {};
            component['showHeaderLinks'] = true;

            updateComponent();

            links.length.should.equal(3);
            links[0].linkParams.should.deep.equal(['editor']);
            links[1].linkParams.should.deep.equal(['test']);
            links[2].linkParams.should.deep.equal(['identity']);
        });

        it('can get RouterLinks from template when using locally', () => {
            activatedRoute.testParams = {};

            component['usingLocally'] = true;
            component['showHeaderLinks'] = true;
            component['connectionProfiles'] = [{name: 'test_name'}];

            updateComponent();

            links.length.should.equal(3);
            links[0].linkParams.should.deep.equal(['editor']);
            links[1].linkParams.should.deep.equal(['test']);
            links[2].linkParams.should.deep.equal(['identity']);
        });

        it('should not show links when not logged in', () => {
            activatedRoute.testParams = {};

            updateComponent();

            links.length.should.equal(0);
        });

        it('can click test link in template', () => {
            component['showHeaderLinks'] = true;
            updateComponent();

            const testLinkDe = linkDes[1];
            const testLink = links[1];

            should.not.exist(testLink.navigatedTo);

            testLinkDe.triggerEventHandler('click', null);
            fixture.detectChanges();

            testLink.navigatedTo.should.deep.equal(['test']);
        });

        it('can click editor link in template', () => {
            component['showHeaderLinks'] = true;
            updateComponent();

            const testLinkDe = linkDes[0];
            const testLink = links[0];

            should.not.exist(testLink.navigatedTo);

            testLinkDe.triggerEventHandler('click', null);
            fixture.detectChanges();

            testLink.navigatedTo.should.deep.equal(['editor']);
        });

        it('can click identity link in template', () => {
            component['showHeaderLinks'] = true;
            updateComponent();

            const testLinkDe = linkDes[2];
            const testLink = links[2];

            should.not.exist(testLink.navigatedTo);

            testLinkDe.triggerEventHandler('click', null);
            fixture.detectChanges();

            testLink.navigatedTo.should.deep.equal(['identity']);
        });

        it('should reset the config when hitting /login', fakeAsync(() => {
            component['config'] = new Config();
            component['composerBanner'] = ['Business Network', 'Name'];

            let myConfig = new Config();
            myConfig.webonly = true;
            myConfig.title = 'My Title';
            myConfig.banner = ['My', 'Banner'];
            myConfig.links = {
              docs: 'My Docs',
              tutorial: 'My Tutorial',
              community: 'My Community',
              github: 'My Github',
              install: 'My Install'
            };
            myConfig.analyticsID = 'myID';

            mockConfigService.getConfig.returns(myConfig);

            routerStub.eventParams = {url: '/login', nav: 'end', urlAfterRedirects: '/login'};

            updateComponent();

            tick();
            component['config'].should.deep.equal(myConfig);
            component['composerBanner'].should.deep.equal(['My', 'Banner']);
        }));

        it('should reset the config when hitting /login using loadConfig when getConfig fails', fakeAsync(() => {
            component['config'] = new Config();
            component['composerBanner'] = ['Business Network', 'Name'];

            let myConfig = new Config();
            myConfig.webonly = true;
            myConfig.title = 'My Title';
            myConfig.banner = ['My', 'Banner'];
            myConfig.links = {
              docs: 'My Docs',
              tutorial: 'My Tutorial',
              community: 'My Community',
              github: 'My Github',
              install: 'My Install'
            };
            myConfig.analyticsID = 'myID';

            mockConfigService.getConfig.throws(new Error('error'));
            mockConfigService.loadConfig.returns(Promise.resolve(myConfig));

            routerStub.eventParams = {url: '/login', nav: 'end', urlAfterRedirects: '/login'};

            updateComponent();

            tick();
            component['config'].should.deep.equal(myConfig);
            component['composerBanner'].should.deep.equal(['My', 'Banner']);
        }));
    });

    describe('queryParamsUpdated', () => {
        let mockOnBusy;
        let mockOnError;
        let mockOnTransactionEvent;
        let errorStatusSpy;

        beforeEach(async(() => {
            routerStub.navigate.returns(Promise.resolve(false));

            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
            errorStatusSpy = sinon.spy(mockAlertService.errorStatus$, 'next');
        }));

        it('should initialise playground and set use locally to true, and not set analytics', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            mockConfigService.isWebOnly.returns(false);
            mockConfigService.getConfig.returns(new Config());
            activatedRoute.testParams = {};

            updateComponent();

            tick();

            mockInitializationService.initialize.should.have.been.called;
            component['submitAnalytics'].should.equal(false);

            component['usingLocally'].should.equal(true);
        }));

        it('should initialise playground and set use locally to false and use analytics', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            mockConfigService.isWebOnly.returns(true);
            let myConfig = new Config();
            myConfig.analyticsID = 'myID';
            mockConfigService.getConfig.returns(myConfig);

            activatedRoute.testParams = {};

            updateComponent();

            tick();

            mockInitializationService.initialize.should.have.been.called;

            analyticsMock.should.have.been.calledWith('create', 'myID', 'auto');
            component['submitAnalytics'].should.equal(true);

            component['usingLocally'].should.equal(false);
        }));
    });

    describe('onBusyStatus', () => {
        let mockOnBusy;
        let mockOnError;
        let mockOnTransaction;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransaction = sinon.stub(component, 'onTransactionEvent');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
            mockModal.open.returns({componentInstance: {}, close: sinon.stub()});
        }));

        it('should not show if in web mode', () => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus('message');

            mockModal.open.should.not.have.been.called;
        });

        it('should not show if in web mode unless force', () => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus({message: 'message', force: true});

            mockModal.open.should.have.been.called;
        });

        it('should show with no card if forced', () => {
            mockIdentityCardService.getCurrentIdentityCard.returns(null);
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus({message: 'message', force: true});

            mockModal.open.should.have.been.called;
        });

        it('should not show with no card', () => {
            mockIdentityCardService.getCurrentIdentityCard.returns(null);
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus({message: 'message', force: false});

            mockModal.open.should.not.have.been.called;
        });

        it('should open the modal', () => {
            mockIdCard.getConnectionProfile.returns({name: 'notWebMode'});
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus('message');

            mockModal.open.should.have.been.called;

            component['busyModalRef'].componentInstance.busy.should.equal('message');
        });

        it('should open the modal and update the status', () => {
            mockIdCard.getConnectionProfile.returns({name: 'notWebMode'});
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
            mockIdCard.getConnectionProfile.returns({name: 'notWebMode'});
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
            mockIdCard.getConnectionProfile.returns({name: 'notWebMode'});
            activatedRoute.testParams = {};

            updateComponent();

            mockOnBusy.restore();

            component['busyModalRef'] = null;

            component.onBusyStatus(null);

            mockModal.open.should.not.have.been.calledOnce;

        });
    });

    describe('onTransactionEvent', () => {
        let mockOnBusy;
        let mockOnError;
        let mockOnTransaction;
        let mockQueryParamsUpdated;
        let componentInstance = {
            transaction: {},
            events: []
        };

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransaction = sinon.stub(component, 'onTransactionEvent');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');

            mockModal.open = sinon.stub().returns({
                result: Promise.resolve(),
                componentInstance: componentInstance
            });
        }));

        it('should deal with transaction event', fakeAsync(() => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnTransaction.restore();

            component.onTransactionEvent({transaction: {$class: 'myTransaction'}, events: [{event: 'myEvent'}]});

            tick();

            mockModal.open.should.have.been.called;

            componentInstance.transaction.should.deep.equal({$class: 'myTransaction'});
            componentInstance.events.should.deep.equal([{event: 'myEvent'}]);
        }));

        it('should not show if no message', fakeAsync(() => {
            activatedRoute.testParams = {};

            updateComponent();

            mockOnTransaction.restore();

            component.onTransactionEvent(null);

            tick();

            mockModal.open.should.not.have.been.called;
        }));

        it('should handle error', fakeAsync(() => {
            let errorStatusSpy = sinon.spy(mockAlertService.errorStatus$, 'next');

            mockModal.open = sinon.stub().returns({
                result: Promise.reject('some error'),
                componentInstance: componentInstance
            });

            activatedRoute.testParams = {};

            updateComponent();

            mockOnTransaction.restore();

            component.onTransactionEvent({transaction: {$class: 'myTransaction'}, events: [{event: 'myEvent'}]});

            tick();

            mockModal.open.should.have.been.called;

            errorStatusSpy.should.have.been.called; // With('some error');
        }));
    });

    describe('onErrorStatus', () => {
        let mockOnBusy;
        let mockOnError;
        let mockOnTransaction;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransaction = sinon.stub(component, 'onTransactionEvent');
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

        it('should not show if no message', () => {
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
        let mockOnTransactionEvent;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
            mockModal.open.returns({componentInstance: {}});

        }));

        it('should open the welcome modal', fakeAsync(() => {
            activatedRoute.testParams = {};

            updateComponent();

            component['openWelcomeModal']();

            tick();

            checkVersionStub.should.have.been.called;

            mockModal.open.should.have.been.called;
        }));

        it('should open the version modal', fakeAsync(() => {
            activatedRoute.testParams = {};

            updateComponent(false);

            component['openWelcomeModal']();

            tick();

            checkVersionStub.should.have.been.called;

            mockModal.open.should.have.been.called;
        }));
    });

    describe('openVersionModal', () => {
        let mockOnBusy;
        let mockOnError;
        let mockOnTransactionEvent;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
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

    describe('checkVersion', () => {
        let mockOnBusy;
        let mockOnError;
        let mockOnTransactionEvent;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
        }));

        it('should check the version return true', fakeAsync(() => {
            let getPlayGroundDetailsStub = sinon.stub(component, 'getPlaygroundDetails').returns(null);
            let setPlayGroundDetailsStub = sinon.stub(component, 'setPlaygroundDetails').returns(Promise.resolve());

            activatedRoute.testParams = {};

            updateComponent();

            checkVersionStub.restore();

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

            checkVersionStub.restore();

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

            checkVersionStub.restore();

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
        let mockOnTransactionEvent;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
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
        let mockOnTransactionEvent;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
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

    describe('logout', () => {
        let mockOnBusy;
        let mockOnError;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');
        }));

        it('should log the user out', fakeAsync(() => {
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.resolve());
            routerStub.navigate.returns(Promise.resolve(true));
            activatedRoute.testParams = {};
            mockConfigService.getConfig.returns(mockConfig);
            updateComponent();

            component.logout();

            tick();

            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith(null);
            mockClientService.disconnect.should.have.been.called;
            mockFileService.deleteAllFiles.should.have.been.called;
            routerStub.navigate.should.have.been.calledWith(['/login']);
        }));
    });

    describe('onToggle', () => {

        let mockOnBusy;
        let mockOnError;
        let mockOnTransactionEvent;
        let mockQueryParamsUpdated;

        beforeEach(async(() => {
            mockOnBusy = sinon.stub(component, 'onBusyStatus');
            mockOnError = sinon.stub(component, 'onErrorStatus');
            mockOnTransactionEvent = sinon.stub(component, 'onTransactionEvent');
            mockQueryParamsUpdated = sinon.stub(component, 'queryParamsUpdated');

        }));

        it('should set toggle down on true event', () => {
            updateComponent();
            component['dropListActive'] = false;

            component['onToggle'](true);

            component['dropListActive'].should.be.true;
        });

        it('should set toggle up on false event', () => {
            updateComponent();
            component['dropListActive'] = true;

            component['onToggle'](false);

            component['dropListActive'].should.be.false;
        });
    });
});
