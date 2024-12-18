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
import { GeoLocationService } from 'app/modules/admin/master-data/general/geo-location/geo-location.service';
import {
    GeoLocation,
    GeoLocationPagination,
} from 'app/modules/admin/master-data/general/geo-location/geo-location.types';
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
    selector: 'geo-location-list',
    templateUrl: './geo-location.component.html',
    styles: [
        /* geo-location=SCSS */
        `
            .geo-location-grid {
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
export class GeoLocationListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    geoLocations$: Observable<GeoLocation[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: GeoLocationPagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedGeoLocation: GeoLocation | null = null;
    selectedGeoLocationForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _geoLocationService: GeoLocationService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected language form
        this.selectedGeoLocationForm = this._formBuilder.group({
            id: [''],
            geoLocationValue: ['', [Validators.required]],
            description: [''],
            lastEditedBy: [''],
            lastEditedOn: [''],
        });

        // Get the pagination
        this._geoLocationService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: GeoLocationPagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the geoLocations
        this.geoLocations$ = this._geoLocationService.geoLocations$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._geoLocationService.getGeoLocations(
                        0,
                        10,
                        'geoLocationValue',
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
                id: 'geoLocationValue',
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
                        return this._geoLocationService.getGeoLocations(
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
     * Toggle geoLocation details
     *
     * @param GeoLocationId
     */
    toggleDetails(geoLocationId: string): void {
        // If the language is already selected...
        if (this.selectedGeoLocation && this.selectedGeoLocation.id === geoLocationId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the geoLocation by id
        this._geoLocationService
            .getGeoLocationById(geoLocationId)
            .subscribe((geoLocation) => {
                // Set the selected language
                this.selectedGeoLocation = geoLocation;

                // Fill the form
                this.selectedGeoLocationForm.patchValue(geoLocation);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedGeoLocation = null;
    }

    /**
     * Cycle through images of selected language
     */
    cycleImages(forward: boolean = true): void {
        // Get the image count and current image index
        const count = this.selectedGeoLocationForm.get('images').value.length;
        const currentIndex =
            this.selectedGeoLocationForm.get('currentImageIndex').value;

        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

        // If cycling forward...
        if (forward) {
            this.selectedGeoLocationForm
                .get('currentImageIndex')
                .setValue(nextIndex);
        }
        // If cycling backwards...
        else {
            this.selectedGeoLocationForm
                .get('currentImageIndex')
                .setValue(prevIndex);
        }
    }

    /**
     * Create geoLocation
     */
    createGeoLocation(): void {

        // Create the geoLocation
        this._geoLocationService.createGeoLocation().subscribe((newGeoLocation) => {
            // Go to new geoLocation
            this.selectedGeoLocation = newGeoLocation;

            // Fill the form
            this.selectedGeoLocationForm.patchValue(newGeoLocation);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected geoLocation using the form data
     */
    updateSelectedGeoLocation(): void {
        // Get the geoLocation object
        const geoLocation = this.selectedGeoLocationForm.getRawValue();

        // Remove the currentImageIndex field
        delete geoLocation.currentImageIndex;

        // Update the geoLocation on the server
        this._geoLocationService
            .updateGeoLocation(geoLocation.id, geoLocation)
            .subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            });
    }

    /**
     * Delete the selected geoLocation using the form data
     */
    deleteSelectedGeoLocation(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Geo Location',
            message:
                'Are you sure you want to remove this geo location? This action cannot be undone!',
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
                const geoLocation = this.selectedGeoLocationForm.getRawValue();

                // Delete the language on the server
                this._geoLocationService
                    .deleteGeoLocation(geoLocation.id)
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
