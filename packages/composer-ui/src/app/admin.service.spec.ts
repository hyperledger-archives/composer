/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService]
    });
  });

  it('should ...', inject([AdminService], (service: AdminService) => {
    expect(service).toBeTruthy();
  }));
});
