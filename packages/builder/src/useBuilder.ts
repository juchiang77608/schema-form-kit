import { computed, ref, shallowRef, watch } from 'vue';
import {
  BuilderError,
  addField,
  addStep,
  canRedo,
  canUndo,
  changeFieldType,
  commit,
  createHistory,
  disableSteps,
  duplicateField,
  enableSteps,
  exportSchema,
  fieldsAt,
  findReferences,
  getField,
  importSchema,
  moveField,
  moveFieldToStep,
  parentPath,
  redo,
  removeField,
  removeStep,
  renameField,
  undo,
  updateField,
  updateStep,
  type FieldPath,
  type FieldReference,
  type ImportResult,
} from '@schema-form-kit/builder-core';
import {
  fieldsOfStep,
  type FieldSchema,
  type FieldType,
  type FormSchema,
  type StepSchema,
} from '@schema-form-kit/core';

/** What is being dragged: a new field from the palette, or an existing field. */
export type DragPayload = { kind: 'new'; type: FieldType } | { kind: 'move'; path: FieldPath };

/** Where it is dropped: a position among the fields of a group (`""` = top level). */
export interface DropTarget {
  parent: FieldPath;
  index: number;
}

type FieldPatch = Parameters<typeof updateField>[2];

/**
 * Builder state on top of `@schema-form-kit/builder-core`.
 * Every edit goes through `apply`, which records history and turns
 * `BuilderError`s into a message for the UI instead of throwing.
 */
