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
import { CityService } from 'app/modules/admin/master-data/general/city/city.service';
import {
    City,
    CityPagination,
} from 'app/modules/admin/master-data/general/city/city.types';
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';
import { StateProvinceService } from '../../state-province/state-province.service';
import { query } from 'express';
import { StateProvince } from '../../state-province/state-province.types';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'city-list', 
    templateUrl: './city.component.html', 
    styles: [
        /* language=SCSS */
        `
            .city-grid {
                grid-template-columns: 90px auto 40px;

                @screen sm {
                    grid-template-columns: 90px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 90px 112px auto 112px 72px;
                }

                @screen lg {
                    grid-template-columns: 90px 112px auto 112px 96px 96px 72px;
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
export class CityListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    cities$: Observable<City[]>; 
    stateProvinces: StateProvince[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CityPagination; 
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCity: City | null = null; 
    selectedCityForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _cityService: CityService,
        private _stateProvinceService: StateProvinceService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected state-province-type form
        this.selectedCityForm = this._formBuilder.group({
            cityName: ['', [Validators.required]], 
            stateProvinceId: [''], 
            location: ['', [Validators.required]],
            latestRecordedPopulation: ['', [Validators.required]],
            lastEditedBy: [''], 
            validFrom: [''], 
            validTo: [''], 
        });

        this._stateProvinceService.stateProvinces$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((stateProvinces:StateProvince[]) => {
                this.stateProvinces = stateProvinces; 
                this._changeDetectorRef.markForCheck();
            })

        // Get the pagination
        this._cityService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CityPagination) => { 
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the state-province 
        this.cities$ = this._cityService.cities$; 

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._cityService.getCities( 
                        0,
                        10,
                        'cityName',
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
                id: 'cityName',
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

            // Get state-province types if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._cityService.getCities( 
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
     * Toggle state-province-type details
     *
     * @param cityId
     */
    toggleDetails(cityId: string): void {
        // If the state-province-type is already selected...
        if (this.selectedCity && this.selectedCity.id === cityId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the state-province-type by id
        this._cityService
            .getCityById(cityId)
            .subscribe((city) => {
                // Set the selected state-province-type
                this.selectedCity = city;

                // Fill the form
                this.selectedCityForm.patchValue(city);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCity = null;
    }

    /**
     * Create state-province-type
     */
    createCity(): void {
        // Create the state-province-type
        this._cityService.createCity().subscribe((newCity) => {
            // Go to new state-province-type
            this.selectedCity = newCity;

            // Fill the form
            this.selectedCityForm.patchValue(newCity);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected state-province-type using the form data
     */
    updateSelectedCity(): void {
        // Get the state-province-type object
        const city = this.selectedCityForm.getRawValue();
    
        // Ensure the ID is included
        const id = this.selectedCity?.id; // Extract ID from the selected object
    
        if (!id) {
            console.error('Update failed: No ID found for the selected state-province.');
            return;
        }

        // Update the state-province on the server
        this._cityService.updateCity(id, city).subscribe({
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
     * Delete the selected state-province using the form data
     */
    deleteSelectedCity(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete state province',
            message: 'Are you sure you want to remove this state province? This action cannot be undone!',
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
                // Use the selectedCityType's ID directly
                const id = this.selectedCity?.id;
    
                if (!id) {
                    console.error('Delete failed: No ID found for the selected state province.');
                    return;
                }
    
                console.log('Attempting to delete state province with ID:', id);
    
                // Delete the state-province-type on the server
                this._cityService.deleteCity(id).subscribe({
                    next: () => {
                        // Close the details
                        this.closeDetails();
    
                        // Optionally reload or refresh the list
                        this._cityService.getCities().subscribe();
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
    trackByFn(index: number, item: City): string {
        return item.id || index.toString(); // Use index as fallback if id is undefined
    }
}
