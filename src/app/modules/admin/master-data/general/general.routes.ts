import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { LanguageService } from './language/language.service';
import { LanguageListComponent } from './language/list/language.component';
import { PhnoTypeComponent } from './phno-type/phno-type.component'
import { PhnoTypeService } from './phno-type/phno-type.service';
import { PhnoTypeListComponent } from './phno-type/list/phno-type.component'

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
        path: 'phno-type',
        component: PhnoTypeComponent,
        children: [
            {
                path: '',
                component: PhnoTypeListComponent,
                resolve: {
                    countryTypes: () => inject(PhnoTypeService).getPhnoTypes(),
                },
            },
        ],
    },
] as Routes;
