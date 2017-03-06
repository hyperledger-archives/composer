import { Component, ViewChild, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

const leftPad = require('left-pad');
const LZString = require('lz-string');

import { AdminService } from '../../admin.service';
import { ConnectionProfileService } from '../../connectionprofile.service';
import { ClientService } from '../../client.service';
import { NotificationService } from '../../notification.service';
import { InitializationService } from '../../initialization.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'issue-identity',
  templateUrl: './issueidentity.component.html',
  styleUrls: ['./issueidentity.component.css']
})
export class IssueIdentityComponent implements OnInit, OnDestroy {

  private subs: any[];
  private registryID: string = null;
  private participantFQI: string = null;
  private userID: string = null;
  private issuer: boolean = false;
  private issueInProgress: boolean = false;

  @ViewChild('modal') private modal;

  @Output('onIssued') private issued$ = new EventEmitter();
  @Output('onHidden') private hidden$ = new EventEmitter();
  @Output('onError') private error$ = new EventEmitter();

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService,
    private notificationService: NotificationService,
    private initializationService: InitializationService,
    private adminService: AdminService,
    private connectionProfileService: ConnectionProfileService,
    private http: Http,
    private alertService: AlertService
  ) {

  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {
        this.subs = [
          this.route.params.subscribe(params => {
            this.registryID = params['id'];
          })
        ];
      });
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => { sub.unsubscribe(); });
  }

  private onShow() {
    this.userID = null;
    this.issuer = false;
  }

  private onHidden() {
    this.hidden$.emit();
  }

  private issue() {
    this.issueInProgress = true;
    this.alertService.busyStatus$.next('Issuing identity ...');
    let businessNetworkConnection = this.clientService.getBusinessNetworkConnection();
    let connectionProfileName = this.connectionProfileService.getCurrentConnectionProfile();
    let userID, userSecret, invitationURL;
    this.adminService.getAdminConnection().getProfile(connectionProfileName)
      .then((connectionProfile) => {
        let matcher = new RegExp(/\.blockchain\.ibm\.com/);
        let options = { issuer: this.issuer, affiliation: undefined };
        ['membershipServicesURL', 'peerURL', 'eventHubURL'].forEach((url) => {
          if (connectionProfile[url] && connectionProfile[url].match(/\.blockchain\.ibm\.com/)) {
            // Smells like Bluemix with their non-default affiliations.
            options.affiliation = 'group1';
          }
        });
        return businessNetworkConnection.issueIdentity(this.participantFQI, this.userID, options)
      })
      .then((identity) => {
        // Stash the important stuff.
        userID = identity.userID;
        userSecret = identity.userSecret;
        // Encode the connection profile and issued identity into a URL.
        let connectionProfileName = this.connectionProfileService.getCurrentConnectionProfile();
        return this.adminService.getAdminConnection().getProfile(connectionProfileName);
      })
      .then((connectionProfile) => {
        let invitationData = {
          userID: userID,
          userSecret: userSecret,
          connectionProfileName: connectionProfileName,
          connectionProfile: connectionProfile
        };
        let encodedInvitationData = LZString.compressToEncodedURIComponent(JSON.stringify(invitationData));
        let longURL = window.location.origin + '/#/editor?invitation=' + encodedInvitationData;
        console.log(invitationData);
        console.log(longURL);
        console.log(encodeURIComponent(longURL));
        let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
        let options = new RequestOptions({ headers: headers });
        return this.http.post('http://ibm.biz/api/shorten', 'api_key=5faf5d0e08a717952960d01fb35c0d20&url=' + encodeURIComponent(longURL), options).toPromise();
      })
      .then((response: Response) => {
        invitationURL = response.json().url;
        this.alertService.busyStatus$.next(null);
        this.issued$.emit({
          userID: userID,
          userSecret: userSecret,
          invitationURL: invitationURL
        });
        this.issueInProgress = false;
      })
      .catch((error) => {
        this.alertService.busyStatus$.next(null);
        this.alertService.errorStatus$.next(error);
        this.error$.emit(error);
        this.issueInProgress = false;
      })
  }

  displayAndWait(resource): Promise<boolean> {
    this.participantFQI = resource.getFullyQualifiedIdentifier();
    this.notificationService.modalPromise = this.notificationService.modalPromise.then(() => {
      return new Promise((resolve, reject) => {
        let subs = [
          this.hidden$.subscribe(() => {
            resolve();
            subs.forEach((sub) => { sub.unsubscribe(); });
          })
        ];
        this.modal.show();
      });
    });
    return new Promise((resolve, reject) => {
      let subs = [
        this.hidden$.subscribe(() => {
          if (!this.issueInProgress) {
            resolve(false);
            subs.forEach((sub) => { sub.unsubscribe(); });
          }
        }),
        this.issued$.subscribe(() => {
          resolve(true);
          subs.forEach((sub) => { sub.unsubscribe(); });
        }),
        this.error$.subscribe((error) => {
          resolve(false);
          subs.forEach((sub) => { sub.unsubscribe(); });
        })
      ];
    });
  }

}
