import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { has, get } from 'lodash';

import { Config } from './config/configStructure.service';

@Injectable()
export class ConfigService {

    public configLoaded: boolean = false;
    private config: Config = null;

    constructor(private http: Http) {
    }

    loadConfig(): Promise<Config> {
        // Load the config data.
        return this.http.get('/config.json')
            .map((res: Response) => res.json())
            .toPromise()
            .then((config) => {
                this.configLoaded = true;
                let newConfig = new Config();
                newConfig.setToDefault();
                newConfig.setValuesFromObject(config);
                this.config = newConfig;
                return newConfig;
            });
    }

    getConfig(): Config {
        if (!this.configLoaded) {
            throw new Error('config has not been loaded');
        }
        return this.config;
    }

    isWebOnly(): boolean {
        if (!this.configLoaded) {
            throw new Error('config has not been loaded');
        }
        return this.config.webonly;
    }

}
