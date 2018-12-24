import Expo, { SQLite,  Constants, BarCodeScanner, Permissions  } from 'expo';
import React, { Component } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';




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
        {items.map(({ id, done, value }) => (
          <TouchableOpacity
            key={id}
            onPress={() => this.props.onPressItem && this.props.onPressItem(id)}
            style={{
              padding: 5,
              backgroundColor: done ? '#aaffaa' : 'white',
              borderColor: 'black',
              borderWidth: 1,
            }}>
            <Text>{value}</Text>
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
    db.transaction(tx => {
      tx.executeSql(
        'create table if not exists items (id integer primary key not null, done int, value text);'
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

  _handleBarCodeRead = data => {

    this.compare(JSON.stringify(data.data));

     var isTrueSet = this.state.valid;

    console.log(data.data);


    if(!isTrueSet) 
    {
    
    
      this.add(JSON.stringify(data));
    }



    

  };

  //added prince

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
        tx.executeSql('insert into items (done, value) values (0, ?)', [text]);
        /*tx.executeSql('select * from items', [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );*/
      },
      null,
      this.update
    );
  }

  compare(text) {
    db.transaction(
      tx => {

        foo = tx.executeSql('SELECT items.value FROM items WHERE items.value = ?', [text], (ResultSet) => {console.log(ResultSet)}, 
          () => {console.log("error")});

        //console.log(foo);
        
        this.setState({valid : Boolean([foo])}) 
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
