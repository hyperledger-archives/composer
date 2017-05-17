/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { BusyComponent } from './busy.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('BusyComponent', () => {
    let component: BusyComponent;
    let fixture: ComponentFixture<BusyComponent>;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [BusyComponent],
            providers: [{provide: NgbActiveModal, useValue: mockActiveModal}]
        });

        fixture = TestBed.createComponent(BusyComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.should.be.ok;
    });
});
