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
import { CurrencyService } from 'app/modules/admin/master-data/general/currency/currency.service';
import {
    Currency,
    CurrencyPagination,
} from 'app/modules/admin/master-data/general/currency/currency.types';
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';


@Component({
    selector: 'currency-list',
    templateUrl: './currency.component.html',
    styles: [
        /* language=SCSS */
        `
            .currency-grid {
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
export class CurrencyListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;


    currencies$: Observable<Currency[]>;


    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CurrencyPagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCurrency: Currency | null = null;
    selectedCurrencyForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();


    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _currencyService: CurrencyService
    ) {}


    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------


    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected currency form
        this.selectedCurrencyForm = this._formBuilder.group({
            id: [''],
            currencyCode: [''],
            currencyName: ['', [Validators.required]],
            symbol: ['', [Validators.required]],
            modifiedDate: [''],
        });


        // Get the pagination
        this._currencyService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CurrencyPagination) => {
                // Update the pagination
                this.pagination = pagination;


                // Mark for check
                this._changeDetectorRef.markForCheck();
            });


        // Get the currencies
        this.currencies$ = this._currencyService.currencies$;


        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._currencyService.getCurrencies(
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


    /**
     * After view init
     */
    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            // Set the initial sort
            this._sort.sort({
                id: 'currencyName',
                start: 'asc',
                disableClear: true,
            });


            // Mark for check
            this._changeDetectorRef.markForCheck();


            // If the user changes the sort order...
            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page
                    this._paginator.pageIndex = 0;


                    // Close the details
                    this.closeDetails();
                });


            // Get currencies if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._currencyService.getCurrencies(
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


    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    /**
     * Toggle currency details
     *
     * @param currencyId
     */
    toggleDetails(currencyId: string): void {
        // If the currency is already selected...
        if (this.selectedCurrency && this.selectedCurrency.id === currencyId) {
            // Close the details
            this.closeDetails();
            return;
        }


        // Get the currency by id
        this._currencyService
            .getCurrencyById(currencyId)
            .subscribe((currency) => {
                // Set the selected currency
                this.selectedCurrency = currency;


                // Fill the form
                this.selectedCurrencyForm.patchValue(currency);


                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }


    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCurrency = null;
    }


    /**
     * Cycle through images of selected currency
     */
    cycleImages(forward: boolean = true): void {
        // Get the image count and current image index
        const count = this.selectedCurrencyForm.get('images').value.length;
        const currentIndex =
            this.selectedCurrencyForm.get('currentImageIndex').value;


        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;


        // If cycling forward...
        if (forward) {
            this.selectedCurrencyForm
                .get('currentImageIndex')
                .setValue(nextIndex);
        }
        // If cycling backwards...
        else {
            this.selectedCurrencyForm
                .get('currentImageIndex')
                .setValue(prevIndex);
        }
    }


    /**
     * Create currency
     */
    createCurrency(): void {
        console.log('here');


        // Create the currency
        this._currencyService.createCurrency().subscribe((newCurrency) => {
            // Go to new currency
            this.selectedCurrency = newCurrency;


            // Fill the form
            this.selectedCurrencyForm.patchValue(newCurrency);


            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }


    /**
     * Update the selected currency using the form data
     */
    updateSelectedCurrency(): void {
        // Get the currency object
        const currency = this.selectedCurrencyForm.getRawValue();


        // Remove the currentImageIndex field
        delete currency.currentImageIndex;


        // Update the currency on the server
        this._currencyService
            .updateCurrencyType(currency.id, currency)
            .subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            });
    }


    /**
     * Delete the selected currency using the form data
     */
    deleteSelectedCurrency(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete currency',
            message:
                'Are you sure you want to remove this currency? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });


        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                // Get the currency object
                const currency = this.selectedCurrencyForm.getRawValue();


                // Delete the currency on the server
                this._currencyService
                    .deleteCurrency(currency.id)
                    .subscribe(() => {
                        // Close the details
                        this.closeDetails();
                    });
            }
        });
    }


    /**
     * Show flash message
     */
    showFlashMessage(type: 'success' | 'error'): void {
        // Show the message
        this.flashMessage = type;


        // Mark for check
        this._changeDetectorRef.markForCheck();


        // Hide it after 3 seconds
        setTimeout(() => {
            this.flashMessage = null;


            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, 3000);
    }


    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}



