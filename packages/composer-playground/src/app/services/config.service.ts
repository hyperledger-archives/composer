import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

@Injectable()
export class ConfigService {

    private configLoaded: boolean = false;
    private config: any = null;

    constructor(private http: Http) {
    }

    loadConfig(): Promise<any> {
        // Load the config data.
        return this.http.get('/config.json')
            .map((res: Response) => res.json())
            .toPromise()
            .then((config) => {
                this.configLoaded = true;
                this.config = config;
                return config;
            });
    }

    getConfig(): any {
        if (!this.configLoaded) {
            throw new Error('config has not been loaded');
        }
        return this.config;
    }

    isWebOnly(): boolean {
        if (!this.configLoaded) {
            throw new Error('config has not been loaded');
        } else if (!this.config) {
            return false;
        }
        return this.config.webonly;
    }

}
