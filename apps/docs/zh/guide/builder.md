# 視覺化編輯器

編輯器可以建立與修改 schema，不用手寫 JSON。
**[線上試用](https://forms.janicechiang.dev/#/builder)**：它會從一份範例表單開始，草稿留在瀏覽器裡。

## 可以做什麼

- **新增欄位**：從調色盤拖到表單上，或點一下調色盤裡的項目。
- **調整順序**：拖曳，或用每個欄位上的 ↑／↓ 按鈕（也適合鍵盤操作）。
- **編輯屬性**：在右側面板修改標籤、名稱、說明、提示文字、必填、寬度、選項與驗證規則。
- **撰寫條件**：用表單編輯器設定「顯示條件」與「必填條件」，支援 `all`、`any` 與巢狀。欄位從清單中挑選，所以條件不會指向不存在的欄位。
- **安全地重新命名。** 改變欄位名稱時，所有引用它的條件都會一起更新，包含可重複群組裡的條件。
- **改變欄位類型。** 標籤、說明與條件會保留；不符合新類型的規則會被拿掉，選項會視需要新增或移除。
- **使用步驟。** 開啟步驟，新增、重新命名、調整順序，並在步驟之間移動欄位。
- **復原與重做** 每一次變更，可以用工具列，或 Ctrl／⌘ + Z 與 Ctrl／⌘ + Shift + Z。在文字框裡的輸入會合併成一個復原步驟。
- **預覽** 使用者實際會看到的表單，然後 **匯出** JSON（複製到剪貼簿並下載），或 **匯入** 既有的 schema。壞掉的 JSON 會被拒絕；指向缺少欄位的條件這類問題會列出來，方便你在編輯器裡修正。

## 在你的應用裡使用編輯器

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { FormBuilder } from '@schema-form-kit/builder';
import '@schema-form-kit/vue/styles.css';
import '@schema-form-kit/builder/styles.css';
import type { FormSchema } from '@schema-form-kit/core';

const schema = ref<FormSchema>({ id: 'new-form', version: 1, title: '新表單', fields: [] });
</script>

<template>
  <FormBuilder v-model:schema="schema" locale="zh-TW" />
</template>
```

每次變更都會更新 `v-model:schema`，所以可以在使用者編輯時儲存草稿。編輯器自己的顏色是帶 `--sfb-` 前綴的 CSS 變數。

## 兩個套件

編輯器和表單一樣拆成兩層：

- `@schema-form-kit/builder-core` 把每個編輯操作做成從 schema 到 schema 的純函式：`addField`、`moveField`、`renameField`、`changeFieldType`、`addStep` 等等，再加上復原／重做的歷史，以及匯入／匯出。它沒有 UI，並且有完整的單元測試，所以可以在上面為其他框架做編輯器。
- `@schema-form-kit/builder` 是呼叫這些操作的 Vue 介面。

```ts
import { addField, renameField } from '@schema-form-kit/builder-core';

const added = addField(schema, 'email'); // { schema, path } — 需要時會把名稱改成唯一
const renamed = renameField(added.schema, added.path, 'contactEmail'); // 條件會跟著更新
```

設計決策記在
[ADR 0003](https://github.com/juchiang77608/schema-form-kit/blob/main/docs/adr/0003-builder-core.md)
與
[ADR 0004](https://github.com/juchiang77608/schema-form-kit/blob/main/docs/adr/0004-builder-drag-and-drop.md)
（皆為英文）。
