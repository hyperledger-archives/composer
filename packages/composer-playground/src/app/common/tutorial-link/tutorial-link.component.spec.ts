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
