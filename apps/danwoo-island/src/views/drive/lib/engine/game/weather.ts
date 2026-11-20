import gsap from 'gsap';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { lerp, remapClamp } from '@views/drive/lib/engine/game/utilities/maths';

type WeatherName = 'temperature' | 'humidity' | 'electricField' | 'clouds' | 'wind' | 'rain' | 'snow';
type WeatherOverrides = Partial<Record<WeatherName, number>>;

const DEFAULT_OVERRIDE_DURATION = 5;
const NOISE_FREQUENCY = {
  temperature: 0.4,
  humidity: 0.36,
  electricField: 0.53,
  clouds: 0.44,
  wind: 1,
} as const;
const TEMPERATURE_AMPLITUDE = 7.5;
const HUMIDITY_AMPLITUDE = 0.2;

function noise(x: number): number {
  return Math.sin(x) * Math.sin(x * 1.678) * Math.sin(x * 2.345);
}

function cycleNoise(frequency: number): number {
  return noise(getGame().dayCycles.absoluteProgress * frequency);
}

class WeatherProperty {
  value: number;
  overrideValue: number | null = null;

  constructor(
    readonly name: WeatherName,
    readonly min: number,
    readonly max: number,
    readonly compute: () => number,
  ) {
    this.value = compute();
  }
}

class WeatherOverride {
  strength = 0;
  readonly #properties: readonly WeatherProperty[];

  constructor(properties: readonly WeatherProperty[]) {
    this.#properties = properties;
  }

  start(values: WeatherOverrides = {}, duration = DEFAULT_OVERRIDE_DURATION): void {
    for (const property of this.#properties) property.overrideValue = values[property.name] ?? null;
    this.#tweenStrength(1, duration);
  }

  end(duration = DEFAULT_OVERRIDE_DURATION): void {
    this.#tweenStrength(0, duration);
  }

  #tweenStrength(strength: number, duration: number): void {
    if (duration === 0) this.strength = strength;
    else gsap.to(this, { strength, duration, overwrite: true });
  }
}

export class Weather {
  readonly temperature: WeatherProperty;
  readonly humidity: WeatherProperty;
  readonly electricField: WeatherProperty;
  readonly clouds: WeatherProperty;
  readonly wind: WeatherProperty;
  readonly rain: WeatherProperty;
  readonly snow: WeatherProperty;
  readonly override: WeatherOverride;
  readonly #properties: WeatherProperty[];

  constructor() {
    const { dayCycles, yearCycles, ticker } = getGame();
    this.temperature = new WeatherProperty('temperature', -15, 40, () => {
      const variation = cycleNoise(NOISE_FREQUENCY.temperature) * TEMPERATURE_AMPLITUDE;
      return yearCycles.numberOf('temperature') + dayCycles.numberOf('temperature') + variation;
    });
    this.humidity = new WeatherProperty(
      'humidity',
      0,
      1,
      () => yearCycles.numberOf('humidity') + cycleNoise(NOISE_FREQUENCY.humidity) * HUMIDITY_AMPLITUDE,
    );
    this.electricField = new WeatherProperty(
      'electricField',
      -1,
      1,
      () => dayCycles.numberOf('electricField') * cycleNoise(NOISE_FREQUENCY.electricField),
    );
    this.clouds = new WeatherProperty('clouds', -1, 1, () => cycleNoise(NOISE_FREQUENCY.clouds));
    this.wind = new WeatherProperty('wind', 0, 1, () => cycleNoise(NOISE_FREQUENCY.wind) * 0.5 + 0.5);
    this.rain = new WeatherProperty(
      'rain',
      0,
      1,
      () => remapClamp(this.humidity.value, [0.65, 1], [0, 1]) * remapClamp(this.clouds.value, [0, 1], [0, 1]),
    );
    this.snow = new WeatherProperty('snow', -1, 1, () => {
      const rainRatio = remapClamp(this.rain.value, [0.05, 0.3], [0, 1]);
      const freezeRatio = remapClamp(this.temperature.value, [0, -5], [0, 1]);
      const meltRatio = remapClamp(this.temperature.value, [0, 10], [0, -1]);
      return rainRatio * freezeRatio + meltRatio;
    });
    this.#properties = [
      this.temperature,
      this.humidity,
      this.electricField,
      this.clouds,
      this.wind,
      this.rain,
      this.snow,
    ];
    this.override = new WeatherOverride(this.#properties);
    ticker.events.on('tick', () => this.update(), TICK_ORDER.weather);
  }

  update(): void {
    const { strength } = this.override;
    for (const property of this.#properties) {
      const value = property.compute();
      const { overrideValue } = property;
      const isOverriding = strength > 0 && overrideValue !== null;
      property.value = isOverriding ? lerp(value, overrideValue, strength) : value;
    }
  }
}
