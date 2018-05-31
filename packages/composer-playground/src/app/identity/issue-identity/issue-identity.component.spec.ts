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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Directive, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as sinon from 'sinon';

import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/Rx';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IssueIdentityComponent } from './issue-identity.component';
import { AlertService } from '../../basic-modals/alert.service';
import { ClientService } from '../../services/client.service';
import { BusinessNetworkConnection } from 'composer-client';
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

describe('IssueIdentityComponent', () => {

    let component: IssueIdentityComponent;
    let fixture: ComponentFixture<IssueIdentityComponent>;
    let mockClientService;
    let mockBusinessNetworkConnection;
    let mockAlertService;
    let mockActiveModal;

    beforeEach(() => {
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);
        let mockBehaviourSubject = sinon.createStubInstance(BehaviorSubject);
        mockBehaviourSubject.next = sinon.stub();
        mockAlertService = sinon.createStubInstance(AlertService);
        mockAlertService.errorStatus$ = mockBehaviourSubject;
        mockAlertService.busyStatus$ = mockBehaviourSubject;
        mockAlertService.successStatus$ = mockBehaviourSubject;

        mockClientService = sinon.createStubInstance(ClientService);

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
                {provide: ClientService, useValue: mockClientService}
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
            let mockParticipant1 = sinon.createStubInstance(Resource);
            mockParticipant1.getFullyQualifiedIdentifier.returns('org.animals.Penguin#Emperor');
            mockParticipant1.getIdentifier.returns('Emperor');
            mockParticipant1.getType.returns('org.animals.Penguin');
            let mockParticipant2 = sinon.createStubInstance(Resource);
            mockParticipant2.getFullyQualifiedIdentifier.returns('org.animals.Penguin#King');
            mockParticipant2.getIdentifier.returns('King');
            mockParticipant2.getType.returns('org.animals.Penguin');
            let mockParticipant3 = sinon.createStubInstance(Resource);
            mockParticipant3.getFullyQualifiedIdentifier.returns('org.animals.Penguin#Macaroni');
            mockParticipant3.getIdentifier.returns('Macaroni');
            mockParticipant3.getType.returns('org.animals.Penguin');

            component['participants'].set('Emperor', mockParticipant1);
            component['participants'].set('King', mockParticipant2);
            component['participants'].set('Macaroni', mockParticipant2);

            component['loadParticipants']();

            let expected = ['Emperor', 'King', 'Macaroni'];
            component['participantFQIs'].should.deep.equal(expected);
        }));
    });

    describe('#search', () => {

        it('should provide search ahead for blank text', fakeAsync(() => {

            // add FQIs to test against
            component['participantFQIs'] = ['goat', 'giraffe', 'elephant'];

            // mock teXt
            let text$ = new Observable<string>((observer) => {
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
            let text$ = new Observable<string>((observer) => {
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

        it('should generate and return an identity using internally held state information with partially qualified name', fakeAsync(() => {

            mockClientService.issueIdentity.returns(Promise.resolve({
                participant: 'uniqueName',
                userID: 'userId',
                options: {issuer: false, affiliation: undefined}
            }));

            component['participantFQI'] = 'uniqueName';
            component['userID'] = 'userId';

            component['issueIdentity']();

            tick();

            // What was it called with
            mockClientService.issueIdentity.should.have.been.calledWith('userId', 'resource:uniqueName', {issuer: false, affiliation: undefined});

            // Did we return the expected result to the modal on close
            let expected = {
                participant: 'uniqueName',
                userID: 'userId',
                options: {issuer: false, affiliation: undefined}
            };
            mockActiveModal.close.should.be.calledWith(expected);

        }));

        it('should generate and return an identity using internally held state information with fully qualified name', fakeAsync(() => {

            mockClientService.issueIdentity.returns(Promise.resolve({
                participant: 'uniqueName',
                userID: 'userId',
                options: {issuer: false, affiliation: undefined}
            }));

            component['participantFQI'] = 'resource:uniqueName';
            component['userID'] = 'userId';

            component['issueIdentity']();

            tick();

            // What was it called with
            mockClientService.issueIdentity.should.have.been.calledWith('userId', 'resource:uniqueName', {issuer: false, affiliation: undefined});

            // Did we return the expected result to the modal on close
            let expected = {
                participant: 'uniqueName',
                userID: 'userId',
                options: {issuer: false, affiliation: undefined}
            };
            mockActiveModal.close.should.be.calledWith(expected);

        }));

        it('should dismiss modal and pass error on failure', fakeAsync(() => {
            mockClientService.issueIdentity.returns(Promise.reject('some error'));

            component['participantFQI'] = 'uniqueName';

            component['issueIdentity']();

            tick();
            // Check we error
            mockActiveModal.dismiss.should.be.calledWith('some error');
        }));
    });

    describe('#isValidParticipant', () => {

        it('should set valid if empty string', () => {
            component['participantFQI'] = '';
            component['isParticipant'] = false;

            component.isValidParticipant();

            component['isParticipant'].should.be.true;
        });

        it('should set valid if particpant exists when prepended with `resource:`', () => {
            let p1 = new Resource('resource1');
            let p2 = new Resource('resource2');
            component['participants'].set('bob', p1);
            component['participants'].set('sally', p2);

            component['participantFQI'] = 'resource:bob';

            component['isParticipant'] = false;

            component.isValidParticipant();

            component['isParticipant'].should.be.true;

        });

        it('should set valid if particpant exists when not prepended with `resource:`', () => {
            let p1 = new Resource('resource1');
            let p2 = new Resource('resource2');
            component['participants'].set('bob', p1);
            component['participants'].set('sally', p2);

            component['participantFQI'] = 'sally';

            component['isParticipant'] = false;

            component.isValidParticipant();

            component['isParticipant'].should.be.true;

        });

        it('should set invalid if not empty string and participant does not exist', () => {
            component['participantFQI'] = 'not-person';
            let mockGet = sinon.stub(component, 'getParticipant');
            mockGet.returns(false);

            component['isParticipant'] = true;

            component.isValidParticipant();

            component['isParticipant'].should.be.false;
        });

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
