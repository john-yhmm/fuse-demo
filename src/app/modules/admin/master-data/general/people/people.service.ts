import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { People, PeoplePagination } from './people.types';
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
export class PeopleService {
    // Private
    private _pagination: BehaviorSubject<PeoplePagination | null> =
        new BehaviorSubject(null);
    private _people: BehaviorSubject<People | null> = new BehaviorSubject(
        null
    );
    private _peoples: BehaviorSubject<People[] | null> = new BehaviorSubject(
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
    get pagination$(): Observable<PeoplePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for people
     */
    get people$(): Observable<People> {
        return this._people.asObservable();
    }

    /**
     * Getter for peoples
     */
    get peoples$(): Observable<People[]> {
        return this._peoples.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get People
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getPeoples(
        page: number = 0,
        size: number = 10,
        sort: string = 'emailAddress',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: PeoplePagination;
        peoples: People[];
    }> {
        return this._httpClient
            .get<{
                pagination: PeoplePagination;
                peoples: People[];
            }>('api/master-data/general/peoples', {
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
                    this._peoples.next(response.peoples);
                })
            );
    }
    /**
     * Get people type by id
     */
    getPeopleById(id: string): Observable<People> {
        return this._peoples.pipe(
            take(1),
            map((peoples) => {
                // Find the people
                const people = peoples.find((item) => item.id === id) || null;

                // Update the people
                this._people.next(people);

                // Return the people
                return people;
            }),
            switchMap((people) => {
                if (!people) {
                    return throwError(
                        'Could not find people with id of ' + id + '!'
                    );
                }

                return of(people);
            })
        );
    }

    /**
     * Create people
     */
    createPeople(): Observable<People> {
        return this._httpClient
            .post<People>('api/master-data/general/people', {})
            .pipe(
                tap((newPeople) => {
                    // Ensure newPeople.id is defined
                    if (!newPeople.id) {
                        console.error('Newly created people lacks an ID');
                        return;
                    }
                    const currentPeoples = this._peoples.getValue();
                    this._peoples.next([newPeople, ...currentPeoples]);
                })
            );
    }

    /**
     * Update people
     *
     * @param id
     * @param people
     */
    updatePeople(id: string, people: People): Observable<People> {
        console.log('Sending PATCH request:', { id, people });

        return this._httpClient
            .patch<People>('api/master-data/general/people', {
                id,
                people,
            })
            .pipe(
                tap((updatedPeople) => {
                    console.log('PATCH response received:', updatedPeople);

                    // Update the _peoples BehaviorSubject with the updated people
                    const currentPeoples = this._peoples.getValue(); // Get the current peoples
                    const index = currentPeoples.findIndex(
                        (ct) => ct.id === id
                    ); // Find the index of the updated people

                    if (index !== -1) {
                        currentPeoples[index] = updatedPeople; // Update the people in the list
                        this._peoples.next(currentPeoples); // Emit the updated list
                    }
                })
            );
    }

    /**
     * Delete the people
     *
     * @param id
     */
    deletePeople(id: string): Observable<boolean> {
        console.log('Attempting to delete people with ID:', id);
        return this.peoples$.pipe(
            take(1),
            switchMap((peoples) =>
                this._httpClient
                    .delete('api/master-data/general/people', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted people
                            const index = peoples.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the people
                            peoples.splice(index, 1);

                            // Update the peoples
                            this._peoples.next(peoples);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }

}
