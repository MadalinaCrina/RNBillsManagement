import {getLogger} from '../core/utils';
import {apiUrl, authHeaders} from '../core/api';
const log = getLogger('note/service');
const action = (type, payload) => ({type, payload});

const SAVE_NOTE_STARTED = 'note/saveStarted';
const SAVE_NOTE_SUCCEEDED = 'note/saveSucceeded';
const SAVE_NOTE_FAILED = 'note/saveFailed';
const CANCEL_SAVE_NOTE = 'note/cancelSave';

const LOAD_NOTES_STARTED = 'note/loadStarted';
const LOAD_NOTES_SUCCEEDED = 'note/loadSucceeded';
const LOAD_NOTES_FAILED = 'note/loadFailed';
const CANCEL_LOAD_NOTES = 'note/cancelLoad';

export const loadNotes = () => (dispatch, getState) => {
  log(`loadNotes started`);
  dispatch(action(LOAD_NOTES_STARTED));
  let ok = false;
  return fetch(`${apiUrl}/note`, {method: 'GET', headers: authHeaders(getState().auth.token)})
    .then(res => {
      ok = res.ok;
      return res.json();
    })
    .then(json => {
      log(`loadNotes ok: ${ok}, json: ${JSON.stringify(json)}`);
      if (!getState().note.isLoadingCancelled) {
        dispatch(action(ok ? LOAD_NOTES_SUCCEEDED : LOAD_NOTES_FAILED, json));
      }
    })
    .catch(err => {
      log(`loadNotes err = ${err.message}`);
      if (!getState().note.isLoadingCancelled) {
        dispatch(action(LOAD_NOTES_FAILED, {issue: [{error: err.message}]}));
      }
    });
};
export const cancelLoadNotes = () => action(CANCEL_LOAD_NOTES);

export const saveNote = (note) => (dispatch, getState) => {
  const body = JSON.stringify(note);
  log(`saveNote started`);
  dispatch(action(SAVE_NOTE_STARTED));
  let ok = false;
  const url = note._id ? `${apiUrl}/note/${note._id}` : `${apiUrl}/note`;
  const method = note._id ? `PUT` : `POST`;
  return fetch(url, {method, headers: authHeaders(getState().auth.token), body})
    .then(res => {
      ok = res.ok;
      return res.json();
    })
    .then(json => {
      log(`saveNote ok: ${ok}, json: ${JSON.stringify(json)}`);
      if (!getState().note.isSavingCancelled) {
        dispatch(action(ok ? SAVE_NOTE_SUCCEEDED : SAVE_NOTE_FAILED, json));
      }
    })
    .catch(err => {
      log(`saveNote err = ${err.message}`);
      if (!getState().isSavingCancelled) {
        dispatch(action(SAVE_NOTE_FAILED, {issue: [{error: err.message}]}));
      }
    });
};
export const cancelSaveNote = () => action(CANCEL_SAVE_NOTE);

export const noteReducer = (state = {items: [], isLoading: false, isSaving: false}, action) => { //newState (new object)
  switch(action.type) {
    case LOAD_NOTES_STARTED:
      return {...state, isLoading: true, isLoadingCancelled: false, issue: null};
    case LOAD_NOTES_SUCCEEDED:
      return {...state, items: action.payload, isLoading: false};
    case LOAD_NOTES_FAILED:
      return {...state, issue: action.payload.issue, isLoading: false};
    case CANCEL_LOAD_NOTES:
      return {...state, isLoading: false, isLoadingCancelled: true};
    case SAVE_NOTE_STARTED:
      return {...state, isSaving: true, isSavingCancelled: false, issue: null};
    case SAVE_NOTE_SUCCEEDED:
      let items = [...state.items];
      let index = items.findIndex((i) => i._id == action.payload._id);
      if (index != -1) {
        items.splice(index, 1, action.payload);
      } else {
        items.push(action.payload);
      }
      return {...state, items, isSaving: false};
    case SAVE_NOTE_FAILED:
      return {...state, issue: action.payload.issue, isSaving: false};
    case CANCEL_SAVE_NOTE:
      return {...state, isSaving: false, isSavingCancelled: true};
    default:
      return state;
  }
};

