import { AsyncPipe, CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
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
import { CurrencyRateService } from 'app/modules/admin/master-data/general/currency-rate/currency-rate.service';
import {
    CurrencyRate,
    CurrencyRatePagination,
} from 'app/modules/admin/master-data/general/currency-rate/currency-rate.types';
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CurrencyService } from '../../currency/currency.service';
import { Currency } from '../../currency/currency.types';
@Component({
    selector: 'currency-rate-list',
    templateUrl: './currency-rate.component.html',
    styles: [
        /* language=SCSS */
        `
            .currency-rate-grid {
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
        CommonModule,
    ],
})
export class CurrencyRateListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    currencyRates$: Observable<CurrencyRate[]>;
    currencies: Currency[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CurrencyRatePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCurrencyRate: CurrencyRate | null = null;
    selectedCurrencyRateForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _currencyRateService: CurrencyRateService,
        private _currencyService: CurrencyService,
    ) {}

    ngOnInit(): void {
        this.selectedCurrencyRateForm = this._formBuilder.group({
            currency: [''], //declare currency form control here
            currencyRateDate: [''],
            fromCurrencyID: ['', [Validators.required]],
            toCurrencyID: ['', [Validators.required]],
            averageRate: ['', [Validators.required]],
            endOfDayRate: ['', [Validators.required]],
            modifiedDate: [''],
        });

        this._currencyService.currencies$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((currencies:Currency[]) => {
                this.currencies = currencies; 
                this._changeDetectorRef.markForCheck();
            })

        this._currencyRateService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CurrencyRatePagination) => {
                this.pagination = pagination;
                this._changeDetectorRef.markForCheck();
            });

        this.currencyRates$ = this._currencyRateService.currencyRates$;

        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._currencyRateService.getCurrencyRates(
                        0,
                        10,
                        'effectiveDate',
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
                id: 'effectiveDate',
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
                        return this._currencyRateService.getCurrencyRates(
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

    toggleDetails(currencyRateId: string): void {
        if (this.selectedCurrencyRate && this.selectedCurrencyRate.id === currencyRateId) {
            this.closeDetails();
            return;
        }

        this._currencyRateService
            .getCurrencyRateById(currencyRateId)
            .subscribe((currencyRate) => {
                this.selectedCurrencyRate = currencyRate;
                this.selectedCurrencyRateForm.patchValue(currencyRate);
                this._changeDetectorRef.markForCheck();
            });
    }

    closeDetails(): void {
        this.selectedCurrencyRate = null;
    }

    createCurrencyRate(): void {
        this._currencyRateService.createCurrencyRate().subscribe((newCurrencyRate) => {
            this.selectedCurrencyRate = newCurrencyRate;
            this.selectedCurrencyRateForm.patchValue(newCurrencyRate);
            this._changeDetectorRef.markForCheck();
        });
    }

    updateSelectedCurrencyRate(): void {
        const currencyRate = this.selectedCurrencyRateForm.getRawValue();
        const id = this.selectedCurrencyRate?.id;

        if (!id) {
            console.error('Update failed: No ID found for the selected currency rate.');
            return;
        }

        this._currencyRateService.updateCurrencyRate(id, currencyRate).subscribe({
            next: (response) => {
                this.showFlashMessage('success');
            },
            error: (err) => {
                this.showFlashMessage('error');
            },
        });
    }

    deleteSelectedCurrencyRate(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete currency rate',
            message: 'Are you sure you want to remove this currency rate? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const id = this.selectedCurrencyRate?.id;

                if (!id) {
                    console.error('Delete failed: No ID found for the selected currency rate.');
                    return;
                }

                this._currencyRateService.deleteCurrencyRate(id).subscribe({
                    next: () => {
                        this.closeDetails();
                        this._currencyRateService.getCurrencyRates().subscribe();
                    },
                    error: (err) => {
                        console.error('Delete failed:', err);
                    },
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

    trackByFn(index: number, item: CurrencyRate): string {
        return item.id || index.toString();
    }
}