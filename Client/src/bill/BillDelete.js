import React, {Component} from 'react';
import {Text, View, TextInput, TouchableOpacity, ActivityIndicator, Button} from 'react-native';
import {saveBill, cancelSaveBill, deleteBill} from './service';
import {registerRightAction, issueText, getLogger} from '../core/utils';
import styles from '../core/styles';
import {BillList} from './BillList';
const log = getLogger('BillDelete');
const BILL_DELETE_ROUTE = 'bill/delete';

export class BillDelete extends Component {
    static get routeName() {
        log('routename-delete');
        return BILL_DELETE_ROUTE;
    }

    static get route() {
        log('route-delete');
        return {name: BILL_DELETE_ROUTE, title: 'Bill Delete', rightText: 'Delete'};
    }

    constructor(props) {
        log('constructor');
        super(props);
        const nav = this.props.navigator;
        const currentRoutes = nav.getCurrentRoutes();
        const currentRoute = currentRoutes[currentRoutes.length - 1];
        if (currentRoute.data) {
            this.state = {bill: {...currentRoute.data}, isDeleting: false};
        } else {
            this.state = {bill: {text: ''}, isDeleting: false};
        }
        registerRightAction(this.props.navigator, this.onDelete.bind(this));
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
        <Text>Do you want to delete this bill?</Text>
        <Text>{this.state.bill.text}</Text>
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