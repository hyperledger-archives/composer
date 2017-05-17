import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AboutComponent } from './about.component';
import { AboutService } from '../services/about.service';

const MOCK_RETURN = {
    playground: {
        name: 'playground',
        version: '1'
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

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AboutComponent],
            providers: [{provide: AboutService, useClass: MockAboutService}]
        });

        fixture = TestBed.createComponent(AboutComponent);
        component = fixture.componentInstance;

        //  query for the title <h2> by CSS element selector
        de = fixture.debugElement.query(By.css('h2'));
        el = de.nativeElement;
    });

    it('Should display the correct title for the AboutComponent', fakeAsync(() => {
        fixture.detectChanges();

        tick();

        el.textContent.should.equal('About');
    }));

    it('Should call getVersions when the component is created', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        fixture.componentInstance.playground.should.equal(MOCK_RETURN.playground);
    }));
});
