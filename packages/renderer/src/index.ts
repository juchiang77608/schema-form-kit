import type { App, Plugin } from 'vue';
import SchemaForm from './SchemaForm.vue';
import FieldRenderer from './FieldRenderer.vue';

export { SchemaForm, FieldRenderer };
export {
  useSchemaForm,
  type UseSchemaFormOptions,
  type SchemaFormState,
} from './composables/useSchemaForm';
export {
  useFormContext,
  FORM_CONTEXT,
  type FieldComponentProps,
  type FieldComponentMap,
  type FormContext,
} from './context';
export * from './fields';

/** Optional plugin: `app.use(SchemaFormKit)` registers `<SchemaForm>` globally. */
export const SchemaFormKit: Plugin = {
  install(app: App) {
    app.component('SchemaForm', SchemaForm);
  },
};
