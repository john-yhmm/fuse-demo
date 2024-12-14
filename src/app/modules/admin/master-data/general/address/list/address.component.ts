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
import { AddressService } from 'app/modules/admin/master-data/general/address/address.service';
import {
    Address,
    AddressPagination,
} from 'app/modules/admin/master-data/general/address/address.types';
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';
import { StateProvinceService } from '../../state-province/state-province.service';
import { query } from 'express';
import { StateProvince } from '../../state-province/state-province.types';
import { ActivatedRoute } from '@angular/router';
import { AddressTypeService } from '../../address-type/address-type.service';
import { AddressType } from '../../address-type/address-type.types';
import { CityService } from '../../city/city.service';
import { City } from '../../city/city.types';

@Component({
    selector: 'address-list', 
    templateUrl: './address.component.html', 
    styles: [
        /* language=SCSS */
        `
            .address-grid {
                grid-template-columns: 130px 40px 40px auto;

                @screen sm {
                    grid-template-columns: 130px 60px 60px auto;
                }

                @screen md {
                    grid-template-columns: 130px 112px 112px 50px 100px auto;
                }

                @screen lg {
                    grid-template-columns: 130px 112px 112px 80px 130px auto;
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
export class AddressListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    addresses$: Observable<Address[]>; 
    addressTypes: AddressType[];
    cities: City[];
    stateProvinces: StateProvince[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: AddressPagination; 
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedAddress: Address | null = null; 
    selectedAddressForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _addressService: AddressService,
        private _stateProvinceService: StateProvinceService,
        private _addressTypeService: AddressTypeService,
        private _cityService: CityService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected state-province-type form
        this.selectedAddressForm = this._formBuilder.group({
            addressType: [''],
            addressTypeId: ['', [Validators.required]], 
            addressLine1: ['', Validators.required],
            addressLine2: ['', Validators.required],
            city: [''],
            cityId: [''],
            stateProvince: [''],
            stateProvinceId: [''],
            rowguid: [''],
            lastEditedBy: [''], 
            lastEditedOn: [''], 
        });

        this._addressTypeService.addressTypes$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((addressTypes:AddressType[]) => {
            this.addressTypes = addressTypes; 
            this._changeDetectorRef.markForCheck();
        })

        this._cityService.cities$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((cities:City[]) => {
            this.cities = cities; 
            this._changeDetectorRef.markForCheck();
        })

        this._stateProvinceService.stateProvinces$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((stateProvinces:StateProvince[]) => {
                this.stateProvinces = stateProvinces; 
                this._changeDetectorRef.markForCheck();
            })

        // Get the pagination
        this._addressService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: AddressPagination) => { 
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the state-province 
        this.addresses$ = this._addressService.addresses$; 

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._addressService.getAddresses( 
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

            // Get state-province types if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._addressService.getAddresses( 
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
     * Toggle state-province-type details
     *
     * @param addressId
     */
    toggleDetails(addressId: string): void {
        // If the address is already selected...
        if (this.selectedAddress && this.selectedAddress.id === addressId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the address by id
        this._addressService
            .getAddressById(addressId)
            .subscribe((address) => {
                // Set the selected address
                this.selectedAddress = address;

                // Fill the form
                this.selectedAddressForm.patchValue(address);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedAddress = null;
    }

    /**
     * Create state-province-type
     */
    createAddress(): void {
        this._addressService.createAddress().subscribe((newAddress) => {
            // Go to new state-province-type
            this.selectedAddress = newAddress;

            // Fill the form
            this.selectedAddressForm.patchValue(newAddress);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected state-province-type using the form data
     */
    updateSelectedAddress(): void {
        // Get the state-province-type object
        const address = this.selectedAddressForm.getRawValue();
    
        // Ensure the ID is included
        const id = this.selectedAddress?.id; // Extract ID from the selected object
    
        if (!id) {
            console.error('Update failed: No ID found for the selected address.');
            return;
        }

        // Update the state-province on the server
        this._addressService.updateAddress(id, address).subscribe({
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
     * Delete the selected state-province using the form data
     */
    deleteSelectedAddress(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete address',
            message: 'Are you sure you want to remove this address? This action cannot be undone!',
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
                // Use the selectedAddress's ID directly
                const id = this.selectedAddress?.id;
    
                if (!id) {
                    console.error('Delete failed: No ID found for the selected address.');
                    return;
                }
    
                console.log('Attempting to delete address with ID:', id);
    
                // Delete the address on the server
                this._addressService.deleteAddress(id).subscribe({
                    next: () => {
                        // Close the details
                        this.closeDetails();
    
                        // Optionally reload or refresh the list
                        this._addressService.getAddresses().subscribe();
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
    trackByFn(index: number, item: Address): string {
        return item.id || index.toString(); // Use index as fallback if id is undefined
    }
}
