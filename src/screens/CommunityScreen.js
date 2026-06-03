import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Alert, Linking, TextInput, Modal, ActivityIndicator, Image, Share } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';
import { WEB3FORMS_ACCESS_KEY, CONTACT_EMAIL } from '../utils/config';

import COMMUNITY_EVENTS from '../utils/cachedEvents.json';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Timezone-safe local date parser
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const getAgeFocusLabel = (range) => {
  const labels = {
    'family': 'Family',
    'adults': '18+ Only',
    '0-3': 'Toddlers (0-3)',
    '4-7': 'Kids (4-7)',
    '8-12': 'Kids (8-12)',
    '13+': 'Teens (13+)'
  };
  return labels[range] || 'General';
};

const getAgeBadgeColor = (range) => {
  const colorMap = {
    'family': '#34D399', // Mint emerald
    'adults': '#C5B499', // Muted Warm Sand / Bronze Clay
    '0-3': '#4DABF7', // Blue
    '4-7': '#20C997', // Teal
    '8-12': '#FBBF24', // Pastel Peach Amber
    '13+': '#A0B2C6' // Slate Blue
  };
  return colorMap[range] || '#34D399';
};

const getAgeRangeIcon = (range) => {
  const iconsMap = {
    'family': 'people-outline',
    'adults': 'wine-outline',
    '0-3': 'happy-outline',
    '4-7': 'happy-outline',
    '8-12': 'happy-outline',
    '13+': 'school-outline',
    'youth': 'school-outline'
  };
  return iconsMap[range] || 'sparkles-outline';
};

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

