import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { languages as languagesData } from 'app/mock-api/master-data/general/language/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralLanguageMockApi {
    private _languages: any[] = languagesData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Languages - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/languages', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the languages
                let languages: any[] | null = cloneDeep(this._languages);

                // Sort the languages
                if (
                    sort === 'languageCode' ||
                    sort === 'name' ||
                    sort === 'modifiedDate'
                ) {
                    languages.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    languages.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the languages
                    languages = languages.filter(
                        (language) =>
                            language.name &&
                            language.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const languagesLength = languages.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), languagesLength);
                const lastPage = Math.max(Math.ceil(languagesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // languages but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    languages = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    languages = languages.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: languagesLength,
                        size: size,
                        page: page,
                        lastPage: lastPage,
                        startIndex: begin,
                        endIndex: end - 1,
                    };
                }

                // Return the response
                return [
                    200,
                    {
                        languages,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/language')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the languages
                const languages = cloneDeep(this._languages);

                // Find the language
                const language = languages.find((item) => item.id === id);

                // Return the response
                return [200, language];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/language')
            .reply(() => {
                // Generate a new language
                const newLanguage = {
                    id: FuseMockApiUtils.guid(),
                    languageCode: '',
                    name: 'A New Language',
                    modifiedDate: '',
                };

                // Unshift the new language
                this._languages.unshift(newLanguage);

                // Return the response
                return [200, newLanguage];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/language')
            .reply(({ request }) => {
                // Get the id and language
                const id = request.body.id;
                const language = cloneDeep(request.body.language);

                // Prepare the updated language
                let updatedLanguage = null;

                // Find the language and update it
                this._languages.forEach((item, index, languages) => {
                    if (item.id === id) {
                        // Update the language
                        languages[index] = assign(
                            {},
                            languages[index],
                            language
                        );

                        // Store the updated language
                        updatedLanguage = languages[index];
                    }
                });

                // Return the response
                return [200, updatedLanguage];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/language')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the language and delete it
                this._languages.forEach((item, index) => {
                    if (item.id === id) {
                        this._languages.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
