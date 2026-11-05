import type { FormSchema, I18nText } from '@schema-form-kit/core';
import { eventRegistration } from './event-registration';
import { jobApplication } from './job-application';
import { satisfactionSurvey } from './satisfaction-survey';

export interface Preset {
  id: string;
  label: I18nText;
  schema: FormSchema;
}

export const presets: Preset[] = [
  { id: 'event', label: { 'zh-TW': '活動報名（多步驟）', en: 'Event registration (wizard)' }, schema: eventRegistration },
  { id: 'job', label: { 'zh-TW': '求職申請（重複群組）', en: 'Job application (repeatable)' }, schema: jobApplication },
  { id: 'survey', label: { 'zh-TW': '滿意度問卷（組合條件）', en: 'Survey (combined conditions)' }, schema: satisfactionSurvey },
];
