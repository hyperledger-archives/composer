/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import {
    HttpModule,
    Http,
    Response,
    ResponseOptions,
    ConnectionBackend
} from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MockBackend } from '@angular/http/testing';
import { SampleBusinessNetworkService } from './../services/samplebusinessnetwork.service';
import { Observable } from 'rxjs/Observable';

import { GithubComponent } from './github.component';

import * as sinon from 'sinon';
let should = chai.should();

class MockActivatedRoute {
    queryParams = Observable.of({code: 'code'});
}

class MockRouter {
    navigate = sinon.stub();
}

describe('GithubComponent', () => {
    let sandbox;
    let fixture;
    let component;
    let mockSampleBusinessNetwork;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockSampleBusinessNetwork = sinon.createStubInstance(SampleBusinessNetworkService);
        mockSampleBusinessNetwork.setUpGithub = sandbox.stub();

        TestBed.configureTestingModule({
            imports: [HttpModule],
            declarations: [
                GithubComponent
            ],
            providers: [
                {provide: ActivatedRoute, useClass: MockActivatedRoute},
                {provide: Router, useClass: MockRouter},
                {provide: ConnectionBackend, useClass: MockBackend},
                {provide: SampleBusinessNetworkService, useValue: mockSampleBusinessNetwork},
                Http
            ]
        });

        fixture = TestBed.createComponent(GithubComponent);
        component = fixture.componentInstance;
    });

    describe('#ngOnInit', () => {
        it('should setup the component', fakeAsync(() => {
            sandbox.stub(component, 'exchangeCodeForAccessToken')
            .returns(Promise.resolve({access_token: 'token'}));

            component.ngOnInit();
            tick();
            mockSampleBusinessNetwork.setUpGithub.should.be.called;
            mockSampleBusinessNetwork.setUpGithub.should.be.calledWith('token');
            component.router.navigate.should.be.calledWith(['/editor']);
        }));
    });

    describe('#exchangeCodeForAccessToken', () => {

        it('should get a token back from the http request',
            async(inject([ConnectionBackend], (mockBackend) => {

                const mockResponse = {
                    access_token: 'token'
                };

                mockBackend.connections.subscribe((connection) => {
                    connection.mockRespond(new Response(new ResponseOptions({
                        body: JSON.stringify(mockResponse)
                    })));
                });

                component.exchangeCodeForAccessToken('code')
                .then((response) => {
                    response.should.deep.equal(mockResponse);
                });
            })));

        it('should give an error back for a http request',
            async(inject([ConnectionBackend], (mockBackend) => {
                mockBackend.connections.subscribe(
                    (connection) => {
                        connection.mockError(new Error('error'));
                    }
                );

                component.exchangeCodeForAccessToken('code')
                .then((response) => {
                    should.not.exist(response);
                })
                .catch((error) => {
                    should.exist(error);
                });
            })));
    });
});
