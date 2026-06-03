import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ScrollView, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';
import DIRECTORY_DATA from '../utils/cachedDirectory.json';
import { getSmartCTA } from '../utils/smartCTA';

export default function CategoryListScreen({ route, navigation }) {
  const {
    isDarkMode,
    colors,
    globalStyles,
    typography,
    profile,
    updateProfile,
    savedSpots,
    toggleSaveSpot,
    incrementVisitedShops,
    businessRatings,
    submitBusinessRating
  } = useAppContext();

  const styles = getStyles(colors);
  const { category, initialCity } = route.params || {};

  const getDynamicColor = (baseColor) => {
    if (!isDarkMode) return baseColor;
    const colorMap = {
      '#968469': '#C5B499', // Food & Drink (Warm Sand / Bronze Clay Light -> Dark)
      '#4A6070': '#8EB8E5', // Home & Trades (Slate Blue -> Sky Blue)
      '#185955': '#7FB3B0', // Health & Wellness (Hoosier Deep Forest Teal/Sage Light -> Dark)
      '#D4A373': '#E9D8A6', // Auto & Transport (Gold -> Warm Sand Gold)
      '#A06A7C': '#F28482', // Retail & Boutiques (Mauve -> Rose)
      '#8B5E3C': '#FCC419', // Pet Care (Bronze -> Ochre Gold)
      '#6D7A80': '#A5B2AA', // Manufacturing & Industrial (Limestone Slate -> Soft Sage)
      '#40916C': '#52B788', // Agriculture & Farming (Rich Sage -> Vibrant Leaf Green)
      '#2C7B8F': '#4EA8DE', // Real Estate & Housing (Teal Blue -> Teal water blue)
      '#6E8B3D': '#97BF04', // Professional Services (Warm Olive -> Olive)
      '#C28B5E': '#FFB703', // Education & Childcare (Warm sand -> Amber Sand)
      '#A89F68': '#FCC419', // Community & Faith (Forest Gold -> Warm Ochre Gold)
      '#5A7A61': '#82C0CC', // City Resources (Muted Sage -> Soft Cyan)
    };
    return colorMap[baseColor] || baseColor;
  };

  const [activeCity, setActiveCity] = useState(initialCity || 'All');
  const [activeSubCategory, setActiveSubCategory] = useState('All Types');


  const cities = ['All', 'Bedford', 'Mitchell', 'Oolitic'];

  // Get all unique subcategories dynamically from the database for this specific category
  const availableSubCategories = [
    'All Types',
    ...new Set(
      DIRECTORY_DATA
        .filter((item) => item.categoryId === category.id)
        .map((item) => item.subCategory)
        .filter(Boolean)
    )
  ];

  // Get all listings for this category and filter by active city + subCategory + vibe
  const allListings = DIRECTORY_DATA.filter((item) => {
    if (item.categoryId !== category.id) return false;
    
    // City filter
    if (activeCity !== 'All') {
      const addressLower = (item.address || '').toLowerCase();
      const cityLower = activeCity.toLowerCase();
      if (!addressLower.includes(cityLower)) return false;
    }

    // Subcategory filter
    if (activeSubCategory !== 'All Types') {
      if (item.subCategory !== activeSubCategory) return false;
    }



    return true;
  });

  const filteredListings = allListings;

  const handleCall = (phone) => {
    if (!phone || phone === 'N/A') return;
    const cleanPhone = phone.split('*(')[0].trim().replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleDirections = (name, address) => {
    const query = encodeURIComponent(`${name}, ${address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleWebsite = (url) => {
    if (!url || url === 'N/A') return;
    Linking.openURL(url);
  };

  const handleSmartCTA = (cta) => {
    if (!cta || cta.action === 'none') return;
    if (cta.action === 'phone') {
      Linking.openURL(`tel:${cta.url.replace(/[^0-9+]/g, '')}`);
    } else if (cta.action === 'url') {
      const url = cta.url.startsWith('http') ? cta.url : `https://${cta.url}`;
      Linking.openURL(url).catch(() =>
        Alert.alert('Could not open link', 'Please try visiting ' + cta.url + ' in your browser.')
      );
    }
  };

  const renderListingCard = ({ item }) => (
    <View style={styles.listingCard}>
      {/* Title & Badge & Bookmark Button */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.listingName, { flex: 1, marginRight: 8 }]}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={{ padding: 4 }} 
                onPress={() => toggleSaveSpot(item.id)}
              >
                <Ionicons 
                  name={savedSpots.includes(item.id) ? "bookmark" : "bookmark-outline"} 
                  size={18} 
                  color={savedSpots.includes(item.id) ? colors.accent : colors.textLight} 
                />
              </TouchableOpacity>
            </View>
          </View>

        </View>
        {item.subCategory && (
          <View style={[styles.subCategoryBadge, { backgroundColor: `${getDynamicColor(category.color)}18` }]}>
            <Text style={[styles.subCategoryBadgeText, { color: isDarkMode ? '#FFFFFF' : '#1B3432' }]}>
              {item.subCategory}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      {item.description ? (
        <Text style={styles.listingDesc}>{item.description}</Text>
      ) : null}

      {/* Details Row (Address & Phone) */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={colors.accent} style={styles.detailIcon} />
          <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
        </View>

        {item.phone && item.phone !== 'N/A' ? (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color={colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* Dynamic Interactive Rating Selector */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        paddingHorizontal: 2,
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginRight: 8 }}>RATE SPOT:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const currentRating = businessRatings[item.id] || { score: item.rating || 4.6, votes: item.userRatingsTotal || 8 };
            const isGold = star <= Math.round(currentRating.score);
            return (
              <TouchableOpacity 
                key={star} 
                onPress={() => submitBusinessRating(item.id, star)}
                style={{ paddingHorizontal: 1.5 }}
              >
                <Ionicons name="star" size={13} color={isGold ? '#FCC419' : colors.border} />
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={{ fontSize: 10, color: colors.textLight, fontWeight: '600', flex: 1, textAlign: 'right' }}>
          {businessRatings[item.id] ? businessRatings[item.id].score : (item.rating || 4.6)} ★ ({businessRatings[item.id] ? businessRatings[item.id].votes : (item.userRatingsTotal || 8)} votes)
        </Text>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        {item.phone && item.phone !== 'N/A' ? (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: getDynamicColor(category.color) }]}
            onPress={() => {
              incrementVisitedShops();
              handleCall(item.phone);
            }}
          >
            <Ionicons name="call" size={14} color={colors.textOnDark} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity 
          style={[styles.actionBtn, styles.mapBtn]}
          onPress={() => {
            incrementVisitedShops();
            handleDirections(item.name, item.address);
          }}
        >
          <Ionicons name="map" size={14} color={colors.textPrimary} style={{ marginRight: 6 }} />
          <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Directions</Text>
        </TouchableOpacity>

        {(() => {
          const cta = getSmartCTA(item);
          if (!cta || cta.action === 'none') return null;
          return (
            <TouchableOpacity
              style={[styles.actionBtn, styles.webBtn]}
              onPress={() => {
                incrementVisitedShops();
                handleSmartCTA(cta);
              }}
            >
              <Ionicons name={cta.icon || 'globe-outline'} size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>{cta.label}</Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      {/* Category Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: `${getDynamicColor(category.color)}15` }]}>
            <Ionicons name={category.icon.replace('-outline', '')} size={20} color={getDynamicColor(category.color)} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{category.name}</Text>
        </View>

        {/* Dummy placeholder for header alignment symmetry */}
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mainContainer}>


        {/* Filters Panel Container */}
        <View style={styles.filtersPanel}>
          {/* Row 1: City Filter Pills */}
          <Text style={styles.filterTitle}>LOCATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
            {cities.map((city) => {
              const isActive = activeCity === city;
              return (
                <TouchableOpacity
                  key={city}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setActiveCity(city)}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {city === 'All' ? '📍 All County' : city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Row 2: Sub-Category Filter Pills */}
          <Text style={[styles.filterTitle, { marginTop: SPACING.sm }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
            {availableSubCategories.map((subCat) => {
              const isActive = activeSubCategory === subCat;
              return (
                <TouchableOpacity
                  key={subCat}
                  style={[
                    styles.subPill,
                    isActive && { backgroundColor: `${getDynamicColor(category.color)}15`, borderColor: getDynamicColor(category.color) }
                  ]}
                  onPress={() => setActiveSubCategory(subCat)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {subCat === 'All Types' && (
                      <Ionicons 
                        name="sparkles-outline" 
                        size={12} 
                        color={isActive ? getDynamicColor(category.color) : colors.textSecondary} 
                        style={{ marginRight: 4 }} 
                      />
                    )}
                    <Text 
                      style={[
                        styles.subPillText,
                        isActive && { color: getDynamicColor(category.color), fontWeight: '800' }
                      ]}
                    >
                      {subCat === 'All Types' ? 'All Types' : subCat}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>


        </View>

        {/* Listings FlatList */}
        <FlatList
          data={filteredListings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyTitle}>
                No listings in this type
              </Text>
              <Text style={styles.emptyText}>
                {`There are currently no listings tagged as "${activeSubCategory}" in ${activeCity === 'All' ? 'Lawrence County' : activeCity}. Suggest a business using the directory add button!`}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...SHADOWS.light,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: SPACING.sm,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.textPrimary,
    fontSize: 14,
  },
  filtersPanel: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: SPACING.sm,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  filterTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  pillsScroll: {
    paddingVertical: 2,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 4,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textOnDark,
  },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 4,
  },
  subPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listContainer: {
    paddingBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  listingCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: 8,
  },
  listingName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  subCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  subCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  listingDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  detailsContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailIcon: {
    marginRight: SPACING.sm,
    width: 16,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mapBtn: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.border,
  },
  webBtn: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.xs,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textOnDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});

