import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Linking, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';
import { DIRECTORY_CATEGORIES } from '../utils/categories';
import DIRECTORY_DATA from '../utils/cachedDirectory.json';
import { WEB3FORMS_ACCESS_KEY, CONTACT_EMAIL } from '../utils/config';
import { getSmartCTA } from '../utils/smartCTA';

const SeeSawIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      position: 'absolute',
      width: size * 0.8,
      height: 2,
      backgroundColor: color,
      borderRadius: 1,
      transform: [{ rotate: '-15deg' }],
      top: size * 0.45,
    }}>
      <View style={{
        position: 'absolute',
        left: 0,
        top: -size * 0.08,
        width: size * 0.15,
        height: size * 0.15,
        borderRadius: size * 0.075,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        right: 0,
        top: -size * 0.08,
        width: size * 0.15,
        height: size * 0.15,
        borderRadius: size * 0.075,
        backgroundColor: color,
      }} />
    </View>
    <View style={{
      position: 'absolute',
      bottom: size * 0.25,
      width: 0,
      height: 0,
      borderLeftWidth: size * 0.12,
      borderRightWidth: size * 0.12,
      borderBottomWidth: size * 0.24,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: color,
    }} />
  </View>
);

export default function DirectoryScreen({ navigation }) {
  const {
    isDarkMode,
    colors,
    globalStyles,
    typography,
    profile,
    savedSpots,
    toggleSaveSpot,
    businessRatings,
    submitBusinessRating,
    incrementVisitedShops,
    showToast
  } = useAppContext();

  const { width } = useWindowDimensions();
  const isDesktop = width > 850;
  const styles = getStyles(colors, isDesktop);

  const getDynamicColor = (baseColor) => {
    if (!isDarkMode) return baseColor;
    const colorMap = {
      '#968469': '#C5B499', // Food & Drink (Warm Sand)
      '#4A6070': '#8EB8E5', // Home & Trades (Slate Blue)
      '#185955': '#7FB3B0', // Health & Wellness (Teal/Sage)
      '#D4A373': '#E9D8A6', // Auto & Transport (Gold)
      '#A06A7C': '#F28482', // Retail & Boutiques (Mauve)
      '#8B5E3C': '#FCC419', // Pet Care (Bronze)
      '#6D7A80': '#A5B2AA', // Manufacturing & Industrial
      '#40916C': '#52B788', // Agriculture & Farming
      '#2C7B8F': '#4EA8DE', // Real Estate
      '#6E8B3D': '#97BF04', // Professional Services
      '#C28B5E': '#FFB703', // Education & Childcare
      '#A89F68': '#FCC419', // Community & Faith
      '#5A7A61': '#82C0CC', // City Resources
    };
    return colorMap[baseColor] || baseColor;
  };

  // State
  const [activeCity, setActiveCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(DIRECTORY_CATEGORIES[0]);
  const [activeSubCategory, setActiveSubCategory] = useState('All Types');
  const [mobileActiveCategory, setMobileActiveCategory] = useState(null);

  // Listing Submission Form States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('');
  const [bizSubcategory, setBizSubcategory] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizWebsite, setBizWebsite] = useState('');
  const [bizDesc, setBizDesc] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync neighborhood selection from Hub
  useEffect(() => {
    if (profile && profile.neighborhood) {
      if (profile.neighborhood === 'All County') {
        setActiveCity('All');
      } else {
        setActiveCity(profile.neighborhood);
      }
    }
  }, [profile?.neighborhood]);

  // Reset filters when selected category changes
  useEffect(() => {
    setActiveSubCategory('All Types');
  }, [selectedCategory]);

  const cities = ['All', 'Bedford', 'Mitchell', 'Oolitic'];



  // Submission handler
  const handleSendBusinessSubmit = async () => {
    if (!bizName || !bizCategory || !bizAddress || !submitterEmail) {
      Alert.alert("Required Fields", "Please fill in all required fields.");
      return;
    }

    const categoryObj = DIRECTORY_CATEGORIES.find(c => c.id === bizCategory);
    const categoryName = categoryObj ? categoryObj.name : bizCategory;

    const emailBody = `Hello,

I would like to submit the following local business listing for publication in The Limestone app directory:

- Business Name: ${bizName}
- Category: ${categoryName}
- Subcategory: ${bizSubcategory || 'General'}
- Address: ${bizAddress}
- Phone Number: ${bizPhone || 'N/A'}
- Website/URL: ${bizWebsite || 'N/A'}
- Description: ${bizDesc || 'No description.'}
- Submitter Email: ${submitterEmail}`;

    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
      triggerBizMailtoFallback(emailBody);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Limestone App - Business Submission: ${bizName}`,
          email: submitterEmail,
          message: emailBody,
          businessName: bizName,
          businessCategory: categoryName
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
        showToast('Listing submitted for review!', 'success');
      } else {
        triggerBizMailtoFallback(emailBody);
      }
    } catch (err) {
      triggerBizMailtoFallback(emailBody);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerBizMailtoFallback = (emailBody) => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Limestone App - Business Submission: ${bizName}`)}&body=${encodeURIComponent(emailBody)}`;
    Linking.openURL(mailtoUrl)
      .then(() => setSubmitSuccess(true))
      .catch(() => {
        Alert.alert("Failed to Submit", `Please email details to: ${CONTACT_EMAIL}`);
      });
  };

  const handleResetForm = () => {
    setBizName('');
    setBizCategory('');
    setBizSubcategory('');
    setBizAddress('');
    setBizPhone('');
    setBizWebsite('');
    setBizDesc('');
    setSubmitterEmail('');
    setSubmitSuccess(false);
    setShowSubmitModal(false);
  };

  // Actions
  const handleCall = (phone) => {
    if (!phone || phone === 'N/A') return;
    const cleanPhone = phone.split('*(')[0].trim().replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleDirections = (name, address) => {
    const query = encodeURIComponent(`${name}, ${address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleSmartCTA = (cta) => {
    if (!cta || cta.action === 'none') return;
    if (cta.action === 'phone') {
      Linking.openURL(`tel:${cta.url.replace(/[^0-9+]/g, '')}`);
    } else if (cta.action === 'url') {
      const url = cta.url.startsWith('http') ? cta.url : `https://${cta.url}`;
      Linking.openURL(url).catch(() => {
        showToast('Could not open link.', 'error');
      });
    }
  };

  // Category listing counts helper
  const getCategoryCount = (categoryId) => {
    return DIRECTORY_DATA.filter(b => {
      if (b.categoryId !== categoryId) return false;
      if (activeCity === 'All') return true;
      return (b.address || '').toLowerCase().includes(activeCity.toLowerCase());
    }).length;
  };

  // Get active directory listings for selected category based on filters
  const currentCategory = isDesktop ? selectedCategory : mobileActiveCategory;

  const getFilteredListings = (catId) => {
    return DIRECTORY_DATA.filter((item) => {
      if (item.categoryId !== catId) return false;
      
      // City filter
      if (activeCity !== 'All') {
        if (!(item.address || '').toLowerCase().includes(activeCity.toLowerCase())) return false;
      }

      // Subcategory filter
      if (activeSubCategory !== 'All Types') {
        if (item.subCategory !== activeSubCategory) return false;
      }



      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  };

  const currentListings = currentCategory ? getFilteredListings(currentCategory.id) : [];

  // Unique subcategories for current active category
  const getAvailableSubCategories = (catId) => {
    return [
      'All Types',
      ...new Set(
        DIRECTORY_DATA
          .filter((item) => item.categoryId === catId)
          .map((item) => item.subCategory)
          .filter(Boolean)
      )
    ];
  };

  const availableSubCategories = currentCategory ? getAvailableSubCategories(currentCategory.id) : [];

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
      {/* Search and City Bar */}
      <View style={styles.topHeaderControl}>
        <View style={styles.titleWrapper}>
          <Ionicons name="business" size={24} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.mainTitle}>Local Directory</Text>
        </View>

        <View style={styles.headerRightControls}>
          {/* City Selector */}
          <View style={styles.cityPills}>
            {cities.map((city) => {
              const isActive = activeCity === city;
              return (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityPill, isActive && styles.cityPillActive]}
                  onPress={() => setActiveCity(city)}
                >
                  <Text style={[styles.cityPillText, isActive && styles.cityPillTextActive]}>
                    {city === 'All' ? 'All County' : city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Spot Trigger */}
          <TouchableOpacity 
            style={[styles.addListingBtn, { backgroundColor: colors.accent + '15' }]}
            onPress={() => setShowSubmitModal(true)}
          >
            <Ionicons name="add-circle" size={16} color={colors.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.addListingText, { color: colors.accent }]}>Suggest Spot</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isDesktop ? (
        /* ────────────────────────────────────────────────────────
           DESKTOP SPLIT LAYOUT (SPLIT PANE)
           ──────────────────────────────────────────────────────── */
        <View style={styles.splitLayout}>
          
          {/* LEFT COLUMN: CATEGORIES (30% width) */}
          <View style={styles.leftCategoryPane}>
            <Text style={styles.paneLabel}>CATEGORIES</Text>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {DIRECTORY_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const count = getCategoryCount(cat.id);
                const catColor = getDynamicColor(cat.color);

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryListItem,
                      isSelected && { backgroundColor: colors.background, borderColor: catColor, borderLeftWidth: 4 }
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <View style={[styles.categoryIconCircle, { backgroundColor: isSelected ? catColor + '15' : colors.background }]}>
                      <Ionicons name={cat.icon.replace('-outline', '')} size={18} color={isSelected ? catColor : colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.categoryListItemName, isSelected && { color: colors.textPrimary, fontWeight: '800' }]}>
                        {cat.name}
                      </Text>
                      <Text style={styles.categoryListItemCount}>{count} listing{count !== 1 ? 's' : ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* RIGHT COLUMN: LISTINGS (70% width) */}
          <View style={styles.rightListingsPane}>
            {selectedCategory ? (
              <View style={{ flex: 1 }}>
                {/* Category Header */}
                <View style={[styles.paneCategoryHeader, { borderLeftColor: getDynamicColor(selectedCategory.color) }]}>
                  <Text style={[styles.paneCategoryTitle, { color: colors.textPrimary }]}>{selectedCategory.name}</Text>
                  <Text style={styles.paneCategorySub}>{selectedCategory.description || 'Explore local listings in this category.'}</Text>
                </View>

                {/* Filter Panels */}
                <View style={styles.listingsFilterBox}>
                  {/* Subcategories (Types) */}
                  {availableSubCategories.length > 1 && (
                    <View style={styles.filterGroup}>
                      <Text style={styles.filterTitleLabel}>SUB-TYPE</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {availableSubCategories.map((sub) => {
                          const isActive = activeSubCategory === sub;
                          const activeColor = getDynamicColor(selectedCategory.color);
                          return (
                            <TouchableOpacity
                              key={sub}
                              style={[
                                styles.filterPill,
                                isActive && { backgroundColor: activeColor + '15', borderColor: activeColor }
                              ]}
                              onPress={() => setActiveSubCategory(sub)}
                            >
                              <Text style={[styles.filterPillText, isActive && { color: activeColor, fontWeight: '800' }]}>
                                {sub}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}


                </View>

                {/* Listings Grid */}
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listingsGridContent}
                >
                  {currentListings.length > 0 ? (
                    <View style={styles.listingsWebGrid}>
                      {currentListings.map((biz) => {
                        const isSaved = savedSpots.includes(biz.id);
                        const rating = businessRatings[biz.id] || { score: biz.rating || 4.6, votes: biz.userRatingsTotal || 8 };

                        return (
                          <View key={biz.id} style={styles.businessWebCard}>
                            {/* Card Top */}
                            <View style={styles.bizCardHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.bizCardName}>{biz.name}</Text>
                                {biz.subCategory && (
                                  <View style={[styles.subBadge, { backgroundColor: getDynamicColor(selectedCategory.color) + '15' }]}>
                                    <Text style={[styles.subBadgeText, { color: isDarkMode ? '#FFFFFF' : '#1B3432' }]}>{biz.subCategory}</Text>
                                  </View>
                                )}
                              </View>
                              
                              {/* Save Bookmark */}
                              <TouchableOpacity 
                                style={styles.bizBookmarkBtn}
                                onPress={() => toggleSaveSpot(biz.id)}
                              >
                                <Ionicons 
                                  name={isSaved ? "bookmark" : "bookmark-outline"} 
                                  size={16} 
                                  color={isSaved ? colors.accent : colors.textLight} 
                                />
                              </TouchableOpacity>
                            </View>

                            {/* Description */}
                            {biz.description ? (
                              <Text style={styles.bizCardDesc} numberOfLines={3}>{biz.description}</Text>
                            ) : (
                              <View style={{ height: 12 }} />
                            )}

                            {/* Location Details */}
                            <View style={styles.bizCardDetails}>
                              <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={13} color={colors.accent} style={{ marginRight: 6 }} />
                                <Text style={styles.detailWebText} numberOfLines={1}>{biz.address}</Text>
                              </View>
                              {biz.phone && biz.phone !== 'N/A' && (
                                <View style={[styles.detailRow, { marginTop: 4 }]}>
                                  <Ionicons name="call-outline" size={13} color={colors.primary} style={{ marginRight: 6 }} />
                                  <Text style={styles.detailWebText}>{biz.phone}</Text>
                                </View>
                              )}
                            </View>

                            {/* Custom interactive rating selector */}
                            <View style={styles.bizCardRatingBox}>
                              <Text style={styles.ratingTextLabel}>RATE:</Text>
                              <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <TouchableOpacity 
                                    key={star} 
                                    onPress={() => submitBusinessRating(biz.id, star)}
                                    style={{ paddingHorizontal: 1 }}
                                  >
                                    <Ionicons name="star" size={12} color={star <= Math.round(rating.score) ? '#FCC419' : colors.border} />
                                  </TouchableOpacity>
                                ))}
                              </View>
                              <Text style={styles.ratingStatsText}>{rating.score} ★ ({rating.votes} votes)</Text>
                            </View>

                            {/* Action buttons */}
                            <View style={styles.bizCardActions}>
                              {biz.phone && biz.phone !== 'N/A' && (
                                <TouchableOpacity 
                                  style={[styles.webActionBtn, { backgroundColor: getDynamicColor(selectedCategory.color) }]}
                                  onPress={() => {
                                    incrementVisitedShops();
                                    handleCall(biz.phone);
                                  }}
                                >
                                  <Ionicons name="call" size={11} color={colors.textOnDark} style={{ marginRight: 4 }} />
                                  <Text style={styles.webActionBtnText}>Call</Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity 
                                style={[styles.webActionBtn, styles.webMapBtn]}
                                onPress={() => {
                                  incrementVisitedShops();
                                  handleDirections(biz.name, biz.address);
                                }}
                              >
                                <Ionicons name="map" size={11} color={colors.textPrimary} style={{ marginRight: 4 }} />
                                <Text style={[styles.webActionBtnText, { color: colors.textPrimary }]}>Directions</Text>
                              </TouchableOpacity>
                              {(() => {
                                const cta = getSmartCTA(biz);
                                if (!cta || cta.action === 'none') return null;
                                return (
                                  <TouchableOpacity 
                                    style={[styles.webActionBtn, styles.webCtaBtn]}
                                    onPress={() => {
                                      incrementVisitedShops();
                                      handleSmartCTA(cta);
                                    }}
                                  >
                                    <Ionicons name={cta.icon || 'globe'} size={11} color={colors.primary} style={{ marginRight: 4 }} />
                                    <Text style={[styles.webActionBtnText, { color: colors.primary }]}>{cta.label}</Text>
                                  </TouchableOpacity>
                                );
                              })()}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.webEmptyPane}>
                      <Ionicons name="search-outline" size={48} color={colors.textLight} />
                      <Text style={styles.webEmptyTitle}>No Listings Found</Text>
                      <Text style={styles.webEmptySub}>Try adjusting your filters or location choice for this sector.</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.webEmptyPane}>
                <Ionicons name="business-outline" size={64} color={colors.textLight} />
                <Text style={styles.webEmptyTitle}>Select a Category</Text>
                <Text style={styles.webEmptySub}>Choose a sector from the left menu to view listings.</Text>
              </View>
            )}
          </View>

        </View>
      ) : (
        /* ────────────────────────────────────────────────────────
           COLLAPSED MOBILE WEB VIEWPORT (INLINE SCREEN TRANSITION)
           ──────────────────────────────────────────────────────── */
        <View style={{ flex: 1 }}>
          {mobileActiveCategory ? (
            /* Sub-screen Listings view */
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              {/* Back to list */}
              <TouchableOpacity 
                style={styles.mobileBackRow}
                onPress={() => setMobileActiveCategory(null)}
              >
                <Ionicons name="arrow-back" size={16} color={colors.primary} />
                <Text style={styles.mobileBackText}>Back to Categories</Text>
              </TouchableOpacity>

              {/* Header */}
              <View style={[styles.paneCategoryHeader, { borderLeftColor: getDynamicColor(mobileActiveCategory.color), marginTop: 8 }]}>
                <Text style={styles.paneCategoryTitle}>{mobileActiveCategory.name}</Text>
                <Text style={styles.paneCategorySub}>{mobileActiveCategory.description}</Text>
              </View>

              {/* Filters */}
              {availableSubCategories.length > 1 && (
                <View style={[styles.filterGroup, { marginVertical: 8 }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {availableSubCategories.map((sub) => {
                      const isActive = activeSubCategory === sub;
                      const activeColor = getDynamicColor(mobileActiveCategory.color);
                      return (
                        <TouchableOpacity
                          key={sub}
                          style={[
                            styles.filterPill,
                            isActive && { backgroundColor: activeColor + '15', borderColor: activeColor }
                          ]}
                          onPress={() => setActiveSubCategory(sub)}
                        >
                          <Text style={[styles.filterPillText, isActive && { color: activeColor, fontWeight: '800' }]}>
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Listings Scroll */}
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }}
              >
                {currentListings.length > 0 ? (
                  currentListings.map((biz) => {
                    const isSaved = savedSpots.includes(biz.id);
                    const rating = businessRatings[biz.id] || { score: biz.rating || 4.6, votes: biz.userRatingsTotal || 8 };

                    return (
                      <View key={biz.id} style={[styles.businessWebCard, { width: '100%', marginBottom: 12 }]}>
                        <View style={styles.bizCardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.bizCardName}>{biz.name}</Text>
                            {biz.subCategory && (
                              <View style={[styles.subBadge, { backgroundColor: getDynamicColor(mobileActiveCategory.color) + '15' }]}>
                                <Text style={[styles.subBadgeText, { color: isDarkMode ? '#FFFFFF' : '#1B3432' }]}>{biz.subCategory}</Text>
                              </View>
                            )}
                          </View>
                          <TouchableOpacity onPress={() => toggleSaveSpot(biz.id)}>
                            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={16} color={isSaved ? colors.accent : colors.textLight} />
                          </TouchableOpacity>
                        </View>

                        {biz.description && <Text style={styles.bizCardDesc}>{biz.description}</Text>}

                        <View style={styles.bizCardDetails}>
                          <Text style={styles.detailWebText}>📍 {biz.address}</Text>
                          {biz.phone && biz.phone !== 'N/A' && <Text style={[styles.detailWebText, { marginTop: 4 }]}>📞 {biz.phone}</Text>}
                        </View>

                        <View style={styles.bizCardRatingBox}>
                          <Text style={styles.ratingTextLabel}>RATE:</Text>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity key={star} onPress={() => submitBusinessRating(biz.id, star)}>
                                <Ionicons name="star" size={11} color={star <= Math.round(rating.score) ? '#FCC419' : colors.border} />
                              </TouchableOpacity>
                            ))}
                          </View>
                          <Text style={styles.ratingStatsText}>{rating.score} ★</Text>
                        </View>

                        <View style={styles.bizCardActions}>
                          {biz.phone && biz.phone !== 'N/A' && (
                            <TouchableOpacity 
                              style={[styles.webActionBtn, { backgroundColor: getDynamicColor(mobileActiveCategory.color) }]}
                              onPress={() => handleCall(biz.phone)}
                            >
                              <Text style={styles.webActionBtnText}>Call</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity 
                            style={[styles.webActionBtn, styles.webMapBtn]}
                            onPress={() => handleDirections(biz.name, biz.address)}
                          >
                            <Text style={[styles.webActionBtnText, { color: colors.textPrimary }]}>Map</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.webEmptyPane}>
                    <Text style={styles.webEmptyTitle}>No listings found in this area.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            /* Main Categories Selection List */
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
            >
              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Municipal directory</Text>
                <Text style={styles.heroSub}>Discover and support local shops, home services, and public agencies across Lawrence County.</Text>
              </View>

              {DIRECTORY_CATEGORIES.map((cat) => {
                const count = getCategoryCount(cat.id);
                const catColor = getDynamicColor(cat.color);

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryListItem, { borderLeftColor: catColor, borderLeftWidth: 4 }]}
                    onPress={() => setMobileActiveCategory(cat)}
                  >
                    <View style={[styles.categoryIconCircle, { backgroundColor: catColor + '15' }]}>
                      <Ionicons name={cat.icon.replace('-outline', '')} size={18} color={catColor} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.categoryListItemName, { fontWeight: '800' }]}>{cat.name}</Text>
                      <Text style={styles.categoryListItemCount}>{count} listings</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* ── SUBMISSION MODAL ── */}
      <Modal
        visible={showSubmitModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleResetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suggest a Local Spot</Text>
              <TouchableOpacity onPress={handleResetForm}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {submitSuccess ? (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ marginBottom: 12 }} />
                <Text style={styles.successTitle}>Suggestion Received!</Text>
                <Text style={styles.successSub}>Thank you for suggesting this spot. The municipal directory coordinator will review and publish it shortly.</Text>
                <TouchableOpacity style={styles.closeSuccessBtn} onPress={handleResetForm}>
                  <Text style={styles.closeSuccessBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                <Text style={styles.formInstructions}>
                  List a business, farm, boutique, or city department in Lawrence County.
                </Text>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Spot Name *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. Oolitic Carvers LLC"
                    placeholderTextColor={colors.textLight}
                    value={bizName}
                    onChangeText={setBizName}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Category *</Text>
                  <View style={styles.catChipsWrapper}>
                    {DIRECTORY_CATEGORIES.map(cat => (
                      <TouchableOpacity 
                        key={cat.id}
                        style={[styles.catChip, bizCategory === cat.id && { backgroundColor: getDynamicColor(cat.color), borderColor: getDynamicColor(cat.color) }]}
                        onPress={() => setBizCategory(cat.id)}
                      >
                        <Text style={[styles.catChipText, bizCategory === cat.id && { color: '#FFFFFF' }]}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Specialty / Subcategory *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. Limestone Sculptor, Hardware Store"
                    placeholderTextColor={colors.textLight}
                    value={bizSubcategory}
                    onChangeText={setBizSubcategory}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Address *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. 202 Hoosier Ave, Oolitic, IN"
                    placeholderTextColor={colors.textLight}
                    value={bizAddress}
                    onChangeText={setBizAddress}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. (812) 279-1111"
                    placeholderTextColor={colors.textLight}
                    value={bizPhone}
                    onChangeText={setBizPhone}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Website / Social Page</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. https://www.facebook.com/my-spot"
                    placeholderTextColor={colors.textLight}
                    value={bizWebsite}
                    onChangeText={setBizWebsite}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Your Contact Email *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. coordinate@mybrand.com"
                    placeholderTextColor={colors.textLight}
                    value={submitterEmail}
                    onChangeText={setSubmitterEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitFormBtn, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleSendBusinessSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitFormBtnText}>Submit Spot</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDesktop) => StyleSheet.create({
  topHeaderControl: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardSurface,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityPills: {
    flexDirection: 'row',
    marginRight: 16,
  },
  cityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 3,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cityPillTextActive: {
    color: colors.textOnDark,
    fontWeight: '700',
  },
  addListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addListingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  leftCategoryPane: {
    width: '30%',
    maxWidth: 320,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.cardSurface,
    padding: 16,
  },
  paneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryListItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryListItemCount: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  rightListingsPane: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  paneCategoryHeader: {
    paddingLeft: 16,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  paneCategoryTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  paneCategorySub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listingsFilterBox: {
    backgroundColor: colors.cardSurface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textLight,
    width: 80,
  },
  filterScroll: {
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 4,
  },
  filterPillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  listingsGridContent: {
    paddingBottom: 60,
  },
  listingsWebGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  businessWebCard: {
    width: '48%',
    minWidth: 280,
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  bizCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bizCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  subBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bizBookmarkBtn: {
    padding: 4,
  },

  bizCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginVertical: 10,
    height: 48,
  },
  bizCardDetails: {
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailWebText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bizCardRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  ratingTextLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textLight,
  },
  starsRow: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  ratingStatsText: {
    fontSize: 9,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  bizCardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  webActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  webMapBtn: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  webCtaBtn: {
    backgroundColor: colors.primary + '12',
  },
  webActionBtnText: {
    fontSize: 11,
    fontWeight: '750',
    color: colors.textOnDark,
  },
  webEmptyPane: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  webEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 12,
  },
  webEmptySub: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  mobileBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mobileBackText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  heroCard: {
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  heroSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 550,
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.dark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  formInstructions: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  formInputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 13,
    backgroundColor: colors.background,
  },
  catChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  catChipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  submitFormBtn: {
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitFormBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
  },
  successSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  closeSuccessBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 16,
  },
  closeSuccessBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  }
});
