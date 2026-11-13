# Schema 與欄位

表單是一個型別為 `FormSchema` 的純 JSON 物件。因為它只是資料，可以存進資料庫、做版本管理，也可以用[視覺化編輯器](./builder)修改。

## 表單

```ts
interface FormSchema {
  id: string; // 用來產生 DOM id
  version: 1; // schema 格式版本，供日後遷移
  title: I18nText;
  description?: I18nText;
  fields: FieldSchema[];
  steps?: StepSchema[]; // 把表單變成多步驟
  submitLabel?: I18nText;
}
```

## 共通欄位選項

每個欄位都有這些選項：

| 選項           | 型別                   | 說明                                               |
| -------------- | ---------------------- | -------------------------------------------------- |
| `name`         | `string`               | 值物件裡的鍵。同一層必須唯一。                     |
| `type`         | `FieldType`            | 見下方表格。                                       |
| `label`        | `I18nText`             | 顯示在輸入框上方。                                 |
| `description`  | `I18nText`             | 標籤下方的說明。                                   |
| `placeholder`  | `I18nText`             | 文字類輸入框的提示文字。                           |
| `required`     | `boolean \| Condition` | `true`，或一個讓它變成必填的[條件](./conditions)。 |
| `visibleWhen`  | `Condition`            | 只有條件成立時才顯示（並驗證）這個欄位。           |
| `validations`  | `ValidationRule[]`     | 見[驗證](./validation)。                           |
| `defaultValue` | 依型別而定             | 初始值。                                           |
| `colSpan`      | `number`               | 版面提示：12 欄中佔幾欄。預設是整列。              |

## 欄位類型

| `type`                      | 值                        | 額外選項                      |
| --------------------------- | ------------------------- | ----------------------------- |
| `text`, `email`, `textarea` | `string`                  | —                             |
| `number`                    | `number`                  | `step`                        |
| `date`                      | `string`（`YYYY-MM-DD`）  | —                             |
| `select`, `radio`           | `string \| number`        | `options`（必填）             |
| `checkbox`                  | `Array<string \| number>` | `options`（必填）             |
| `switch`                    | `boolean`                 | —                             |
| `array`                     | `Array<object>`           | `fields`（必填）、`itemLabel` |

選項的格式是 `{ label: I18nText, value: string | number }`。

`array` 是可重複群組。見[步驟與可重複群組](./steps-and-groups)。

## 可翻譯的文字

每個給使用者看的字串都是 `I18nText`：可以是一個字串，也可以是每個語系各一個字串。

```json
{ "label": { "zh-TW": "電子郵件", "en": "Email" } }
```

內建語系是 `zh-TW`（預設）與 `en`。把 `<SchemaForm>` 的 `locale` 設成 `"en"` 就會改用英文。內建的驗證訊息兩種語系都有。

右上角的語言選單切換的是**這份文件**的說明。表單範例裡的語言選單則切換範例表單本身的語系，兩者各自獨立。

## 檢查 schema

手寫 schema 很容易寫錯。`checkSchema` 會在渲染前回報問題：

```ts
import { checkSchema } from '@schema-form-kit/core';

const issues = checkSchema(schema);
// [{ path: 'fields.2.visibleWhen', message: 'Unknown field "topc" in condition' }, ...]
```

它會找出不合法或重複的名稱、指向不存在欄位的條件、空的選項清單、不合法的正規表示式，以及引用了缺少欄位的步驟。Playground 和編輯器會在你輸入時執行這項檢查。
