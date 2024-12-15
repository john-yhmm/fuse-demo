import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
import {
    ContactType,
    ContactTypePagination,
} from 'app/modules/admin/master-data/general/contact-type/contact-type.types';

@Injectable({ providedIn: 'root' })
export class ContactTypeService {
    // Private
    private _pagination: BehaviorSubject<ContactTypePagination | null> =
        new BehaviorSubject(null);
    private _contactType: BehaviorSubject<ContactType | null> =
        new BehaviorSubject(null);
    private _contactTypes: BehaviorSubject<ContactType[] | null> =
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
    get pagination$(): Observable<ContactTypePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for a single contact type
     */
    get contactType$(): Observable<ContactType> {
        return this._contactType.asObservable();
    }

    /**
     * Getter for the list of contact types
     */
    get contactTypes$(): Observable<ContactType[]> {
        return this._contactTypes.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get contact types with pagination
     *
     * @param page Current page number
     * @param size Number of items per page
     * @param sort Sorting field
     * @param order Sorting order (asc/desc)
     * @param search Search keyword
     */
    getContactTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: ContactTypePagination;
        contactTypes: ContactType[];
    }> {
        return this._httpClient
            .get<{
                pagination: ContactTypePagination;
                contactTypes: ContactType[];
            }>('api/master-data/general/contact-types', {
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
                    this._contactTypes.next(response.contactTypes);
                })
            );
    }

    /**
     * Get contact type by ID
     *
     * @param id Contact type ID
     */
    getContactTypeById(id: string): Observable<ContactType> {
        return this._contactTypes.pipe(
            take(1),
            map((contactTypes) => {
                // Find the contact type by ID
                const contactType =
                    contactTypes.find((item) => item.id === id) || null;

                // Update the selected contact type
                this._contactType.next(contactType);

                // Return the contact type
                return contactType;
            }),
            switchMap((contactType) => {
                if (!contactType) {
                    return throwError(
                        'Could not find contact type with id of ' + id + '!'
                    );
                }

                return of(contactType);
            })
        );
    }

    /**
     * Create a new contact type
     */
    createContactType(): Observable<ContactType> {
        return this.contactTypes$.pipe(
            take(1),
            switchMap((contactTypes) =>
                this._httpClient
                    .post<ContactType>(
                        'api/master-data/general/contact-type',
                        {}
                    )
                    .pipe(
                        map((newContactType) => {
                            // Update the list with the new contact type
                            this._contactTypes.next([
                                newContactType,
                                ...contactTypes,
                            ]);

                            // Return the new contact type
                            return newContactType;
                        })
                    )
            )
        );
    }

    /**
     * Update an existing contact type
     *
     * @param id Contact type ID
     * @param contactType Updated contact type object
     */
    updateContactType(
        id: string,
        contactType: ContactType
    ): Observable<ContactType> {
        return this.contactTypes$.pipe(
            take(1),
            switchMap((contactTypes) =>
                this._httpClient
                    .patch<ContactType>(
                        'api/master-data/general/contact-type',
                        {
                            id,
                            contactType,
                        }
                    )
                    .pipe(
                        map((updatedContactType) => {
                            // Find the index of the updated contact type
                            const index = contactTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Update the contact type
                            contactTypes[index] = updatedContactType;

                            // Update the list of contact types
                            this._contactTypes.next(contactTypes);

                            // Return the updated contact type
                            return updatedContactType;
                        }),
                        switchMap((updatedContactType) =>
                            this.contactType$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the selected contact type
                                    this._contactType.next(
                                        updatedContactType
                                    );
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete a contact type
     *
     * @param id Contact type ID
     */
    deleteContactType(id: string): Observable<boolean> {
        return this.contactTypes$.pipe(
            take(1),
            switchMap((contactTypes) =>
                this._httpClient
                    .delete('api/master-data/general/contact-type', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted contact type
                            const index = contactTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Remove the contact type from the list
                            contactTypes.splice(index, 1);

                            // Update the list of contact types
                            this._contactTypes.next(contactTypes);

                            // Return the delete status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
