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
import { DeliveryMethodService } from 'app/modules/admin/master-data/general/delivery-method/delivery-method.service'; // Modify import path accordingly
import {
    DeliveryMethod,
    DeliveryMethodPagination,
} from 'app/modules/admin/master-data/general/delivery-method/delivery-method.types'; // Modify import path accordingly
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
    selector: 'delivery-method-list', // Update the selector to reflect delivery-method
    templateUrl: './delivery-method.component.html', // Modify the template path if needed
    styles: [
        /* language=SCSS */
        `
            .delivery-method-grid {
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
export class DeliveryMethodListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    deliveryMethods$: Observable<DeliveryMethod[]>; // Updated to DeliveryMethod

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: DeliveryMethodPagination; // Updated to DeliveryMethodPagination
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedDeliveryMethod: DeliveryMethod | null = null; // Updated to DeliveryMethod
    selectedDeliveryMethodForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _deliveryMethodService: DeliveryMethodService // Updated to DeliveryMethodService
    ) {}

    ngOnInit(): void {
        this.selectedDeliveryMethodForm = this._formBuilder.group({
            deliveryMethodName: ['', Validators.required],
            lastEditedBy: [''],
            validFrom: [''],  // Define validFrom here
            validTo: [''],
        });

        this._deliveryMethodService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: DeliveryMethodPagination) => {
                this.pagination = pagination;
                this._changeDetectorRef.markForCheck();
            });

        this.deliveryMethods$ = this._deliveryMethodService.deliveryMethods$;

        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._deliveryMethodService.getDeliveryMethods(
                        0,
                        10,
                        'deliveryMethodName',
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
                id: 'deliveryMethodName',
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
                        return this._deliveryMethodService.getDeliveryMethods(
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

    toggleDetails(deliveryMethodId: string): void {
        if (this.selectedDeliveryMethod && this.selectedDeliveryMethod.id === deliveryMethodId) {
            this.closeDetails();
            return;
        }

        this._deliveryMethodService
            .getDeliveryMethodById(deliveryMethodId)
            .subscribe((deliveryMethod) => {
                this.selectedDeliveryMethod = deliveryMethod;
                this.selectedDeliveryMethodForm.patchValue(deliveryMethod);
                this._changeDetectorRef.markForCheck();
            });
    }

    closeDetails(): void {
        this.selectedDeliveryMethod = null;
    }

    createDeliveryMethod(): void {
        this._deliveryMethodService.createDeliveryMethod().subscribe((newDeliveryMethod) => {
            this.selectedDeliveryMethod = newDeliveryMethod;
            this.selectedDeliveryMethodForm.patchValue(newDeliveryMethod);
            this._changeDetectorRef.markForCheck();
        });
    }

    updateSelectedDeliveryMethod(): void {
        const deliveryMethod = this.selectedDeliveryMethodForm.getRawValue();
        const id = this.selectedDeliveryMethod?.id;

        if (!id) {
            console.error('Update failed: No ID found for the selected delivery method.');
            return;
        }

        delete deliveryMethod.currentImageIndex;

        this._deliveryMethodService.updateDeliveryMethod(id, deliveryMethod).subscribe({
            next: (response) => {
                this.showFlashMessage('success');
            },
            error: (err) => {
                this.showFlashMessage('error');
            },
        });
    }

    deleteSelectedDeliveryMethod(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete delivery method',
            message: 'Are you sure you want to remove this delivery method? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const id = this.selectedDeliveryMethod?.id;

                if (!id) {
                    console.error('Delete failed: No ID found for the selected delivery method.');
                    return;
                }

                this._deliveryMethodService.deleteDeliveryMethod(id).subscribe({
                    next: () => {
                        this.closeDetails();
                        this._deliveryMethodService.getDeliveryMethods().subscribe();
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

    trackByFn(index: number, item: DeliveryMethod): string {
        return item.id || index.toString();
    }
}
