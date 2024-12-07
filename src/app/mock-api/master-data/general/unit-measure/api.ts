import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { unitMeasures as unitMeasuresData } from 'app/mock-api/master-data/general/unit-measure/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralUnitMeasureMockApi {
    private _unitMeasures: any[] = unitMeasuresData;

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
            .onGet('api/master-data/general/unit-measures', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'unitMeasureName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the languages
                let unitMeasures: any[] | null = cloneDeep(this._unitMeasures);

                // Sort the languages
                if (
                    sort === 'unitMeasureCode' ||
                    sort === 'unitMeasureName' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'
                ) {
                    unitMeasures.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    unitMeasures.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the languages
                    unitMeasures = unitMeasures.filter(
                        (unitMeasure) =>
                            unitMeasure.unitMeasureName &&
                            unitMeasure.unitMeasureName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const unitMeasuresLength = unitMeasures.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), unitMeasuresLength);
                const lastPage = Math.max(Math.ceil(unitMeasuresLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // languages but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    unitMeasures = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    unitMeasures = unitMeasures.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: unitMeasuresLength,
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
                        unitMeasures,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/unit-measure')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the languages
                const unitMeasures = cloneDeep(this._unitMeasures);

                // Find the language
                const unitMeasure = unitMeasures.find((item) => item.id === id);

                // Return the response
                return [200, unitMeasure];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/unit-measure')
            .reply(() => {
                // Generate a new language
                const newUnitMeasure = {
                    id: FuseMockApiUtils.guid(),
                    unitMeasureCode: '',
                    unitMeasureName: 'A New Unit Measure',
                    lastEditedBy: '',
                    lastEditedOn: ''
                };

                // Unshift the new language
                this._unitMeasures.unshift(newUnitMeasure);

                // Return the response
                return [200, newUnitMeasure];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/unit-measure')
            .reply(({ request }) => {
                // Get the id and language
                const id = request.body.id;
                const unitMeasure = cloneDeep(request.body.unitMeasure);

                // Prepare the updated language
                let updatedUnitMeasure = null;

                // Find the language and update it
                this._unitMeasures.forEach((item, index, unitMeasures) => {
                    if (item.id === id) {
                        // Update the language
                        unitMeasures[index] = assign(
                            {},
                            unitMeasures[index],
                            unitMeasure
                        );

                        // Store the updated language
                        updatedUnitMeasure = unitMeasures[index];
                    }
                });

                // Return the response
                return [200, updatedUnitMeasure];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/unit-measure')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the language and delete it
                this._unitMeasures.forEach((item, index) => {
                    if (item.id === id) {
                        this._unitMeasures.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
