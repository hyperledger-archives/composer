/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { DeleteComponent } from './delete-confirm.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('DeleteComponent', () => {
    let component: DeleteComponent;
    let fixture: ComponentFixture<DeleteComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DeleteComponent],
            providers: [NgbActiveModal]
        });
        fixture = TestBed.createComponent(DeleteComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.should.be.ok;
    });
});
