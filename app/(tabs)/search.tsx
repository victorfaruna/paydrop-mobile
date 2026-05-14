import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "https://pay-drop-backend.vercel.app";
const DEVICE_ID = "paydrop-mobile-app";

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  trust_score?: number;
  mutual_trust_count?: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/users/search`, {
          params: { q: searchQuery },
          headers: { "x-device-id": DEVICE_ID },
        });
        setSearchResults(response.data.users || []);
      } catch (error) {
        console.error("Search error", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    [],
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Load contacts and cross-reference
  useEffect(() => {
    const loadContacts = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        // Mock cross-reference with PayDrop users
        const paydropContacts = data.slice(0, 5).map((contact, index) => ({
          id: `contact-${index}`,
          first_name: contact.firstName,
          last_name: contact.lastName,
          username: `@${contact.firstName?.toLowerCase()}${index}`,
          avatar_url: `https://i.pravatar.cc/100?img=${index + 10}`,
        }));
        setContacts(paydropContacts);
      }
    };
    loadContacts();

    // Mock suggested users
    setSuggestedUsers([
      {
        id: "1",
        first_name: "Alice",
        last_name: "Johnson",
        username: "@alicej",
        trust_score: 85,
        mutual_trust_count: 5,
      },
      {
        id: "2",
        first_name: "Bob",
        last_name: "Smith",
        username: "@bobsmith",
        trust_score: 92,
        mutual_trust_count: 3,
      },
    ]);
  }, []);

  const handlePay = (user: User) => {
    // Navigate to RecipientPreview with user data
    router.push({
      pathname: "/home/transfer" as any,
      params: { userId: user.id },
    });
  };

  const handleAddFriend = (user: User) => {
    Alert.alert("Add Friend", `Send friend request to ${user.first_name}?`);
  };

  const renderSearchResult = ({ item }: { item: User }) => (
    <View className="flex-row items-center justify-between p-4 bg-white border-b border-grey-100">
      <View className="flex-row items-center">
        <Image
          source={{ uri: item.avatar_url || "https://i.pravatar.cc/100" }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View>
          <Text className="text-black font-clash-semibold text-base">
            {item.first_name} {item.last_name}
          </Text>
          <Text className="text-grey-500 font-clash-regular text-sm">
            {item.username}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <View className="bg-green-500 rounded-full px-2 py-1 mr-3">
          <Text className="text-white font-clash-medium text-xs">
            {item.trust_score}%
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handlePay(item)}
          className="bg-purple-500 rounded-full px-4 py-2"
        >
          <Text className="text-white font-clash-medium text-sm">Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContact = ({ item }: { item: User }) => (
    <TouchableOpacity className="items-center mr-4">
      <Image
        source={{ uri: item.avatar_url }}
        className="w-16 h-16 rounded-full mb-2"
      />
      <Text className="text-black font-clash-regular text-sm text-center">
        {item.first_name}
      </Text>
    </TouchableOpacity>
  );

  const renderSuggestedUser = ({ item }: { item: User }) => (
    <View className="flex-row items-center justify-between p-4 bg-grey-50 rounded-2xl mb-3 mx-6">
      <View className="flex-row items-center">
        <Image
          source={{ uri: item.avatar_url || "https://i.pravatar.cc/100" }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="text-black font-clash-semibold text-base">
            {item.first_name} {item.last_name}
          </Text>
          <Text className="text-grey-500 font-clash-regular text-sm">
            {item.mutual_trust_count} mutual friends
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleAddFriend(item)}
        className="bg-grey-100 rounded-full w-8 h-8 items-center justify-center"
      >
        <Ionicons name="add" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-white pt-10">
      {/* Search Bar */}
      <View className="sticky top-0 bg-white z-10 p-4 border-b border-grey-100">
        <View className="bg-grey-50 rounded-full px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-black font-clash-regular"
            placeholder="Search by name or @username"
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9CA3AF"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.trim() ? (
        // Search Results
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-grey-500 font-clash-regular text-base">
                No users found for "{query}"
              </Text>
            </View>
          }
        />
      ) : (
        // Default Sections
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* People You May Know */}
          <View className="px-6 mt-6">
            <Text className="text-black font-clash-semibold text-lg mb-4">
              People You May Know
            </Text>
            {suggestedUsers.map((user) => (
              <View key={user.id}>{renderSuggestedUser({ item: user })}</View>
            ))}
          </View>

          {/* Contacts on PayDrop */}
          <View className="px-6 mt-8 mb-6">
            <Text className="text-black font-clash-semibold text-lg mb-4">
              Contacts on PayDrop
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {contacts.map((contact) => (
                <View key={contact.id}>{renderContact({ item: contact })}</View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
