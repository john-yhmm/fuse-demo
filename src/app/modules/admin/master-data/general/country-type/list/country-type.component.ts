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
import { CountryTypeService } from 'app/modules/admin/master-data/general/country-type/country-type.service'; // Modify import path accordingly
import {
    CountryType,
    CountryTypePagination,
} from 'app/modules/admin/master-data/general/country-type/country-type.types'; // Modify import path accordingly
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
    selector: 'country-type-list', // Update the selector to reflect country-type
    templateUrl: './country-type.component.html', // Modify the template path if needed
    styles: [
        /* language=SCSS */
        `
            .country-type-grid {
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
export class CountryTypeListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    countryTypes$: Observable<CountryType[]>; // Updated to CountryType

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CountryTypePagination; // Updated to CountryTypePagination
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCountryType: CountryType | null = null; // Updated to CountryType
    selectedCountryTypeForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _countryTypeService: CountryTypeService // Updated to CountryTypeService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected country-type form
        this.selectedCountryTypeForm = this._formBuilder.group({
            countryTypeName: ['', [Validators.required]], // Updated to CountryType fields
            lastEditedBy: [''],
            lastEditedOn: [''],
        });

        // Get the pagination
        this._countryTypeService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CountryTypePagination) => { // Updated to CountryTypePagination
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the country types
        this.countryTypes$ = this._countryTypeService.countryTypes$; // Updated to countryTypes$

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._countryTypeService.getCountryTypes( // Updated to CountryTypeService methods
                        0,
                        10,
                        'countryTypeName',
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
                id: 'countryTypeName',
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

            // Get country types if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._countryTypeService.getCountryTypes( // Updated to CountryTypeService methods
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
     * Toggle country-type details
     *
     * @param countryTypeId
     */
    toggleDetails(countryTypeId: string): void {
        // If the country-type is already selected...
        if (this.selectedCountryType && this.selectedCountryType.id === countryTypeId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the country-type by id
        this._countryTypeService
            .getCountryTypeById(countryTypeId)
            .subscribe((countryType) => {
                // Set the selected country-type
                this.selectedCountryType = countryType;

                // Fill the form
                this.selectedCountryTypeForm.patchValue(countryType);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCountryType = null;
    }

    /**
     * Create country-type
     */
    createCountryType(): void {
        // Create the country-type
        this._countryTypeService.createCountryType().subscribe((newCountryType) => {
            // Go to new country-type
            this.selectedCountryType = newCountryType;

            // Fill the form
            this.selectedCountryTypeForm.patchValue(newCountryType);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected country-type using the form data
     */
    updateSelectedCountryType(): void {
        // Get the country-type object
        const countryType = this.selectedCountryTypeForm.getRawValue();
    
        // Ensure the ID is included
        const id = this.selectedCountryType?.id; // Extract ID from the selected object
    
        if (!id) {
            console.error('Update failed: No ID found for the selected country type.');
            return;
        }
    
        // Remove unnecessary fields
        delete countryType.currentImageIndex;
    
        console.log('Updating country type:', { id, ...countryType });
    
        // Update the country-type on the server
        this._countryTypeService.updateCountryType(id, countryType).subscribe({
            next: (response) => {
                console.log('Update successful:', response);
                // Show a success message
                this.showFlashMessage('success');
            },
            error: (err) => {
                console.error('Update failed:', err);
                this.showFlashMessage('error');
            },
        });
    }
    

    /**
     * Delete the selected country-type using the form data
     */
    deleteSelectedCountryType(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete country-type',
            message:
                'Are you sure you want to remove this country-type? This action cannot be undone!',
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
                // Get the country-type object
                const countryType = this.selectedCountryTypeForm.getRawValue();

                // Delete the country-type on the server
                this._countryTypeService
                    .deleteCountryType(countryType.id)
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
