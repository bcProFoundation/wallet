import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    private refreshKey = new BehaviorSubject<any>({keyId: ''});

    publishRefresh(data: any) {
        this.refreshKey.next(data);
    }

    getRefreshKey(): BehaviorSubject<any> {
        return this.refreshKey;
    }
}
