import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { 
    CountryType, 
    CountryTypePagination, 
} from 'app/modules/admin/master-data/general/country-type/country-type.types';
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
export class CountryTypeService {
    // Private
    private _pagination: BehaviorSubject<CountryTypePagination | null> =
        new BehaviorSubject(null);
    private _countryType: BehaviorSubject<CountryType | null> = new BehaviorSubject(
        null
    );
    private _countryTypes: BehaviorSubject<CountryType[] | null> =
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
    get pagination$(): Observable<CountryTypePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for countryType
     */
    get countryType$(): Observable<CountryType> {
        return this._countryType.asObservable();
    }

    /**
     * Getter for countryTypes
     */
    get countryTypes$(): Observable<CountryType[]> {
        return this._countryTypes.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get country types
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCountryTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'countryTypeName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CountryTypePagination;
        countryTypes: CountryType[];
    }> {
        return this._httpClient
            .get<{
                pagination: CountryTypePagination;
                countryTypes: CountryType[];
            }>('api/master-data/general/country-types', {
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
                    this._countryTypes.next(response.countryTypes);
                })
            );
    }

    /**
     * Get country type by id
     */
    getCountryTypeById(id: string): Observable<CountryType> {
        return this._countryTypes.pipe(
            take(1),
            map((countryTypes) => {
                // Find the country type
                const countryType =
                    countryTypes.find((item) => item.id === id) || null;

                // Update the country type
                this._countryType.next(countryType);

                // Return the country type
                return countryType;
            }),
            switchMap((countryType) => {
                if (!countryType) {
                    return throwError(
                        'Could not found country type with id of ' + id + '!'
                    );
                }

                return of(countryType);
            })
        );
    }

    /**
     * Create country type
     */
    createCountryType(): Observable<CountryType> {
        return this._httpClient
            .post<CountryType>('api/master-data/general/country-type', {})
            .pipe(
                tap((newCountryType) => {
                    // Ensure newCountryType.id is defined
                    if (!newCountryType.id) {
                        console.error('Newly created country type lacks an ID');
                        return;
                    }
                    const currentCountryTypes = this._countryTypes.getValue();
                    this._countryTypes.next([newCountryType, ...currentCountryTypes]);
                })
            );
    }
    
    /**
     * Update country type
     *
     * @param id
     * @param countryType
     */
    updateCountryType(id: string, countryType: CountryType): Observable<CountryType> {
        console.log('Sending PATCH request:', { id, countryType });
      
        return this._httpClient.patch<CountryType>(
          'api/master-data/general/country-type', 
          { id, countryType }
        ).pipe(
          tap((updatedCountryType) => {
            console.log('PATCH response received:', updatedCountryType);
      
            // Update the _countryTypes BehaviorSubject with the updated country type
            const currentCountryTypes = this._countryTypes.getValue(); // Get the current country types
            const index = currentCountryTypes.findIndex((ct) => ct.id === id); // Find the index of the updated country type
      
            if (index !== -1) {
              currentCountryTypes[index] = updatedCountryType; // Update the country type in the list
              this._countryTypes.next(currentCountryTypes); // Emit the updated list
            }
          })
        );
      }
      
    /**
     * Delete the country type
     *
     * @param id
     */
    deleteCountryType(id: string): Observable<boolean> {
        console.log('Attempting to delete country type with ID:', id);
        return this.countryTypes$.pipe(
            take(1),
            switchMap((countryTypes) =>
                this._httpClient
                    .delete('api/master-data/general/country-type', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted country type
                            const index = countryTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the country type
                            countryTypes.splice(index, 1);

                            // Update the country types
                            this._countryTypes.next(countryTypes);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}