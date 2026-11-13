---
layout: home

hero:
  name: schema-form-kit
  text: JSON-driven forms for Vue 3
  tagline: Describe a form once in JSON. Get conditional logic, validation, multi-step wizards, repeatable groups and a visual builder.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Open the builder
      link: https://forms.janicechiang.dev/#/builder
    - theme: alt
      text: GitHub
      link: https://github.com/juchiang77608/schema-form-kit

features:
  - title: Framework-agnostic core
    details: Conditions, validation, i18n and schema checks live in a plain TypeScript package with no runtime dependencies.
  - title: Conditions that cascade
    details: visibleWhen and conditional required with all / any / not. A field that depends on a hidden field is hidden too, and hidden answers are never submitted.
  - title: Wizards and repeatable groups
    details: Split a form into steps that validate before moving on, and let users add items such as work experience, with conditions scoped to each item.
  - title: Accessible and themeable
    details: Labels bound to inputs, aria-invalid and aria-describedby, focus on the first error. Every color, radius and spacing is a CSS variable.
  - title: Bring your own components
    details: Replace the component for any field type, or skip the renderer and build a custom UI on the headless useSchemaForm composable.
  - title: Visual builder
    details: Drag fields, edit properties, write conditions without code, undo and redo, preview, then export the JSON.
---
