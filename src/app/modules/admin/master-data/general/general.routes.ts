import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { LanguageService } from './language/language.service';
import { LanguageListComponent } from './language/list/language.component';
import { CreditCardTypeComponent } from './credit-card-type/credit-card-type.component';
import { CreditCardTypeListComponent } from './credit-card-type/list/credit-card-type.component';
import { CreditCardTypeService } from './credit-card-type/credit-card-type.service';

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
        path: 'credit-card-type',
        component: CreditCardTypeComponent,
        children:[
            {
                path: '',
                component: CreditCardTypeListComponent,
                resolve: {
                    creditcardtypes: () => inject(CreditCardTypeService).getCreditCardTypes(),
                }
            }
        ]
    }
] as Routes;
