import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    GeoLocation,
    GeoLocationPagination,
} from 'app/modules/admin/master-data/general/geo-location/geo-location.types';
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
export class GeoLocationService {
    // Private
    private _pagination: BehaviorSubject<GeoLocationPagination | null> =
        new BehaviorSubject(null);
    private _geoLocation: BehaviorSubject<GeoLocation | null> = 
        new BehaviorSubject(null);
    private _geoLocations: BehaviorSubject<GeoLocation[] | null> =
        new BehaviorSubject(null);

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
    get pagination$(): Observable<GeoLocationPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for geoLocation
     */
    get geoLocation$(): Observable<GeoLocation> {
        return this._geoLocation.asObservable();
    }

    /**
     * Getter for geoLocation
     */
    get geoLocations$(): Observable<GeoLocation[]> {
        return this._geoLocations.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get geoLocations
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getGeoLocations(
        page: number = 0,
        size: number = 10,
        sort: string = 'geoLocationValue',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: GeoLocationPagination;
        geoLocations: GeoLocation[];
    }> {
        return this._httpClient
            .get<{
                pagination: GeoLocationPagination;
                geoLocations: GeoLocation[];
            }>('api/master-data/general/geo-locations', {
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
                    this._geoLocations.next(response.geoLocations);
                })
            );
    }

    /**
     * Get geoLocation by id
     */
    getGeoLocationById(id: string): Observable<GeoLocation> {
        return this._geoLocations.pipe(
            take(1),
            map((geoLocations) => {
                // Find the geoLocation
                const geoLocation =
                    geoLocations.find((item) => item.id === id) || null;

                // Update the geoLocation
                this._geoLocation.next(geoLocation);

                // Return the geoLocation
                return geoLocation;
            }),
            switchMap((geoLocation) => {
                if (!geoLocation) {
                    return throwError(
                        'Could not found geo location with id of ' + id + '!'
                    );
                }

                return of(geoLocation);
            })
        );
    }

    /**
     * Create geoLocation
     */
    createGeoLocation(): Observable<GeoLocation> {
        return this.geoLocations$.pipe(
            take(1),
            switchMap((geoLocations) =>
                this._httpClient
                    .post<GeoLocation>('api/master-data/general/geo-location', {})
                    .pipe(
                        map((newGeoLocation) => {
                            // Update the geoLocations with the new geoLocation
                            this._geoLocations.next([newGeoLocation, ...geoLocations]);

                            // Return the new geoLocation
                            return newGeoLocation;
                        })
                    )
            )
        );
    }

    /**
     * Update geoLocation
     *
     * @param id
     * @param geoLocation
     */
    updateGeoLocation(id: string, geoLocation: GeoLocation): Observable<GeoLocation> {
        return this.geoLocations$.pipe(
            take(1),
            switchMap((geoLocations) =>
                this._httpClient
                    .patch<GeoLocation>('api/master-data/general/geo-location', {
                        id,
                        geoLocation,
                    })
                    .pipe(
                        map((updatedGeoLocation) => {
                            // Find the index of the updated geoLocation
                            const index = geoLocations.findIndex(
                                (item) => item.id === id
                            );

                            // Update the geoLocation
                            geoLocations[index] = updatedGeoLocation;

                            // Update the geoLocations
                            this._geoLocations.next(geoLocations);

                            // Return the updated geoLocation
                            return updatedGeoLocation;
                        }),
                        switchMap((updatedGeoLocation) =>
                            this.geoLocation$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the geoLocation if it's selected
                                    this._geoLocation.next(updatedGeoLocation);

                                    // Return the updated geoLocation
                                    return updatedGeoLocation;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the geoLocation
     *
     * @param id
     */
    deleteGeoLocation(id: string): Observable<boolean> {
        return this.geoLocations$.pipe(
            take(1),
            switchMap((geoLocations) =>
                this._httpClient
                    .delete('api/master-data/general/geo-location', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted geoLocation
                            const index = geoLocations.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the geoLocation
                            geoLocations.splice(index, 1);

                            // Update the geoLocations
                            this._geoLocations.next(geoLocations);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
