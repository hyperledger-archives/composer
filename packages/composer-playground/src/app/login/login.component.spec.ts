/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:use-host-property-decorator*/
/* tslint:disable:no-input-rename*/
/* tslint:disable:member-ordering*/
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Input, Component, Output, EventEmitter } from '@angular/core';
import { IdentityService } from '../services/identity.service';
import { IdentityCardService } from '../services/identity-card.service';
import { ClientService } from '../services/client.service';
import { BehaviorSubject } from 'rxjs/Rx';

import { Router, NavigationEnd, NavigationStart } from '@angular/router';

import * as chai from 'chai';
import * as sinon from 'sinon';

import { IdCard } from 'composer-common';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AdminService } from '../services/admin.service';
import { InitializationService } from '../services/initialization.service';
import { LoginComponent } from './login.component';
import { AlertService } from '../basic-modals/alert.service';
import { WalletService } from '../services/wallet.service';
import { DrawerService } from '../common/drawer';

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
    selector: 'import-business-network',
    template: ''
})
class MockImportComponent {

    @Input()
    public deployNetwork;
    @Output()
    public finishedSampleImport: EventEmitter<any> = new EventEmitter<any>();
}

@Component({
    selector: 'app-footer',
    template: ''
})
class MockFooterComponent {

}

@Component({
    selector: 'add-connection-profile',
    template: ''
})
class MockAddConnectionProfileComponent {
    @Input()
    public connectionProfiles;
    @Output()
    public profileToUse: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    public profileToEdit: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    public cancelAdd: EventEmitter<any> = new EventEmitter<any>();
}

@Component({
    selector: 'add-identity',
    template: ''
})
class MockAddIdentityComponent {
    @Input()
    public targetProfileName;
    @Output()
    public identityAdded: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    public cancelAdd: EventEmitter<any> = new EventEmitter<any>();
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
    let mockIdentityCardService;
    let mockClientService;
    let mockConnectionProfileService;
    let mockInitializationService;
    let routerStub;
    let mockAlertService;
    let mockWalletService;
    let mockModal;
    let mockDrawer;

