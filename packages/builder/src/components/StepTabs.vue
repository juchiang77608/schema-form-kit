<script setup lang="ts">
import { t } from '@schema-form-kit/core';
import { toLocales, useBuilderContext, withLocale } from '../context';

const { state, locale, ui } = useBuilderContext();

function rename(stepId: string, value: string): void {
  const step = state.steps.value.find((s) => s.id === stepId);
  if (step) state.renameStep(stepId, withLocale(step.title, locale.value, value) ?? '');
}
</script>

<template>
  <div v-if="state.steps.value.length > 0" class="sfb-steps">
    <div class="sfb-steps__tabs" role="tablist" :aria-label="ui.steps">
      <button
        v-for="(step, index) in state.steps.value"
        :key="step.id"
        type="button"
        role="tab"
        class="sfb-steps__tab"
        :aria-selected="state.activeStep.value?.id === step.id"
        @click="state.activeStepId.value = step.id"
      >
        {{ index + 1 }}. {{ t(step.title, locale) }}
        <span class="sfb-muted">({{ step.fields.length }})</span>
      </button>
      <button type="button" class="sfb-btn sfb-btn--ghost" @click="state.newStep()">
        + {{ ui.addStep }}
      </button>
    </div>
    <div v-if="state.activeStep.value" class="sfb-inline">
      <label class="sfb-label sfb-label--inline">
        {{ ui.stepTitle }}
        <input
          class="sfb-input"
          :value="toLocales(state.activeStep.value.title)[locale]"
          @input="rename(state.activeStep.value!.id, ($event.target as HTMLInputElement).value)"
        />
      </label>
      <button
        type="button"
        class="sfb-btn sfb-btn--danger"
        @click="state.deleteStep(state.activeStep.value!.id)"
      >
        {{ ui.removeStep }}
      </button>
    </div>
  </div>
</template>
