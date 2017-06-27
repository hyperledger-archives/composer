
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { TransactionService } from '../services/transaction.service';
import { AlertService } from '../basic-modals/alert.service';
import { TransactionComponent } from './transaction/transaction.component';

@Component({
    selector: 'app-test',
    templateUrl: './test.component.html',
    styleUrls: [
        './test.component.scss'.toString()
    ]
})

export class TestComponent implements OnInit, OnDestroy {

    private assetRegistries = [];
    private participantRegistries = [];
    private transactionRegistry = null;
    private chosenRegistry = null;
    private registryReload = false;
    private eventsTriggered = [];

    constructor(private clientService: ClientService,
                private initializationService: InitializationService,
                private alertService: AlertService,
                private transactionService: TransactionService,
                private modalService: NgbModal) {
    }

    ngOnInit(): Promise<any> {
        this.initializeEventListener();
        return this.initializationService.initialize()
            .then(() => {
                return this.clientService.getBusinessNetworkConnection().getAllAssetRegistries();
            })
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
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }

    ngOnDestroy() {
        this.clientService.getBusinessNetworkConnection().removeAllListeners('event');
    }

    setChosenRegistry(chosenRegistry) {
        this.chosenRegistry = chosenRegistry;
    }

    submitTransaction() {
         const modalRef = this.modalService.open(TransactionComponent);

         modalRef.result.then((transaction) => {
            // refresh current resource list
             if (this.chosenRegistry === this.transactionRegistry) {
                this.registryReload = !this.registryReload;
            } else {
                this.chosenRegistry = this.transactionRegistry;
            }

             this.transactionService.reset(transaction, this.eventsTriggered);
             let plaural = (this.eventsTriggered.length > 1) ? 's' : '';

             let txMessage = `<p>Transaction ID <b>${transaction.getIdentifier()}</b> was submitted</p>`;
             let message = {
                title: 'Submit Transaction Successful',
                text: txMessage.toString(),
                icon: '#icon-transaction',
                link: null,
                linkCallback: null
            };

             if (this.eventsTriggered.length > 0) {
                 message.link = `${this.eventsTriggered.length} event${plaural} triggered`;
                 message.linkCallback = () => {
                    this.transactionService.event$.next('event');
                };
                 this.eventsTriggered = [];
            }

             this.alertService.successStatus$.next(message);
        });
    }

    initializeEventListener() {
        const businessNetworkConnection = this.clientService.getBusinessNetworkConnection();
        // Prevent multiple listeners being created
        if (businessNetworkConnection.listenerCount('event') === 0) {
            businessNetworkConnection.on('event', (event) => {
                this.eventsTriggered.push(event);
            });
        }
    }
}
