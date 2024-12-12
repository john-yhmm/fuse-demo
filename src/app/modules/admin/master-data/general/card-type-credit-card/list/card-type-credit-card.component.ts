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
import { CardTypeCreditCardService } from 'app/modules/admin/master-data/general/card-type-credit-card/card-type-credit-card.service';
import {
    CardTypeCreditCard,
    CardTypeCreditCardPagination,
} from 'app/modules/admin/master-data/general/card-type-credit-card/card-type-credit-card.types';
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';
import { CardTypeService } from 'app/modules/admin/master-data/general/card-type/card-type.service';
import { query } from 'express';
import { CardType } from '../../card-type/card-type.types';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'card-type-credit-card-list', 
    templateUrl: './card-type-credit-card.component.html', 
    styles: [
        /* language=SCSS */
        `
            .card-type-credit-card-grid {
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
export class CardTypeCreditCardListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    cardTypeCreditCards$: Observable<CardTypeCreditCard[]>; 
    cardTypes: CardType[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CardTypeCreditCardPagination; 
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCardTypeCreditCard: CardTypeCreditCard | null = null; 
    selectedCardTypeCreditCardForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _cardTypeCreditCardService: CardTypeCreditCardService,
        private _cardTypeService: CardTypeService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected form
        this.selectedCardTypeCreditCardForm = this._formBuilder.group({
            name: ['', [Validators.required]], 
            startNumber: ['', [Validators.required]], 
            endNumber: ['', [Validators.required]], 
            cardTypeID: [''],
            modifiedDate: [''], 
        });

        this._cardTypeService.cardTypes$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((cardTypes:CardType[]) => {
                this.cardTypes = cardTypes; 
                this._changeDetectorRef.markForCheck();
            })

        // Get the pagination
        this._cardTypeCreditCardService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CardTypeCreditCardPagination) => { 
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the card type credit card
        this.cardTypeCreditCards$ = this._cardTypeCreditCardService.cardTypeCreditCards$; 

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._cardTypeCreditCardService.getCardTypeCreditCards( 
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

            // Get cardtype creditcard if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._cardTypeCreditCardService.getCardTypeCreditCards( 
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
     * Toggle card-type-credit-card details
     *
     * @param cardTypeCreditCardId
     */
    toggleDetails(cardTypeCreditCardId: string): void {
        // If the cardtype credit card is already selected...
        if (this.selectedCardTypeCreditCard && this.selectedCardTypeCreditCard.id === cardTypeCreditCardId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the card-type credit card by id
        this._cardTypeCreditCardService
            .getCardTypeCreditCardById(cardTypeCreditCardId)
            .subscribe((cardTypeCreditCard) => {
                
                this.selectedCardTypeCreditCard = cardTypeCreditCard;

                // Fill the form
                this.selectedCardTypeCreditCardForm.patchValue(cardTypeCreditCard);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedCardTypeCreditCard = null;
    }

    /**
     * Create 
     */
    createCardTypeCreditCard(): void {
    
        this._cardTypeCreditCardService.createCardTypeCreditCard().subscribe((newCardTypeCreditCard) => {

            this.selectedCardTypeCreditCard = newCardTypeCreditCard;

            // Fill the form
            this.selectedCardTypeCreditCardForm.patchValue(newCardTypeCreditCard);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected  using the form data
     */
    updateSelectedCardTypeCreditCard(): void {
        // Get the object
        const cardTypeCreditCard = this.selectedCardTypeCreditCardForm.getRawValue();
    
        // Ensure the ID is included
        const id = this.selectedCardTypeCreditCard?.id; // Extract ID from the selected object
    
        if (!id) {
            console.error('Update failed: No ID found for the selected card-type credit card.');
            return;
        }

        // Update  on the server
        this._cardTypeCreditCardService.updateCardTypeCreditCard(id, cardTypeCreditCard).subscribe({
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
     * Delete the selected using the form data
     */
    deleteSelectedCardTypeCreditCard(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete card-type credit card',
            message: 'Are you sure you want to remove this card-type credit card? This action cannot be undone!',
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
                const id = this.selectedCardTypeCreditCard?.id;
    
                if (!id) {
                    console.error('Delete failed: No ID found for the selected card-type credit card.');
                    return;
                }
    
                console.log('Attempting to delete card-type credit card with ID:', id);
    
                // Delete on the server
                this._cardTypeCreditCardService.deleteCardTypeCreditCard(id).subscribe({
                    next: () => {
                        // Close the details
                        this.closeDetails();
    
                        // Optionally reload or refresh the list
                        this._cardTypeCreditCardService.getCardTypeCreditCards().subscribe();
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
    trackByFn(index: number, item: CardTypeCreditCard): string {
        return item.id || index.toString(); // Use index as fallback if id is undefined
    }
}
