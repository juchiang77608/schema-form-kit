# 條件

條件決定欄位要不要顯示（`visibleWhen`），以及要不要必填（`required`）。條件本身也是 JSON，所以編輯器可以不用寫程式就修改它們。

## 比較一個欄位

```json
{ "field": "topic", "op": "eq", "value": "other" }
```

`field` 是另一個欄位的名稱（或點路徑）。運算子如下：

| `op`          | 成立的時機                                     |
| ------------- | ---------------------------------------------- |
| `eq`, `neq`   | 等於／不等於 `value`                           |
| `gt`, `gte`   | 大於／大於等於 `value`（數字，或日期這類文字） |
| `lt`, `lte`   | 小於／小於等於 `value`                         |
| `in`, `notIn` | 是／不是 `value` 陣列中的其中一項              |
| `includes`    | 值是陣列（核取方塊群組）或文字，且包含 `value` |
| `empty`       | 是空的：缺少、`null`、空白文字或空陣列         |
| `notEmpty`    | 不是空的                                       |

## 組合條件

使用 `all`、`any` 與 `not`。需要多深就可以巢狀多深。

```json
{
  "all": [
    { "field": "country", "op": "eq", "value": "TW" },
    { "not": { "field": "age", "op": "gte", "value": 18 } }
  ]
}
```

## 條件式必填

`required` 除了 `true`，也可以是一個條件：

```json
{
  "name": "message",
  "type": "textarea",
  "label": "禮物卡片留言",
  "visibleWhen": { "field": "gift", "op": "eq", "value": true },
  "required": { "field": "method", "op": "eq", "value": "home" }
}
```

被隱藏的欄位永遠不會被當成必填，不管 `required` 寫了什麼。

## 隱藏會連動

如果欄位 B 依賴欄位 A，而 A 被隱藏，B 也會被隱藏。就算 A 在隱藏前的值會讓 B 的條件成立，也一樣。條件是依**有效值**來判斷的：先拿掉每一個隱藏欄位的答案，重複這個過程，直到不再變化。

驗證用的也是這組有效值，`submit` 送出的也是它。使用者無法送出自己已經看不到的答案。理由記在
[ADR 0002](https://github.com/juchiang77608/schema-form-kit/blob/main/docs/adr/0002-hidden-fields-cascade.md)（英文）。

試看看：先選 **宅配**，填寫地址讓 **樓層** 出現，再改回 **門市自取**。兩個欄位都會消失，而且它們的值不會被送出。

<Demo example="conditions" />

## 不透過渲染器使用條件

引擎在與框架無關的核心裡，所以同一套規則可以在伺服器上執行：

```ts
import { effectiveValues, evaluateCondition, validateForm } from '@schema-form-kit/core';

evaluateCondition({ field: 'method', op: 'eq', value: 'home' }, { root: values }); // boolean
effectiveValues(schema, values); // 拿掉隱藏答案後的值
validateForm(schema, values, { locale: 'zh-TW' }); // 與表單顯示的錯誤相同
```
