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

import { ContactService } from '../../contact/contact.service';
import { Contact } from '../../contact/contact.types';
import { LanguageService } from '../../language/language.service';
import { Language } from '../../language/language.types';
import { PeopleService } from '../people.service';
import { People, PeoplePagination } from '../people.types';

@Component({
    selector: 'people-list',
    templateUrl: './people.component.html',
    styles: [
        /* language=SCSS */
        `
            .people-grid {
                grid-template-columns: 150px auto 40px;

                @screen sm {
                    grid-template-columns: 150px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 150px 120px auto 112px 72px;
                }

                @screen lg {
                    grid-template-columns: 150px 120px auto 112px 96px 96px 72px;
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
export class PeopleListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    peoples$: Observable<People[]>;
    languages: Language[];
    contacts: Contact[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: PeoplePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedPeople: People | null = null;
    selectedPeopleForm: UntypedFormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _peopleService: PeopleService,
        private _languageService: LanguageService,
        private _contactService: ContactService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the selected people form
        this.selectedPeopleForm = this._formBuilder.group({
            id: ['', [Validators.required]],
            fullName: ['', [Validators.required]],
            preferredName: ['', [Validators.required]],
            searchName: ['', [Validators.required]],
            isPermittedToLogon: ['', [Validators.required]],
            logonName: [''],
            isExternalLogonProvider: ['', [Validators.required]],
            hashedPassword: [''],
            isSystemUser: ['', [Validators.required]],
            isEmployee: ['', [Validators.required]],
            isSalesPerson: ['', [Validators.required]],
            userPreferences: [''],
            contactId: ['', [Validators.required]],
            photo: [''],
            customFields: [''],
            languageId: [''],
            lastEditedBy: ['', [Validators.required]],
            validFrom: ['', [Validators.required]],
            validTo: ['', [Validators.required]],
        });

        this._languageService.languages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((languages: Language[]) => {
                this.languages = languages;
                this._changeDetectorRef.markForCheck();
            });

        this._contactService.contacts$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((contacts: Contact[]) => {
                this.contacts = contacts;
                this._changeDetectorRef.markForCheck();
            });

        // Get the pagination
        this._peopleService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: PeoplePagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the peoples
        this.peoples$ = this._peopleService.peoples$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._peopleService.getPeoples(
                        this.pagination.page,
                        this.pagination.size,
                        this._sort.active || 'searchName',
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
    // Helper method to get contact name by ID
    getContactName(contactId: string): string {
        const contact = this.contacts.find((c) => c.id === contactId);
        return contact ? contact.emailAddress : 'Unknown';
    }

    // Helper method to get language name by ID
    getLanguageName(languageId: string): string {
        const language = this.languages.find((l) => l.id === languageId);
        return language ? language.name : 'Unknown';
    }
    /**
     * After view init
     */
    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            // Set the initial sort
            this._sort.sort({
                id: 'searchName',
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
            // Get peoples if sort or page changes
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._peopleService.getPeoples(
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
     * Toggle people details
     *
     * @param peopleId
     */
    toggleDetails(peopleId: string): void {
        // If the people is already selected...
        if (this.selectedPeople && this.selectedPeople.id === peopleId) {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the people by id
        this._peopleService.getPeopleById(peopleId).subscribe((people) => {
            // Set the selected people
            this.selectedPeople = people;

            // Fill the form
            this.selectedPeopleForm.patchValue(people);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Close the details
     */
    closeDetails(): void {
        this.selectedPeople = null;
    }
    /**
     * Create people
     */
    createPeople(): void {
        // Create the people
        this._peopleService.createPeople().subscribe((newPeople) => {
            // Set the new people as selected
            this.selectedPeople = newPeople;

            // Fill the form
            this.selectedPeopleForm.patchValue(newPeople);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected people using the form data
     */
    updateSelectedPeople(): void {
        // Get the people object
        const people = this.selectedPeopleForm.getRawValue();

        // Ensure the ID is included
        const id = this.selectedPeople?.id; // Extract ID from the selected object

        if (!id) {
            console.error(
                'Update failed: No ID found for the selected people.'
            );
            return;
        }

        // Update the people on the server
        this._peopleService.updatePeople(id, people).subscribe({
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
     * Delete the selected people using the form data
     */
    deleteSelectedPeople(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete people',
            message:
                'Are you sure you want to remove this people? This action cannot be undone!',
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
                // Use the selectedPeople's ID directly
                const id = this.selectedPeople?.id;

                if (!id) {
                    console.error(
                        'Delete failed: No ID found for the selected people.'
                    );
                    return;
                }

                console.log('Attempting to delete people with ID:', id);

                // Delete the people on the server
                this._peopleService.deletePeople(id).subscribe({
                    next: () => {
                        // Close the details
                        this.closeDetails();

                        // Optionally reload or refresh the list
                        this._peopleService.getPeoples().subscribe();
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
    trackByFn(index: number, item: People): string {
        return item.id || index.toString(); // Use index as fallback if id is undefined
    }
}
