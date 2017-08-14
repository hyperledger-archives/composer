/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { DeleteComponent } from './delete-confirm.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

describe('DeleteComponent', () => {
    let component: DeleteComponent;
    let fixture: ComponentFixture<DeleteComponent>;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DeleteComponent],
            providers: [ {provide: NgbActiveModal, useValue: mockActiveModal} ]
        });
        fixture = TestBed.createComponent(DeleteComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.should.be.ok;
    });

    describe('ngOnInit', () => {

        it('should initialise model file parameters', fakeAsync( () => {
            let testItem = { model: true, displayID: 'test_name' };
            component['deleteFile'] = testItem;
            component.ngOnInit();

            tick();

            component['fileName'].should.equal('test_name');
            component['fileType'].should.equal('Model File');
        }));

        it('should initialise script file parameters', fakeAsync( () => {
            let testItem = { script: true, displayID: 'test_name' };
            component['deleteFile'] = testItem;
            component.ngOnInit();

            tick();

            component['fileName'].should.equal('test_name');
            component['fileType'].should.equal('Script File');
        }));

        it('should initialise unknown file parameters', fakeAsync( () => {
            let testItem = { displayID: 'test_name' };
            component['deleteFile'] = testItem;
            component.ngOnInit();

            tick();

            component['fileName'].should.equal('test_name');
            component['fileType'].should.equal('File');
        }));

        it('should not initialise file name if provided', fakeAsync( () => {
            component['fileName'] = 'test_name';
            component.ngOnInit();

            tick();

            component['fileName'].should.equal('test_name');
        }));
    });
});
