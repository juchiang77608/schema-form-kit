# 自訂

自訂有三個層級，由少到多。

## 1. 用 CSS 變數換膚

顏色、圓角與間距都是 `.sfk-form` 上的 CSS 變數。在你的 CSS 裡覆寫即可：

```css
.sfk-form {
  --sfk-color-primary: #0f766e;
  --sfk-radius: 4px;
  --sfk-gap: 12px;
}
```

| 變數                           | 預設             |
| ------------------------------ | ---------------- |
| `--sfk-font`                   | `inherit`        |
| `--sfk-color-text`             | `#1f2328`        |
| `--sfk-color-muted`            | `#59636e`        |
| `--sfk-color-border`           | `#d1d9e0`        |
| `--sfk-color-surface`          | `#ffffff`        |
| `--sfk-color-subtle`           | `#f6f8fa`        |
| `--sfk-color-primary`          | `#4f46e5`        |
| `--sfk-color-primary-contrast` | `#ffffff`        |
| `--sfk-color-danger`           | `#cf222e`        |
| `--sfk-color-focus`            | 主色、透明度 35% |
| `--sfk-radius`                 | `8px`            |
| `--sfk-gap`                    | `16px`           |
| `--sfk-input-height`           | `40px`           |

類名使用 `sfk-` 前綴（`sfk-field`、`sfk-field--invalid`、`sfk-label`、`sfk-errors`……），需要更細的調整時可以用。

## 2. 替換欄位元件

傳入 `components`，用你自己的元件替換任一種欄位，例如設計系統裡的日期選擇器：

```vue
<SchemaForm :schema="schema" :components="{ date: MyDatePicker }" />
```

渲染器仍然負責標籤、說明與錯誤。你的元件會收到 `FieldComponentProps` 與 `v-model`，使用者離開時要發出 `blur`，錯誤才會出現：

```vue
<script setup lang="ts">
import type { FieldComponentProps } from '@schema-form-kit/vue';

defineProps<FieldComponentProps>();
const model = defineModel<string>({ default: '' });
defineEmits<{ blur: [] }>();
</script>

<template>
  <input
    :id="inputId"
    v-model="model"
    type="date"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
    @blur="$emit('blur')"
  />
</template>
```

| Prop          | 說明                                             |
| ------------- | ------------------------------------------------ |
| `field`       | 欄位定義。可用 `field.type` 縮小型別。           |
| `path`        | 值的路徑，例如 `experiences.0.company`。         |
| `inputId`     | 輸入框的 DOM id。標籤的 `for` 指向它。           |
| `labelId`     | 標籤的 DOM id，給使用 `aria-labelledby` 的群組。 |
| `describedBy` | 錯誤與說明文字的 id，給 `aria-describedby`。     |
| `invalid`     | 這個欄位目前是否正在顯示錯誤。                   |
| `required`    | 這個欄位目前是否必填。                           |
| `locale`      | 目前的語系。                                     |

## 3. 無介面：自己做畫面 {#headless}

`useSchemaForm` 是 `<SchemaForm>` 底下的狀態。直接使用它可以渲染完全不同的畫面，例如一次只問一題的問卷：

```ts
import { useSchemaForm } from '@schema-form-kit/vue';

const form = useSchemaForm({ schema, locale: 'zh-TW' });

form.values; // Ref<FormValues>
form.visibleValues; // 拿掉隱藏答案後的值
form.setValue('email', 'me@example.com');
form.touch('email');
form.errorsFor('email'); // 某條路徑要顯示的錯誤
form.steps; // 步驟（沒有步驟的表單會有一個）
form.next(); // 驗證目前步驟，然後前進
form.validate(); // 驗證全部
form.reset();
```

## 插槽與事件 {#slots-and-events}

`<SchemaForm>` 有 `header` 插槽（收到 `schema`）與 `footer` 插槽（收到 `isFirstStep`、`isLastStep`、`prev` 與 `next`），用來放自訂按鈕。設定 `hide-header` 可以拿掉標題。

| 事件                | 內容                   |
| ------------------- | ---------------------- |
| `update:modelValue` | 使用者輸入時的全部值   |
| `submit`            | 驗證後，只有看得到的值 |
| `invalid`           | 以值路徑為鍵的錯誤     |
| `step-change`       | 新的步驟索引           |

元件也透過 template ref 暴露 `values`、`errors`、`validate()`、`reset()`、`next()`、`prev()`、`goTo(index)` 與 `submit()`。
