import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import leftPad = require('left-pad');

import { AddAssetComponent } from './addasset';
import { UpdateAssetComponent } from './updateasset';
import { RemoveAssetComponent } from './removeasset';
import { ClientService } from '../client.service';
import { InitializationService } from '../initialization.service';

@Component({
  selector: 'app-assetregistry',
  templateUrl: './assetregistry.component.html',
  styleUrls: ['./assetregistry.component.css']
})
export class AssetRegistryComponent implements OnInit, OnDestroy {

  private registry: any;
  private resources: any;
  private registryID: string;
  private subs: any;

  @ViewChild(AddAssetComponent) private addResourceComponent: AddAssetComponent;
  @ViewChild(UpdateAssetComponent) private updateResourceComponent: UpdateAssetComponent;
  @ViewChild(RemoveAssetComponent) private removeResourceComponent: RemoveAssetComponent;

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService,
    private initializationService: InitializationService
  ) {

  }

  ngOnInit(): Promise<any> {
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
        return this.clientService.getBusinessNetworkConnection().getAssetRegistry(this.registryID);
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
        this.clientService.errorStatus$.next(error);
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

}
