import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, useWindowDimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';

// Import Screens (Metro resolves .web.js equivalents automatically)
import HomeScreen from '../screens/HomeScreen';
import DirectoryScreen from '../screens/DirectoryScreen';
import CategoryListScreen from '../screens/CategoryListScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import CommunityScreen from '../screens/CommunityScreen';
import HubScreen from '../screens/HubScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DirectoryStack = createNativeStackNavigator();

// Nested Directory Stack Navigator
function DirectoryStackScreen() {
  return (
    <DirectoryStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <DirectoryStack.Screen name="DirectoryHome" component={DirectoryScreen} />
      <DirectoryStack.Screen name="CategoryList" component={CategoryListScreen} />
    </DirectoryStack.Navigator>
  );
}

// Custom Top Header Navigation for Web
function WebHeader({ navigation, route }) {
  const { colors, profile, getAvatarDetails } = useAppContext();
  const styles = getStyles(colors);
  const avatar = getAvatarDetails();
  const activeRouteName = route ? route.name : 'Home';
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  const navItems = [
    { name: 'Home', icon: 'home-outline', label: 'Home' },
    { name: 'Directory', icon: 'business-outline', label: 'Directory' },
    { name: 'Resources', icon: 'heart-half-outline', label: 'Resources' },
    { name: 'Community', icon: 'calendar-outline', label: 'Community' },
  ];

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.cardSurface, borderBottomColor: colors.border, paddingHorizontal: isDesktop ? 24 : 16 }]}>
      {/* Left: Brand Logo */}
      <TouchableOpacity 
        style={styles.logoWrapper} 
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="leaf" size={24} color={colors.primary} />
        <Text style={[styles.logoText, { color: colors.textPrimary }]}>
          The <Text style={{ color: colors.accent }}>Limestone</Text>
        </Text>
      </TouchableOpacity>

      {/* Center: Navigation Links (Only shown on Desktop) */}
      {isDesktop && (
        <View style={styles.navLinks}>
          {navItems.map((item) => {
            const isActive = activeRouteName === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.navLinkItem,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => navigation.navigate(item.name)}
              >
                <Ionicons 
                  name={isActive ? item.icon.replace('-outline', '') : item.icon} 
                  size={16} 
                  color={isActive ? colors.primary : colors.textSecondary} 
                  style={{ marginRight: 6 }}
                />
                <Text 
                  style={[
                    styles.navLinkLabel, 
                    { color: isActive ? colors.primary : colors.textSecondary },
                    isActive && { fontWeight: '800' }
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Right: Citizen Hub Trigger */}
      <TouchableOpacity 
        style={[styles.hubTrigger, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
        onPress={() => navigation.navigate('Hub')}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
          {avatar.image ? (
            <Text style={{ fontSize: 12 }}>{avatar.image}</Text>
          ) : (
            <Ionicons name={avatar.icon} size={12} color="#FFFFFF" />
          )}
        </View>
        {isDesktop && (
          <Text style={[styles.hubTriggerText, { color: colors.textPrimary }]}>
            {profile.name.split(' ')[0]}'s Hub
          </Text>
        )}
        {isDesktop && <Ionicons name="chevron-down-outline" size={12} color={colors.textSecondary} style={{ marginLeft: 6 }} />}
      </TouchableOpacity>
    </View>
  );
}

// Bottom Tab Navigator Setup (Responsive bottom tab / header)
function MainTabs() {
  const { colors } = useAppContext();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const styles = getStyles(colors);

  return (
    <Tab.Navigator
      tabBar={isDesktop ? () => null : undefined}
      screenOptions={({ route }) => ({
        headerShown: true,
        header: (props) => <WebHeader {...props} />,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: isDesktop ? { display: 'none' } : styles.tabBarStyle,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Directory') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Resources') {
            iconName = focused ? 'heart-half' : 'heart-half-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          }

          return (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons name={iconName} size={focused ? 23 : 22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Directory" component={DirectoryStackScreen} />
      <Tab.Screen name="Resources" component={ResourcesScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}

// Root Stack Navigator Setup (MainTabs + Slide-up Hub screen)
export default function AppNavigator() {
  const { isDarkMode, colors, hasCompletedOnboarding } = useAppContext();

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.cardSurface} 
        translucent={false}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="Hub" 
              component={HubScreen} 
              options={{
                presentation: 'modal',
                animation: 'fade_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

const getStyles = (colors) => StyleSheet.create({
  headerContainer: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    ...SHADOWS.light,
    zIndex: 100,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  navLinks: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
  },
  navLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  hubTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  hubTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBarStyle: {
    backgroundColor: colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 82,
    paddingTop: 10,
    paddingBottom: 22,
    position: 'relative',
    ...SHADOWS.medium,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  activeIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
