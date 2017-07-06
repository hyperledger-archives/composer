import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.module';
import { ConnectionProfileModule } from '../connection-profile/connection-profile.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, LoginRoutingModule, ConnectionProfileModule],
    declarations: [LoginComponent],
})

export class LoginModule {
}
