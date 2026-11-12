<script setup lang="ts">
import { computed } from 'vue';
import { RULES_BY_TYPE } from '@schema-form-kit/builder-core';
import type { FieldType, ValidationRule } from '@schema-form-kit/core';
import { useBuilderContext } from '../context';

const props = defineProps<{ type: FieldType; modelValue: ValidationRule[] | undefined }>();
const emit = defineEmits<{ 'update:modelValue': [value: ValidationRule[] | undefined] }>();
const { ui } = useBuilderContext();

type RuleType = ValidationRule['type'];
const rules = computed(() => props.modelValue ?? []);
/** Rule types that fit this field and are not used yet (custom validators need code, so they are JSON-only). */
const available = computed<RuleType[]>(() =>
  RULES_BY_TYPE[props.type].filter((r) => r !== 'custom' && !rules.value.some((x) => x.type === r)),
);

function emitRules(list: ValidationRule[]): void {
  emit('update:modelValue', list.length > 0 ? list : undefined);
}

function add(type: RuleType): void {
  const rule = (type === 'pattern' ? { type, value: '.*' } : { type, value: 1 }) as ValidationRule;
  emitRules([...rules.value, rule]);
}

function setValue(index: number, raw: string): void {
  emitRules(
    rules.value.map((rule, i) => {
      if (i !== index || rule.type === 'custom') return rule;
      if (rule.type === 'pattern') return { ...rule, value: raw };
      const n = Number(raw);
      return Number.isNaN(n) ? rule : { ...rule, value: n };
    }),
  );
}

function remove(index: number): void {
  emitRules(rules.value.filter((_, i) => i !== index));
}
</script>

<template>
  <fieldset class="sfb-rules">
    <legend>{{ ui.rules }}</legend>
    <div v-for="(rule, index) in rules" :key="rule.type" class="sfb-rules__row">
      <label class="sfb-rules__name" :for="`sfb-rule-${index}`">{{
        ui.ruleNames[rule.type]
      }}</label>
      <input
        v-if="rule.type !== 'custom'"
        :id="`sfb-rule-${index}`"
        class="sfb-input sfb-input--short"
        :type="rule.type === 'pattern' ? 'text' : 'number'"
        :value="String(rule.value)"
        @change="setValue(index, ($event.target as HTMLInputElement).value)"
      />
      <code v-else :id="`sfb-rule-${index}`">{{ rule.name }}</code>
      <button type="button" class="sfb-icon-btn" :aria-label="ui.remove" @click="remove(index)">
        ✕
      </button>
    </div>
    <select
      v-if="available.length > 0"
      class="sfb-input"
      :aria-label="ui.addRule"
      value=""
      @change="
        add(($event.target as HTMLSelectElement).value as RuleType);
        ($event.target as HTMLSelectElement).value = '';
      "
    >
      <option value="" disabled>+ {{ ui.addRule }}</option>
      <option v-for="r in available" :key="r" :value="r">{{ ui.ruleNames[r] }}</option>
    </select>
  </fieldset>
</template>
