
import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMovies } from '../hooks/useMovies';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, MOVIE_CATEGORIES } from '../utils/constants';
import { Movie } from '../types';

type MovieCategory = typeof MOVIE_CATEGORIES[keyof typeof MOVIE_CATEGORIES];
const HomeScreen = () => {
    const navigation = useNavigation();
    const [selectedCategory, setSelectedCategory] = useState<MovieCategory>(MOVIE_CATEGORIES.POPULAR);
    const [selectedType, setSelectedType] = useState<'movie' | 'tv'>('movie');
    const { movies, isLoading, error, refetch } = useMovies(selectedCategory, selectedType);

    const categories = [
        { key: MOVIE_CATEGORIES.POPULAR, label: 'Popular' },
        { key: MOVIE_CATEGORIES.TOP_RATED, label: 'Top Rated' },
        { key: MOVIE_CATEGORIES.NOW_PLAYING, label: 'Now Playing' },
        { key: MOVIE_CATEGORIES.UPCOMING, label: 'Upcoming' },
    ];

    const types = [
        { key: 'movie' as const, label: 'Movies' },
        { key: 'tv' as const, label: 'TV Shows' },
    ];

    const handleMoviePress = (movie: Movie) => {
        (navigation as any).navigate('MovieDetail', {
            movieId: movie.id,
            mediaType: movie.media_type || selectedType
        });
    };

    if (isLoading && movies.length === 0) {
        return <LoadingSpinner text="Loading movies..." />;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
            >
                {/* Type Selector */}
                <View style={styles.selectorContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {types.map((type) => (
                            <TouchableOpacity
                                key={type.key}
                                style={[
                                    styles.selectorButton,
                                    selectedType === type.key && styles.selectedSelectorButton
                                ]}
                                onPress={() => setSelectedType(type.key)}
                            >
                                <Text style={[
                                    styles.selectorText,
                                    selectedType === type.key && styles.selectedSelectorText
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Category Selector */}
                <View style={styles.selectorContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.key}
                                style={[
                                    styles.selectorButton,
                                    selectedCategory === category.key && styles.selectedSelectorButton
                                ]}
                                onPress={() => setSelectedCategory(category.key)}
                            >
                                <Text style={[
                                    styles.selectorText,
                                    selectedCategory === category.key && styles.selectedSelectorText
                                ]}>
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Movies Grid */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.moviesContainer}>
                        <FlatList
                            data={movies}
                            renderItem={({ item }) => (
                                <MovieCard
                                    movie={item}
                                    onPress={() => handleMoviePress(item)}
                                />
                            )}
                            keyExtractor={(item) => `${item.id}-${item.media_type}`}
                            numColumns={2}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    selectorContainer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    selectorButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        borderRadius: 20,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedSelectorButton: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    selectorText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    selectedSelectorText: {
        color: COLORS.background,
    },
    moviesContainer: {
        paddingHorizontal: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HomeScreen;
