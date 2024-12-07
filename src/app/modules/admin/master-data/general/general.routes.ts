import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { LanguageService } from './language/language.service';
import { LanguageListComponent } from './language/list/language.component';

import { CurrencyComponent } from './currency/currency.component';
import { CurrencyService } from './currency/currency.service';
import { CurrencyListComponent } from './currency/list/currency.component';
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
        path: 'currency',
        component: CurrencyComponent,
        children: [
            {
                path: '',
                component: CurrencyListComponent,
                resolve: {
                    currencies: () => inject(CurrencyService).getCurrencies(),
                },
            },
        ],
    },
] as Routes;
