import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { 
    City, 
    CityPagination, 
} from 'app/modules/admin/master-data/general/city/city.types';
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
export class CityService {
    // Private
    private _pagination: BehaviorSubject<CityPagination | null> =
        new BehaviorSubject(null);
    private _city: BehaviorSubject<City | null> = new BehaviorSubject(null);
    private _cities: BehaviorSubject<City[] | null> = new BehaviorSubject(null);

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
    get pagination$(): Observable<CityPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for city
     */
    get city$(): Observable<City> {
        return this._city.asObservable();
    }

    /**
     * Getter for cities
     */
    get cities$(): Observable<City[]> {
        return this._cities.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get city 
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCities(
        page: number = 0,
        size: number = 10,
        sort: string = 'cityName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CityPagination;
        cities: City[];
    }> {
        return this._httpClient
            .get<{
                pagination: CityPagination;
                cities: City[];
            }>('api/master-data/general/cities', {
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
                    this._cities.next(response.cities);
                })
            );
    }

    /**
     * Get city type by id
     */
    getCityById(id: string): Observable<City> {
        return this._cities.pipe(
            take(1),
            map((cities) => {
                // Find the city 
                const city =
                    cities.find((item) => item.id === id) || null;

                // Update the city 
                this._city.next(city);

                // Return the city 
                return city;
            }),
            switchMap((city) => {
                if (!city) {
                    return throwError(
                        'Could not found city with id of ' + id + '!'
                    );
                }

                return of(city);
            })
        );
    }

    /**
     * Create city type
     */
    createCity(): Observable<City> {
        return this._httpClient
            .post<City>('api/master-data/general/city', {})
            .pipe(
                tap((newCity) => {
                    // Ensure newCity.id is defined
                    if (!newCity.id) {
                        console.error('Newly created city lacks an ID');
                        return;
                    }
                    const currentCities = this._cities.getValue();
                    this._cities.next([newCity, ...currentCities]);
                })
            );
    }
    
    /**
     * Update city type
     *
     * @param id
     * @param city
     */
    updateCity(id: string, city: City): Observable<City> {
        console.log('Sending PATCH request:', { id, city });
      
        return this._httpClient.patch<City>(
          'api/master-data/general/city', 
          { id, city }
        ).pipe(
          tap((updatedCity) => {
            console.log('PATCH response received:', updatedCity);
      
            // Update the _cities BehaviorSubject with the updated city type
            const currentCities = this._cities.getValue(); // Get the current city types
            const index = currentCities.findIndex((ct) => ct.id === id); // Find the index of the updated city
      
            if (index !== -1) {
              currentCities[index] = updatedCity; // Update the city type in the list
              this._cities.next(currentCities); // Emit the updated list
            }
          })
        );
      }
      
    /**
     * Delete the city 
     *
     * @param id
     */
    deleteCity(id: string): Observable<boolean> {
        console.log('Attempting to delete city with ID:', id);
        return this.cities$.pipe(
            take(1),
            switchMap((cities) =>
                this._httpClient
                    .delete('api/master-data/general/city', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted city type
                            const index = cities.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the city type
                            cities.splice(index, 1);

                            // Update the city types
                            this._cities.next(cities);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}