/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:use-host-property-decorator*/
/* tslint:disable:no-input-rename*/
/* tslint:disable:member-ordering*/
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IdentityService } from '../services/identity.service';
import { ClientService } from '../services/client.service';
import { BehaviorSubject } from 'rxjs/Rx';

import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';

import * as chai from 'chai';

import * as sinon from 'sinon';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AdminService } from '../services/admin.service';
import { InitializationService } from '../services/initialization.service';

import { LoginComponent } from './login.component';

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

describe(`LoginComponent`, () => {

    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    let mockAdminService;
    let mockIdentityService;
    let mockClientService;
    let mockConnectionProfileService;
    let mockInitializationService;
    let routerStub;

    beforeEach(() => {

        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockInitializationService = sinon.createStubInstance(InitializationService);

        routerStub = new RouterStub();

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
                LoginComponent
            ],
            providers: [
                {provide: IdentityService, useValue: mockIdentityService},
                {provide: ClientService, useValue: mockClientService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: Router, useValue: routerStub},
                {provide: AdminService, useValue: mockAdminService},
                {provide: InitializationService, useValue: mockInitializationService}
            ]
        });

        fixture = TestBed.createComponent(LoginComponent);

        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        it('should create the component', () => {
            component.should.be.ok;
        });

        it('should get all identities', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve({myProfile: {name: 'myProfile'}}));

            mockIdentityService.getIdentities.returns(Promise.resolve(['bob']));

            component.ngOnInit();

            tick();

            mockInitializationService.initialize.should.have.been.called;
            mockConnectionProfileService.getAllProfiles.should.have.been.called;

            mockIdentityService.getIdentities.should.have.been.calledWith('myProfile');

            component['identities'].should.deep.equal({
                myProfile: [{
                    userId: 'bob',
                    connectionProfile: 'myProfile',
                    businessNetwork: 'org-acme-biznet'
                }]});
        }));
    });

    describe('changeIdentity', () => {
        it('should change identity', fakeAsync(() => {
            let identity = {userId: 'bob', connectionProfile: 'myProfile'};
            mockAdminService.list.returns(Promise.resolve(['myNetwork']));
            mockClientService.ensureConnected.returns(Promise.resolve());

            component.changeIdentity(identity);

            tick();

            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('myProfile');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('bob');
            mockAdminService.list.should.have.been.called;
            mockClientService.ensureConnected.should.have.been.calledWith('myNetwork', true);

            mockIdentityService.setLoggedIn.should.have.been.calledWith(true);
            routerStub.navigate.should.have.been.calledWith(['editor']);
        }));
    });
});
