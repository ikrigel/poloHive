import { createAction, props } from '@ngrx/store';

export const loadEmails = createAction('[Emails] Load');
export const loadEmailsSuccess = createAction('[Emails] Load Success', props<{ records: any[] }>());
export const updateEmail = createAction('[Emails] Update', props<{ id: string, fields: any }>());
export const updateEmailSuccess = createAction('[Emails] Update Success', props<{ record: any }>());
