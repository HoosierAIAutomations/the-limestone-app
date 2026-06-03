import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, Linking, Modal, ActivityIndicator, Image, Share } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
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
    updateProfile,
    getProfilePictureDetails,
    savedSpots,
    toggleSaveSpot,
    businessRatings,
    submitBusinessRating,
    incrementVisitedShops
  } = useAppContext();

  const styles = getStyles(colors);
  const avatar = getProfilePictureDetails();

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

  const [activeCity, setActiveCity] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'category'

  // Reactively sync with the user's default neighborhood selected in the Hub
  useEffect(() => {
    if (profile && profile.neighborhood) {
      if (profile.neighborhood === 'All County') {
        setActiveCity('All');
      } else {
        setActiveCity(profile.neighborhood);
      }
    }
  }, [profile?.neighborhood]);

  // Business Submission Form States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState(''); // Category ID
  const [bizSubcategory, setBizSubcategory] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizWebsite, setBizWebsite] = useState('');
  const [bizDesc, setBizDesc] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSendBusinessSubmit = async () => {
    if (!bizName || !bizCategory || !bizAddress || !submitterEmail) {
      Alert.alert("Required Fields", "Please fill in all required fields: Business Name, Category, Address, and your Contact Email.");
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
- Description of Services: ${bizDesc || 'No description provided.'}
- Contact Email: ${submitterEmail}

Thank you!`;

    // 1. Check if the key is default or empty
    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
      triggerBizMailtoFallback(emailBody);
      return;
    }

    // 2. Perform Web3Forms submit
    setIsSubmitting(true);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Limestone App - Business Submission: ${bizName}`,
          from_name: 'The Limestone App Users',
          name: bizName,
          email: submitterEmail,
          message: emailBody,
          businessName: bizName,
          businessCategory: categoryName,
          businessSubcategory: bizSubcategory,
          businessAddress: bizAddress,
          businessPhone: bizPhone,
          businessWebsite: bizWebsite,
          businessDesc: bizDesc
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
      } else {
        console.warn('Web3Forms response error, falling back to mail client:', data);
        triggerBizMailtoFallback(emailBody);
      }
    } catch (err) {
      console.warn('Web3Forms submit error, falling back to mail client:', err);
      triggerBizMailtoFallback(emailBody);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerBizMailtoFallback = (emailBody) => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Limestone App - Business Submission: ${bizName}`)}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(mailtoUrl)
      .then(() => {
        setSubmitSuccess(true);
      })
      .catch(err => {
        Alert.alert(
          "Mail App Failed",
          `We couldn't submit via Web3Forms or launch your email client. Please send listing details directly to ${CONTACT_EMAIL}.\n\nThank you!`,
          [{ text: "OK" }]
        );
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

  const cities = ['All', 'Bedford', 'Mitchell', 'Oolitic'];

  // Handle phone calls, directions, website
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

  // Toggle sort order
  const handleSortToggle = () => {
    Alert.alert(
      "Sort Listings",
      "Choose how to organize search results:",
      [
        { text: "Alphabetical (A-Z)", onPress: () => setSortBy('name') },
        { text: "By Category", onPress: () => setSortBy('category') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Filter listings for categories (dynamic counts)
  const getCategoryCount = (categoryId) => {
    return DIRECTORY_DATA.filter(b => {
      if (b.categoryId !== categoryId) return false;
      if (activeCity === 'All') return true;
      return (b.address || '').toLowerCase().includes(activeCity.toLowerCase());
    }).length;
  };

  // Filtered businesses — city filter only (no search bar)
  const filteredBusinesses = DIRECTORY_DATA.filter((item) => {
    if (activeCity !== 'All') {
      return (item.address || '').toLowerCase().includes(activeCity.toLowerCase());
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return a.categoryId.localeCompare(b.categoryId) || a.name.localeCompare(b.name);
    }
  });

  const renderCategoryCard = ({ item }) => {
    const count = getCategoryCount(item.id);
    return (
      <TouchableOpacity 
        style={[styles.categoryCard, { borderTopColor: getDynamicColor(item.color) }]}
        onPress={() => navigation.navigate('CategoryList', { category: item, initialCity: activeCity })}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${getDynamicColor(item.color)}15` }]}>
          <Ionicons name={item.icon.replace('-outline', '')} size={28} color={getDynamicColor(item.color)} />
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.categoryCount}>{count > 0 ? `${count} ${count === 1 ? 'listing' : 'listings'}` : 'Explore listings'}</Text>
          <Ionicons name="chevron-forward-outline" size={14} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderBusinessCard = ({ item }) => {
    const category = DIRECTORY_CATEGORIES.find(c => c.id === item.categoryId);
    const categoryColor = category ? getDynamicColor(category.color) : colors.primary;
    const categoryIcon = category ? category.icon.replace('-outline', '') : 'business';

    return (
      <View style={styles.businessCard}>
        <View style={styles.businessHeader}>
          <View style={styles.businessTitleContainer}>
            <Text style={styles.businessName}>{item.name}</Text>
            {category && (
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
                <Ionicons name={categoryIcon} size={10} color={isDarkMode ? '#FFFFFF' : '#1B3432'} style={{ marginRight: 4 }} />
                <Text style={[styles.categoryBadgeText, { color: isDarkMode ? '#FFFFFF' : '#1B3432' }]}>{category.name}</Text>
              </View>
            )}
          </View>
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

        {item.description ? (
          <Text style={styles.businessDesc}>{item.description}</Text>
        ) : null}

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={colors.accent} style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
          </View>

          {item.phone && item.phone !== 'N/A' ? (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={14} color={colors.primary} style={styles.detailIcon} />
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

        <View style={styles.actionRow}>
          {item.phone && item.phone !== 'N/A' ? (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.callBtn]}
              onPress={() => {
                incrementVisitedShops();
                handleCall(item.phone);
              }}
            >
              <Ionicons name="call" size={12} color={colors.textOnDark} style={{ marginRight: 6 }} />
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
            <Ionicons name="map" size={12} color={colors.textPrimary} style={{ marginRight: 6 }} />
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
                <Ionicons name={cta.icon || 'globe-outline'} size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>{cta.label}</Text>
              </TouchableOpacity>
            );
          })()}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      {/* Directory Header */}
      <View style={globalStyles.headerContainer}>
        <Text style={globalStyles.logoText}>Local <Text style={globalStyles.logoAccent}>Directory</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.addListingBtn, { marginRight: SPACING.sm }]}
            onPress={() => setShowSubmitModal(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.addListingText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.avatarBtn, { backgroundColor: avatar.bgColor, borderColor: '#000000', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}
            onPress={() => navigation?.navigate('Hub')}
          >
            {avatar.icon === 'seesaw' ? (
              <SeeSawIcon color="#000000" size={16} />
            ) : (
              <Ionicons name={avatar.icon} size={16} color="#000000" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.mainContainer}>
        {/* City Filter Pills */}
        <View style={styles.pillsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
              {cities.map((city) => {
              const isActive = activeCity === city;
              return (
                <TouchableOpacity
                  key={city}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setActiveCity(city)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {city === 'All' && (
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={isActive ? colors.textOnDark : colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                      {city === 'All' ? 'All County' : city}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Grid — always visible */}
        <FlatList
          data={DIRECTORY_CATEGORIES.filter(c => c.id !== 'city_resources')}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.heroCard}>
              {/* Badge Tag */}
              <View style={styles.heroBadge}>
                <Ionicons name="storefront-outline" size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.heroBadgeText}>
                  {activeCity === 'All' ? '13 CATEGORIES' : `${activeCity.toUpperCase()} SECTOR`}
                </Text>
              </View>
              <Text style={styles.heroTitle}>Limestone{"\n"}Businesses</Text>
              <Text style={styles.heroSub}>
                Discover and support trusted local shops, home service trades, medical practitioners, and municipal agencies that build our county.
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', paddingBottom: SPACING.md, marginTop: SPACING.xs }}>
              {renderCategoryCard({ item: DIRECTORY_CATEGORIES.find(c => c.id === 'city_resources') })}
            </View>
          }
        />
      </View>
      {/* ── INTERACTIVE BUSINESS LISTING SUBMISSION FORM MODAL ── */}
      <Modal
        visible={showSubmitModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleResetForm}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              Submit <Text style={{ color: colors.accent }}>Business Listing</Text>
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={handleResetForm}
            >
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {submitSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.successCard}>
                <View style={styles.successIconWrapper}>
                  <Ionicons name="checkmark-circle" size={80} color={colors.success} />
                </View>
                <Text style={styles.successTitle}>Listing Submitted!</Text>
                <Text style={styles.successText}>
                  Thank you for submitting your local business listing! It has been successfully compiled and sent to the Lawrence County directory coordinator for verification and publication in The Limestone directory.
                </Text>
                <TouchableOpacity 
                  style={[styles.formSubmitBtn, { width: '100%', marginTop: SPACING.md }]} 
                  onPress={handleResetForm}
                >
                  <Text style={styles.formSubmitBtnText}>Back to Directory</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Scrolling Form */
            <ScrollView 
              style={styles.modalFormScroll} 
              contentContainerStyle={styles.modalFormContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.formIntro}>
                List your commercial storefront, home-based service trade, professional practice, or farm stand in Lawrence County. Fill out the details below to submit them directly to our directory coordinator!
              </Text>

              {/* Business Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Name <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Limestone Stone Cutters LLC"
                  placeholderTextColor={colors.textLight}
                  value={bizName}
                  onChangeText={setBizName}
                />
              </View>

              {/* Select Category Grid Chips */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Category <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 }}>
                  {DIRECTORY_CATEGORIES.map((cat) => {
                    const isSelected = bizCategory === cat.id;
                    const catColor = getDynamicColor(cat.color);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          { marginRight: 0, marginVertical: 2 },
                          isSelected 
                            ? { backgroundColor: catColor, borderColor: catColor, borderWidth: 2 }
                            : { backgroundColor: colors.cardSurface, borderColor: colors.border, borderWidth: 1 }
                        ]}
                        onPress={() => setBizCategory(cat.id)}
                      >
                        <Ionicons 
                          name={cat.icon.replace('-outline', '')} 
                          size={14} 
                          color={isSelected ? '#FFFFFF' : catColor} 
                          style={{ marginRight: 6 }} 
                        />
                        <Text style={[
                          styles.categoryChipText,
                          { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                          { fontWeight: '800' }
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Subcategory / Specialty */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Subcategory / Specialty <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Electrician, Pizza Diner, Boutique"
                  placeholderTextColor={colors.textLight}
                  value={bizSubcategory}
                  onChangeText={setBizSubcategory}
                />
              </View>

              {/* Physical Address */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Physical Address <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 1515 J St, Bedford, IN 47421"
                  placeholderTextColor={colors.textLight}
                  value={bizAddress}
                  onChangeText={setBizAddress}
                />
              </View>

              {/* Phone Number */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. (812) 279-0000"
                  placeholderTextColor={colors.textLight}
                  value={bizPhone}
                  onChangeText={setBizPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Website */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Website / Facebook URL</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. https://www.yourbusiness.com"
                  placeholderTextColor={colors.textLight}
                  value={bizWebsite}
                  onChangeText={setBizWebsite}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Brief Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Brief Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="Describe your hours, services, and specialties..."
                  placeholderTextColor={colors.textLight}
                  value={bizDesc}
                  onChangeText={setBizDesc}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Your Contact Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Your Contact Email <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. nate@hoosieraiautomations.com"
                  placeholderTextColor={colors.textLight}
                  value={submitterEmail}
                  onChangeText={setSubmitterEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Submit & Cancel Actions */}
              <TouchableOpacity 
                style={[styles.formSubmitBtn, isSubmitting && { backgroundColor: colors.textLight }]} 
                onPress={handleSendBusinessSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.textOnDark} />
                ) : (
                  <>
                    <Ionicons name="mail-sharp" size={16} color={colors.textOnDark} style={{ marginRight: 6 }} />
                    <Text style={styles.formSubmitBtnText}>Submit Listing</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.formCancelBtn} 
                onPress={handleResetForm}
                disabled={isSubmitting}
              >
                <Text style={styles.formCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  addListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150,132,105,0.10)', // Brand Accent Warm Sand alpha
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 16,
  },
  addListingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
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
  filterBtn: {
    padding: SPACING.xs,
  },
  pillsContainer: {
    marginBottom: SPACING.md,
  },
  pillsScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
    ...SHADOWS.light,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textOnDark,
  },
  introContainer: {
    marginBottom: SPACING.md,
  },
  // Hero card — matches HomeScreen's Welcome Home card style
  heroCard: {
    backgroundColor: '#253357', // Deep navy blue welcome box color
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...SHADOWS.medium,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#968469',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
  titleSub: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 2,
  },
  row: {
    justifyContent: 'space-between',
  },
  listContainer: {
    paddingBottom: SPACING.xl,
  },
  categoryCard: {
    backgroundColor: colors.cardSurface,
    width: '48%',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 4,
    justifyContent: 'space-between',
    ...SHADOWS.light,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    minHeight: 40,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: SPACING.xs,
  },
  categoryCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  avatarText: {
    color: colors.textOnDark,
    fontWeight: '800',
    fontSize: 13,
  },

  // Business Card for Search Results
  businessCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  businessTitleContainer: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  businessDesc: {
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
  callBtn: {
    backgroundColor: colors.primary,
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

  // ── FORM MODAL STYLES ──
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '850',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFormScroll: {
    flex: 1,
  },
  modalFormContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  formIntro: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    fontWeight: '600',
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(30, 77, 43, 0.04)',
    borderColor: 'rgba(30, 77, 43, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: SPACING.sm,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  formInputMultiline: {
    height: 100,
    paddingVertical: 10,
  },
  formSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    marginTop: SPACING.md,
    ...SHADOWS.light,
  },
  formSubmitBtnText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '800',
  },
  formCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    marginTop: SPACING.xs,
  },
  formCancelBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '750',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  successCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.medium,
    width: '100%',
  },
  successIconWrapper: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  chipsScroll: {
    marginVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    ...SHADOWS.light,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

