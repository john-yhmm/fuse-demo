import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { 
    Country, 
    CountryPagination, 
} from 'app/modules/admin/master-data/general/country/country.types';
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
export class CountryService {
    // Private
    private _pagination: BehaviorSubject<CountryPagination | null> =
        new BehaviorSubject(null);
    private _country: BehaviorSubject<Country | null> = new BehaviorSubject(null);
    private _countrys: BehaviorSubject<Country[] | null> = new BehaviorSubject(null);

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
    get pagination$(): Observable<CountryPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for country
     */
    get country$(): Observable<Country> {
        return this._country.asObservable();
    }

    /**
     * Getter for countrys
     */
    get countrys$(): Observable<Country[]> {
        return this._countrys.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get country 
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCountrys(
        page: number = 0,
        size: number = 10,
        sort: string = 'countryName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CountryPagination;
        countrys: Country[];
    }> {
        return this._httpClient
            .get<{
                pagination: CountryPagination;
                countrys: Country[];
            }>('api/master-data/general/countrys', {
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
                    this._countrys.next(response.countrys);
                })
            );
    }

    /**
     * Get country type by id
     */
    getCountryById(id: string): Observable<Country> {
        return this._countrys.pipe(
            take(1),
            map((countrys) => {
                // Find the country 
                const country =
                    countrys.find((item) => item.id === id) || null;

                // Update the country 
                this._country.next(country);

                // Return the country 
                return country;
            }),
            switchMap((country) => {
                if (!country) {
                    return throwError(
                        'Could not found country with id of ' + id + '!'
                    );
                }

                return of(country);
            })
        );
    }

    /**
     * Create country type
     */
    createCountry(): Observable<Country> {
        return this._httpClient
            .post<Country>('api/master-data/general/country', {})
            .pipe(
                tap((newCountry) => {
                    // Ensure newCountry.id is defined
                    if (!newCountry.id) {
                        console.error('Newly created country lacks an ID');
                        return;
                    }
                    const currentCountrys = this._countrys.getValue();
                    this._countrys.next([newCountry, ...currentCountrys]);
                })
            );
    }
    
    /**
     * Update country type
     *
     * @param id
     * @param country
     */
    updateCountry(id: string, country: Country): Observable<Country> {
        console.log('Sending PATCH request:', { id, country });
      
        return this._httpClient.patch<Country>(
          'api/master-data/general/country', 
          { id, country }
        ).pipe(
          tap((updatedCountry) => {
            console.log('PATCH response received:', updatedCountry);
      
            // Update the _countrys BehaviorSubject with the updated country type
            const currentCountrys = this._countrys.getValue(); // Get the current country types
            const index = currentCountrys.findIndex((ct) => ct.id === id); // Find the index of the updated country
      
            if (index !== -1) {
              currentCountrys[index] = updatedCountry; // Update the country type in the list
              this._countrys.next(currentCountrys); // Emit the updated list
            }
          })
        );
      }
      
    /**
     * Delete the country 
     *
     * @param id
     */
    deleteCountry(id: string): Observable<boolean> {
        console.log('Attempting to delete country with ID:', id);
        return this.countrys$.pipe(
            take(1),
            switchMap((countrys) =>
                this._httpClient
                    .delete('api/master-data/general/country', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted country type
                            const index = countrys.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the country type
                            countrys.splice(index, 1);

                            // Update the country types
                            this._countrys.next(countrys);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}