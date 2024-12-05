import { AsyncPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { PaymentAvenueService } from 'app/modules/admin/master-data/general/payment-avenue/payment-avenue.service';
import { PaymentAvenue, PaymentAvenuePagination } from 'app/modules/admin/master-data/general/payment-avenue/payment-avenue.types';
import { Observable, Subject, debounceTime, map, merge, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'payment-avenue-list',
    templateUrl: './payment-avenue.component.html',
    styles: [
        /* language=SCSS */
        `
            .payment-avenue-grid {
                grid-template-columns: 48px auto 40px;

                @screen sm {
                    grid-template-columns: 48px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 48px 112px auto 112px 72px;
                }

                @screen lg {
                    grid-template-columns: 48px 112px auto 112px 96px 96px 72px;
                }
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        MatProgressBarModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatSortModule,
        NgTemplateOutlet,
        MatPaginatorModule,
        NgClass,
        MatSlideToggleModule,
        MatSelectModule,
        MatOptionModule,
        MatCheckboxModule,
        MatRippleModule,
        AsyncPipe,
    ],
})
export class PaymentAvenueListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    paymentAvenues$: Observable<PaymentAvenue[]>;
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: PaymentAvenuePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedPaymentAvenue: PaymentAvenue | null = null;
    selectedPaymentAvenueForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _paymentAvenueService: PaymentAvenueService
    ) {}

    ngOnInit(): void {
        // Create the selected payment avenue form
        this.selectedPaymentAvenueForm = this._formBuilder.group({
            id: [''],
            name: ['', [Validators.required]],
            modifiedDate: [''],
        });

        // Get the pagination
        this._paymentAvenueService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: PaymentAvenuePagination) => {
                this.pagination = pagination;
                this._changeDetectorRef.markForCheck();
            });

        // Get the payment avenues
        this.paymentAvenues$ = this._paymentAvenueService.paymentAvenues$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._paymentAvenueService.getPaymentAvenues(
                        0,
                        10,
                        'name',
                        'asc',
                        query
                    );
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();
    }

    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            this._sort.sort({
                id: 'name',
                start: 'asc',
                disableClear: true,
            });

            this._changeDetectorRef.markForCheck();

            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    this._paginator.pageIndex = 0;
                    this.closeDetails();
                });

            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._paymentAvenueService.getPaymentAvenues(
                            this._paginator.pageIndex,
                            this._paginator.pageSize,
                            this._sort.active,
                            this._sort.direction
                        );
                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                )
                .subscribe();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggleDetails(paymentAvenueId: string): void {
        if (this.selectedPaymentAvenue && this.selectedPaymentAvenue.id === paymentAvenueId) {
            this.closeDetails();
            return;
        }

        this._paymentAvenueService
            .getPaymentAvenueById(paymentAvenueId)
            .subscribe((paymentAvenue) => {
                this.selectedPaymentAvenue = paymentAvenue;
                this.selectedPaymentAvenueForm.patchValue(paymentAvenue);
                this._changeDetectorRef.markForCheck();
            });
    }

    closeDetails(): void {
        this.selectedPaymentAvenue = null;
    }

    createPaymentAvenue(): void {
        this._paymentAvenueService.createPaymentAvenue().subscribe((newPaymentAvenue) => {
            this.selectedPaymentAvenue = newPaymentAvenue;
            this.selectedPaymentAvenueForm.patchValue(newPaymentAvenue);
            this._changeDetectorRef.markForCheck();
        });
    }

    updateSelectedPaymentAvenue(): void {
        const paymentAvenue = this.selectedPaymentAvenueForm.getRawValue();
        this._paymentAvenueService
            .updatePaymentAvenue(paymentAvenue.id, paymentAvenue)
            .subscribe(() => {
                this.showFlashMessage('success');
            });
    }

    deleteSelectedPaymentAvenue(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Payment Avenue',
            message: 'Are you sure you want to delete this Payment Avenue?',
            actions: {
                confirm: { label: 'Delete' },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const paymentAvenue = this.selectedPaymentAvenueForm.getRawValue();
                this._paymentAvenueService.deletePaymentAvenue(paymentAvenue.id).subscribe(() => {
                    this.closeDetails();
                });
            }
        });
    }

    showFlashMessage(type: 'success' | 'error'): void {
        this.flashMessage = type;
        this._changeDetectorRef.markForCheck();
        setTimeout(() => {
            this.flashMessage = null;
            this._changeDetectorRef.markForCheck();
        }, 3000);
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}