import { useUserStore } from "@/store/userStore";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "https://pay-drop-backend.vercel.app";
const DEVICE_ID = "paydrop-mobile-app";

interface User {
  id: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  avatar_url?: string | null;
  squad_virtual_account?: string | null;
  squad_bank_code?: string | null;
  kyc_verified?: boolean;
  balance?: number;
  wallet_balance?: number;
}

interface Transaction {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: number;
  status: string;
  note: string;
  squad_ref: string;
  fraud_score: number;
  fraud_verdict: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_USER: User = {
  id: "0",
  phone: "+2348123456789",
  first_name: "Demo",
  last_name: "User",
  email: "demo@paydrop.com",
  avatar_url: "https://i.pravatar.cc/100",
  squad_virtual_account: "0123456789",
  squad_bank_code: "050",
  kyc_verified: true,
  balance: 1200000,
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    sender_id: "u2",
    recipient_id: "u0",
    amount: 250000,
    status: "completed",
    note: "Salary credit",
    squad_ref: "PayDay",
    fraud_score: 5,
    fraud_verdict: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t2",
    sender_id: "u0",
    recipient_id: "u3",
    amount: -75000,
    status: "completed",
    note: "Dinner with friends",
    squad_ref: "Foodie",
    fraud_score: 8,
    fraud_verdict: "approved",
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: "t3",
    sender_id: "u0",
    recipient_id: "u4",
    amount: -150000,
    status: "pending",
    note: "Gift purchase",
    squad_ref: "Gift Shop",
    fraud_score: 12,
    fraud_verdict: "review",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const accessToken = useUserStore((state) => state.accessToken);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    setLoadingUser(true);
    setError(null);

    try {
      if (!accessToken) {
        setUser(DEFAULT_USER);
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/v1/users/me`, {
        headers: {
          "x-device-id": DEVICE_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUser(response.data);
    } catch (fetchError: any) {
      console.error("User fetch error", fetchError);
      setError(
        fetchError.response?.data?.message ||
          fetchError.message ||
          "Failed to load user profile.",
      );
      setUser(DEFAULT_USER);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchTransactions = async (retry = false) => {
    setLoading(true);
    setError(null);

    try {
      if (!accessToken) {
        setTransactions(MOCK_TRANSACTIONS);
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/v1/transactions`, {
        headers: {
          "x-device-id": DEVICE_ID,
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page: 0,
          limit: 10,
        },
      });

      setTransactions(response.data.transactions ?? []);
    } catch (fetchError: any) {
      console.error("Transactions fetch error", fetchError);
      setError(
        fetchError.response?.data?.message ||
          fetchError.message ||
          "Failed to load transactions.",
      );
      if (!retry) {
        setTimeout(() => fetchTransactions(true), 30000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchTransactions();
  }, [accessToken]);

  const [copied, setCopied] = useState(false);

  const handleCopyAccountNumber = async () => {
    const account = user?.squad_virtual_account;
    if (!account) return;
    await Clipboard.setStringAsync(account);
    if (Platform.OS === "android") {
      ToastAndroid.show("Copied!", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied!", "Account number copied to clipboard.");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUser(), fetchTransactions()]);
    setRefreshing(false);
  };

  const walletBalance = user?.wallet_balance ?? user?.balance ?? 0;
  const recentTransactions = transactions.slice(0, 3);

  const formatNaira = (value: number) => {
    return `₦${value.toLocaleString("en-NG")}`;
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#7C3AED"
          colors={["#7C3AED"]}
        />
      }
    >
      <View className="bg-purple-500 rounded-b-[40px] pt-16 pb-8 px-6">
        <View className="flex-row justify-between items-center mb-8">
          <View className="w-10 h-10 rounded-full bg-purple-400 items-center justify-center overflow-hidden">
            <Image
              source={{ uri: user?.avatar_url ?? "https://i.pravatar.cc/100" }}
              className="w-full h-full"
            />
          </View>
          <TouchableOpacity onPress={() => router.push("./notifications")}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="items-center mb-8">
          <Text className="text-purple-200 font-clash-regular text-sm mb-1">
            Wallet Balance
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-white font-clash-bold text-4xl">
              {formatNaira(walletBalance)}
            </Text>
          </View>
          <View className="bg-purple-600 px-4 py-1.5 rounded-full mt-4">
            <Text className="text-white font-clash-medium text-sm">
              {user?.squad_virtual_account
                ? "Account linked"
                : "No account linked"}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mb-6 px-1">
          <ActionItem
            icon="send-outline"
            label="Send money"
            onPress={() => router.push("/transfer")}
          />
          <ActionItem
            icon="add-outline"
            label="Add money"
            onPress={() => router.push("/home/topup")}
          />
        </View>

        <TouchableOpacity
          onPress={handleCopyAccountNumber}
          className="bg-white/10 rounded-3xl px-4 py-5"
        >
          <Text className="text-purple-100 font-clash-medium text-sm mb-2">
            Virtual account
          </Text>
          <Text className="text-white font-clash-semibold text-base">
            {user?.squad_virtual_account ?? "0123456789"}
          </Text>
          <Text className="text-purple-200 font-clash-regular text-xs mt-1">
            {user?.squad_bank_code
              ? `GTBank • ${user.squad_bank_code}`
              : "GTBank"}
          </Text>
          {copied ? (
            <Text className="text-green-200 font-clash-medium text-xs mt-3">
              Copied!
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>

      <View className="px-6 mt-8">
        <TouchableOpacity className="bg-grey-50 rounded-3xl p-5 flex-row items-center border border-grey-100 mb-6">
          <View className="w-12 h-12 bg-orange-100 rounded-2xl items-center justify-center mr-4">
            <Ionicons name="sparkles-outline" size={24} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text className="text-black font-clash-semibold text-base">
              Stay on top of payments
            </Text>
            <Text className="text-grey-500 font-clash-regular text-xs mt-0.5">
              Review recent Naira transactions here.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-clash-semibold text-black">
            Recent transactions
          </Text>
          <TouchableOpacity onPress={() => router.push("/home/transactions")}>
            <Text className="text-grey-400 font-clash-medium text-sm">
              See all
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <Text className="text-grey-500 font-clash-regular text-base">
            Loading transactions...
          </Text>
        ) : error ? (
          <Text className="text-red-500 font-clash-regular text-base">
            {error}
          </Text>
        ) : recentTransactions.length === 0 ? (
          <Text className="text-grey-500 font-clash-regular text-base">
            No recent transactions yet.
          </Text>
        ) : (
          recentTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function ActionItem({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} className="items-center flex-1">
      <View className="w-full bg-purple-400/30 rounded-3xl py-4 items-center justify-center mb-2">
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text className="text-white font-clash-medium text-xs">{label}</Text>
    </TouchableOpacity>
  );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const direction = transaction.amount >= 0 ? "up" : "down";
  const amountLabel = `${transaction.amount >= 0 ? "+" : "-"}${formatNaira(Math.abs(transaction.amount))}`;
  const date = new Date(transaction.createdAt).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = new Date(transaction.createdAt).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View className="bg-grey-50 rounded-2xl p-4 mb-3 border border-grey-100">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4">
            <Ionicons
              name={
                direction === "up" ? "arrow-up-outline" : "arrow-down-outline"
              }
              size={20}
              color="#9CA3AF"
            />
          </View>
          <View>
            <Text className="text-black font-clash-semibold text-base">
              {transaction.squad_ref}
            </Text>
            <Text className="text-grey-500 font-clash-regular text-xs mt-1">
              {transaction.status}
            </Text>
          </View>
        </View>
        <Text
          className={`font-clash-semibold text-base ${direction === "up" ? "text-green-600" : "text-red-600"}`}
        >
          {amountLabel}
        </Text>
      </View>
      <Text className="text-grey-500 font-clash-regular text-sm mb-2">
        {transaction.note}
      </Text>
      <View className="flex-row justify-between">
        <Text className="text-grey-400 font-clash-regular text-xs">{date}</Text>
        <Text className="text-grey-400 font-clash-regular text-xs">{time}</Text>
      </View>
    </View>
  );
}

function formatNaira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}
