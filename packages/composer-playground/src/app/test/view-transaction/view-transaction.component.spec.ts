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
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ViewTransactionComponent } from './view-transaction.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';

import {
    BusinessNetworkDefinition,
    Serializer,
    Factory,
    Resource,
    ModelFile,
    Introspector
} from 'composer-common';

import { BusinessNetworkConnection } from 'composer-client';

import * as chai from 'chai';
import * as sinon from 'sinon';

let should = chai.should();

@Component({
    selector: 'codemirror',
    template: ''
})
class MockCodeMirrorComponent {
    @Input() config: any;
}

describe('ViewTransactionComponent', () => {
    let component: ViewTransactionComponent;
    let fixture: ComponentFixture<ViewTransactionComponent>;
    let mockNgbActiveModal;
    let mockClientService;
    let mockTransaction;
    let mockBusinessNetwork;
    let mockBusinessNetworkConnection;
    let mockSerializer;
    let mockIntrospector;
    let mockFactory;
    let mockEvent1;
    let mockEvent2;

    let sandbox;

    beforeEach(async(() => {

        sandbox = sinon.sandbox.create();
        mockNgbActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockClientService = sinon.createStubInstance(ClientService);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockIntrospector = sinon.createStubInstance(Introspector);
        mockFactory = sinon.createStubInstance(Factory);
        mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
        mockClientService.getBusinessNetwork.returns(mockBusinessNetwork);
        mockBusinessNetwork.getSerializer.returns(mockSerializer);
        mockBusinessNetwork.getFactory.returns(mockFactory);
        mockBusinessNetwork.getIntrospector.returns(mockIntrospector);
        mockSerializer.toJSON.returns({
            $class: 'mock.class',
            timestamp: 'now',
            transactionId: 'transaction'
        });
        mockNgbActiveModal.close = sandbox.stub();

        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                BrowserModule
            ],
            declarations: [
                ViewTransactionComponent,
                MockCodeMirrorComponent
            ],
            providers: [
                {provide: ClientService, useValue: mockClientService},
                {provide: NgbActiveModal, useValue: mockNgbActiveModal}
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewTransactionComponent);
        component = fixture.componentInstance;

        mockEvent1 = sinon.createStubInstance(Resource);
        mockEvent1.getIdentifier.returns('event1');
        mockEvent2 = sinon.createStubInstance(Resource);
        mockEvent2.getIdentifier.returns('event2');

        mockTransaction = sinon.createStubInstance(Resource);
        mockTransaction.getIdentifier.returns('transaction');

        mockSerializer.toJSON.onFirstCall().returns({
            $class: 'mock.class',
            timestamp: 'now',
            transactionId: 'transaction'
        });

        mockSerializer.toJSON.onSecondCall().returns({
            $class: 'mock.event',
            timestamp: 'now',
            eventId: 'event1'
        });

        mockSerializer.toJSON.onThirdCall().returns({
            $class: 'mock.event',
            timestamp: 'now',
            eventId: 'event2'
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#CodeMirror', () => {
        it('should call the correct functions', () => {
            let cm = {
                foldCode: sandbox.stub(),
                getCursor: sandbox.stub()
            };

            component['codeConfig'].extraKeys['Ctrl-Q'](cm);
            cm.foldCode.should.be.called;
            cm.getCursor.should.be.called;
        });
    });

    describe('#ngOnInit', () => {
        it('should create arrays of Resources, JSON and strings', () => {
            component['transaction'] = mockTransaction;
            component['events'] = [mockEvent1, mockEvent2];
            component.ngOnInit();

            mockBusinessNetwork.getSerializer.should.be.called;

            mockSerializer.toJSON.should.be.calledWith(mockTransaction);
            component.transactionString.should.equal(JSON.stringify({
                $class: 'mock.class',
                timestamp: 'now',
                transactionId: 'transaction'
            }, null, ' '));

            component.events.should.deep.equal([mockEvent1, mockEvent2]);
            mockSerializer.toJSON.should.be.calledWith(mockEvent1);
            mockSerializer.toJSON.should.be.calledWith(mockEvent2);
            component.eventObjects.should.deep.equal([
                {$class: 'mock.event', timestamp: 'now', eventId: 'event1'},
                {$class: 'mock.event', timestamp: 'now', eventId: 'event2'}
            ]);
            component.eventStrings.should.deep.equal([
                JSON.stringify({$class: 'mock.event', timestamp: 'now', eventId: 'event1'}, null, ' '),
                JSON.stringify({$class: 'mock.event', timestamp: 'now', eventId: 'event2'}, null, ' ')
            ]);
        });

        it('should handle no events being passed to the modal', () => {
            component['transaction'] = mockTransaction;
            component.ngOnInit();
            mockBusinessNetwork.getSerializer.should.be.called;

            mockSerializer.toJSON.should.be.calledWith(mockTransaction);
            component.transactionString.should.equal(JSON.stringify({
                $class: 'mock.class',
                timestamp: 'now',
                transactionId: 'transaction'
            }, null, ' '));

            component.events.should.deep.equal([]);
            component.eventObjects.should.deep.equal([]);
            component.eventStrings.should.deep.equal([]);
        });

    });

    describe('#selectEvent', () => {
        it('should select an event by adding it to the list', () => {
            let ev = sinon.createStubInstance(Resource);
            component.selectEvent(ev, 0);
            component.displayEvents[0].should.deep.equal({event: ev, index: 0});
        });

        it('should delete the event index in the list if it exists', () => {
            let ev = sinon.createStubInstance(Resource);
            component.displayEvents = [ev];
            component.selectEvent(ev, 0);
            component.displayEvents.should.deep.equal([]);
        });
    });

    describe('#showEvents', () => {
        it('should change the panel on show', () => {
            component.isEvent = false;
            component.showEvents();
            component.isEvent.should.be.true;
        });
    });

    describe('#showTransaction', () => {
        it('should change the panel on show', () => {
            component.isEvent = true;
            component.showTransaction();
            component.isEvent.should.be.false;
        });
    });

    describe('#showEvent', () => {
        it('should return true', () => {
            component.displayEvents = {0: 'event'};
            component.showEvent(0).should.be.true;
        });
        it('should return false', () => {
            component.displayEvents = {};
            component.showEvent(0).should.be.false;
        });
    });
});
