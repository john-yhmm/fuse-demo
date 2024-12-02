import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { LanguageService } from './language/language.service';
import { LanguageListComponent } from './language/list/language.component';
import { AddressTypeComponent } from './address-type/address-type.component';
import { AddressTypeListComponent } from './address-type/list/address-type.component';
import { AddressTypeService } from './address-type/address-type.service';
import { CountryTypeComponent } from './country-type/country-type.component';
import { CountryTypeService } from './country-type/country-type.service';
import { CountryTypeListComponent } from './country-type/list/country-type.component';
import { PaymentMethodComponent } from './payment-method/payment-method.component';
import { PaymentMethodListComponent } from './payment-method/list/payment-method.component';
import { PaymentMethodService } from './payment-method/payment-method.service';
import { DeliveryMethodComponent } from './delivery-method/delivery-method.component';
import { DeliveryMethodService } from './delivery-method/delivery-method.service';
import { DeliveryMethodListComponent } from './delivery-method/list/delivery-method.component';
import { PhnoTypeComponent } from './phno-type/phno-type.component'
import { PhnoTypeService } from './phno-type/phno-type.service';
import { PhnoTypeListComponent } from './phno-type/list/phno-type.component'
import { CardTypeComponent } from './card-type/card-type.component';
import { CardTypeService } from './card-type/card-type.service';
import { CardTypeListComponent } from './card-type/list/card-type.component';
import { CreditCardTypeComponent } from './credit-card-type/credit-card-type.component';
import { CreditCardTypeListComponent } from './credit-card-type/list/credit-card-type.component';
import { CreditCardTypeService } from './credit-card-type/credit-card-type.service';
import { UnitMeasureComponent } from './unit-measure/unit-measure.component';
import { UnitMeasureListComponent } from './unit-measure/list/unit-measure.component';
import { UnitMeasureService } from './unit-measure/unit-measure.service';
import { GeoLocationComponent } from './geo-location/geo-location.component';
import { GeoLocationService } from './geo-location/geo-location.service';
import { GeoLocationListComponent } from './geo-location/list/geo-location.component';

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
        path: 'address-type',
        component: AddressTypeComponent,
        children: [
            {
                path: '',
                component: AddressTypeListComponent,
                resolve: {
                    addressTypes: () => inject(AddressTypeService).getAddressTypes(),
                },
            },
        ],
    },
    {
        path: 'country-type',
        component: CountryTypeComponent,
        children: [
            {
                path: '',
                component: CountryTypeListComponent,
                resolve: {
                    countryTypes: () => inject(CountryTypeService).getCountryTypes(),
                },
            },
        ],
    },
    {
        path: 'payment-method',
        component: PaymentMethodComponent,
        children: [
            {
                path: '',
                component: PaymentMethodListComponent,
                resolve: {
                    paymentMethods: () => inject(PaymentMethodService).getPaymentMethods(),
                },
            },
        ],
    },
    {
        path: 'delivery-method',
        component: DeliveryMethodComponent,
        children: [
            {
                path: '',
                component: DeliveryMethodListComponent,
                resolve: {
                    deliveryMethods: () => inject(DeliveryMethodService).getDeliveryMethods(),
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
    {
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
    },
    {
        path: 'unit-measure',
        component: UnitMeasureComponent,
        children:[
            {
                path: '',
                component: UnitMeasureListComponent,
                resolve: {
                    creditcardtypes: () => inject(UnitMeasureService).getUnitMeasures(),
                }
            }
        ]
    },
    {
        path: 'geo-location',
        component: GeoLocationComponent,
        children: [
            {
                path: '',
                component: GeoLocationListComponent,
                resolve: {
                    geoLocations: () => inject(GeoLocationService).getGeoLocations(),
                },
            },
        ],
    },
] as Routes;
