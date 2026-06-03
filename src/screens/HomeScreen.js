import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert, Modal, ActivityIndicator, Platform, Image, Linking, TextInput } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
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
    getAvatarDetails,
    showToast
  } = useAppContext();

  const styles = getStyles(colors);
  const avatar = getAvatarDetails();
  const [showCenter, setShowCenter] = useState(false);
  const [activeTab, setActiveTab] = useState('weather'); // 'weather' or 'alerts'
  const [selectedLocation, setSelectedLocation] = useState('Bedford');
  const [selectedOutlookIndex, setSelectedOutlookIndex] = useState(null);
  
  // Live Sync States
  const [isSyncingWeather, setIsSyncingWeather] = useState(false);
  const [isSyncingAlerts, setIsSyncingAlerts] = useState(false);
  const [weatherSyncTime, setWeatherSyncTime] = useState('2m ago');
  const [alertsSyncTime, setAlertsSyncTime] = useState('Just Now');
  const [currentSystemTime, setCurrentSystemTime] = useState('');

  // Seasonal school operational defaults helper
  const getSchoolDefaultStatuses = () => {
    const now = new Date();
    const month = now.getMonth(); // 0 = Jan, 5 = Jun, 11 = Dec
    if (month >= 5 && month <= 7) {
      // June, July, August -> Summer Break!
      return [
        { id: 'nlcs', name: 'North Lawrence Schools (NLCS)', status: 'Summer Break', detail: 'Campuses closed for summer recess. Standard administrative offices open Mon-Thu 8:00 AM - 4:00 PM. Have a safe and happy summer!', type: 'closed' },
        { id: 'mitchell', name: 'Mitchell Community Schools', status: 'Summer Break', detail: 'Campuses closed for summer recess. Administrative offices open Mon-Thu 8:00 AM - 3:00 PM.', type: 'closed' },
        { id: 'stonegate', name: 'StoneGate Arts & Education', status: 'On Time', detail: 'Summer semester classes, certification programs, and community workshops operating on standard scheduling.', type: 'normal' },
        { id: 'preschool', name: 'Bedford City Preschool', status: 'Closed', detail: 'Closed for summer break. Enrollment for the 2026-2027 school year is open online.', type: 'closed' }
      ];
    }
    return [
      { id: 'nlcs', name: 'North Lawrence Schools (NLCS)', status: 'On Time', detail: 'All campuses and bus routes are operating on normal, standard schedules.', type: 'normal' },
      { id: 'mitchell', name: 'Mitchell Community Schools', status: 'On Time', detail: 'All campuses and bus routes are operating on normal, standard schedules.', type: 'normal' },
      { id: 'stonegate', name: 'StoneGate Arts & Education', status: 'On Time', detail: 'Normal operating hours. All academic classes and workshops running as scheduled.', type: 'normal' },
      { id: 'preschool', name: 'Bedford City Preschool', status: 'On Time', detail: 'Morning and afternoon preschool classes operating on normal schedules.', type: 'normal' }
    ];
  };

  // Alerts & Delays Interactive States
  const [expandedSchoolId, setExpandedSchoolId] = useState(null);

  // Helper to parse date strings cleanly for the spotlight graphic
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
    } catch (e) {
      // Fallback
    }
    return { month: 'EVT', day: '00', dayOfWeek: 'DAY' };
  };

  // Compute the next upcoming event from cachedEvents.json
  const getFeaturedEvent = () => {
    try {
      const today = new Date();
      const futureEvents = (COMMUNITY_EVENTS || []).filter(e => {
        const eventDate = new Date(e.date + 'T00:00:00');
        return eventDate.getTime() >= today.setHours(0,0,0,0);
      }).sort((a, b) => new Date(a.date) - new Date(b.date));

      if (futureEvents.length > 0) {
        return futureEvents[0];
      }
    } catch (e) {
      // Fallback
    }
    return null;
  };

  const featuredEvent = getFeaturedEvent();

  // Dynamic live NWS alerts
  const [activeWeatherAlerts, setActiveWeatherAlerts] = useState([]);
  const [weatherAlertsLoading, setWeatherAlertsLoading] = useState(true);

  // Dynamic School & Road status lists
  const [schoolStatuses, setSchoolStatuses] = useState(getSchoolDefaultStatuses());
  const [roadDelays, setRoadDelays] = useState([
    { id: 'sr37', route: 'State Road 37 N (Oolitic Bypass)', issue: 'LANE RESTRICTIONS', desc: 'Single-lane restrictions in place due to bridge joint rehabilitation. Expect minor delays during peak commute hours.', severity: 'MODERATE' },
    { id: '16th', route: '16th St Paving (Bedford Area)', issue: 'LANE SHIFTS', desc: 'Paving crews active between J Street and Lincoln Ave. Avoid routes if possible; use 15th Street as alternate bypass.', severity: 'MODERATE' },
    { id: 'medora', route: 'Medora Road (Mitchell Route)', issue: 'ROAD CLOSED', desc: 'Fully closed to through traffic between Main St and Orchard Rd for emergency culvert repair. Follow posted detours.', severity: 'SEVERE' }
  ]);

  // Format current local time dynamically
  const getFormattedTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  // Set system time on mount and update it every minute
  useEffect(() => {
    setCurrentSystemTime(getFormattedTime());
    const interval = setInterval(() => {
      setCurrentSystemTime(getFormattedTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Weather state ──
  const [weatherData, setWeatherData] = useState({});
  const [weatherLoading, setWeatherLoading] = useState(true);



  // WMO weather code → { desc, icon }
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

  // Fetch weather from Open-Meteo for a single city
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
      // Build next-5-day tiles (skip today at index 0, show indices 1-5)
      const hourly = (daily.time || []).slice(1, 6).map((dateStr, i) => {
        const di = wmoToInfo(daily.weather_code[i + 1]);
        const dayDate = new Date(dateStr + 'T12:00:00');
        const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        const hi = Math.round(daily.temperature_2m_max[i + 1]);
        return { time: dayLabel, temp: `${hi}°`, icon: di.icon };
      });
      // Build 7-day outlook array
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
      // Fallback static data
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

  // Relative time helper for news pubDates (RFC 2822)
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



  // Trigger manual force sync for weather
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
      showToast('Weather forecast refreshed successfully!', 'success');
    } catch (e) {
      showToast('Could not refresh weather.', 'error');
    } finally {
      setIsSyncingWeather(false);
    }
  };

  // Live NWS Alerts Fetch (zone: INZ064 for Lawrence County)
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

  // Remote config fetch to dynamically update delays and road closures
  const fetchRemoteAlertsConfig = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch('https://nate-limestone.github.io/config/alerts.json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!resp.ok) {
        setSchoolStatuses(getSchoolDefaultStatuses());
        return;
      }

      const parsed = await resp.json();
      
      // Robust merge for school statuses to ensure all standard campuses are always displayed
      if (parsed && parsed.schools && Array.isArray(parsed.schools)) {
        const defaults = getSchoolDefaultStatuses();
        const merged = defaults.map(defSchool => {
          const remote = parsed.schools.find(s => s && s.id === defSchool.id);
          return remote ? { ...defSchool, ...remote } : defSchool;
        });
        setSchoolStatuses(merged);
      } else {
        setSchoolStatuses(getSchoolDefaultStatuses());
      }
      
      // Array validation for road delays to avoid layout empty-out or render crashes
      if (parsed && parsed.roads && Array.isArray(parsed.roads)) {
        setRoadDelays(parsed.roads);
      } else {
        setRoadDelays([
          { id: 'sr37', route: 'State Road 37 N (Oolitic Bypass)', issue: 'LANE RESTRICTIONS', desc: 'Single-lane restrictions in place due to bridge joint rehabilitation. Expect minor delays during peak commute hours.', severity: 'MODERATE' },
          { id: '16th', route: '16th St Paving (Bedford Area)', issue: 'LANE SHIFTS', desc: 'Paving crews active between J Street and Lincoln Ave. Avoid routes if possible; use 15th Street as alternate bypass.', severity: 'MODERATE' },
          { id: 'medora', route: 'Medora Road (Mitchell Route)', issue: 'ROAD CLOSED', desc: 'Fully closed to through traffic between Main St and Orchard Rd for emergency culvert repair. Follow posted detours.', severity: 'SEVERE' }
        ]);
      }
    } catch (e) {
      // Fail silently and keep using seasonal defaults/hardcoded roadwork lists
      setSchoolStatuses(getSchoolDefaultStatuses());
      setRoadDelays([
        { id: 'sr37', route: 'State Road 37 N (Oolitic Bypass)', issue: 'LANE RESTRICTIONS', desc: 'Single-lane restrictions in place due to bridge joint rehabilitation. Expect minor delays during peak commute hours.', severity: 'MODERATE' },
        { id: '16th', route: '16th St Paving (Bedford Area)', issue: 'LANE SHIFTS', desc: 'Paving crews active between J Street and Lincoln Ave. Avoid routes if possible; use 15th Street as alternate bypass.', severity: 'MODERATE' },
        { id: 'medora', route: 'Medora Road (Mitchell Route)', issue: 'ROAD CLOSED', desc: 'Fully closed to through traffic between Main St and Orchard Rd for emergency culvert repair. Follow posted detours.', severity: 'SEVERE' }
      ]);
    }
  };

  // Trigger manual force sync for alerts and delays
  const syncAlertsNow = async () => {
    setIsSyncingAlerts(true);
    setWeatherAlertsLoading(true);
    try {
      await Promise.all([
        fetchNWSAlerts(),
        fetchRemoteAlertsConfig()
      ]);
      setAlertsSyncTime('Just Now');
      showToast('Lawrence County public safety & delay feeds updated!', 'success');
    } catch (e) {
      showToast('Could not refresh alerts.', 'error');
    } finally {
      setIsSyncingAlerts(false);
    }
  };

  // On mount: fetch weather in parallel
  useEffect(() => {
    // Immediately fire alerts config to populate schools/road lists without waiting for weather APIs
    fetchRemoteAlertsConfig();

    const locations = [
      { name: 'Bedford', lat: 38.8614, lon: -86.4878 },
      { name: 'Mitchell', lat: 38.7320, lon: -86.4942 },
      { name: 'Oolitic', lat: 38.8931, lon: -86.5217 },
      { name: 'Springville', lat: 38.8578, lon: -86.5514 },
    ];
    const loadAll = async () => {
      try {
        // Fetch weather + NWS alerts in parallel (schools/road are decoupled and fetch separately above)
        const [weatherResults, alertResults] = await Promise.all([
          Promise.all(locations.map(l => fetchWeatherForLocation(l.name, l.lat, l.lon))),
          fetchNWSAlerts()
        ]);
        const newWeatherData = {};
        locations.forEach((l, i) => { newWeatherData[l.name] = weatherResults[i]; });
        setWeatherData(newWeatherData);
        setWeatherLoading(false);
        setWeatherSyncTime('Just Now');
      } catch (e) {
        console.warn('Weather or NWS alerts failed to load on mount:', e);
        setWeatherLoading(false);
      } finally {
        setAlertsSyncTime('Just Now');
      }
    };
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAlertCenter = (tab) => {
    setActiveTab(tab);
    setShowCenter(true);
  };

  const getDisplayedWeatherData = () => {
    const locData = weatherData[selectedLocation] || weatherData.Bedford;
    const todayData = locData || {
      temp: weatherLoading ? '...' : '72°F',
      high: '78°F', low: '56°F', desc: 'Loading...', icon: 'sunny', humidity: '—', wind: '—',
      hourly: [], outlookDays: [],
    };
    if (selectedOutlookIndex === null) {
      return { ...todayData, title: 'TODAY', isToday: true };
    }

    const outlookDays = todayData.outlookDays || [];
    const dayInfo = outlookDays[selectedOutlookIndex] || outlookDays[0];
    if (!dayInfo) {
      return { ...todayData, title: 'TODAY', isToday: true };
    }

    // Generate simple hourly tiles for a selected outlook day
    const getHourlyForDay = (icon) => {
      const baseTemp = parseInt(dayInfo.temp) || 72;
      return [
        { time: '9 AM', temp: `${baseTemp - 8}°`, icon },
        { time: '12 PM', temp: `${baseTemp - 2}°`, icon },
        { time: '3 PM', temp: `${baseTemp}°`, icon },
        { time: '6 PM', temp: `${baseTemp - 4}°`, icon: icon === 'rainy' ? 'rainy' : 'partly-sunny' },
        { time: '9 PM', temp: `${baseTemp - 10}°`, icon: 'cloudy' },
      ];
    };

    return {
      temp: dayInfo.temp,
      high: dayInfo.high,
      low: dayInfo.low,
      desc: dayInfo.desc,
      icon: dayInfo.icon,
      humidity: dayInfo.humidity,
      wind: dayInfo.wind,
      hourly: getHourlyForDay(dayInfo.icon),
      title: (dayInfo.day || 'DAY').toUpperCase(),
      isToday: false,
    };
  };

  const activeWeather = getDisplayedWeatherData();

  const getHomeWeatherIcon = () => {
    const loc = profile.neighborhood === 'All County' ? 'Bedford' : profile.neighborhood;
    const locWeather = weatherData[loc] || weatherData.Bedford;
    return locWeather?.icon || 'sunny';
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      
      {/* Premium Header */}
      <View style={globalStyles.headerContainer}>
        <Text style={globalStyles.logoText}>
          The <Text style={globalStyles.logoAccent}>Limestone</Text>
        </Text>
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

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BREATHTAKING FRIENDLY HERO BANNER */}
        <View style={styles.heroCard}>
          {/* Top Decorative Tag */}
          <View style={styles.heroBadge}>
            <Ionicons name="heart-sharp" size={10} color={colors.textOnDark} style={{ marginRight: 4 }} />
            <Text style={styles.heroBadgeText}>HELLO NEIGHBOR!</Text>
          </View>
          
          <Text style={styles.heroTitle}>Welcome Home,{"\n"}{profile.name}! 👋</Text>
          <Text style={styles.heroSub}>
            Discover local shops, trust local trades, support county schools, and connect with folks across Bedford and Lawrence County.
          </Text>

          {/* Interactive statsBar Widget */}
          <View style={styles.statsBar}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => handleOpenAlertCenter('weather')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={weatherLoading ? 'sunny' : getHomeWeatherIcon()} 
                size={16} 
                color={colors.accent} 
                style={styles.statIcon} 
              />
              <Text style={styles.statText}>
                {weatherLoading 
                  ? 'Loading weather...' 
                  : `${weatherData[profile.neighborhood === 'All County' ? 'Bedford' : profile.neighborhood]?.temp || weatherData.Bedford?.temp || '72°F'} | ${weatherData[profile.neighborhood === 'All County' ? 'Bedford' : profile.neighborhood]?.desc || weatherData.Bedford?.desc || 'Sunny'}`}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.statItemDivider} />
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => handleOpenAlertCenter('alerts')}
              activeOpacity={0.7}
            >
              <Ionicons name="warning-outline" size={16} color="#E03131" style={styles.statIcon} />
              <Text style={[styles.statText, { color: '#E03131', fontWeight: '800' }]}>Alerts & Delays</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: BEDFORD FIRST & HOOSIER HOSPITALITY */}
        <View style={styles.hospitalityCard}>
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
              <Text style={styles.hospitalityStatVal}>{DIRECTORY_DATA ? DIRECTORY_DATA.length : 290}</Text>
              <Text style={styles.hospitalityStatLbl}>Local Spots</Text>
            </View>
            <View style={styles.hospitalityStatDivider} />
            <View style={styles.hospitalityStat}>
              <Text style={styles.hospitalityStatVal}>72°</Text>
              <Text style={styles.hospitalityStatLbl}>Warm Welcome</Text>
            </View>
          </View>
        </View>

        {/* SECTION: LIMESTONE SPOTLIGHTS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleText}>Limestone Spotlights</Text>
          <View style={styles.sectionTitleDivider} />
        </View>

        {/* 1. Curb-to-Curb Public Transit Box */}
        <View style={styles.civicSpotlightCard}>
          <View style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            backgroundColor: colors.primary,
            borderTopLeftRadius: 20,
            borderBottomLeftRadius: 20,
          }} />
          <View style={styles.cardHeaderRow}>
            <View style={styles.badgeRow}>
              <View style={[globalStyles.badgeContainer, { backgroundColor: colors.primary, borderRadius: 8 }]}>
                <Text style={typography.badge}>CIVIC FOCUS</Text>
              </View>
              <Text style={styles.civicStatus}>Free Service</Text>
            </View>
            <Ionicons name="bus-outline" size={22} color={colors.primary} />
          </View>

          <Text style={styles.spotlightTitle}>TASC Curb-to-Curb Public Transit</Text>
          <Text style={styles.spotlightDesc}>
            Need a ride around Bedford city limits? TASC operates a free public demand-response, curb-to-curb service. Book 24 hours in advance.
          </Text>

          <View style={styles.spotlightFooter}>
            <View style={styles.footerLabelContainer}>
              <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.footerLabel}>Transit Authority of Stone City</Text>
            </View>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL('https://bedford.in.gov/tasc/').catch(() => navigation?.navigate('Resources'))}
            >
              <Text style={styles.actionButtonText}>Book Ride</Text>
              <Ionicons name="chevron-forward-outline" size={12} color={colors.textOnDark} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Featured Event Spotlight */}
        {featuredEvent ? (
          <View style={globalStyles.card}>
            <View style={styles.eventContainer}>
              {/* Left: iCalendar page graphic */}
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
                  <Text style={styles.calendarDay}>
                    {getEventDateDetails(featuredEvent.date).dayOfWeek}
                  </Text>
                </View>
              </View>

              {/* Right: Event info details */}
              <View style={styles.eventInfo}>
                <View style={[globalStyles.badgeContainer, { backgroundColor: colors.accent }]}>
                  <Text style={typography.badge}>FEATURED EVENT</Text>
                </View>
                <Text style={styles.eventInfoTitle}>{featuredEvent.title}</Text>
                <Text style={styles.eventInfoDesc} numberOfLines={2}>
                  {featuredEvent.desc}
                </Text>
                <View style={styles.eventLocationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={styles.eventLocationText} numberOfLines={1}>
                    {featuredEvent.location ? featuredEvent.location.split(',')[0] : 'Lawrence County'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Card footer redirect */}
            <View style={styles.spotlightFooter}>
              <Text style={styles.eventHours}>{featuredEvent.time}</Text>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={() => navigation?.navigate('Community', { date: featuredEvent.date })}
              >
                <Text style={styles.actionButtonText}>View Event</Text>
                <Ionicons name="chevron-forward-outline" size={12} color={colors.textOnDark} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[globalStyles.card, { padding: 16, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 }}>No Upcoming Events</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>Check back soon for Lawrence County community activities!</Text>
          </View>
        )}

        {/* SECTION: DISCOVER LAWRENCE COUNTY */}
        <View style={[styles.sectionHeaderRow, { marginTop: SPACING.md }]}>
          <Text style={styles.sectionTitleText}>Discover Lawrence County</Text>
          <View style={styles.sectionTitleDivider} />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.discoverScroll}
          contentContainerStyle={styles.discoverScrollContent}
        >
          {/* Discover Card 1: Milwaukee Trail */}
          <View style={styles.discoverCard}>
            <View style={[styles.discoverIconWrapper, { backgroundColor: 'rgba(184, 90, 56, 0.1)' }]}>
              <Ionicons name="trail-sign-outline" size={22} color={colors.accent} />
            </View>
            <Text style={styles.discoverTitle}>Milwaukee Trail</Text>
            <Text style={styles.discoverDesc}>
              Hike or bike the scenic converted rail trail traversing beautiful wooded cuts in Lawrence County, IN.
            </Text>
            <TouchableOpacity 
              style={styles.discoverLearnBtn}
              onPress={() => navigation?.navigate('Community')}
            >
              <Text style={styles.discoverLearnText}>Explore Outdoors</Text>
              <Ionicons name="arrow-forward-outline" size={12} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Discover Card 2: History Museum */}
          <View style={styles.discoverCard}>
            <View style={[styles.discoverIconWrapper, { backgroundColor: 'rgba(30, 77, 43, 0.1)' }]}>
              <Ionicons name="library-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.discoverTitle}>Landmark Museum</Text>
            <Text style={styles.discoverDesc}>
              Explore our county's rich limestone heritage, military veterans archive, and Monon Railroad dep.
            </Text>
            <TouchableOpacity 
              style={styles.discoverLearnBtn}
              onPress={() => navigation?.navigate('Directory')}
            >
              <Text style={styles.discoverLearnText}>Find Mapped Sites</Text>
              <Ionicons name="arrow-forward-outline" size={12} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Discover Card 3: Otis Park */}
          <View style={styles.discoverCard}>
            <View style={[styles.discoverIconWrapper, { backgroundColor: 'rgba(77, 171, 247, 0.1)' }]}>
              <Ionicons name="leaf-outline" size={22} color="#4DABF7" />
            </View>
            <Text style={styles.discoverTitle}>Otis Park & Trails</Text>
            <Text style={styles.discoverDesc}>
              Play the historic 18-hole golf course, admire WPA stone cuts, or relax inside the custom bandstand.
            </Text>
            <TouchableOpacity 
              style={styles.discoverLearnBtn}
              onPress={() => navigation?.navigate('Resources')}
            >
              <Text style={styles.discoverLearnText}>View Local Parks</Text>
              <Ionicons name="arrow-forward-outline" size={12} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScrollView>

      {/* ── BREATHTAKING WEATHER & LOCAL ALERT CENTER MODAL ── */}
      <Modal
        visible={showCenter}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowCenter(false);
        }}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              Limestone <Text style={{ color: colors.accent }}>Alert Center</Text>
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => {
                setShowCenter(false);
              }}
            >
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector Segment Control */}
          <View style={styles.tabSelector}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'weather' && styles.tabBtnActive]} 
              onPress={() => {
                setActiveTab('weather');
              }}
            >
              <Ionicons 
                name="partly-sunny" 
                size={16} 
                color={activeTab === 'weather' ? colors.textOnDark : colors.textSecondary} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'weather' && styles.tabBtnActive && styles.tabBtnTextActive]}>
                Local Weather
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'alerts' && styles.tabBtnActive]} 
              onPress={() => {
                setActiveTab('alerts');
              }}
            >
              <Ionicons 
                name="warning-sharp" 
                size={16} 
                color={activeTab === 'alerts' ? colors.textOnDark : colors.textSecondary} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'alerts' && styles.tabBtnActive && styles.tabBtnTextActive]}>
                Alerts & Delays
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'weather' ? (
            /* ── WEATHER DASHBOARD TAB ── */
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Dynamic Location Picker */}
              <View style={styles.locationSelectorContainer}>
                <Text style={styles.selectorLabel}>CURRENT LOCATION:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationPills}>
                  {Object.keys(weatherData).map((loc) => {
                    const isSelected = selectedLocation === loc;
                    return (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.locationPill, isSelected && styles.locationPillActive]}
                        onPress={() => setSelectedLocation(loc)}
                      >
                        <Ionicons 
                          name="location" 
                          size={12} 
                          color={isSelected ? colors.textOnDark : colors.textSecondary} 
                          style={{ marginRight: 4 }} 
                        />
                        <Text style={[styles.locationPillText, isSelected && styles.locationPillTextActive]}>
                          {loc}, IN
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Weather Sync Dashboard Status */}
              <View style={styles.syncStatusRow}>
                <View style={styles.syncIndicatorContainer}>
                  <View style={styles.syncGreenDot} />
                  <Text style={styles.syncTimeText}>Auto-Refresh: Updated {weatherSyncTime}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.syncBtn} 
                  onPress={syncWeatherNow}
                  disabled={isSyncingWeather}
                >
                  {isSyncingWeather ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={14} color={colors.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.syncBtnText}>Refresh Weather</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* National Weather Service Active Alert Flasher */}
              {activeWeatherAlerts.length > 0 ? (
                <View style={[styles.nwsBox, { backgroundColor: 'rgba(250, 82, 82, 0.08)', borderColor: 'rgba(250, 82, 82, 0.15)' }]}>
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#FA5252' }} />
                  <View style={styles.nwsHeader}>
                    <Ionicons name="warning" size={16} color="#FA5252" style={{ marginRight: 6 }} />
                    <Text style={[styles.nwsTitle, { color: '#FA5252' }]}>ACTIVE WEATHER ADVISORY</Text>
                  </View>
                  <Text style={[styles.nwsText, { color: colors.textPrimary }]}>
                    ⚠️ {activeWeatherAlerts[0].title}: {activeWeatherAlerts[0].text.length > 150 ? `${activeWeatherAlerts[0].text.slice(0, 150)}...` : activeWeatherAlerts[0].text}
                  </Text>
                </View>
              ) : (
                <View style={[styles.nwsBox, { backgroundColor: 'rgba(64, 192, 87, 0.08)', borderColor: 'rgba(64, 192, 87, 0.15)' }]}>
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#40C057' }} />
                  <View style={styles.nwsHeader}>
                    <Ionicons name="checkmark-circle" size={16} color="#40C057" style={{ marginRight: 6 }} />
                    <Text style={[styles.nwsTitle, { color: '#40C057' }]}>ALL CLEAR</Text>
                  </View>
                  <Text style={styles.nwsText}>
                    No active severe weather or civil hazard alerts currently issued for Lawrence County.
                  </Text>
                </View>
              )}

              {/* Big Weather Panel */}
              <View style={styles.weatherHero}>
                <View style={styles.weatherHeroLeft}>
                  <Text style={styles.weatherHeroTemp}>{activeWeather.temp}</Text>
                  <Text style={styles.weatherHeroDesc}>{activeWeather.desc}</Text>
                  <Text style={styles.weatherHeroDetails}>
                    High: {activeWeather.high}  ·  Low: {activeWeather.low}
                  </Text>
                  {!activeWeather.isToday ? (
                    <TouchableOpacity 
                      style={styles.resetWeatherBtn}
                      onPress={() => {
                        setSelectedOutlookIndex(null);
                        showToast("Reset to current forecast!", "success");
                      }}
                    >
                      <Ionicons name="refresh-circle-outline" size={12} color={colors.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.resetWeatherText}>Reset to Today ({activeWeather.title})</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.weatherHeroRight}>
                  <Ionicons name={activeWeather.icon || 'sunny'} size={72} color={colors.accent} />
                </View>
              </View>

              {/* Specific Conditions */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailGridCard}>
                  <Ionicons name="water-outline" size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                  <Text style={styles.gridVal}>{activeWeather.humidity}</Text>
                  <Text style={styles.gridLbl}>Humidity</Text>
                </View>
                <View style={styles.detailGridCard}>
                  <Ionicons name="swap-horizontal" size={18} color="#4DABF7" style={{ marginBottom: 4 }} />
                  <Text style={styles.gridVal}>{activeWeather.wind}</Text>
                  <Text style={styles.gridLbl}>Wind Speed</Text>
                </View>
                <View style={styles.detailGridCard}>
                  <Ionicons name="eye-outline" size={18} color={colors.accent} style={{ marginBottom: 4 }} />
                  <Text style={styles.gridVal}>10 mi</Text>
                  <Text style={styles.gridLbl}>Visibility</Text>
                </View>
              </View>

              {/* Hourly Forecast Scroll */}
              <Text style={styles.modalSectionHeader}>24-HOUR FORECAST ({selectedLocation})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
                {activeWeather.hourly.map((h, idx) => (
                  <View key={idx} style={styles.hourlyCard}>
                    <Text style={styles.hourlyTime}>{h.time}</Text>
                    <Ionicons name={h.icon} size={22} color={colors.accent} style={{ marginVertical: 6 }} />
                    <Text style={styles.hourlyTemp}>{h.temp}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* 7-Day Forecast */}
              <Text style={styles.modalSectionHeader}>7-DAY OUTLOOK ({selectedLocation})</Text>
              <View style={[styles.outlookCard, { marginBottom: 48 }]}>
                {(activeWeather.outlookDays || []).map((d, idx, arr) => {
                  const isSelected = selectedOutlookIndex === idx;
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={[
                        styles.outlookRow, 
                        idx === arr.length - 1 && styles.noBorder,
                        isSelected && { backgroundColor: `${colors.accent}12` }
                      ]}
                      onPress={() => {
                        setSelectedOutlookIndex(idx);
                        showToast(`Showing forecast for ${d.day}!`, "success");
                      }}
                    >
                      <Text style={[styles.outlookDay, isSelected && { fontWeight: '850', color: colors.accent }]}>{d.day}</Text>
                      <View style={styles.outlookStatus}>
                        <Ionicons name={d.icon} size={16} color={colors.accent} style={{ marginRight: 6 }} />
                        <Text style={styles.outlookDesc}>{d.desc}</Text>
                      </View>
                      <Text style={styles.outlookTemps}>
                        <Text style={styles.highText}>{d.high}</Text> / <Text style={styles.lowText}>{d.low}</Text>
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            /* ── DYNAMIC LIVE ALERTS & DELAYS DASHBOARD ── */
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Alerts Sync Status Dashboard */}
              <View style={[styles.syncStatusRow, { marginTop: SPACING.xs, marginBottom: SPACING.md }]}>
                <View style={styles.syncIndicatorContainer}>
                  <View style={[styles.syncGreenDot, { backgroundColor: '#FD7E14' }]} />
                  <Text style={styles.syncTimeText}>Alerts Pipeline: Updated {alertsSyncTime}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.syncBtn} 
                  onPress={syncAlertsNow}
                  disabled={isSyncingAlerts}
                >
                  {isSyncingAlerts ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={14} color={colors.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.syncBtnText}>Refresh Alerts</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* NWS Severe Weather / Emergency Advisory Box */}
              {activeWeatherAlerts.length > 0 ? (
                activeWeatherAlerts.map((alert) => {
                  const isSevere = alert.severity === 'Severe' || alert.severity === 'Extreme';
                  const accentColor = isSevere ? '#FA5252' : '#FAB005';
                  return (
                    <View 
                      key={alert.id}
                      style={{
                        backgroundColor: colors.cardSurface,
                        borderRadius: 16,
                        padding: 16,
                        paddingLeft: 22,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        ...SHADOWS.light,
                        position: 'relative',
                      }}
                    >
                      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: accentColor, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="warning" size={18} color={accentColor} style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary, letterSpacing: 0.5 }}>ACTIVE EMERGENCY ADVISORY</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: accentColor, marginBottom: 4 }}>{alert.title}</Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                        {alert.text}
                      </Text>
                      <Text style={{ fontSize: 9, fontWeight: '750', color: colors.textSecondary, marginTop: 8, textTransform: 'uppercase' }}>
                        Source: {alert.source} • {alert.time}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={{
                  backgroundColor: colors.cardSurface,
                  borderRadius: 16,
                  padding: 16,
                  paddingLeft: 22,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...SHADOWS.light,
                  position: 'relative',
                }}>
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#40C057', borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="checkmark-circle-sharp" size={18} color="#40C057" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#40C057', letterSpacing: 0.5 }}>OFFICIAL NWS ALL-CLEAR</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '850', color: colors.textPrimary, marginBottom: 4 }}>No Active Civil Hazards or Warnings</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                    The National Weather Service currently lists no active severe weather emergency advisories, flash flood warnings, or storm watches for Lawrence County.
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: '750', color: colors.textSecondary, marginTop: 8, textTransform: 'uppercase' }}>Source: National Weather Service • Updated {alertsSyncTime}</Text>
                </View>
              )}

              {/* School Status & Delays Board */}
              <View style={[styles.newsSourceCard, { padding: 16, marginBottom: 16 }]}>
                <View style={[styles.sourceHeader, { marginBottom: 12 }]}>
                  <View style={[styles.sourceLogoContainer, { backgroundColor: 'rgba(77, 171, 247, 0.1)' }]}>
                    <Ionicons name="school" size={18} color="#4DABF7" />
                  </View>
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceName}>School Delays & Operations</Text>
                    <Text style={styles.sourceSub}>Live operational status for county campuses</Text>
                  </View>
                </View>

                <View style={{ marginTop: 4 }}>
                  {schoolStatuses.length === 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#40C057" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>No active delays or closures reported.</Text>
                    </View>
                  ) : (
                    schoolStatuses.map((school) => {
                      const isExpanded = expandedSchoolId === school.id;
                      const statusColor = school.type === 'normal' ? '#40C057' : school.type === 'delay' ? '#FD7E14' : '#FA5252';
                      const statusBg = school.type === 'normal' ? 'rgba(64, 192, 87, 0.1)' : school.type === 'delay' ? 'rgba(253, 126, 20, 0.1)' : 'rgba(250, 82, 82, 0.1)';
                      return (
                        <TouchableOpacity 
                          key={school.id}
                          style={{
                            backgroundColor: colors.cardSurface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 8,
                            ...SHADOWS.light
                          }}
                          onPress={() => setExpandedSchoolId(isExpanded ? null : school.id)}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary, flex: 1, marginRight: 8 }}>{school.name}</Text>
                            <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                              <Text style={{ fontSize: 10, fontWeight: '900', color: statusColor }}>{school.status}</Text>
                            </View>
                          </View>
                          {isExpanded ? (
                            <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
                              <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>{school.detail}</Text>
                            </View>
                          ) : (
                            <Text style={{ fontSize: 9, fontWeight: '750', color: colors.accent, marginTop: 4, letterSpacing: 0.5 }}>TAP FOR SCHEDULING DETAILS & BUSING →</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Road Construction & Closures Board */}
              <View style={[styles.newsSourceCard, { padding: 16, marginBottom: 16 }]}>
                <View style={[styles.sourceHeader, { marginBottom: 12 }]}>
                  <View style={[styles.sourceLogoContainer, { backgroundColor: 'rgba(250, 82, 82, 0.1)' }]}>
                    <Ionicons name="construct" size={18} color="#FA5252" />
                  </View>
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceName}>Active Roadwork & Hazards</Text>
                    <Text style={styles.sourceSub}>Current construction and delays on county routes</Text>
                  </View>
                </View>

                <View style={{ marginTop: 4 }}>
                  {roadDelays.length === 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#40C057" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>No active road hazards or closures reported.</Text>
                    </View>
                  ) : (
                    roadDelays.map((road) => {
                      const sevColor = road.severity === 'SEVERE' ? '#FA5252' : '#FD7E14';
                      return (
                        <View 
                          key={road.id}
                          style={{
                            backgroundColor: colors.cardSurface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 8,
                            ...SHADOWS.light
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textPrimary }}>{road.route}</Text>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: sevColor }}>{road.issue}</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>{road.desc}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Emergency Quick-Dial Directory */}
              <View style={[styles.newsSourceCard, { padding: 16, marginBottom: 16 }]}>
                <View style={[styles.sourceHeader, { marginBottom: 12 }]}>
                  <View style={[styles.sourceLogoContainer, { backgroundColor: 'rgba(32, 201, 151, 0.1)' }]}>
                    <Ionicons name="call" size={18} color="#20C997" />
                  </View>
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceName}>County Emergency Hotlines</Text>
                    <Text style={styles.sourceSub}>Tap to dial local public safety and utility contacts</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 }}>
                  {[
                    { name: 'Sheriff non-Emergency', phone: '812-275-3316', icon: 'shield-outline' },
                    { name: 'Bedford Police non-Emergency', phone: '812-275-3311', icon: 'car-outline' },
                    { name: 'Mitchell Police non-Emergency', phone: '812-849-2151', icon: 'business-outline' },
                    { name: 'Duke Energy (Power Outage)', phone: '800-343-3525', icon: 'flash-outline' }
                  ].map((hotline, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{
                        width: '48%',
                        backgroundColor: colors.cardSurface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 10,
                        marginBottom: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...SHADOWS.light
                      }}
                      onPress={() => Linking.openURL(`tel:${hotline.phone}`).catch(() => {})}
                    >
                      <Ionicons name={hotline.icon} size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 2 }}>{hotline.name}</Text>
                      <Text style={{ fontSize: 9, fontWeight: '750', color: colors.accent }}>{hotline.phone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Centered REMC Outage Hotline */}
                <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 2, marginBottom: 4 }}>
                  <TouchableOpacity
                    style={{
                      width: '48%',
                      backgroundColor: colors.cardSurface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...SHADOWS.light
                    }}
                    onPress={() => Linking.openURL('tel:812-279-6953').catch(() => {})}
                  >
                    <Ionicons name="leaf-outline" size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 2 }}>REMC Outage Hotline</Text>
                    <Text style={{ fontSize: 9, fontWeight: '750', color: colors.accent }}>812-279-6953</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
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
  
  // ULTRA-PREMIUM FRIENDLY HERO CARD
  heroCard: {
    backgroundColor: '#253357', // Deep Navy Blue
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
    ...SHADOWS.medium,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent, // Clay Terracotta
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textOnDark,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '950',
    color: colors.textOnDark,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    color: '#F4F3EF', // Limestone Buff (Light Contrast)
    opacity: 0.85,
    lineHeight: 18,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface, // White canvas
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statItemDivider: {
    height: 18,
    width: 1,
    backgroundColor: colors.border,
  },

  // BEDFORD FIRST HOSPITALITY BOARD
  hospitalityCard: {
    backgroundColor: colors.background === '#0E2523' ? '#183633' : '#b0a587', // Rich sandstone clay gold fill color in light mode
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.background === '#0E2523' ? '#254541' : '#998d6d',
    ...SHADOWS.light,
  },
  hospitalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  hospitalityIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.background === '#0E2523' ? 'rgba(234, 242, 241, 0.1)' : 'rgba(18, 30, 29, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  hospitalityEmoji: {
    fontSize: 20,
  },
  hospitalityTitleContainer: {
    flex: 1,
  },
  hospitalityPreTitle: {
    fontSize: 9,
    fontWeight: '950',
    color: colors.background === '#0E2523' ? '#8BA39F' : '#4E3E1F',
    letterSpacing: 1.5,
  },
  hospitalityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.background === '#0E2523' ? '#EAF2F1' : '#121E1D',
  },
  hospitalityQuote: {
    fontSize: 13,
    color: colors.background === '#0E2523' ? '#B8CECB' : '#2A3C3A',
    fontStyle: 'italic',
    lineHeight: 18,
    paddingLeft: 4,
    marginBottom: SPACING.md,
  },
  hospitalityStats: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 10,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  hospitalityCardDivider: {
    height: 20,
    width: 1,
    backgroundColor: colors.background === '#0E2523' ? '#254541' : '#C1CCC9',
  },
  hospitalityStat: {
    alignItems: 'center',
    width: '30%',
  },
  hospitalityStatVal: {
    fontSize: 16,
    fontWeight: '950',
    color: colors.background === '#0E2523' ? '#EAF2F1' : '#121E1D',
  },
  hospitalityStatLbl: {
    fontSize: 9,
    fontWeight: '750',
    color: colors.background === '#0E2523' ? '#8BA39F' : '#4E5F5D',
    marginTop: 2,
  },
  hospitalityStatDivider: {
    height: 20,
    width: 1,
    backgroundColor: colors.background === '#0E2523' ? '#254541' : '#C1CCC9',
  },

  // SECTION TITLES
  sectionHeaderRow: {
    flexDirection: 'row',
    marginVertical: SPACING.sm,
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginRight: SPACING.sm,
  },
  sectionTitleDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  // SPOTLIGHT SPECIAL CARDS (CIVIC FOCUS BOX STYLE FIX)
  civicSpotlightCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 20,
    padding: SPACING.md,
    paddingLeft: SPACING.md + 6,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
    position: 'relative',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  civicStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    marginLeft: SPACING.sm,
  },
  spotlightTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: SPACING.sm,
  },
  spotlightDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: SPACING.xs,
  },
  spotlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    ...SHADOWS.light,
  },
  actionButtonText: {
    color: colors.textOnDark,
    fontSize: 11,
    fontWeight: '800',
  },

  // 2D CALENDAR GRAPHIC ROW
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarGraphic: {
    width: 60,
    height: 72,
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  calendarHeaderRed: {
    width: '100%',
    height: 20,
    backgroundColor: colors.accent, // Red Clay
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHeaderMonth: {
    fontSize: 9,
    fontWeight: '950',
    color: colors.textOnDark,
    letterSpacing: 1,
  },
  calendarBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  calendarDate: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  calendarDay: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  eventInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  eventInfoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  eventInfoDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventLocationText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  eventHours: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // DISCOVER DECK
  discoverScroll: {
    marginHorizontal: -SPACING.md,
    marginTop: SPACING.xs,
  },
  discoverScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  discoverCard: {
    width: 220,
    backgroundColor: colors.cardSurface,
    borderRadius: 20,
    padding: SPACING.md,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  discoverIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  discoverTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  discoverDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    minHeight: 45,
    marginBottom: SPACING.sm,
  },
  discoverLearnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverLearnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    marginRight: 4,
  },

  // ── MODAL CONTAINER & STYLES ──
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...SHADOWS.light,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '750',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.textOnDark,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },

  // LOCATION SELECTOR
  locationSelectorContainer: {
    marginBottom: SPACING.sm,
  },
  selectorLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
    paddingLeft: 2,
  },
  locationPills: {
    paddingVertical: 2,
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
    ...SHADOWS.light,
  },
  locationPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  locationPillTextActive: {
    color: colors.textOnDark,
  },

  // LIVE WEATHER/NEWS SYNC STATUS DASHBOARD STYLE
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  syncIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#20C997', // Emerald live green
    marginRight: 6,
  },
  syncTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
  },
  resetWeatherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(222, 156, 139, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  resetWeatherText: {
    fontSize: 10,
    fontWeight: '850',
    color: colors.accent,
    marginRight: 4,
  },
  carouselScroll: {
    marginVertical: SPACING.md,
  },
  carouselContent: {
    paddingHorizontal: 2,
    gap: 12,
  },
  carouselCard: {
    width: 300,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...SHADOWS.medium,
  },
  carouselCardImage: {
    width: '100%',
    height: '100%',
  },
  carouselCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 22, 20, 0.45)', // dark soft shadow overlay
  },
  carouselCardTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  },
  carouselCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  carouselCardSource: {
    fontSize: 10,
    fontWeight: '850',
    color: '#8EBA9F', // Muted Sage
    textTransform: 'uppercase',
  },
  carouselCardTime: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  carouselCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 18,
  },

  // NWS WARNING BOX
  nwsBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    paddingLeft: SPACING.md + 6,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  nwsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nwsTitle: {
    fontSize: 10,
    fontWeight: '850',
    color: '#E0A000',
    letterSpacing: 1.2,
  },
  nwsText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
    fontWeight: '600',
  },

  // WEATHER HERO PANEL
  weatherHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  weatherHeroLeft: {
    flex: 1,
  },
  weatherHeroTemp: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  weatherHeroDesc: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
    marginVertical: 2,
  },
  weatherHeroDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  weatherHeroRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CONDITIONS DETAILS GRID
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  detailGridCard: {
    flex: 1,
    minWidth: 90,
    marginHorizontal: 3,
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  gridVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  gridLbl: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
    fontWeight: '600',
  },

  // HOURLY SCROLL
  modalSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
    paddingLeft: 2,
  },
  hourlyScroll: {
    paddingBottom: SPACING.md,
    gap: 8,
  },
  hourlyCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
    width: 75,
    ...SHADOWS.light,
  },
  hourlyTime: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  hourlyTemp: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // 7-DAY OUTLOOK
  outlookCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  outlookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  outlookDay: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    width: '30%',
  },
  outlookStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  outlookDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '650',
  },
  outlookTemps: {
    fontSize: 13,
    width: '25%',
    textAlign: 'right',
  },
  highText: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  lowText: {
    color: colors.textLight,
    fontWeight: '600',
  },

  // ── RADIO & NEWS STYLES ──
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  broadcastBannerText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textOnDark,
    letterSpacing: 1.2,
  },
  newsSourceCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 20,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.01)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sourceLogoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sourceSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  listenBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textOnDark,
  },
  feedContainer: {
    paddingHorizontal: SPACING.md,
  },
  feedItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  feedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedItemTime: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '650',
  },
  liveIndicator: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF6B6B',
    textTransform: 'uppercase',
  },
  feedItemTitle: {
    fontSize: 14,
    fontWeight: '750',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  feedItemDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },

  // ── DYNAMIC E-READER ARTICLE PANE ──
  readerPane: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  backToFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  backToFeedText: {
    fontSize: 12,
    fontWeight: '750',
    color: colors.primary,
  },
  readerScroll: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderRadius: 24,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  readerSource: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  readerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 26,
    marginVertical: SPACING.xs,
  },
  readerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.md,
  },
  readerParagraph: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },

  // ── TIMES-MAIL PORTAL STYLES ──
  portalPane: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  portalScroll: {
    flex: 1,
  },
  portalPaperHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  portalPaperTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  portalPaperSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 4,
    fontStyle: 'italic',
  },
  doubleDividerTop: {
    height: 1.5,
    backgroundColor: colors.textPrimary,
    width: '100%',
    marginTop: SPACING.sm,
  },
  doubleDividerBottom: {
    height: 0.8,
    backgroundColor: colors.textPrimary,
    width: '100%',
    marginTop: 2,
  },
  portalSubCard: {
    backgroundColor: `${colors.primary}08`,
    borderColor: `${colors.primary}20`,
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  portalSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  portalSubTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 6,
  },
  portalSubDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '600',
  },
  portalBadgeRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: 6,
  },
  portalPillGreen: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  portalPillTextGreen: {
    color: colors.textOnDark,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  portalPillGray: {
    backgroundColor: `${colors.textLight}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  portalPillTextGray: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  portalSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  portalArticleCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  portalArticleTime: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '650',
    marginBottom: 4,
  },
  portalArticleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 19,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  portalArticleDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 6,
  },
  portalReadMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  portalReadMoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    marginRight: 4,
  },
  portalArtSource: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4DABF7',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  portalArtTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 26,
    marginVertical: SPACING.xs,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  portalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.md,
  },
  portalParagraph: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  archiveGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  archiveItem: {
    backgroundColor: colors.cardSurface,
    width: '48%',
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  archiveDate: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
  },
  archiveVolume: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
});

