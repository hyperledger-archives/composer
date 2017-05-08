/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as sinon from 'sinon';

import { Observable } from 'rxjs';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminConnection } from 'composer-admin';

import { IssueIdentityComponent } from './issue-identity.component';
import { AlertService } from '../services/alert.service';
import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { BusinessNetworkConnection, ParticipantRegisty } from 'composer-client';
import { Resource } from 'composer-common';

@Directive({
    selector: '[ngbTypeahead]'
})

class MockTypeaheadDirective {
    @Input()
    public ngbTypeahead: any;

    @Input()
    public resultTemplate: any;
}

class MockBusinessNetworkConnection {

    // tslint:disable-next-line:no-empty
    getAllParticipantRegistries() {
    }

    issueIdentity(participant, userID, options) {
        return Promise.resolve({participant: participant, userID: userID, options: options});
    }
}

describe('IssueIdentityComponent', () => {
    let component: IssueIdentityComponent;
    let fixture: ComponentFixture<IssueIdentityComponent>;
    let mockClientService;
    let mockBusinessNetworkConnection;
    let mockAlertService;
    let mockAdminService;
    let mockActiveModal;

    beforeEach(() => {
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);
        let mockBehaviourSubject = sinon.createStubInstance(BehaviorSubject);
        mockBehaviourSubject.next = sinon.stub();
        mockAlertService = sinon.createStubInstance(AlertService);
        mockAlertService.errorStatus$ = mockBehaviourSubject;
        mockAlertService.busyStatus$ = mockBehaviourSubject;
        mockAlertService.successStatus$ = mockBehaviourSubject;

        mockAdminService = sinon.createStubInstance(AdminService);
        mockClientService = sinon.createStubInstance(ClientService);
        let mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);

        TestBed.configureTestingModule({
            // TODO mock imports?
            imports: [FormsModule],
            declarations: [
                IssueIdentityComponent,
                MockTypeaheadDirective
            ],
            providers: [
                {provide: NgbActiveModal, useValue: mockActiveModal},
                {provide: AlertService, useValue: mockAlertService},
                {provide: AdminService, useValue: mockAdminService},
                {provide: ClientService, useValue: mockClientService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
            ]
        })
        .compileComponents();

        fixture = TestBed.createComponent(IssueIdentityComponent);
        component = fixture.componentInstance;
    });

    it('should be created', () => {
        expect(component).should.be.ok;
    });

    describe('#ngOnInit', () => {

        it('should loadParticpants on init', fakeAsync(() => {

            let mockLoadParticipants = sinon.stub(component, 'loadParticipants');

            // Run method
            component['ngOnInit']();

            tick();

            mockLoadParticipants.should.have.been.called;

        }));

    });

    describe('#loadParticipants', () => {

        it('should create a sorted list of participantFQIs', fakeAsync(() => {

            // Set up mocked/known items to test against
            let mockParticpantRegistry = sinon.createStubInstance(ParticipantRegisty);
            let mockParticipant1 = sinon.createStubInstance(Resource);
            mockParticipant1.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            let mockParticipant2 = sinon.createStubInstance(Resource);
            mockParticipant2.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_2');
            mockParticpantRegistry.getAll.returns([mockParticipant2, mockParticipant1]);
            mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([mockParticpantRegistry]));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            // Starts Empty
            component['participantFQIs'].should.be.empty;

            // Run method
            component['loadParticipants']();

            tick();

            // Check we load the participants
            let expected = ['org.doge.Doge#DOGE_1', 'org.doge.Doge#DOGE_2'];
            component['participantFQIs'].should.deep.equal(expected);

        }));

        it('should alert if there is an error', fakeAsync(() => {

            // Force error
            mockBusinessNetworkConnection = sinon.createStubInstance(MockBusinessNetworkConnection);
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.reject('some error'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            // Run method
            component['loadParticipants']();

            tick();

            // Check we error
            mockAlertService.errorStatus$.next.should.be.called;
            mockAlertService.errorStatus$.next.should.be.calledWith('some error');

        }));
    });

    describe('#search', () => {

        it('should provide search ahead for blank text', fakeAsync(() => {

            // add FQIs to test against
            component['participantFQIs'] = ['goat', 'giraffe', 'elephant'];

            // mock teXt
            let text$ = new Observable((observer) => {
                // pushing values
                observer.next('');
                // complete stream
                observer.complete();
            });

            // run method
            let result = component['search'](text$);

            // perform test inside promise
            result.toPromise().then((output) => {
                // we should have goat, girrafe, but no elephant
                let expected = [];
                output.should.deep.equal(expected);
            });
        }));

        it('should provide search ahead for existing ids that match', fakeAsync(() => {

            // add FQIs to test against
            component['participantFQIs'] = ['goat', 'giraffe', 'elephant'];

            // mock teXt
            let text$ = new Observable((observer) => {
                // pushing values
                observer.next('g');
                // complete stream
                observer.complete();
            });

            // run method
            let result = component['search'](text$);

            // perform test inside promise
            result.toPromise().then((output) => {
                // we should have goat, girrafe, but no elephant
                let expected = ['goat', 'giraffe'];
                output.should.deep.equal(expected);
            });
        }));

    });

    describe('#issueIdentity', () => {

        it('should generate and return an identity using internally held state information', fakeAsync(() => {

            let mockAdminConnection = sinon.createStubInstance(AdminConnection);
            mockAdminConnection.getProfile.returns(Promise.resolve('bob'));
            mockAdminService.getAdminConnection.returns(mockAdminConnection);
            mockClientService.getBusinessNetworkConnection.returns(new MockBusinessNetworkConnection());

            component['participantFQI'] = 'uniqueName';
            component['userID'] = 'userId';

            component['issueIdentity']();

            tick();

            let expected = {participant: 'uniqueName', userID: 'userId', options: {issuer: false, affiliation: undefined}};
            mockActiveModal.close.should.be.calledWith(expected);

        }));

        it('should generate and return an identity, detecting blockchain.ibm.com URLs', fakeAsync(() => {

            let mockAdminConnection = sinon.createStubInstance(AdminConnection);
            mockAdminConnection.getProfile.returns(Promise.resolve({
                membershipServicesURL: 'memberURL\.blockchain\.ibm\.com',
                peerURL: 'peerURL\.blockchain\.ibm\.com',
                eventHubURL: 'eventURL\.blockchain\.ibm\.com'
            }));
            mockAdminService.getAdminConnection.returns(mockAdminConnection);
            mockClientService.getBusinessNetworkConnection.returns(new MockBusinessNetworkConnection());

            component['participantFQI'] = 'uniqueName';
            component['userID'] = 'userId';

            component['issueIdentity']();

            tick();

            let expected = {participant: 'uniqueName', userID: 'userId', options: {issuer: false, affiliation: 'group1'}};
            mockActiveModal.close.should.be.calledWith(expected);

        }));

        it('should dismiss modal and pass error on failure', fakeAsync(() => {

            let mockAdminConnection = sinon.createStubInstance(AdminConnection);
            mockAdminConnection.getProfile.returns(Promise.reject('some error'));
            mockAdminService.getAdminConnection.returns(mockAdminConnection);
            mockClientService.getBusinessNetworkConnection.returns(new MockBusinessNetworkConnection());
            component['issueIdentity']();

            tick();

            // Check we error
            mockActiveModal.dismiss.should.be.calledWith('some error');

        }));

    });

    describe('#getParticipant', () => {
        it('should get the specified participant', () => {
            let mockParticipant1 = sinon.createStubInstance(Resource);
            mockParticipant1.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            mockParticipant1.getIdentifier.returns('DOGE_1');
            mockParticipant1.getType.returns('org.doge.Doge');
            let mockParticipant2 = sinon.createStubInstance(Resource);
            mockParticipant2.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_2');
            mockParticipant2.getIdentifier.returns('DOGE_2');
            mockParticipant2.getType.returns('org.doge.Doge');
            let mockParticipant3 = sinon.createStubInstance(Resource);
            mockParticipant3.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_3');
            mockParticipant3.getIdentifier.returns('DOGE_3');
            mockParticipant3.getType.returns('org.doge.Doge');

            component['participants'].set('DOGE_1', mockParticipant1);
            component['participants'].set('DOGE_2', mockParticipant2);

            let participant = component['getParticipant']('DOGE_2');

            participant.getIdentifier().should.equal('DOGE_2');
            participant.getType().should.equal('org.doge.Doge');
        });
    });
});
