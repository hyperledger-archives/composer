import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ClientService } from '../../services/client.service';
import { AlertService } from '../../basic-modals/alert.service';
import { ResourceComponent } from '../resource/resource.component';
import { ConfirmComponent } from '../../basic-modals/confirm/confirm.component';
import { ViewTransactionComponent } from '../view-transaction/view-transaction.component';

@Component({
    selector: 'registry',
    templateUrl: './registry.component.html',
    styleUrls: [
        './registry.component.scss'.toString()
    ]
})

export class RegistryComponent {

    tableScrolled = false;

    private _registry = null;
    private _reload = null;
    private resources = [];

    private expandedResource = null;
    private registryType: string = null;

    private overFlowedResources = {};

    @Input()
    set registry(registry: any) {
        this._registry = registry;
        if (this._registry) {
            this.loadResources();
            this.registryType = this._registry.registryType;
        }
    }

    @Input()
    set reload(reload) {
        if (this._reload !== null) {
            this.loadResources();
        }
        this._reload = reload;
    }

    constructor(private clientService: ClientService,
                private alertService: AlertService,
                private modalService: NgbModal) {
    }

    loadResources() {
        this.overFlowedResources = {};

        this._registry.getAll()
            .then((resources) => {
                if (this.isHistorian()) {
                    this.resources = resources.sort((a, b) => {
                        return b.transactionTimestamp - a.transactionTimestamp;
                    });
                } else {
                    this.resources = resources.sort((a, b) => {
                        return a.getIdentifier().localeCompare(b.getIdentifier());
                    });
                }
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
            this.expandedResource = null;
        } else {
            this.expandedResource = resourceToExpand.getIdentifier();
        }
    }

    openNewResourceModal() {
        const modalRef = this.modalService.open(ResourceComponent);
        modalRef.componentInstance.registryId = this._registry.id;
        modalRef.result.then(() => {
            // refresh current resource list
            this.loadResources();
        });
    }

    hasOverFlow(overflow: boolean, resource: any) {
        if (overflow) {
            this.overFlowedResources[resource.getIdentifier()] = resource;
        }
    }

    editResource(resource: any) {
        const editModalRef = this.modalService.open(ResourceComponent);
        editModalRef.componentInstance.registryId = this._registry.id;
        editModalRef.componentInstance.resource = resource;
        editModalRef.result.then(() => {
            // refresh current resource list
            this.loadResources();
        });
    }

    openDeleteResourceModal(resource: any) {
        const confirmModalRef = this.modalService.open(ConfirmComponent);
        confirmModalRef.componentInstance.confirmMessage = 'Please confirm that you want to delete Asset: ' + resource.getIdentifier();

        confirmModalRef.result.then((result) => {
            if (result) {
                this._registry.remove(resource)
                    .then(() => {
                        this.loadResources();
                    })
                    .catch((error) => {
                        this.alertService.errorStatus$.next(
                            'Removing the selected item from the registry failed:' + error
                        );
                    });
            } else {
                // TODO: we should always get called with a code for this usage of the
                // modal but will that always be true
            }
        });
    }

    viewTransactionData(transaction: any) {
        let transactionModalRef = this.modalService.open(ViewTransactionComponent);
        transactionModalRef.componentInstance.transaction = transaction;
        transactionModalRef.componentInstance.events = transaction.eventsEmitted;
    }

    updateTableScroll(hasScroll) {
        this.tableScrolled = hasScroll;
    }

    private isHistorian(): boolean {
        return this.registryType === 'Historian';
    }
}
