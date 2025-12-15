import { createReducer, on } from '@ngrx/store';
import { loadEmailsSuccess, updateEmailSuccess } from './email.actions';

export const initialState: any[] = [];

export const emailsReducer = createReducer(
  initialState,
  on(loadEmailsSuccess, (state, { records }) => [...records]),
  on(updateEmailSuccess, (state, { record }) => state.map(r => r.id === record.id ? record : r))
);
