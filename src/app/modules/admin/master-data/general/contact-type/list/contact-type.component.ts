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
import { ContactTypeService } from '../contact-type.service';
import { ContactType, ContactTypePagination } from '../contact-type.types';
import { Observable, Subject, debounceTime, map, merge, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'contact-type-list',
    templateUrl: './contact-type.component.html',
    styles: [
        /* language=SCSS */
        `
            .contact-type-grid {
                grid-template-columns: 80px auto;

                @screen sm {
                    grid-template-columns: 80px auto;
                }

                @screen md {
                    grid-template-columns: 120px auto;
                }

                @screen lg {
                    grid-template-columns: 120px auto;
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
export class ContactTypeListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    contactTypes$: Observable<ContactType[]>;
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: ContactTypePagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedContactType: ContactType | null = null;
    selectedContactTypeForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _contactTypeService: ContactTypeService
    ) {}

    ngOnInit(): void {
        // Create the selected contact type form
        this.selectedContactTypeForm = this._formBuilder.group({
            id: [''],
            name: ['', [Validators.required]],
            modifiedDate: [''],
        });

        // Get the pagination
        this._contactTypeService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: ContactTypePagination) => {
                this.pagination = pagination;
                this._changeDetectorRef.markForCheck();
            });

        // Get the contact types
        this.contactTypes$ = this._contactTypeService.contactTypes$;

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._contactTypeService.getContactTypes(
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

    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            this._sort.sort({
                id: 'name',
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
                        return this._contactTypeService.getContactTypes(
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

    toggleDetails(contactTypeId: string): void {
        if (this.selectedContactType && this.selectedContactType.id === contactTypeId) {
            this.closeDetails();
            return;
        }

        this._contactTypeService
            .getContactTypeById(contactTypeId)
            .subscribe((contactType) => {
                this.selectedContactType = contactType;
                this.selectedContactTypeForm.patchValue(contactType);
                this._changeDetectorRef.markForCheck();
            });
    }

    closeDetails(): void {
        this.selectedContactType = null;
    }

    createContactType(): void {
        this._contactTypeService.createContactType().subscribe((newContactType) => {
            this.selectedContactType = newContactType;
            this.selectedContactTypeForm.patchValue(newContactType);
            this._changeDetectorRef.markForCheck();
        });
    }

    updateSelectedContactType(): void {
        const contactType = this.selectedContactTypeForm.getRawValue();
        this._contactTypeService
            .updateContactType(contactType.id, contactType)
            .subscribe(() => {
                this.showFlashMessage('success');
            });
    }

    deleteSelectedContactType(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Contact Type',
            message: 'Are you sure you want to delete this Contact Type?',
            actions: {
                confirm: { label: 'Delete' },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const contactType = this.selectedContactTypeForm.getRawValue();
                this._contactTypeService.deleteContactType(contactType.id).subscribe(() => {
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