    beforeEach(() => {

        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockInitializationService = sinon.createStubInstance(InitializationService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockWalletService = sinon.createStubInstance(WalletService);
        mockDrawer = sinon.createStubInstance(DrawerService);
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
                MockIdentityCardComponent,
                MockFooterComponent,
                MockAddConnectionProfileComponent,
                MockImportComponent,
                MockAddIdentityComponent
            ],
            providers: [
                {provide: IdentityService, useValue: mockIdentityService},
                {provide: IdentityCardService, useValue: mockIdentityCardService},
                {provide: ClientService, useValue: mockClientService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: Router, useValue: routerStub},
                {provide: AdminService, useValue: mockAdminService},
                {provide: InitializationService, useValue: mockInitializationService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: WalletService, useValue: mockWalletService},
                {provide: DrawerService, useValue: mockDrawer},
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

        it('should load identity cards', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            component.ngOnInit();

            tick();

            mockInitializationService.initialize.should.have.been.called;
            loadIdentityCardsStub.should.have.been.called;
        }));
    });

    describe('loadIdentityCards', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockIdCards: Map<string, IdCard>;

        beforeEach(() => {
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getName.returns('card1');
            mockIdCard1.getConnectionProfile.returns({name: 'myProfile1'});
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getName.returns('card2');
            mockIdCard2.getConnectionProfile.returns({name: 'myProfile2'});
            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getName.returns('card3');
            mockIdCard3.getConnectionProfile.returns({name: 'myProfile1'});

            mockIdCards = new Map<string, IdCard>();
            mockIdCards.set('myCardRef1', mockIdCard1);
            mockIdCards.set('myCardRef2', mockIdCard2);
            mockIdCards.set('myCardRef3', mockIdCard3);

            mockIdentityCardService.getQualifiedProfileName.withArgs({name: 'myProfile1'}).returns('xxx-myProfile1');
            mockIdentityCardService.getQualifiedProfileName.withArgs({name: 'myProfile2'}).returns('xxx-myProfile2');
        });

        it('should load identity cards', fakeAsync(() => {
            mockIdentityCardService.getIdentityCards.returns(Promise.resolve(mockIdCards));

            component.loadIdentityCards();

            tick();

            component['connectionProfileRefs'].should.deep.equal(['xxx-myProfile1', 'xxx-myProfile2']);
            component['connectionProfileNames'].size.should.equal(2);
            component['connectionProfileNames'].get('xxx-myProfile1').should.equal('myProfile1');
            component['connectionProfileNames'].get('xxx-myProfile2').should.equal('myProfile2');
            component['idCardRefs'].size.should.equal(2);
            component['idCardRefs'].get('xxx-myProfile1').length.should.equal(2);
            component['idCardRefs'].get('xxx-myProfile1').should.deep.equal(['myCardRef1', 'myCardRef3']);
            component['idCardRefs'].get('xxx-myProfile2').length.should.equal(1);
            component['idCardRefs'].get('xxx-myProfile2').should.deep.equal(['myCardRef2']);
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
            mockClientService.ensureConnected.should.have.been.calledWith('myNetwork', true);
            mockIdentityService.setLoggedIn.should.have.been.calledWith(true);

            routerStub.navigate.should.have.been.calledWith(['editor']);
        }));

        it('should handle error', fakeAsync(() => {
            component['idCards'] = mockIdCards;
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.reject('some error'));

            component.changeIdentity('myCardRef');

            tick();

            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('myCardRef');
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

            component['editingConnectionProfile'].should.equal('myProfile');
        });
    });

    describe('finishedEditingConnectionProfile', () => {
        it('should close editing connection profile screen if not adding ID with connection profile', () => {
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');

            component.finishedEditingConnectionProfile({update: true});

            should.not.exist(component['editingConectionProfile']);
            loadIdentityCardsStub.should.have.been.called;
        });

        it('should close editing connection profile screen if cancelling while adding ID with connection profile', () => {
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            let addIdToExistingProfileStub = sinon.stub(component, 'addIdToExistingProfile');
            component['creatingIdWithProfile'] = true;

            component.finishedEditingConnectionProfile({update: false});

            should.not.exist(component['editingConectionProfile']);
            loadIdentityCardsStub.should.have.been.called;
            addIdToExistingProfileStub.should.not.have.been.called;
        });

        it('should pass connection profile to addIdToExistingProfile if successfull and addding ID with connection profile', () => {
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            let addIdToExistingProfileNameStub = sinon.stub(component, 'addIdToExistingProfileName');
            component['creatingIdWithProfile'] = true;

            component.finishedEditingConnectionProfile({update: true, connectionProfile: {name: 'bob'}});

            should.not.exist(component['editingConectionProfile']);
            loadIdentityCardsStub.should.not.have.been.called;
            addIdToExistingProfileNameStub.should.have.been.calledWith('bob');
        });
    });

    describe('createIdCard', () => {
        it('should open the ID card screen', () => {
            component['createIdCard']();
            component['showSubScreen'].should.be.true;
            component['creatingIdCard'].should.be.true;
        });
    });

    describe('addIdToExistingProfileName', () => {
        it('should set the target profile name and open the ID edit panel', () => {
            component['addIdToExistingProfileName']('bob');

            component['targetProfileName'].should.be.equal('bob');
            component['creatingIdCard'].should.be.false;
            component['editingIdCard'].should.be.true;
        });
    });

    describe('addIdToNewProfile', () => {
        it('should set the connection profile to edit and set the creatingIdWithProfile boolean', () => {
            let myProfile = {wow: 'such profile', avarian: 'penguin'};

            component['addIdToNewProfile'](myProfile);

            component['editingConnectionProfile'].should.be.deep.equal(myProfile);
            component['creatingIdCard'].should.be.false;
            component['creatingIdWithProfile'].should.be.true;
        });
    });

    describe('completeCardAddition', () => {
        it('should close the subscreen and refresh identity cards', () => {
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            let closeSubViewStub = sinon.stub(component, 'closeSubView');

            component['completeCardAddition']();

            component['editingIdCard'].should.be.false;
            component['showSubScreen'].should.be.false;
            should.not.exist(component['editingConectionProfile']);
            loadIdentityCardsStub.should.have.been.called;
            closeSubViewStub.should.have.been.called;
        });
    });

    describe('removeIdentity', () => {
        let mockIdCard;
        let mockIdCards: Map<string, IdCard>;
        let loadIdentityCardsStub;

        beforeEach(() => {
            mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getName.returns('myCard');
            mockIdCards = new Map<string, IdCard>();
            mockIdCards.set('myCardRef', mockIdCard);

            loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            loadIdentityCardsStub.returns(Promise.resolve());
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

            mockAlertService.busyStatus$.next.should.have.been.called;
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

            mockAlertService.busyStatus$.next.should.not.have.been.called;
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
            mockIdentityCardService.deleteIdentityCard.should.have.been.calledWith('myCardRef');
            loadIdentityCardsStub.should.have.been.called;
            mockAlertService.busyStatus$.next.should.have.been.called;
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
            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.not.have.been.called;
            loadIdentityCardsStub.should.not.have.been.called;
        }));
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

    describe('deployNetwork', () => {
        it('should deploy a new business network', () => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns(['4321']);
            component.deployNetwork('1234');

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234');
            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('4321');

            component['showSubScreen'].should.equal(true);
            component['showDeployNetwork'].should.equal(true);
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

    describe('canDeploy', () => {
        it('should show deploy button if got all correct cards', () => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns(['web-cardRef']);
            mockIdentityCardService.getAllCardRefsForProfile.returns(['another-cardRef', 'web-cardRef']);
            mockIdentityCardService.getIdentityCard.onFirstCall().returns({getName: sinon.stub().returns('bob')});
            mockIdentityCardService.getIdentityCard.onSecondCall().returns({getName: sinon.stub().returns('admin')});

            let result = component.canDeploy('1234');

            result.should.equal(true);

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledTwice;
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.firstCall.should.have.been.calledWith('1234', 'PeerAdmin');
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.secondCall.should.have.been.calledWith('1234', 'ChannelAdmin');

            mockIdentityCardService.getAllCardRefsForProfile.should.have.been.calledWith('1234');

            mockIdentityCardService.getIdentityCard.should.have.been.calledTwice;
            mockIdentityCardService.getIdentityCard.firstCall.should.have.been.calledWith('another-cardRef');
            mockIdentityCardService.getIdentityCard.secondCall.should.have.been.calledWith('web-cardRef');
        });

        it('should not show deploy button if no PeerAdmin Role', () => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns([]);

            let result = component.canDeploy('1234');

            result.should.equal(false);

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledOnce;
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'PeerAdmin');

            mockIdentityCardService.getAllCardRefsForProfile.should.not.have.been.called;

            mockIdentityCardService.getIdentityCard.should.not.have.been.calledTwice;
        });

        it('should not show deploy button if not got ChannelAdmin role', () => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.onFirstCall().returns(['web-cardRef']);
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.onSecondCall().returns([]);

            let result = component.canDeploy('1234');

            result.should.equal(false);

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledTwice;
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.firstCall.should.have.been.calledWith('1234', 'PeerAdmin');
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.secondCall.should.have.been.calledWith('1234', 'ChannelAdmin');

            mockIdentityCardService.getAllCardRefsForProfile.should.not.have.been.called;

            mockIdentityCardService.getIdentityCard.should.not.have.been.called;
        });

        it('should show deploy button if got all correct cards', () => {
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.returns(['web-cardRef']);
            mockIdentityCardService.getAllCardRefsForProfile.returns(['another-cardRef', 'web-cardRef']);
            mockIdentityCardService.getIdentityCard.onFirstCall().returns({getName: sinon.stub().returns('bob')});
            mockIdentityCardService.getIdentityCard.onSecondCall().returns({getName: sinon.stub().returns('fred')});

            let result = component.canDeploy('1234');

            result.should.equal(false);

            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.should.have.been.calledTwice;
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.firstCall.should.have.been.calledWith('1234', 'PeerAdmin');
            mockIdentityCardService.getIdentityCardRefsWithProfileAndRole.secondCall.should.have.been.calledWith('1234', 'ChannelAdmin');

            mockIdentityCardService.getAllCardRefsForProfile.should.have.been.calledWith('1234');

            mockIdentityCardService.getIdentityCard.should.have.been.calledTwice;
            mockIdentityCardService.getIdentityCard.firstCall.should.have.been.calledWith('another-cardRef');
            mockIdentityCardService.getIdentityCard.secondCall.should.have.been.calledWith('web-cardRef');
        });
    });
});
