import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    private refreshKey = new Subject<any>();
    private refreshWallets = new Subject<any>();

    publishRefresh(data: any) {
        this.refreshKey.next(data);
    }

    getRefresh(): Subject<any> {
        return this.refreshKey;
    }

    publishRefreshWallets() {
        this.refreshWallets.next();
    }

    getRefreshWallets(): Subject<any> {
        return this.refreshWallets;
    }
}
