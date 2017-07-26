import { Component, OnInit } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import { Resource } from 'composer-common';

import { AlertService } from '../../basic-modals/alert.service';
import { ClientService } from '../../services/client.service';

@Component({
    selector: 'issue-identity-modal',
    templateUrl: './issue-identity.component.html',
    styleUrls: ['./issue-identity.component.scss'.toString()]
})
export class IssueIdentityComponent implements OnInit {

    private issueInProgress: boolean = false;
    private userID: string = null;
    private participantFQI: string = null;
    private participantFQIs: string[] = [];
    private participants: Map<string, Resource> = new Map<string, Resource>();
    private issuer: boolean = false;

    constructor(private activeModal: NgbActiveModal,
                private alertService: AlertService,
                private clientService: ClientService) {

    }

    ngOnInit(): Promise<any> {
        return this.loadParticipants();
    }

    loadParticipants() {
        return this.clientService.getBusinessNetworkConnection().getAllParticipantRegistries()
            .then((participantRegistries) => {
                return Promise.all(participantRegistries.map((registry) => {
                    return registry.getAll();
                }));
            })
            .then((participantArrays) => {
                return Promise.all(
                    participantArrays.reduce(
                        (accumulator, currentValue) => accumulator.concat(currentValue),
                        []
                    ));
            })
            .then((allParticipants) => {
                return Promise.all(allParticipants.map((registryParticipant) => {
                    return this.participants.set('resource:' + registryParticipant.getFullyQualifiedIdentifier(), registryParticipant);
                }));
            })
            .then(() => {
                this.participantFQIs = Array.from(this.participants.keys()).sort((a, b) => {
                    return a.localeCompare(b);
                });
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }

    search = (text$: Observable<string>) =>
        text$
            .debounceTime(200)
            .distinctUntilChanged()
            .map((term) => term === '' ? []
                : this.participantFQIs.filter((v) => new RegExp(term, 'gi').test(v)).slice(0, 10));

    private issueIdentity(): void {
        this.issueInProgress = true;

        let options = {issuer: this.issuer, affiliation: undefined};
        this.clientService.issueIdentity(this.userID, this.participantFQI, options)
            .then((identity) => {
                this.issueInProgress = false;
                this.activeModal.close(identity);
            })
            .catch((error) => {
                this.issueInProgress = false;
                this.activeModal.dismiss(error);
            });
    }

    private getParticipant(fqi: string): any {
        return this.participants.get(fqi);
    }
}
