
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { AlertService } from '../services/alert.service';
import { TransactionComponent } from '../transaction/transaction.component';

@Component({
    selector: 'app-test',
    templateUrl: './test.component.html',
    styleUrls: [
        './test.component.scss'.toString()
    ]
})

export class TestComponent implements OnInit {

    private assetRegistries = [];
    private participantRegistries = [];
    private transactionRegistry = null;
    private chosenRegistry = null;
    private registryReload = false;

    constructor(private clientService: ClientService,
                private initializationService: InitializationService,
                private alertService: AlertService,
                private modalService: NgbModal) {
    }

    ngOnInit(): Promise<any> {
        this.clientService.getBusinessNetworkConnection().on('event', (event) => {
            console.log(JSON.stringify(this.clientService.getBusinessNetworkConnection().getBusinessNetwork().getSerializer().toJSON(event)));
        });
        return this.initializationService.initialize()
        .then(() => {
            return this.clientService.getBusinessNetworkConnection().getAllAssetRegistries()
            .then((assetRegistries) => {
                assetRegistries.forEach((assetRegistry) => {
                    let index = assetRegistry.id.lastIndexOf('.');
                    let displayName = assetRegistry.id.substring(index + 1);
                    assetRegistry.displayName = displayName;
                });

                this.assetRegistries = assetRegistries.sort((a, b) => {
                    return a.id.localeCompare(b.id);
                });

                return this.clientService.getBusinessNetworkConnection().getAllParticipantRegistries();
            })
            .then((participantRegistries) => {
                participantRegistries.forEach((participantRegistry) => {
                    let index = participantRegistry.id.lastIndexOf('.');
                    let displayName = participantRegistry.id.substring(index + 1);
                    participantRegistry.displayName = displayName;
                });

                this.participantRegistries = participantRegistries.sort((a, b) => {
                    return a.id.localeCompare(b.id);
                });

                return this.clientService.getBusinessNetworkConnection().getTransactionRegistry();
            })
            .then((transactionRegistry) => {
                this.transactionRegistry = transactionRegistry;

                // set the default registry selection
                if (this.participantRegistries.length !== 0) {
                    this.chosenRegistry = this.participantRegistries[0];
                } else if (this.assetRegistries.length !== 0) {
                    this.chosenRegistry = this.assetRegistries[0];
                } else {
                    this.chosenRegistry = this.transactionRegistry;
                }
            });

        })
        .catch((error) => {
            this.alertService.errorStatus$.next(error);
        });
    }

    setChosenRegistry(chosenRegistry) {
        this.chosenRegistry = chosenRegistry;
    }

    submitTransaction() {
        const modalRef = this.modalService.open(TransactionComponent);
        modalRef.result.then(() => {
            // refresh current resource list
            if (this.chosenRegistry === this.transactionRegistry) {
                this.registryReload = !this.registryReload;
            } else {
                this.chosenRegistry = this.transactionRegistry;
            }

            this.alertService.successStatus$.next({title: 'Submit Transaction Successful', text: 'A transaction was successfully submitted', icon: '#icon-transaction'});

        });
    }
}
