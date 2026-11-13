# Steps and repeatable groups

## Multi-step wizards

Add `steps` to split a form into pages. Each step lists the names of top-level fields it shows, in
order:

```json
{
  "steps": [
    { "id": "about", "title": "About you", "fields": ["name", "email"] },
    { "id": "work", "title": "Experience", "fields": ["experiences"] },
    { "id": "confirm", "title": "Confirm", "fields": ["agree"] }
  ]
}
```

- **Next** validates only the current step. If it has errors, the wizard stays and focuses the first
  one.
- Users can click the step list to jump back at any time, or forward over steps that are valid.
- On submit, the whole form is validated. If an earlier step has errors, the wizard goes back to
  that step.
- `step-change` is emitted with the new step index whenever the step changes.

Steps are only a presentation choice: values are still one object, and conditions can refer to
fields on other steps.

## Repeatable groups

An `array` field holds a list of items. Each item has the fields in `fields`:

```json
{
  "name": "experiences",
  "type": "array",
  "label": "Work experience",
  "itemLabel": "Job",
  "validations": [{ "type": "minItems", "value": 1 }],
  "fields": [
    { "name": "company", "type": "text", "label": "Company", "required": true },
    { "name": "current", "type": "switch", "label": "I work here now" },
    {
      "name": "end",
      "type": "date",
      "label": "End",
      "required": true,
      "visibleWhen": { "field": "current", "op": "neq", "value": true }
    }
  ]
}
```

The value is an array of objects:

```json
{ "experiences": [{ "company": "Acme", "current": true }] }
```

### Conditions inside an item

A condition inside an item first looks for the field **in the same item**, then at the form root.
In the example above, `end` is hidden only for the jobs where `current` is on, not for every job.
If an item field has the same name as a top-level field, the item field wins.

Try it: add two jobs and switch on **I work here now** for one of them.

<Demo example="wizard" />
