/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IdentityService]
    });
  });

  it('should ...', inject([IdentityService], (service: IdentityService) => {
    expect(service).toBeTruthy();
  }));
});
