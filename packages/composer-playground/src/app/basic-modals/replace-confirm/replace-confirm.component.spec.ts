/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { ReplaceComponent } from './replace-confirm.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

describe('DeleteComponent', () => {
    let component: ReplaceComponent;
    let fixture: ComponentFixture<ReplaceComponent>;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ReplaceComponent],
            providers: [ {provide: NgbActiveModal, useValue: mockActiveModal} ]
        });
        fixture = TestBed.createComponent(ReplaceComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.should.be.ok;
    });

    describe('onInit', () => {

        it('should set default messages', () => {

            component['ngOnInit']();

            component['headerMessage'].should.be.equal('Current definition will be replaced');
            component['mainMessage'].should.be.equal('Your Business Network Definition currently in the Playground will be removed & replaced.');
            component['supplementaryMessage'].should.be.equal('Please ensure that you have exported any current model files in the Playground.');
        });

    });
});
