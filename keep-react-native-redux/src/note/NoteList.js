import React, {Component} from 'react';
import {ListView, Text, View, StatusBar, ActivityIndicator} from 'react-native';
import {NoteEdit} from './NoteEdit';
import {NoteView} from './NoteView';
import {loadNotes, cancelLoadNotes} from './service';
import {registerRightAction, getLogger, issueText} from '../core/utils';
import styles from '../core/styles';

const log = getLogger('NoteList');
const NOTE_LIST_ROUTE = 'note/list';

export class NoteList extends Component {
  static get routeName() {
    return NOTE_LIST_ROUTE;
  }

  static get route() {
    return {name: NOTE_LIST_ROUTE, title: 'Note List', rightText: 'New'};
  }

  constructor(props) {
    super(props);
    log('constructor');
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.id !== r2.id});
    const noteState = this.props.store.getState().note;
    this.state = {isLoading: noteState.isLoading, dataSource: this.ds.cloneWithRows(noteState.items)};
    registerRightAction(this.props.navigator, this.onNewNote.bind(this));
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
          renderRow={note => (<NoteView note={note} onPress={(note) => this.onNotePress(note)}/>)}/>
      </View>
    );
  }

  onNewNote() {
    log('onNewNote');
    this.props.navigator.push({...NoteEdit.route});
  }

  onNotePress(note) {
    log('onNotePress');
    this.props.navigator.push({...NoteEdit.route, data: note});
  }

  componentDidMount() {
    log('componentDidMount');
    this._isMounted = true;
    const store = this.props.store;
    this.unsubscribe = store.subscribe(() => {
      log('setState');
      const state = this.state;
      const noteState = store.getState().note;
      this.setState({dataSource: this.ds.cloneWithRows(noteState.items), isLoading: noteState.isLoading});
    });
    store.dispatch(loadNotes());
  }

  componentWillUnmount() {
    log('componentWillUnmount');
    this._isMounted = false;
    this.unsubscribe();
    this.props.store.dispatch(cancelLoadNotes());
  }
}
