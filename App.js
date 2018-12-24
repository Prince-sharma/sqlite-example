import Expo, { SQLite,  Constants, BarCodeScanner, Permissions  } from 'expo';
import React, { Component } from 'react';
import { Button, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';




const db = SQLite.openDatabase('db.db'); 

class Items extends React.Component {
  state = {
    items: null,
    valid: true,
  };

  componentDidMount() {
    this.update();
  }

  render() {
    const { items } = this.state;
    if (items === null || items.length === 0) {
      return null;
    }

    return (
      <View style={{ margin: 5 }}>
        {items.map(({ id, roll, done }) => (
          <TouchableOpacity
            key={id}
            onPress={() => this.props.onPressItem && this.props.onPressItem(id)}
            style={{
              padding: 5,
              backgroundColor: done ? '#aaffaa' : 'white',
              borderColor: 'black',
              borderWidth: 1,
            }}>
            <Text>{roll}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  update() {
    db.transaction(tx => {
      tx.executeSql(
        `select * from items where done = ?;`,
        [this.props.done ? 1 : 0],
        (_, { rows: { _array } }) => this.setState({ items: _array })
      );
    });
  }
}

export default class App extends React.Component {
  state = {
    text: null,
    hasCameraPermission: null  // added prince
  };

  componentDidMount() {
    this._requestCameraPermission();  //added prince
    // db.transaction(tx => {
    //   tx.executeSql(
    //     'drop table items;', [], ()=>{console.log("delete old table")}
    //   );
    // });
    db.transaction(tx => {
      tx.executeSql(
        'create table if not exists items (id integer primary key not null, roll string unique not null, done int);'
      );
    });
  }

  // added prince

  _requestCameraPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermission: status === 'granted',
    });
  };

  // added prince

  // added prince  
  sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }

  _handleBarCodeRead = data => {
    this.add(data.data);
    this.sleep(1000);
    console.log("in handle");
  };

  //added prince

  // added by ea
  showdb() {
    db.transaction(
      tx => {
        //tx.executeSql('insert into items (done, value) values (0, ?)', [text]);
        tx.executeSql('SELECT * FROM items', [], (_, {rows}) =>
          console.log(rows)
        );
      },
      null,
      this.update
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            flexDirection: 'row',
          }}>
          <TextInput
            style={{
              flex: 1,
              padding: 5,
              height: 40,
              borderColor: 'gray',
              borderWidth: 1,
            }}
            placeholder="what do you need to do?"
            value={this.state.text}
            onChangeText={text => this.setState({ text })}
            onSubmitEditing={() => {
              this.add(this.state.text);
              this.setState({ text: null });
            }}
          />
          <Button
            onPress={this.showdb}
            title="Learn More"
            color="#841584"
            accessibilityLabel="Learn more about this purple button"
          />
        </View>



        <View style={styles.container}>
        {this.state.hasCameraPermission === null ?
          <Text>Requesting for camera permission</Text> :
          this.state.hasCameraPermission === false ?
            <Text>Camera permission is not granted</Text> :
            <BarCodeScanner
              torchMode="off"
              onBarCodeRead={this._handleBarCodeRead}
              style={{ height: 200, width: 200 }}
            />
        }
      </View>




        <View style={{ flex: 1, backgroundColor: 'gray' }}>
          <Items
            done={false}
            ref={todo => (this.todo = todo)}
            onPressItem={id =>
              db.transaction(
                tx => {
                  tx.executeSql(`update items set done = 1 where id = ?;`, [id]);
                },
                null,
                this.update
              )}
          />
          <Items
            done={true}
            ref={done => (this.done = done)}
            onPressItem={id =>
              db.transaction(
                tx => {
                  tx.executeSql(`delete from items where id = ?;`, [id]);
                },
                null,
                this.update
              )}
          />
        </View>
      </View>
    );
  }

  add(text) {
    db.transaction(
      tx => {
        tx.executeSql('insert into items (roll, done) values (?, 0)', [text], ()=>{}, this.errorHandle);
        //(tx, error)=>{console.log(error.message)});
      },
      null,
      this.update
    );
  }

  errorHandle(tx, error){
    Alert.alert(
      'Error',
      'User has already issued pass',
      [
        //{text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
        //{text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
        {text: 'OK', onPress: () => console.log('OK Pressed')},
      ],
      //{ cancelable: false }
    )
  }

  compare(text) {
    db.transaction(
      tx => {

        tx.executeSql('SELECT items.roll FROM items WHERE items.roll = ?', [text], 
          (tx, ResultSet) => {console.log("rows affected"); console.log(ResultSet)}, this.errorHandle);
          //(tx, error) => {console.log(error.message)});

        //console.log(foo);
        
        this.setState({valid : Boolean(false)})
        console.log("after compare"+this.state.valid) 
        /*tx.executeSql('select * from items', [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
          
        );*/
      },
      Boolean,
      
    );

    


  }

  update = () => {
    this.todo && this.todo.update();
    this.done && this.done.update();
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Expo.Constants.statusBarHeight,
  },
});
