import { Component, OnInit } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ResourceComponent } from '../resource/resource.component';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: [
    './test.component.scss'.toString()
  ]
})

export class TestComponent implements OnInit {

  constructor(
    private modalService: NgbModal
  ) {

  }

  ngOnInit() {

  }

  openNewResourceModal() {
    const modalRef = this.modalService.open(ResourceComponent);
    modalRef.componentInstance.registryID = 'org.acme.biznet.SampleParticipant';
  }

}
