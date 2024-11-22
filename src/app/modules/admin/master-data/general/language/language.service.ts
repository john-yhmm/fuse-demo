import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    Language,
    LanguagePagination,
} from 'app/modules/admin/master-data/general/language/language.types';
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
export class LanguageService {
    // Private
    private _pagination: BehaviorSubject<LanguagePagination | null> =
        new BehaviorSubject(null);
    private _language: BehaviorSubject<Language | null> = new BehaviorSubject(
        null
    );
    private _languages: BehaviorSubject<Language[] | null> =
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
    get pagination$(): Observable<LanguagePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for language
     */
    get language$(): Observable<Language> {
        return this._language.asObservable();
    }

    /**
     * Getter for languages
     */
    get languages$(): Observable<Language[]> {
        return this._languages.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get languages
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getLanguages(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: LanguagePagination;
        languages: Language[];
    }> {
        return this._httpClient
            .get<{
                pagination: LanguagePagination;
                languages: Language[];
            }>('api/master-data/general/languages', {
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
                    this._languages.next(response.languages);
                })
            );
    }

    /**
     * Get language by id
     */
    getLanguageById(id: string): Observable<Language> {
        return this._languages.pipe(
            take(1),
            map((languages) => {
                // Find the language
                const language =
                    languages.find((item) => item.id === id) || null;

                // Update the language
                this._language.next(language);

                // Return the language
                return language;
            }),
            switchMap((language) => {
                if (!language) {
                    return throwError(
                        'Could not found language with id of ' + id + '!'
                    );
                }

                return of(language);
            })
        );
    }

    /**
     * Create language
     */
    createLanguage(): Observable<Language> {
        return this.languages$.pipe(
            take(1),
            switchMap((languages) =>
                this._httpClient
                    .post<Language>('api/master-data/general/language', {})
                    .pipe(
                        map((newLanguage) => {
                            // Update the languages with the new language
                            this._languages.next([newLanguage, ...languages]);

                            // Return the new language
                            return newLanguage;
                        })
                    )
            )
        );
    }

    /**
     * Update language
     *
     * @param id
     * @param language
     */
    updateLanguage(id: string, language: Language): Observable<Language> {
        return this.languages$.pipe(
            take(1),
            switchMap((languages) =>
                this._httpClient
                    .patch<Language>('api/master-data/general/language', {
                        id,
                        language,
                    })
                    .pipe(
                        map((updatedLanguage) => {
                            // Find the index of the updated language
                            const index = languages.findIndex(
                                (item) => item.id === id
                            );

                            // Update the language
                            languages[index] = updatedLanguage;

                            // Update the languages
                            this._languages.next(languages);

                            // Return the updated language
                            return updatedLanguage;
                        }),
                        switchMap((updatedLanguage) =>
                            this.language$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the language if it's selected
                                    this._language.next(updatedLanguage);

                                    // Return the updated language
                                    return updatedLanguage;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the language
     *
     * @param id
     */
    deleteLanguage(id: string): Observable<boolean> {
        return this.languages$.pipe(
            take(1),
            switchMap((languages) =>
                this._httpClient
                    .delete('api/master-data/general/language', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted language
                            const index = languages.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the language
                            languages.splice(index, 1);

                            // Update the languages
                            this._languages.next(languages);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
