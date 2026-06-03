import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { colors, completeOnboarding, showToast, getProfilePictureDetails } = useAppContext();
  const styles = getStyles(colors);
  
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  // Form states for slide 4
  const [name, setName] = useState('');
  const [selectedHood, setSelectedHood] = useState('Bedford');
  const [selectedAvatar, setSelectedAvatar] = useState('forest');
  const [isJoining, setIsJoining] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);

  const slides = [
    {
      id: 0,
      title: 'Welcome to The Limestone',
      desc: 'A dedicated, homegrown community space for the citizens of Bedford and the surrounding County of Lawrence.',
      icon: 'heart-outline',
      iconColor: '#b32c22', // Rich Crimson/Brick Red
      bgColor: '#d1c7a9', // Southern Limestone Gold
    },
    {
      id: 1,
      title: 'Discover Local Listings',
      desc: 'Access over 300 verified county businesses, sit-down menus, and essential public health resources, with customized direct-order options.',
      icon: 'business-outline',
      iconColor: '#253357', // Welcome Home Deep Navy Blue
      bgColor: '#d1c7a9', // Southern Limestone Gold
    },
    {
      id: 2,
      title: 'Live Advisories & Delays',
      desc: 'Stay informed with real-time National Weather Service safety bulletins, active road paving maps, and seasonal school delays.',
      icon: 'warning-outline',
      iconColor: '#c49921', // Honey/Limestone Gold
      bgColor: '#d1c7a9', // Southern Limestone Gold
    },
    {
      id: 3,
      title: 'Join Our Community',
      desc: 'Create your local profile to unlock bookmarks, calendar RSVPs, ratings, and customized neighborhood feeds.',
      icon: 'people-outline',
      iconColor: '#253357', // Welcome Home Deep Navy Blue
      bgColor: '#d1c7a9', // Southern Limestone Gold
    }
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      const nextSlide = activeSlide + 1;
      setActiveSlide(nextSlide);
      scrollRef.current?.scrollTo({ x: nextSlide * SCREEN_WIDTH, animated: true });
    }
  };

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slideIndex !== activeSlide && slideIndex >= 0 && slideIndex < slides.length) {
      setActiveSlide(slideIndex);
    }
  };

  const handleJoin = () => {
    if (!name.trim()) {
      showToast('Please enter your first name to join the community!', 'error');
      return;
    }
    setIsJoining(true);
    setTimeout(() => {
      completeOnboarding(name.trim(), selectedHood, selectedAvatar);
      setIsJoining(false);
    }, 800);
  };

  const allPresets = [
    'forest', 'quarry', 'bridge', 'carver', 'monon', 'transit', 'parks', 'space',
    'education', 'agriculture', 'opera', 'citizen', 'aviation', 'camping', 'caverns',
    'fishing', 'festival', 'cabin', 'trail', 'sunrise', 'athletics', 'arts', 'fairgrounds', 'wellness'
  ];

  const neighborhoodOptions = ['Bedford', 'Mitchell', 'Oolitic', 'Springville', 'All County'];
  const getPresetCircleColor = (presetId) => {
    const goldGroup = ['carver', 'agriculture', 'aviation', 'sunrise', 'fairgrounds'];
    const blueGroup = ['quarry', 'transit', 'space', 'caverns', 'athletics'];
    const bronzeGroup = ['bridge', 'monon', 'opera', 'fishing', 'festival', 'arts'];
    const greenGroup = ['parks', 'wellness'];
    
    if (goldGroup.includes(presetId)) return '#C49921';
    if (blueGroup.includes(presetId)) return '#253357';
    if (bronzeGroup.includes(presetId)) return '#968469';
    if (greenGroup.includes(presetId)) return '#2D7F67';
    return '#185955';
  };

  const selectedIconDetails = getProfilePictureDetails(selectedAvatar);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollStyle}
          contentContainerStyle={{ height: '100%' }}
          keyboardShouldPersistTaps="handled"
        >
          {slides.map((slide, idx) => {
            const isLast = idx === slides.length - 1;
            const isFirst = idx === 0;
            return (
              <View key={slide.id} style={[styles.slide, { backgroundColor: slide.bgColor }]}>
                {/* Responsive container centering to eliminate dead space */}
                <View style={styles.slideContentResponsive}>
                  {isFirst ? (
                    <View style={styles.slideContentWelcome}>
                      <View style={[styles.welcomeIconWrapper, { backgroundColor: 'rgba(179, 44, 34, 0.15)' }]}>
                        <Ionicons name="heart-outline" size={76} color="#b32c22" />
                      </View>
                      <Text style={styles.welcomeTitle}>Welcome to{"\n"}The Limestone</Text>
                      <Text style={styles.welcomeSubtitle}>Your Digital Town Square</Text>
                      <Text style={styles.welcomeDesc}>{slide.desc}</Text>
                    </View>
                  ) : !isLast ? (
                    <View style={styles.slideContentFilled}>
                      <View style={[styles.welcomeIconWrapper, { backgroundColor: slide.id === 1 ? 'rgba(37, 51, 87, 0.15)' : slide.id === 2 ? 'rgba(196, 153, 33, 0.15)' : `${slide.iconColor}20` }]}>
                        <Ionicons name={slide.icon} size={64} color={slide.iconColor} />
                      </View>
                      <Text style={styles.welcomeTitle}>{slide.title}</Text>
                      <View style={{ height: 2, width: 60, backgroundColor: slide.iconColor, marginVertical: 16, borderRadius: 1 }} />
                      <Text style={styles.welcomeDesc}>{slide.desc}</Text>
                    </View>
                  ) : (
                    /* Slide 4 (Last Slide) - Unified direct flow */
                    <View style={styles.formContainer}>
                      <View style={styles.slide4Header}>
                        <View style={[styles.iconWrapperSmall, { backgroundColor: slide.id === 3 ? 'rgba(37, 51, 87, 0.15)' : `${slide.iconColor}20` }]}>
                          <Ionicons name={slide.icon} size={28} color={slide.iconColor} />
                        </View>
                        <Text style={styles.slide4Title}>{slide.title}</Text>
                      </View>
                      <Text style={styles.slide4Desc}>{slide.desc}</Text>

                      <View style={{ height: 1, backgroundColor: 'rgba(105, 93, 61, 0.2)', marginVertical: 14 }} />

                      <Text style={styles.formLabel}>YOUR FIRST NAME:</Text>
                      <TextInput
                        style={styles.textInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Sarah"
                        placeholderTextColor="rgba(105, 93, 61, 0.5)"
                        maxLength={20}
                      />

                      <Text style={styles.formLabel}>YOUR HOME NEIGHBORHOOD:</Text>
                      <View style={styles.hoodGrid}>
                        {neighborhoodOptions.map((hood) => {
                          const isSelected = selectedHood === hood;
                          return (
                            <TouchableOpacity
                              key={hood}
                              style={[styles.hoodBtn, isSelected && styles.hoodBtnActive]}
                              onPress={() => setSelectedHood(hood)}
                            >
                              <Text style={[styles.hoodText, isSelected && styles.hoodTextActive]}>
                                {hood === 'All County' ? 'All County' : `${hood}, IN`}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={styles.formLabel}>CHOOSE YOUR PROFILE TOKEN:</Text>
                      <TouchableOpacity
                        style={styles.iconPickerBtn}
                        onPress={() => setShowIconModal(true)}
                      >
                        <View style={[styles.selectedIconCircle, { backgroundColor: getPresetCircleColor(selectedAvatar), borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' }]}>
                          {selectedIconDetails.icon === 'seesaw' ? (
                            <SeesawIcon color="#FFFFFF" size={24} />
                          ) : (
                            <Ionicons name={selectedIconDetails.icon} size={24} color="#FFFFFF" />
                          )}
                        </View>
                        <View style={styles.selectedIconInfo}>
                          <Text style={styles.selectedIconLabel}>{selectedIconDetails.label}</Text>
                          <Text style={styles.selectedIconSub}>{selectedIconDetails.sub}</Text>
                        </View>
                        <View style={styles.editIconBadge}>
                          <Ionicons name="pencil" size={12} color="#1B3432" />
                          <Text style={styles.editIconText}>Choose</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Citizen Icon Modal Picker */}
        <Modal
          visible={showIconModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowIconModal(false)}
        >
          <SafeAreaProvider>
            <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Choose Your Specialty Icon</Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setShowIconModal(false)}
              >
                <Ionicons name="close" size={26} color="#1B3432" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalSubtitle}>
                Select a beautiful commemorative token badge celebrating Lawrence County and the Hoosier State:
              </Text>

              <View style={styles.modalGrid}>
                {allPresets.map((presetId) => {
                  const details = getProfilePictureDetails(presetId);
                  const isSelected = selectedAvatar === presetId;
                  return (
                    <TouchableOpacity
                      key={presetId}
                      style={[
                        styles.modalGridItem,
                        isSelected && { borderColor: '#695d3d', borderWidth: 2 }
                      ]}
                      onPress={() => {
                        setSelectedAvatar(presetId);
                        setShowIconModal(false);
                      }}
                    >
                      <View style={[styles.modalItemCircle, { backgroundColor: getPresetCircleColor(presetId), borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
                        {details.icon === 'seesaw' ? (
                          <SeesawIcon color="#FFFFFF" size={22} />
                        ) : (
                          <Ionicons name={details.icon} size={22} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={[styles.modalItemLabel, isSelected && { color: '#12433F', fontWeight: '900' }]} numberOfLines={1}>
                        {details.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>

        {/* Footer controls: page indicator + CTA */}
        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {slides.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, activeSlide === idx && styles.dotActive]}
              />
            ))}
          </View>

          {activeSlide < slides.length - 1 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textOnDark} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.joinBtn, { backgroundColor: colors.accent }]} 
              onPress={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color={colors.textOnDark} />
              ) : (
                <>
                  <Text style={styles.joinBtnText}>Join the Community</Text>
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.textOnDark} style={{ marginLeft: 4 }} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#d1c7a9',
  },
  scrollStyle: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center', // Center everything vertically
    alignItems: 'center',
  },
  slideContentResponsive: {
    width: '100%',
    maxWidth: 480, // Responsive tablet/Chromebook PWA card boundary
    justifyContent: 'center',
    alignSelf: 'center',
  },
  slideContentWelcome: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  slideContentFilled: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  welcomeIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#E07A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '900',
    color: '#695d3d', // Dark gold/bronze for legibility
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4d4329', // Dark bronze/olive-gold subtitle
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  welcomeDesc: {
    fontSize: 17, // Enlarged to fill up the screen beautifully
    color: '#695d3d', // Dark gold/bronze text
    textAlign: 'center',
    lineHeight: 25,
    paddingHorizontal: SPACING.xs,
  },
  slide4Header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapperSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide4Title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#695d3d', // Dark gold/bronze
  },
  slide4Desc: {
    fontSize: 15, // Enlarged Slide 4 desc a tad bigger
    color: '#695d3d', // Dark gold/bronze description text
    lineHeight: 21,
    marginTop: SPACING.sm,
  },
  formContainer: {
    width: '100%',
    justifyContent: 'center', // Zero background box - clean flow!
  },
  formLabel: {
    fontSize: 9,
    fontWeight: '850',
    color: '#695d3d', // Dark gold/bronze for high contrast
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)', // Lighter background for gold slides
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(105, 93, 61, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#695d3d',
    fontWeight: '700',
    marginBottom: 10,
  },
  hoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  hoodBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(105, 93, 61, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  hoodBtnActive: {
    backgroundColor: '#E07A5F', // Warm coral — visible against teal bg, matches Next btn
    borderColor: '#E07A5F',
  },
  hoodText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#695d3d', // Dark gold/bronze for high contrast
  },
  hoodTextActive: {
    color: colors.textOnDark,
  },
  iconPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(105, 93, 61, 0.25)',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  selectedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedIconInfo: {
    flex: 1,
  },
  selectedIconLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#695d3d', // Dark gold/bronze
  },
  selectedIconSub: {
    fontSize: 10,
    color: '#695d3d', // Dark gold/bronze
    fontWeight: '600',
    marginTop: 2,
  },
  editIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editIconText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1B3432', // Dark slate-teal for high legibility against white badge background
    marginLeft: 3,
  },

  modalSafeArea: {
    flex: 1,
    backgroundColor: '#d1c7a9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(105, 93, 61, 0.15)',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B3432',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: SPACING.lg,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#4E3E1F',
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 16,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  modalGridItem: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(105, 93, 61, 0.25)',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalItemCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalItemLabel: {
    fontSize: 10,
    fontWeight: '850',
    color: '#1B3432',
    width: '90%',
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#d1c7a9',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 6,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#E07A5F', // Rose Gold/Coral instead of yellow
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E07A5F', // Warm coral — pops against the teal slide bg
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    ...SHADOWS.light,
  },
  nextBtnText: {
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: '800',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  joinBtnText: {
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: '900',
  }
});
