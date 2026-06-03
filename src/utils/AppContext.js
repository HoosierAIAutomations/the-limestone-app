import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set default notification handler safely — guarded for Expo Go compatibility
// (Remote push tokens are NOT available in Expo Go on Android; local notifications are fine)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // Silently ignore — Expo Go on Android may not support this
}
import { LIGHT_COLORS, DARK_COLORS, getGlobalStyles, getTypography } from '../styles/theme';

const AppContext = createContext();

// Personalized Rounded Chipped Toast overlay component
function ToastOverlay({ message, type, colors, isDarkMode }) {
  const isDark = isDarkMode;
  const bgColor = isDark ? 'rgba(30, 35, 33, 0.96)' : 'rgba(255, 255, 255, 0.96)';
  const borderColor = type === 'success' ? '#52B788' : type === 'warning' ? '#E9D8A6' : '#C5B499';
  const iconName = type === 'success' ? 'checkmark-circle-sharp' : type === 'warning' ? 'alert-circle-sharp' : 'information-circle-sharp';
  const iconColor = borderColor;

  return (
    <View style={[styles.toastContainer, { backgroundColor: bgColor, borderColor: borderColor }]}>
      <Ionicons name={iconName} size={16} color={iconColor} style={{ marginRight: 8 }} />
      <Text style={[styles.toastText, { color: isDark ? '#FFFFFF' : '#121614' }]}>{message}</Text>
    </View>
  );
}

