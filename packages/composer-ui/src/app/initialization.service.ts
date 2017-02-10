import {Injectable} from '@angular/core';

import {AdminService} from './admin.service';
import {ClientService} from './client.service';
import {SampleBusinessNetworkService} from './samplebusinessnetwork.service';

const fabricComposerOwner = 'fabric-composer';
const fabricComposerRepository = 'sample-networks';

@Injectable()
export class InitializationService {

  private initializingPromise: Promise<any> = null;
  private initialized = false;

  constructor(private adminService: AdminService,
              private clientService: ClientService,
              private sampleBusinessNetworkService: SampleBusinessNetworkService) {

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
          return this.sampleBusinessNetworkService.getSampleNetworkInfo(fabricComposerOwner, fabricComposerRepository, 'packages/CarAuction-Network/')
            .then((info) => {
              return this.sampleBusinessNetworkService.deploySample(fabricComposerOwner, fabricComposerRepository, info);
            })
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
      });
    return this.initializingPromise;
  }

}
