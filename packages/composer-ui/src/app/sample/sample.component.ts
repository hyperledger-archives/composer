import {Component, ViewChild, EventEmitter, Input, Output, OnInit} from '@angular/core';

import {AdminService} from '../admin.service';
import {ClientService} from '../client.service';
import {NotificationService} from '../notification.service';
import {SampleBusinessNetworkService} from '../samplebusinessnetwork.service';

const fabricComposerOwner = 'fabric-composer';
const fabricComposerRepository = 'sample-networks';

@Component({
  selector: 'sample',
  templateUrl: './sample.component.html',
  styleUrls: ['./sample.component.css']
})
export class SampleComponent implements OnInit {

  private deployInProgress: boolean = false;
  private sampleNetworks = [];
  private sampleName: string = null;
  private sampleDescription: string = null;
  private owner: string = '';
  private repository: string = '';
  private gitHubAuthenticated: boolean = false;
  private oAuthEnabled: boolean = false;
  private clientId: string = null;

  @ViewChild('modal') private modal;

  @Output('onDeployed') private deployed$ = new EventEmitter();
  @Output('onHidden') private hidden$ = new EventEmitter();
  @Output('onError') private error$ = new EventEmitter();

  constructor(private adminService: AdminService,
              private clientService: ClientService,
              private notificationService: NotificationService,
              private sampleBusinessNetworkService: SampleBusinessNetworkService) {

  }

  ngOnInit(): Promise<any> {
    return this.adminService.ensureConnected()
      .then(() => {
        return this.clientService.ensureConnected();
      })
      .then(() => {
        return this.sampleBusinessNetworkService.isOAuthEnabled()
      })
      .then((result) => {
        this.oAuthEnabled = result;
        if(result) {
          return this.sampleBusinessNetworkService.getGithubClientId()
            .then((clientId)=> {
              if (!clientId) {
                this.error$.emit(new Error(this.sampleBusinessNetworkService.NO_CLIENT_ID));
                this.adminService.errorStatus$.next(this.sampleBusinessNetworkService.NO_CLIENT_ID);
              }

              this.clientId = clientId;
            });

        }
      });

  }

  private onShow() {
    this.gitHubAuthenticated = this.sampleBusinessNetworkService.isAuthenticatedWithGitHub();
    if (this.gitHubAuthenticated) {
      return this.sampleBusinessNetworkService.getModelsInfo(fabricComposerOwner, fabricComposerRepository)
        .then((modelsInfo) => {
          this.sampleNetworks = modelsInfo;
          this.sampleName = this.sampleNetworks[0].name;
          this.sampleDescription = this.sampleNetworks[0].description
        })
        .catch((error) => {
          if(error.message.includes('API rate limit exceeded')) {
            error = new Error(this.sampleBusinessNetworkService.RATE_LIMIT_MESSAGE);
          }

          this.modal.hide();
          this.error$.emit(error);
          this.adminService.errorStatus$.next(error);
        })
    }
  }

  private onHidden() {
    this.hidden$.emit();
  }

  private deploy() {
    this.deployInProgress = true;

    let deployPromise = new Promise((resolve) => {

      if (this.owner !== '' && this.repository !== '') {
        //This is for connecting to your own repository
        return this.sampleBusinessNetworkService.getModelsInfo(this.owner, this.repository);
      } else {
        // we must be using fabric composer github
        let chosenSampleNetwork = this.sampleNetworks.find((sampleNetwork) => {
          return sampleNetwork.name === this.sampleName;
        });

        resolve(chosenSampleNetwork);
      }
    });

    deployPromise.then((chosenSampleNetwork) => {
      let chosenOwner = this.owner !== '' ? this.owner : fabricComposerOwner;
      let chosenRepository = this.repository !== '' ? this.repository : fabricComposerRepository;
      return this.sampleBusinessNetworkService.deploySample(chosenOwner, chosenRepository, chosenSampleNetwork)
    })
      .then(() => {
        this.deployed$.emit();
        this.deployInProgress = false;
      })
      .catch((error) => {
        if(error.message.includes('API rate limit exceeded')) {
          error = new Error(this.sampleBusinessNetworkService.RATE_LIMIT_MESSAGE);
        }

        this.modal.hide();
        this.error$.emit(error);
        this.deployInProgress = false;
        this.adminService.errorStatus$.next(error);
      });

    return deployPromise;
  }

  displayAndWait(): Promise<boolean> {
    this.notificationService.modalPromise = this.notificationService.modalPromise.then(() => {
      return new Promise((resolve, reject) => {
        let subs = [
          this.hidden$.subscribe(() => {
            resolve();
            subs.forEach((sub) => {
              sub.unsubscribe();
            });
          })
        ];
        this.modal.show();
      });
    });
    return new Promise((resolve, reject) => {
      let subs = [
        this.hidden$.subscribe(() => {
          if (!this.deployInProgress) {
            resolve(false);
            subs.forEach((sub) => {
              sub.unsubscribe();
            });
          }
        }),
        this.deployed$.subscribe(() => {
          resolve(true);
          subs.forEach((sub) => {
            sub.unsubscribe();
          });
        }),
        this.error$.subscribe((error) => {
          resolve(false);
          subs.forEach((sub) => {
            sub.unsubscribe();
          });
        })
      ];
    });
  }

  onSampleNameChanged() {
    let chosenSampleNetwork = this.sampleNetworks.find((sampleNetwork) => {
      return sampleNetwork.name === this.sampleName;
    });

    if (chosenSampleNetwork) {
      this.sampleDescription = chosenSampleNetwork.description;
    }
  }
}
