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
import { CountryService } from 'app/modules/admin/master-data/general/country/country.service';
import {
    Country,
    CountryPagination,
} from 'app/modules/admin/master-data/general/country/country.types';
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';
import { CountryTypeService } from '../../country-type/country-type.service';
import { query } from 'express';
import { CountryType } from '../../country-type/country-type.types';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'country-list', 
    templateUrl: './country.component.html', 
    styles: [
        /* language=SCSS */
        `
            .country-grid {
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
export class CountryListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    countrys$: Observable<Country[]>; 
    countryTypes: CountryType[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CountryPagination; 
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCountry: Country | null = null; 
    selectedCountryForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _countryService: CountryService,
        private _countryTypeService: CountryTypeService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected country-type form
        this.selectedCountryForm = this._formBuilder.group({
            countryName: ['', [Validators.required]], 
            formalName: ['', [Validators.required]], 
            isoAlpha3Code: ['', [Validators.required]], 
            isoNumericCode: ['', [Validators.required]], 
            countryTypeID: ['', [Validators.required]], 
            latestRecordedPopulation: ['', [Validators.required]], 
            continent: ['', [Validators.required]], 
            region: ['', [Validators.required]], 
            subregion: ['', [Validators.required]], 
            border: ['', [Validators.required]], 
            lastEditedBy: [''], 
            lastEditedOn: [''], 
            validFrom: [''], 
            validTo: [''], 
        });

        this._countryTypeService.countryTypes$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((countryTypes:CountryType[]) => {
                this.countryTypes = countryTypes; 
                this._changeDetectorRef.markForCheck();
            })

        // Get the pagination
        this._countryService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CountryPagination) => { 
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the country 
        this.countrys$ = this._countryService.countrys$; 

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._countryService.getCountrys( 
                        0,
                        10,
                        'countryName',
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
                id: 'countryName',
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
                        return this._countryService.getCountrys( 
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
     * @param countryId
     */
    toggleDetails(countryId: string): void {
        // If the country-type is already selected...
        if (this.selectedCountry && this.selectedCountry.id === countryId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the country-type by id
        this._countryService
            .getCountryById(countryId)
            .subscribe((country) => {
                // Set the selected country-type
                this.selectedCountry = country;

                // Fill the form
                this.selectedCountryForm.patchValue(country);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCountry = null;
    }

    /**
     * Create country-type
     */
    createCountry(): void {
        // Create the country-type
        this._countryService.createCountry().subscribe((newCountry) => {
            // Go to new country-type
            this.selectedCountry = newCountry;

            // Fill the form
            this.selectedCountryForm.patchValue(newCountry);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected country-type using the form data
     */
    updateSelectedCountry(): void {
        // Get the country-type object
        const country = this.selectedCountryForm.getRawValue();
    
        // Ensure the ID is included
        const id = this.selectedCountry?.id; // Extract ID from the selected object
    
        if (!id) {
            console.error('Update failed: No ID found for the selected country.');
            return;
        }

        // Update the country on the server
        this._countryService.updateCountry(id, country).subscribe({
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
     * Delete the selected country using the form data
     */
    deleteSelectedCountry(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete country',
            message: 'Are you sure you want to remove this country? This action cannot be undone!',
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
                // Use the selectedCountryType's ID directly
                const id = this.selectedCountry?.id;
    
                if (!id) {
                    console.error('Delete failed: No ID found for the selected country.');
                    return;
                }
    
                console.log('Attempting to delete country with ID:', id);
    
                // Delete the country-type on the server
                this._countryService.deleteCountry(id).subscribe({
                    next: () => {
                        // Close the details
                        this.closeDetails();
    
                        // Optionally reload or refresh the list
                        this._countryService.getCountrys().subscribe();
                    },
                    error: (err) => {
                        console.error('Delete failed:', err);
                    },
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
    trackByFn(index: number, item: Country): string {
        return item.id || index.toString(); // Use index as fallback if id is undefined
    }
}
