import { Text, TextOptions } from './text.module';

export function text(options: Partial<TextOptions>): Text {
  return new Text(options);
}
