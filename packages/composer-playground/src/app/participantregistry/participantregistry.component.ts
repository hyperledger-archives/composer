import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import leftPad = require('left-pad');

import { AddParticipantComponent } from './addparticipant';
import { UpdateParticipantComponent } from './updateparticipant';
import { RemoveParticipantComponent } from './removeparticipant';
import { IssueIdentityComponent } from './issueidentity';
import { IssuedIdentityComponent } from './issuedidentity';
import { ClientService } from '../client.service';
import { ConnectionProfileService } from '../connectionprofile.service';
import { InitializationService } from '../initialization.service';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-participantregistry',
  templateUrl: './participantregistry.component.html',
  styleUrls: ['./participantregistry.component.css']
})
export class ParticipantRegistryComponent implements OnInit, OnDestroy {

  private registry: any;
  private resources: any;
  private registryID: string;
  private subs: any;
  private currentConnectionProfile: any = null;

  @ViewChild(AddParticipantComponent) private addResourceComponent: AddParticipantComponent;
  @ViewChild(UpdateParticipantComponent) private updateResourceComponent: UpdateParticipantComponent;
  @ViewChild(RemoveParticipantComponent) private removeResourceComponent: RemoveParticipantComponent;
  @ViewChild(IssueIdentityComponent) private issueIdentityComponent: IssueIdentityComponent;
  @ViewChild(IssuedIdentityComponent) private issuedIdentityComponent: IssuedIdentityComponent;

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService,
    private connectionProfileService: ConnectionProfileService,
    private initializationService: InitializationService,
    private alertService: AlertService
  ) {

  }

  ngOnInit(): Promise<any> {
    this.currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    return this.initializationService.initialize()
      .then(() => {
        this.subs = [
          this.route.params.subscribe(params => {
            this.registryID = params['id'];
            return this.loadResources();
          })
        ];
      });
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => { sub.unsubscribe(); });
  }

  loadResources(): Promise<any> {
    return Promise.resolve()
      .then(() => {
        return this.clientService.getBusinessNetworkConnection().getParticipantRegistry(this.registryID);
      })
      .then((registry) => {
        this.registry = registry;
        return this.registry.getAll();
      })
      .then((resources) => {
        this.resources = resources.sort((a, b) => {
          return a.getIdentifier().localeCompare(b.getIdentifier());
        });
      })
      .catch((error) => {
        this.alertService.errorStatus$.next(error);
      });
  }

  serialize(resource: any): string {
    let serializer = this.clientService.getBusinessNetwork().getSerializer();
    return JSON.stringify(serializer.toJSON(resource), null, 2);
  }

  updateResource(resource) {
    this.updateResourceComponent.displayAndWait(resource)
      .then((result) => {
        if (result) {
          return this.loadResources();
        }
      });
  }

  removeResource(resource) {
    this.removeResourceComponent.displayAndWait(resource)
      .then((result) => {
        if (result) {
          return this.loadResources();
        }
      });
  }

  addResource() {
    this.addResourceComponent.displayAndWait()
      .then((result) => {
        if (result) {
          return this.loadResources();
        }
      });
  }

  issueIdentity(resource) {
    this.issueIdentityComponent.displayAndWait(resource);
  }

  issuedIdentity(identity) {
    this.issuedIdentityComponent.displayAndWait(identity.userID, identity.userSecret, identity.invitationURL);
  }

}
