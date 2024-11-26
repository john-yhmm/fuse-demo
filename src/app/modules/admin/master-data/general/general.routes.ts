import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { LanguageService } from './language/language.service';
import { LanguageListComponent } from './language/list/language.component';
import { CardTypeComponent } from './card-type/card-type.component';
import { CardTypeService } from './card-type/card-type.service';
import { CardTypeListComponent } from './card-type/list/card-type.component';

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
    },{
        path: 'card-type',
        component: CardTypeComponent,
        children: [
            {
                path: '',
                component: CardTypeListComponent,
                resolve: {
                    cardTypes: () => inject(CardTypeService).getCardTypes(),
                },
            },
        ],
    },

] as Routes;
