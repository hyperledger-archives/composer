/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AboutComponent } from './about.component';
import { AboutService } from '../services/about.service';

const MOCK_RETURN = {
          'playground': {
            name: 'playground',
            version: '1'
          },
          'common': {
            name: 'composer-common',
            version: '2'
          },
          'client': {
            name: 'composer-client',
            version: '3'
          },
          'admin': {
            name: 'composer-admin',
            version: '4'
          }
};

class MockAboutService {
    public getVersions(): Promise<any> {
        return Promise.resolve(MOCK_RETURN);
    }
}

describe('AboutComponent', () => {

    let component: AboutComponent;
    let fixture: ComponentFixture<AboutComponent>;
    let de: DebugElement;
    let el: HTMLElement;

    beforeEach(async(() => {
      return TestBed.configureTestingModule({
        declarations: [ AboutComponent ],
        providers: [{ provide: AboutService, useClass: MockAboutService }]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(AboutComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      // query for the title <h2> by CSS element selector
      de = fixture.debugElement.query(By.css('h2'));
      el = de.nativeElement;
    });

    it ('Should display the correct title for the AboutComponent', () => {
        fixture.detectChanges();
        expect(el.textContent).toContain('About');
    });

    it ('Should call getVersions when the component is created', fakeAsync(() => {
        return component.ngOnInit()
        .then(() => {
          fixture.detectChanges();
          tick();
          fixture.detectChanges();
          expect(fixture.componentInstance.playground).toBe(MOCK_RETURN.playground);
          expect(fixture.componentInstance.common).toBe(MOCK_RETURN.common);
          expect(fixture.componentInstance.client).toBe(MOCK_RETURN.client);
          expect(fixture.componentInstance.admin).toBe(MOCK_RETURN.admin);
        });
    }));
});
