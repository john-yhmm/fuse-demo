import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
  } from '@angular/core';
  import { RouterOutlet } from '@angular/router';
  
  @Component({
    selector: 'payment-method',
    templateUrl: './payment-method.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterOutlet],
  })
  export class PaymentMethodComponent {
    constructor() {}  
  }
  