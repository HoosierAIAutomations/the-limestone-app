import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';

const SeesawIcon = ({ color, size }) => (
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

export default function OnboardingScreen() {
  const { colors, completeOnboarding, getProfilePictureDetails } = useAppContext();
  const { width } = useWindowDimensions();
  
  // Responsive thresholds
  const isDesktop = width > 900;
  
  // Dimensions math
  const cardWidth = isDesktop ? 1050 : Math.min(width - 32, 500);
  const leftWidth = isDesktop ? 420 : 0;
  const rightWidth = isDesktop ? 630 : cardWidth;
  const cardHeight = isDesktop ? 640 : 'auto';

  const [currentSlide, setCurrentSlide] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Bedford');
  const [selectedSpecialty, setSelectedSpecialty] = useState('forest');
  const [showSpecialties, setShowSpecialties] = useState(false);

  const totalSlides = 4;
  const scrollViewRef = useRef(null);

  const allPresets = [
    'forest', 'quarry', 'bridge', 'carver', 'monon', 'transit', 'parks', 'space',
    'education', 'agriculture', 'opera', 'citizen', 'aviation', 'camping', 'caverns',
    'fishing', 'festival', 'cabin', 'trail', 'sunrise', 'athletics', 'arts', 'fairgrounds', 'wellness'
  ];

  const specialties = allPresets.map(presetId => {
    const details = getProfilePictureDetails(presetId);
    const iconName = details.icon === 'seesaw' ? 'seesaw' : `${details.icon}-outline`;
    return {
      id: presetId,
      name: details.label,
      sub: details.sub,
      icon: iconName,
      catColor: details.borderColor || '#185955'
    };
  });

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: nextSlide * rightWidth, animated: true });
    } else {
      // Validate
      if (!firstName.trim()) {
        alert('Please enter your first name.');
        return;
      }
      completeOnboarding(firstName.trim(), selectedNeighborhood, selectedSpecialty);
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slide = Math.round(offsetX / rightWidth);
    if (slide !== currentSlide && slide >= 0 && slide < totalSlides) {
      setCurrentSlide(slide);
    }
  };

  const activeSpecialty = specialties.find(s => s.id === selectedSpecialty) || specialties[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#d1c7a9' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: isDesktop ? 20 : 0 }}
      >
        <View style={[
          styles.onboardingCard, 
          { 
            width: cardWidth, 
            height: cardHeight,
            flexDirection: isDesktop ? 'row' : 'column'
          }
        ]}>
          
          {/* ────────────────────────────────────────────────────────
             STATIC BRANDING PANEL (Left on Desktop, Top on Mobile)
             ──────────────────────────────────────────────────────── */}
          <View style={[
            styles.leftBrandPane, 
            { 
              width: isDesktop ? leftWidth : '100%',
              padding: isDesktop ? 40 : 20,
              flexDirection: isDesktop ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isDesktop ? 'space-between' : 'flex-start',
              borderBottomLeftRadius: isDesktop ? 24 : 0,
              borderTopRightRadius: isDesktop ? 0 : 24,
            }
          ]}>
            <View style={[
              styles.brandingContent, 
              { 
                flexDirection: isDesktop ? 'column' : 'row', 
                alignItems: 'center',
                flex: isDesktop ? 1 : 0,
                width: isDesktop ? '100%' : 'auto',
              }
            ]}>
              <View style={[
                styles.logoSquareWrapper,
                !isDesktop && { width: 90, height: 90, borderRadius: 12, borderWidth: 1, borderColor: '#000000', marginRight: 16, marginBottom: 0 }
              ]}>
                <Image 
                  source={require('../../assets/logo-app-ready.jpg')} 
                  style={[
                    styles.appLogo,
                    !isDesktop && { width: 88, height: 88, borderRadius: 10 }
                  ]} 
                  resizeMode="contain"
                />
              </View>
              <View style={{ alignItems: isDesktop ? 'center' : 'flex-start', flex: isDesktop ? 0 : 1 }}>
                <Text style={[styles.brandTitle, !isDesktop && { fontSize: 20, textAlign: 'left' }]}>The Limestone</Text>
                <Text style={[
                  styles.brandDesc, 
                  { marginTop: isDesktop ? 12 : 4 },
                  !isDesktop && { textAlign: 'left', fontSize: 11, lineHeight: 14, paddingHorizontal: 0 }
                ]}>
                  Preserving Community Connection, Supporting Local Businesses, and Sharing Live Advisories Across Bedford and the Surrounding County of Lawrence.
                </Text>
              </View>
            </View>
            
            {isDesktop && (
              <View style={{ alignItems: 'center', width: '100%', marginTop: 20 }}>
                <Text style={styles.brandFooter}>© 2026 Hoosier AI Automations LLC</Text>
                <Text style={styles.brandFooterArtwork}>Artwork By: Rikku I. | All Rights Reserved</Text>
              </View>
            )}
          </View>

          {/* ────────────────────────────────────────────────────────
             RIGHT PANE: WALKTHROUGH SLIDES
             ──────────────────────────────────────────────────────── */}
          <View style={[styles.rightSlidesPane, { width: rightWidth }]}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              scrollEnabled={false} // Enforce next/back button flow
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ width: rightWidth * totalSlides }}
              style={{ flex: 1 }}
            >
              {/* Slide 1: Welcome */}
              <View style={[styles.slide, { width: rightWidth }]}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(179, 44, 34, 0.15)' }]}>
                  <Ionicons name="heart-outline" size={54} color="#b32c22" />
                </View>
                <Text style={styles.slideTitle}>Welcome to{"\n"}The Limestone</Text>
                <Text style={styles.slidePreTitle}>YOUR DIGITAL TOWN SQUARE</Text>
                <Text style={styles.slideDesc}>
                  A dedicated, homegrown community space for the citizens of Bedford and the surrounding County of Lawrence.
                </Text>
              </View>

              {/* Slide 2: Directory */}
              <View style={[styles.slide, { width: rightWidth }]}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(37, 51, 87, 0.15)' }]}>
                  <Ionicons name="business-outline" size={54} color="#253357" />
                </View>
                <Text style={styles.slideTitle}>Discover Local Listings</Text>
                <Text style={styles.slidePreTitle}>SUPPORT LAWRENCE COUNTY</Text>
                <Text style={styles.slideDesc}>
                  Access over 300 verified county businesses, sit-down menus, and essential public health resources, with customized direct-order options.
                </Text>
              </View>

              {/* Slide 3: Alerts */}
              <View style={[styles.slide, { width: rightWidth }]}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(196, 153, 33, 0.15)' }]}>
                  <Ionicons name="warning-outline" size={54} color="#c49921" />
                </View>
                <Text style={styles.slideTitle}>Live Advisories & Delays</Text>
                <Text style={styles.slidePreTitle}>STAY INFORMED INSTANTLY</Text>
                <Text style={styles.slideDesc}>
                  Stay informed with real-time National Weather Service safety bulletins, active road paving maps, and seasonal school delays.
                </Text>
              </View>

              {/* Slide 4: Profile Registration */}
              <View style={[styles.slide, { width: rightWidth, paddingHorizontal: isDesktop ? 48 : 24 }]}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(37, 51, 87, 0.15)' }, { marginBottom: 16 }]}>
                  <Ionicons name="people-outline" size={54} color="#253357" />
                </View>
                <Text style={[styles.slideTitle, { fontSize: isDesktop ? 28 : 24 }]}>Join Our Community</Text>
                <Text style={[styles.slideDesc, { marginBottom: 20 }]}>Create your local profile to unlock bookmarks, RSVPs, and ratings.</Text>
                
                {/* Form Elements */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>YOUR FIRST NAME:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Sarah"
                    placeholderTextColor="rgba(105, 93, 61, 0.5)"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>YOUR NEIGHBORHOOD:</Text>
                  <View style={styles.pillGrid}>
                    {['Bedford', 'Mitchell', 'Oolitic', 'Springville', 'All County'].map(n => (
                      <TouchableOpacity
                        key={n}
                        style={[styles.pill, selectedNeighborhood === n && styles.pillActive]}
                        onPress={() => setSelectedNeighborhood(n)}
                      >
                        <Text style={[styles.pillText, selectedNeighborhood === n && styles.pillTextActive]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>CHOOSE YOUR PROFILE TOKEN:</Text>
                  <TouchableOpacity 
                    style={styles.tokenPickerBtn}
                    onPress={() => setShowSpecialties(true)}
                  >
                    <View style={[styles.tokenIconCircle, { backgroundColor: activeSpecialty.catColor }]}>
                      {activeSpecialty.icon === 'seesaw' ? (
                        <SeesawIcon color="#FFFFFF" size={18} />
                      ) : (
                        <Ionicons name={activeSpecialty.icon} size={18} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.tokenTitle}>{activeSpecialty.name}</Text>
                      <Text style={styles.tokenSub}>{activeSpecialty.sub}</Text>
                    </View>
                    <Text style={styles.tokenChooseBtn}>Choose</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Footer Navigation Controls */}
            <View style={[styles.footerRow, !isDesktop && { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Paging Dots */}
                <View style={styles.dotsRow}>
                  {Array.from({ length: totalSlides }).map((_, idx) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.dot, 
                        currentSlide === idx ? styles.dotActive : null,
                        { backgroundColor: '#695d3d' }
                      ]} 
                    />
                  ))}
                </View>

                {/* Next / Start Button */}
                <TouchableOpacity 
                  style={[styles.nextBtn, { backgroundColor: '#695d3d' }]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextBtnText}>
                    {currentSlide === totalSlides - 1 ? 'Start Exploring' : 'Next'}
                  </Text>
                  <Ionicons 
                    name={currentSlide === totalSlides - 1 ? 'checkmark-circle-outline' : 'arrow-forward-outline'} 
                    size={16} 
                    color="#FFFFFF" 
                    style={{ marginLeft: 6 }} 
                  />
                </TouchableOpacity>
              </View>

              {!isDesktop && (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                  <Text style={styles.brandFooter}>© 2026 Hoosier AI Automations LLC</Text>
                  <Text style={styles.brandFooterArtwork}>Artwork By: Rikku I. | All Rights Reserved</Text>
                </View>
              )}
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>

      {/* ── SPECIALTIES SELECTION MODAL ── */}
      <Modal
        visible={showSpecialties}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSpecialties(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.specialtiesCard, { width: Math.min(width - 32, 500) }]}>
            <View style={styles.specialtiesHeader}>
              <Text style={styles.specialtiesHeaderTitle}>Choose Your Specialty Icon</Text>
              <TouchableOpacity onPress={() => setShowSpecialties(false)}>
                <Ionicons name="close" size={24} color="#1B3432" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {specialties.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.specialtyItem,
                    selectedSpecialty === item.id && styles.specialtyItemActive
                  ]}
                  onPress={() => {
                    setSelectedSpecialty(item.id);
                    setShowSpecialties(false);
                  }}
                >
                  <View style={[styles.specialtyCircle, { backgroundColor: item.catColor }]}>
                    {item.icon === 'seesaw' ? (
                      <SeesawIcon color="#FFFFFF" size={18} />
                    ) : (
                      <Ionicons name={item.icon} size={18} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.specialtyName}>{item.name}</Text>
                    <Text style={styles.specialtySub}>{item.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  onboardingCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF9F6',
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  leftBrandPane: {
    backgroundColor: '#253357',
  },
  brandingContent: {
    justifyContent: 'center',
  },
  logoSquareWrapper: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  appLogo: {
    width: 238,
    height: 238,
    borderRadius: 22,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FAF9F6',
    textAlign: 'center',
  },
  brandDesc: {
    fontSize: 13,
    color: '#FAF9F6',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.85,
    paddingHorizontal: 12,
  },
  brandFooter: {
    fontSize: 10,
    color: '#d1c7a9',
    opacity: 0.7,
    textAlign: 'center',
  },
  brandFooterArtwork: {
    fontSize: 9,
    color: '#d1c7a9',
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  rightSlidesPane: {
    backgroundColor: '#FAF9F6',
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    flex: 1,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '950',
    color: '#695d3d',
    textAlign: 'center',
    lineHeight: 32,
  },
  slidePreTitle: {
    fontSize: 10,
    fontWeight: '850',
    color: '#695d3d',
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 14,
  },
  slideDesc: {
    fontSize: 14,
    color: '#695d3d',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(105, 93, 61, 0.15)',
    paddingTop: 20,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3, opacity: 0.3 },
  dotActive: { width: 16, opacity: 1 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  formGroup: { width: '100%', marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '850', color: '#695d3d', letterSpacing: 1.2, marginBottom: 6 },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(105, 93, 61, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1B3432',
  },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(105, 93, 61, 0.15)' },
  pillActive: { backgroundColor: '#695d3d', borderColor: '#695d3d' },
  pillText: { fontSize: 11, color: '#695d3d', fontWeight: '700' },
  pillTextActive: { color: '#FFFFFF' },
  tokenPickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(105, 93, 61, 0.15)' },
  tokenIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  tokenTitle: { fontSize: 13, fontWeight: '800', color: '#1B3432' },
  tokenSub: { fontSize: 11, color: '#5A716E' },
  tokenChooseBtn: { fontSize: 12, fontWeight: '800', color: '#695d3d', textDecorationLine: 'underline' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  specialtiesCard: { backgroundColor: '#FAF9F6', borderRadius: 20, padding: 20, ...SHADOWS.medium },
  specialtiesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(105, 93, 61, 0.15)', paddingBottom: 10 },
  specialtiesHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#1B3432' },
  specialtyItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(105, 93, 61, 0.15)' },
  specialtyItemActive: { borderColor: '#695d3d', backgroundColor: 'rgba(105, 93, 61, 0.05)' },
  specialtyCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  specialtyName: { fontSize: 13, fontWeight: '800', color: '#1B3432' },
  specialtySub: { fontSize: 11, color: '#5A716E' }
});
