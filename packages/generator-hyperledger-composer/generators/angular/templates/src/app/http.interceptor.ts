import {Injectable} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest} from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs/Observable';
import { Http, Response, Headers ,RequestOptions } from '@angular/http';

@Injectable()
export class NoopInterceptor implements HttpInterceptor {
    private cookies: string = 'Cookie';
    private connect_sid: string = 'connect.sid';
    private access_token: string = 'access_token';
    private userId: string = 'userId';
    private _cookieService: CookieService;
    private headers: Headers;

    constructor(_cookieService: CookieService) {
        this._cookieService = _cookieService;
    }

    public createKey(key: string ,){
        if(this._cookieService.get(key) == null){  console.log('errrrrrrror'); return; }
        return key + '=' + this._cookieService.get(key) + ';';
    }


    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.headers = new Headers();

        var cookiesValue = this.createKey(this.connect_sid) + this.createKey(this.access_token) + this.createKey(this.userId);

        this.headers.append('Content-Type', 'application/json');
        this.headers.append('Accept', 'application/json');
        const changedReq = req.clone({
            withCredentials : true,
            headers: req.headers.set('Cookie', cookiesValue)
        });
        return next.handle(changedReq);
    }
}
