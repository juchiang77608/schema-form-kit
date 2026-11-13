# 開始使用

schema-form-kit 把一份描述表單的 JSON 變成可以使用的 Vue 3 表單。套件依職責拆開：

| 套件                            | 做什麼                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- |
| `@schema-form-kit/core`         | Schema 型別、條件引擎、驗證、多語系、schema 檢查。純 TypeScript，沒有 Vue。 |
| `@schema-form-kit/vue`          | `<SchemaForm>` 元件、每種欄位一個元件，以及 `useSchemaForm` composable。    |
| `@schema-form-kit/builder-core` | 表單編輯器的操作：新增、移動、重新命名、復原／重做、匯入／匯出。            |
| `@schema-form-kit/builder`      | 視覺化編輯器介面（`<FormBuilder>`）。                                       |

::: info 尚未發佈到 npm
套件還沒發佈。想試用的話，請 clone
[儲存庫](https://github.com/juchiang77608/schema-form-kit) 並執行 `pnpm install && pnpm dev`，
或直接使用[線上 playground](https://forms.janicechiang.dev)。
:::

## 安裝

```bash
pnpm add @schema-form-kit/vue @schema-form-kit/core
```

`vue` 3.5 以上是 peer dependency。

## 第一個表單

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SchemaForm } from '@schema-form-kit/vue';
import '@schema-form-kit/vue/styles.css';
import type { FormSchema, FormValues } from '@schema-form-kit/core';

const schema: FormSchema = {
  id: 'contact',
  version: 1,
  title: '聯絡我們',
  fields: [
    { name: 'email', type: 'email', label: '電子郵件', required: true },
    {
      name: 'topic',
      type: 'select',
      label: '主題',
      options: [
        { label: '業務洽詢', value: 'sales' },
        { label: '其他', value: 'other' },
      ],
    },
    {
      name: 'detail',
      type: 'textarea',
      label: '詳細說明',
      required: true,
      visibleWhen: { field: 'topic', op: 'eq', value: 'other' },
    },
  ],
};

const values = ref<FormValues>({});

function save(submitted: FormValues) {
  console.log(submitted);
}
</script>

<template>
  <SchemaForm v-model="values" :schema="schema" locale="zh-TW" @submit="save" />
</template>
```

主題選 **其他**，就會出現額外的欄位：

<Demo example="contact" />

## 送出時會發生什麼

1. 每個看得到的欄位都會驗證。錯誤顯示在欄位下方，焦點移到第一個錯誤。
2. 表單有效時，會觸發 `submit`，內容只有**看得到的**欄位。被條件隱藏的答案會被拿掉。
3. 表單無效時，會觸發 `invalid`，錯誤以值的路徑為鍵。

## 下一步

- [Schema 與欄位](./schema) 列出每種欄位與選項。
- [條件](./conditions) 說明如何顯示、隱藏與要求必填。
- [視覺化編輯器](./builder) 可以不用手寫 JSON 就建立 schema。
