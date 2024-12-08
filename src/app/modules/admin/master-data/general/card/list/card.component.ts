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
import { CardService } from 'app/modules/admin/master-data/general/card/card.service'; 
import {
    Card,
    CardPagination,
} from 'app/modules/admin/master-data/general/card/card.types'; 
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
    selector: 'card-list', 
    templateUrl: './card.component.html', 
    styles: [
        /* language=SCSS */
        `
            .card-grid {
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
export class CardListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    cards$: Observable<Card[]>;
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: CardPagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedCard: Card | null = null;
    selectedCardForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _cardService: CardService 
    ) {}

    ngOnInit(): void {
        this.selectedCardForm = this._formBuilder.group({
            cardNumber: ['', Validators.required],
            cardTypeID: [''],
            modifiedDate: [''],
        });

        this._cardService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CardPagination) => {
                this.pagination = pagination;
                this._changeDetectorRef.markForCheck();
            });

        this.cards$ = this._cardService.cards$;
            
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._cardService.getCards(
                        0,
                        10,
                        'cardNumber',
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

    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            this._sort.sort({
                id: 'cardNumber',
                start: 'asc',
                disableClear: true,
            });
            this._changeDetectorRef.markForCheck();

            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    this._paginator.pageIndex = 0;
                    this.closeDetails();
                });

            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._cardService.getCards(
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

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggleDetails(cardId: string): void {
        if (this.selectedCard && this.selectedCard.id === cardId) {
            this.closeDetails();
            return;
        }

        this._cardService.getCardById(cardId).subscribe((card) => {
            this.selectedCard = card;
            this.selectedCardForm.patchValue(card);
            this._changeDetectorRef.markForCheck();
        });
    }

    closeDetails(): void {
        this.selectedCard = null;
    }

    createCard(): void {
        this._cardService.createCard().subscribe((newCard) => {
            this.selectedCard = newCard;
            this.selectedCardForm.patchValue(newCard);
            this._changeDetectorRef.markForCheck();
        });
    }

    updateSelectedCard(): void {
        const card = this.selectedCardForm.getRawValue();
        const id = this.selectedCard?.id;
        if (!id) {
            console.error('Update failed: No ID found for the selected card.');
            return;
        }

        this._cardService.updateCard(id, card).subscribe({
            next: () => this.showFlashMessage('success'),
            error: () => this.showFlashMessage('error'),
        });
    }

    deleteSelectedCard(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete card',
            message: 'Are you sure you want to remove this card? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const id = this.selectedCard?.id;
                if (!id) {
                    console.error('Delete failed: No ID found for the selected card.');
                    return;
                }

                this._cardService.deleteCard(id).subscribe({
                    next: () => {
                    this.closeDetails();
                    this._cardService.getCards().subscribe();
                },
                error: (err) => {
                    console.error('Delete failed: ', err);
                },
            });
            }
        });
    }

    showFlashMessage(type: 'success' | 'error'): void {
        this.flashMessage = type;
        this._changeDetectorRef.markForCheck();
        setTimeout(() => {
            this.flashMessage = null;
            this._changeDetectorRef.markForCheck();
        }, 3000);
    }

    trackByFn(index: number, item: Card): string {
        return item.id || index.toString();
    }
}
