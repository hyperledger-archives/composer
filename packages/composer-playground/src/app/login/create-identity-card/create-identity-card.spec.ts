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

            component['newConnection'].should.deep.equal(true);
            component['profileChosen'].should.deep.equal(true);
        }));

        it('should be able to set named profile', fakeAsync(() => {

            let targetProfile = { 'name': 'Pingu', 'x-type': 'Penguin'};

            component['connectionProfiles'] = new Map<string, string>();
            component['connectionProfiles'].set('selectMe', targetProfile);

            component['connectionProfileNames'] = new Map<string, string>();
            component['connectionProfileNames'].set('selectMe', 'captainConga');

            component.setConnectionProfile('selectMe');

            tick();

            component['wrappedConnectionProfile'].should.deep.equal(targetProfile);
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
