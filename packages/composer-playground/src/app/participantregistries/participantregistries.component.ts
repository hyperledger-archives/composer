import { Component, OnInit } from '@angular/core';

import { ClientService } from '../client.service';
import { InitializationService } from '../initialization.service';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-participantregistries',
  templateUrl: './participantregistries.component.html',
  styleUrls: ['./participantregistries.component.css']
})
export class ParticipantRegistriesComponent implements OnInit {

  private participantRegistries: any;

  constructor(
    private clientService: ClientService,
    private initializationService: InitializationService,
    private alertService: AlertService
  ) {

  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {
        return this.clientService.getBusinessNetworkConnection().getAllParticipantRegistries()
          .then((participantRegistries) => {
            this.participantRegistries = participantRegistries.sort((a, b) => {
              return a.id.localeCompare(b.id);
            });
          });
      })
      .catch((error) => {
        this.alertService.errorStatus$.next(error);
      });
  }

}