export default function CommunityScreen({ route, navigation }) {
  const {
    isDarkMode,
    colors,
    globalStyles,
    typography,
    profile,
    updateProfile,
    getProfilePictureDetails,
    rsvpEvents,
    toggleRsvpEvent
  } = useAppContext();

  const styles = getStyles(colors);
  const avatar = getProfilePictureDetails();
  // Check if a specific date was passed via params (e.g. from HomeScreen spotlight)
  const initialDate = route?.params?.date ? parseLocalDate(route.params.date) : new Date(); // Defaults to current system date

  const [activeAgeFocus, setActiveAgeFocus] = useState('all');

  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear()); // e.g. 2026
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate()); // day of month, defaults to current system day

  // Event Submission Form States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventHost, setEventHost] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Navigation reactivity listener: Update calendar view instantly when route params change
  useEffect(() => {
    if (route?.params?.date) {
      const parsed = parseLocalDate(route.params.date);
      if (parsed) {
        setCurrentMonth(parsed.getMonth());
        setCurrentYear(parsed.getFullYear());
        setSelectedDay(parsed.getDate());
      }
    }
  }, [route?.params?.date]);

  // Reset filter when navigating to a new month/year
  const handleMonthChange = (newMonth, newYear) => {
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(null); // Clear active day selection
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        handleMonthChange(11, currentYear - 1);
      } else {
        handleMonthChange(currentMonth - 1, currentYear);
      }
    } else if (direction === 'next') {
      if (currentMonth === 11) {
        handleMonthChange(0, currentYear + 1);
      } else {
        handleMonthChange(currentMonth + 1, currentYear);
      }
    }
  };

  const navigateYear = (direction) => {
    if (direction === 'prev') {
      handleMonthChange(currentMonth, currentYear - 1);
    } else if (direction === 'next') {
      handleMonthChange(currentMonth, currentYear + 1);
    }
  };

  const toggleRsvp = (eventId) => {
    toggleRsvpEvent(eventId);
  };

  const handleDirections = (name, address) => {
    if (!address || address === 'N/A') return;
    const query = encodeURIComponent(`${name}, ${address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleSubmitEvent = () => {
    setShowSubmitModal(true);
  };

  const handleSendEventEmail = async () => {
    if (!eventTitle || !eventHost || !eventDate || !submitterEmail) {
      Alert.alert("Required Fields", "Please fill out all required fields: Event Title, Host / Organizer, Date, and your Contact Email.");
      return;
    }

    const emailBody = `Hello,

I would like to submit the following community event for publication in The Limestone app calendar:

- Event Title: ${eventTitle}
- Host/Organizer: ${eventHost}
- Date: ${eventDate}
- Time: ${eventTime || 'N/A'}
- Location: ${eventLocation || 'N/A'}
- Description: ${eventDesc || 'No description provided.'}
- Contact Email: ${submitterEmail}

Thank you!`;

    // 1. Check if the key is still the default placeholder
    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
      triggerMailtoFallback(emailBody);
      return;
    }

    // 2. Submit to Web3Forms API
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
          subject: `Limestone App - Event Submission: ${eventTitle}`,
          from_name: 'The Limestone App Users',
          name: eventHost,
          email: submitterEmail,
          message: emailBody,
          eventTitle,
          eventHost,
          eventDate,
          eventTime,
          eventLocation,
          eventDesc
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
      } else {
        console.warn('Web3Forms returned an error, falling back to mail client:', data);
        triggerMailtoFallback(emailBody);
      }
    } catch (err) {
      console.warn('Web3Forms submit error, falling back to mail client:', err);
      triggerMailtoFallback(emailBody);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerMailtoFallback = (emailBody) => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Limestone App - Event Submission: ${eventTitle}`)}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(mailtoUrl)
      .then(() => {
        setSubmitSuccess(true);
      })
      .catch(err => {
        Alert.alert(
          "Mail App Failed",
          `We couldn't submit via Web3Forms or open your email app. Please email your details to ${CONTACT_EMAIL}.\n\nThank you!`,
          [{ text: "OK" }]
        );
      });
  };

  const handleResetForm = () => {
    setEventTitle('');
    setEventHost('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventDesc('');
    setSubmitterEmail('');
    setSubmitSuccess(false);
    setShowSubmitModal(false);
  };

  // Calendar math helpers
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfWeek = getFirstDayOfMonth(currentMonth, currentYear);

  // Generate calendar grid array
  const calendarCells = [];
  
  // Padding cells before 1st of month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ key: `blank-${i}`, dayNum: null });
  }

  // Active days mapping
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateString = `${currentYear}-${monthStr}-${dayStr}`;
    
    // Mapped indicators: Check if this day contains any community events in the active neighborhood & age focus
    const hasEvents = COMMUNITY_EVENTS.some(event => {
      if (event.date !== dateString) return false;
      if (activeAgeFocus !== 'all') {
        if (activeAgeFocus === 'youth') {
          if (!['0-3', '4-7', '8-12', '13+'].includes(event.ageRange)) return false;
        } else {
          if (event.ageRange !== activeAgeFocus) return false;
        }
      }
      if (profile && profile.neighborhood && profile.neighborhood !== 'All County') {
        const hoodLower = profile.neighborhood.toLowerCase();
        return (
          event.location.toLowerCase().includes(hoodLower) ||
          event.title.toLowerCase().includes(hoodLower) ||
          (event.desc && event.desc.toLowerCase().includes(hoodLower))
        );
      }
      return true;
    });

    calendarCells.push({
      key: `day-${d}`,
      dayNum: d,
      dateString,
      hasEvents,
    });
  }

  // Filter events database
  const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
  const monthPrefix = `${currentYear}-${monthStr}`;

  let displayEvents = [];
  let isFiltered = false;

  if (selectedDay) {
    const dayStr = selectedDay < 10 ? `0${selectedDay}` : `${selectedDay}`;
    const targetDateStr = `${monthPrefix}-${dayStr}`;
    displayEvents = COMMUNITY_EVENTS.filter(event => event.date === targetDateStr);
    isFiltered = true;
  } else {
    // Show all events in the active month
    displayEvents = COMMUNITY_EVENTS.filter(event => event.date.startsWith(monthPrefix));
  }

  // Filter dynamically based on user's active neighborhood selected in Hub
  if (profile && profile.neighborhood && profile.neighborhood !== 'All County') {
    const hoodLower = profile.neighborhood.toLowerCase();
    displayEvents = displayEvents.filter(event => 
      event.location.toLowerCase().includes(hoodLower) ||
      event.title.toLowerCase().includes(hoodLower) ||
      (event.desc && event.desc.toLowerCase().includes(hoodLower))
    );
  }

  // Filter dynamically by Age Focus / Audience
  if (activeAgeFocus !== 'all') {
    if (activeAgeFocus === 'youth') {
      displayEvents = displayEvents.filter(event => 
        ['0-3', '4-7', '8-12', '13+'].includes(event.ageRange)
      );
    } else {
      displayEvents = displayEvents.filter(event => event.ageRange === activeAgeFocus);
    }
  }

  // Sort events chronologically by date
  displayEvents.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      {/* Community Header */}
      <View style={globalStyles.headerContainer}>
        <Text style={globalStyles.logoText}>Community <Text style={globalStyles.logoAccent}>Events</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.addEventBtn, { marginRight: SPACING.sm }]}
            onPress={handleSubmitEvent}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.addEventText}>Submit</Text>
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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Full-Month Calendar Widget */}
        <View style={styles.calendarWidget}>
          {/* Calendar Header with Year & Month skips */}
          <View style={styles.calendarHeader}>
            <View style={styles.navGroup}>
              <TouchableOpacity onPress={() => navigateYear('prev')} style={styles.navIconBtn}>
                <Ionicons name="play-back-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateMonth('prev')} style={[styles.navIconBtn, { marginLeft: 8 }]}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.monthName}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>

            <View style={styles.navGroup}>
              <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navIconBtn}>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateYear('next')} style={[styles.navIconBtn, { marginLeft: 8 }]}>
                <Ionicons name="play-forward-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Initials Row */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day, idx) => (
              <Text key={`weekday-${idx}`} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Cells Grid */}
          <View style={styles.cellsGrid}>
            {calendarCells.map((cell) => {
              if (cell.dayNum === null) {
                return <View key={cell.key} style={styles.cellEmpty} />;
              }

              const isSelected = selectedDay === cell.dayNum;
              return (
                <TouchableOpacity
                  key={cell.key}
                  style={[
                    styles.cellDay,
                    isSelected && styles.cellDayActive
                  ]}
                  onPress={() => {
                    // Toggle selection: click selected day again to clear
                    if (isSelected) {
                      setSelectedDay(null);
                    } else {
                      setSelectedDay(cell.dayNum);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.cellDayText,
                    isSelected && styles.cellDayTextActive
                  ]}>
                    {cell.dayNum}
                  </Text>
                  
                  {/* Event dot indicator */}
                  {cell.hasEvents ? (
                    <View style={[
                      styles.cellDot,
                      isSelected ? styles.cellDotActive : styles.cellDotInactive
                    ]} />
                  ) : (
                    <View style={[styles.cellDot, { backgroundColor: 'transparent' }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Horizontal Age / Focus Filters Scroll */}
        <View style={styles.focusFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.focusFilterScrollContent}
          >
            {[
              { id: 'all', name: 'All Focuses', icon: 'sparkles-outline' },
              { id: 'family', name: 'Family Friendly', icon: 'people-outline' },
              { id: 'adults', name: 'Adults Only', icon: 'wine-outline' },
              { id: 'youth', name: 'Youth & Kids', icon: 'school-outline' }
            ].map((focus) => {
              const isSelected = activeAgeFocus === focus.id;
              return (
                <TouchableOpacity
                  key={focus.id}
                  style={[
                    styles.focusFilterPill,
                    isSelected && [styles.focusFilterPillActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                  ]}
                  onPress={() => setActiveAgeFocus(focus.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name={focus.icon} 
                      size={12} 
                      color={isSelected ? '#ffffff' : colors.textSecondary} 
                      style={{ marginRight: 4 }} 
                    />
                    <Text style={[
                      styles.focusFilterText,
                      isSelected && styles.focusFilterTextActive
                    ]}>
                      {focus.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Dynamic Headings & Filter Stats */}
        <View style={styles.sectionHeaderRow}>
          <Text style={typography.headerMedium} numberOfLines={1}>
            {isFiltered 
              ? `Events on ${MONTH_NAMES[currentMonth]} ${selectedDay}`
              : `${MONTH_NAMES[currentMonth]} ${currentYear} Events`}
          </Text>
          <Text style={styles.dateLabel}>
            {isFiltered ? "Filtered Day" : `${displayEvents.length} active`}
          </Text>
        </View>

        {/* Filter Clear Banner */}
        {isFiltered ? (
          <View style={styles.filterBanner}>
            <Text style={styles.filterText} numberOfLines={1}>
              Showing details for {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}.
            </Text>
            <TouchableOpacity 
              style={styles.clearFilterBtn}
              onPress={() => setSelectedDay(null)}
            >
              <Text style={styles.clearFilterText}>Show All Month</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Events list */}
        {displayEvents.length > 0 ? (
          displayEvents.map((event) => {
            const hasRsvped = rsvpEvents.includes(event.id);
            
            // Format nice display date for multi-event views
            const eventDateObj = new Date(event.date);
            const dateDisplayStr = `${MONTH_NAMES[eventDateObj.getMonth()]} ${eventDateObj.getDate() + 1}`;

            return (
              <View key={event.id} style={globalStyles.card}>
                <View style={styles.eventCardHeader}>
                  <View style={styles.categoryRow}>
                    <View style={[
                      styles.categoryColorDot, 
                      { backgroundColor: event.category === 'City Resources' ? colors.primary : colors.accent }
                    ]} />
                    <Text style={styles.categoryText}>{event.category}</Text>
                    {event.ageRange ? (
                      <View style={[styles.ageBadge, { backgroundColor: `${getAgeBadgeColor(event.ageRange)}18`, flexDirection: 'row', alignItems: 'center' }]}>
                        <Ionicons 
                          name={getAgeRangeIcon(event.ageRange)} 
                          size={10} 
                          color={isDarkMode ? '#FFFFFF' : '#1B3432'} 
                          style={{ marginRight: 3 }} 
                        />
                        <Text style={[styles.ageBadgeText, { color: isDarkMode ? '#FFFFFF' : '#1B3432' }]}>
                          {getAgeFocusLabel(event.ageRange)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.timeBadge}>
                    <Ionicons name="calendar-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.timeText, { marginRight: 8 }]}>{dateDisplayStr}</Text>
                    <Ionicons name="time-outline" size={12} color={colors.primary} />
                    <Text style={styles.timeText}>{event.time}</Text>
                  </View>
                </View>

                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDesc}>{event.desc}</Text>

                <TouchableOpacity 
                  style={[styles.locationContainer, { paddingVertical: 4 }]} 
                  onPress={() => handleDirections(event.title, event.location)}
                >
                  <Ionicons name="location-sharp" size={14} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.locationText, { textDecorationLine: 'underline', color: colors.primary }]}>
                    {event.location} (Directions)
                  </Text>
                </TouchableOpacity>

                {/* Prominent Sign Up / Register Banner for events with a URL */}
                {event.url ? (
                  <TouchableOpacity
                    style={styles.eventSignUpBanner}
                    onPress={() => Linking.openURL(event.url).catch(() => Alert.alert('Error', 'Could not open registration link.'))}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="globe-outline" size={15} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.eventSignUpBannerText}>Sign Up / Register Online →</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.eventFooter}>
                  <View style={styles.attendeesContainer}>
                    <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.attendeesText} numberOfLines={1}>
                      {event.host}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TouchableOpacity 
                      style={styles.shareCompactBtn}
                      onPress={() => {
                        Share.share({
                          message: `Join me at "${event.title}" hosted by ${event.host}! Date: ${event.date} at ${event.time}. Location: ${event.location}. Shared via The Limestone App.`,
                        }).catch(err => console.warn(err));
                      }}
                    >
                      <Ionicons name="share-social-outline" size={15} color={colors.primary} />
                    </TouchableOpacity>
                    {event.url ? (
                      <TouchableOpacity 
                        style={[styles.rsvpButton, { backgroundColor: colors.accent, borderColor: colors.accent, flexDirection: 'row', alignItems: 'center', minWidth: 80 }]}
                        onPress={() => Linking.openURL(event.url).catch(() => Alert.alert('Error', 'Could not open link.'))}
                      >
                        <Ionicons name="open-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={[styles.rsvpBtnText, { color: '#fff', fontWeight: '800' }]}>
                          Details
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[
                          styles.rsvpButton,
                          hasRsvped ? styles.rsvpButtonActive : styles.rsvpButtonInactive
                        ]}
                        onPress={() => toggleRsvp(event.id)}
                      >
                        <Text style={[
                          styles.rsvpBtnText,
                          hasRsvped ? { color: colors.success } : { color: colors.textOnDark }
                        ]}>
                          {hasRsvped ? 'Going ✓' : 'RSVP'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.noEventsAlert}>
            <Ionicons name="information-circle-outline" size={24} color={colors.textLight} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noEventsTitle}>No events scheduled</Text>
              <Text style={styles.noEventsText}>
                {isFiltered 
                  ? `There are no community events currently listed for ${MONTH_NAMES[currentMonth]} ${selectedDay}. Tap Show All Month above to see other events.`
                  : `There are no community events listed in the Limestone database for ${MONTH_NAMES[currentMonth]} ${currentYear} yet.`}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── INTERACTIVE EVENT SUBMISSION FORM MODAL ── */}
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
              Submit <Text style={{ color: colors.accent }}>Local Event</Text>
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
                <Text style={styles.successTitle}>Event Submitted!</Text>
                <Text style={styles.successText}>
                  Thank you for submitting your event! It has been successfully compiled and sent to the Lawrence County community coordinator for publication in The Limestone app calendar.
                </Text>
                <TouchableOpacity 
                  style={[styles.formSubmitBtn, { width: '100%', marginTop: SPACING.md }]} 
                  onPress={handleResetForm}
                >
                  <Text style={styles.formSubmitBtnText}>Back to Calendar</Text>
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
                Share local school events, civic fundraisers, church dinners, and festivals across Lawrence County. Complete the details below to submit them directly to our review team!
              </Text>

              {/* Event Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Event Title <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Persimmon Festival Concert"
                  placeholderTextColor={colors.textLight}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                />
              </View>

              {/* Host / Organizer */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Host / Organizer <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mitchell Persimmon Committee"
                  placeholderTextColor={colors.textLight}
                  value={eventHost}
                  onChangeText={setEventHost}
                />
              </View>

              {/* Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. September 26, 2026"
                  placeholderTextColor={colors.textLight}
                  value={eventDate}
                  onChangeText={setEventDate}
                />
              </View>

              {/* Time */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 7:00 PM - 9:00 PM"
                  placeholderTextColor={colors.textLight}
                  value={eventTime}
                  onChangeText={setEventTime}
                />
              </View>

              {/* Location */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Physical Location</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mitchell Main Street Stages"
                  placeholderTextColor={colors.textLight}
                  value={eventLocation}
                  onChangeText={setEventLocation}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Brief Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="Describe what citizens can expect, admission costs (if any), and schedules..."
                  placeholderTextColor={colors.textLight}
                  value={eventDesc}
                  onChangeText={setEventDesc}
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
                  placeholder="e.g. yourname@example.com"
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
                onPress={handleSendEventEmail}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.textOnDark} />
                ) : (
                  <>
                    <Ionicons name="mail-sharp" size={16} color={colors.textOnDark} style={{ marginRight: 6 }} />
                    <Text style={styles.formSubmitBtnText}>Submit Event</Text>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184, 90, 56, 0.08)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 16,
  },
  addEventText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginLeft: 4,
  },
  calendarWidget: {
    backgroundColor: colors.cardSurface,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
  },
  cellsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellEmpty: {
    width: '14.28%',
    height: 42,
  },
  cellDay: {
    width: '14.28%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    position: 'relative',
    marginVertical: 1,
  },
  cellDayActive: {
    backgroundColor: colors.accent,
    ...SHADOWS.accent,
  },
  cellDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cellDayTextActive: {
    color: colors.textOnDark,
  },
  cellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    position: 'absolute',
    bottom: 4,
  },
  cellDotActive: {
    backgroundColor: colors.textOnDark,
  },
  cellDotInactive: {
    backgroundColor: colors.primary,
  },
  focusFilterContainer: {
    marginVertical: SPACING.sm,
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  focusFilterScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  focusFilterPill: {
    backgroundColor: 'rgba(100, 116, 139, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focusFilterPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  focusFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  focusFilterTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  ageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  ageBadgeText: {
    fontSize: 8,
    fontWeight: '850',
    color: '#ffffff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  filterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 77, 43, 0.05)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  clearFilterBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textOnDark,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: SPACING.sm,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  locationText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  eventSignUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  eventSignUpBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: SPACING.sm,
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  attendeesText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  rsvpButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCompactBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  rsvpButtonInactive: {
    backgroundColor: colors.primary,
  },
  rsvpButtonActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  rsvpBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
  noEventsAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  noEventsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  noEventsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
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
});

