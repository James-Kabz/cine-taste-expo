import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import {MultiSearchResult } from '@/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies, TV shows, people..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <SearchSuggestions 
        query={query} 
        onSelect={() => setIsFocused(false)}
        isVisible={isFocused && query.length > 0}
      />
    </ThemedView>
  );
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: () => void;
  isVisible: boolean;
}

function SearchSuggestions({ query, onSelect, isVisible }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<MultiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query.trim() || !isVisible) {
      setSuggestions([]);
      return;
    }

    // Debounce search requests
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchSuggestions(query.trim());
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isVisible]);

  const searchSuggestions = async (searchQuery: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://cinetaste-254.vercel.app/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) return;

      const data = await response.json();
      setSuggestions(data.results?.slice(0, 8) || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: MultiSearchResult) => {
    console.log('Navigating to:', `/movies/${suggestion.media_type}`);
    onSelect();

    if (suggestion.media_type === 'movie') {
      router.push(`/(tabs)/(home)/movies/${suggestion.id}`);
    } else if (suggestion.media_type === 'tv') {
      router.push(`/(tabs)/(home)/tv/${suggestion.id}`);
    } else if (suggestion.media_type === 'person') {
    //   router.push(`/person/${suggestion.id}`);
    }
  };

  const getDisplayTitle = (item: MultiSearchResult) => {
    return item.title || item.name || 'Unknown';
  };

  const getDisplayDate = (item: MultiSearchResult) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'movie':
        return <Ionicons name="film" size={16} color="#3b82f6" />;
      case 'tv':
        return <Ionicons name="tv" size={16} color="#10b981" />;
      case 'person':
        return <Ionicons name="person" size={16} color="#8b5cf6" />;
      default:
        return <Ionicons name="search" size={16} color="#9ca3af" />;
    }
  };

  const getImageUrl = (item: MultiSearchResult) => {
    const imagePath = item.poster_path || item.profile_path;
    return imagePath 
      ? `https://image.tmdb.org/t/p/w92${imagePath}`
      : 'https://via.placeholder.com/92x138?text=No+Image';
  };

  const renderItem = ({ item }: { item: MultiSearchResult }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Image
        source={{ uri: getImageUrl(item) }}
        style={styles.suggestionImage}
      />

      <View style={styles.suggestionContent}>
        <View style={styles.suggestionHeader}>
          {getMediaIcon(item.media_type)}
          <ThemedText style={styles.suggestionTitle} numberOfLines={1}>
            {getDisplayTitle(item)}
          </ThemedText>
          {getDisplayDate(item) && (
            <ThemedText style={styles.suggestionYear}>
              ({getDisplayDate(item)})
            </ThemedText>
          )}
        </View>

        {item.overview && (
          <ThemedText style={styles.suggestionOverview} numberOfLines={2}>
            {item.overview}
          </ThemedText>
        )}

        {item.known_for_department && (
          <ThemedText style={styles.suggestionDepartment}>
            {item.known_for_department}
          </ThemedText>
        )}
      </View>

      <ThemedText style={styles.suggestionType}>
        {item.media_type}
      </ThemedText>
    </TouchableOpacity>
  );

  if (!isVisible || (!loading && suggestions.length === 0 && query.trim())) {
    return null;
  }

  return (
    <ThemedView style={styles.suggestionsContainer}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
          <ThemedText style={styles.loadingText}>Searching...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            query.trim() ? (
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => {
                  onSelect();
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
              >
                <Ionicons name="search" size={20} color="#3b82f6" />
                <ThemedText style={styles.seeAllText}>
                  See all results for `{query}``
                </ThemedText>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  suggestionImage: {
    width: 40,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionTitle: {
    marginLeft: 8,
    fontWeight: '500',
    flexShrink: 1,
  },
  suggestionYear: {
    marginLeft: 4,
    color: '#888',
    fontSize: 12,
  },
  suggestionOverview: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  suggestionDepartment: {
    fontSize: 12,
    color: '#888',
  },
  suggestionType: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  loadingContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  seeAllButton: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllText: {
    marginLeft: 8,
    color: '#3b82f6',
  },
});