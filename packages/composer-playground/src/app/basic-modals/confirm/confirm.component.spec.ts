/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { ConfirmComponent } from './confirm.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('ConfirmComponent', () => {
    let component: ConfirmComponent;
    let fixture: ComponentFixture<ConfirmComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ConfirmComponent],
            providers: [NgbActiveModal]
        });
        fixture = TestBed.createComponent(ConfirmComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.should.be.ok;
    });
});
