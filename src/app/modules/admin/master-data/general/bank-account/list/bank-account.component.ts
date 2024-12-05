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
import { BankAccountService } from 'app/modules/admin/master-data/general/bank-account/bank-account.service'; 
import {
    BankAccount,
    BankAccountPagination,
} from 'app/modules/admin/master-data/general/bank-account/bank-account.types'; 
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
    selector: 'bank-account-list', 
    templateUrl: './bank-account.component.html', 
    styles: [
        /* language=SCSS */
        `
            .bank-account-grid {
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
export class BankAccountListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    bankAccounts$: Observable<BankAccount[]>; 
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: BankAccountPagination; 
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedBankAccount: BankAccount | null = null; 
    selectedBankAccountForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _bankAccountService: BankAccountService 
    ) {}

    ngOnInit(): void {
        this.selectedBankAccountForm = this._formBuilder.group({
            bankAccountName: ['', [Validators.required]], 
            bankAccountBranch: ['', [Validators.required]],
            bankAccountCode: ['', [Validators.required]],
            bankAccountNumber: ['', [Validators.required]],
            bankInternationalCode: ['', [Validators.required]],
            lastEditedBy: [''],
            validFrom: [''],
            validTo: [''],
        });

        this._bankAccountService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: BankAccountPagination) => { 
                this.pagination = pagination;
                this._changeDetectorRef.markForCheck();
            });

        this.bankAccounts$ = this._bankAccountService.bankAccounts$; 

        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._bankAccountService.getBankAccounts( 
                        0,
                        10,
                        'bankAccountName',
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
                id: 'bankAccountName',
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
                        return this._bankAccountService.getBankAccounts( 
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

    toggleDetails(bankAccountId: string): void {
        if (this.selectedBankAccount && this.selectedBankAccount.id === bankAccountId) {
            this.closeDetails();
            return;
        }

        this._bankAccountService
            .getBankAccountById(bankAccountId)
            .subscribe((bankAccount) => {
                this.selectedBankAccount = bankAccount;
                this.selectedBankAccountForm.patchValue(bankAccount);
                this._changeDetectorRef.markForCheck();
            });
    }

    closeDetails(): void {
        this.selectedBankAccount = null;
    }

    createBankAccount(): void {
        this._bankAccountService.createBankAccount().subscribe((newBankAccount) => {
            this.selectedBankAccount = newBankAccount;
            this.selectedBankAccountForm.patchValue(newBankAccount);
            this._changeDetectorRef.markForCheck();
        });
    }

    updateSelectedBankAccount(): void {
        const bankAccount = this.selectedBankAccountForm.getRawValue();
        const id = this.selectedBankAccount?.id; // Extract ID from the selected object
        if (!id) {
            console.error('Update failed: No ID found for the selected country type.');
            return;
        }
        delete bankAccount.currentImageIndex;
        console.log('Updating country type:', { id, ...bankAccount });
        this._bankAccountService.updateBankAccount(id, bankAccount).subscribe({
            next: (response) => {
                console.log('Update successful:', response);
                this.showFlashMessage('success');
            },
            error: (err) => {
                console.error('Update failed:', err);
                this.showFlashMessage('error');
            },
        });
    }

    deleteSelectedBankAccount(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete bank-account',
            message: 'Are you sure you want to remove this bank-account? This action cannot be undone!',
            actions: {
                confirm: { label: 'Delete' },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const id = this.selectedBankAccount?.id;
                if (!id) {
                    console.error('Delete failed: No ID found for the selected bank account');
                    return;
                }
                console.log('Attempting to delete country type with ID:', id);

                this._bankAccountService.deleteBankAccount(id).subscribe({ 
                    next: () => {
                        this.closeDetails();
                        //this._bankAccountService.getBankAccounts().subscribe();
                    },
                    error: (err) => {
                        console.error('Delete failed:', err);
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

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
