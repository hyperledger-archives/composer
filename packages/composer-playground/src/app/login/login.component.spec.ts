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
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BehaviorSubject } from 'rxjs/Rx';

import { IdentityService } from '../services/identity.service';
import { IdentityCardService } from '../services/identity-card.service';
import { ClientService } from '../services/client.service';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AdminService } from '../services/admin.service';
import { InitializationService } from '../services/initialization.service';
import { AlertService } from '../basic-modals/alert.service';

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
    selector: 'identity-card',
    template: ''
})
class MockIdentityCardComponent {
    @Input() identity: any;
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
        mockDrawer = sinon.createStubInstance(DrawerService);
        mockModal = sinon.createStubInstance(NgbModal);

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
                MockImportComponent,
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
                {provide: DrawerService, useValue: mockDrawer},
                {provide: NgbModal, useValue: mockModal}
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
            mockInitializationService.isWebOnly.returns(true);
            let loadIdentityCardsStub = sinon.stub(component, 'loadIdentityCards');
            component.ngOnInit();

            tick();

            mockInitializationService.isWebOnly.should.have.been.called;
            component['usingLocally'].should.be.false;
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

    describe('importIdentity', () => {
        beforeEach(() => {
            mockDrawer.open.returns({
                result: Promise.resolve()
            });
        });

        it('should import an identity card', fakeAsync(() => {
            mockIdentityCardService.addIdentityCard.returns(Promise.resolve());
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
            mockIdentityCardService.addIdentityCard.returns(Promise.reject('some error'));
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
        let mockIdCards: Map<string, IdCard>;
        let saveAsStub;

        beforeEach(() => {
            saveAsStub = sandbox.stub(fileSaver, 'saveAs');
            mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getName.returns('myCard');
            mockIdCards = new Map<string, IdCard>();
            mockIdCards.set('myCardRef', mockIdCard);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should export an identity card', fakeAsync(() => {
            mockIdCard.toArchive.returns(Promise.resolve('card data'));
            component['idCards'] = mockIdCards;

            component.exportIdentity('myCardRef');
            tick();

            let expectedFile = new Blob(['card data'], {type: 'application/octet-stream'});
            saveAsStub.should.have.been.calledWith(expectedFile, 'myCard.card');
        }));

        it('should handle errors', fakeAsync(() => {
            mockIdCard.toArchive.returns(Promise.reject('some error'));
            component['idCards'] = mockIdCards;

            component.exportIdentity('myCardRef');
            tick();

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));
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
