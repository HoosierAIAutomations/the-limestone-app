import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking, TextInput, Modal, ActivityIndicator, Share, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';
import { WEB3FORMS_ACCESS_KEY, CONTACT_EMAIL } from '../utils/config';
import COMMUNITY_EVENTS from '../utils/cachedEvents.json';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const getAgeFocusLabel = (range) => {
  const labels = {
    'family': 'Family Focus',
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
    'family': '#34D399',
    'adults': '#C5B499',
    '0-3': '#4DABF7',
    '4-7': '#20C997',
    '8-12': '#FBBF24',
    '13+': '#A0B2C6'
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
    '13+': 'school-outline'
  };
  return iconsMap[range] || 'sparkles-outline';
};

export default function CommunityScreen({ route, navigation }) {
  const {
    isDarkMode,
    colors,
    globalStyles,
    typography,
    profile,
    rsvpEvents,
    toggleRsvpEvent,
    showToast
  } = useAppContext();

  const { width } = useWindowDimensions();
  const isDesktop = width > 850;
  const styles = getStyles(colors, isDesktop);

  const initialDate = route?.params?.date ? parseLocalDate(route.params.date) : new Date(); // Defaults to current system date

  const [activeAgeFocus, setActiveAgeFocus] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate()); // day of month, defaults to today's day

  // Form States
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

  // Listen to params updates
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

  const handleMonthChange = (newMonth, newYear) => {
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(null);
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        handleMonthChange(11, currentYear - 1);
      } else {
        handleMonthChange(currentMonth - 1, currentYear);
      }
    } else {
      if (currentMonth === 11) {
        handleMonthChange(0, currentYear + 1);
      } else {
        handleMonthChange(currentMonth + 1, currentYear);
      }
    }
  };

  const handleSendEventEmail = async () => {
    if (!eventTitle || !eventHost || !eventDate || !submitterEmail) {
      Alert.alert("Required Fields", "Please fill in all required fields.");
      return;
    }

    const emailBody = `Hello,

I would like to submit the following community event for publication in The Limestone app calendar:

- Event Title: ${eventTitle}
- Host/Organizer: ${eventHost}
- Date: ${eventDate}
- Time: ${eventTime || 'N/A'}
- Location: ${eventLocation || 'N/A'}
- Description: ${eventDesc || 'No description.'}
- Contact Email: ${submitterEmail}`;

    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
      triggerMailtoFallback(emailBody);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Limestone App - Event Submission: ${eventTitle}`,
          email: submitterEmail,
          message: emailBody,
          eventTitle,
          eventHost
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
        showToast('Event submitted for publication!', 'success');
      } else {
        triggerMailtoFallback(emailBody);
      }
    } catch (err) {
      triggerMailtoFallback(emailBody);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerMailtoFallback = (emailBody) => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Limestone App - Event Submission: ${eventTitle}`)}&body=${encodeURIComponent(emailBody)}`;
    Linking.openURL(mailtoUrl)
      .then(() => setSubmitSuccess(true))
      .catch(() => {
        Alert.alert("Submission Failed", `Please email details directly to ${CONTACT_EMAIL}`);
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

  const handleOpenMap = (address) => {
    if (!address || address === 'N/A') return;
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  // Calendar math
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfWeek = getFirstDayOfMonth(currentMonth, currentYear);

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ key: `blank-${i}`, dayNum: null });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateString = `${currentYear}-${monthStr}-${dayStr}`;

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
        const hood = profile.neighborhood.toLowerCase();
        return event.location.toLowerCase().includes(hood) || event.title.toLowerCase().includes(hood);
      }
      return true;
    });

    calendarCells.push({ key: `day-${d}`, dayNum: d, dateString, hasEvents });
  }

  // Filter events
  const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
  const monthPrefix = `${currentYear}-${monthStr}`;

  let displayEvents = [];
  if (selectedDay) {
    const dayStr = selectedDay < 10 ? `0${selectedDay}` : `${selectedDay}`;
    const targetDateStr = `${monthPrefix}-${dayStr}`;
    displayEvents = COMMUNITY_EVENTS.filter(event => event.date === targetDateStr);
  } else {
    displayEvents = COMMUNITY_EVENTS.filter(event => event.date.startsWith(monthPrefix));
  }

  if (profile && profile.neighborhood && profile.neighborhood !== 'All County') {
    const hoodLower = profile.neighborhood.toLowerCase();
    displayEvents = displayEvents.filter(event =>
      event.location.toLowerCase().includes(hoodLower) || event.title.toLowerCase().includes(hoodLower)
    );
  }

  if (activeAgeFocus !== 'all') {
    if (activeAgeFocus === 'youth') {
      displayEvents = displayEvents.filter(event => ['0-3', '4-7', '8-12', '13+'].includes(event.ageRange));
    } else {
      displayEvents = displayEvents.filter(event => event.ageRange === activeAgeFocus);
    }
  }

  displayEvents.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
      {/* Community Header Control Panel */}
      <View style={styles.topControlHeader}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="calendar" size={24} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.mainTitle}>Community Board</Text>
        </View>

        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary + '15' }]} 
          onPress={() => setShowSubmitModal(true)}
        >
          <Ionicons name="add" size={16} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.addBtnText, { color: colors.primary }]}>Submit Event</Text>
        </TouchableOpacity>
      </View>

      {isDesktop ? (
        /* ────────────────────────────────────────────────────────
           DESKTOP CALENDAR + FEED SPLIT LAYOUT
           ──────────────────────────────────────────────────────── */
        <View style={styles.splitLayout}>
          
          {/* LEFT PANEL: INTERACTIVE MONTH CALENDAR (40% width) */}
          <View style={styles.leftCalendarPane}>
            <View style={styles.calendarCard}>
              <View style={styles.calNavHeader}>
                <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.calNavBtn}>
                  <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.calMonthLabel}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
                <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.calNavBtn}>
                  <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdayLabels}>
                {WEEKDAYS.map(day => (
                  <Text key={day} style={styles.weekdayLabelText}>{day}</Text>
                ))}
              </View>

              <View style={styles.cellsGrid}>
                {calendarCells.map((cell, i) => {
                  if (cell.dayNum === null) {
                    return <View key={`blank-${i}`} style={styles.cellEmpty} />;
                  }

                  const isSelected = selectedDay === cell.dayNum;
                  return (
                    <TouchableOpacity
                      key={cell.key}
                      style={[styles.cellDay, isSelected && styles.cellDayActive]}
                      onPress={() => setSelectedDay(isSelected ? null : cell.dayNum)}
                    >
                      <Text style={[styles.cellDayText, isSelected && styles.cellDayTextActive]}>
                        {cell.dayNum}
                      </Text>
                      {cell.hasEvents && (
                        <View style={[styles.eventDot, isSelected && { backgroundColor: '#FFFFFF' }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Focus filter cards */}
            <View style={styles.sidebarFilterCard}>
              <Text style={styles.filterCardLabel}>AUDIENCE FOCUS</Text>
              <View style={styles.focusPillGroup}>
                {[
                  { id: 'all', name: 'All Focuses', icon: 'sparkles-outline' },
                  { id: 'family', name: 'Family Friendly', icon: 'people-outline' },
                  { id: 'adults', name: '18+ Adults Only', icon: 'wine-outline' },
                  { id: 'youth', name: 'Youth / Children', icon: 'school-outline' }
                ].map((focus) => {
                  const isSelected = activeAgeFocus === focus.id;
                  return (
                    <TouchableOpacity
                      key={focus.id}
                      style={[styles.focusFilterPill, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setActiveAgeFocus(focus.id)}
                    >
                      <Ionicons name={focus.icon} size={12} color={isSelected ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.focusFilterText, isSelected && { color: '#FFFFFF', fontWeight: '800' }]}>
                        {focus.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* RIGHT PANEL: EVENTS LIST (60% width) */}
          <View style={styles.rightEventsPane}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsHeading}>
                {selectedDay ? `Activities for ${MONTH_NAMES[currentMonth]} ${selectedDay}` : `${MONTH_NAMES[currentMonth]} Calendar Feed`}
              </Text>
              {selectedDay && (
                <TouchableOpacity style={styles.clearFilterLink} onPress={() => setSelectedDay(null)}>
                  <Text style={styles.clearFilterLinkText}>Clear Day Filter</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 60 }}
            >
              {displayEvents.length > 0 ? (
                displayEvents.map((evt) => {
                  const isGoing = rsvpEvents.includes(evt.id);
                  const parsedEvtDate = parseLocalDate(evt.date);
                  const displayDateStr = parsedEvtDate ? `${MONTH_NAMES[parsedEvtDate.getMonth()]} ${parsedEvtDate.getDate()}` : evt.date;

                  return (
                    <View key={evt.id} style={styles.eventCardWeb}>
                      <View style={styles.evtCardTop}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.evtBadges}>
                            <View style={[styles.evtCatDot, { backgroundColor: evt.category === 'City Resources' ? colors.primary : colors.accent }]} />
                            <Text style={styles.evtCatName}>{evt.category}</Text>
                            {evt.ageRange && (
                              <View style={[styles.ageTag, { backgroundColor: getAgeBadgeColor(evt.ageRange) + '15' }]}>
                                <Ionicons name={getAgeRangeIcon(evt.ageRange)} size={9} color={isDarkMode ? '#FFFFFF' : '#1B3432'} style={{ marginRight: 3 }} />
                                <Text style={[styles.ageTagText, { color: isDarkMode ? '#FFFFFF' : '#1B3432' }]}>{getAgeFocusLabel(evt.ageRange)}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.evtTitle}>{evt.title}</Text>
                        </View>

                        {/* Calendar Icon Badge */}
                        <View style={styles.evtCalendarBadge}>
                          <View style={styles.calBadgeHeader}>
                            <Text style={styles.calBadgeMonth}>{displayDateStr.split(' ')[0].toUpperCase()}</Text>
                          </View>
                          <View style={styles.calBadgeBody}>
                            <Text style={styles.calBadgeDay}>{displayDateStr.split(' ')[1]}</Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.evtDesc}>{evt.desc}</Text>

                      <View style={styles.evtMetaRow}>
                        <View style={styles.metaCol}>
                          <Ionicons name="time-outline" size={13} color={colors.primary} />
                          <Text style={styles.metaColText}>{evt.time}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.metaCol}
                          onPress={() => handleOpenMap(evt.location)}
                        >
                          <Ionicons name="location-outline" size={13} color={colors.accent} />
                          <Text style={[styles.metaColText, { textDecorationLine: 'underline', color: colors.primary }]} numberOfLines={1}>
                            {evt.location}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.metaCol}>
                          <Ionicons name="business-outline" size={13} color={colors.textLight} />
                          <Text style={styles.metaColText} numberOfLines={1}>{evt.host}</Text>
                        </View>
                      </View>

                      {/* URL Ticket Action banner */}
                      {evt.url && (
                        <TouchableOpacity
                          style={styles.registrationCtaBanner}
                          onPress={() => Linking.openURL(evt.url)}
                        >
                          <Ionicons name="ticket-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.registrationCtaText}>Sign Up / Register Online Now</Text>
                        </TouchableOpacity>
                      )}

                      <View style={styles.evtCardFooter}>
                        <TouchableOpacity 
                          style={styles.shareBtn}
                          onPress={() => Share.share({ message: `Check out ${evt.title} on ${evt.date} at ${evt.time} at ${evt.location}!` })}
                        >
                          <Ionicons name="share-social-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.shareBtnText}>Share Event</Text>
                        </TouchableOpacity>

                        {evt.url ? (
                          <TouchableOpacity 
                            style={[styles.actionRsvpBtn, { backgroundColor: colors.accent }]}
                            onPress={() => Linking.openURL(evt.url)}
                          >
                            <Ionicons name="open-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.actionRsvpText}>Register</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity 
                            style={[styles.actionRsvpBtn, isGoing && { backgroundColor: colors.success + '20', borderWidth: 1, borderColor: colors.success }]}
                            onPress={() => {
                              toggleRsvpEvent(evt.id);
                              showToast(isGoing ? 'RSVP Cancelled' : 'Saved to hub calendar!', 'success');
                            }}
                          >
                            <Text style={[styles.actionRsvpText, isGoing && { color: colors.success }]}>
                              {isGoing ? 'Going ✓' : 'RSVP'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyFeedBox}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
                  <Text style={styles.emptyFeedTitle}>No Scheduled Activities</Text>
                  <Text style={styles.emptyFeedSub}>Try changing the focus or month to view different dates.</Text>
                </View>
              )}
            </ScrollView>
          </View>

        </View>
      ) : (
        /* ────────────────────────────────────────────────────────
           COLLAPSED MOBILE WEB VIEWPORT LAYOUT
           ──────────────────────────────────────────────────────── */
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        >
          {/* Collapsed Calendar view */}
          <View style={styles.calendarCard}>
            <View style={styles.calNavHeader}>
              <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.calNavBtn}>
                <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.calMonthLabel}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
              <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.calNavBtn}>
                <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayLabels}>
              {['S','M','T','W','T','F','S'].map((w, idx) => (
                <Text key={idx} style={styles.weekdayLabelText}>{w}</Text>
              ))}
            </View>

            <View style={styles.cellsGrid}>
              {calendarCells.map((cell, i) => {
                if (cell.dayNum === null) {
                  return <View key={`blank-${i}`} style={styles.cellEmpty} />;
                }
                const isSelected = selectedDay === cell.dayNum;
                return (
                  <TouchableOpacity
                    key={cell.key}
                    style={[styles.cellDay, isSelected && styles.cellDayActive]}
                    onPress={() => setSelectedDay(isSelected ? null : cell.dayNum)}
                  >
                    <Text style={[styles.cellDayText, isSelected && styles.cellDayTextActive]}>{cell.dayNum}</Text>
                    {cell.hasEvents && <View style={[styles.eventDot, isSelected && { backgroundColor: '#FFFFFF' }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Age Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
            {['all', 'family', 'adults', 'youth'].map(focus => (
              <TouchableOpacity
                key={focus}
                style={[styles.focusFilterPill, activeAgeFocus === focus && { backgroundColor: colors.primary }]}
                onPress={() => setActiveAgeFocus(focus)}
              >
                <Text style={[styles.focusFilterText, activeAgeFocus === focus && { color: '#FFFFFF' }]}>
                  {focus === 'all' ? 'All' : focus === 'youth' ? 'Youth' : focus.charAt(0).toUpperCase() + focus.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Collapsed Feed */}
          {displayEvents.map(evt => {
            const isGoing = rsvpEvents.includes(evt.id);
            return (
              <View key={evt.id} style={styles.eventCardWeb}>
                <Text style={styles.evtTitle}>{evt.title}</Text>
                <Text style={styles.evtDesc} numberOfLines={2}>{evt.desc}</Text>
                <TouchableOpacity onPress={() => handleOpenMap(evt.location)}>
                  <Text style={{ fontSize: 11, color: colors.primary, marginTop: 4, textDecorationLine: 'underline' }}>
                    📍 {evt.location} · ⏰ {evt.time} (Directions)
                  </Text>
                </TouchableOpacity>
                <View style={[styles.evtCardFooter, { marginTop: 12 }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>{evt.host}</Text>
                  <TouchableOpacity 
                    style={[styles.actionRsvpBtn, isGoing && { backgroundColor: colors.success + '15' }]}
                    onPress={() => toggleRsvpEvent(evt.id)}
                  >
                    <Text style={[styles.actionRsvpText, isGoing && { color: colors.success }]}>
                      {isGoing ? 'Going' : 'RSVP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── SUBMIT MODAL ── */}
      <Modal
        visible={showSubmitModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleResetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Local Event</Text>
              <TouchableOpacity onPress={handleResetForm}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {submitSuccess ? (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ marginBottom: 12 }} />
                <Text style={styles.successTitle}>Event Submitted!</Text>
                <Text style={styles.successSub}>Thank you. The Lawrence County calendar coordinator will verify and publish this event soon.</Text>
                <TouchableOpacity style={styles.closeSuccessBtn} onPress={handleResetForm}>
                  <Text style={styles.closeSuccessBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Event Title *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. Lawrence County Fair Concert"
                    placeholderTextColor={colors.textLight}
                    value={eventTitle}
                    onChangeText={setEventTitle}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Organizer / Host *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. Bedford Parks & Recreation"
                    placeholderTextColor={colors.textLight}
                    value={eventHost}
                    onChangeText={setEventHost}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. 2026-05-25"
                    placeholderTextColor={colors.textLight}
                    value={eventDate}
                    onChangeText={setEventDate}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Time *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. 6:00 PM - 8:30 PM"
                    placeholderTextColor={colors.textLight}
                    value={eventTime}
                    onChangeText={setEventTime}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Location Address</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. Otis Park Bandshell, Bedford, IN"
                    placeholderTextColor={colors.textLight}
                    value={eventLocation}
                    onChangeText={setEventLocation}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput 
                    style={[styles.modalInput, { height: 60 }]} 
                    placeholder="Provide details about registration, tickets, and description..."
                    placeholderTextColor={colors.textLight}
                    value={eventDesc}
                    onChangeText={setEventDesc}
                    multiline
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Your Email *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. organize@bedfordparks.com"
                    placeholderTextColor={colors.textLight}
                    value={submitterEmail}
                    onChangeText={setSubmitterEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitFormBtn, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleSendEventEmail}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitFormBtnText}>Submit Event</Text>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  leftCalendarPane: {
    width: '40%',
    maxWidth: 420,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.cardSurface,
    padding: 20,
  },
  calendarCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  calNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calMonthLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  weekdayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    width: 36,
    textAlign: 'center',
  },
  cellsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  cellEmpty: {
    width: 36,
    height: 36,
    marginVertical: 2,
  },
  cellDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  cellDayActive: {
    backgroundColor: colors.primary,
  },
  cellDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cellDayTextActive: {
    color: '#FFFFFF',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  sidebarFilterCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 20,
  },
  filterCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  focusPillGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  focusFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focusFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rightEventsPane: {
    flex: 1,
    padding: 24,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsHeading: {
    fontSize: 18,
    fontWeight: '900',
  },
  clearFilterLink: {
    paddingVertical: 4,
  },
  clearFilterLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  eventCardWeb: {
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  evtCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  evtBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  evtCatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  evtCatName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ageTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  evtTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: colors.textPrimary,
  },
  evtCalendarBadge: {
    width: 44,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  calBadgeHeader: {
    backgroundColor: '#E03131',
    width: '100%',
    paddingVertical: 2,
    alignItems: 'center',
  },
  calBadgeMonth: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calBadgeBody: {
    backgroundColor: colors.cardSurface,
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calBadgeDay: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  evtDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: 12,
  },
  evtMetaRow: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaColText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 4,
    maxWidth: 120,
  },
  registrationCtaBanner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  registrationCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  evtCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionRsvpBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  actionRsvpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyFeedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyFeedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyFeedSub: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
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
    maxWidth: 500,
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
