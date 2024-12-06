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
import { TransactionTypeService } from 'app/modules/admin/master-data/general/transaction-type/transaction-type.service';
import {
    TransactionType,
    TransactionTypePagination,
} from 'app/modules/admin/master-data/general/transaction-type/transaction-type.types';
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
    selector: 'transaction-type-list',
    templateUrl: './transaction-type.component.html',
    styles: [
        /* language=SCSS */
        `
            .transactionType-grid {
                grid-template-columns: 100px auto;

                @screen sm {
                    grid-template-columns: 100px auto;
                }

                @screen md {
                    grid-template-columns: 150px auto;
                }

                @screen lg {
                    grid-template-columns: 150px auto;
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
export class TransactionTypeListComponent
    implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    transactionTypes$: Observable<TransactionType[]>;
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: TransactionTypePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedTransactionType: TransactionType | null = null;
    selectedTransactionTypeForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _transactionTypeService: TransactionTypeService
    ) {}

    ngOnInit(): void {
        this.selectedTransactionTypeForm = this._formBuilder.group({
            id: [''],
            transactionTypeName: ['', [Validators.required]],
            description: [''],
            lastEditedBy: [''],
            validFrom: [''],
            validTo: [''],
        });

        this._transactionTypeService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: TransactionTypePagination) => {
                this.pagination = pagination;
                this._changeDetectorRef.markForCheck();
            });

        this.transactionTypes$ = this._transactionTypeService.transactionTypes$;

        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._transactionTypeService.getTransactionTypes(
                        0,
                        10,
                        'transactionTypeName',
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
                id: 'transactionTypeName',
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
                        return this._transactionTypeService.getTransactionTypes(
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

    toggleDetails(transactionTypeId: string): void {
        if (
            this.selectedTransactionType &&
            this.selectedTransactionType.id === transactionTypeId
        ) {
            this.closeDetails();
            return;
        }

        this._transactionTypeService
            .getTransactionTypeById(transactionTypeId)
            .subscribe((transactionType) => {
                this.selectedTransactionType = transactionType;
                this.selectedTransactionTypeForm.patchValue(transactionType);
                this._changeDetectorRef.markForCheck();
            });
    }

    closeDetails(): void {
        this.selectedTransactionType = null;
    }

    createTransactionType(): void {
        this._transactionTypeService
            .createTransactionType()
            .subscribe((newTransactionType) => {
                this.selectedTransactionType = newTransactionType;
                this.selectedTransactionTypeForm.patchValue(newTransactionType);
                this._changeDetectorRef.markForCheck();
            });
    }

    updateSelectedTransactionType(): void {
        const transactionType = this.selectedTransactionTypeForm.getRawValue();
        this._transactionTypeService
            .updateTransactionType(transactionType.id, transactionType)
            .subscribe(() => {
                this.showFlashMessage('success');
            });
    }

    deleteSelectedTransactionType(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete transaction type',
            message:
                'Are you sure you want to delete this transaction type? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const transactionType =
                    this.selectedTransactionTypeForm.getRawValue();
                this._transactionTypeService
                    .deleteTransactionType(transactionType.id)
                    .subscribe(() => {
                        this.closeDetails();
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

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}