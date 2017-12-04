/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TutorialLinkComponent } from './tutorial-link.component';

describe('TutorialLinkComponent', () => {
    let component: TutorialLinkComponent;
    let fixture: ComponentFixture<TutorialLinkComponent>;

    let tutorialLinkElement: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TutorialLinkComponent]
        });

        fixture = TestBed.createComponent(TutorialLinkComponent);
        component = fixture.componentInstance;
        tutorialLinkElement = fixture.debugElement;
    });

    it('should create component', () => {
        component.should.be.ok;
    });

    it('should show a link', () => {
        fixture.detectChanges();
        let link = tutorialLinkElement.query(By.css('a'));
        link.nativeElement.textContent.should.equal('View our Playground tutorial');
    });
});
