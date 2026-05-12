import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "https://pay-drop-backend.vercel.app";
const DEVICE_ID = "paydrop-mobile-app";

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

const DEFAULT_TRANSACTIONS: Transaction[] = [
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

const FILTERS = ["All", "Sent", "Received"] as const;

type FilterType = (typeof FILTERS)[number];

export default function TransactionsScreen() {
  const accessToken = useUserStore((state) => state.accessToken);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>("All");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (pageNumber = 0, append = false) => {
    if (pageNumber === 0) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      if (!accessToken) {
        if (append) {
          setTransactions((current) => [...current, ...DEFAULT_TRANSACTIONS]);
        } else {
          setTransactions(DEFAULT_TRANSACTIONS);
        }
        setHasMore(false);
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/v1/transactions`, {
        headers: {
          "x-device-id": DEVICE_ID,
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page: pageNumber,
          limit: 20,
        },
      });

      const fetched: Transaction[] = response.data.transactions ?? [];
      setTransactions((current) =>
        append ? [...current, ...fetched] : fetched,
      );
      setHasMore(fetched.length >= 20);
    } catch (fetchError: any) {
      console.error("Transactions screen fetch error", fetchError);
      setError(
        fetchError.response?.data?.message ||
          fetchError.message ||
          "Could not load transactions.",
      );
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTransactions(0, false);
  }, [accessToken]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchTransactions(0, false);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchTransactions(nextPage, true);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filter === "Sent") return tx.amount < 0;
      if (filter === "Received") return tx.amount >= 0;
      return true;
    });
  }, [transactions, filter]);

  const formatNaira = (value: number) => {
    return `₦${value.toLocaleString("en-NG")}`;
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const direction = item.amount >= 0 ? "up" : "down";
    const amountLabel = `${item.amount >= 0 ? "+" : "-"}${formatNaira(
      Math.abs(item.amount),
    )}`;
    const date = new Date(item.createdAt).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View className="bg-white rounded-3xl p-4 mb-3 border border-grey-100 shadow-sm">
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-black font-clash-semibold text-base">
              {item.squad_ref}
            </Text>
            <Text className="text-grey-500 font-clash-regular text-xs mt-1">
              {item.fraud_verdict.toUpperCase()} • {date}
            </Text>
          </View>
          <Text
            className={`font-clash-semibold text-base ${direction === "up" ? "text-green-600" : "text-red-600"}`}
          >
            {amountLabel}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="bg-grey-100 rounded-full px-3 py-1">
            <Text className="text-grey-500 font-clash-medium text-xs">
              {item.status}
            </Text>
          </View>
          <View className="bg-purple-50 rounded-full px-3 py-1">
            <Text className="text-purple-700 font-clash-medium text-xs">
              {item.fraud_score} score
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Text className="text-3xl font-clash-bold text-black mb-3">
        Transactions
      </Text>
      <Text className="text-grey-500 font-clash-regular text-sm mb-6">
        View your history and filter by sent or received activity.
      </Text>

      <View className="flex-row justify-between mb-6">
        {FILTERS.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setFilter(option)}
            className={`px-4 py-2 rounded-full border ${
              filter === option
                ? "bg-purple-500 border-purple-500"
                : "bg-white border-grey-200"
            }`}
          >
            <Text
              className={`text-sm font-clash-medium ${filter === option ? "text-white" : "text-grey-600"}`}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7C3AED"
            />
          }
          ListEmptyComponent={() => (
            <View className="items-center mt-16">
              <Text className="text-grey-500 font-clash-regular text-base">
                No transactions found for this filter.
              </Text>
            </View>
          )}
          ListFooterComponent={() =>
            hasMore ? (
              <TouchableOpacity
                onPress={loadMore}
                className="bg-purple-500 rounded-3xl py-4 items-center mt-4"
                disabled={loadingMore}
              >
                <Text className="text-white font-clash-medium text-base">
                  {loadingMore ? "Loading more..." : "Load more"}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {error ? (
        <Text className="text-red-500 font-clash-regular text-sm mt-4">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
