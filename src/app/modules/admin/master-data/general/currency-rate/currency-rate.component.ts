import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({
    selector: 'currency-rate',
    templateUrl: './currency-rate.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterOutlet],
})
export class CurrencyRateComponent {
    /**
     * Constructor
     */
    constructor() {}
}