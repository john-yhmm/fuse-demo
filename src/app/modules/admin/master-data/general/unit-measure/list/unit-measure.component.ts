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
import { UnitMeasureService } from 'app/modules/admin/master-data/general/unit-measure/unit-measure.service';
import {
    UnitMeasure,
    UnitMeasurePagination,
} from 'app/modules/admin/master-data/general/unit-measure/unit-measure.types';
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
    selector: 'unit-measure-list',
    templateUrl: './unit-measure.component.html',
    styles: [
        /* language=SCSS */
        `
            .unit-measure-grid {
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
export class UnitMeasureListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    unitMeasures$: Observable<UnitMeasure[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: UnitMeasurePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedUnitMeasure: UnitMeasure | null = null;
    selectedUnitMeasureForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _unitMeasureService: UnitMeasureService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected language form
        this.selectedUnitMeasureForm = this._formBuilder.group({
            id: [''],
            unitMeasureCode: [''],
            unitMeasureName: ['', [Validators.required]],
            lastEditedBy: [''],
            lastEditedOn: [''],
        });

        // Get the pagination
        this._unitMeasureService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: UnitMeasurePagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the languages
        this.unitMeasures$ = this._unitMeasureService.unitMeasures$;
        console.log(this.unitMeasures$);
        this.unitMeasures$.subscribe((data) => {
            console.log('Fetched unit measures:', data);
        });
        

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._unitMeasureService.getUnitMeasures(
                        0,
                        10,
                        'unitMeasureName',
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
                id: 'unitMeasureName',
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
                        return this._unitMeasureService.getUnitMeasures(
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
     * @param unitMeasureId
     */
    toggleDetails(unitMeasureId: string): void {
        // If the language is already selected...
        if (this.selectedUnitMeasure && this.selectedUnitMeasure.id === unitMeasureId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the language by id
        this._unitMeasureService
            .getUnitMeasureById(unitMeasureId)
            .subscribe((unitMeasure) => {
                // Set the selected language
                this.selectedUnitMeasure = unitMeasure;

                // Fill the form
                this.selectedUnitMeasureForm.patchValue(unitMeasure);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedUnitMeasure = null;
    }

    /**
     * Cycle through images of selected language
     */
    cycleImages(forward: boolean = true): void {
        // Get the image count and current image index
        const count = this.selectedUnitMeasureForm.get('images').value.length;
        const currentIndex =
            this.selectedUnitMeasureForm.get('currentImageIndex').value;

        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

        // If cycling forward...
        if (forward) {
            this.selectedUnitMeasureForm
                .get('currentImageIndex')
                .setValue(nextIndex);
        }
        // If cycling backwards...
        else {
            this.selectedUnitMeasureForm
                .get('currentImageIndex')
                .setValue(prevIndex);
        }
    }

    /**
     * Create language
     */
    createUnitMeasure(): void {
        console.log('here');

        // Create the language
        this._unitMeasureService.createUnitMeasure().subscribe((newUnitMeasure) => {
            // Go to new language
            this.selectedUnitMeasure = newUnitMeasure;

            // Fill the form
            this.selectedUnitMeasureForm.patchValue(newUnitMeasure);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected language using the form data
     */
    updateSelectedUnitMeasure(): void {
        // Get the language object
        const unitMeasure = this.selectedUnitMeasureForm.getRawValue();

        // Remove the currentImageIndex field
        delete unitMeasure.currentImageIndex;

        // Update the language on the server
        this._unitMeasureService
            .updateUnitMeasure(unitMeasure.id, unitMeasure)
            .subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            });
    }

    /**
     * Delete the selected language using the form data
     */
    deleteSelectedUnitMeasure(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete unit measure',
            message:
                'Are you sure you want to remove this unit measure? This action cannot be undone!',
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
                const unitMeasure = this.selectedUnitMeasureForm.getRawValue();

                // Delete the language on the server
                this._unitMeasureService
                    .deleteUnitMeasure(unitMeasure.id)
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
