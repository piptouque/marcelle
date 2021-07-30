import { Component } from '../../core/component';
import { Stream } from '../../core/stream';
import { SliderOptions } from '../../ui/components/slider-types';
import View from './slider.view.svelte';

export class Slider extends Component {
  title = 'slider';

  $values: Stream<number[]>;
  $options: Stream<SliderOptions>;
  constructor(options: Partial<SliderOptions>) {
    super();
    this.$options = new Stream(
      {
        values: [0.2],
        min: 0,
        max: 1,
        step: 0.01,
        range: 'min',
        float: true,
        vertical: false,
        pips: false,
        pipstep: undefined,
        springValues: {
          stiffness: 0.2,
          damping: 0.8,
        },
        formatter: (x) => x,
        ...options,
      } as SliderOptions,
      true,
    );
    this.start();
  }

  mount(target?: HTMLElement): void {
    const t = target || document.querySelector(`#${this.id}`);
    if (!t) return;
    this.destroy();
    this.$$.app = new View({
      target: t,
      props: {
        title: this.title,
        values: this.$values,
        options: this.$options,
      },
    });
  }
}
