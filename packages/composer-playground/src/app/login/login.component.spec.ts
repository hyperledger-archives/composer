/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:use-host-property-decorator*/
/* tslint:disable:no-input-rename*/
/* tslint:disable:member-ordering*/
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Input, Component, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
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
import { BusinessNetworkDefinition } from 'composer-common';

import { DrawerService } from '../common/drawer';
import { IdCard } from 'composer-common';
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
            mockIdCard1.getConnectionProfile.returns({name: '$default', type: 'web'});
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
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.resolve());
            mockClientService.ensureConnected.returns(Promise.resolve());

            component.changeIdentity('myCardRef');

            tick();

            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('myCardRef');
            mockClientService.ensureConnected.should.have.been.calledWith(true);

            routerStub.navigate.should.have.been.calledWith(['editor']);
        }));

        it('should handle error', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.reject('some error'));

            component.changeIdentity('myCardRef');

            tick();

            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('myCardRef');
            mockClientService.ensureConnected.should.not.have.been.called;

            routerStub.navigate.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
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
        it('should open the ID card screen', () => {
            component['showSubScreen'] = false;
            component['creatingIdCard'] = false;

            component['createIdCard']();
            component['showSubScreen'].should.be.true;
            component['creatingIdCard'].should.be.true;
        });
    });

    describe('finishedCardCreation', () => {
        it('should close the subscreen and refresh identity cards on success', () => {
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            let closeSubViewStub = sinon.stub(component, 'closeSubView');

            component['finishedCardCreation'](true);

            closeSubViewStub.should.have.been.called;
            loadIdentityCardsStub.should.have.been.called;
        });

        it('should call closeSubView() on failure', () => {
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            let closeSubViewStub = sinon.stub(component, 'closeSubView');

            component['finishedCardCreation'](false);

            closeSubViewStub.should.have.been.called;
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
            mockIdCard.getConnectionProfile.returns({type: 'hlfv1'});
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

            let idCardOne = new IdCard({userName: 'bob', businessNetwork: 'bn'}, {name: 'cp1', type: 'web'});

            myMap.set('idCardOne', idCardOne);

            mockIdentityCardService.getAllCardsForBusinessNetwork.returns(myMap);
            mockIdCard.getConnectionProfile.returns({type: 'web'});
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

            mockAlertService.successStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should not undeploy if more than one identity', fakeAsync(() => {
            let myMap = new Map<string, IdCard>();

            let idCardOne = new IdCard({userName: 'bob', businessNetwork: 'bn'}, {name: 'cp1', type: 'web'});
            let idCardTwo = new IdCard({userName: 'fred', businessNetwork: 'bn'}, {name: 'cp1', type: 'web'});

            myMap.set('myCardRef', idCardOne);
            myMap.set('idCardTwo', idCardTwo);

            mockIdentityCardService.getAllCardsForBusinessNetwork.returns(myMap);
            mockIdCard.getConnectionProfile.returns({type: 'web'});
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
        it('should deploy a new business network showing credentials', () => {
            component['indestructibleCards'] = [];

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns(['4321']);
            component.deployNetwork('1234');

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234');
            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('4321');

            component['showSubScreen'].should.equal(true);
            component['showDeployNetwork'].should.equal(true);

            component['showCredentials'].should.equal(true);
        });

        it('should deploy a new business network not showing credentials', () => {
            component['indestructibleCards'] = ['4321'];

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns(['4321']);
            component.deployNetwork('1234');

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234');
            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('4321');

            component['showSubScreen'].should.equal(true);
            component['showDeployNetwork'].should.equal(true);

            component['showCredentials'].should.equal(false);
        });
    });

    describe('finishedDeploying', () => {
        it('should finish deploying', () => {
            component['showSubScreen'] = true;

            let loadStub = sinon.stub(component, 'loadIdentityCards');

            component['showDeployNetwork'] = true;
            component.finishedDeploying();

            component['showSubScreen'].should.equal(false);
            component['showDeployNetwork'].should.equal(false);

            loadStub.should.have.been.called;
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
        it('should show deploy button if got all correct cards', () => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns(['web-cardRef']);

            let result = component.canDeploy('1234');

            result.should.equal(true);

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledTwice;
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.firstCall.should.have.been.calledWith('1234', 'PeerAdmin');
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.secondCall.should.have.been.calledWith('1234', 'ChannelAdmin');
        });

        it('should not show deploy button if no PeerAdmin Role', () => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns([]);

            let result = component.canDeploy('1234');

            result.should.equal(false);

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledOnce;
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'PeerAdmin');
        });

        it('should not show deploy button if not got ChannelAdmin role', () => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.onFirstCall().returns(['web-cardRef']);
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.onSecondCall().returns([]);

            let result = component.canDeploy('1234');

            result.should.equal(false);

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledTwice;
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.firstCall.should.have.been.calledWith('1234', 'PeerAdmin');
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.secondCall.should.have.been.calledWith('1234', 'ChannelAdmin');
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
            mockIdCard3.getBusinessNetworkName.returns('my-alphabet-network');
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

            cardRefs.should.deep.equal(['myCardRef5', 'myCardRef2', 'myCardRef4', 'myCardRef7', 'myCardRef3', 'myCardRef6', 'myCardRef1']);
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