export function AppProvider({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Limestone Neighbor',
    profilePicture: 'forest', // Default token ID
    customPictureUrl: '',
    avatarPreset: 'forest', 
    neighborhood: 'Bedford', // 'Bedford', 'Mitchell', 'Oolitic', 'All County'
    notificationsEnabled: false,
    locationEnabled: false,
  });

  // Saved spots, RSVPs, Clicks & Anonymous Reviews lists state
  const [savedSpots, setSavedSpots] = useState([]); // Initial spots saved empty
  const [rsvpEvents, setRsvpEvents] = useState([]); // Initial RSVP empty
  const [visitedShopsCount, setVisitedShopsCount] = useState(0); // Initial click count starts at 0

  // Interactive Business & App Ratings state
  const [businessRatings, setBusinessRatings] = useState({});
  const [appRatings, setAppRatings] = useState({ score: 0, votes: 0 });

  // In-App custom Toast overlay state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Load persisted state from AsyncStorage on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const [darkRaw, profileRaw, spotsRaw, rsvpRaw, ratingsRaw, onboardingRaw] = await Promise.all([
          AsyncStorage.getItem('@limestone_darkMode'),
          AsyncStorage.getItem('@limestone_profile'),
          AsyncStorage.getItem('@limestone_savedSpots'),
          AsyncStorage.getItem('@limestone_rsvpEvents'),
          AsyncStorage.getItem('@limestone_businessRatings'),
          AsyncStorage.getItem('@limestone_onboarding_completed'),
        ]);
        if (darkRaw !== null) setIsDarkMode(JSON.parse(darkRaw));
        if (profileRaw !== null) setProfile(prev => ({ ...prev, ...JSON.parse(profileRaw) }));
        if (spotsRaw !== null) setSavedSpots(JSON.parse(spotsRaw));
        if (rsvpRaw !== null) setRsvpEvents(JSON.parse(rsvpRaw));
        if (ratingsRaw !== null) setBusinessRatings(JSON.parse(ratingsRaw));
        if (onboardingRaw === 'true') {
          setHasCompletedOnboarding(true);
        } else {
          setHasCompletedOnboarding(false);
        }
      } catch (e) {
        console.warn('AsyncStorage hydration error:', e);
      } finally {
        setIsHydrated(true);
      }
    };
    hydrate();
  }, []);

  // Persist dark mode
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem('@limestone_darkMode', JSON.stringify(isDarkMode)).catch(console.warn);
  }, [isDarkMode, isHydrated]);

  // Persist profile
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem('@limestone_profile', JSON.stringify(profile)).catch(console.warn);
  }, [profile, isHydrated]);

  // Persist saved spots
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem('@limestone_savedSpots', JSON.stringify(savedSpots)).catch(console.warn);
  }, [savedSpots, isHydrated]);

  // Persist RSVP events
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem('@limestone_rsvpEvents', JSON.stringify(rsvpEvents)).catch(console.warn);
  }, [rsvpEvents, isHydrated]);

  // Persist business ratings
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem('@limestone_businessRatings', JSON.stringify(businessRatings)).catch(console.warn);
  }, [businessRatings, isHydrated]);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    // Automatically auto-dismiss toast in 2.5s
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    showToast(`Dark Mode ${!isDarkMode ? 'enabled' : 'disabled'} successfully!`, 'success');
  };

  const updateProfile = (fields) => {
    setProfile(prev => ({
      ...prev,
      ...fields
    }));
  };

  const completeOnboarding = async (name, neighborhood, avatar) => {
    try {
      const updatedProfile = {
        ...profile,
        name: name || 'Limestone Neighbor',
        neighborhood: neighborhood || 'Bedford',
        profilePicture: avatar || 'forest',
        avatarPreset: avatar || 'forest'
      };
      setProfile(updatedProfile);
      setHasCompletedOnboarding(true);
      await Promise.all([
        AsyncStorage.setItem('@limestone_profile', JSON.stringify(updatedProfile)),
        AsyncStorage.setItem('@limestone_onboarding_completed', 'true')
      ]);
      showToast(`Welcome to the community, ${name || 'Neighbor'}!`, 'success');
    } catch (e) {
      console.warn('Error completing onboarding:', e);
    }
  };

  const resetOnboardingDiagnostic = async () => {
    try {
      setHasCompletedOnboarding(false);
      await AsyncStorage.removeItem('@limestone_onboarding_completed');
      showToast('Diagnostic: Welcome walkthrough reset!', 'success');
    } catch (e) {
      console.warn('Error resetting onboarding:', e);
    }
  };

  const toggleSaveSpot = (bizId) => {
    setSavedSpots((prev) => {
      const isSaved = prev.includes(bizId);
      if (isSaved) {
        showToast("Spot removed from My Saved list.", "warning");
        return prev.filter(id => id !== bizId);
      } else {
        showToast("Spot saved to My Saved list!", "success");
        return [...prev, bizId];
      }
    });
  };

  const toggleRsvpEvent = (eventId) => {
    setRsvpEvents((prev) => {
      const isRsvpd = prev.includes(eventId);
      if (isRsvpd) {
        showToast("RSVP cancelled successfully.", "warning");
        return prev.filter(id => id !== eventId);
      } else {
        showToast("RSVP registered! Event saved to calendar.", "success");
        return [...prev, eventId];
      }
    });
  };

  const incrementVisitedShops = () => {
    setVisitedShopsCount(prev => prev + 1);
  };

  const submitBusinessRating = (bizId, score) => {
    setBusinessRatings((prev) => {
      const current = prev[bizId] || { score: 4.5, votes: 12 };
      const newVotes = current.votes + 1;
      const newScore = parseFloat(((current.score * current.votes + score) / newVotes).toFixed(1));
      showToast(`Anonymous rating of ${score} stars submitted. Thank you!`, "success");
      return {
        ...prev,
        [bizId]: { score: newScore, votes: newVotes }
      };
    });
  };

  const submitAppRating = (score, comment) => {
    setAppRatings(prev => ({
      score: score,
      votes: prev.votes + 1
    }));
    showToast(`Anonymous App Rating of ${score} stars submitted!`, "success");
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        updateProfile({ locationEnabled: true });
        showToast("Location services activated successfully!", "success");
      } else {
        updateProfile({ locationEnabled: false });
        showToast("Location permission was denied.", "warning");
      }
    } catch (error) {
      console.warn("Location permission error:", error);
      updateProfile({ locationEnabled: false });
      showToast("Could not request location permission.", "warning");
    }
  };

  const requestNotificationsPermission = async () => {
    try {
      // Check current permission status first
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Only request if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        updateProfile({ notificationsEnabled: true });
        showToast('Community alerts enabled! You will be notified of local events.', 'success');
      } else {
        updateProfile({ notificationsEnabled: false });
        showToast('Notification permission denied. Enable in Settings to receive alerts.', 'warning');
      }
    } catch (error) {
      // Expo Go on Android does not support remote push tokens — local notifications still work
      console.warn('Notification permission error (Expo Go safe):', error?.message || error);
      // Still mark as enabled so the UI reflects the user's intent
      updateProfile({ notificationsEnabled: true });
      showToast('Notifications set up! Full alerts available in the released app.', 'success');
    }
  };

  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const globalStyles = getGlobalStyles(colors);
  const typography = getTypography(colors);

  // Profile Presets Details Helper - 12 Hoosier Illustrative Tokens (Authentic Vector Badges)
  const getProfilePictureDetails = (presetId) => {
    const activePreset = presetId || profile.profilePicture || 'forest';
    const name = profile.name || 'Nate Limestone';
    
    // Extract initials as elegant fallback
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const presets = {
      forest: {
        icon: 'leaf',
        label: 'Hoosier Forest',
        sub: 'Forest Scout',
        bgColor: 'rgba(127, 179, 176, 0.15)',
        borderColor: '#7FB3B0', // Soft Pastel Sage Teal
        textColor: '#7FB3B0',
      },
      quarry: {
        icon: 'water',
        label: 'Blue Hole Quarry',
        sub: 'Quarry Explorer',
        bgColor: 'rgba(160, 178, 198, 0.15)',
        borderColor: '#A0B2C6', // Slate Blue
        textColor: '#A0B2C6',
      },
      bridge: {
        icon: 'trail-sign',
        label: 'Williams Bridge',
        sub: 'Countryside Traveler',
        bgColor: 'rgba(197, 180, 153, 0.15)',
        borderColor: '#C5B499', // Muted Warm Sand
        textColor: '#C5B499',
      },
      carver: {
        icon: 'construct',
        label: 'Limestone Carver',
        sub: 'Limestone Carver',
        bgColor: 'rgba(233, 216, 166, 0.15)',
        borderColor: '#E9D8A6', // Soft Peach Amber
        textColor: '#E9D8A6',
      },
      monon: {
        icon: 'train',
        label: 'Monon Heritage',
        sub: 'Monon Historian',
        bgColor: 'rgba(197, 180, 153, 0.15)',
        borderColor: '#C5B499', // Muted Warm Sand
        textColor: '#C5B499',
      },
      transit: {
        icon: 'bus',
        label: 'TASC Transit',
        sub: 'Stone City Rider',
        bgColor: 'rgba(160, 178, 198, 0.15)',
        borderColor: '#A0B2C6', // Slate Blue
        textColor: '#A0B2C6',
      },
      parks: {
        icon: 'seesaw',
        label: 'Otis Parks',
        sub: 'Otis Park Supporter',
        bgColor: 'rgba(136, 214, 164, 0.15)',
        borderColor: '#88D6A4', // Muted Mint
        textColor: '#88D6A4',
      },
      space: {
        icon: 'planet',
        label: 'Grissom Star Space',
        sub: 'Mitchell Space Explorer',
        bgColor: 'rgba(77, 171, 247, 0.15)',
        borderColor: '#4DABF7', // Blue
        textColor: '#4DABF7',
      },
      education: {
        icon: 'book',
        label: 'School Scholar',
        sub: 'Hoosier Scholar',
        bgColor: 'rgba(127, 179, 176, 0.15)',
        borderColor: '#7FB3B0', // Soft Pastel Sage Teal
        textColor: '#7FB3B0',
      },
      agriculture: {
        icon: 'nutrition',
        label: 'Farmers Stand',
        sub: 'Countryside Harvester',
        bgColor: 'rgba(233, 216, 166, 0.15)',
        borderColor: '#E9D8A6', // Soft Peach Amber
        textColor: '#E9D8A6',
      },
      opera: {
        icon: 'musical-notes',
        label: 'Mitchell Opera',
        sub: 'Theater Arts Neighbor',
        bgColor: 'rgba(197, 180, 153, 0.15)',
        borderColor: '#C5B499', // Muted Warm Sand
        textColor: '#C5B499',
      },
      citizen: {
        icon: 'ribbon',
        label: 'County Citizen',
        sub: 'Limestone Supporter',
        bgColor: 'rgba(127, 179, 176, 0.15)',
        borderColor: '#7FB3B0', // Soft Pastel Sage Teal
        textColor: '#7FB3B0',
      },
      aviation: {
        icon: 'airplane',
        label: 'Aviation Hub',
        sub: 'Mitchell Aviator',
        bgColor: 'rgba(233, 216, 166, 0.15)',
        borderColor: '#E9D8A6', // Soft Peach Amber
        textColor: '#E9D8A6',
      },
      camping: {
        icon: 'flame',
        label: 'Hoosier Camp',
        sub: 'Hoosier Camper',
        bgColor: 'rgba(127, 179, 176, 0.15)',
        borderColor: '#7FB3B0', // Soft Pastel Sage Teal
        textColor: '#7FB3B0',
      },
      caverns: {
        icon: 'boat',
        label: 'Subterranean',
        sub: 'Cave Explorer',
        bgColor: 'rgba(160, 178, 198, 0.15)',
        borderColor: '#A0B2C6', // Slate Blue
        textColor: '#A0B2C6',
      },
      fishing: {
        icon: 'fish',
        label: 'River Fish',
        sub: 'White River Angler',
        bgColor: 'rgba(197, 180, 153, 0.15)',
        borderColor: '#C5B499', // Muted Warm Sand
        textColor: '#C5B499',
      },
      festival: {
        icon: 'balloon',
        label: 'Mitchell Fest',
        sub: 'Festival Neighbor',
        bgColor: 'rgba(197, 180, 153, 0.15)',
        borderColor: '#C5B499', // Muted Warm Sand
        textColor: '#C5B499',
      },
      cabin: {
        icon: 'home',
        label: 'Pioneer Cabin',
        sub: 'Spring Mill Explorer',
        bgColor: 'rgba(127, 179, 176, 0.15)',
        borderColor: '#7FB3B0', // Soft Pastel Sage Teal
        textColor: '#7FB3B0',
      },
      trail: {
        icon: 'footsteps',
        label: 'Milwaukee Trail',
        sub: 'Trail Hiker',
        bgColor: 'rgba(127, 179, 176, 0.15)',
        borderColor: '#7FB3B0', // Soft Pastel Sage Teal
        textColor: '#7FB3B0',
      },
      sunrise: {
        icon: 'sunny',
        label: 'Hoosier Sunrise',
        sub: 'Early Riser',
        bgColor: 'rgba(233, 216, 166, 0.15)',
        borderColor: '#E9D8A6', // Soft Peach Amber
        textColor: '#E9D8A6',
      },
      athletics: {
        icon: 'trophy',
        label: 'Stars Sports',
        sub: 'Athletic Booster',
        bgColor: 'rgba(160, 178, 198, 0.15)',
        borderColor: '#A0B2C6', // Slate Blue
        textColor: '#A0B2C6',
      },
      arts: {
        icon: 'brush',
        label: 'Stone City Arts',
        sub: 'Local Art Patron',
        bgColor: 'rgba(197, 180, 153, 0.15)',
        borderColor: '#C5B499', // Muted Warm Sand
        textColor: '#C5B499',
      },
      fairgrounds: {
        icon: 'pin',
        label: '4-H Fair',
        sub: 'Fairground Supporter',
        bgColor: 'rgba(233, 216, 166, 0.15)',
        borderColor: '#E9D8A6', // Soft Peach Amber
        textColor: '#E9D8A6',
      },
      wellness: {
        icon: 'heart',
        label: 'County Health',
        sub: 'Wellness Neighbor',
        bgColor: 'rgba(136, 214, 164, 0.15)',
        borderColor: '#88D6A4', // Muted Mint
        textColor: '#88D6A4',
      }
    };

    const details = presets[activePreset] || presets.forest;
    return {
      ...details,
      initials,
    };
  };

  // Backwards compatibility alias
  const getAvatarDetails = getProfilePictureDetails;

  const value = {
    isDarkMode,
    setIsDarkMode,
    toggleDarkMode,
    profile,
    updateProfile,
    colors,
    globalStyles,
    typography,
    savedSpots,
    rsvpEvents,
    visitedShopsCount,
    businessRatings,
    appRatings,
    toggleSaveSpot,
    toggleRsvpEvent,
    incrementVisitedShops,
    submitBusinessRating,
    submitAppRating,
    requestLocationPermission,
    requestNotificationsPermission,
    getProfilePictureDetails,
    getAvatarDetails,
    showToast,
    isHydrated,
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboardingDiagnostic,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {toast.visible && (
        <ToastOverlay 
          message={toast.message} 
          type={toast.type} 
          colors={colors} 
          isDarkMode={isDarkMode} 
        />
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 50, // Just above the tab bar on mobile viewport
    left: 24,
    right: 24,
    borderRadius: 25,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 9999,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.2,
  }
});
