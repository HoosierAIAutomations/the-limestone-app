import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Linking, Modal, TextInput, ActivityIndicator, Share, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { WEB3FORMS_ACCESS_KEY, CONTACT_EMAIL, SUPPORT_WHATSAPP_NUMBER, SUPPORT_MESSENGER_USERNAME } from '../utils/config';
import { useAppContext } from '../utils/AppContext';
import DIRECTORY_DATA from '../utils/cachedDirectory.json';
import EVENTS_DATA from '../utils/cachedEvents.json';

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

export default function HubScreen({ navigation }) {
  const {
    isDarkMode,
    toggleDarkMode,
    profile,
    updateProfile,
    colors,
    globalStyles,
    typography,
    savedSpots,
    rsvpEvents,
    visitedShopsCount,
    getProfilePictureDetails,
    requestLocationPermission,
    requestNotificationsPermission,
    showToast,
  } = useAppContext();

  const { width } = useWindowDimensions();
  const isDesktop = width > 850;
  const styles = getStyles(colors, isDesktop);
  const avatar = getProfilePictureDetails();

  // Edit Profile States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editProfilePicture, setEditProfilePicture] = useState(profile.profilePicture || 'forest');

  // Support Modal States
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportName, setSupportName] = useState(profile.name);
  const [supportType, setSupportType] = useState('Customer Support');
  const [supportMessage, setSupportMessage] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Other Modals
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAppRatingModal, setShowAppRatingModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [appStars, setAppStars] = useState(5);
  const [appComment, setAppComment] = useState('');

  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const month = months[parseInt(parts[1], 10) - 1];
      const day = parseInt(parts[2], 10);
      const year = parts[0];
      return `${month} ${day}, ${year}`;
    }
    return dateStr;
  };

  const handleSendSupport = async () => {
    if (!supportName || !submitterEmail || !supportMessage) {
      Alert.alert("Required Fields", "Please fill in all required fields.");
      return;
    }

    const emailBody = `Hello,

I have submitted a support request from the Limestone App Citizen Hub:

- Sender Name: ${supportName}
- Support Type: ${supportType}
- Contact Email: ${submitterEmail}
- Message Details:
${supportMessage}`;

    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
      triggerSupportMailtoFallback(emailBody);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Limestone App Support - ${supportType} from ${supportName}`,
          email: submitterEmail,
          message: emailBody
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
      } else {
        triggerSupportMailtoFallback(emailBody);
      }
    } catch (err) {
      triggerSupportMailtoFallback(emailBody);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerSupportMailtoFallback = (emailBody) => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Limestone App Support: ${supportType}`)}&body=${encodeURIComponent(emailBody)}`;
    Linking.openURL(mailtoUrl)
      .then(() => setSubmitSuccess(true))
      .catch(() => {
        Alert.alert("Email App Failed", `Please send support queries to ${CONTACT_EMAIL}`);
      });
  };

  const handleWhatsAppSupport = () => {
    const text = `Hello! I would like to request support for the Limestone App. My name is ${profile.name}.`;
    Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`).catch(() => {
      Alert.alert("Failed to Open WhatsApp", `Please contact support at ${CONTACT_EMAIL}`);
    });
  };

  const handleMessengerSupport = () => {
    Linking.openURL(`https://m.me/${SUPPORT_MESSENGER_USERNAME}`).catch(() => {
      Alert.alert("Failed to Open Messenger", `Please contact support at ${CONTACT_EMAIL}`);
    });
  };

  const handleResetForm = () => {
    setSupportName(profile.name);
    setSupportType('Customer Support');
    setSupportMessage('');
    setSubmitterEmail('');
    setSubmitSuccess(false);
    setShowSupportModal(false);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Explore The Limestone App - the ultimate digital community directory and calendar for Lawrence County, Indiana!',
      });
    } catch (e) {}
  };

  const handleSaveProfile = () => {
    updateProfile({ name: editName, profilePicture: editProfilePicture });
    setShowEditProfileModal(false);
    showToast('Profile tokens updated!', 'success');
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
      {/* Top Controls Header */}
      <View style={styles.topControlHeader}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="person-circle" size={24} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.mainTitle}>Citizen Control Center</Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isDesktop ? (
          /* ────────────────────────────────────────────────────────
             DESKTOP TWO-COLUMN CONTROL PANEL
             ──────────────────────────────────────────────────────── */
          <View style={styles.desktopLayout}>
            
            {/* LEFT COLUMN (Profile + Settings Preferences) */}
            <View style={styles.leftColumn}>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <View style={[styles.avatarRing, { borderColor: avatar.borderColor, overflow: 'hidden' }]}>
                  <View style={[styles.avatarCircle, { backgroundColor: avatar.bgColor, alignItems: 'center', justifyContent: 'center' }]}>
                    {avatar.icon === 'seesaw' ? (
                      <SeeSawIcon color={avatar.textColor} size={28} />
                    ) : (
                      <Ionicons name={avatar.icon} size={28} color={avatar.textColor} />
                    )}
                  </View>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileSub}>{avatar.sub} · Member since 2026</Text>
                  <View style={styles.tierBadge}>
                    <Ionicons name="ribbon" size={11} color={colors.accent} style={{ marginRight: 4 }} />
                    <Text style={styles.tierText}>LOCAL SUPPORTER</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditProfileModal(true)}>
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Stats Box */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{savedSpots.length}</Text>
                  <Text style={styles.statLabel}>Saved Spots</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{rsvpEvents.length}</Text>
                  <Text style={styles.statLabel}>RSVP'd Events</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{visitedShopsCount}</Text>
                  <Text style={styles.statLabel}>Shops Visited</Text>
                </View>
              </View>

              {/* Preferences */}
              <Text style={styles.sectionHeader}>APP PREFERENCES</Text>
              <View style={styles.card}>
                <View style={styles.menuItem}>
                  <View style={styles.menuLeft}>
                    <Ionicons name="notifications" size={18} color="#4DABF7" style={{ marginRight: 10 }} />
                    <Text style={styles.menuText}>Push Notifications</Text>
                  </View>
                  <Switch
                    value={profile.notificationsEnabled}
                    onValueChange={(val) => {
                      if (val) {
                        requestNotificationsPermission();
                      } else {
                        updateProfile({ notificationsEnabled: false });
                        showToast("Notifications disabled.", "warning");
                      }
                    }}
                    trackColor={{ false: colors.border, true: colors.accent }}
                  />
                </View>

                <View style={styles.menuItem}>
                  <View style={styles.menuLeft}>
                    <Ionicons name="location" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                    <Text style={styles.menuText}>Location Services</Text>
                  </View>
                  <Switch
                    value={profile.locationEnabled}
                    onValueChange={(val) => {
                      if (val) {
                        requestLocationPermission();
                      } else {
                        updateProfile({ locationEnabled: false });
                        showToast("Location services disabled.", "warning");
                      }
                    }}
                    trackColor={{ false: colors.border, true: colors.accent }}
                  />
                </View>

                <View style={[styles.menuItem, styles.noBorder]}>
                  <View style={styles.menuLeft}>
                    <Ionicons name="moon" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                    <Text style={styles.menuText}>Dark Mode Theme</Text>
                  </View>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: colors.border, true: colors.accent }}
                  />
                </View>
              </View>

              {/* Neighborhood */}
              <Text style={styles.sectionHeader}>MY NEIGHBORHOOD SECTOR</Text>
              <View style={styles.card}>
                {['Bedford', 'Mitchell', 'Oolitic', 'Springville', 'All County'].map((hood) => {
                  const isActive = profile.neighborhood === hood;
                  return (
                    <TouchableOpacity
                      key={hood}
                      style={styles.menuItem}
                      onPress={() => {
                        updateProfile({ neighborhood: hood });
                        showToast(`Sector set to ${hood}!`, 'success');
                      }}
                    >
                      <View style={styles.menuLeft}>
                        <Ionicons name={hood === 'All County' ? 'globe' : 'location'} size={16} color={isActive ? colors.primary : colors.textLight} style={{ marginRight: 10 }} />
                        <Text style={[styles.menuText, isActive && { fontWeight: '800', color: colors.primary }]}>{hood}</Text>
                      </View>
                      {isActive && (
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>Active</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* RIGHT COLUMN (Saved Spots + Custom Dialog triggers) */}
            <View style={styles.rightColumn}>
              {/* Saved spots list */}
              <Text style={styles.sectionHeader}>SAVED SPOTS & BOOKMARKS</Text>
              <View style={styles.card}>
                {savedSpots.length === 0 ? (
                  <View style={styles.emptyCardBox}>
                    <Ionicons name="bookmark-outline" size={24} color={colors.textLight} />
                    <Text style={styles.emptyCardText}>No saved business spots yet.</Text>
                  </View>
                ) : (
                  savedSpots.map((spotId) => {
                    const spot = DIRECTORY_DATA.find(b => b.id === spotId);
                    if (!spot) return null;
                    return (
                      <View key={spotId} style={styles.bookmarkRowItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bookmarkRowName}>{spot.name}</Text>
                          <Text style={styles.bookmarkRowSub}>{spot.subCategory} · {spot.address}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.bookmarkActionBtn}
                          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ', ' + spot.address)}`)}
                        >
                          <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>

              {/* RSVP'd events */}
              <Text style={styles.sectionHeader}>MY RSVPS & EVENTS</Text>
              <View style={styles.card}>
                {rsvpEvents.length === 0 ? (
                  <View style={styles.emptyCardBox}>
                    <Ionicons name="calendar-outline" size={24} color={colors.textLight} />
                    <Text style={styles.emptyCardText}>No RSVP'd activities yet.</Text>
                  </View>
                ) : (
                  rsvpEvents.map((eventId) => {
                    const event = EVENTS_DATA.find(e => e.id === eventId);
                    if (!event) return null;
                    return (
                      <View key={eventId} style={styles.bookmarkRowItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bookmarkRowName}>{event.title}</Text>
                          <Text style={styles.bookmarkRowSub}>{formatEventDate(event.date)} · {event.time}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.bookmarkActionBtn}
                          onPress={() => Alert.alert(event.title, event.desc)}
                        >
                          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Support & legal options */}
              <Text style={styles.sectionHeader}>COMMUNICATION & HELP</Text>
              <View style={styles.card}>
                {[
                  { label: 'Submit Suggestion or Support Request', icon: 'help-circle-outline', action: () => setShowSupportModal(true) },
                  { label: 'About The Limestone', icon: 'information-circle-outline', action: () => setShowAboutModal(true) },
                  { label: 'Privacy & Data Policy', icon: 'shield-checkmark-outline', action: () => setShowPrivacyModal(true) },
                  { label: 'Rate The Limestone App', icon: 'star-outline', action: () => setShowAppRatingModal(true) },
                  { label: 'Share with a Neighbor', icon: 'share-social-outline', action: handleShareApp },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.menuItem}
                    onPress={item.action}
                  >
                    <View style={styles.menuLeft}>
                      <Ionicons name={item.icon} size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
                      <Text style={styles.menuText}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        ) : (
          /* ────────────────────────────────────────────────────────
             COLLAPSED MOBILE LAYOUT (VERTICAL STACK)
             ──────────────────────────────────────────────────────── */
          <View style={{ paddingHorizontal: 16 }}>
            {/* Profile */}
            <View style={styles.profileCard}>
              <View style={[styles.avatarCircle, { backgroundColor: avatar.bgColor, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }]}>
                {avatar.icon === 'seesaw' ? <SeeSawIcon color={avatar.textColor} size={20} /> : <Ionicons name={avatar.icon} size={20} color={avatar.textColor} />}
              </View>
              <View style={[styles.profileInfo, { marginLeft: 12 }]}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileSub}>{profile.neighborhood}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditProfileModal(true)}>
                <Ionicons name="pencil" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Switch theme */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <View style={styles.menuItem}>
                <Text style={styles.menuText}>Dark Mode</Text>
                <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
              </View>
            </View>

            {/* Quick buttons list */}
            <Text style={styles.sectionHeader}>Citizen Resources</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowAboutModal(true)}>
                <Text style={styles.menuText}>About The Limestone</Text>
                <Ionicons name="chevron-forward" size={14} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowSupportModal(true)}>
                <Text style={styles.menuText}>Request Help & Support</Text>
                <Ionicons name="chevron-forward" size={14} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowPrivacyModal(true)}>
                <Text style={styles.menuText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={14} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Universal Footer Copyright credits */}
        <View style={styles.footer}>
          <Text style={styles.footerCopy}>© 2026 Hoosier AI Automations LLC. · All Rights Reserved</Text>
          <Text style={styles.footerCopy}>App logo Art Design By: Rikku I. | All Rights Reserved</Text>
        </View>
      </ScrollView>

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal visible={showEditProfileModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Citizen Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ marginVertical: 12 }}>
              <Text style={styles.inputLabel}>Name / Call Sign</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Nate L."
                placeholderTextColor={colors.textLight}
              />
            </View>
            <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ABOUT MODAL ── */}
      <Modal visible={showAboutModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: 16, fontWeight: '800' }]}>
                About <Text style={{ color: colors.accent }}>The Limestone</Text>
              </Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 550, paddingRight: 4 }}>
              <View style={{ marginBottom: 20, alignItems: 'center', marginTop: 10 }}>
                <Ionicons name="people-circle-outline" size={60} color={colors.accent} style={{ marginBottom: 10 }} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>Our Story & Artistry</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>Curated for Lawrence County, IN</Text>
              </View>

              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 16 }}>
                Welcome to <Text style={{ fontWeight: '800', color: colors.textPrimary }}>The Limestone</Text>, curated and developed by <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Hoosier AI Automations LLC.</Text> (nate@hoosieraiautomations.com).
                Our mission is to help residents and visitors connect with local businesses, discover local spots, trust local trades, and support county schools.
              </Text>

              <View style={{ 
                backgroundColor: colors.cardSurface, 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 16, 
                padding: 16, 
                marginBottom: 20,
                alignItems: 'center',
                ...SHADOWS.light
              }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
                  THE ORIGINAL APP LOGO DRAWING
                </Text>
                <Image 
                  source={require('../../assets/logo-original.jpg')} 
                  style={{ 
                    width: '100%', 
                    height: 240, 
                    borderRadius: 12, 
                    resizeMode: 'contain',
                    backgroundColor: '#f5f2eb',
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border
                  }} 
                />
                <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', lineHeight: 15 }}>
                  Handmade illustration by <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Rikku I.</Text> representing the sunrise rising over the Southern Indiana hills, limestone cuts, and waterways of Lawrence County.
                </Text>
              </View>

              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>App Logo Artistry</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 14 }}>
                The Limestone brand elements are built upon raw, local Indiana character. We chose Rikku I.'s stunning hand-drawn illustration to serve as the heart of the app logo. It represents the warmth of the Hoosier sunrise, our rolling limestone ridges, and the connection we share with the land and neighbors.
              </Text>

              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>Hoosier AI Automations LLC.</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 20 }}>
                Based locally in Indiana, Hoosier AI Automations LLC. designs clean, high-performance community tools that preserve local trust, protect consumer privacy, and celebrate local commerce. No tracking, no ads, just neighborhood utilities.
              </Text>

              <TouchableOpacity 
                style={[styles.saveProfileBtn, { width: '100%', height: 40, marginTop: 10 }]} 
                onPress={() => setShowAboutModal(false)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Dismiss</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── PRIVACY POLICY MODAL ── */}
      <Modal visible={showPrivacyModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy & Data Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.aboutBodyText}>
                The Limestone application respects your personal data. We store your favorites list, RSVPs, profile tokens, and neighborhood selections locally on your device storage (`AsyncStorage`).
              </Text>
              <Text style={styles.aboutBodyText}>
                We do not upload your name, location details, or settings to any external servers unless you explicitly submit a business listing or request help via the Support Center.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── HELP / SUPPORT MODAL ── */}
      <Modal visible={showSupportModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Support Center Inquiry</Text>
              <TouchableOpacity onPress={handleResetForm}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {submitSuccess ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Request Received!</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>Our team will review your ticket and email you shortly.</Text>
                <TouchableOpacity style={styles.saveProfileBtn} onPress={handleResetForm}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Your Contact Email *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={submitterEmail}
                    onChangeText={setSubmitterEmail}
                    placeholder="e.g. citizen@gmail.com"
                    placeholderTextColor={colors.textLight}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Message Details *</Text>
                  <TextInput 
                    style={[styles.modalInput, { height: 60 }]} 
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                    placeholder="Explain your listing adjustment, request support, or sponsorship inquiry..."
                    placeholderTextColor={colors.textLight}
                    multiline
                  />
                </View>

                {/* Direct buttons */}
                <View style={{ gap: 8, marginTop: 12 }}>
                  <TouchableOpacity style={[styles.channelBtn, { backgroundColor: colors.success }]} onPress={handleWhatsAppSupport}>
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>WhatsApp Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.channelBtn, { backgroundColor: colors.accent }]} onPress={handleMessengerSupport}>
                    <Ionicons name="chatbubbles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Messenger Support</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.saveProfileBtn, { marginTop: 16 }]}
                  onPress={handleSendSupport}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Submit Ticket</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── APP RATING MODAL ── */}
      <Modal visible={showAppRatingModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate The Limestone App</Text>
              <TouchableOpacity onPress={() => setShowAppRatingModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {[1,2,3,4,5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setAppStars(star)}>
                    <Ionicons name="star" size={24} color={star <= appStars ? '#FCC419' : colors.border} />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput 
                style={[styles.modalInput, { width: '100%', height: 60 }]}
                value={appComment}
                onChangeText={setAppComment}
                placeholder="Leave an optional comment about your experience..."
                placeholderTextColor={colors.textLight}
                multiline
              />
              <TouchableOpacity 
                style={[styles.saveProfileBtn, { width: '100%', marginTop: 12 }]}
                onPress={() => {
                  setShowAppRatingModal(false);
                  showToast('Thank you for rating!', 'success');
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Submit Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDesktop) => StyleSheet.create({
  topControlHeader: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardSurface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  desktopLayout: {
    flexDirection: 'row',
    padding: 24,
    gap: 24,
  },
  leftColumn: {
    flex: 1,
    gap: 20,
  },
  rightColumn: {
    flex: 1.2,
    gap: 20,
  },
  profileCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  profileSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
  },
  editBtn: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-around',
    ...SHADOWS.light,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '750',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    ...SHADOWS.light,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  menuText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  activePill: {
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
  },
  emptyCardBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
  },
  bookmarkRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookmarkRowName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bookmarkRowSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookmarkActionBtn: {
    padding: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  footerCopy: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
    fontWeight: '650',
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
    maxWidth: 450,
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
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
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
    marginTop: 4,
  },
  saveProfileBtn: {
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  formInputGroup: {
    marginBottom: 10,
  },
  channelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  aboutTextHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  aboutBodyText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  }
});
