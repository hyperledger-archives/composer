import { Injectable } from '@angular/core';

@Injectable()
export class Configuration {
    public ApiIP: string = "<%= apiIP %>";
    public ApiPort: string = "<%= apiPort %>";
    public Server: string = this.ApiIP+":"+this.ApiPort;
    public ApiUrl: string = "/api/";
    public ServerWithApiUrl = this.Server + this.ApiUrl;
}
