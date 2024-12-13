import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { phoneNumberTypes as phoneNumberTypesData } from 'app/mock-api/master-data/general/phone-number-type/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralPhoneNumberTypeMockApi {
    private _phoneNumberTypes: any[] = phoneNumberTypesData;

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
            .onGet('api/master-data/general/phone-number-types', 300)
            .reply(({ request }) => {
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                let phoneNumberTypes: any[] | null = cloneDeep(this._phoneNumberTypes);

                // Sort the phone types
                if (sort === 'name' || sort === 'modifiedDate') {
                    phoneNumberTypes.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    phoneNumberTypes.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists, filter the results
                if (search) {
                    phoneNumberTypes = phoneNumberTypes.filter(
                        (phoneNumberType) =>
                            phoneNumberType.name &&
                            phoneNumberType.name.toLowerCase().includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const phoneNumberTypesLength = phoneNumberTypes.length;
                const begin = page * size;
                const end = Math.min(size * (page + 1), phoneNumberTypesLength);
                const lastPage = Math.max(Math.ceil(phoneNumberTypesLength / size), 1);

                let pagination = {};

                if (page > lastPage) {
                    phoneNumberTypes = null;
                    pagination = { lastPage };
                } else {
                    phoneNumberTypes = phoneNumberTypes.slice(begin, end);
                    pagination = {
                        length: phoneNumberTypesLength,
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
                        phoneNumberTypes,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Phone Type - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/phone-number-type')
            .reply(({ request }) => {
                const id = request.params.get('id');
                const phoneNumberTypes = cloneDeep(this._phoneNumberTypes);
                const phoneNumberType = phoneNumberTypes.find((item) => item.id === id);
                return [200, phoneNumberType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Phone Type - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/phone-number-type')
            .reply(() => {
                const newPhnoType = {
                    id: FuseMockApiUtils.guid(),
                    name: 'New Entry',
                    modifiedDate: '',
                };

                this._phoneNumberTypes.unshift(newPhnoType);
                return [200, newPhnoType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Phone Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/phone-number-type')
            .reply(({ request }) => {
                const id = request.body.id;
                const phoneNumberType = cloneDeep(request.body.phoneNumberType);
                let updatedPhoneNumberType = null;

                this._phoneNumberTypes.forEach((item, index, phoneNumberTypes) => {
                    if (item.id === id) {
                        phoneNumberTypes[index] = assign({}, phoneNumberTypes[index], phoneNumberType);
                        updatedPhoneNumberType = phoneNumberTypes[index];
                    }
                });

                return [200, updatedPhoneNumberType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Phone Type - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
        .onDelete('api/master-data/general/phone-number-type')
        .reply(({ request }) => {
            // Get the id
            const id = request.params.get('id');

            // Find the language and delete it
            this._phoneNumberTypes.forEach((item, index) => {
                if (item.id === id) {
                    this._phoneNumberTypes.splice(index, 1);
                }
            });

            // Return the response
            return [200, true];
        });
    }
}
