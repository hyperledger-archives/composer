/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, OnInit, Input } from '@angular/core';

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

    @Input() participants: Map<string, Resource> = new Map<string, Resource>();

    private issueInProgress: boolean = false;
    private userID: string = null;
    private participantFQI: string = null;
    private participantFQIs: string[] = [];
    private issuer: boolean = false;
    private isParticipant: boolean = true;
    private noMatchingParticipant = 'Named Participant does not exist in Participant Registry.';

    constructor(private activeModal: NgbActiveModal,
                private alertService: AlertService,
                private clientService: ClientService) {

    }

    ngOnInit(): void {
        return this.loadParticipants();
    }

    loadParticipants() {
        this.participantFQIs = Array.from(this.participants.keys()).sort((a, b) => {
            return a.localeCompare(b);
        });
    }

    search = (text$: Observable<string>) =>
        text$
            .debounceTime(200)
            .distinctUntilChanged()
            .map((term) => term === '' ? []
                : this.participantFQIs.filter((v) => new RegExp(term, 'gi').test(v)).slice(0, 10));

    issueIdentity(): void {
        this.issueInProgress = true;
        let options = {issuer: this.issuer, affiliation: undefined};
        let participant = this.participantFQI.startsWith('resource:') ? this.participantFQI : 'resource:' + this.participantFQI;
        this.clientService.issueIdentity(this.userID, participant, options)
            .then((identity) => {
                this.issueInProgress = false;
                this.activeModal.close(identity);
            })
            .catch((error) => {
                this.issueInProgress = false;
                this.activeModal.dismiss(error);
            });
    }

    isValidParticipant() {
        let participant = this.participantFQI.startsWith('resource:') ? this.participantFQI.slice(9) : this.participantFQI;
        if (this.participantFQI === '' || this.getParticipant(participant)) {
            this.isParticipant = true;
        } else {
            this.isParticipant = false;
        }
    }

    getParticipant(fqi: string): any {
        return this.participants.get(fqi);
    }
}
