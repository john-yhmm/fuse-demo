import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    Contact,
    ContactPagination,
} from 'app/modules/admin/master-data/general/contact/contact.types';
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
export class ContactService {
    // Private
    private _pagination: BehaviorSubject<ContactPagination | null> =
        new BehaviorSubject(null);
    private _contact: BehaviorSubject<Contact | null> = new BehaviorSubject(
        null
    );
    private _contacts: BehaviorSubject<Contact[] | null> = new BehaviorSubject(
        null
    );

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
    get pagination$(): Observable<ContactPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for contact
     */
    get contact$(): Observable<Contact> {
        return this._contact.asObservable();
    }

    /**
     * Getter for contacts
     */
    get contacts$(): Observable<Contact[]> {
        return this._contacts.asObservable();
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
    getContacts(
        page: number = 0,
        size: number = 10,
        sort: string = 'emailAddress',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: ContactPagination;
        contacts: Contact[];
    }> {
        return this._httpClient
            .get<{
                pagination: ContactPagination;
                contacts: Contact[];
            }>('api/master-data/general/contacts', {
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
                    this._contacts.next(response.contacts);
                })
            );
    }

    /**
     * Get stateProvince type by id
     */
    getContactById(id: string): Observable<Contact> {
        return this._contacts.pipe(
            take(1),
            map((contacts) => {
                // Find the contact
                const contact = contacts.find((item) => item.id === id) || null;

                // Update the contact
                this._contact.next(contact);

                // Return the contact
                return contact;
            }),
            switchMap((contact) => {
                if (!contact) {
                    return throwError(
                        'Could not find contact with id of ' + id + '!'
                    );
                }

                return of(contact);
            })
        );
    }

    /**
     * Create contact
     */
    createContact(): Observable<Contact> {
        return this._httpClient
            .post<Contact>('api/master-data/general/contact', {})
            .pipe(
                tap((newContact) => {
                    // Ensure newContact.id is defined
                    if (!newContact.id) {
                        console.error('Newly created contact lacks an ID');
                        return;
                    }
                    const currentContacts = this._contacts.getValue();
                    this._contacts.next([newContact, ...currentContacts]);
                })
            );
    }

    /**
     * Update contact
     *
     * @param id
     * @param contact
     */
    updateContact(id: string, contact: Contact): Observable<Contact> {
        console.log('Sending PATCH request:', { id, contact });

        return this._httpClient
            .patch<Contact>('api/master-data/general/contact', {
                id,
                contact,
            })
            .pipe(
                tap((updatedContact) => {
                    console.log('PATCH response received:', updatedContact);

                    // Update the _contacts BehaviorSubject with the updated contact
                    const currentContacts = this._contacts.getValue(); // Get the current contacts
                    const index = currentContacts.findIndex(
                        (ct) => ct.id === id
                    ); // Find the index of the updated contact

                    if (index !== -1) {
                        currentContacts[index] = updatedContact; // Update the contact in the list
                        this._contacts.next(currentContacts); // Emit the updated list
                    }
                })
            );
    }

    /**
     * Delete the contact
     *
     * @param id
     */
    deleteContact(id: string): Observable<boolean> {
        console.log('Attempting to delete contact with ID:', id);
        return this.contacts$.pipe(
            take(1),
            switchMap((contacts) =>
                this._httpClient
                    .delete('api/master-data/general/contact', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted contact
                            const index = contacts.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the contact
                            contacts.splice(index, 1);

                            // Update the contacts
                            this._contacts.next(contacts);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
