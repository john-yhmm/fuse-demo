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
import { CardTypeService } from 'app/modules/admin/master-data/general/card-type/card-type.service'; // Modify import path accordingly
import {
    CardType,
    CardTypePagination,
} from 'app/modules/admin/master-data/general/card-type/card-type.types'; // Modify import path accordingly
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
    selector: 'card-type-list', // Update the selector to reflect card-type
    templateUrl: './card-type.component.html', // Modify the template path if needed
    styles: [
        /* language=SCSS */
        `
            .card-type-grid {
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
export class CardTypeListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    cardTypes$: Observable<CardType[]>; // Updated to CardType

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CardTypePagination; // Updated to CardTypePagination
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCardType: CardType | null = null; // Updated to CardType
    selectedCardTypeForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _cardTypeService: CardTypeService // Updated to CardTypeService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected card-type form
        this.selectedCardTypeForm = this._formBuilder.group({
            id: [''],
            name: ['', [Validators.required]],
            issuerId: [''],
            modifiedDate: [''],
        });

        // Get the pagination
        this._cardTypeService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CardTypePagination) => { // Updated to CardTypePagination
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the card types
        this.cardTypes$ = this._cardTypeService.cardTypes$; // Updated to cardTypes$

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._cardTypeService.getCardTypes( // Updated to CardTypeService methods
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

            // Get card types if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._cardTypeService.getCardTypes( // Updated to CardTypeService methods
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
     * Toggle card-type details
     *
     * @param cardTypeId
     */
    toggleDetails(cardTypeId: string): void {
        // If the card-type is already selected...
        if (this.selectedCardType && this.selectedCardType.id === cardTypeId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the card-type by id
        this._cardTypeService
            .getCardTypeById(cardTypeId)
            .subscribe((cardType) => {
                // Set the selected card-type
                this.selectedCardType = cardType;

                // Fill the form
                this.selectedCardTypeForm.patchValue(cardType);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCardType = null;
    }

    /**
     * Create card-type
     */
    createCardType(): void {
        // Create the card-type
        this._cardTypeService.createCardType().subscribe((newCardType) => {
            // Go to new card-type
            this.selectedCardType = newCardType;

            // Fill the form
            this.selectedCardTypeForm.patchValue(newCardType);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected card-type using the form data
     */
    updateSelectedCardType(): void {
        // Get the card-type object
        const cardType = this.selectedCardTypeForm.getRawValue();

        // Ensure the ID is included
        const id = this.selectedCardType?.id; // Extract ID from the selected object

        if (!id) {
            console.error('Update failed: No ID found for the selected card type.');
            return;
        }

        // Remove unnecessary fields
        delete cardType.currentImageIndex;
        console.log('Updating card type:', { id, ...cardType });

        // Update the card-type on the server
        this._cardTypeService.updateCardType(id, cardType).subscribe({
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
     * Delete the selected card-type using the form data
     */
    deleteSelectedCardType(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete card-type',
            message: 'Are you sure you want to remove this card-type? This action cannot be undone!',
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
                // Use the selectedCardType's ID directly
                const id = this.selectedCardType?.id;

                if (!id) {
                    console.error('Delete failed: No ID found for the selected card type.');
                    return;
                }

                console.log('Attempting to delete card type with ID:', id);

                // Delete the card-type on the server
                this._cardTypeService.deleteCardType(id).subscribe({
                    next: () => {
                        // Close the details
                        this.closeDetails();

                        // Optionally reload or refresh the list
                        this._cardTypeService.getCardTypes().subscribe();
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
    trackByFn(index: number, item: CardType): string {
        return item.id || index.toString(); // Use index as fallback if id is undefined
    }
}
