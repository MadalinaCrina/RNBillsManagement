import React, {Component} from 'react';
import {ListView, Text, View, StatusBar, ActivityIndicator} from 'react-native';
import {BillEdit} from './BillEdit';
import {BillView} from './BillView';
import {BillDelete} from './BillDelete'
import {loadBills, cancelLoadBills} from './service';
import {registerRightAction, getLogger, issueText} from '../core/utils';
import styles from '../core/styles';

const log = getLogger('BillList');
const BILL_LIST_ROUTE = 'bill/list';

export class BillList extends Component {
  static get routeName() {
    return BILL_LIST_ROUTE;
  }

  static get route() {
    return {name: BILL_LIST_ROUTE, title: 'Bill List', rightText: 'New'};
  }

  constructor(props) {
    super(props);
    log('constructor');
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.id !== r2.id});
    const billState = this.props.store.getState().bill;
    this.state = {isLoading: billState.isLoading, dataSource: this.ds.cloneWithRows(billState.items)};
    registerRightAction(this.props.navigator, this.onNewBill.bind(this));
  }

  render() {
    log('render');
    let message = issueText(this.state.issue);
    return (
      <View style={styles.content}>
        { this.state.isLoading &&
        <ActivityIndicator animating={true} style={styles.activityIndicator} size="large"/>
        }
        {message && <Text>{message}</Text>}
        <ListView
          dataSource={this.state.dataSource}
          enableEmptySections={true}
          renderRow={bill => (<BillView bill={bill} onLongPress={(bill) => this.onBillLongPress(bill)} onPress={(bill) => this.onBillPress(bill)}/>)}/>
      </View>
    );
  }

  onNewBill() {
    log('onNewBill');
    this.props.navigator.push({...BillEdit.route});
  }
  onBillLongPress(bill) {
    log('onBillLongPress');
    this.props.navigator.push({...BillDelete.route, data: bill});
  }
  onBillPress(bill) {
    log('onBillPress');
    this.props.navigator.push({...BillEdit.route, data: bill});
  }

  componentDidMount() {
    log('componentDidMount');
    this._isMounted = true;
    const store = this.props.store;
    this.unsubscribe = store.subscribe(() => {
      log('setState');
      const state = this.state;
      const billState = store.getState().bill;
      this.setState({dataSource: this.ds.cloneWithRows(billState.items), isLoading: billState.isLoading});
    });
    store.dispatch(loadBills());
  }

  componentWillUnmount() {
    log('componentWillUnmount');
    this._isMounted = false;
    this.unsubscribe();
    this.props.store.dispatch(cancelLoadBills());
  }
}
