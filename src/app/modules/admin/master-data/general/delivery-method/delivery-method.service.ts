import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { 
    DeliveryMethod, 
    DeliveryMethodPagination, 
} from 'app/modules/admin/master-data/general/delivery-method/delivery-method.types';
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
export class DeliveryMethodService {
    // Private
    private _pagination: BehaviorSubject<DeliveryMethodPagination | null> =
        new BehaviorSubject(null);
    private _deliveryMethod: BehaviorSubject<DeliveryMethod | null> = new BehaviorSubject(
        null
    );
    private _deliveryMethods: BehaviorSubject<DeliveryMethod[] | null> =
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
    get pagination$(): Observable<DeliveryMethodPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for deliveryMethod
     */
    get deliveryMethod$(): Observable<DeliveryMethod> {
        return this._deliveryMethod.asObservable();
    }

    /**
     * Getter for deliveryMethods
     */
    get deliveryMethods$(): Observable<DeliveryMethod[]> {
        return this._deliveryMethods.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get delivery methods
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getDeliveryMethods(
        page: number = 0,
        size: number = 10,
        sort: string = 'deliveryMethodName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: DeliveryMethodPagination;
        deliveryMethods: DeliveryMethod[];
    }> {
        return this._httpClient
            .get<{
                pagination: DeliveryMethodPagination;
                deliveryMethods: DeliveryMethod[];
            }>('api/master-data/general/delivery-methods', {
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
                    this._deliveryMethods.next(response.deliveryMethods);
                })
            );
    }

    /**
     * Get delivery method by id
     */
    getDeliveryMethodById(id: string): Observable<DeliveryMethod> {
        return this._deliveryMethods.pipe(
            take(1),
            map((deliveryMethods) => {
                // Find the delivery method
                const deliveryMethod =
                    deliveryMethods.find((item) => item.id === id) || null;

                // Update the delivery method
                this._deliveryMethod.next(deliveryMethod);

                // Return the delivery method
                return deliveryMethod;
            }),
            switchMap((deliveryMethod) => {
                if (!deliveryMethod) {
                    return throwError(
                        'Could not found delivery method with id of ' + id + '!'
                    );
                }

                return of(deliveryMethod);
            })
        );
    }

    /**
     * Create delivery method
     */
    createDeliveryMethod(): Observable<DeliveryMethod> {
        return this._httpClient
            .post<DeliveryMethod>('api/master-data/general/delivery-method', {})
            .pipe(
                tap((newDeliveryMethod) => {
                    // Ensure newDeliveryMethod.id is defined
                    if (!newDeliveryMethod.id) {
                        console.error('Newly created delivery method lacks an ID');
                        return;
                    }
                    const currentDeliveryMethods = this._deliveryMethods.getValue();
                    this._deliveryMethods.next([newDeliveryMethod, ...currentDeliveryMethods]);
                })
            );
    }

    /**
     * Update delivery method
     *
     * @param id
     * @param deliveryMethod
     */
    updateDeliveryMethod(id: string, deliveryMethod: DeliveryMethod): Observable<DeliveryMethod> {
        console.log('Sending PATCH request:', { id, deliveryMethod });
      
        return this._httpClient.patch<DeliveryMethod>(
          'api/master-data/general/delivery-method', 
          { id, deliveryMethod }
        ).pipe(
          tap((updatedDeliveryMethod) => {
            console.log('PATCH response received:', updatedDeliveryMethod);
      
            // Update the _deliveryMethods BehaviorSubject with the updated delivery method
            const currentDeliveryMethods = this._deliveryMethods.getValue(); // Get the current delivery methods
            const index = currentDeliveryMethods.findIndex((dm) => dm.id === id); // Find the index of the updated delivery method
      
            if (index !== -1) {
              currentDeliveryMethods[index] = updatedDeliveryMethod; // Update the delivery method in the list
              this._deliveryMethods.next(currentDeliveryMethods); // Emit the updated list
            }
          })
        );
    }
      
    /**
     * Delete the delivery method
     *
     * @param id
     */
    deleteDeliveryMethod(id: string): Observable<boolean> {
        console.log('Attempting to delete delivery method with ID:', id);
        return this.deliveryMethods$.pipe(
            take(1),
            switchMap((deliveryMethods) =>
                this._httpClient
                    .delete('api/master-data/general/delivery-method', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted delivery method
                            const index = deliveryMethods.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the delivery method
                            deliveryMethods.splice(index, 1);

                            // Update the delivery methods
                            this._deliveryMethods.next(deliveryMethods);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
