import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ClientService } from '../services/client.service';
import { AlertService } from '../services/alert.service'
import { ResourceComponent } from '../resource/resource.component';

@Component({
  selector: 'registry',
  templateUrl: './registry.component.html',
  styleUrls: [
    './registry.component.scss'.toString()
  ]
})

export class RegistryComponent {

  private _registry = null;
  private resources = [];

  private expandedResource = null;
  private showExpand = true;

  @Input()
  set registry(registry) {
    this._registry = registry;
    if (this._registry) {
      this.loadResources();
    }
  }

  constructor(private clientService: ClientService,
              private alertService: AlertService,
              private modalService: NgbModal) {
  }

  loadResources() {
    this._registry.getAll()
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

  expandResource(resourceToExpand) {
    if (this.expandedResource === resourceToExpand.getIdentifier()) {
      this.expandedResource = null
    } else {
      this.expandedResource = resourceToExpand.getIdentifier();
    }
  }

  openNewResourceModal() {
    const modalRef = this.modalService.open(ResourceComponent);
    modalRef.componentInstance.registryID = this._registry.id;
    modalRef.result.then(()=>{
      // refresh current resource list
      this.loadResources();
    });
  }

  hasOverFlow(overflow: boolean) {
    this.showExpand = overflow;
  }
}