export function useBuilder(
  initial: FormSchema,
  options: { onChange?: (schema: FormSchema) => void } = {},
) {
  const history = shallowRef(createHistory(initial));
  const schema = computed(() => history.value.present);
  const selected = ref<FieldPath | null>(null);
  const activeStepId = ref<string | null>(initial.steps?.[0]?.id ?? null);
  const error = ref<string | null>(null);
  const dragging = shallowRef<DragPayload | null>(null);

  const steps = computed<StepSchema[]>(() => schema.value.steps ?? []);
  const activeStep = computed(
    () => steps.value.find((s) => s.id === activeStepId.value) ?? steps.value[0],
  );
  /** Top-level fields shown on the canvas: the active step's, or all of them. */
  const canvasFields = computed<FieldSchema[]>(() =>
    activeStep.value ? fieldsOfStep(schema.value, activeStep.value) : schema.value.fields,
  );
  const selectedField = computed(() =>
    selected.value ? getField(schema.value, selected.value) : undefined,
  );

  /**
   * Replaces the history and keeps the selection and active step valid.
   * Done synchronously on every change: a watcher would miss changes that
   * cancel out within one tick (e.g. add then undo).
   */
  function setHistory(next: typeof history.value): void {
    history.value = next;
    const current = next.present;
    if (selected.value && !getField(current, selected.value)) selected.value = null;
    if (activeStepId.value && !current.steps?.some((s) => s.id === activeStepId.value)) {
      activeStepId.value = current.steps?.[0]?.id ?? null;
    }
  }

  watch(schema, (next) => options.onChange?.(next));

  function apply(edit: (current: FormSchema) => FormSchema, coalesceKey?: string): boolean {
    try {
      setHistory(commit(history.value, edit(schema.value), { coalesceKey }));
      error.value = null;
      return true;
    } catch (e) {
      if (e instanceof BuilderError) {
        error.value = e.message;
        return false;
      }
      throw e;
    }
  }

  // ---------------------------------------------------------------------------
  // Fields
  // ---------------------------------------------------------------------------

  function add(type: FieldType, target?: DropTarget): FieldPath | null {
    let path: FieldPath | null = null;
    const ok = apply((s) => {
      const parent = target?.parent ?? '';
      const inStep = parent === '' && activeStep.value;
      if (inStep) {
        // Add to the active step, then place it at the drop position within the step.
        const result = addField(s, type, { stepId: activeStep.value!.id });
        path = result.path;
        return target
          ? moveFieldToStep(result.schema, result.path, activeStep.value!.id, target.index)
          : result.schema;
      }
      const result = addField(s, type, { parent, index: target?.index });
      path = result.path;
      return result.schema;
    });
    if (ok && path) selected.value = path;
    return ok ? path : null;
  }

  /** Moves a field within its group (or within the active step). Moving between groups is not supported. */
  function move(path: FieldPath, target: DropTarget): boolean {
    if (parentPath(path) !== target.parent) {
      error.value = 'Fields can only be reordered within the same group';
      return false;
    }
    return apply((s) => {
      if (target.parent === '' && activeStep.value) {
        const list = activeStep.value.fields;
        const from = list.indexOf(path);
        const index = from >= 0 && from < target.index ? target.index - 1 : target.index;
        return moveFieldToStep(s, path, activeStep.value.id, index);
      }
      const siblings = fieldsAt(s, target.parent) ?? [];
      const from = siblings.findIndex((f) => f.name === path.split('.').at(-1));
      const index = from >= 0 && from < target.index ? target.index - 1 : target.index;
      return moveField(s, path, index);
    });
  }

  /** Moves a field one position up or down (keyboard-accessible alternative to dragging). */
  function nudge(path: FieldPath, delta: -1 | 1): boolean {
    const parent = parentPath(path);
    const list =
      parent === '' && activeStep.value
        ? activeStep.value.fields
        : (fieldsAt(schema.value, parent) ?? []).map((f) => f.name);
    const name = path.split('.').at(-1)!;
    const from = list.indexOf(name);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return false;
    return move(path, { parent, index: delta > 0 ? to + 1 : to });
  }

  function drop(target: DropTarget): void {
    const payload = dragging.value;
    dragging.value = null;
    if (!payload) return;
    if (payload.kind === 'new') add(payload.type, target);
    else move(payload.path, target);
  }

  function remove(path: FieldPath): void {
    const removed = apply((s) => removeField(s, path));
    const sel = selected.value;
    if (removed && sel && (sel === path || sel.startsWith(`${path}.`))) selected.value = null;
  }

  function duplicate(path: FieldPath): void {
    let next: FieldPath | null = null;
    if (
      apply((s) => {
        const result = duplicateField(s, path);
        next = result.path;
        return result.schema;
      })
    ) {
      selected.value = next;
    }
  }

  function rename(path: FieldPath, newName: string): boolean {
    let next: FieldPath = path;
    // Read before applying: the selection watcher may run as soon as the schema changes.
    const wasSelected = selected.value === path;
    const ok = apply((s) => {
      const result = renameField(s, path, newName);
      next = result.path;
      return result.schema;
    });
    if (ok && wasSelected) selected.value = next;
    return ok;
  }

  /** Property edits; typing in the same property of the same field is one undo step. */
  function update(path: FieldPath, patch: FieldPatch, property?: string): void {
    apply((s) => updateField(s, path, patch), property ? `${path}:${property}` : undefined);
  }

  function setType(path: FieldPath, type: FieldType): void {
    apply((s) => changeFieldType(s, path, type));
  }

  function references(path: FieldPath): FieldReference[] {
    return findReferences(schema.value, path);
  }

  // ---------------------------------------------------------------------------
  // Form and steps
  // ---------------------------------------------------------------------------

  function updateForm(
    patch: Partial<Pick<FormSchema, 'title' | 'description' | 'submitLabel'>>,
    property?: string,
  ): void {
    apply((s) => ({ ...s, ...patch }), property ? `form:${property}` : undefined);
  }

  function setStepsEnabled(enabled: boolean): void {
    apply((s) => (enabled ? enableSteps(s) : disableSteps(s)));
    activeStepId.value = schema.value.steps?.[0]?.id ?? null;
  }

  function newStep(): void {
    let id: string | null = null;
    if (
      apply((s) => {
        const result = addStep(s);
        id = result.stepId;
        return result.schema;
      })
    ) {
      activeStepId.value = id;
    }
  }

  function renameStep(stepId: string, title: StepSchema['title']): void {
    apply((s) => updateStep(s, stepId, { title }), `step:${stepId}:title`);
  }

  function deleteStep(stepId: string): void {
    apply((s) => removeStep(s, stepId));
  }

  function moveToStep(name: string, stepId: string): void {
    apply((s) => moveFieldToStep(s, name, stepId));
  }

  // ---------------------------------------------------------------------------
  // History and I/O
  // ---------------------------------------------------------------------------

  const canUndoRef = computed(() => canUndo(history.value));
  const canRedoRef = computed(() => canRedo(history.value));

  function undoEdit(): void {
    setHistory(undo(history.value));
  }

  function redoEdit(): void {
    setHistory(redo(history.value));
  }

  function load(json: string): ImportResult {
    const result = importSchema(json);
    if (result.ok) {
      setHistory(commit(history.value, result.schema));
      selected.value = null;
      activeStepId.value = result.schema.steps?.[0]?.id ?? null;
      error.value = null;
    }
    return result;
  }

  return {
    schema,
    history,
    selected,
    selectedField,
    activeStepId,
    activeStep,
    steps,
    canvasFields,
    error,
    dragging,
    canUndo: canUndoRef,
    canRedo: canRedoRef,
    add,
    move,
    nudge,
    drop,
    remove,
    duplicate,
    rename,
    update,
    setType,
    references,
    updateForm,
    setStepsEnabled,
    newStep,
    renameStep,
    deleteStep,
    moveToStep,
    undo: undoEdit,
    redo: redoEdit,
    load,
    exportJson: () => exportSchema(schema.value),
  };
}

export type BuilderState = ReturnType<typeof useBuilder>;
