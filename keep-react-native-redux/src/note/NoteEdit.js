import React, {Component} from 'react';
import {Text, View, TextInput, ActivityIndicator} from 'react-native';
import {saveNote, cancelSaveNote} from './service';
import {registerRightAction, issueText, getLogger} from '../core/utils';
import styles from '../core/styles';

const log = getLogger('NoteEdit');
const NOTE_EDIT_ROUTE = 'note/edit';

export class NoteEdit extends Component {
  static get routeName() {
    return NOTE_EDIT_ROUTE;
  }

  static get route() {
    return {name: NOTE_EDIT_ROUTE, title: 'Note Edit', rightText: 'Save'};
  }

  constructor(props) {
    log('constructor');
    super(props);
    const nav = this.props.navigator;
    const currentRoutes = nav.getCurrentRoutes();
    const currentRoute = currentRoutes[currentRoutes.length - 1];
    if (currentRoute.data) {
      this.state = {note: {...currentRoute.data}, isSaving: false};
    } else {
      this.state = {note: {text: ''}, isSaving: false};
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
        <TextInput value={state.note.text} onChangeText={(text) => this.updateNoteText(text)}></TextInput>
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
      const noteState = store.getState().note;
      this.setState({...state, issue: noteState.issue});
    });
  }

  componentWillUnmount() {
    log('componentWillUnmount');
    this._isMounted = false;
    this.unsubscribe();
    this.props.store.dispatch(cancelSaveNote());
  }

  updateNoteText(text) {
    let newState = {...this.state};
    newState.note.text = text;
    this.setState(newState);
  }

  onSave() {
    log('onSave');
    this.props.store.dispatch(saveNote(this.state.note)).then(() => {
      log('onNoteSaved');
      if (!this.state.issue) {
        this.props.navigator.pop();
      }
    });
  }
}