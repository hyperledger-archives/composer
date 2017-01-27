import { Injectable } from '@angular/core';

import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { SampleService } from './sample.service';

@Injectable()
export class InitializationService {

  private initializingPromise: Promise<any> = null;
  private initialized = false;

  constructor(
    private adminService: AdminService,
    private clientService: ClientService,
    private sampleService: SampleService
  ) {

  }

  initialize(): Promise<any> {
    if (this.initialized) {
      return Promise.resolve();
    } else if (this.initializingPromise) {
      return this.initializingPromise;
    }
    this.initializingPromise = this.adminService.ensureConnected()
      .then(() => {
        return this.clientService.ensureConnected();
      })
      .then(() => {
        if (this.adminService.isInitialDeploy()) {
          let sampleName = this.sampleService.getDefaultSample();
          return this.sampleService.deploySample(sampleName);
        }
      })
      .then(() => {
        this.adminService.busyStatus$.next(null);
        this.clientService.busyStatus$.next(null);
        this.initialized = true;
        this.initializingPromise = null;
      })
      .catch((error) => {
        this.adminService.busyStatus$.next(null);
        this.clientService.busyStatus$.next(null);
        this.adminService.errorStatus$.next(error);
        this.initialized = false;
        this.initializingPromise = null;
      })
    return this.initializingPromise;
  }

}
