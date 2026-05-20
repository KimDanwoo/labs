export type Gender = 'male' | 'female';

export type FormState = {
  name: string;
  gender: Gender;
  birthDate: string;
  shichen: string;
  unknownTime: boolean;
  region: string;
  note: string;
};

export type ShichenOption = {
  value: string;
  label: string;
  timeRange: string;
  hour: number;
  minute: number;
};

export type RegionOption = {
  value: string;
  label: string;
  longitude: number;
};

export type SelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  options: number[];
  placeholder: string;
  suffix: string;
};
