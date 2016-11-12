import {getLogger} from '../core/utils';
import {apiUrl, authHeaders} from '../core/api';
const log = getLogger('bill/service');
const action = (type, payload) => ({type, payload});

const DELETE_BILL_STARTED = 'bill/deleteStarted';
const DELETE_BILL_SUCCEEDED = 'bill/deleteSucceeded';
const DELETE_BILL_FAILED = 'bill/deleteFailed';
const CANCEL_DELETE_BILL = 'bill/cancelDelete';


const SAVE_BILL_STARTED = 'bill/saveStarted';
const SAVE_BILL_SUCCEEDED = 'bill/saveSucceeded';
const SAVE_BILL_FAILED = 'bill/saveFailed';
const CANCEL_SAVE_BILL = 'bill/cancelSave';

const LOAD_BILLS_STARTED = 'bill/loadStarted';
const LOAD_BILLS_SUCCEEDED = 'bill/loadSucceeded';
const LOAD_BILLS_FAILED = 'bill/loadFailed';
const CANCEL_LOAD_BILLS = 'bill/cancelLoad';

export const loadBills = () => (dispatch, getState) => {
  log(`loadBills started`);
  dispatch(action(LOAD_BILLS_STARTED));
  let ok = false;
  return fetch(`${apiUrl}/bill`, {method: 'GET', headers: authHeaders(getState().auth.token)})
    .then(res => {
      ok = res.ok;
      return res.json();
    })
    .then(json => {
      log(`loadBills ok: ${ok}, json: ${JSON.stringify(json)}`);
      if (!getState().bill.isLoadingCancelled) {
        dispatch(action(ok ? LOAD_BILLS_SUCCEEDED : LOAD_BILLS_FAILED, json));
      }
    })
    .catch(err => {
      log(`loadBills err = ${err.message}`);
      if (!getState().bill.isLoadingCancelled) {
        dispatch(action(LOAD_BILLS_FAILED, {issue: [{error: err.message}]}));
      }
    });
};
export const cancelLoadBills = () => action(CANCEL_LOAD_BILLS);

export const saveBill = (bill) => (dispatch, getState) => {
  const body = JSON.stringify(bill);
  log(`saveBill started`);
  dispatch(action(SAVE_BILL_STARTED));
  let ok = false;
  const url = bill._id ? `${apiUrl}/bill/${bill._id}` : `${apiUrl}/bill`;
  const method = bill._id ? `PUT` : `POST`;
  return fetch(url, {method, headers: authHeaders(getState().auth.token), body})
      .then(res => {
        ok = res.ok;
        return res.json();
      })
      .then(json => {
        log(`saveBill ok: ${ok}, json: ${JSON.stringify(json)}`);
        if (!getState().bill.isSavingCancelled) {
          dispatch(action(ok ? SAVE_BILL_SUCCEEDED : SAVE_BILL_FAILED, json));
        }
      })
      .catch(err => {
        log(`saveBill err = ${err.message}`);
        if (!getState().isSavingCancelled) {
          dispatch(action(SAVE_BILL_FAILED, {issue: [{error: err.message}]}));
        }
      });
};
export const deleteBill = (bill) => (dispatch, getState) => {
  const body = JSON.stringify(bill);
  log(`deleteBill started`);
  dispatch(action(DELETE_BILL_STARTED));
  let ok = false;
  const url = bill._id ? `${apiUrl}/bill/${bill._id}` : `${apiUrl}/bill`;

  return fetch(url, {method:'DELETE', headers: authHeaders(getState().auth.token), body})
      .then(res => {
        log(`saveBill orrrk: ${res}`);
        ok = res.ok;
        return res.json;
      })
      .then(json => {
        log(`saveBill ok: ${ok}`);
        if (!getState().bill.isDeletingCancelled) {
          dispatch(action(ok ? DELETE_BILL_SUCCEEDED : DELETE_BILL_FAILED, json));
        }
      })
      .catch(err => {
        log(`saveBill err = ${err.message}`);
        if (!getState().isDeletingCancelled) {
          dispatch(action(DELETE_BILL_FAILED, {issue: [{error: err.message}]}));
        }
      });
};
export const cancelSaveBill = () => action(CANCEL_SAVE_BILL);

export const billReducer = (state = {items: [], isLoading: false, isSaving: false}, action) => { //newState (new object)
  switch(action.type) {
    case LOAD_BILLS_STARTED:
      return {...state, isLoading: true, isLoadingCancelled: false, issue: null};
    case LOAD_BILLS_SUCCEEDED:
      return {...state, items: action.payload, isLoading: false};
    case LOAD_BILLS_FAILED:
      return {...state, issue: action.payload.issue, isLoading: false};
    case CANCEL_LOAD_BILLS:
      return {...state, isLoading: false, isLoadingCancelled: true};
    case SAVE_BILL_STARTED:
      return {...state, isSaving: true, isSavingCancelled: false, issue: null};
    case SAVE_BILL_SUCCEEDED:
      log('saveeeeeeee');
      let items = [...state.items];
      let index = items.findIndex((i) => i._id == action.payload._id);
      if (index != -1) {
        items.splice(index, 1, action.payload);
      } else {
        items.push(action.payload);
      }
      return {...state, items, isSaving: false};
    case SAVE_BILL_FAILED:
      return {...state, issue: action.payload.issue, isSaving: false};
    case CANCEL_SAVE_BILL:
      return {...state, isSaving: false, isSavingCancelled: true};
    case DELETE_BILL_STARTED:
      return {...state, isDeleting: true, isDeletingCancelled: false, issue: null};
    case DELETE_BILL_SUCCEEDED:
      log('delllllllllll');
      let itemsD = [...state.items];
      var newArray = itemsD.slice();
      let indexD = itemsD.findIndex((i) => i._id == action.payload._id);
      if (indexD != -1) {
        log('find the id');
        itemsD.splice(indexD, 1, action.payload);
      } else {
        log('do not find the id');
        var a=itemsD.length;
        var c=newArray.length;
        log(`${a} ${c}`);
      }
      //items.pop();
      return {...state, newArray, isDeleting: false};
    case DELETE_BILL_FAILED:
      return {...state, issue: action.payload.issue, isDeleting: false};
    case CANCEL_DELETE_BILL:
      return {...state, isDeleting: false, isDeletingCancelled: true};
    default:
      return state;
  }
};

