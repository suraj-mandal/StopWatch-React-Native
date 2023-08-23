import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput
} from "react-native";

import { Feather, Entypo } from "@expo/vector-icons";

import { BottomSheet } from "./BottomSheet";

import moment from "moment";

function Timer({ interval, style }) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  const duration = moment.duration(interval);
  const centiseconds = Math.floor(duration.milliseconds() / 10);

  return (
    <View style={styles.timerContainer}>
      <Text style={style}>{pad(duration.minutes())}:</Text>
      <Text style={style}>{pad(duration.seconds())}:</Text>
      <Text style={style}>{pad(centiseconds)}</Text>
    </View>
  );
}

function RoundButton({ title, color, background, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onPress()}
      style={[styles.button, { backgroundColor: background }]}
      activeOpacity={disabled ? 1.0 : 0.7}
    >
      <Text style={[styles.buttonTitle, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

function Lap({
  number,
  interval,
  extraStyles,
  onSaveRecord,
  totalLaps,
  fastest,
  slowest,
}) {
  return (
    <TouchableOpacity
      onPress={() => onSaveRecord({ index: number, lap: interval })}
      style={[styles.lap, extraStyles]}
    >
      <Text style={styles.lapText}>Lap {number}</Text>
      <Timer style={styles.lapTimer} interval={interval} />
    </TouchableOpacity>
  );
}

function Record({ title, lap, id, onDeleteRecord, extraStyles }) {
  console.log(title, lap);
  return (
    <TouchableOpacity
      onLongPress={() => onDeleteRecord(id)}
      style={[styles.lap, extraStyles]}>
      <Text style={styles.lapText}>{title}</Text>
      <Timer style={styles.lapTimer} interval={lap} />
    </TouchableOpacity>
  );
}

function RecordsTableFlatList({ records, onDeleteRecord }) {
  const totalRecords = records.length;

  const recordItems = records.map((record, idx) => {
    return { id: idx, ...record };
  });

  return (
    <FlatList
      contentContainerStyle={{ flexGrow: 1 }}
      style={styles.scrollView}
      data={recordItems}
      renderItem={({ item }) => {
        console.log("Record", item.id);
        return (
          <Record
            title={item.title}
            lap={item.lap}
            id={item.id}
            onDeleteRecord={onDeleteRecord}
            extraStyles={[
              {
                backgroundColor: item.id % 2 === 0 ? "#f2f2f2" : "#fff",
              },
              item.id === 0 && styles.firstLap,
              item.id === totalRecords - 1 && styles.lastLap,
            ]}
          />
        );
      }}
    />
  );
}

function LapsTableFlatList({ laps, timer, onSaveRecord}) {
  const totalLaps = laps.length;

  const lapItems = laps.map((lap, idx) => {
    return { lap: lap, id: totalLaps - idx };
  });

  return (
    <FlatList
      contentContainerStyle={{ flexGrow: 1 }}
      style={styles.scrollView}
      data={lapItems}
      renderItem={({ item }) => (
        <Lap
          number={item.id}
          key={item.id}
          totalLaps={totalLaps}
          interval={item.id === totalLaps ? timer + item.lap : item.lap}
          onSaveRecord={onSaveRecord}
          extraStyles={[
            {
              backgroundColor: item.id % 2 === 0 ? "#f2f2f2" : "#fff",
            },
            item.id === totalLaps && styles.firstLap,
            item.id === 1 && styles.lastLap,
          ]}
        />
      )}
    ></FlatList>
  );
}

function ButtonsRow({ children }) {
  return <View style={styles.buttonsRow}>{children}</View>;
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      start: 0,
      now: 0,
      laps: [],
      records: [],
      searchedRecords: [],
      isTimerActive: true,
      isSaveBottomModalVisible: false,
      isSaveModalVisible: false,
      isDeleteRecordModalVisible: false,
      currentSelectedLapNumber: 0,
      currentSelectedRecord: null,
      searchRecordTerm: null,
      currentLapTitle: "",
      currentLap: null,
      recordDeleteIndex: null,
      recordDeleteTitle: null,
      bounceValue: new Animated.Value(100),
    };
    this.initiateSave = this.initiateSave.bind(this);
    this.hide = this.hide.bind(this);
    this.previewCurrentRecord = this.previewCurrentRecord.bind(this);
    this.onChangeLapTitle = this.onChangeLapTitle.bind(this);
    this.closeSaveModal = this.closeSaveModal.bind(this);
    this.saveCurrentRecord = this.saveCurrentRecord.bind(this);
    this.onSearchRecord = this.onSearchRecord.bind(this);
    this.onDeleteRecord = this.onDeleteRecord.bind(this);
    this.removeRecord = this.removeRecord.bind(this);
    this.closeDeleteRecordModal = this.closeDeleteRecordModal.bind(this);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  hide() {
    this.setState({ isSaveBottomModalVisible: false });
  }

  closeSaveModal() {
    this.setState({ isSaveModalVisible: false});
  }

  closeDeleteRecordModal() {
    this.setState({ isDeleteRecordModalVisible: false });
  }


  initiateSave({ index, lap }) {
    this.setState({
      isSaveBottomModalVisible: true,
      currentSelectedLapNumber: index,
      currentLap: lap,
    });
  }

  onDeleteRecord(currentDeleteRecordIdx) {
    this.setState({
      recordDeleteIndex: currentDeleteRecordIdx,
      isDeleteRecordModalVisible: true,
      recordDeleteTitle: this.state.records[currentDeleteRecordIdx].title
    })
  }

  removeRecord() {
    this.setState({
      records: this.state.records.filter((record, idx) => {
        return idx !== this.state.recordDeleteIndex
      }),
      isDeleteRecordModalVisible: false,
      recordDeleteTitle: null
    })
  }

  previewCurrentRecord() {
    this.setState({
      isSaveBottomModalVisible: false,
      isSaveModalVisible: true,
    });
  }

  saveCurrentRecord = () => {
    if (this.state.currentLapTitle && this.state.currentLapTitle !== "") {
      const currentRecords = this.state.records;
      this.setState({
        records: [
          {
            lap: this.state.currentLap,
            title: this.state.currentLapTitle,
          },
          ...currentRecords,
        ],
        isSaveModalVisible: false,
        currentLapTitle: "",
      });
    }
    console.log(this.state.isSaveModalVisible);
    console.log(this.state.records);
  };

  onSearchRecord(currentTitle) {
    if (currentTitle && currentTitle !== '') {
      this.setState({
        searchRecordTerm: currentTitle,
        searchedRecords: this.state.records.filter(record =>
          record.title.toLowerCase().startsWith(currentTitle.toLowerCase()))
      })
    } else {
      this.setState({
        searchRecordTerm: null,
        searchedRecords: []
      });
    }
  }

  start = () => {
    const now = new Date().getTime();
    this.setState({
      start: now,
      now,
      laps: [0],
      isTimerActive: true,
      saveRecordVisible: false,
    });
    this.timer = setInterval(() => {
      this.setState({ now: new Date().getTime() });
    }, 100);
  };

  lap = () => {
    const timestamp = new Date().getTime();
    const { laps, now, start } = this.state;
    const [firstLap, ...other] = laps;
    this.setState({
      laps: [0, firstLap + now - start, ...other],
      start: timestamp,
      now: timestamp,
    });
    console.log(this.state.laps);
  };

  stop = () => {
    clearInterval(this.timer);
    const { laps, now, start } = this.state;
    const [firstLap, ...other] = laps;
    this.setState({
      laps: [firstLap + now - start, ...other],
      start: 0,
      now: 0,
    });
  };

  reset = () => {
    this.setState({
      laps: [],
      start: 0,
      now: 0,
      isTimerActive: true,
    });
  };

  resume = () => {
    const now = new Date().getTime();
    this.setState({
      start: now,
      now,
      isTimerActive: true,
    });
    this.timer = setInterval(() => {
      this.setState({ now: new Date().getTime() });
    }, 100);
  };

  toggleTimer = () => {
    this.setState((prevState) => ({
      isTimerActive: !prevState.isTimerActive,
      searchedRecords: [],
      searchRecordTerm: null
    }));
  };

  onChangeLapTitle(newTitle) {
    this.setState({
      currentLapTitle: newTitle,
    });
  }

  render() {
    const { now, start, laps, isTimerActive } = this.state;
    const timer = now - start;

    const currentRecords = this.state.records;
    // console.log(currentRecords);

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <BottomSheet
          show={this.state.isSaveBottomModalVisible}
          height={200}
          onOuterClick={this.hide}
        >
          <View style={styles.bottomModalContainer}>
            <View style={styles.bottomModalTextContainer}>
              <Text style={{ fontWeight: "500" }}>
                Save Lap {this.state.currentSelectedLapNumber} in records?
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={this.previewCurrentRecord}
            >
              <Text style={{ color: "#fff" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={this.hide}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        <Modal
          animationType={"slide"}
          transparent={true}
          visible={this.state.isSaveModalVisible}
          onRequestClose={this.closeSaveModal}
          // modalContainerStyle={{backgroundColor: "#000"}}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.7)",
            }}
          >
            <View
              style={{
                padding: 20,
                width: "80%",
                backgroundColor: "#fff",
                borderRadius: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: "#000",
                    fontWeight: "700",
                    fontSize: 18,
                  }}
                >
                  Title Record
                </Text>
                <TouchableOpacity onPress={this.closeSaveModal}>
                  <Text>X</Text>
                </TouchableOpacity>
              </View>
              <View>
                <TextInput
                  onChangeText={this.onChangeLapTitle}
                  value={this.state.currentLapTitle}
                  style={{
                    height: 40,
                    marginVertical: 12,
                    borderWidth: 1,
                    padding: 10,
                    borderRadius: 5,
                    borderColor: "#eee",
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row-reverse",
                }}
              >
                <TouchableOpacity onPress={this.saveCurrentRecord}>
                  <Text
                    style={{
                      color: "#408493",
                      fontWeight: "500",
                      fontSize: 16,
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.closeSaveModal}>
                  <Text
                    style={{
                      color: "#888",
                      marginRight: 16,
                      fontWeight: "500",
                      fontSize: 16,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


        <Modal
          animationType={"slide"}
          transparent={true}
          visible={this.state.isDeleteRecordModalVisible}
          onRequestClose={this.closeSaveModal}
          // modalContainerStyle={{backgroundColor: "#000"}}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.7)",
            }}
          >
            <View
              style={{
                padding: 20,
                width: "80%",
                backgroundColor: "#fff",
                borderRadius: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: "#000",
                    fontWeight: "700",
                    fontSize: 18,
                  }}
                >
                  Title Record
                </Text>
                <TouchableOpacity onPress={this.closeDeleteRecordModal}>
                  <Text>X</Text>
                </TouchableOpacity>
              </View>
              <View style={{
                marginVertical: 20
              }}>
                <Text>
                  Are you sure you want to delete '{this.state.recordDeleteTitle}' from records?
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row-reverse",
                }}
              >
                <TouchableOpacity onPress={this.removeRecord}>
                  <Text
                    style={{
                      color: "#D42A66",
                      fontWeight: "500",
                      fontSize: 16,
                    }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.closeDeleteRecordModal}>
                  <Text
                    style={{
                      color: "#888",
                      marginRight: 16,
                      fontWeight: "500",
                      fontSize: 16,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={[styles.container]}>
          <View style={[styles.toggleBar]}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isTimerActive ? styles.activeButton : null,
              ]}
              onPress={this.toggleTimer}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  isTimerActive ? styles.activeButtonText : null,
                ]}
              >
                Timer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !isTimerActive ? styles.activeButton : null,
              ]}
              onPress={this.toggleTimer}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  !isTimerActive ? styles.activeButtonText : null,
                ]}
              >
                Records
              </Text>
            </TouchableOpacity>
          </View>

          {isTimerActive ? (
            <View style={styles.timerViewContainer}>
              <View style={styles.timerSection}>
                <Timer
                  interval={
                    laps.reduce((total, curr) => total + curr, 0) + timer
                  }
                  style={styles.timer}
                />
              </View>
              <View style={styles.buttonSection}>
                {laps.length === 0 && (
                  <ButtonsRow>
                    <RoundButton
                      title="Lap"
                      color="#000"
                      background="#F9F9F9"
                      disabled
                    />
                    <RoundButton
                      title="Start"
                      color="#ffffff"
                      background="#2EAA8B"
                      onPress={this.start}
                    />
                  </ButtonsRow>
                )}
                {start > 0 && (
                  <ButtonsRow>
                    <RoundButton
                      title="Lap"
                      color="#000000"
                      background="#F2F2F2"
                      onPress={this.lap}
                    />
                    <RoundButton
                      title="Stop"
                      color="#ffffff"
                      background="#D33852"
                      onPress={this.stop}
                    />
                  </ButtonsRow>
                )}

                {laps.length > 0 && start === 0 && (
                  <ButtonsRow>
                    <RoundButton
                      title="Reset"
                      color="#000000"
                      background="#F2F2F2"
                      onPress={this.reset}
                    />
                    <RoundButton
                      title="Start"
                      color="#ffffff"
                      background="#2EAA8B"
                      onPress={this.resume}
                    />
                  </ButtonsRow>
                )}
              </View>
              <SafeAreaView style={{ flex: 6, width: "100%" }}>
                <LapsTableFlatList
                  laps={laps}
                  timer={timer}
                  onSaveRecord={this.initiateSave}
                />
              </SafeAreaView>
            </View>
          ) : (
            <SafeAreaView style={{ width: "100%" }}>
              <View style={{ width: "100%", height: 40,
                    marginVertical: 12,
                    borderWidth: 1,
                    padding: 10,
                  borderRadius: 5,
                  flexDirection: 'row',
                    alignItems: 'center',
                    borderColor: "#eee" }}>
                  <Feather
                    name="search"
                    size={15}
                    color="black"
                    style={{ marginLeft: 1}}
                  />
                <TextInput
                  onChangeText={this.onSearchRecord}
                  value={this.state.searchRecordTerm}
                  style={{
                    flex: 1,
                    marginLeft: 8
                  }}
                />
              </View>
              <SafeAreaView>
                  <RecordsTableFlatList records={this.state.searchRecordTerm
                    ? this.state.searchedRecords : this.state.records} onDeleteRecord={this.onDeleteRecord} />
              </SafeAreaView>
            </SafeAreaView>
          )}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  timerSection: {
    // backgroundColor: "gray",
    flex: 1.2,
  },
  bottomModalTextContainer: {
    marginTop: 10,
  },
  bottomModalContainer: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flex: 1,
    width: "100%",
  },
  modalButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 5,
    marginVertical: 5,
  },
  saveButton: {
    backgroundColor: "#408493",
    marginTop: 25,
  },
  cancelButton: {
    backgroundColor: "#f2f2f2",
  },
  buttonSection: {
    // backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    flex: 2,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 16,
    overflow: "scroll",
  },
  timerViewContainer: {
    flex: 12,
    width: "95%",
    alignItems: "center",
  },
  toggleBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  toggleButton: {
    width: 156,
    height: 40,
    marginHorizontal: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
  },
  toggleButtonText: {
    fontSize: 16,
  },
  activeButton: {
    backgroundColor: "#222222",
  },
  activeButtonText: {
    color: "#ffffff",
  },
  timer: {
    fontSize: 50,
    fontWeight: "400",
  },
  timerContainer: {
    flexDirection: "row",
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonTitle: {
    fontSize: 18,
  },
  buttonsRow: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lap: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    alignItems: "center",
    borderColor: "#F2F2F2",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  firstLap: {
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  lastLap: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  lapText: {
    fontSize: 18,
  },
  lapTimer: {},
  scrollView: {
    // alignSelf: "stretch",
    // height: 50,
    flex: 1,
    marginTop: 20,
    overflow: "scroll",
  },
});
