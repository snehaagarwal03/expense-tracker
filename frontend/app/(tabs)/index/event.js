import {SafeAreaView} from "react-native-safe-area-context";
import {router, useLocalSearchParams} from "expo-router";
import React, {useEffect, useState} from "react";
import {service} from "../../../utils/service";
import {Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View} from "react-native";
import icons from "../../../constants/icons";
import {getToken, getUserData} from "../../../utils/userdata";
import ToggleSwitch from "../../../components/ToggleSwitch";
import InvoiceCard from "../../../components/InvoiceCard";
import AddButton from "../../../components/AddButton";

const ButtonComponent = ({text, icon, onPress, active, extraPadding=false}) => {
  return (
    <View className={`flex flex-row bg-darkgray w-[47.5%] py-2 px-2 rounded-full ${extraPadding ? 'mr-[5%]' : ''}`}>
      <TouchableOpacity onPress={onPress} style={{width: '100%'}}>
        <View className="flex flex-row items-center justify-between">
          <View className={`${active ? 'bg-secondary' : 'bg-lightgray'} rounded-full p-1`}>
            <Image source={icon} className="w-4 h-4 m-1" resizeMode="contain"></Image>
          </View>
          <Text className="text font-bold text-white">{text}</Text>
          <Text></Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function numberWithCommas(x) {
  if (!x) return x;
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function Event() {

  const [data, setData] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [toggle, setToggle] = useState(false);
  const [userData, setUserData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { eventId } = useLocalSearchParams();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
  }, []);

  useEffect(() => {
    service.get(`/event/${eventId}`).then((response) => {
      if (!response.success) {
        router.back();
      }
      setData({...response.data, budgetLeft: response.data.budget - response.data.expenditure});
      setToggle(!data.closed);
    });

    service.get(`/invoice/event/${eventId}`).then((response) => {
      if (!response.success) {
        return;
      }
      setInvoices(response.data);
      setRefreshing(false);
    });
  }, [refreshing]);

  useEffect(() => {
    getToken().then(setToken);
    getUserData().then(setUserData);
  }, []);

  function deleteEvent() {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "OK", onPress: async() => {
            const response = await service.post(`/event/delete`, {id: eventId});
            if (response.success) {
              router.back();
            }
          }
        }
      ]
    );
  }

  async function handleToggle() {
    const res = await service.post(`/event/close`, {id: eventId, value: toggle});
    if (res.success) {
      setToggle(!toggle);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>

      <View className="h-full flex justify-start items-center bg-primary pt-[5%] w-full">
        <View className="flex flex-row items-center mb-5 h-[30%]">
          <Image source={{
            uri: data.image,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
          }} className="w-full h-full" resizeMode="cover" />
          <View className="absolute flex top-0 bg-[#000000a0] w-full h-full justify-end items-center">
            <Text className="text-5xl font-bold color-white">{data.name}</Text>
            <View className="w-[70%] pt-10 pb-2 flex-row">
              <ButtonComponent
                text={"INFO"}
                icon={icons.edit}
                active={activeTab === 'info'}
                extraPadding={true}
                onPress={() => setActiveTab('info')}
              />
              <ButtonComponent
                text={"INVOICES"}
                icon={icons.invoice}
                active={activeTab === 'invoice'}
                onPress={() => setActiveTab('invoice')}
              />
            </View>
          </View>
        </View>

        {activeTab === 'info' ?
          <View className="w-[80%]">
            <View>
              <Text className="text-gray">{data.description}</Text>
            </View>
            <View className="pt-8 gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl text-white">Budget Alloted</Text>
                <Text className="text-xl text-secondary font-bold">Rs {numberWithCommas(data.budget)}/-</Text>
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl text-white">Expenditure</Text>
                <Text className="text-xl text-secondary font-bold">Rs {numberWithCommas(data.expenditure)}/-</Text>
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl text-white">Left</Text>
                <Text className={`text-xl ${data.budgetLeft >= 0 ? 'text-secondary' : 'text-red-500'} font-bold`}>Rs {numberWithCommas(data.budgetLeft)}/-</Text>
              </View>
            </View>
            {userData.role === 'EC' ? <View className="bg-darkgray mt-8 p-3 rounded-full">
              <TouchableOpacity>
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-xl font-bold text-white pl-2">Accepting Invoices</Text>
                  <ToggleSwitch size={"small"} toggle={toggle} handleToggle={handleToggle} />
                </View>
              </TouchableOpacity>
            </View> : null}
            {userData.role === 'EC' ? <View className="mt-4 flex flex-row">
              <View className="bg-darkgray rounded-full w-[47.5%] py-3 items-center justify-center mr-[5%]">
                <TouchableOpacity>
                  <Text className="text-xl font-bold text-white">Edit</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-fadered rounded-full w-[47.5%] py-3 items-center justify-center">
                <TouchableOpacity onPress={deleteEvent}>
                  <Text className="text-xl font-bold text-white">Delete</Text>
                </TouchableOpacity>
              </View>
            </View> : null}
          </View>
          :
          <View className="w-full flex items-center">
            <FlatList
              className="flex flex-grow h-[55%] w-[90%]"
              data={invoices}
              renderItem={({item}) => <InvoiceCard invoice={item} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
            <AddButton text={"Add invoice"} route={`create-invoice?eventId=${data.id}`} />
          </View>
        }

      </View>

    </SafeAreaView>
  )
}

export default Event;
