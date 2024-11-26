import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { phnoTypes as phnoTypesData } from 'app/mock-api/master-data/general/phno-type/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralPhnoTypeMockApi {
    private _phnoTypes: any[] = phnoTypesData;

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
        // @ Phone Types - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/phno-types', 300)
            .reply(({ request }) => {
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                let phnoTypes: any[] | null = cloneDeep(this._phnoTypes);

                // Sort the phone types
                if (sort === 'name' || sort === 'modifiedDate') {
                    phnoTypes.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    phnoTypes.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists, filter the results
                if (search) {
                    phnoTypes = phnoTypes.filter(
                        (phnoType) =>
                            phnoType.name &&
                            phnoType.name.toLowerCase().includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const phnoTypesLength = phnoTypes.length;
                const begin = page * size;
                const end = Math.min(size * (page + 1), phnoTypesLength);
                const lastPage = Math.max(Math.ceil(phnoTypesLength / size), 1);

                let pagination = {};

                if (page > lastPage) {
                    phnoTypes = null;
                    pagination = { lastPage };
                } else {
                    phnoTypes = phnoTypes.slice(begin, end);
                    pagination = {
                        length: phnoTypesLength,
                        size: size,
                        page: page,
                        lastPage: lastPage,
                        startIndex: begin,
                        endIndex: end - 1,
                    };
                }

                return [
                    200,
                    {
                        phnoTypes,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Phone Type - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/phno-type')
            .reply(({ request }) => {
                const id = request.params.get('id');
                const phnoTypes = cloneDeep(this._phnoTypes);
                const phnoType = phnoTypes.find((item) => item.id === id);
                return [200, phnoType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Phone Type - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/phno-type')
            .reply(() => {
                const newPhnoType = {
                    id: FuseMockApiUtils.guid(),
                    name: 'New Entry',
                    modifiedDate: '',
                };

                this._phnoTypes.unshift(newPhnoType);
                return [200, newPhnoType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Phone Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/phno-type')
            .reply(({ request }) => {
                const id = request.body.id;
                const phnoType = cloneDeep(request.body.phnoType);
                let updatedPhnoType = null;

                this._phnoTypes.forEach((item, index, phnoTypes) => {
                    if (item.id === id) {
                        phnoTypes[index] = assign({}, phnoTypes[index], phnoType);
                        updatedPhnoType = phnoTypes[index];
                    }
                });

                return [200, updatedPhnoType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Phone Type - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
        .onDelete('api/master-data/general/phno-type')
        .reply(({ request }) => {
            // Get the id
            const id = request.params.get('id');

            // Find the language and delete it
            this._phnoTypes.forEach((item, index) => {
                if (item.id === id) {
                    this._phnoTypes.splice(index, 1);
                }
            });

            // Return the response
            return [200, true];
        });
    }
}
