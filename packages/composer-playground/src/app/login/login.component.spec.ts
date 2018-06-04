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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BehaviorSubject } from 'rxjs/Rx';
import { IdentityCardService } from '../services/identity-card.service';
import { ClientService } from '../services/client.service';
import { AdminService } from '../services/admin.service';
import { InitializationService } from '../services/initialization.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConfigService } from '../services/config.service';
import { Config } from '../services/config/configStructure.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { BusinessNetworkDefinition, IdCard } from 'composer-common';

import { DrawerDismissReasons, DrawerService } from '../common/drawer';
import { LoginComponent } from './login.component';

import * as fileSaver from 'file-saver';
import * as chai from 'chai';
import * as sinon from 'sinon';

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
            console.log('MY ONLY FRIEND THE END');
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

    private _testFragment: string;
    get testFragment() {
        return this._testFragment;
    }

    set testFragment(fragment: string) {
        this._testFragment = fragment;
    }

    // ActivatedRoute.snapshot.params
    get snapshot() {
        return {queryParams: this.testParams, fragment: this.testFragment};
    }
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
    selector: 'deploy-business-network',
    template: ''
})
class MockDeployComponent {

    @Output()
    public finishedSampleImport: EventEmitter<any> = new EventEmitter<any>();
    @Input()
    public showCredentials;
}

@Component({
    selector: 'app-footer',
    template: ''
})
class MockFooterComponent {

}

@Component({
    selector: 'identity-card',
    template: ''
})
class MockIdentityCardComponent {
    @Input() link: String;
    @Input() identity: any;
    @Input() indestructible: any;
    @Input() cardRef: string;
    @Input() showSpecial: boolean;
}

@Component({
    selector: 'create-identity-card',
    template: ''
})
class MockCreateIdentityCardComponent {
    @Input()
    public connectionProfileRefs;
    @Input()
    public connectionProfileNames;
    @Input()
    public connectionProfiles;
    @Output()
    public finishedCardCreation: EventEmitter<any> = new EventEmitter<any>();
}

@Component({
    selector: 'tutorial-link',
    template: ''
})
class MockTutorialLinkComponent {
    @Input()
    link: string;
}

