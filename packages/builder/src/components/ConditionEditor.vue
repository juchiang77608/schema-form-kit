<script setup lang="ts">
import { computed } from 'vue';
import { getField, parentPath, walkFields, type FieldPath } from '@schema-form-kit/builder-core';
import {
  t,
  type ComparisonOperator,
  type Condition,
  type FieldCondition,
} from '@schema-form-kit/core';
import { useBuilderContext } from '../context';

/**
 * Edits a single `field op value` condition. Combined conditions (all / any / not)
 * are shown read-only; they can be edited in the JSON.
 */
const props = defineProps<{
  /** The field that owns the condition. */
  path: FieldPath;
  modelValue: Condition | undefined;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: Condition | undefined] }>();

const { state, locale, ui } = useBuilderContext();

const OPS: ComparisonOperator[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'includes',
  'empty',
  'notEmpty',
];
const NO_VALUE = new Set<ComparisonOperator>(['empty', 'notEmpty']);

const simple = computed<FieldCondition | null>(() =>
  props.modelValue && 'field' in props.modelValue ? props.modelValue : null,
);
const isComplex = computed(() => props.modelValue !== undefined && simple.value === null);

/** Fields this field may depend on: top-level fields, plus siblings inside the same group. */
const candidates = computed(() => {
  const own = props.path;
  const scope = parentPath(own);
  const list: Array<{ ref: string; label: string }> = [];
  walkFields(state.schema.value.fields, (field, path) => {
    const parent = parentPath(path);
    if (path === own) return;
    if (parent === '' || parent === scope) {
      list.push({
        ref: parent === scope ? field.name : path,
        label: `${t(field.label, locale.value)} (${field.name})`,
      });
    }
  });
  return list;
});

const targetField = computed(() => {
  if (!simple.value) return undefined;
  const scope = parentPath(props.path);
  return (
    (scope && getField(state.schema.value, `${scope}.${simple.value.field}`)) ||
    getField(state.schema.value, simple.value.field)
  );
});

const valueOptions = computed(() => {
  const field = targetField.value;
  return field && 'options' in field ? field.options : null;
});

function coerce(raw: string): unknown {
  const field = targetField.value;
  if (field?.type === 'switch') return raw === 'true';
  if (
    field?.type === 'number' ||
    (valueOptions.value && valueOptions.value.some((o) => typeof o.value === 'number'))
  ) {
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }
  return raw;
}

function setField(ref: string): void {
  if (ref === '') emit('update:modelValue', undefined);
  else
    emit('update:modelValue', {
      field: ref,
      op: simple.value?.op ?? 'eq',
      value: simple.value?.value ?? '',
    });
}

function setOp(op: ComparisonOperator): void {
  if (!simple.value) return;
  const next: FieldCondition = { field: simple.value.field, op };
  if (!NO_VALUE.has(op)) next.value = simple.value.value ?? '';
  emit('update:modelValue', next);
}

function setValue(raw: string): void {
  if (!simple.value) return;
  emit('update:modelValue', { ...simple.value, value: coerce(raw) });
}
</script>

<template>
  <fieldset class="sfb-condition">
    <legend>{{ ui.visibleWhen }}</legend>
    <p v-if="isComplex" class="sfb-muted">{{ ui.complexCondition }}</p>
    <template v-else>
      <select
        class="sfb-input"
        :aria-label="ui.showWhen"
        :value="simple?.field ?? ''"
        @change="setField(($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ ui.always }}</option>
        <option v-for="c in candidates" :key="c.ref" :value="c.ref">{{ c.label }}</option>
      </select>
      <template v-if="simple">
        <select
          class="sfb-input"
          aria-label="operator"
          :value="simple.op"
          @change="setOp(($event.target as HTMLSelectElement).value as ComparisonOperator)"
        >
          <option v-for="op in OPS" :key="op" :value="op">
            {{ ui.ops[op as keyof typeof ui.ops] }}
          </option>
        </select>
        <template v-if="!NO_VALUE.has(simple.op)">
          <select
            v-if="valueOptions"
            class="sfb-input"
            aria-label="value"
            :value="String(simple.value ?? '')"
            @change="setValue(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="o in valueOptions" :key="String(o.value)" :value="String(o.value)">
              {{ t(o.label, locale) }}
            </option>
          </select>
          <select
            v-else-if="targetField?.type === 'switch'"
            class="sfb-input"
            aria-label="value"
            :value="String(simple.value)"
            @change="setValue(($event.target as HTMLSelectElement).value)"
          >
            <option value="true">ON</option>
            <option value="false">OFF</option>
          </select>
          <input
            v-else
            class="sfb-input"
            aria-label="value"
            :value="String(simple.value ?? '')"
            @change="setValue(($event.target as HTMLInputElement).value)"
          />
        </template>
      </template>
    </template>
  </fieldset>
</template>
