/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { AboutService } from './about.service';

import * as sinon from 'sinon';

describe('AboutService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                AboutService
            ]
        });
    });

    it('it should make an http call to retrieve the json that shows the versions', fakeAsync(inject([AboutService], (aboutService) => {
        // make the call to the service which was injected
        aboutService.getVersions().then((versions) => {
            versions.playground.name.should.equal('playground');
            versions.playground.version.should.match(/[0-9]+.[0-9]+.[0-9]+/);
        });

        tick();
    })));

    it('should return the version if already set', fakeAsync(inject([AboutService], (aboutService) => {
        aboutService['versions'] = {version: 'myVersion'};

        let getModulesStub = sinon.stub(aboutService, 'getModules');

        aboutService.getVersions().then((result) => {
            result.should.deep.equal({version: 'myVersion'});
        });

        tick();
    })));
});
