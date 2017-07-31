/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportErrorComponent } from './import-error.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

describe('ImportErrorComponent', () => {
    let component: ImportErrorComponent;
    let fixture: ComponentFixture<ImportErrorComponent>;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ImportErrorComponent],
            providers: [{provide: NgbActiveModal, useValue: mockActiveModal}]
        });
        fixture = TestBed.createComponent(ImportErrorComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.should.be.ok;
    });

});
