import { Module } from '../../core/module';
import { Stream } from '../../core/stream';
import { ObjectDetectorResults } from '../../core/object-detector';
import Component from './vis-object-detection.svelte';

export class VisObjectDetection extends Module {
  name = 'Visualize Object Detections';
  description = 'Visualize the bounding box of detected objects';

  $objectDetectionResults: Stream<ObjectDetectorResults>;
  $imgStream: Stream<ImageData>;

  constructor(imgStream: Stream<ImageData>, objDectectionRes: Stream<ObjectDetectorResults>) {
    super();
    this.$imgStream = imgStream;
    this.$objectDetectionResults = objDectectionRes;
    this.start();
  }

  mount(targetSelector?: string): void {
    const target = document.querySelector(targetSelector || `#${this.id}`) as HTMLElement;
    if (!target) return;
    this.destroy();
    this.$$.app = new Component({
      target,
      props: {
        title: this.name,
        imageStream: this.$imgStream,
        objectDetectionResults: this.$objectDetectionResults,
      },
    });
  }
}
