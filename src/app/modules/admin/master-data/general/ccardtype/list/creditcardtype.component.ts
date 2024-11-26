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
import { creditcardtypes } from 'app/mock-api/master-data/general/creditcardtype/data';
import { CreditCardTypeService } from 'app/modules/admin/master-data/general/ccardtype/creditcardtype.service';
import {
    CreditCardType,
    CreditCardTypePagination,
} from 'app/modules/admin/master-data/general/ccardtype/creditcardtype.types';
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';
import { CreditCardTypeComponent } from '../creditcardtype.component';

@Component({
    selector: 'creditcardtype-list',
    templateUrl: './creditcardtype.component.html',
    styles: [
        /* language=SCSS */
        `
            .creditcardtype-grid {
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
export class CreditCardTypeListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    creditcardtypes$: Observable<CreditCardTypeComponent[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CreditCardTypePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCreditCardType: CreditCardType | null = null;
    selectedCreditCardTypeForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _creditcardtypeService: CreditCardTypeService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected language form
        this.selectedCreditCardTypeForm = this._formBuilder.group({
            id: [''],
            name: ['', [Validators.required]],
            modifiedDate: [''],
        });

        // Get the pagination
        this._creditcardtypeService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CreditCardTypePagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the languages
        this.creditcardtypes$ = this._creditcardtypeService.creditcardtypes$;
        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._creditcardtypeService.getCreditCardTypes(
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
                id: 'name',
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

            // Get languages if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._creditcardtypeService.getCreditCardTypes(
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
     * Toggle language details
     *
     * @param creditcardtypeId
     */
    toggleDetails(creditcardtypeId: string): void {
        // If the language is already selected...
        if (this.selectedCreditCardType && this.selectedCreditCardType.id === creditcardtypeId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the language by id
        this._creditcardtypeService
            .getCreditCardTypeById(creditcardtypeId)
            .subscribe((creditcardtype) => {
                // Set the selected language
                this.selectedCreditCardType = creditcardtype;

                // Fill the form
                this.selectedCreditCardTypeForm.patchValue(creditcardtype);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCreditCardType = null;
    }

    /**
     * Cycle through images of selected language
     */
    cycleImages(forward: boolean = true): void {
        // Get the image count and current image index
        const count = this.selectedCreditCardTypeForm.get('images').value.length;
        const currentIndex =
            this.selectedCreditCardTypeForm.get('currentImageIndex').value;

        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

        // If cycling forward...
        if (forward) {
            this.selectedCreditCardTypeForm
                .get('currentImageIndex')
                .setValue(nextIndex);
        }
        // If cycling backwards...
        else {
            this.selectedCreditCardTypeForm
                .get('currentImageIndex')
                .setValue(prevIndex);
        }
    }

    /**
     * Create language
     */
    createCreditCardType(): void {
        console.log('here');

        // Create the language
        this._creditcardtypeService.createCreditCardType().subscribe((newCreditCardType) => {
            // Go to new language
            this.selectedCreditCardType = newCreditCardType;

            // Fill the form
            this.selectedCreditCardTypeForm.patchValue(newCreditCardType);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected language using the form data
     */
    updateSelectedCreditCardType(): void {
        // Get the language object
        const creditcardtype = this.selectedCreditCardTypeForm.getRawValue();
        console.log('Before sending to API:', creditcardtype);
        // Remove the currentImageIndex field
        delete creditcardtype.currentImageIndex;
        console.log('After removing currentImageIndex:', creditcardtype);

        // Update the language on the server
        this._creditcardtypeService
            .updateCreditCardType(creditcardtype.id, creditcardtype)
            .subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            });
    }

    /**
     * Delete the selected language using the form data
     */
    deleteSelectedCreditCardType(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Credit Card Type',
            message:
                'Are you sure you want to remove this credit card type? This action cannot be undone!',
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
                // Get the language object
                const creditcardtype = this.selectedCreditCardTypeForm.getRawValue();

                // Delete the language on the server
                this._creditcardtypeService
                    .deleteCreditCardType(creditcardtype.id)
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