describe(`LoginComponent`, () => {

    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    let mockAdminService;
    let mockIdentityCardService;
    let mockClientService;
    let mockInitializationService;
    let mockSampleBusinessNetworkService;
    let routerStub;
    let mockAlertService;
    let mockConfigService;
    let mockConfig;
    let mockModal;
    let mockDrawer;
    let businessNetworkMock;
    let activatedRoute;

    beforeEach(() => {
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockInitializationService = sinon.createStubInstance(InitializationService);
        mockSampleBusinessNetworkService = sinon.createStubInstance(SampleBusinessNetworkService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockConfigService = sinon.createStubInstance(ConfigService);
        mockConfig = sinon.createStubInstance(Config);
        mockDrawer = sinon.createStubInstance(DrawerService);
        mockModal = sinon.createStubInstance(NgbModal);
        businessNetworkMock = sinon.createStubInstance(BusinessNetworkDefinition);

        routerStub = new RouterStub();
        activatedRoute = new ActivatedRouteStub();

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            declarations: [
                LoginComponent,
                MockConnectionProfileComponent,
                MockCreateIdentityCardComponent,
                MockIdentityCardComponent,
                MockFooterComponent,
                MockDeployComponent,
                MockTutorialLinkComponent
            ],
            providers: [
                {provide: IdentityCardService, useValue: mockIdentityCardService},
                {provide: ClientService, useValue: mockClientService},
                {provide: Router, useValue: routerStub},
                {provide: ActivatedRoute, useValue: activatedRoute},
                {provide: AdminService, useValue: mockAdminService},
                {provide: InitializationService, useValue: mockInitializationService},
                {provide: SampleBusinessNetworkService, useValue: mockSampleBusinessNetworkService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: DrawerService, useValue: mockDrawer},
                {provide: NgbModal, useValue: mockModal},
                {provide: ConfigService, useValue: mockConfigService},
            ]
        });

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        component.should.be.ok;
    });

    describe('ngOnInit', () => {
        let handleRouteChangeStub;
        beforeEach(() => {
            handleRouteChangeStub = sinon.stub(component, 'handleRouteChange');
        });

        it('should load identity cards', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            component.ngOnInit();

            tick();

            mockInitializationService.initialize.should.have.been.called;
            loadIdentityCardsStub.should.have.been.called;
        }));

        it('should check if playground is hosted or being used locally', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            mockConfigService.isWebOnly.returns(true);
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            component.ngOnInit();

            tick();

            mockConfigService.isWebOnly.should.have.been.called;
            component['usingLocally'].should.be.false;
        }));

        it('should set config', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            mockConfigService.isWebOnly.returns(true);
            mockConfigService.getConfig.returns(mockConfig);
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            component.ngOnInit();

            tick();

            mockConfigService.getConfig.should.have.been.called;
            component['config'].should.deep.equal(mockConfig);
        }));

        it('should handle the route change', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            mockConfigService.getConfig.returns(mockConfig);

            component.ngOnInit();

            tick();

            routerStub.eventParams = {url: '/login', nav: 'end'};

            handleRouteChangeStub.should.have.been.called;
        }));
    });

    describe('handleRouteChange', () => {
        it('should clear the URL to /login if hits default with invalid fragment and having queryParams', () => {
            activatedRoute.testFragment = 'penguin';
            activatedRoute.testParams = {ref: 'ABC'};
            let goLoginMainStub = sinon.stub(component, 'goLoginMain');

            component['handleRouteChange']();

            goLoginMainStub.should.have.been.called;
        });

        it('should clear the URL to /login if hits default with no fragment but having queryParams', () => {
            activatedRoute.testParams = {ref: 'ABC'};
            let goLoginMainStub = sinon.stub(component, 'goLoginMain');

            component['handleRouteChange']();

            goLoginMainStub.should.have.been.called;
        });

        it('should clear the URL to /login if hits default with invalid fragment but having no queryParams', () => {
            activatedRoute.testFragment = 'penguin';
            let goLoginMainStub = sinon.stub(component, 'goLoginMain');

            component['handleRouteChange']();

            goLoginMainStub.should.have.been.called;
        });

        it('should call closeSubView when no queryParams or fragment passed', () => {
            activatedRoute.testParams = {};
            let closeSubViewStub = sinon.stub(component, 'closeSubView');

            component['handleRouteChange']();

            closeSubViewStub.should.have.been.called;
        });

        it('should display deploy screen when #deploy in url using ref in params', () => {
            let deployNetworkStub = sinon.stub(component, 'deployNetwork');
            activatedRoute.testFragment = 'deploy';
            activatedRoute.testParams = 'ABC';

            component['handleRouteChange']();

            deployNetworkStub.should.have.been.called;
        });

        it('should display card create screen when #create-card is in the URL', () => {
            let createIdCardStub = sinon.stub(component, 'createIdCard');
            activatedRoute.testFragment = 'create-card';

            component['handleRouteChange']();

            createIdCardStub.should.have.been.called;
        });
    });

    describe('goLoginMain', () => {
        it('should navigate the user to /login', () => {
            component['goLoginMain']();

            routerStub.navigate.should.have.been.calledWith(['/login']);
        });
    });

    describe('goDeploy', () => {
        it('should navigate the user to /login', () => {
            component['goDeploy']('ABC');

            routerStub.navigate.should.have.been.calledWith(['/login'], {fragment: 'deploy', queryParams: {ref: 'ABC'}});
        });
    });

    describe('goCreateCard', () => {
        it('should navigate the user to /login', () => {
            component['goCreateCard']();

            routerStub.navigate.should.have.been.calledWith(['/login'], {fragment: 'create-card'});
        });
    });

    describe('loadIdentityCards', () => {
        it('should load identity cards and sort the profiles force reload', fakeAsync(() => {
            let mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('card1');
            mockIdCard1.getConnectionProfile.returns({name: 'myProfile1'});
            let mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getUserName.returns('card2');
            mockIdCard2.getConnectionProfile.returns({name: 'myProfile2'});
            let mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getUserName.returns('card3');
            mockIdCard3.getConnectionProfile.returns({name: 'myProfile1'});
            let mockIdCard4 = sinon.createStubInstance(IdCard);
            mockIdCard4.getUserName.returns('card4');
            mockIdCard4.getConnectionProfile.returns({name: '$default'});
            let mockIdCard5 = sinon.createStubInstance(IdCard);
            mockIdCard5.getUserName.returns('card5');
            mockIdCard5.getConnectionProfile.returns({name: 'bobProfile'});

            let mockIdCards = new Map<string, IdCard>();
            mockIdCards.set('myCardRef1', mockIdCard1);
            mockIdCards.set('myCardRef2', mockIdCard2);
            mockIdCards.set('myCardRef3', mockIdCard3);
            mockIdCards.set('myCardRef4', mockIdCard4);
            mockIdCards.set('myCardRef5', mockIdCard5);

            mockIdentityCardService.getQualifiedProfileName.withArgs({name: 'myProfile1'}).returns('xxx-myProfile1');
            mockIdentityCardService.getQualifiedProfileName.withArgs({name: 'myProfile2'}).returns('xxx-myProfile2');
            mockIdentityCardService.getQualifiedProfileName.withArgs({name: 'bobProfile'}).returns('xxx-bobProfile');
            mockIdentityCardService.getQualifiedProfileName.withArgs({name: '$default'}).returns('web-$default');

            mockIdentityCardService.getIdentityCards.returns(Promise.resolve(mockIdCards));
            mockIdentityCardService.getIndestructibleIdentityCards.returns(['myCardRef4']);
            let sortCards = sinon.stub(component, 'sortIdCards');

            component.loadIdentityCards(true);

            tick();

            sortCards.should.have.been.called;

            mockIdentityCardService.getIdentityCards.should.have.been.calledWith(true);
            component['connectionProfileRefs'].should.deep.equal(['xxx-bobProfile', 'xxx-myProfile1', 'xxx-myProfile2', 'web-$default']);
            component['connectionProfileNames'].size.should.equal(4);
            component['connectionProfileNames'].get('xxx-myProfile1').should.equal('myProfile1');
            component['connectionProfileNames'].get('xxx-myProfile2').should.equal('myProfile2');
            component['connectionProfileNames'].get('xxx-bobProfile').should.equal('bobProfile');
            component['connectionProfileNames'].get('web-$default').should.equal('$default');
            component['idCardRefs'].size.should.equal(4);
            component['idCardRefs'].get('xxx-myProfile1').length.should.equal(2);
            component['idCardRefs'].get('xxx-myProfile1').should.deep.equal(['myCardRef1', 'myCardRef3']);
            component['idCardRefs'].get('xxx-myProfile2').length.should.equal(1);
            component['idCardRefs'].get('xxx-myProfile2').should.deep.equal(['myCardRef2']);
            component['idCardRefs'].get('xxx-bobProfile').should.deep.equal(['myCardRef5']);
            component['idCardRefs'].get('web-$default').should.deep.equal(['myCardRef4']);
            component['indestructibleCards'].should.deep.equal(['myCardRef4']);
        }));

        it('should load identity cards and ensure there is always a web connection profile', fakeAsync(() => {
            let mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('PeerAdmin');
            mockIdCard1.getConnectionProfile.returns({'name': '$default', 'x-type': 'web'});
            let mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getUserName.returns('bob');
            mockIdCard2.getConnectionProfile.returns({name: 'bobProfile'});

            let mockIdCards = new Map<string, IdCard>();
            mockIdCards.set('myCardRef1', mockIdCard1);
            mockIdCards.set('myCardRef2', mockIdCard2);

            mockIdentityCardService.getQualifiedProfileName.withArgs({name: 'bobProfile'}).returns('xxx-bobProfile');
            mockIdentityCardService.getQualifiedProfileName.withArgs({name: '$default'}).returns('web-$default');

            mockIdentityCardService.getIdentityCards.returns(Promise.resolve(mockIdCards));
            mockIdentityCardService.getIndestructibleIdentityCards.returns(['myCardRef1']);
            let sortCards = sinon.stub(component, 'sortIdCards');

            component.loadIdentityCards();

            tick();

            component['connectionProfileRefs'].should.deep.equal(['xxx-bobProfile', 'web-$default']);
            component['connectionProfileNames'].size.should.equal(1);
            component['connectionProfileNames'].get('xxx-bobProfile').should.equal('bobProfile');
            component['idCardRefs'].size.should.equal(1);
            component['idCardRefs'].get('xxx-bobProfile').should.deep.equal(['myCardRef2']);
            component['indestructibleCards'].should.deep.equal(['myCardRef1']);
        }));

        it('should handle error', fakeAsync(() => {
            mockIdentityCardService.getIdentityCards.returns(Promise.reject('some error'));

            component.loadIdentityCards();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');

            should.not.exist(component['connectionProfileRefs']);
            should.not.exist(component['connectionProfileNames']);
            should.not.exist(component['idCardRefs']);
            should.not.exist(component['idCards']);
        }));
    });

    describe('changeIdentity', () => {
        let mockIdCard;
        let mockIdCards: Map<string, IdCard>;

        beforeEach(() => {
            mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getBusinessNetworkName.returns('myNetwork');
            mockIdCards = new Map<string, IdCard>();
            mockIdCards.set('myCardRef', mockIdCard);
        });

        it('should change identity', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            sinon.stub(component, 'canDeploy').returns(true);
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.resolve());
            mockClientService.ensureConnected.returns(Promise.resolve());

            component.changeIdentity('myCardRef', 'myConnectionProfileRef');

            tick();

            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('myCardRef');
            mockClientService.ensureConnected.should.have.been.calledWith(true);

            routerStub.navigate.should.have.been.calledWith(['editor']);
        }));

        it('should handle error', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            sinon.stub(component, 'canDeploy').returns(true);
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.reject('some error'));

            component.changeIdentity('myCardRef', 'myConnectionProfileRef');

            tick();

            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('myCardRef');
            mockClientService.ensureConnected.should.not.have.been.called;

            routerStub.navigate.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should open the connect-confirm modal', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            sinon.stub(component, 'canDeploy').returns(false);

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(0)
            });

            component.changeIdentity('myCardRef', 'myConnectionProfileRef');
            tick();

            mockModal.open.should.have.been.called;
        }));

        it('should open connect-confirm modal modal and handle error', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            sinon.stub(component, 'canDeploy').returns(false);

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.changeIdentity('myCardRef', 'myConnectionProfileRef');
            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
            mockIdentityCardService.setCurrentIdentityCard.should.not.have.been.called;
        }));

        it('should open connect-confirm modal and handle cancel', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            component.changeIdentity('myCardRef', 'myConnectionProfileRef');
            tick();

            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockIdentityCardService.setCurrentIdentityCard.should.not.have.been.called;
        }));
    });

    describe('editConnectionProfile', () => {
        it('should edit the connection profile', () => {
            component.should.be.ok;
            component.editConnectionProfile('myProfile');

            component['editingConnectionProfile'].should.equal('myProfile');
        });
    });

    describe('closeSubView', () => {
        it('should close the subview', () => {
            component['showSubScreen'] = true;
            component['showDeployNetwork'] = true;
            component['editingConnectionProfile'] = {profile: 'myProfile'};
            component.closeSubView();

            component['showSubScreen'].should.equal(false);
            should.not.exist(component['editingConectionProfile']);
            component['showDeployNetwork'].should.equal(false);
        });
    });

    describe('createIdCard', () => {
        it('should return the user to the main login screen if no using locally', () => {
            component['usingLocally'] = false;
            let goLoginMainStub = sinon.stub(component, 'goLoginMain');
            component['showSubScreen'] = false;
            component['creatingIdCard'] = false;

            component['createIdCard']();

            goLoginMainStub.should.have.been.called;
            component['showSubScreen'].should.be.false;
            component['creatingIdCard'].should.be.false;
        });

        it('should open the ID card screen', () => {
            component['showSubScreen'] = false;
            component['creatingIdCard'] = false;
            component['usingLocally'] = true;

            component['createIdCard']();
            component['showSubScreen'].should.be.true;
            component['creatingIdCard'].should.be.true;
        });
    });

    describe('finishedCardCreation', () => {
        it('should close the subscreen and refresh identity cards on success', () => {
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            let goLoginMainStub = sinon.stub(component, 'goLoginMain');

            component['finishedCardCreation'](true);

            goLoginMainStub.should.have.been.called;
            loadIdentityCardsStub.should.have.been.called;
        });

        it('should call closeSubView() on failure', () => {
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            let goLoginMainStub = sinon.stub(component, 'goLoginMain');

            component['finishedCardCreation'](false);

            goLoginMainStub.should.have.been.called;
            loadIdentityCardsStub.should.not.have.been.called;
        });
    });

    describe('removeIdentity', () => {
        let mockIdCard;
        let mockIdCards: Map<string, IdCard>;
        let loadIdentityCardsStub;

        beforeEach(() => {
            mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('myCard');
            mockIdCard.getConnectionProfile.returns({'x-type': 'hlfv1'});
            mockIdCards = new Map<string, IdCard>();
            mockIdCards.set('myCardRef', mockIdCard);

            loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            loadIdentityCardsStub.returns(Promise.resolve());

            mockIdentityCardService.getAllCardsForBusinessNetwork.returns(new Map<string, IdCard>());
        });

        it('should open the delete-confirm modal', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            mockIdentityCardService.deleteIdentityCard.returns(Promise.resolve());
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(0)
            });

            component.removeIdentity('myCardRef');
            tick();

            mockModal.open.should.have.been.called;
        }));

        it('should open delete-confirm modal and handle error', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.removeIdentity('myCardRef');
            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
            mockIdentityCardService.deleteIdentityCard.should.not.have.been.called;
        }));

        it('should open delete-confirm modal and handle cancel', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            component.removeIdentity('myCardRef');
            tick();

            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockIdentityCardService.deleteIdentityCard.should.not.have.been.called;
        }));

        it('should refresh the identity cards after successfully calling identityCardService.deleteIdentityCard()', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            mockIdentityCardService.deleteIdentityCard.returns(Promise.resolve());
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            component.removeIdentity('myCardRef');
            tick();

            // check services called
            mockAdminService.connect.should.not.have.been.called;
            mockIdentityCardService.deleteIdentityCard.should.have.been.calledWith('myCardRef');
            loadIdentityCardsStub.should.have.been.called;

            mockAlertService.successStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should undeploy and refresh the identity cards after successfully calling identityCardService.deleteIdentityCard()', fakeAsync(() => {
            let myMap = new Map<string, IdCard>();

            let idCardOne = new IdCard({userName: 'bob', businessNetwork: 'bn'}, {'name': 'cp1', 'x-type': 'web'});

            myMap.set('idCardOne', idCardOne);

            mockIdentityCardService.getAllCardsForBusinessNetwork.returns(myMap);
            mockIdCard.getConnectionProfile.returns({'x-type': 'web'});
            mockIdCards.set('myCardRef', mockIdCard);

            component['idCards'] = mockIdCards;
            mockIdentityCardService.deleteIdentityCard.returns(Promise.resolve());
            mockAdminService.connect.resolves();
            mockAdminService.undeploy.resolves();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            component.removeIdentity('myCardRef');
            tick();

            // check services called
            mockAdminService.connect.should.have.been.called;
            mockAdminService.undeploy.should.have.been.called;
            mockIdentityCardService.deleteIdentityCard.should.have.been.calledWith('myCardRef');
            loadIdentityCardsStub.should.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.calledWith({
                title: 'Undeploying business network',
                force: true
            });
            mockAlertService.successStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should not undeploy if more than one identity', fakeAsync(() => {
            let myMap = new Map<string, IdCard>();

            let idCardOne = new IdCard({userName: 'bob', businessNetwork: 'bn'}, {'name': 'cp1', 'x-type': 'web'});
            let idCardTwo = new IdCard({userName: 'fred', businessNetwork: 'bn'}, {'name': 'cp1', 'x-type': 'web'});

            myMap.set('myCardRef', idCardOne);
            myMap.set('idCardTwo', idCardTwo);

            mockIdentityCardService.getAllCardsForBusinessNetwork.returns(myMap);
            mockIdCard.getConnectionProfile.returns({'x-type': 'web'});
            mockIdCards.set('myCardRef', mockIdCard);

            component['idCards'] = mockIdCards;
            mockIdentityCardService.deleteIdentityCard.returns(Promise.resolve());

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            component.removeIdentity('myCardRef');
            tick();

            // check services called
            mockAdminService.connect.should.not.have.been.called;
            mockAdminService.undeploy.should.not.have.been.called;
            mockIdentityCardService.deleteIdentityCard.should.have.been.calledWith('myCardRef');
            loadIdentityCardsStub.should.have.been.called;

            mockAlertService.successStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should handle errors when calling identityCardService.deleteIdentityCard()', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            mockIdentityCardService.deleteIdentityCard.returns(Promise.reject('some error'));
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            component.removeIdentity('myCardRef');
            tick();

            // check services called
            mockAlertService.errorStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.not.have.been.called;
            loadIdentityCardsStub.should.not.have.been.called;
        }));
    });

    describe('deployNetwork', () => {
        it('should return the user to the login main view if they cannot deploy', fakeAsync(() => {
            let canDeployStub = sinon.stub(component, 'canDeploy');
            canDeployStub.returns(false);

            let goLoginMainStub = sinon.stub(component, 'goLoginMain');

            component.deployNetwork('1234');

            tick();

            mockIdentityCardService.getAdminCardRef.should.not.have.been.called;
            goLoginMainStub.should.have.been.called;
        }));

        it('should deploy a new business network showing credentials', fakeAsync(() => {
            let canDeployStub = sinon.stub(component, 'canDeploy');
            canDeployStub.returns(true);

            component['indestructibleCards'] = [];

            mockIdentityCardService.getAdminCardRef.returns('4321');
            component.deployNetwork('1234');

            tick();

            mockIdentityCardService.getAdminCardRef.should.have.been.calledWith('1234');
            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('4321');

            component['showSubScreen'].should.equal(true);
            component['showDeployNetwork'].should.equal(true);

            component['showCredentials'].should.equal(true);
        }));

        it('should deploy a new business network not showing credentials', fakeAsync(() => {
            let canDeployStub = sinon.stub(component, 'canDeploy');
            canDeployStub.returns(true);

            component['indestructibleCards'] = ['4321'];

            mockIdentityCardService.getAdminCardRef.returns('4321');
            component.deployNetwork('1234');

            tick();

            mockIdentityCardService.getAdminCardRef.should.have.been.calledWith('1234');
            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('4321');

            component['showSubScreen'].should.equal(true);
            component['showDeployNetwork'].should.equal(true);

            component['showCredentials'].should.equal(false);
        }));
    });

    describe('finishedDeploying', () => {
        it('should finish deploying', () => {
            let loadStub = sinon.stub(component, 'loadIdentityCards');
            let goLoginMainStub = sinon.stub(component, 'goLoginMain');

            component.finishedDeploying();

            loadStub.should.have.been.called;
            goLoginMainStub.should.have.been.called;
        });
    });

    describe('importIdentity', () => {
        beforeEach(() => {
            mockDrawer.open.returns({
                result: Promise.resolve()
            });
        });

        it('should import an identity card', fakeAsync(() => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdentityCardService.getIdentityCard.returns(mockIdCard);
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');

            component.importIdentity();

            tick();

            mockAlertService.successStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            loadIdentityCardsStub.should.have.been.called;
        }));

        it('should handle errors', fakeAsync(() => {
            mockDrawer.open.returns({
                result: Promise.reject('some error')
            });
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');

            component.importIdentity();

            tick();

            loadIdentityCardsStub.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should handle dismiss by esc key without showing an error modal', fakeAsync(() => {
          mockDrawer.open.returns({
              result: Promise.reject(DrawerDismissReasons.ESC)
          });
          let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');

          component.importIdentity();

          tick();

          loadIdentityCardsStub.should.not.have.been.called;
          mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));
    });

    describe('exportIdentity', () => {
        let sandbox = sinon.sandbox.create();
        let mockIdCard;
        let saveAsStub;

        beforeEach(() => {
            saveAsStub = sandbox.stub(fileSaver, 'saveAs');
            mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('myCard');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should export an identity card', fakeAsync(() => {
            mockIdentityCardService.getIdentityCardForExport.returns(Promise.resolve(mockIdCard));
            mockIdCard.toArchive.returns(Promise.resolve('card data'));

            component.exportIdentity('myCardRef');
            tick();

            let expectedFile = new Blob(['card data'], {type: 'application/octet-stream'});
            saveAsStub.should.have.been.calledWith(expectedFile, 'myCard.card');
        }));

        it('should handle errors', fakeAsync(() => {
            mockIdentityCardService.getIdentityCardForExport.returns(Promise.resolve(mockIdCard));
            mockIdCard.toArchive.returns(Promise.reject('some error'));

            component.exportIdentity('myCardRef');
            tick();

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));
    });

    describe('canDeploy', () => {
        it('should check if PeerAdmin and ChannelAdmin cards are available', () => {
            component.canDeploy('1234');

            mockIdentityCardService.canDeploy.should.have.been.calledWith('1234');
        });
    });

    describe('sortIdCards', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockIdCard4;
        let mockIdCard5;
        let mockIdCard6;
        let mockIdCard7;

        let mockIdCards;

        beforeEach(() => {
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('card2');
            mockIdCard1.getBusinessNetworkName.returns('my-network');
            mockIdCard1.getRoles.returns(['PeerAdmin']);

            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getUserName.returns('card2');
            mockIdCard2.getBusinessNetworkName.returns(null);
            mockIdCard2.getRoles.returns(['PeerAdmin']);

            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getUserName.returns('card2');
            mockIdCard3.getBusinessNetworkName.returns('my-z-alphabet-network');
            mockIdCard3.getRoles.returns(['PeerAdmin']);

            mockIdCard4 = sinon.createStubInstance(IdCard);
            mockIdCard4.getUserName.returns('card1');
            mockIdCard4.getBusinessNetworkName.returns(null);
            mockIdCard4.getRoles.returns(['PeerAdmin']);

            mockIdCard5 = sinon.createStubInstance(IdCard);
            mockIdCard5.getUserName.returns('card3');
            mockIdCard5.getBusinessNetworkName.returns(null);
            mockIdCard5.getRoles.returns(null);

            mockIdCard6 = sinon.createStubInstance(IdCard);
            mockIdCard6.getUserName.returns('card1');
            mockIdCard6.getBusinessNetworkName.returns('my-alphabet-network');
            mockIdCard6.getRoles.returns(['PeerAdmin']);

            mockIdCard7 = sinon.createStubInstance(IdCard);
            mockIdCard7.getUserName.returns('card1');
            mockIdCard7.getBusinessNetworkName.returns('my-alphabet-network');
            mockIdCard7.getRoles.returns(null);

            mockIdCards = new Map<string, IdCard>();
            mockIdCards.set('myCardRef1', mockIdCard1);
            mockIdCards.set('myCardRef2', mockIdCard2);
            mockIdCards.set('myCardRef3', mockIdCard3);
            mockIdCards.set('myCardRef4', mockIdCard4);
            mockIdCards.set('myCardRef5', mockIdCard5);
            mockIdCards.set('myCardRef6', mockIdCard6);
            mockIdCards.set('myCardRef7', mockIdCard7);

            mockIdentityCardService.getIdentityCard.withArgs('myCardRef1').returns(mockIdCard1);
            mockIdentityCardService.getIdentityCard.withArgs('myCardRef2').returns(mockIdCard2);
            mockIdentityCardService.getIdentityCard.withArgs('myCardRef3').returns(mockIdCard3);
            mockIdentityCardService.getIdentityCard.withArgs('myCardRef4').returns(mockIdCard4);
            mockIdentityCardService.getIdentityCard.withArgs('myCardRef5').returns(mockIdCard5);
            mockIdentityCardService.getIdentityCard.withArgs('myCardRef6').returns(mockIdCard6);
            mockIdentityCardService.getIdentityCard.withArgs('myCardRef7').returns(mockIdCard7);
        });

        it('should sort the idCards', () => {
            let cardRefs = Array.from(mockIdCards.keys());

            cardRefs.sort(component['sortIdCards'].bind(component));

            cardRefs.should.deep.equal(['myCardRef5', 'myCardRef2', 'myCardRef4', 'myCardRef7', 'myCardRef6', 'myCardRef1', 'myCardRef3']);
        });
    });

    describe('deploySample', () => {
        it('should deploy the sample network', fakeAsync(() => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns(['4321']);
            mockSampleBusinessNetworkService.getSampleList.returns(Promise.resolve([{name: 'mySample'}]));
            mockSampleBusinessNetworkService.getChosenSample.returns(Promise.resolve(businessNetworkMock));
            mockSampleBusinessNetworkService.deployBusinessNetwork.returns(Promise.resolve('myNewCardRef'));

            let loadCardsStub = sinon.stub(component, 'loadIdentityCards').resolves();

            let changeIdentityStub = sinon.stub(component, 'changeIdentity');
            component.deploySample('profileRef');

            tick();

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('profileRef');
            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('4321');
            mockSampleBusinessNetworkService.getSampleList.should.have.been.called;
            mockSampleBusinessNetworkService.getChosenSample.should.have.been.calledWith({name: 'mySample'});
            mockSampleBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith(businessNetworkMock, 'playgroundSample@basic-sample-network', 'my-basic-sample', 'The Composer basic sample network');
            loadCardsStub.should.have.been.calledWith(true);
            changeIdentityStub.should.have.been.calledWith('playgroundSample@basic-sample-network');
        }));
    });
});
