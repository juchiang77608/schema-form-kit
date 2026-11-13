# API 參考

所有套件都用 TypeScript 撰寫，並附上型別。本頁列出公開的匯出；原始碼裡的註解有更多細節。

## `@schema-form-kit/core`

### 型別

`FormSchema`、`FieldSchema`、`FieldType`、`StepSchema`、`Option`、`I18nText`、`Locale`、
`Condition`（`FieldCondition`、`AllCondition`、`AnyCondition`、`NotCondition`）、
`ComparisonOperator`、`ValidationRule`、`FormValues`、`FormErrors`、`CustomValidator`、
`CustomValidatorContext`、`ValidateOptions`。見 [Schema 與欄位](../guide/schema)。

### 條件與欄位

| 匯出                                    | 說明                                                      |
| --------------------------------------- | --------------------------------------------------------- |
| `evaluateCondition(condition, ctx)`     | 評估一個條件。`ctx` 是 `{ root: values, scope?: item }`。 |
| `conditionDependencies(condition)`      | 條件讀取的欄位名稱。                                      |
| `isFieldVisible(field, ctx)`            | `visibleWhen` 是否成立。                                  |
| `isFieldRequired(field, ctx)`           | `required` 是否為 `true`，或其條件是否成立。              |
| `visibleFields(fields, ctx)`            | 看得到的欄位。                                            |
| `effectiveValues(schema, values)`       | 連動移除隱藏答案後的值。別名：`pruneHiddenValues`。       |
| `buildInitialValues(schema, existing?)` | 填入預設值，並保留 `existing`。                           |
| `initialItem(fields)`                   | 可重複群組的一筆新資料。                                  |
| `findField(schema, name)`               | 依名稱取得頂層欄位。                                      |
| `getSteps(schema)`                      | 步驟。沒有步驟的表單會有一個隱含步驟。                    |
| `fieldsOfStep(schema, step)`            | 某個步驟的欄位，依序排列。                                |
| `isEmpty(value)`                        | `undefined`、`null`、空白文字或空陣列。                   |

### 驗證

| 匯出                                            | 說明                                        |
| ----------------------------------------------- | ------------------------------------------- |
| `validateForm(schema, values, options?)`        | 整份表單的錯誤，以值路徑為鍵。              |
| `validateStep(schema, index, values, options?)` | 某一個步驟的錯誤。                          |
| `validateFields(fields, values, options?)`      | 較低階；不會先移除隱藏的值。                |
| `hasErrors(errors)`                             | 是否至少有一個錯誤。                        |
| `errorsUnder(errors, path)`                     | 某條路徑以及其內部的錯誤。                  |
| `checkSchema(schema)`                           | schema 的靜態問題，型別為 `SchemaIssue[]`。 |

### 文字與路徑

| 匯出                         | 說明                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `t(text, locale?)`           | 解析 `I18nText`，找不到時改用另一個語系。             |
| `format(template, params)`   | 填入 `{name}` 佔位符。                                |
| `messages`, `DEFAULT_LOCALE` | 內建驗證訊息；預設語系是 `zh-TW`。                    |
| `getPath`, `setPath`         | 讀取並以不可變方式寫入點路徑，例如 `jobs.0.company`。 |
| `joinPath`, `splitPath`      | 組合與拆開點路徑。                                    |

## `@schema-form-kit/vue`

| 匯出                         | 說明                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `SchemaForm`                 | 表單元件。見下方。                                                    |
| `useSchemaForm(options)`     | 無介面狀態。見[自訂](../guide/customization#headless)。               |
| `FieldRenderer`              | 渲染一個欄位及其標籤與錯誤；用於自訂版面。                            |
| `TextField`、`NumberField`…… | 預設欄位元件；另有 `defaultComponents`。                              |
| `useFormContext()`           | 在 `<SchemaForm>` 內部渲染的元件可取得的表單狀態。                    |
| `FieldComponentProps`        | 欄位元件的 props。                                                    |
| `SchemaFormKit`              | 選擇性的 plugin：`app.use(SchemaFormKit)` 會全域註冊 `<SchemaForm>`。 |

樣式：`import '@schema-form-kit/vue/styles.css'`。

### `<SchemaForm>` props

| Prop               | 型別                                    | 預設      |
| ------------------ | --------------------------------------- | --------- |
| `schema`           | `FormSchema`                            | 必填      |
| `v-model`          | `FormValues`                            | `{}`      |
| `locale`           | `'zh-TW' \| 'en'`                       | `'zh-TW'` |
| `customValidators` | `Record<string, CustomValidator>`       | —         |
| `components`       | `Partial<Record<FieldType, Component>>` | —         |
| `hideHeader`       | `boolean`                               | `false`   |

事件、插槽與暴露的方法列在[自訂](../guide/customization#slots-and-events)。

## `@schema-form-kit/builder-core`

每個操作都接收一份 schema 並回傳新的一份；輸入不會被修改。欄位以名稱路徑定位，例如 `experiences.company`。不合法的操作會丟出 `BuilderError`。

| 匯出                                                                              | 說明                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `createEmptySchema(id?)`                                                          | 一份空白表單。                                         |
| `addField(schema, fieldOrType, { parent?, index?, stepId? })`                     | 新增欄位；回傳 `{ schema, path }`。                    |
| `removeField`、`duplicateField`                                                   | 刪除或複製欄位。                                       |
| `moveField(schema, path, toIndex)`                                                | 在所屬群組內調整順序。                                 |
| `moveFieldToStep(schema, name, stepId, index?)`                                   | 把頂層欄位移到另一個步驟。                             |
| `updateField(schema, path, patch)`                                                | 修改名稱與類型以外的屬性。                             |
| `renameField(schema, path, newName)`                                              | 重新命名，並更新所有引用該欄位的條件。                 |
| `changeFieldType(schema, path, type)`                                             | 改變類型，保留仍然適用的部分。                         |
| `enableSteps`、`disableSteps`、`addStep`、`updateStep`、`removeStep`、`moveStep`  | 編輯步驟。                                             |
| `findReferences(schema, path)`                                                    | 引用某個欄位的條件。                                   |
| `palette`、`createField(type, siblingNames)`、`uniqueName`                        | 調色盤用的欄位範本。                                   |
| `RULES_BY_TYPE`、`CHOICE_TYPES`                                                   | 每種類型支援哪些規則與選項。                           |
| `createHistory`、`commit`、`undo`、`redo`、`canUndo`、`canRedo`                   | 復原／重做歷史。`commit` 可用 `coalesceKey` 合併編輯。 |
| `importSchema(json)`、`exportSchema(schema)`                                      | 解析並附上錯誤與警告；格式化輸出。                     |
| `getField`、`fieldsAt`、`walkFields`、`splitFieldPath`、`parentPath`、`childPath` | 樹狀結構的輔助函式。                                   |

## `@schema-form-kit/builder`

| 匯出                           | 說明                                            |
| ------------------------------ | ----------------------------------------------- |
| `FormBuilder`                  | 編輯器介面。Props：`v-model:schema`、`locale`。 |
| `useBuilder(schema, options?)` | 介面使用的編輯器狀態（選取、拖放、歷史）。      |
| `uiText`                       | 編輯器介面在各語系的文字。                      |

樣式：`import '@schema-form-kit/builder/styles.css'`。
