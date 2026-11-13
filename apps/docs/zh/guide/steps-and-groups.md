# 步驟與可重複群組

## 多步驟表單

加上 `steps` 可以把表單拆成多頁。每個步驟依序列出它要顯示的頂層欄位名稱：

```json
{
  "steps": [
    { "id": "about", "title": "基本資料", "fields": ["name", "email"] },
    { "id": "work", "title": "經歷", "fields": ["experiences"] },
    { "id": "confirm", "title": "確認", "fields": ["agree"] }
  ]
}
```

- **下一步** 只驗證目前這個步驟。有錯誤就停在原地，並把焦點移到第一個錯誤。
- 使用者可以隨時點步驟清單回到前面的步驟，或往前跳過已經有效的步驟。
- 送出時會驗證整份表單。如果較早的步驟有錯誤，會回到那個步驟。
- 步驟改變時會觸發 `step-change`，並帶上新的步驟索引。

步驟只影響呈現：值仍然是同一個物件，條件也可以引用其他步驟上的欄位。

## 可重複群組

`array` 欄位存放一串項目。每一筆的欄位寫在 `fields`：

```json
{
  "name": "experiences",
  "type": "array",
  "label": "工作經歷",
  "itemLabel": "工作",
  "validations": [{ "type": "minItems", "value": 1 }],
  "fields": [
    { "name": "company", "type": "text", "label": "公司", "required": true },
    { "name": "current", "type": "switch", "label": "目前在職" },
    {
      "name": "end",
      "type": "date",
      "label": "結束",
      "required": true,
      "visibleWhen": { "field": "current", "op": "neq", "value": true }
    }
  ]
}
```

值是物件陣列：

```json
{ "experiences": [{ "company": "Acme", "current": true }] }
```

### 項目內的條件

項目裡的條件會先找**同一筆**裡的欄位，找不到再找表單根層。上面的例子裡，`end` 只會在該筆工作的 `current` 打開時隱藏，不會影響其他工作。如果項目欄位和頂層欄位同名，以項目欄位為準。

試看看：新增兩筆工作，只把其中一筆的 **目前在職** 打開。

<Demo example="wizard" />
