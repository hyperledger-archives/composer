/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, async, fakeAsync, tick } from '@angular/core/testing';
import { Input, Output, EventEmitter, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CreateIdentityCardComponent } from './create-identity-card.component';

import * as sinon from 'sinon';
import { expect } from 'chai';

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
    selector: 'edit-card-credentials',
    template: ''
})

class MockAddIdentityCardComponent {
    @Input()
    public connectionProfile;
    @Output()
    public idCardAdded: EventEmitter<any> = new EventEmitter<any>();
}

describe('CreateIdentityCardComponent', () => {

    let component: CreateIdentityCardComponent;
    let fixture: ComponentFixture<CreateIdentityCardComponent>;
    let mockConnectionProfileComponent;
    let mockAddIdentityCardComponent;

    beforeEach(() => {

        TestBed.configureTestingModule({
            declarations: [
                CreateIdentityCardComponent,
                MockConnectionProfileComponent,
                MockAddIdentityCardComponent
            ],
            imports: [
                FormsModule
            ],
            providers: []
        });

        fixture = TestBed.createComponent(CreateIdentityCardComponent);
        component = fixture.componentInstance;
    });

    describe('#cancelCreate',  () => {
        it('should trigger finishedCardCreation.emit with false', () => {
            let spy = sinon.spy(component.finishedCardCreation, 'emit');

            component.cancelCreate();

            spy.should.have.been.calledWith(false);
        });
    });

    describe('#completeCardAddition',  () => {
        it('should trigger finishedCardCreation.emit with on success ', () => {
            let spy = sinon.spy(component.finishedCardCreation, 'emit');

            component.completeCardAddition(true);

            spy.should.have.been.calledWith(true);
        });

        it('should call cancelCreate on failure', () => {
            let spy = sinon.spy(component, 'cancelCreate');

            component.completeCardAddition(false);

            spy.should.have.been.called;
        });
    });

    describe('#setConnectionProfile', () => {
        it('should be able to set default v1 profile', fakeAsync(() => {
            component.setConnectionProfile('_$v1');

            tick();

            let profile = { description: 'A description for a V1 Profile',
                            type: 'hlfv1',
                            orderers: [{
                                        url: 'grpc://localhost:7050',
                                        cert: ''
                                        }],
                            ca: {
                                    url: 'http://localhost:7054',
                                    name: ''
                                },
                            peers: [{
                                        requestURL: 'grpc://localhost:7051',
                                        eventURL: 'grpc://localhost:7053',
                                        cert: ''
                                    }],
                            keyValStore: '/tmp/keyValStore',
                            channel: 'composerchannel',
                            mspID: 'Org1MSP',
                            timeout: 300
                        };

            let expectedConstruct = {name: 'New Connection Profile',
                                     profile: profile,
                                     default: false };

            component['wrappedConnectionProfile'].should.deep.equal(expectedConstruct);
        }));

        it('should be able to set named profile', fakeAsync(() => {

            let targetProfile = { name: 'Pingu', type: 'Penguin'};

            component['connectionProfiles'] = new Map<string, string>();
            component['connectionProfiles'].set('selectMe', targetProfile);

            component['connectionProfileNames'] = new Map<string, string>();
            component['connectionProfileNames'].set('selectMe', 'captainConga');

            component.setConnectionProfile('selectMe');

            tick();

            let expectedConstruct = {name: 'captainConga',
                                     profile: targetProfile,
                                     default: true };

            component['wrappedConnectionProfile'].should.deep.equal(expectedConstruct);
        }));
    });

    describe('#createWithExistingProfile', () => {
        it('should set required flags', () => {
            component['creatingIdCard'] = true;
            component['editingCredentials'] = false;

            component.createWithExistingProfile();

            component['creatingIdCard'].should.be.false;
            component['editingCredentials'].should.be.true;

        });
    });

    describe('#createWithNewProfile', () => {
        it('should set required flags', () => {
            component['creatingIdCard'] = true;
            component['creatingWithProfile'] = false;

            component.createWithNewProfile();

            component['creatingIdCard'].should.be.false;
            component['creatingWithProfile'].should.be.true;
        });
    });

    describe('#finishedEditingConnectionProfile', () => {
        it('should call cancelCreate() upon detecting cancel of edit panel', () => {

            let spy = sinon.spy(component, 'cancelCreate');

            component.finishedEditingConnectionProfile({update : false});

            spy.should.have.been.called;
        });

        it('should set flags and call createWithExistingProfile() upon completion', () => {

            component['creatingWithProfile'] = true;

            let spy = sinon.spy(component, 'createWithExistingProfile');
            let dummyProfile = {name: 'bob'};

            component.finishedEditingConnectionProfile({update : true, connectionProfile: dummyProfile});

            component['creatingWithProfile'].should.be.false;
            component['wrappedConnectionProfile'].should.be.deep.equal(dummyProfile);
            spy.should.have.been.called;
        });
    });
});
