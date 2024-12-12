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
import { StateProvinceService } from 'app/modules/admin/master-data/general/state-province/state-province.service';
import {
    StateProvince,
    StateProvincePagination,
} from 'app/modules/admin/master-data/general/state-province/state-province.types';
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';
import { CountryService } from '../../country/country.service';
import { query } from 'express';
import { Country } from '../../country/country.types';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'state-province-list', 
    templateUrl: './state-province.component.html', 
    styles: [
        /* language=SCSS */
        `
            .state-province-grid {
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
export class StateProvinceListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    stateProvinces$: Observable<StateProvince[]>; 
    countrys: Country[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: StateProvincePagination; 
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedStateProvince: StateProvince | null = null; 
    selectedStateProvinceForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _stateProvinceService: StateProvinceService,
        private _countryService: CountryService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected country-type form
        this.selectedStateProvinceForm = this._formBuilder.group({
            stateProvinceCode: ['', [Validators.required]], 
            stateProvinceName: ['', [Validators.required]], 
            countryId: [''], 
            salesTerritoryId: ['', [Validators.required]], 
            border: ['', [Validators.required]],
            latestRecordedPopulation: ['', [Validators.required]], 
            rowguid: ['', [Validators.required]],  
            lastEditedBy: [''], 
            validFrom: [''], 
            validTo: [''], 
        });

        this._countryService.countrys$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((countrys:Country[]) => {
                this.countrys = countrys; 
                this._changeDetectorRef.markForCheck();
            })

        // Get the pagination
        this._stateProvinceService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: StateProvincePagination) => { 
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the country 
        this.stateProvinces$ = this._stateProvinceService.stateProvinces$; 

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._stateProvinceService.getStateProvinces( 
                        0,
                        10,
                        'stateProvinceName',
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
                id: 'stateProvinceName',
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
                        return this._stateProvinceService.getStateProvinces( 
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
     * @param stateProvinceId
     */
    toggleDetails(stateProvinceId: string): void {
        // If the country-type is already selected...
        if (this.selectedStateProvince && this.selectedStateProvince.id === stateProvinceId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the country-type by id
        this._stateProvinceService
            .getStateProvinceById(stateProvinceId)
            .subscribe((stateProvince) => {
                // Set the selected country-type
                this.selectedStateProvince = stateProvince;

                // Fill the form
                this.selectedStateProvinceForm.patchValue(stateProvince);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedStateProvince = null;
    }

    /**
     * Create country-type
     */
    createStateProvince(): void {
        // Create the country-type
        this._stateProvinceService.createStateProvince().subscribe((newStateProvince) => {
            // Go to new country-type
            this.selectedStateProvince = newStateProvince;

            // Fill the form
            this.selectedStateProvinceForm.patchValue(newStateProvince);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected country-type using the form data
     */
    updateSelectedStateProvince(): void {
        // Get the country-type object
        const stateProvince = this.selectedStateProvinceForm.getRawValue();
    
        // Ensure the ID is included
        const id = this.selectedStateProvince?.id; // Extract ID from the selected object
    
        if (!id) {
            console.error('Update failed: No ID found for the selected country.');
            return;
        }

        // Update the country on the server
        this._stateProvinceService.updateStateProvince(id, stateProvince).subscribe({
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
    deleteSelectedStateProvince(): void {
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
                // Use the selectedStateProvinceType's ID directly
                const id = this.selectedStateProvince?.id;
    
                if (!id) {
                    console.error('Delete failed: No ID found for the selected state province.');
                    return;
                }
    
                console.log('Attempting to delete state province with ID:', id);
    
                // Delete the country-type on the server
                this._stateProvinceService.deleteStateProvince(id).subscribe({
                    next: () => {
                        // Close the details
                        this.closeDetails();
    
                        // Optionally reload or refresh the list
                        this._stateProvinceService.getStateProvinces().subscribe();
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
    trackByFn(index: number, item: StateProvince): string {
        return item.id || index.toString(); // Use index as fallback if id is undefined
    }
}
