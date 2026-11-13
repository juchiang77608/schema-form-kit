# 驗證

驗證在核心套件裡執行，所以同一套規則可以在瀏覽器與伺服器上使用。

## 內建檢查

任何規則執行之前，會先依欄位類型檢查值：`email` 必須像電子郵件地址，`number` 必須是數字，`date` 必須是有效日期，選項類欄位必須使用它自己的選項之一。

`required` 在值缺少、為 `null`、空白文字或空陣列時失敗。對 `switch` 來說，必填表示必須打開（適合「我同意」這類勾選）。

## 規則

用 `validations` 加上規則：

| `type`                   | 適用對象            | 失敗時機                          |
| ------------------------ | ------------------- | --------------------------------- |
| `minLength`, `maxLength` | 文字欄位            | 文字短於／長於 `value`            |
| `min`, `max`             | `number`            | 數字小於／大於 `value`            |
| `pattern`                | 文字欄位            | 文字不符合 `value` 裡的正規表示式 |
| `minItems`, `maxItems`   | `checkbox`、`array` | 項目少於／多於 `value`            |
| `custom`                 | 任何欄位            | 你的函式回傳一則訊息              |

除了 `minItems` 與 `maxItems`，欄位是空的時會略過其他規則。所以選填欄位設了 `minLength: 3` 仍然接受空白答案。

## 訊息

每則內建訊息都有繁體中文與英文，並會帶上欄位標籤。用 `message` 可以覆寫某一條規則的訊息。`{label}` 與 `{value}` 會自動填入。

```json
{
  "type": "pattern",
  "value": "^[a-z0-9_]+$",
  "message": {
    "en": "{label}: use lowercase letters, numbers and _ only",
    "zh-TW": "「{label}」只能使用小寫英文、數字與底線"
  }
}
```

## 自訂驗證器

`custom` 規則用名稱指向一個函式。把函式註冊在表單上：

```ts
import type { CustomValidator } from '@schema-form-kit/core';

const notReserved: CustomValidator = (value, { params }) => {
  const words = (params.words as string[] | undefined) ?? [];
  return typeof value === 'string' && words.includes(value.toLowerCase())
    ? `「${value}」是保留字`
    : true;
};
```

```vue
<SchemaForm :schema="schema" :custom-validators="{ notReserved }" />
```

```json
{ "type": "custom", "name": "notReserved", "params": { "words": ["admin", "root"] } }
```

函式會收到值，以及一個包含整份表單 `values`、值的 `path`、`field` 定義與規則 `params` 的 context。值有效時回傳 `true`，否則回傳錯誤訊息。函式不放進 JSON，schema 才能序列化，邏輯則留在程式裡。

試著把使用者名稱填成 `admin`、年齡填未滿 18，並且不選任何興趣就送出：

<Demo example="validation" />

## 錯誤什麼時候出現

渲染器不會在使用者打字時就顯示錯誤。欄位第一次失焦之後才顯示它的錯誤；使用者試著繼續或送出之後，該步驟的每個欄位才會顯示錯誤。

## 在伺服器上驗證

```ts
import { validateForm, hasErrors } from '@schema-form-kit/core';

const errors = validateForm(schema, body, { locale: 'zh-TW', customValidators: { notReserved } });
if (hasErrors(errors)) {
  // errors: { "username": ["「admin」是保留字"], "experiences.0.company": ["公司為必填"] }
}
```

錯誤的鍵是值的路徑，所以可重複群組裡的錯誤會指向那一筆。
