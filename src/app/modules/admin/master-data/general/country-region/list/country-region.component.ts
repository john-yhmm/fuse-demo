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
import { CountryRegionService } from 'app/modules/admin/master-data/general/country-region/country-region.service';
import {
    CountryRegion,
    CountryRegionPagination,
} from 'app/modules/admin/master-data/general/country-region/country-region.types';
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
    selector: 'countryRegion-list',
    templateUrl: './country-region.component.html',
    styles: [
        /* countryRegion=SCSS */
        `
            .countryRegion-grid {
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
export class CountryRegionListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    countryRegions$: Observable<CountryRegion[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CountryRegionPagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCountryRegion: CountryRegion | null = null;
    selectedCountryRegionForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _countryRegionService: CountryRegionService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected countryRegion form
        this.selectedCountryRegionForm = this._formBuilder.group({
            id: [''],
            countryRegionCode: [''],
            name: ['', [Validators.required]],
            modifiedDate: [''],
        });

        // Get the pagination
        this._countryRegionService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CountryRegionPagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the countryRegions
        this.countryRegions$ = this._countryRegionService.countryRegions$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._countryRegionService.getCountryRegions(
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

            // Get countryRegions if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._countryRegionService.getCountryRegions(
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
     * Toggle countryRegion details
     *
     * @param countryRegionId
     */
    toggleDetails(countryRegionId: string): void {
        // If the countryRegion is already selected...
        if (this.selectedCountryRegion && this.selectedCountryRegion.id === countryRegionId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the countryRegion by id
        this._countryRegionService
            .getCountryRegionById(countryRegionId)
            .subscribe((countryRegion) => {
                // Set the selected countryRegion
                this.selectedCountryRegion = countryRegion;

                // Fill the form
                this.selectedCountryRegionForm.patchValue(countryRegion);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCountryRegion = null;
    }

    /**
     * Cycle through images of selected countryRegion
     */
    cycleImages(forward: boolean = true): void {
        // Get the image count and current image index
        const count = this.selectedCountryRegionForm.get('images').value.length;
        const currentIndex =
            this.selectedCountryRegionForm.get('currentImageIndex').value;

        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

        // If cycling forward...
        if (forward) {
            this.selectedCountryRegionForm
                .get('currentImageIndex')
                .setValue(nextIndex);
        }
        // If cycling backwards...
        else {
            this.selectedCountryRegionForm
                .get('currentImageIndex')
                .setValue(prevIndex);
        }
    }

    /**
     * Create countryRegion
     */
    createCountryRegion(): void {
        console.log('here');

        // Create the countryRegion
        this._countryRegionService.createCountryRegion().subscribe((newCountryRegion) => {
            // Go to new countryRegion
            this.selectedCountryRegion = newCountryRegion;

            // Fill the form
            this.selectedCountryRegionForm.patchValue(newCountryRegion);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected countryRegion using the form data
     */
    updateSelectedCountryRegion(): void {
        // Get the countryRegion object
        const countryRegion = this.selectedCountryRegionForm.getRawValue();

        // Remove the currentImageIndex field
        delete countryRegion.currentImageIndex;

        // Update the countryRegion on the server
        this._countryRegionService
            .updateCountryRegion(countryRegion.id, countryRegion)
            .subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            });
    }

    /**
     * Delete the selected countryRegion using the form data
     */
    deleteSelectedCountryRegion(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete countryRegion',
            message:
                'Are you sure you want to remove this countryRegion? This action cannot be undone!',
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
                // Get the countryRegion object
                const countryRegion = this.selectedCountryRegionForm.getRawValue();

                // Delete the countryRegion on the server
                this._countryRegionService
                    .deleteCountryRegion(countryRegion.id)
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
