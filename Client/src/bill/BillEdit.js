import React, {Component} from 'react';
import {Text, View, TextInput, TouchableOpacity, ActivityIndicator, Button} from 'react-native';
import {saveBill, cancelSaveBill, deleteBill} from './service';
import {registerRightAction, issueText, getLogger} from '../core/utils';
import styles from '../core/styles';

const log = getLogger('BillEdit');
const BILL_EDIT_ROUTE = 'bill/edit';

export class BillEdit extends Component {
  static get routeName() {
    return BILL_EDIT_ROUTE;
  }

  static get route() {
    return {name: BILL_EDIT_ROUTE, title: 'Bill Edit', rightText: 'Save', rText: 'Delete'};
  }

  constructor(props) {
    log('constructor');
    super(props);
    const nav = this.props.navigator;
    const currentRoutes = nav.getCurrentRoutes();
    const currentRoute = currentRoutes[currentRoutes.length - 1];
    if (currentRoute.data) {
      this.state = {bill: {...currentRoute.data}, isSaving: false};
    } else {
      this.state = {bill: {text: ''}, isSaving: false};
    }
      registerRightAction(this.props.navigator, this.onSave.bind(this));
  }

  render() {
    log('render');
    const state = this.state;
    let message = issueText(state.issue);
    return (
      <View style={styles.content}>
        { state.isSaving &&
        <ActivityIndicator animating={true} style={styles.activityIndicator} size="large"/>
        }
        <Text>Text</Text>
        <TextInput value={state.bill.text} onChangeText={(text) => this.updateBillText(text)}></TextInput>
        {message && <Text>{message}</Text>}


    </View>
    );
  }

  componentDidMount() {
    log('componentDidMount');
    this._isMounted = true;
    const store = this.props.store;
    this.unsubscribe = store.subscribe(() => {
      log('setState');
      const state = this.state;
      const billState = store.getState().bill;
      this.setState({...state, issue: billState.issue});
    });
  }

  componentWillUnmount() {
    log('componentWillUnmount');
    this._isMounted = false;
    this.unsubscribe();
    this.props.store.dispatch(cancelSaveBill());
  }

  updateBillText(text) {
    let newState = {...this.state};
    newState.bill.text = text;
    this.setState(newState);
  }

    onSave() {
        log('onSave');
        this.props.store.dispatch(saveBill(this.state.bill)).then(() => {
            log('onBillSaved');
            if (!this.state.issue) {
                this.props.navigator.pop();
            }
        });
    }

    onDelete() {
        log('onDelete');
        this.props.store.dispatch(deleteBill(this.state.bill)).then(() => {
            log('onBillDeleted');
            if (!this.state.issue) {
                this.props.navigator.pop();
            }
        });
    }
}