import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Platform, Linking, Modal, TextInput, ActivityIndicator, Share, Image } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { WEB3FORMS_ACCESS_KEY, CONTACT_EMAIL, SUPPORT_WHATSAPP_NUMBER, SUPPORT_MESSENGER_USERNAME } from '../utils/config';
import { useAppContext } from '../utils/AppContext';
import DIRECTORY_DATA from '../utils/cachedDirectory.json';
import EVENTS_DATA from '../utils/cachedEvents.json';

const SafeModal = ({ children, ...modalProps }) => (
  <Modal {...modalProps}>
    <SafeAreaProvider>
      {children}
    </SafeAreaProvider>
  </Modal>
);

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
    appRatings,
    submitAppRating,
    requestLocationPermission,
    requestNotificationsPermission,
    getProfilePictureDetails,
    getAvatarDetails,
    showToast,
  } = useAppContext();

  const styles = getStyles(colors);
  const avatar = getProfilePictureDetails();

  // Edit Profile States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editProfilePicture, setEditProfilePicture] = useState(profile.profilePicture || 'forest');

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

  // Support & Help Center Modal States
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportName, setSupportName] = useState(profile.name);
  const [supportType, setSupportType] = useState('Customer Support');
  const [supportMessage, setSupportMessage] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Legitimate Privacy & App Rating Modal States
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

  const menuItemPress = (title, message) => {
    Alert.alert(title, message, [{ text: 'Got It' }]);
  };

  const handleSendSupport = async () => {
    if (!supportName || !submitterEmail || !supportMessage) {
      Alert.alert("Required Fields", "Please fill in all required fields: Your Name, Contact Email, and Message.");
      return;
    }

    const emailBody = `Hello,

I have submitted a support request from the Limestone App Citizen Hub:

- Sender Name: ${supportName}
- Support Type: ${supportType}
- Contact Email: ${submitterEmail}
- Message Details:
${supportMessage}

Thank you!`;

    // 1. Check if the key is default or empty
    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
      triggerSupportMailtoFallback(emailBody);
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
          subject: `Limestone App Support - ${supportType} from ${supportName}`,
          from_name: 'The Limestone App Support',
          name: supportName,
          email: submitterEmail,
          message: emailBody,
          supportType,
          senderName: supportName,
          senderEmail: submitterEmail,
          supportMessage
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
      } else {
        console.warn('Web3Forms support error, falling back to mail client:', data);
        triggerSupportMailtoFallback(emailBody);
      }
    } catch (err) {
      console.warn('Web3Forms support submit error, falling back to mail client:', err);
      triggerSupportMailtoFallback(emailBody);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerSupportMailtoFallback = (emailBody) => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Limestone App Support Request: ${supportType}`)}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(mailtoUrl)
      .then(() => {
        setSubmitSuccess(true);
      })
      .catch(err => {
        Alert.alert(
          "Mail App Failed",
          `We couldn't submit your request via Web3Forms or launch your email client. Please send support details directly to ${CONTACT_EMAIL}.\n\nThank you!`,
          [{ text: "OK" }]
        );
      });
  };

  const handleWhatsAppSupport = () => {
    let text = `Hello Nate! I'm requesting support from the Limestone App:`;
    if (supportName) text += `\n\n👤 Name: ${supportName}`;
    if (submitterEmail) text += `\n✉️ Email: ${submitterEmail}`;
    if (supportType) text += `\n📁 Category: ${supportType}`;
    if (supportMessage) text += `\n\n💬 Message:\n${supportMessage}`;

    if (!supportName && !supportMessage) {
      text = `Hello! I would like to chat about business/app support for The Limestone App.`;
    }

    const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "WhatsApp Not Found",
        `We couldn't open WhatsApp on your device. Please contact support directly at ${CONTACT_EMAIL} or try our Messenger chat!`,
        [{ text: "OK" }]
      );
    });
  };

  const handleMessengerSupport = () => {
    const url = `https://m.me/${SUPPORT_MESSENGER_USERNAME}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Messenger Not Found",
        `We couldn't open Facebook Messenger on your device. Please contact support via WhatsApp or email at ${CONTACT_EMAIL}.`,
        [{ text: "OK" }]
      );
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
      const result = await Share.share({
        message: 'Check out The Limestone App - the ultimate community directory, calendars, and local updates hub for Lawrence County, Indiana! Download it to stay in the loop!',
      });
      if (result.action === Share.sharedAction) {
        Alert.alert("Shared!", "Thank you for spreading the word to your neighbors!", [{ text: "Awesome!" }]);
      }
    } catch (error) {
      Alert.alert("Share Failed", error.message);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={globalStyles.headerContainer}>
        <Text style={globalStyles.logoText}>
          Citizen <Text style={globalStyles.logoAccent}>Hub</Text>
        </Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="close" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Profile Card ── */}
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
              <Ionicons name="ribbon" size={11} color={colors.accent} />
              <Text style={styles.tierText}>LOCAL SUPPORTER</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditName(profile.name);
              setEditProfilePicture(profile.profilePicture || 'forest');
              setShowEditProfileModal(true);
            }}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
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

        {/* ── My Neighborhood ── */}
        <Text style={styles.sectionHeader}>MY NEIGHBORHOOD</Text>
        <View style={styles.card}>
          {[
            { label: 'Bedford', icon: 'home' },
            { label: 'Mitchell', icon: 'business' },
            { label: 'Oolitic', icon: 'map' },
            { label: 'Springville', icon: 'leaf' },
            { label: 'All County', icon: 'earth' },
          ].map((hood, i, arr) => (
            <TouchableOpacity
              key={hood.label}
              style={[styles.menuItem, i === arr.length - 1 && styles.noBorder]}
              onPress={() => {
                updateProfile({ neighborhood: hood.label });
                showToast(`Neighborhood set to ${hood.label}!`, "success");
              }}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name={hood.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.menuText}>{hood.label}</Text>
              </View>
              {profile.neighborhood === hood.label ? (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Saved Spots ── */}
        <Text style={styles.sectionHeader}>SAVED SPOTS & BOOKMARKS</Text>
        <View style={styles.card}>
          {savedSpots.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bookmark-outline" size={24} color={colors.textLight} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16, lineHeight: 16 }}>
                No saved spots yet. Bookmark businesses in the Directory to see them listed here!
              </Text>
            </View>
          ) : (
            savedSpots.map((spotId, i, arr) => {
              const spot = DIRECTORY_DATA.find(b => b.id === spotId);
              if (!spot) return null;
              return (
                <TouchableOpacity
                  key={spotId}
                  style={[styles.menuItem, i === arr.length - 1 && styles.noBorder]}
                  onPress={() => {
                    Alert.alert(
                      spot.name,
                      `Category: ${spot.subCategory}\nAddress: ${spot.address}\n\nWould you like to open directions?`,
                      [
                        { text: "Directions", onPress: () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ', ' + spot.address)}`) },
                        { text: "Call", onPress: () => spot.phone !== 'N/A' && Linking.openURL(`tel:${spot.phone.replace(/[^0-9]/g, '')}`) },
                        { text: "Close", style: "cancel" }
                      ]
                    );
                  }}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: `${colors.accent}12` }]}>
                      <Ionicons name="bookmark" size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuText} numberOfLines={1}>{spot.name}</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>{spot.subCategory}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── RSVP'd Events ── */}
        <Text style={styles.sectionHeader}>MY COMMUNITY CALENDAR RSVPS</Text>
        <View style={styles.card}>
          {rsvpEvents.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar-outline" size={24} color={colors.textLight} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16, lineHeight: 16 }}>
                No active RSVPs. Click RSVP on events in the Community tab to save them to your calendar!
              </Text>
            </View>
          ) : (
            rsvpEvents.map((eventId, i, arr) => {
              const event = EVENTS_DATA.find(e => e.id === eventId);
              if (!event) return null;
              return (
                <TouchableOpacity
                  key={eventId}
                  style={[styles.menuItem, i === arr.length - 1 && styles.noBorder]}
                  onPress={() => {
                    Alert.alert(
                      event.title,
                      `Host: ${event.host}\nTime: ${event.time}\nDate: ${event.date}\nLocation: ${event.location}\n\n${event.desc}`,
                      [{ text: "Close", style: "cancel" }]
                    );
                  }}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}12` }]}>
                      <Ionicons name="people" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuText} numberOfLines={1}>{event.title}</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>{formatEventDate(event.date)}{event.time ? ' · ' + event.time : ''}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── App Preferences ── */}
        <Text style={styles.sectionHeader}>APP PREFERENCES</Text>
        <View style={styles.card}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(77,171,247,0.1)' }]}>
                <Ionicons name="notifications" size={18} color="#4DABF7" />
              </View>
              <Text style={styles.menuText}>Push Notifications</Text>
            </View>
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={(val) => {
                if (val) {
                  requestNotificationsPermission();
                } else {
                  updateProfile({ notificationsEnabled: false });
                  showToast("Community alerts muted.", "warning");
                }
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(100,116,139,0.1)' }]}>
                <Ionicons name="location" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.menuText}>Location Services</Text>
            </View>
            <Switch
              value={profile.locationEnabled}
              onValueChange={(val) => {
                if (val) {
                  requestLocationPermission();
                } else {
                  updateProfile({ locationEnabled: false });
                  showToast("Location services deactivated.", "warning");
                }
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.menuItem, styles.noBorder]}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(100,116,139,0.1)' }]}>
                <Ionicons name="moon" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.menuText}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={() => {
                toggleDarkMode();
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── Business & Civic ── */}
        <Text style={styles.sectionHeader}>MERCHANT & CIVIC OPTIONS</Text>
        <View style={styles.card}>
          {[
            {
              icon: 'briefcase',
              color: '#20C997',
              bg: 'rgba(20,201,151,0.1)',
              label: 'Register My Business',
              action: () => navigation.navigate('MainTabs', { screen: 'Directory', params: { showAddModal: true } })
            },
            {
              icon: 'megaphone',
              color: '#4DABF7',
              bg: 'rgba(77,171,247,0.1)',
              label: 'Submit Community Event',
              action: () => navigation.navigate('MainTabs', { screen: 'Community', params: { showAddModal: true } })
            },
            {
              icon: 'gift',
              color: '#968469', // Warm Sand / Bronze Clay
              bg: 'rgba(150,132,105,0.1)',
              label: 'Suggest Public Resource',
              action: () => navigation.navigate('MainTabs', { screen: 'Resources', params: { showAddModal: true } })
            },
            {
              icon: 'help-circle',
              color: '#FBBF24', // Pastel Peach Amber
              bg: 'rgba(251,191,36,0.1)',
              label: 'Help & Support Center',
              action: () => setShowSupportModal(true)
            },
            {
              icon: 'shield-checkmark',
              color: colors.accent,
              bg: 'rgba(150,132,105,0.1)', // Warm Sand / Bronze alpha bg
              label: 'Privacy & Data Policy',
              action: () => setShowPrivacyModal(true)
            },
            {
              icon: 'people',
              color: colors.primary,
              bg: `${colors.primary}1A`, // 10% opacity primary brand color bg
              label: 'About Us',
              action: () => setShowAboutModal(true)
            },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === arr.length - 1 && styles.noBorder]}
              onPress={item.action}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── About ── */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.card}>
          {[
            { icon: 'information-circle', color: colors.primary, bg: 'rgba(15,76,92,0.08)', label: 'App Version', right: 'v1.0.0' },
            { icon: 'star', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', label: 'Rate The Limestone', right: null },
            { icon: 'share-social', color: '#4DABF7', bg: 'rgba(77,171,247,0.1)', label: 'Share with a Neighbor', right: null },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === arr.length - 1 && styles.noBorder]}
              onPress={() => {
                if (item.label === 'App Version') return;
                if (item.label === 'Rate The Limestone') {
                  setShowAppRatingModal(true);
                } else if (item.label === 'Share with a Neighbor') {
                  handleShareApp();
                }
              }}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </View>
              {item.right ? (
                <Text style={styles.versionText}>{item.right}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Ionicons name="diamond" size={14} color={colors.accent} />
            <Text style={styles.footerAppName}>  The Limestone</Text>
          </View>
          <Text style={styles.footerSub}>Built for Lawrence County, Indiana</Text>
          <Text style={styles.footerCopy}>© 2026 Hoosier AI Automations LLC. · All Rights Reserved</Text>
          <Text style={styles.footerCopy}>App logo Made By: Rikku I. | All Rights Reserved</Text>
        </View>
      </ScrollView>

      {/* ── INTERACTIVE SUPPORT & HELP FORM MODAL ── */}
      <SafeModal
        visible={showSupportModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleResetForm}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              Support <Text style={{ color: colors.accent }}>& Help Center</Text>
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
                <Text style={styles.successTitle}>Request Submitted!</Text>
                <Text style={styles.successText}>
                  Your support request has been compiled and sent successfully to the Limestone App administrator! We will review your details and contact you via email shortly.
                </Text>
                <TouchableOpacity 
                  style={[styles.formSubmitBtn, { width: '100%', marginTop: SPACING.md }]} 
                  onPress={handleResetForm}
                >
                  <Text style={styles.formSubmitBtnText}>Back to Hub</Text>
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
                Need help with your business listing? Want to advertise or sponsor a spotlight card? Having trouble with an event submission? Pick your request type below and send details directly to our team!
              </Text>

              {/* Submitter Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Your Full Name <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Nate Limestone"
                  placeholderTextColor={colors.textLight}
                  value={supportName}
                  onChangeText={setSupportName}
                />
              </View>

              {/* Support Type Grid Chips */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Request Type <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 6 }}>
                  {[
                    { id: 'Customer Support', label: 'App Support', icon: 'phone-portrait-outline' },
                    { id: 'Business Support', label: 'Business Support', icon: 'briefcase-outline' },
                    { id: 'General Inquiry', label: 'General Inquiry', icon: 'help-circle-outline' }
                  ].map((type) => {
                    const isSelected = supportType === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.categoryChip,
                          { 
                            marginRight: 0, 
                            marginVertical: 2, 
                            borderWidth: 1.5,
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary : colors.cardSurface,
                          }
                        ]}
                        onPress={() => setSupportType(type.id)}
                      >
                        <Ionicons 
                          name={type.icon} 
                          size={14} 
                          color={isSelected ? colors.textOnDark : colors.textSecondary} 
                          style={{ marginRight: 6 }} 
                        />
                        <Text style={[
                          styles.categoryChipText,
                          { color: isSelected ? colors.textOnDark : colors.textPrimary },
                          { fontWeight: '800' }
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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

              {/* Message Details */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Message Details <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="Enter details of your request, directory correction, or sponsorship inquiry..."
                  placeholderTextColor={colors.textLight}
                  value={supportMessage}
                  onChangeText={setSupportMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Support Channels Divider */}
              <View style={styles.supportDividerRow}>
                <View style={styles.supportLine} />
                <Text style={styles.supportDividerText}>CHOOSE A SUPPORT CHANNEL</Text>
                <View style={styles.supportLine} />
              </View>

              {/* Chat on WhatsApp Button */}
              <TouchableOpacity 
                style={styles.whatsappBtn} 
                onPress={handleWhatsAppSupport}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.whatsappBtnText}>Chat on WhatsApp</Text>
                  <Text style={styles.btnSubtitleText}>Instant one-tap support chat</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>

              {/* Chat on Messenger Button */}
              <TouchableOpacity 
                style={styles.messengerBtn} 
                onPress={handleMessengerSupport}
              >
                <Ionicons name="chatbubbles" size={18} color="#fff" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.messengerBtnText}>Message on Messenger</Text>
                  <Text style={styles.btnSubtitleText}>Direct message page thread</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>

              {/* Submit Email Ticket Button */}
              <TouchableOpacity 
                style={[styles.emailBtn, isSubmitting && { backgroundColor: colors.textLight }]} 
                onPress={handleSendSupport}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.textOnDark} />
                ) : (
                  <>
                    <Ionicons name="mail" size={18} color={colors.textOnDark} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emailBtnText}>Submit Email Ticket</Text>
                      <Text style={[styles.btnSubtitleText, { color: 'rgba(255,255,255,0.7)' }]}>Receive a reply in your inbox</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
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
      </SafeModal>

      {/* ── INTERACTIVE EDIT PROFILE PICTURE & NAME MODAL ── */}
      <SafeModal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              Edit <Text style={{ color: colors.accent }}>Profile Details</Text>
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setShowEditProfileModal(false)}
            >
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalFormScroll} 
            contentContainerStyle={styles.modalFormContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.formIntro}>
              Customize your profile details to personalize your Limestone App dashboard. Your name and selected local avatar badge will reflect across all pages.
            </Text>

            {/* Submitter Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Your Full Name <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Nate Limestone"
                placeholderTextColor={colors.textLight}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            {/* Profile Picture Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>CHOOSE YOUR PROFILE TOKEN <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
              {(() => {
                const selectedIconDetails = getProfilePictureDetails(editProfilePicture);
                return (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 16,
                      padding: 12,
                      marginTop: 6,
                    }}
                    onPress={() => setShowIconModal(true)}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: getPresetCircleColor(editProfilePicture),
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      {selectedIconDetails.icon === 'seesaw' ? (
                        <SeeSawIcon color="#FFFFFF" size={24} />
                      ) : (
                        <Ionicons name={selectedIconDetails.icon} size={24} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary }}>{selectedIconDetails.label}</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginTop: 2 }}>{selectedIconDetails.sub}</Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.cardSurface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}>
                      <Ionicons name="pencil" size={12} color={colors.primary} />
                      <Text style={{ fontSize: 9, fontWeight: '900', color: colors.primary, marginLeft: 3 }}>Choose</Text>
                    </View>
                  </TouchableOpacity>
                );
              })()}
            </View>

            {/* Commemorative Presets Token Modal */}
            <SafeModal
              visible={showIconModal}
              animationType="slide"
              transparent={false}
              onRequestClose={() => setShowIconModal(false)}
            >
              <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
                {/* Modal Header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>Choose Your Profile Token</Text>
                  <TouchableOpacity 
                    style={{ padding: 4 }} 
                    onPress={() => setShowIconModal(false)}
                  >
                    <Ionicons name="close" size={26} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={{ flex: 1 }} 
                  contentContainerStyle={{ padding: 24 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600', lineHeight: 19, marginBottom: 16 }}>
                    Select a beautiful commemorative token badge celebrating Lawrence County and the Hoosier State:
                  </Text>

                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    justifyContent: 'space-between',
                  }}>
                    {[
                      'forest', 'quarry', 'bridge', 'carver', 'monon', 'transit', 'parks', 'space',
                      'education', 'agriculture', 'opera', 'citizen', 'aviation', 'camping', 'caverns',
                      'fishing', 'festival', 'cabin', 'trail', 'sunrise', 'athletics', 'arts', 'fairgrounds', 'wellness'
                    ].map((presetId) => {
                      const details = getProfilePictureDetails(presetId);
                      const isSelected = editProfilePicture === presetId;
                      return (
                        <TouchableOpacity
                          key={presetId}
                          style={{
                            width: '31%',
                            backgroundColor: colors.cardSurface,
                            borderWidth: 1,
                            borderColor: isSelected ? '#695d3d' : colors.border,
                            borderRadius: 14,
                            paddingVertical: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                            ...SHADOWS.light,
                          }}
                          onPress={() => {
                            setEditProfilePicture(presetId);
                            setShowIconModal(false);
                          }}
                        >
                          <View style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: getPresetCircleColor(presetId),
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 6,
                          }}>
                            {details.icon === 'seesaw' ? (
                              <SeeSawIcon color="#FFFFFF" size={22} />
                            ) : (
                              <Ionicons name={details.icon} size={22} color="#FFFFFF" />
                            )}
                          </View>
                          <Text 
                            style={{
                              fontSize: 10,
                              fontWeight: isSelected ? '900' : '850',
                              color: isSelected ? '#12433F' : colors.textPrimary,
                              width: '90%',
                              textAlign: 'center',
                            }} 
                            numberOfLines={1}
                          >
                            {details.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </SafeAreaView>
            </SafeModal>

            {/* Submit & Cancel Actions */}
            <TouchableOpacity 
              style={styles.formSubmitBtn} 
              onPress={() => {
                if (!editName.trim()) {
                  showToast("Please input a valid name.", "warning");
                  return;
                }
                updateProfile({ 
                  name: editName, 
                  profilePicture: editProfilePicture,
                });
                setShowEditProfileModal(false);
                showToast("Profile details updated successfully!", "success");
              }}
            >
              <Ionicons name="checkmark-sharp" size={16} color={colors.textOnDark} style={{ marginRight: 6 }} />
              <Text style={styles.formSubmitBtnText}>Save Profile Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.formCancelBtn} 
              onPress={() => setShowEditProfileModal(false)}
            >
              <Text style={styles.formCancelBtnText}>Discard Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </SafeModal>

      {/* ── LEGITIMATE PRIVACY & DATA POLICY MODAL ── */}
      <SafeModal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              Privacy <Text style={{ color: colors.accent }}>& Data Policy</Text>
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setShowPrivacyModal(false)}
            >
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalFormScroll} 
            contentContainerStyle={styles.modalFormContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
              <Ionicons name="shield-checkmark" size={60} color={colors.accent} style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>Your Privacy Matters</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Last Updated: May 2026</Text>
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 16 }}>
              Welcome to The Limestone App, curated and developed by Hoosier AI Automations LLC. We are committed to maintaining the trust and confidence of our neighbors in Lawrence County, Indiana. This Privacy Policy details how we handle permissions and data.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>1. NO DATA HARVESTING</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 14 }}>
              The Limestone is a community utility app. We do not require account registration to search directory categories, read community updates, view events, or use resources. We NEVER track, monetize, sell, or share your personal search history or device details.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>2. LOCATION SERVICES</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 14 }}>
              If location permissions are enabled, we use your device's coarse coordinates solely to filter and show closest local resources, municipal offices, parks, or shops. This location data is processed locally on your device and is NEVER saved or uploaded to external servers. You can deactivate location services at any time.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>3. PUSH NOTIFICATIONS</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 14 }}>
              If you consent to push notifications, we send local community notifications, severe weather warnings, or public school updates. These notifications are anonymous. You can mute or disable them at any time in App Preferences.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>4. ANONYMOUS APP RATINGS</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 14 }}>
              All reviews, ratings, or feedback forms submitted inside the app are strictly anonymous. We do not link your profile name, email, or badge presets to submissions. We use this feedback strictly to improve app features and performance.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>5. FORM SUBMISSIONS & SECURE TRANSMISSION</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 14 }}>
              All form submissions (support requests, event submissions, resource suggestions) are transmitted securely to the app administrator via Web3Forms. No personal data is stored on-device beyond your session preferences.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>6. CONTACT & COORDINATOR</Text>

            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 20 }}>
              If you have any questions about this policy or wish to report a directory listing correction, please contact us directly at nate@hoosieraiautomations.com.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </SafeModal>

      {/* ── ABOUT US MODAL ── */}
      <SafeModal
        visible={showAboutModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              About <Text style={{ color: colors.accent }}>The Limestone</Text>
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setShowAboutModal(false)}
            >
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalFormScroll} 
            contentContainerStyle={styles.modalFormContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
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
              style={styles.formSubmitBtn} 
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.formSubmitBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </SafeModal>

      {/* ── INTERACTIVE APP RATING MODAL ── */}
      <SafeModal
        visible={showAppRatingModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAppRatingModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              Rate <Text style={{ color: colors.accent }}>The Limestone</Text>
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setShowAppRatingModal(false)}
            >
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalFormScroll} 
            contentContainerStyle={styles.modalFormContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
              <Ionicons name="star-half-sharp" size={60} color="#FBBF24" style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' }}>How is your experience?</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 }}>
                Your anonymous review goes directly to Hoosier AI Automations LLC. to help us improve the app for Lawrence County!
              </Text>
            </View>

            {/* Star Rating Selector */}
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setAppStars(star)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons 
                      name={star <= appStars ? "star" : "star-outline"} 
                      size={36} 
                      color={star <= appStars ? "#FBBF24" : colors.border} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 12 }}>
                {appStars === 5 ? '⭐⭐⭐⭐⭐ (Excellent)' :
                 appStars === 4 ? '⭐⭐⭐⭐ (Very Good)' :
                 appStars === 3 ? '⭐⭐⭐ (Good)' :
                 appStars === 2 ? '⭐⭐ (Fair)' :
                 '⭐ (Needs Improvement)'}
              </Text>
            </View>

            {/* Comment details */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Anonymous Feedback / Suggestions</Text>
              <TextInput
                style={[styles.formInput, styles.formInputMultiline]}
                placeholder="Optional: What do you love? What features or businesses should we add next?"
                placeholderTextColor={colors.textLight}
                value={appComment}
                onChangeText={(text) => setAppComment(text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={styles.formSubmitBtn} 
              onPress={() => {
                submitAppRating(appStars, appComment);
                setAppComment('');
                setShowAppRatingModal(false);
              }}
            >
              <Ionicons name="send" size={14} color={colors.textOnDark} style={{ marginRight: 8 }} />
              <Text style={styles.formSubmitBtnText}>Submit Anonymous Rating</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.formCancelBtn} 
              onPress={() => setShowAppRatingModal(false)}
            >
              <Text style={styles.formCancelBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </SafeModal>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 48 },
  closeBtn: { padding: SPACING.xs },

  // Profile Card
  profileCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 20,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profileInfo: { flex: 1, marginLeft: SPACING.md },
  profileName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  profileSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,30,63,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  tierText: { fontSize: 9, fontWeight: '800', color: colors.accent, letterSpacing: 1 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,30,63,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  // Section Header
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.8,
    marginBottom: SPACING.xs,
    marginTop: 4,
    paddingLeft: 4,
  },

  // Card & Menu Items
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noBorder: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  activePill: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activePillText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  versionText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  // Footer
  footer: { alignItems: 'center', paddingVertical: SPACING.lg },
  footerLogo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  footerAppName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  footerSub: { fontSize: 11, color: colors.textSecondary },
  footerCopy: { fontSize: 10, color: colors.textLight, marginTop: 4 },

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
    backgroundColor: `${colors.primary}0D`, // ~5% opacity primary brand color
    borderColor: `${colors.primary}20`,     // ~12% opacity primary brand color
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

  // WhatsApp & Messenger Support Channels Styles
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: SPACING.md,
    ...SHADOWS.light,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  messengerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: SPACING.sm,
    ...SHADOWS.light,
  },
  messengerBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: SPACING.sm,
    ...SHADOWS.light,
  },
  emailBtnText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '800',
  },
  btnSubtitleText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  supportDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
    marginTop: SPACING.lg,
  },
  supportLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  supportDividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginHorizontal: SPACING.sm,
  },

  // Edit Profile Avatar Presets List Styles
  avatarListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  avatarOptionCard: {
    width: '48%',
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  avatarOptionImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  avatarOptionDesc: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  livePreviewContainer: {
    alignItems: 'center',
    marginVertical: 12,
    padding: 12,
    backgroundColor: 'rgba(30, 77, 43, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  livePreviewCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  livePreviewTextContainer: {
    flex: 1,
  },
  livePreviewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  livePreviewSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
