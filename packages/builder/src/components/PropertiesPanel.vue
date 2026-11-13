<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { palette, parentPath } from '@schema-form-kit/builder-core';
import {
  t,
  type Condition,
  type FieldType,
  type I18nText,
  type Option,
  type ValidationRule,
} from '@schema-form-kit/core';
import { toLocales, useBuilderContext, withLocale } from '../context';
import ConditionEditor from './ConditionEditor.vue';
import OptionsEditor from './OptionsEditor.vue';
import RulesEditor from './RulesEditor.vue';

const { state, locale, ui } = useBuilderContext();

const path = computed(() => state.selected.value);
const field = computed(() => state.selectedField.value);
const nameDraft = ref('');
watch(field, (f) => (nameDraft.value = f?.name ?? ''), { immediate: true });

const isTopLevel = computed(() => path.value !== null && parentPath(path.value) === '');
const stepOfField = computed(
  () => state.steps.value.find((s) => field.value && s.fields.includes(field.value.name))?.id,
);

function text(value: I18nText | undefined): string {
  return toLocales(value)[locale.value];
}

function setText(
  property: 'label' | 'description' | 'placeholder' | 'itemLabel',
  value: string,
): void {
  if (!path.value || !field.value) return;
  const current = (field.value as unknown as Record<string, I18nText | undefined>)[property];
  const next = withLocale(current, locale.value, value);
  // The label is required: keep an empty string rather than removing it.
  update({ [property]: property === 'label' ? (next ?? '') : next }, `${property}:${locale.value}`);
}

function applyName(): void {
  if (path.value && nameDraft.value !== field.value?.name)
    state.rename(path.value, nameDraft.value.trim());
}

function remove(): void {
  if (!path.value) return;
  const refs = state.references(path.value);
  if (
    refs.length > 0 &&
    !window.confirm(`${ui.value.removeConfirm}\n\n${refs.map((r) => r.from).join('\n')}`)
  )
    return;
  state.remove(path.value);
}

type Patch = Parameters<typeof state.update>[1];

function update(patch: Record<string, unknown>, property?: string): void {
  if (path.value) state.update(path.value, patch as Patch, property);
}
</script>

