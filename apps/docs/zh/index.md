---
layout: home

hero:
  name: schema-form-kit
  text: 用 JSON 描述 Vue 3 表單
  tagline: 一份 JSON 就能得到條件邏輯、驗證、多步驟、可重複群組，以及視覺化編輯器。
  actions:
    - theme: brand
      text: 開始使用
      link: /zh/guide/getting-started
    - theme: alt
      text: 開啟編輯器
      link: https://forms.janicechiang.dev/#/builder
    - theme: alt
      text: GitHub
      link: https://github.com/juchiang77608/schema-form-kit

features:
  - title: 與框架無關的核心
    details: 條件、驗證、多語系與 schema 檢查都在純 TypeScript 套件裡，沒有執行期相依。
  - title: 會連動隱藏的條件
    details: visibleWhen 與條件式必填支援 all、any、not。依賴已隱藏欄位的欄位也會隱藏，隱藏欄位的答案不會被送出。
  - title: 多步驟與可重複群組
    details: 把表單分成數個步驟，通過驗證才能前進；使用者可以新增多筆資料（例如工作經歷），條件的範圍限於該筆。
  - title: 可及且可換膚
    details: 標籤綁定輸入框、aria-invalid 與 aria-describedby，並把焦點移到第一個錯誤。顏色、圓角與間距都是 CSS 變數。
  - title: 換成你自己的元件
    details: 替換任一種欄位元件，或略過內建畫面，用無介面的 useSchemaForm 自己組 UI。
  - title: 視覺化編輯器
    details: 拖曳欄位、編輯屬性、不用寫程式就能設定條件，復原與重做、預覽，再匯出 JSON。
---
