/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, async, fakeAsync, tick, inject } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component, Renderer, } from '@angular/core';
import { By } from '@angular/platform-browser';

import * as sinon from 'sinon';
import * as chai from 'chai';
import { DebounceDirective } from './debounce.directive';

let should = chai.should();

@Component({
    selector: 'test',
    template: `
        <input debounce [delay]="500" (debounceFunc)="onChange()" [(ngModel)]="value">
    `
})

class TestComponent {
    value: string = '';
    clicked: boolean = false;
    onChange = sinon.stub();
}

describe('DebounceDirective', () => {
    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent, DebounceDirective],
            imports: [FormsModule]
        })
        .compileComponents();

        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create the directive', async(() => {
        component.should.be.ok;
    }));

    it('should call onChange after 500ms', async(fakeAsync(() => {
        component = fixture.componentInstance;
        let divEl = fixture.debugElement.query(By.css('input'));
        let event = {};

        divEl.nativeElement.dispatchEvent(new Event('keyup'));
        fixture.detectChanges();
        tick(500);
        component.onChange.should.have.been.called;
    })));
});
