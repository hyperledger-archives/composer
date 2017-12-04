import { ComponentFixture, TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FooterComponent } from './footer.component';
import { AboutService } from '../services/about.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConfigService } from './../services/config.service';
import { Config } from './../services/config/configStructure.service';

import * as sinon from 'sinon';

import {
    HttpModule,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

const mockResponseAboutService = {
    name: 'composer-playground',
    version: '1',
    dependencies: {
        'composer-admin': {
            version: '2'
        },
        'composer-client': {
            version: '3'
        },
        'composer-common': {
            version: '4'
        }
    }
};

const mockResponseConfigService = {
    webonly: true,
    title: 'My Title',
    banner: ['My', 'Banner'],
    links: {
        docs: 'My Docs',
        tutorial: 'My Tutorial',
        community: 'My Community',
        github: 'My Github',
        install: 'My Install',
        legal: 'My License'
    }
};

describe('FooterComponent', () => {

    let component: FooterComponent;
    let fixture: ComponentFixture<FooterComponent>;
    let links: DebugElement[];
    let mockAboutService;
    let mockConfigService;
    let mockConfig;

    beforeEach(() => {

        mockAboutService = sinon.createStubInstance(AboutService);
        mockConfigService = sinon.createStubInstance(ConfigService);
        mockConfig = sinon.createStubInstance(Config);
        mockConfigService.getConfig.returns(mockConfig);

        TestBed.configureTestingModule({
            imports: [HttpModule],
            declarations: [FooterComponent],
            providers: [
                AlertService,
                AboutService,
                ConfigService,
                {provide: XHRBackend, useClass: MockBackend}
            ]
        });

        fixture = TestBed.createComponent(FooterComponent);
        component = fixture.componentInstance;
    });

    describe('ngOninit', () => {
        it('should initialise the footer', fakeAsync(inject([XHRBackend, ConfigService], (mockBackend, configService: ConfigService) => {
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

            configService['configLoaded'] = true;
            configService['config'] = myConfig;

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: JSON.stringify(mockResponseAboutService)
                })));
            });

            fixture.detectChanges();
            tick();
            fixture.detectChanges();
            component['playgroundVersion'].should.equal('1');
            component['config'].should.deep.equal(myConfig);

            fixture.detectChanges();

            tick();

            links = fixture.debugElement.queryAll(By.css('a'));

            links.length.should.equal(5);

            links[0].nativeElement.textContent.should.equal('Legal');
            links[1].nativeElement.textContent.should.equal('GitHub');
            links[2].nativeElement.textContent.should.equal('Tutorial');
            links[3].nativeElement.textContent.should.equal('Docs');
            links[4].nativeElement.textContent.should.equal('Community');
        })));

        it('should load config if not already loaded', fakeAsync(inject([XHRBackend, ConfigService], (mockBackend, configService: ConfigService) => {
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

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: JSON.stringify(mockResponseConfigService)
                })));
            });

            fixture.detectChanges();
            tick();
            fixture.detectChanges();

            component['config'].should.deep.equal(myConfig);
        })));

        it('should handle error from about service', fakeAsync(inject([ConfigService, XHRBackend], (configService, mockBackend) => {
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

            configService['configLoaded'] = true;
            configService['config'] = myConfig;

            component['alertService'].errorStatus$.subscribe(
                (message) => {
                    if (message !== null) {
                        message.should.equal('error');
                    }
                });

            mockBackend.connections.subscribe(
                (connection) => {
                    connection.mockError('error');
                }
            );

            fixture.detectChanges();
            tick();
            fixture.detectChanges();
        })));
    });
});
