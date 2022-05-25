import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    private refreshKey = new Subject<any>();

    publishRefresh(data: any) {
        this.refreshKey.next(data);
    }

    getRefreshKey(): Subject<any> {
        return this.refreshKey;
    }
}
