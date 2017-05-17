import { Component, OnInit } from '@angular/core';
import { AboutService } from '../services/about.service';

@Component({
    selector: 'about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'.toString()],
    exportAs: 'child'
})

export class AboutComponent implements OnInit {
    playground = {name: '', version: ''};

    constructor(private aboutService: AboutService) {
    }

    ngOnInit() {
        return this.aboutService.getVersions()
        .then((modules) => {
            this.playground = modules.playground;
        });
    }
}
