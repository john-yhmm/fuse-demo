import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { LanguageService } from './language/language.service';
import { LanguageListComponent } from './language/list/language.component';
import { CreditCardTypeComponent } from './ccardtype/creditcardtype.component';
import { CreditCardTypeListComponent } from './ccardtype/list/creditcardtype.component';
import { CreditCardTypeService } from './ccardtype/creditcardtype.service';

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
        path: 'creditcardtype',
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
