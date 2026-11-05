import type { Component } from 'vue';
import type { FieldType } from '@schema-form-kit/core';
import ArrayField from './ArrayField.vue';
import CheckboxField from './CheckboxField.vue';
import DateField from './DateField.vue';
import NumberField from './NumberField.vue';
import RadioField from './RadioField.vue';
import SelectField from './SelectField.vue';
import SwitchField from './SwitchField.vue';
import TextField from './TextField.vue';

export const defaultComponents: Record<FieldType, Component> = {
  text: TextField,
  email: TextField,
  textarea: TextField,
  number: NumberField,
  date: DateField,
  select: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  switch: SwitchField,
  array: ArrayField,
};

export {
  ArrayField,
  CheckboxField,
  DateField,
  NumberField,
  RadioField,
  SelectField,
  SwitchField,
  TextField,
};
