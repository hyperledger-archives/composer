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
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, DebugElement, Input } from '@angular/core';

import { WelcomeComponent } from './welcome.component';
import { ConfigService } from './../services/config.service';
import { Config } from './../services/config/configStructure.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as sinon from 'sinon';

@Component({
    selector: 'tutorial-link',
    template: ''
})
class MockTutorialLinkComponent {
    @Input()
    link: string;
}

describe('WelcomeComponent', () => {
    let component: WelcomeComponent;
    let fixture: ComponentFixture<WelcomeComponent>;
    let debug: DebugElement;
    let element: HTMLElement;
    let mockConfigService;
    let mockConfig;

    let ngbActiveModalMock = {
        close: sinon.stub(),
        dismiss: sinon.stub()
    };

    beforeEach(async(() => {
        mockConfigService = sinon.createStubInstance(ConfigService);
        mockConfigService.loadConfig.returns(Promise.resolve({banner: ['Custom', 'Composer Playground']}));
        mockConfig = sinon.createStubInstance(Config);
        mockConfig.setToDefault();
        mockConfigService.getConfig.returns(new Config());
        TestBed.configureTestingModule({
            declarations: [WelcomeComponent, MockTutorialLinkComponent],
            providers: [
                {provide: NgbActiveModal, useValue: ngbActiveModalMock},
                {provide: ConfigService, useValue: mockConfigService},
                {provide: Config, useValue: mockConfig}
            ]
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
        component['config'] = mockConfig;
        element.textContent.should.contain('Welcome to');
    });

    it('should set the config using get config if config is loaded', () => {
        let myConfig = new Config();
        myConfig.webonly = true;
        myConfig.title = 'My Title';
        myConfig.banner = ['My', 'Banner'];
        myConfig.links = {
          docs: 'My Docs',
          tutorial: 'My Tutorial',
          community: 'My Community',
          github: 'My Github',
          install: 'My Install'
        };

        mockConfigService.getConfig.returns(myConfig);

        component.ngOnInit();

        component['config'].should.deep.equal(myConfig);
    });

    it('should set the config using load config if getConfig fails', fakeAsync(() => {
        let myConfig = new Config();
        myConfig.webonly = true;
        myConfig.title = 'My Title';
        myConfig.banner = ['My', 'Banner'];
        myConfig.links = {
          docs: 'My Docs',
          tutorial: 'My Tutorial',
          community: 'My Community',
          github: 'My Github',
          install: 'My Install'
        };

        mockConfigService.getConfig.throws(new Error('error'));
        mockConfigService.loadConfig.returns(Promise.resolve(myConfig));

        component.ngOnInit();

        tick();

        component['config'].should.deep.equal(myConfig);
    }));

});