<template>
  <section class="sfb-panel sfb-props" :aria-label="ui.properties">
    <h2 class="sfb-panel__title">{{ ui.properties }}</h2>

    <!-- Form settings when nothing is selected -->
    <div v-if="!field" class="sfb-props__body">
      <p class="sfb-muted">{{ ui.noSelection }}</p>
      <h3 class="sfb-props__subtitle">{{ ui.form }}</h3>
      <label class="sfb-label">
        {{ ui.title }} · {{ ui.locale[locale] }}
        <input
          class="sfb-input"
          :value="text(state.schema.value.title)"
          @input="
            state.updateForm(
              {
                title:
                  withLocale(
                    state.schema.value.title,
                    locale,
                    ($event.target as HTMLInputElement).value,
                  ) ?? '',
              },
              `title:${locale}`,
            )
          "
        />
      </label>
      <label class="sfb-label">
        {{ ui.description }}
        <textarea
          class="sfb-input"
          rows="2"
          :value="text(state.schema.value.description)"
          @input="
            state.updateForm(
              {
                description: withLocale(
                  state.schema.value.description,
                  locale,
                  ($event.target as HTMLTextAreaElement).value,
                ),
              },
              `description:${locale}`,
            )
          "
        />
      </label>
      <label class="sfb-checkbox">
        <input
          type="checkbox"
          :checked="state.steps.value.length > 0"
          @change="state.setStepsEnabled(($event.target as HTMLInputElement).checked)"
        />
        {{ ui.steps }}
      </label>
    </div>

    <!-- Field properties -->
    <div v-else class="sfb-props__body">
      <label class="sfb-label">
        {{ ui.label }} · {{ ui.locale[locale] }}
        <input
          class="sfb-input"
          data-testid="prop-label"
          :value="text(field.label)"
          @input="setText('label', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <form class="sfb-label" @submit.prevent="applyName">
        <label :for="`sfb-name-${path}`">{{ ui.name }}</label>
        <div class="sfb-inline">
          <input
            :id="`sfb-name-${path}`"
            v-model="nameDraft"
            class="sfb-input"
            data-testid="prop-name"
            spellcheck="false"
          />
          <button type="submit" class="sfb-btn" :disabled="nameDraft === field.name">
            {{ ui.rename }}
          </button>
        </div>
        <small class="sfb-muted">{{ ui.nameHint }}</small>
      </form>

      <label class="sfb-label">
        {{ ui.type }}
        <select
          class="sfb-input"
          data-testid="prop-type"
          :value="field.type"
          @change="
            path && state.setType(path, ($event.target as HTMLSelectElement).value as FieldType)
          "
        >
          <option v-for="p in palette" :key="p.type" :value="p.type">
            {{ t(p.label, locale) }}
          </option>
        </select>
      </label>

      <label class="sfb-label">
        {{ ui.description }}
        <input
          class="sfb-input"
          :value="text(field.description)"
          @input="setText('description', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label
        v-if="['text', 'email', 'textarea', 'number', 'select'].includes(field.type)"
        class="sfb-label"
      >
        {{ ui.placeholder }}
        <input
          class="sfb-input"
          :value="text(field.placeholder)"
          @input="setText('placeholder', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label v-if="field.type === 'array'" class="sfb-label">
        {{ ui.itemLabel }}
        <input
          class="sfb-input"
          :value="text('itemLabel' in field ? field.itemLabel : undefined)"
          @input="setText('itemLabel', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <div class="sfb-row">
        <label class="sfb-checkbox">
          <input
            type="checkbox"
            data-testid="prop-required"
            :checked="field.required === true"
            :disabled="typeof field.required === 'object'"
            @change="update({ required: ($event.target as HTMLInputElement).checked || undefined })"
          />
          {{ ui.required }}
        </label>
        <label class="sfb-row__item">
          {{ ui.width }}
          <input
            class="sfb-input sfb-input--short"
            type="number"
            min="1"
            max="12"
            :value="field.colSpan ?? 12"
            @change="
              update({
                colSpan:
                  Number(($event.target as HTMLInputElement).value) === 12
                    ? undefined
                    : Number(($event.target as HTMLInputElement).value),
              })
            "
          />
        </label>
      </div>

      <OptionsEditor
        v-if="'options' in field"
        :model-value="field.options"
        @update:model-value="(options: Option[]) => update({ options }, 'options')"
      />

      <RulesEditor
        :type="field.type"
        :model-value="field.validations"
        @update:model-value="(validations: ValidationRule[] | undefined) => update({ validations })"
      />

      <ConditionEditor
        v-if="path"
        :path="path"
        :model-value="field.visibleWhen"
        @update:model-value="(visibleWhen: Condition | undefined) => update({ visibleWhen })"
      />

      <label v-if="isTopLevel && state.steps.value.length > 1" class="sfb-label">
        {{ ui.moveToStep }}
        <select
          class="sfb-input"
          :value="stepOfField"
          @change="
            field && state.moveToStep(field.name, ($event.target as HTMLSelectElement).value)
          "
        >
          <option v-for="s in state.steps.value" :key="s.id" :value="s.id">
            {{ t(s.title, locale) }}
          </option>
        </select>
      </label>

      <div class="sfb-props__actions">
        <button type="button" class="sfb-btn" @click="path && state.duplicate(path)">
          {{ ui.duplicate }}
        </button>
        <button
          type="button"
          class="sfb-btn sfb-btn--danger"
          data-testid="prop-remove"
          @click="remove"
        >
          {{ ui.remove }}
        </button>
      </div>
    </div>
  </section>
</template>
