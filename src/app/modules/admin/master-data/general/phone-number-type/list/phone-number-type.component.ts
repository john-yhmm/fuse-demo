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
import { PhoneNumberTypeService } from 'app/modules/admin/master-data/general/phone-number-type/phone-number-type.service';
import {
    PhoneNumberType,
    PhoneNumberTypePagination,
} from 'app/modules/admin/master-data/general/phone-number-type/phone-number-type.types';
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
    selector: 'phone-number-type-list',
    templateUrl: './phone-number-type.component.html',
    styles: [
        /* language=SCSS */
        `
            .phone-number-grid {
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
export class PhoneNumberTypeListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    phoneNumberTypes$: Observable<PhoneNumberType[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: PhoneNumberTypePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedPhoneNumberType: PhoneNumberType | null = null;
    selectedPhoneNumberTypeForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _phoneNumberTypeService: PhoneNumberTypeService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected phone number type form
        this.selectedPhoneNumberTypeForm = this._formBuilder.group({
            id: [''],
            name: ['', [Validators.required]],
            modifiedDate: [''],
        });

        // Get the pagination
        this._phoneNumberTypeService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: PhoneNumberTypePagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the phone number types
        this.phoneNumberTypes$ = this._phoneNumberTypeService.phoneNumberTypes$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._phoneNumberTypeService.getPhoneNumberTypes(
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

            // Get phone number types if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._phoneNumberTypeService.getPhoneNumberTypes(
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
     * Toggle phone number type details
     * @param phoneNumberTypeId
     */
    toggleDetails(phoneNumberTypeId: string): void {
        if (this.selectedPhoneNumberType && this.selectedPhoneNumberType.id === phoneNumberTypeId) {
            this.closeDetails();
            return;
        }

        this._phoneNumberTypeService.getPhoneNumberTypeById(phoneNumberTypeId).subscribe((phoneNumberType) => {
            this.selectedPhoneNumberType = phoneNumberType;
            this.selectedPhoneNumberTypeForm.patchValue(phoneNumberType);
            this._changeDetectorRef.markForCheck();
        });
    }

    closeDetails(): void {
        this.selectedPhoneNumberType = null;
    }

    createPhoneNumberType(): void {
        this._phoneNumberTypeService.createPhoneNumberType().subscribe((newPhoneNumberType) => {
            this.selectedPhoneNumberType = newPhoneNumberType;
            this.selectedPhoneNumberTypeForm.patchValue(newPhoneNumberType);
            this._changeDetectorRef.markForCheck();
        });
    }

    updateSelectedPhoneNumberType(): void {
        const phoneNumberType = this.selectedPhoneNumberTypeForm.getRawValue();

        delete phoneNumberType.currentImageIndex;

        this._phoneNumberTypeService.updatePhoneNumberType(phoneNumberType.id, phoneNumberType).subscribe(() => {
            this.showFlashMessage('success');
        });
    }

    deleteSelectedPhoneNumberType(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Phone Number Type',
            message: 'Are you sure you want to delete this phone number type?',
            actions: { confirm: { label: 'Delete', }, },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const phoneNumberType = this.selectedPhoneNumberTypeForm.getRawValue();

                this._phoneNumberTypeService.deletePhoneNumberType(phoneNumberType.id).subscribe(() => {
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