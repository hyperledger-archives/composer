import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { FooterComponent } from './footer.component';
import { AboutService } from '../services/about.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConfigService } from './../services/config.service';
import { Config } from './../services/config/configStructure.service';

import * as sinon from 'sinon';
import * as sap from 'sinon-as-promised';

import * as chai from 'chai';

class MockAlertService {
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<string> = new BehaviorSubject<string>(null);
}

describe('FooterComponent', () => {

    let component: FooterComponent;
    let fixture: ComponentFixture<FooterComponent>;
    let mockAboutService;
    let mockConfigService;
    let mockConfig;

    beforeEach(() => {

        mockAboutService = sinon.createStubInstance(AboutService);
        mockConfigService = sinon.createStubInstance(ConfigService);
        mockConfig = sinon.createStubInstance(Config);
        mockConfigService.getConfig.returns(mockConfig);

        TestBed.configureTestingModule({
            declarations: [FooterComponent],
            providers: [
                {provide: AboutService, useValue: mockAboutService},
                {provide: AlertService, useClass: MockAlertService},
                {provide: ConfigService, useValue: mockConfigService}
            ]
        });

        fixture = TestBed.createComponent(FooterComponent);
        component = fixture.componentInstance;
    });

    describe('ngOninit', () => {
        it('should call getVersions from the AboutService', fakeAsync(() => {
            mockAboutService.getVersions.resolves({playground: {version: 'v1'}});
            component.ngOnInit();
            tick();
            component['playgroundVersion'].should.equal('v1');
        }));

        it('should send the error to the AlertService', fakeAsync(() => {
            mockAboutService.getVersions.returns(Promise.reject('detailed reject message'));
            component.ngOnInit();
            tick();
            component['alertService'].errorStatus$.subscribe(
                (message) => {
                    message.should.equal('detailed reject message');
                }
            );
        }));

        it('should set the config using get config if config is loaded', () => {
            mockAboutService.getVersions.resolves({playground: {version: 'v1'}});
            let myConfig = new Config();
            myConfig.webonly = true;
            myConfig.title = 'My Title';
            myConfig.banner = ['My', 'Banner'];
            myConfig.links = {
              docs: 'My Docs',
              tutorial: 'My Tutorial',
              community: 'My Community',
              github: 'My Github',
              install: 'My Install',
              legal: 'My License'
            };

            mockConfigService.getConfig.returns(myConfig);

            component.ngOnInit();

            component['config'].should.deep.equal(myConfig);
        });

        it('should set the config using load config if getConfig fails', fakeAsync(() => {
            mockAboutService.getVersions.resolves({playground: {version: 'v1'}});
            let myConfig = new Config();
            myConfig.webonly = true;
            myConfig.title = 'My Title';
            myConfig.banner = ['My', 'Banner'];
            myConfig.links = {
              docs: 'My Docs',
              tutorial: 'My Tutorial',
              community: 'My Community',
              github: 'My Github',
              install: 'My Install',
              legal: 'My License'
            };

            mockConfigService.getConfig.throws(new Error('error'));
            mockConfigService.loadConfig.returns(Promise.resolve(myConfig));

            component.ngOnInit();

            tick();

            component['config'].should.deep.equal(myConfig);
        }));
    });
});
