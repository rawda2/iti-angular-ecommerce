import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priceRange',
})
export class PriceRangePipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
