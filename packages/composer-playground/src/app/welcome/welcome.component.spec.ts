/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, DebugElement } from '@angular/core';

import { WelcomeComponent } from './welcome.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as sinon from 'sinon';

@Component({
    selector: 'tutorial-link',
    template: ''
})
class MockTutorialLinkComponent {
}

describe('WelcomeComponent', () => {
    let component: WelcomeComponent;
    let fixture: ComponentFixture<WelcomeComponent>;
    let debug: DebugElement;
    let element: HTMLElement;

    let ngbActiveModalMock = {
        close: sinon.stub(),
        dismiss: sinon.stub()
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [WelcomeComponent, MockTutorialLinkComponent],
            providers: [{provide: NgbActiveModal, useValue: ngbActiveModalMock}]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(WelcomeComponent);
        component = fixture.componentInstance;
        debug = fixture.debugElement.query(By.css('h1'));
        element = debug.nativeElement;
        fixture.detectChanges();
    });

    it('should create component', () => {
        component.should.be.ok;
    });

    it('should have correct title', () => {
        element.textContent.should.contain('Welcome to Hyperledger Composer Playground!');
    });

});
