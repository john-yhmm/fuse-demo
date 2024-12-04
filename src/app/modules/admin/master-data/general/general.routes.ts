import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { LanguageService } from './language/language.service';
import { LanguageListComponent } from './language/list/language.component';
import { PaymentAvenueComponent } from './payment-avenue/payment-avenue.component';
import { PaymentAvenueService } from './payment-avenue/payment-avenue.service';
import { PaymentAvenueListComponent } from './payment-avenue/list/payment-avenue.component';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '',
    },
    {
        path: 'language',
        component: LanguageComponent,
        children: [
            {
                path: '',
                component: LanguageListComponent,
                resolve: {
                    languages: () => inject(LanguageService).getLanguages(),
                },
            },
        ],
    },
    {
        path: 'payment-avenue',
        component: PaymentAvenueComponent,
        children: [
            {
                path: '',
                component: PaymentAvenueListComponent,
                resolve: {
                    paymentAvenues: () =>
                        inject(PaymentAvenueService).getPaymentAvenues(),
                },
            },
        ],
    },
] as Routes;