import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Modal, ActivityIndicator, Platform, Image, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';
import COMMUNITY_EVENTS from '../utils/cachedEvents.json';
import DIRECTORY_DATA from '../utils/cachedDirectory.json';

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

export default function HomeScreen({ navigation }) {
  const {
    isDarkMode,
    colors,
    globalStyles,
    typography,
    profile,
    showToast
  } = useAppContext();

  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const styles = getStyles(colors, isDesktop);

  // Core State
  const [selectedLocation, setSelectedLocation] = useState('Bedford');
  const [selectedOutlookIndex, setSelectedOutlookIndex] = useState(null);
  
  // Live Sync States
  const [isSyncingWeather, setIsSyncingWeather] = useState(false);
  const [isSyncingAlerts, setIsSyncingAlerts] = useState(false);
  const [weatherSyncTime, setWeatherSyncTime] = useState('Just Now');
  const [alertsSyncTime, setAlertsSyncTime] = useState('Just Now');

  // Weather, Alert, and News states
  const [weatherData, setWeatherData] = useState({});
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [activeWeatherAlerts, setActiveWeatherAlerts] = useState([]);
  const [weatherAlertsLoading, setWeatherAlertsLoading] = useState(true);
  const [roadworkDelays, setRoadworkDelays] = useState([]);
  const [schoolStatuses, setSchoolStatuses] = useState([]);
  const [activeHomeTab, setActiveHomeTab] = useState('weather'); // 'weather' or 'alerts'

  // Mobile-only Alert Center modal state
  const [showMobileAlertCenter, setShowMobileAlertCenter] = useState(false);
  const [mobileAlertTab, setMobileAlertTab] = useState('weather');

  // Seasonal school operational defaults helper
  const getSchoolDefaultStatuses = () => {
    const now = new Date();
    const month = now.getMonth();
    if (month >= 5 && month <= 7) {
      return [
        { id: 'nlcs', name: 'North Lawrence Schools (NLCS)', status: 'Summer Break', detail: 'Campuses closed for summer recess. Administrative offices open Mon-Thu 8:00 AM - 4:00 PM.', type: 'closed' },
        { id: 'mitchell', name: 'Mitchell Community Schools', status: 'Summer Break', detail: 'Campuses closed for summer recess. Administrative offices open Mon-Thu 8:00 AM - 3:00 PM.', type: 'closed' },
        { id: 'stonegate', name: 'StoneGate Arts & Education', status: 'On Time', detail: 'Summer semester classes and workshops running as scheduled.', type: 'normal' },
        { id: 'preschool', name: 'Bedford City Preschool', status: 'Closed', detail: 'Closed for summer break. Enrollment open online.', type: 'closed' }
      ];
    }
    return [
      { id: 'nlcs', name: 'North Lawrence Schools (NLCS)', status: 'On Time', detail: 'All campuses operating on normal, standard schedules.', type: 'normal' },
      { id: 'mitchell', name: 'Mitchell Community Schools', status: 'On Time', detail: 'All campuses operating on normal, standard schedules.', type: 'normal' },
      { id: 'stonegate', name: 'StoneGate Arts & Education', status: 'On Time', detail: 'Normal operating hours. All academic classes running as scheduled.', type: 'normal' },
      { id: 'preschool', name: 'Bedford City Preschool', status: 'On Time', detail: 'Morning and afternoon preschool classes operating normally.', type: 'normal' }
    ];
  };

  const getEventDateDetails = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, monthIndex, day, 12, 0, 0);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        return {
          month: months[monthIndex] || 'EVT',
          day: String(day),
          dayOfWeek: days[d.getDay()] || 'DAY'
        };
      }
    } catch (e) {}
    return { month: 'EVT', day: '00', dayOfWeek: 'DAY' };
  };

  const getFeaturedEvent = () => {
    try {
      const today = new Date();
      const futureEvents = (COMMUNITY_EVENTS || []).filter(e => {
        const eventDate = new Date(e.date + 'T00:00:00');
        return eventDate.getTime() >= today.setHours(0,0,0,0);
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (futureEvents.length > 0) return futureEvents[0];
    } catch (e) {}
    return null;
  };

  const featuredEvent = getFeaturedEvent();

  const getRelativeTime = (pubDateStr) => {
    try {
      const then = new Date(pubDateStr);
      const diffMs = Date.now() - then.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch { return 'Recently'; }
  };

  const wmoToInfo = (code) => {
    if (code === 0) return { desc: 'Clear Sky', icon: 'sunny' };
    if (code === 1 || code === 2) return { desc: 'Mostly Clear', icon: 'partly-sunny' };
    if (code === 3) return { desc: 'Overcast', icon: 'cloudy' };
    if (code === 45 || code === 48) return { desc: 'Foggy', icon: 'cloudy' };
    if ([51,53,55,61,63,65].includes(code)) return { desc: 'Rain', icon: 'rainy' };
    if ([71,73,75,77].includes(code)) return { desc: 'Snow', icon: 'snow' };
    if ([80,81,82].includes(code)) return { desc: 'Rain Showers', icon: 'rainy' };
    if (code === 85 || code === 86) return { desc: 'Snow Showers', icon: 'snow' };
    if (code === 95 || code === 96 || code === 99) return { desc: 'Thunderstorms', icon: 'thunderstorm' };
    return { desc: 'Partly Cloudy', icon: 'partly-sunny' };
  };

  // Weather fetch
  const fetchWeatherForLocation = async (name, lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FIndiana%2FIndianapolis&forecast_days=7`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const json = await resp.json();
      const cur = json.current;
      const daily = json.daily;
      const info = wmoToInfo(cur.weather_code);
      const hourly = (daily.time || []).slice(1, 6).map((dateStr, i) => {
        const di = wmoToInfo(daily.weather_code[i + 1]);
        const dayDate = new Date(dateStr + 'T12:00:00');
        const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        const hi = Math.round(daily.temperature_2m_max[i + 1]);
        return { time: dayLabel, temp: `${hi}°`, icon: di.icon };
      });
      const outlookDays = (daily.time || []).map((dateStr, i) => {
        const dayDate = new Date(dateStr + 'T12:00:00');
        const dayLabel = i === 0 ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'long' });
        const hi = Math.round(daily.temperature_2m_max[i]);
        const lo = Math.round(daily.temperature_2m_min[i]);
        const dayInfo = wmoToInfo(daily.weather_code[i]);
        return {
          day: dayLabel,
          temp: `${hi}°F`,
          high: `${hi}°F`,
          low: `${lo}°F`,
          icon: dayInfo.icon,
          desc: dayInfo.desc,
          humidity: `${Math.round(cur.relative_humidity_2m)}%`,
          wind: `${Math.round(cur.wind_speed_10m)} mph`,
        };
      });
      return {
        temp: `${Math.round(cur.temperature_2m)}°F`,
        high: `${Math.round(daily.temperature_2m_max[0])}°F`,
        low: `${Math.round(daily.temperature_2m_min[0])}°F`,
        desc: info.desc,
        icon: info.icon,
        humidity: `${Math.round(cur.relative_humidity_2m)}%`,
        wind: `${Math.round(cur.wind_speed_10m)} mph`,
        hourly,
        outlookDays,
      };
    } catch (e) {
      return {
        temp: '72°F', high: '78°F', low: '56°F',
        desc: 'Partly Cloudy', icon: 'partly-sunny', humidity: '50%', wind: '7 mph',
        hourly: [
          { time: 'Mon', temp: '74°', icon: 'partly-sunny' },
          { time: 'Tue', temp: '71°', icon: 'cloudy' },
          { time: 'Wed', temp: '69°', icon: 'rainy' },
          { time: 'Thu', temp: '73°', icon: 'sunny' },
          { time: 'Fri', temp: '76°', icon: 'sunny' },
        ],
        outlookDays: [
          { day: 'Today', temp: '72°F', high: '78°F', low: '56°F', icon: 'partly-sunny', desc: 'Partly Cloudy', humidity: '50%', wind: '7 mph' },
          { day: 'Monday', temp: '74°F', high: '74°F', low: '55°F', icon: 'sunny', desc: 'Sunny', humidity: '44%', wind: '5 mph' },
          { day: 'Tuesday', temp: '71°F', high: '71°F', low: '53°F', icon: 'cloudy', desc: 'Overcast', humidity: '60%', wind: '8 mph' },
          { day: 'Wednesday', temp: '69°F', high: '69°F', low: '52°F', icon: 'rainy', desc: 'Rain', humidity: '75%', wind: '12 mph' },
          { day: 'Thursday', temp: '73°F', high: '73°F', low: '54°F', icon: 'sunny', desc: 'Sunny', humidity: '42%', wind: '4 mph' },
          { day: 'Friday', temp: '76°F', high: '76°F', low: '56°F', icon: 'sunny', desc: 'Sunny', humidity: '40%', wind: '6 mph' },
          { day: 'Saturday', temp: '78°F', high: '78°F', low: '58°F', icon: 'partly-sunny', desc: 'Mostly Clear', humidity: '38%', wind: '5 mph' },
        ],
      };
    }
  };

  // WQRK news fetch removed

  // NWS Alerts Fetch
  const fetchNWSAlerts = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch('https://api.weather.gov/alerts/active?zone=INZ064', {
        signal: controller.signal,
        headers: { 'User-Agent': 'The Limestone App Municipal Client (nate@hoosieraiautomations.com)' }
      });
      clearTimeout(timeoutId);
      const parsed = await resp.json();
      const features = parsed.features || [];
      const alerts = features.map((f, i) => {
        const props = f.properties || {};
        return {
          id: props.id || f.id || `nws_${i}`,
          title: props.event || 'Public Safety Advisory',
          severity: props.severity || 'Minor',
          source: props.senderName || 'National Weather Service',
          time: `Issued ${props.sent ? getRelativeTime(props.sent) : 'Recently'}`,
          text: props.description || 'No detailed description available.'
        };
      });
      setActiveWeatherAlerts(alerts);
      setWeatherAlertsLoading(false);
    } catch (e) {
      setActiveWeatherAlerts([]);
      setWeatherAlertsLoading(false);
    }
  };

  // Remote config for delays
  const fetchRemoteAlertsConfig = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch('https://nate-limestone.github.io/config/alerts.json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const parsed = await resp.json();
      
      const remoteSchools = parsed.schools || [];
      const mergedSchools = getSchoolDefaultStatuses().map(def => {
        const remote = remoteSchools.find(r => r.id === def.id);
        return remote ? { ...def, status: remote.status, detail: remote.detail, type: remote.type } : def;
      });
      setSchoolStatuses(mergedSchools);

      const remoteRoadwork = parsed.roadwork || [];
      setRoadworkDelays(remoteRoadwork);
    } catch (e) {
      setSchoolStatuses(getSchoolDefaultStatuses());
      setRoadworkDelays([]);
    }
  };

  const syncWeatherNow = async () => {
    setIsSyncingWeather(true);
    try {
      const locations = [
        { name: 'Bedford', lat: 38.8614, lon: -86.4878 },
        { name: 'Mitchell', lat: 38.7320, lon: -86.4942 },
        { name: 'Oolitic', lat: 38.8931, lon: -86.5217 },
        { name: 'Springville', lat: 38.8578, lon: -86.5514 },
      ];
      const results = await Promise.all(locations.map(l => fetchWeatherForLocation(l.name, l.lat, l.lon)));
      const newData = {};
      locations.forEach((l, i) => { newData[l.name] = results[i]; });
      setWeatherData(newData);
      setWeatherSyncTime('Just Now');
      setSelectedOutlookIndex(null);
      showToast('Weather forecast refreshed!', 'success');
    } catch (e) {
      showToast('Could not refresh weather.', 'error');
    } finally {
      setIsSyncingWeather(false);
    }
  };

  const syncAlertsNow = async () => {
    setIsSyncingAlerts(true);
    try {
      await Promise.all([fetchNWSAlerts(), fetchRemoteAlertsConfig()]);
      setAlertsSyncTime('Just Now');
      showToast('Public safety feeds refreshed!', 'success');
    } catch (e) {
      showToast('Could not refresh alerts.', 'error');
    } finally {
      setIsSyncingAlerts(false);
    }
  };

  const handleOpenMobileAlertCenter = (tab) => {
    setMobileAlertTab(tab);
    setShowMobileAlertCenter(true);
  };

  // Mount
  useEffect(() => {
    fetchRemoteAlertsConfig();
    const locations = [
      { name: 'Bedford', lat: 38.8614, lon: -86.4878 },
      { name: 'Mitchell', lat: 38.7320, lon: -86.4942 },
      { name: 'Oolitic', lat: 38.8931, lon: -86.5217 },
      { name: 'Springville', lat: 38.8578, lon: -86.5514 },
    ];
    const loadAll = async () => {
      try {
        const [weatherResults, alertResults] = await Promise.all([
          Promise.all(locations.map(l => fetchWeatherForLocation(l.name, l.lat, l.lon))),
          fetchNWSAlerts()
        ]);
        const newWeatherData = {};
        locations.forEach((l, i) => { newWeatherData[l.name] = weatherResults[i]; });
        setWeatherData(newWeatherData);
        setWeatherLoading(false);
      } catch (e) {
        setWeatherLoading(false);
      }
    };
    loadAll();
  }, []);

  const activeWeather = weatherData[selectedLocation] || weatherData.Bedford || {};

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDesktop ? (
          /* ────────────────────────────────────────────────────────
             DESKTOP WEBPAGE LAYOUT
             ──────────────────────────────────────────────────────── */
          <View style={styles.websiteLayout}>
            
            {/* SECTION 1: HERO WELCOME BANNER (Full-width) */}
            <View style={styles.webHeroCard}>
              <View style={styles.heroBadge}>
                <Ionicons name="heart-sharp" size={10} color={colors.textOnDark} style={{ marginRight: 4 }} />
                <Text style={styles.heroBadgeText}>COMMUNITY HUB</Text>
              </View>
              <Text style={styles.heroTitle}>Welcome Home, {profile.name}! 👋</Text>
              <Text style={styles.heroSub}>
                Preserving community trust, supporting local trade, and celebrating Lawrence County oolitic character.
              </Text>
              
              {/* Web Quick-Links / CTA Buttons Row */}
              <View style={styles.heroCtaRow}>
                <TouchableOpacity 
                  style={[styles.heroButton, { backgroundColor: colors.accent }]}
                  onPress={() => navigation.navigate('Directory')}
                >
                  <Ionicons name="business-outline" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                  <Text style={styles.heroButtonText}>Explore Directory</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.heroButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }]}
                  onPress={() => navigation.navigate('Hub')}
                >
                  <Ionicons name="person-circle-outline" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                  <Text style={styles.heroButtonText}>Citizen Control Hub</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECTION 2: LIVE COMMUNITY STATUS (Weather & Alerts Grid - 2 columns side-by-side) */}
            <View style={styles.webGridTwoColumn}>
              {/* Weather Panel */}
              <View style={styles.webSectionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={styles.webSectionHeading}>CURRENT WEATHER OUTLOOK</Text>
                  <TouchableOpacity onPress={syncWeatherNow} disabled={isSyncingWeather}>
                    <Ionicons name="refresh" size={16} color={colors.primary} style={isSyncingWeather && { opacity: 0.5 }} />
                  </TouchableOpacity>
                </View>

                {/* Location selector pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {['Bedford', 'Mitchell', 'Oolitic', 'Springville'].map(loc => (
                    <TouchableOpacity
                      key={loc}
                      style={[styles.locPill, selectedLocation === loc && styles.locPillActive]}
                      onPress={() => setSelectedLocation(loc)}
                    >
                      <Text style={[styles.locPillText, selectedLocation === loc && styles.locPillTextActive]}>{loc}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {weatherLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <View>
                        <Text style={{ fontSize: 36, fontWeight: '950', color: colors.textPrimary }}>{activeWeather.temp}</Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '750' }}>{activeWeather.desc}</Text>
                      </View>
                      <Ionicons name={activeWeather.icon || 'partly-sunny'} size={48} color={colors.accent} />
                    </View>

                    <View style={styles.weatherDetails}>
                      <View style={styles.weatherDetailItem}>
                        <Ionicons name="water-outline" size={14} color={colors.textLight} />
                        <Text style={styles.weatherDetailText}>Humid: {activeWeather.humidity}</Text>
                      </View>
                      <View style={styles.weatherDetailItem}>
                        <Ionicons name="flag-outline" size={14} color={colors.textLight} />
                        <Text style={styles.weatherDetailText}>Wind: {activeWeather.wind}</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textLight, marginTop: 18, marginBottom: 8 }}>5-DAY OUTLOOK</Text>
                    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
                      {(activeWeather.outlookDays || []).slice(0, 5).map((day, i) => (
                        <View key={i} style={[styles.outlookWebCard, { flex: 1 }]}>
                          <Text style={styles.outlookDay}>{day.day.slice(0, 3)}</Text>
                          <Ionicons name={day.icon} size={16} color={colors.accent} style={{ marginVertical: 6 }} />
                          <Text style={styles.outlookTemp}>{day.high}</Text>
                          <Text style={[styles.outlookTemp, { color: colors.textLight, fontSize: 9 }]}>{day.low}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Public Safety Alerts & School Closure Panel */}
              <View style={styles.webSectionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={styles.webSectionHeading}>ACTIVE ANNOUNCEMENTS & DELAYS</Text>
                  <TouchableOpacity onPress={syncAlertsNow} disabled={isSyncingAlerts}>
                    <Ionicons name="refresh" size={16} color={colors.primary} style={isSyncingAlerts && { opacity: 0.5 }} />
                  </TouchableOpacity>
                </View>

                {/* School Delay List */}
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textLight, marginBottom: 8 }}>SCHOOL DISTRICTS</Text>
                {(schoolStatuses.length > 0 ? schoolStatuses : getSchoolDefaultStatuses()).map((school) => (
                  <View key={school.id} style={styles.schoolRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.schoolName} numberOfLines={1}>{school.name}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: school.type === 'normal' ? colors.success + '20' : '#E0313120' }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText, 
                        { color: school.type === 'normal' ? colors.success : '#E03131' }
                      ]}>{school.status}</Text>
                    </View>
                  </View>
                ))}

                {/* Active NWS alerts */}
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textLight, marginTop: 18, marginBottom: 8 }}>ACTIVE CIVIL WARNINGS</Text>
                {weatherAlertsLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : activeWeatherAlerts.length > 0 ? (
                  activeWeatherAlerts.map((alert) => (
                    <View key={alert.id} style={[styles.weatherAlertCard, { borderColor: '#E03131' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="warning" size={14} color="#E03131" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#E03131' }}>{alert.title}</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={2}>{alert.text}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.alertClearRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>No active civil warnings.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* SECTION 3: COMMUNITY SPOTLIGHTS & SERVICES (Side-by-side grid) */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleText}>Featured Spotlights & Services</Text>
                <View style={styles.sectionTitleDivider} />
              </View>

              <View style={styles.webGridTwoColumn}>
                {/* TASC Curb-to-Curb Public Transit */}
                <View style={styles.civicSpotlightCardWeb}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.badgeRow}>
                      <View style={[globalStyles.badgeContainer, { backgroundColor: colors.primary, borderRadius: 8 }]}>
                        <Text style={typography.badge}>CIVIC FOCUS</Text>
                      </View>
                      <Text style={styles.civicStatus}>Free Service</Text>
                    </View>
                    <Ionicons name="bus-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.spotlightTitle}>TASC Public Transit</Text>
                  <Text style={styles.spotlightDesc}>
                    Need a ride around Bedford city limits? TASC operates a free public demand-response, curb-to-curb service. Book 24 hours in advance.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                    onPress={() => Linking.openURL('https://bedford.in.gov/tasc/').catch(() => navigation?.navigate('Resources'))}
                  >
                    <Text style={styles.actionButtonText}>Book Ride</Text>
                    <Ionicons name="chevron-forward-outline" size={12} color={colors.textOnDark} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>

                {/* Featured Event Spotlight */}
                {featuredEvent && (
                  <View style={styles.civicSpotlightCardWeb}>
                    <View style={styles.cardHeaderRow}>
                      <View style={[globalStyles.badgeContainer, { backgroundColor: colors.accent, borderRadius: 8 }]}>
                        <Text style={typography.badge}>COMMUNITY SPOTLIGHT</Text>
                      </View>
                      <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                    </View>
                    <View style={styles.eventContainer}>
                      <View style={styles.calendarGraphic}>
                        <View style={styles.calendarHeaderRed}>
                          <Text style={styles.calendarHeaderMonth}>
                            {getEventDateDetails(featuredEvent.date).month}
                          </Text>
                        </View>
                        <View style={styles.calendarBody}>
                          <Text style={styles.calendarDate}>
                            {getEventDateDetails(featuredEvent.date).day}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventInfoTitle} numberOfLines={1}>{featuredEvent.title}</Text>
                        <Text style={styles.eventInfoDesc} numberOfLines={3}>{featuredEvent.desc}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: colors.accent, marginTop: 16 }]}
                      onPress={() => navigation?.navigate('Community', { date: featuredEvent.date })}
                    >
                      <Text style={styles.actionButtonText}>View Event Board</Text>
                      <Ionicons name="chevron-forward-outline" size={12} color={colors.textOnDark} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* SECTION 4: BEDFORD FIRST PRIDE (Full-Width) */}
            <View style={styles.webHospitalityCard}>
              <View style={styles.hospitalityHeader}>
                <View style={styles.hospitalityIconContainer}>
                  <Text style={styles.hospitalityEmoji}>🤝</Text>
                </View>
                <View style={styles.hospitalityTitleContainer}>
                  <Text style={styles.hospitalityPreTitle}>LIMESTONE CAPITAL</Text>
                  <Text style={styles.hospitalityTitle}>Bedford First Pride</Text>
                </View>
              </View>
              <Text style={styles.hospitalityQuote}>
                "We're proud to be the Limestone Capital of the World, built on rich Hoosier history, warm community smiles, and helping hands."
              </Text>
              <View style={styles.hospitalityStats}>
                <View style={styles.hospitalityStat}>
                  <Text style={styles.hospitalityStatVal}>100%</Text>
                  <Text style={styles.hospitalityStatLbl}>Home Grown</Text>
                </View>
                <View style={styles.hospitalityStatDivider} />
                <View style={styles.hospitalityStat}>
                  <Text style={styles.hospitalityStatVal}>{DIRECTORY_DATA.length}</Text>
                  <Text style={styles.hospitalityStatLbl}>Local Spots</Text>
                </View>
                <View style={styles.hospitalityStatDivider} />
                <View style={styles.hospitalityStat}>
                  <Text style={styles.hospitalityStatVal}>72°</Text>
                  <Text style={styles.hospitalityStatLbl}>Warm Welcome</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ────────────────────────────────────────────────────────
             COLLAPSED MOBILE VIEWPORT LAYOUT (for PWA on phones)
             ──────────────────────────────────────────────────────── */
          <View>
            {/* Welcome banner */}
            <View style={styles.heroCard}>
              <View style={styles.heroBadge}>
                <Ionicons name="heart-sharp" size={10} color={colors.textOnDark} style={{ marginRight: 4 }} />
                <Text style={styles.heroBadgeText}>HELLO NEIGHBOR!</Text>
              </View>
              <Text style={styles.heroTitle}>Welcome Home,{"\n"}{profile.name}! 👋</Text>
              <Text style={styles.heroSub}>
                Discover local shops, support county schools, and connect across Bedford.
              </Text>
              
              <View style={styles.statsBar}>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => handleOpenMobileAlertCenter('weather')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="partly-sunny" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.statText}>
                    {weatherLoading ? 'Loading Weather...' : `${weatherData[selectedLocation === 'All County' ? 'Bedford' : selectedLocation]?.temp || weatherData.Bedford?.temp || '72°F'}`}
                  </Text>
                </TouchableOpacity>
                <View style={styles.statItemDivider} />
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => handleOpenMobileAlertCenter('alerts')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="warning-outline" size={16} color="#E03131" style={{ marginRight: 6 }} />
                  <Text style={[styles.statText, { color: '#E03131', fontWeight: '800' }]}>Alerts & Delays</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pride Board */}
            <View style={styles.hospitalityCard}>
              <Text style={styles.hospitalityTitle}>Bedford First Pride</Text>
              <Text style={styles.hospitalityQuote}>"Limestone Capital of the World"</Text>
              <View style={styles.hospitalityStats}>
                <View style={styles.hospitalityStat}>
                  <Text style={styles.hospitalityStatVal}>{DIRECTORY_DATA.length}</Text>
                  <Text style={styles.hospitalityStatLbl}>Spots</Text>
                </View>
              </View>
            </View>

            {/* Spots & news list stacked */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleText}>Limestone Spotlights</Text>
            </View>

            {/* Curb transit */}
            <View style={styles.civicSpotlightCard}>
              <Text style={styles.spotlightTitle}>TASC Public Transit</Text>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => Linking.openURL('https://bedford.in.gov/tasc/')}
              >
                <Text style={styles.actionButtonText}>Book Ride</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
      </ScrollView>

      {/* ── MOBILE COMPATIBILITY ALERT CENTER MODAL ── */}
      <Modal
        visible={showMobileAlertCenter}
        animationType="slide"
        onRequestClose={() => setShowMobileAlertCenter(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Limestone Alert Center</Text>
            <TouchableOpacity onPress={() => setShowMobileAlertCenter(false)}>
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {/* Render weather and school closures lists for mobile PWA viewports */}
            <View style={{ padding: 16 }}>
              {schoolStatuses.map(s => (
                <View key={s.id} style={styles.schoolRow}>
                  <Text style={styles.schoolName}>{s.name}</Text>
                  <Text>{s.status}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDesktop) => StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: {
    padding: isDesktop ? 24 : SPACING.md,
    paddingBottom: SPACING.xl,
    maxWidth: isDesktop ? 1200 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  websiteLayout: {
    flexDirection: 'column',
    width: '100%',
  },
  webHeroCard: {
    backgroundColor: '#253357',
    borderRadius: 24,
    padding: 40,
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  heroCtaRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  webGridTwoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  webSectionCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    width: '49%',
    ...SHADOWS.light,
  },
  webSectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textLight,
    letterSpacing: 1,
  },
  civicSpotlightCardWeb: {
    backgroundColor: colors.cardSurface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    width: '49%',
    ...SHADOWS.light,
  },
  webHospitalityCard: {
    backgroundColor: colors.background === '#0E2523' ? '#183633' : '#b0a587',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    ...SHADOWS.light,
    width: '100%',
  },
  dashboardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainColumn: {
    width: '64%',
  },
  sidebarColumn: {
    width: '33%',
  },
  heroCard: {
    backgroundColor: '#253357',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textOnDark,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: isDesktop ? 34 : 26,
    fontWeight: '950',
    color: colors.textOnDark,
    lineHeight: isDesktop ? 40 : 32,
  },
  heroSub: {
    fontSize: 13,
    color: '#F4F3EF',
    opacity: 0.85,
    marginTop: 8,
  },
  hospitalityCard: {
    backgroundColor: colors.background === '#0E2523' ? '#183633' : '#b0a587',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.light,
  },
  hospitalityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hospitalityIconContainer: { marginRight: 12 },
  hospitalityEmoji: { fontSize: 24 },
  hospitalityTitleContainer: { flex: 1 },
  hospitalityPreTitle: { fontSize: 8, fontWeight: '950', color: colors.textPrimary },
  hospitalityTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  hospitalityQuote: { fontSize: 13, fontStyle: 'italic', color: colors.textPrimary, marginBottom: 12 },
  hospitalityStats: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  hospitalityStat: { alignItems: 'center' },
  hospitalityStatVal: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  hospitalityStatLbl: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },
  hospitalityStatDivider: { width: 1, height: 20, backgroundColor: colors.border },
  
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  sectionTitleDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 12,
  },
  spotlightRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  civicSpotlightCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  civicStatus: { fontSize: 10, color: colors.textSecondary, marginLeft: 8, fontWeight: '700' },
  spotlightTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  spotlightDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  
  eventContainer: { flexDirection: 'row', alignItems: 'center' },
  calendarGraphic: {
    width: 50,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  calendarHeaderRed: { backgroundColor: '#E03131', width: '100%', paddingVertical: 2, alignItems: 'center' },
  calendarHeaderMonth: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  calendarBody: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  calendarDate: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  eventInfo: { flex: 1 },
  eventInfoTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  eventInfoDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  
  newsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  portalArticleCardWeb: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  portalArticleCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  portalArticleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  portalArticleDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  portalReadMoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  portalReadMoreText: { fontSize: 11, color: colors.primary, fontWeight: '800', marginRight: 4 },
  portalArtSource: { fontSize: 8, fontWeight: '900', color: colors.accent, textTransform: 'uppercase' },
  portalArticleTime: { fontSize: 9, color: colors.textLight, fontWeight: '700' },
  
  // Weather details inside sidebar
  locPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6, backgroundColor: colors.border },
  locPillActive: { backgroundColor: colors.primary },
  locPillText: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },
  locPillTextActive: { color: '#FFFFFF' },
  weatherDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 8, backgroundColor: colors.border + '50', borderRadius: 8 },
  weatherDetailItem: { flexDirection: 'row', alignItems: 'center' },
  weatherDetailText: { fontSize: 10, color: colors.textSecondary, marginLeft: 4, fontWeight: '600' },
  outlookRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  outlookDay: { fontSize: 11, color: colors.textSecondary, fontWeight: '700' },
  outlookTemp: { fontSize: 11, color: colors.textPrimary, fontWeight: '800' },
  
  // School delays inside sidebar
  schoolRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  schoolName: { fontSize: 11, color: colors.textPrimary, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 8, fontWeight: '900' },
  
  weatherAlertCard: { padding: 8, borderRadius: 8, borderWidth: 1, backgroundColor: '#E0313110', marginBottom: 8 },
  alertClearRow: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: colors.success + '10', borderRadius: 8 },

  statsBar: { flexDirection: 'row', backgroundColor: colors.cardSurface, borderRadius: 12, paddingVertical: 8, justifyContent: 'space-evenly', alignItems: 'center', marginTop: 12, ...SHADOWS.light },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 11, color: colors.textPrimary, fontWeight: '750' },
  statItemDivider: { width: 1, height: 12, backgroundColor: colors.border },
  
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { height: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalHeaderTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  modalScroll: { flex: 1 },
  portalArtTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, lineHeight: 26 },
  portalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  portalParagraph: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },

  // Unified Web Weather & Alerts Tabbed Widget
  tabbedContainer: {
    backgroundColor: colors.cardSurface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.light,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 16,
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  tabContentContainer: {
    // Standard wrapper
  },
  outlookWebCard: {
    backgroundColor: colors.border + '30',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
