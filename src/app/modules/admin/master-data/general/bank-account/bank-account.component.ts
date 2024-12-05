import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({
    selector: 'bank-account',
    templateUrl: './bank-account.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterOutlet],
})
export class BankAccountComponent {
    /**
     * Constructor
     */
    constructor() {}
}