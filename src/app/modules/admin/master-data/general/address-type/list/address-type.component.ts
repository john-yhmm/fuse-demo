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
import { AddressTypeService } from 'app/modules/admin/master-data/general/address-type/address-type.service';
import {
    AddressType,
    AddressTypePagination,
} from 'app/modules/admin/master-data/general/address-type/address-type.types';
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
    selector: 'address-type-list',
    templateUrl: './address-type.component.html',
    styles: [
        /* language=SCSS */
        `
            .addressType-grid {
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
export class AddressTypeListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    addressTypes$: Observable<AddressType[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: AddressTypePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedAddressType: AddressType | null = null;
    selectedAddressTypeForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _addressTypeService: AddressTypeService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected address-type form
        this.selectedAddressTypeForm = this._formBuilder.group({
            id: [''],
            addressTypeName: ['', [Validators.required]],
            rowguid: [''],
            lastEditedBy: [''],
            lastEditedOn: [''],
        });

        // Get the pagination
        this._addressTypeService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: AddressTypePagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the address-types
        this.addressTypes$ = this._addressTypeService.addressTypes$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._addressTypeService.getAddressTypes(
                        0,
                        10,
                        'addressTypeName',
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
                id: 'addressTypeName',
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

            // Get address-types if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._addressTypeService.getAddressTypes(
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
     * Toggle addressType details
     *
     * @param addressTypeId
     */
    toggleDetails(addressTypeId: string): void {
        // If the addressType is already selected...
        if (this.selectedAddressType && this.selectedAddressType.id === addressTypeId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the addressType by id
        this._addressTypeService
            .getAddressTypeById(addressTypeId)
            .subscribe((addressType) => {
                // Set the selected addressType
                this.selectedAddressType = addressType;

                // Fill the form
                this.selectedAddressTypeForm.patchValue(addressType);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedAddressType = null;
    }

    /**
     * Cycle through images of selected addressType
     */
    cycleImages(forward: boolean = true): void {
        // Get the image count and current image index
        const count = this.selectedAddressTypeForm.get('images').value.length;
        const currentIndex =
            this.selectedAddressTypeForm.get('currentImageIndex').value;

        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

        // If cycling forward...
        if (forward) {
            this.selectedAddressTypeForm
                .get('currentImageIndex')
                .setValue(nextIndex);
        }
        // If cycling backwards...
        else {
            this.selectedAddressTypeForm
                .get('currentImageIndex')
                .setValue(prevIndex);
        }
    }

    /**
     * Create addressType
     */
    createAddressType(): void {
        console.log('here');

        // Create the addressType
        this._addressTypeService.createAddressType().subscribe((newAddressType) => {
            // Go to new addressType
            this.selectedAddressType = newAddressType;

            // Fill the form
            this.selectedAddressTypeForm.patchValue(newAddressType);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected addressType using the form data
     */
    updateSelectedAddressType(): void {
        // Get the addressType object
        const addressType = this.selectedAddressTypeForm.getRawValue();

        // Remove the currentImageIndex field
        delete addressType.currentImageIndex;

        // Update the addressType on the server
        this._addressTypeService
            .updateAddressType(addressType.id, addressType)
            .subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            });
    }

    /**
     * Delete the selected addressType using the form data
     */
    deleteSelectedAddressType(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete address-type',
            message:
                'Are you sure you want to remove this address-type? This action cannot be undone!',
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
                // Get the addressType object
                const addressType = this.selectedAddressTypeForm.getRawValue();

                // Delete the addressType on the server
                this._addressTypeService
                    .deleteAddressType(addressType.id)
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
