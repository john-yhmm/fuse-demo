import {
    AsyncPipe,
    CommonModule,
    NgClass,
    NgTemplateOutlet,
} from '@angular/common';
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
import {
    Observable,
    Subject,
    debounceTime,
    map,
    merge,
    switchMap,
    takeUntil,
} from 'rxjs';
import { ContactTypeService } from '../../contact-type/contact-type.service';
import { ContactType } from '../../contact-type/contact-type.types';
import { ContactService } from '../contact.service';
import { Contact, ContactPagination } from '../contact.types';

@Component({
    selector: 'contact-list',
    templateUrl: './contact.component.html',
    styles: [
        /* language=SCSS */
        `
            .state-province-grid {
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
export class ContactListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    contacts$: Observable<Contact[]>;
    contactTypes: ContactType[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: ContactPagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedContact: Contact | null = null;
    selectedContactForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _contactService: ContactService,
        private _contactTypeService: ContactTypeService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected contact form
        this.selectedContactForm = this._formBuilder.group({
            id: ['', [Validators.required]],
            contactTypeId: ['', [Validators.required]],
            phoneNumber: [''],
            phoneNumberTypeId: [''],
            faxNumber: [''],
            emailAddress: [''],
            websiteUrl: [''],
            customFields: [''],
            lastEditedBy: ['', [Validators.required]],
            lastEditedOn: ['', [Validators.required]],
        });

        this._contactTypeService.contactTypes$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((contactTypes: ContactType[]) => {
                this.contactTypes = contactTypes;
                this._changeDetectorRef.markForCheck();
            });

        // Get the pagination
        this._contactService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: ContactPagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the contacts
        this.contacts$ = this._contactService.contacts$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._contactService.getContacts(
                        this.pagination.page,
                        this.pagination.size,
                        this._sort.active || 'emailAddress',
                        this._sort.direction || 'asc',
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
                id: 'emailAddress',
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
            // Get contacts if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._contactService.getContacts(
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
     * Toggle contact details
     *
     * @param contactId
     */
    toggleDetails(contactId: string): void {
        // If the contact is already selected...
        if (this.selectedContact && this.selectedContact.id === contactId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the contact by id
        this._contactService.getContactById(contactId).subscribe((contact) => {
            // Set the selected contact
            this.selectedContact = contact;

            // Fill the form
            this.selectedContactForm.patchValue(contact);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedContact = null;
    }

    /**
     * Create contact
     */
    createContact(): void {
        // Create the contact
        this._contactService.createContact().subscribe((newContact) => {
            // Set the new contact as selected
            this.selectedContact = newContact;

            // Fill the form
            this.selectedContactForm.patchValue(newContact);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected contact using the form data
     */
    updateSelectedContact(): void {
        // Get the contact object
        const contact = this.selectedContactForm.getRawValue();

        // Ensure the ID is included
        const id = this.selectedContact?.id; // Extract ID from the selected object

        if (!id) {
            console.error(
                'Update failed: No ID found for the selected contact.'
            );
            return;
        }

        // Update the contact on the server
        this._contactService.updateContact(id, contact).subscribe({
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
     * Delete the selected contact using the form data
     */
    deleteSelectedContact(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete contact',
            message:
                'Are you sure you want to remove this contact? This action cannot be undone!',
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
                // Use the selectedContact's ID directly
                const id = this.selectedContact?.id;

                if (!id) {
                    console.error(
                        'Delete failed: No ID found for the selected contact.'
                    );
                    return;
                }

                console.log('Attempting to delete contact with ID:', id);

                // Delete the contact on the server
                this._contactService.deleteContact(id).subscribe({
                    next: () => {
                        // Close the details
                        this.closeDetails();

                        // Optionally reload or refresh the list
                        this._contactService.getContacts().subscribe();
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
    trackByFn(index: number, item: Contact): string {
        return item.id || index.toString(); // Use index as fallback if id is undefined
    }
}
