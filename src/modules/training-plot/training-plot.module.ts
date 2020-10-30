import { Module } from '../../core/module';
import { Stream } from '../../core/stream';
import { MLP } from '../mlp';
import { chart, Chart } from '../chart';
import Component from './training-plot.svelte';

export class TrainingPlot extends Module {
  name = 'training plot';
  description = 'Plot the loss/accuracy during training';

  plotLosses: Chart;
  plotAccuracies: Chart;

  constructor(public model: MLP) {
    super();
    if (!model || !model.$training) {
      throw new Error('This model is incompatible with this module');
    }
    const trainingLoss = new Stream([], true);
    const validationLoss = new Stream([], true);
    this.plotLosses = chart({
      preset: 'line-fast',
      options: {
        xlabel: 'Epoch',
        ylabel: 'Loss',
      },
    });
    this.plotLosses.addSeries(trainingLoss, 'training loss');
    this.plotLosses.addSeries(validationLoss, 'validation loss');
    this.plotLosses.name = 'losses';

    const trainingAccuracy = new Stream([], true);
    const validationAccuracy = new Stream([], true);
    this.plotAccuracies = chart({
      preset: 'line-fast',
      options: {
        xlabel: 'Epoch',
        ylabel: 'Accuracy',
        scales: { y: { suggestedMax: 1 } },
      },
    });
    this.plotAccuracies.addSeries(trainingAccuracy, 'training accuracy');
    this.plotAccuracies.addSeries(validationAccuracy, 'validation accuracy');
    this.plotAccuracies.name = 'accuracies';

    model.$training.subscribe((x) => {
      if (x.status === 'start') {
        trainingLoss.set([]);
        validationLoss.set([]);
        trainingAccuracy.set([]);
        validationAccuracy.set([]);
      } else if (x.status === 'epoch') {
        trainingLoss.set(trainingLoss.value.concat([x.data.loss]));
        validationLoss.set(validationLoss.value.concat([x.data.lossVal]));
        trainingAccuracy.set(trainingAccuracy.value.concat([x.data.accuracy]));
        validationAccuracy.set(validationAccuracy.value.concat([x.data.accuracyVal]));
      }
    });
    this.start();
  }

  mount(targetSelector?: string): void {
    const target = document.querySelector(targetSelector || `#${this.id}`) as HTMLElement;
    if (!target) return;
    this.destroy();
    this.$$.app = new Component({
      target,
      props: {
        id: target.id,
        plotLosses: this.plotLosses,
        plotAccuracies: this.plotAccuracies,
      },
    });
  }
}
