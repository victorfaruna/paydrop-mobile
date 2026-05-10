import { COLORS } from "@/config/colors";
import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View className="bg-purple-500 rounded-b-[40px] pt-16 pb-8 px-6">
        {/* Top Bar */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="w-10 h-10 rounded-full bg-purple-400 items-center justify-center overflow-hidden">
            <Image 
              source={{ uri: 'https://i.pravatar.cc/100' }} 
              className="w-full h-full"
            />
          </View>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-white font-clash-medium text-sm mr-1">Account</Text>
            <Ionicons name="chevron-down" size={14} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Balance Section */}
        <View className="items-center mb-8">
          <Text className="text-purple-200 font-clash-regular text-sm mb-1">Total Balance</Text>
          <View className="flex-row items-baseline">
            <Text className="text-white font-clash-bold text-4xl">$240.000</Text>
            <Text className="text-purple-200 font-clash-medium text-xl ml-1">.000</Text>
          </View>
          <View className="bg-purple-600 px-4 py-1.5 rounded-full mt-4">
            <Text className="text-white font-clash-medium text-sm">+125,14</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between px-4">
          <ActionItem icon="send-outline" label="Send money" />
          <ActionItem icon="add-outline" label="Add money" />
          <ActionItem icon="wallet-outline" label="Details" />
        </View>
      </View>

      {/* Promo Section */}
      <View className="px-6 mt-8">
        <TouchableOpacity className="bg-grey-50 rounded-3xl p-5 flex-row items-center border border-grey-100">
          <View className="w-12 h-12 bg-orange-100 rounded-2xl items-center justify-center mr-4">
            <Ionicons name="ribbon-outline" size={24} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text className="text-black font-clash-semibold text-base">Earn up to $150 in crypto</Text>
            <Text className="text-grey-500 font-clash-regular text-xs mt-0.5">Learn how to use Web3 and unlock bonus tokens</Text>
          </View>
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Transactions Section */}
      <View className="px-6 mt-8 pb-10">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-clash-semibold text-black">Transactions</Text>
          <TouchableOpacity>
            <Text className="text-grey-400 font-clash-medium text-sm">See all</Text>
          </TouchableOpacity>
        </View>

        <TransactionItem 
          name="Ciank" 
          date="Oct 24, 2024" 
          amount="+$36.00" 
          time="08:12 PM" 
          type="up" 
        />
        <TransactionItem 
          name="Amakora" 
          date="Oct 24, 2024" 
          amount="+$40.00" 
          time="01:20 AM" 
          type="down" 
        />
        <TransactionItem 
          name="Captan balham" 
          date="Oct 24, 2024" 
          amount="+$32.10" 
          time="02:22 PM" 
          type="up" 
        />
        <TransactionItem 
          name="Jhon Smith" 
          date="Oct 24, 2024" 
          amount="+$72.10" 
          time="02:22 PM" 
          type="up" 
        />
      </View>
    </ScrollView>
  );
}

function ActionItem({ icon, label }: { icon: any, label: string }) {
  return (
    <TouchableOpacity className="items-center">
      <View className="w-14 h-14 bg-purple-400/30 rounded-full items-center justify-center mb-2">
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text className="text-white font-clash-medium text-xs">{label}</Text>
    </TouchableOpacity>
  );
}

function TransactionItem({ name, date, amount, time, type }: any) {
  return (
    <View className="bg-grey-50 rounded-2xl p-4 flex-row items-center mb-3 border border-grey-100">
      <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4">
        <Ionicons 
          name={type === 'up' ? 'arrow-up-outline' : 'arrow-down-outline'} 
          size={20} 
          color="#9CA3AF" 
        />
      </View>
      <View className="flex-1">
        <Text className="text-black font-clash-semibold text-base">{name}</Text>
        <Text className="text-grey-400 font-clash-regular text-xs mt-1">{date}</Text>
      </View>
      <View className="items-end">
        <Text className="text-black font-clash-semibold text-base">{amount}</Text>
        <Text className="text-grey-400 font-clash-regular text-xs mt-1">{time}</Text>
      </View>
    </View>
  );
}
