import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

// import { environment } from '@environments/environment';
// import { User } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class ConversionAuthenticationService {
    private currentUserSubject: BehaviorSubject<any>;
    public currentUser: Observable<any>;

    constructor(private http: HttpClient, private router: Router) {
        this.currentUserSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('currentUserConversion')));
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): string {
        return this.currentUserSubject.value.credentials;
    }

    login(credentials: string) {
        const user = {
            credentials
        };
        localStorage.setItem('currentUserConversion', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUserConversion');
        this.currentUserSubject.next(null);
        this.router.navigate(['']);
    }
}