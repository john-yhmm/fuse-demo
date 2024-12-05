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
import { CultureService } from 'app/modules/admin/master-data/general/culture/culture.services';
import {
    Culture,
    CulturePagination,
} from 'app/modules/admin/master-data/general/culture/culture.types';
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
    selector: 'culture-list',
    templateUrl: './culture.component.html',
    styles: [
        /* language=SCSS */
        `
            .culture-grid {
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
export class CultureListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    cultures$: Observable<Culture[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CulturePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCulture: Culture | null = null;
    selectedCultureForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _cultureService: CultureService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected culture form
        this.selectedCultureForm = this._formBuilder.group({
            id: [''],
            cultureCode: [''],
            name: ['', [Validators.required]],
            status: [false],
            modifiedDate: [''],
        });

        // Get the pagination
        this._cultureService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CulturePagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the cultures
        this.cultures$ = this._cultureService.cultures$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._cultureService.getCultures(
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

            // Get cultures if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._cultureService.getCultures(
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
     * Toggle culture details
     *
     * @param cultureId
     */
    toggleDetails(cultureId: string): void {
        // If the culture is already selected...
        if (this.selectedCulture && this.selectedCulture.id === cultureId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the culture by id
        this._cultureService
            .getCultureById(cultureId)
            .subscribe((culture) => {
                // Set the selected culture
                this.selectedCulture = culture;

                // Fill the form
                this.selectedCultureForm.patchValue(culture);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCulture = null;
    }

    /**
     * Cycle through images of selected culture
     */
    cycleImages(forward: boolean = true): void {
        // Get the image count and current image index
        const count = this.selectedCultureForm.get('images').value.length;
        const currentIndex =
            this.selectedCultureForm.get('currentImageIndex').value;

        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

        // If cycling forward...
        if (forward) {
            this.selectedCultureForm
                .get('currentImageIndex')
                .setValue(nextIndex);
        }
        // If cycling backwards...
        else {
            this.selectedCultureForm
                .get('currentImageIndex')
                .setValue(prevIndex);
        }
    }

    /**
     * Create culture
     */
    createCulture(): void {
        console.log('here');

        // Create the culture
        this._cultureService.createCulture().subscribe((newCulture) => {
            // Go to new culture
            this.selectedCulture = newCulture;

            // Fill the form
            this.selectedCultureForm.patchValue(newCulture);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected culture using the form data
     */
    updateSelectedCulture(): void {
        // Get the culture object
        const culture = this.selectedCultureForm.getRawValue();

        // Remove the currentImageIndex field
        delete culture.currentImageIndex;

        // Update the culture on the server
        this._cultureService
            .updateCulture(culture.id, culture)
            .subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            });
    }

    /**
     * Delete the selected culture using the form data
     */
    deleteSelectedCulture(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete culture',
            message:
                'Are you sure you want to remove this culture? This action cannot be undone!',
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
                // Get the culture object
                const culture = this.selectedCultureForm.getRawValue();

                // Delete the culture on the server
                this._cultureService
                    .deleteCulture(culture.id)
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
