import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { 
    StateProvince, 
    StateProvincePagination, 
} from 'app/modules/admin/master-data/general/state-province/state-province.types';
import {
    BehaviorSubject,
    Observable,
    filter,
    map,
    of,
    switchMap,
    take,
    tap,
    throwError,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StateProvinceService {
    // Private
    private _pagination: BehaviorSubject<StateProvincePagination | null> =
        new BehaviorSubject(null);
    private _stateProvince: BehaviorSubject<StateProvince | null> = new BehaviorSubject(null);
    private _stateProvinces: BehaviorSubject<StateProvince[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<StateProvincePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for stateProvince
     */
    get stateProvince$(): Observable<StateProvince> {
        return this._stateProvince.asObservable();
    }

    /**
     * Getter for stateProvinces
     */
    get stateProvinces$(): Observable<StateProvince[]> {
        return this._stateProvinces.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get stateProvince 
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getStateProvinces(
        page: number = 0,
        size: number = 10,
        sort: string = 'stateProvinceName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: StateProvincePagination;
        stateProvinces: StateProvince[];
    }> {
        return this._httpClient
            .get<{
                pagination: StateProvincePagination;
                stateProvinces: StateProvince[];
            }>('api/master-data/general/state-provinces', {
                params: {
                    page: '' + page,
                    size: '' + size,
                    sort,
                    order,
                    search,
                },
            })
            .pipe(
                tap((response) => {
                    this._pagination.next(response.pagination);
                    this._stateProvinces.next(response.stateProvinces);
                })
            );
    }

    /**
     * Get stateProvince type by id
     */
    getStateProvinceById(id: string): Observable<StateProvince> {
        return this._stateProvinces.pipe(
            take(1),
            map((stateProvinces) => {
                // Find the stateProvince 
                const stateProvince =
                    stateProvinces.find((item) => item.id === id) || null;

                // Update the stateProvince 
                this._stateProvince.next(stateProvince);

                // Return the stateProvince 
                return stateProvince;
            }),
            switchMap((stateProvince) => {
                if (!stateProvince) {
                    return throwError(
                        'Could not found state province with id of ' + id + '!'
                    );
                }

                return of(stateProvince);
            })
        );
    }

    /**
     * Create stateProvince type
     */
    createStateProvince(): Observable<StateProvince> {
        return this._httpClient
            .post<StateProvince>('api/master-data/general/state-province', {})
            .pipe(
                tap((newStateProvince) => {
                    // Ensure newStateProvince.id is defined
                    if (!newStateProvince.id) {
                        console.error('Newly created state province lacks an ID');
                        return;
                    }
                    const currentStateProvinces = this._stateProvinces.getValue();
                    this._stateProvinces.next([newStateProvince, ...currentStateProvinces]);
                })
            );
    }
    
    /**
     * Update stateProvince type
     *
     * @param id
     * @param stateProvince
     */
    updateStateProvince(id: string, stateProvince: StateProvince): Observable<StateProvince> {
        console.log('Sending PATCH request:', { id, stateProvince });
      
        return this._httpClient.patch<StateProvince>(
          'api/master-data/general/state-province', 
          { id, stateProvince }
        ).pipe(
          tap((updatedStateProvince) => {
            console.log('PATCH response received:', updatedStateProvince);
      
            // Update the _stateProvinces BehaviorSubject with the updated stateProvince type
            const currentStateProvinces = this._stateProvinces.getValue(); // Get the current stateProvince types
            const index = currentStateProvinces.findIndex((ct) => ct.id === id); // Find the index of the updated stateProvince
      
            if (index !== -1) {
              currentStateProvinces[index] = updatedStateProvince; // Update the stateProvince type in the list
              this._stateProvinces.next(currentStateProvinces); // Emit the updated list
            }
          })
        );
      }
      
    /**
     * Delete the stateProvince 
     *
     * @param id
     */
    deleteStateProvince(id: string): Observable<boolean> {
        console.log('Attempting to delete state province with ID:', id);
        return this.stateProvinces$.pipe(
            take(1),
            switchMap((stateProvinces) =>
                this._httpClient
                    .delete('api/master-data/general/state-province', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted stateProvince type
                            const index = stateProvinces.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the stateProvince type
                            stateProvinces.splice(index, 1);

                            // Update the stateProvince types
                            this._stateProvinces.next(stateProvinces);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}