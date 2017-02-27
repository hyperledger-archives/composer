import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ClientService} from '../client.service';

@Component({
  selector: 'export-modal',
  templateUrl: 'export.component.html',
  styleUrls: ['./export.component.scss'.toString()]
})
export class ExportComponent implements OnInit {
  private fileName;

  constructor(public activeModal: NgbActiveModal,private clientService: ClientService) {
    let businessNetworkDefinition = clientService.getBusinessNetwork();
    this.fileName = businessNetworkDefinition.getName();

  }

  ngOnInit(){
    console.log('Exported:',this.fileName);
  };

}
