import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    PaymentMethod,
    PaymentMethodPagination,
} from 'app/modules/admin/master-data/general/payment-method/payment-method.types';
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
export class PaymentMethodService {
    // Private
    private _pagination: BehaviorSubject<PaymentMethodPagination | null> =
        new BehaviorSubject(null);
    private _paymentMethod: BehaviorSubject<PaymentMethod | null> = new BehaviorSubject(
        null
    );
    private _paymentMethods: BehaviorSubject<PaymentMethod[] | null> =
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
    get pagination$(): Observable<PaymentMethodPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for paymentMethod
     */
    get paymentMethod$(): Observable<PaymentMethod> {
        return this._paymentMethod.asObservable();
    }

    /**
     * Getter for paymentMethods
     */
    get paymentMethods$(): Observable<PaymentMethod[]> {
        return this._paymentMethods.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get paymentMethods
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getPaymentMethods(
        page: number = 0,
        size: number = 10,
        sort: string = 'paymentMethodName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: PaymentMethodPagination;
        paymentMethods: PaymentMethod[];
    }> {
        return this._httpClient
            .get<{
                pagination: PaymentMethodPagination;
                paymentMethods: PaymentMethod[];
            }>('api/master-data/general/payment-methods', {
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
                    this._paymentMethods.next(response.paymentMethods);
                })
            );
    }

    /**
     * Get paymentMethod by id
     */
    getPaymentMethodById(id: string): Observable<PaymentMethod> {
        return this._paymentMethods.pipe(
            take(1),
            map((paymentMethods) => {
                // Find the paymentMethod
                const paymentMethod =
                    paymentMethods.find((item) => item.id === id) || null;

                // Update the paymentMethod
                this._paymentMethod.next(paymentMethod);

                // Return the paymentMethod
                return paymentMethod;
            }),
            switchMap((paymentMethod) => {
                if (!paymentMethod) {
                    return throwError(
                        'Could not found paymentMethod with id of ' + id + '!'
                    );
                }

                return of(paymentMethod);
            })
        );
    }

    /**
     * Create paymentMethod
     */
    createPaymentMethod(): Observable<PaymentMethod> {
        return this.paymentMethods$.pipe(
            take(1),
            switchMap((paymentMethods) =>
                this._httpClient
                    .post<PaymentMethod>('api/master-data/general/payment-method', {})
                    .pipe(
                        map((newPaymentMethod) => {
                            // Update the paymentMethods with the new paymentMethod
                            this._paymentMethods.next([newPaymentMethod, ...paymentMethods]);

                            // Return the new paymentMethod
                            return newPaymentMethod;
                        })
                    )
            )
        );
    }

    /**
     * Update paymentMethod
     *
     * @param id
     * @param paymentMethod
     */
    updatePaymentMethod(id: string, paymentMethod: PaymentMethod): Observable<PaymentMethod> {
        return this.paymentMethods$.pipe(
            take(1),
            switchMap((paymentMethods) =>
                this._httpClient
                    .patch<PaymentMethod>('api/master-data/general/payment-method', {
                        id,
                        paymentMethod,
                    })
                    .pipe(
                        map((updatedPaymentMethod) => {
                            // Find the index of the updated paymentMethod
                            const index = paymentMethods.findIndex(
                                (item) => item.id === id
                            );

                            // Update the paymentMethod
                            paymentMethods[index] = updatedPaymentMethod;

                            // Update the paymentMethods
                            this._paymentMethods.next(paymentMethods);

                            // Return the updated paymentMethod
                            return updatedPaymentMethod;
                        }),
                        switchMap((updatedPaymentMethod) =>
                            this.paymentMethod$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the paymentMethod if it's selected
                                    this._paymentMethod.next(updatedPaymentMethod);

                                    // Return the updated paymentMethod
                                    return updatedPaymentMethod;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the paymentMethod
     *
     * @param id
     */
    deletePaymentMethod(id: string): Observable<boolean> {
        return this.paymentMethods$.pipe(
            take(1),
            switchMap((paymentMethods) =>
                this._httpClient
                    .delete('api/master-data/general/payment-method', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted paymentMethod
                            const index = paymentMethods.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the paymentMethod
                            paymentMethods.splice(index, 1);

                            // Update the paymentMethods
                            this._paymentMethods.next(paymentMethods);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
