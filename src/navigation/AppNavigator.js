import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';

// Import Screens
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

// Bottom Tab Navigator Setup (4 Tabs)
function MainTabs() {
  const { colors } = useAppContext();
  const styles = getStyles(colors);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBarStyle,
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
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

const getStyles = (colors) => StyleSheet.create({
  tabBarStyle: {
    backgroundColor: colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 92,
    paddingTop: 12,
    paddingBottom: 32,
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
