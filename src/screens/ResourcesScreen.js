import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Linking, Modal, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';
import { WEB3FORMS_ACCESS_KEY, CONTACT_EMAIL } from '../utils/config';

const RESOURCE_SECTORS = [
  { id: 'all', name: 'All Services', icon: 'grid-outline' },
  { id: 'health', name: 'Health & Wellness', icon: 'heart-outline', color: '#185955' }, // Hoosier Deep Forest Teal/Sage
  { id: 'gov', name: 'Gov & Safety', icon: 'library-outline', color: '#5A7A61' }, // Muted Sage Green
  { id: 'food', name: 'Food Programs', icon: 'restaurant-outline', color: '#968469' }, // Southern Indiana Warm Sand / Bronze Clay
  { id: 'shelter', name: 'Shelters & Housing', icon: 'home-outline', color: '#8B5E3C' }, // Bronze/Brown Wood
  { id: 'transit', name: 'Public Transit', icon: 'car-outline', color: '#4A6070' }, // Quarry Slate Blue
];

const BEDFORD_RESOURCES = [
  {
    id: 'res_1',
    name: 'FSSA Bedford Family Resources',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61', // Muted Sage Green
    icon: 'library',
    description: 'Apply for and manage SNAP food stamps, TANF financial assistance, and Indiana Medicaid programs.',
    phone: '800-403-0864',
    address: '1212 I St, Bedford, IN 47421',
    url: 'https://www.in.gov/fssa/dfr/about-dfr',
  },
  {
    id: 'res_2',
    name: 'Lawrence County Government Offices',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61', // Muted Sage Green
    icon: 'business',
    description: 'Central courthouse hosting the County Auditor, Treasurer, Clerk, Commissioners, and Voter Registration.',
    phone: '812-275-2644',
    address: '916 15th Street, Bedford, IN 47421',
    url: 'http://www.lawrencecounty.in.gov',
  },
  {
    id: 'res_3',
    name: 'Lawrence County Sheriff Office',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61', // Muted Sage Green
    icon: 'shield',
    description: 'County law enforcement, county jail operations, emergency safety dispatch, and civil process servers.',
    phone: '812-275-3316',
    address: '1420 I Street, Bedford, IN 47421',
    url: 'https://www.lawrencecounty.in.gov',
  },
  {
    id: 'res_3_pd',
    name: 'Bedford Police Department',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61', // Muted Sage Green
    icon: 'shield-checkmark',
    description: 'Municipal emergency public safety, community policing, crime prevention, and emergency dispatch.',
    phone: '812-275-3311',
    address: '2308 16th Street, Bedford, IN 47421',
    url: 'https://bedfordpolicedepartment.com',
  },
  {
    id: 'res_4',
    name: 'Bedford City Hall & Public Utilities',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61', // Muted Sage Green
    icon: 'trail-sign',
    description: 'Municipal utility billing, streets/sanitation dispatch, police & fire departments admin.',
    phone: '812-279-6555',
    address: '1102 16th Street, Bedford, IN 47421',
    url: 'https://bedford.in.gov/',
  },
  {
    id: 'res_5',
    name: 'IU Health Bedford Hospital',
    sector: 'health',
    categoryName: 'Health & Wellness',
    color: '#185955', // Hoosier Deep Forest Teal/Sage
    icon: 'medical',
    description: 'Critical Access Hospital featuring a 24-hour Emergency Room, ICU, diagnostic scans, and physical rehab.',
    phone: '812-275-1200',
    address: '2900 West 16th Street, Bedford, IN 47421',
    url: 'https://www.iuhealth.org/bedford',
  },
  {
    id: 'res_6',
    name: 'Indiana Center for Recovery - Bedford',
    sector: 'health',
    categoryName: 'Health & Wellness',
    color: '#185955', // Hoosier Deep Forest Teal/Sage
    icon: 'fitness',
    description: 'State-of-the-art mental health and addiction rehab clinic featuring inpatient detox and outpatient therapy.',
    phone: '812-489-2192',
    address: '1600 23rd St, Bedford, IN 47421',
    url: 'https://treatmentindiana.com',
  },
  {
    id: 'res_7',
    name: 'Hope Resource Center',
    sector: 'health',
    categoryName: 'Health & Wellness',
    color: '#185955', // Hoosier Deep Forest Teal/Sage
    icon: 'heart',
    description: 'Free confidential pregnancy tests, obstetric ultrasounds, STD testing, baby supplies, and parenting classes.',
    phone: '812-275-2827',
    address: '717 Lincoln Ave, Suite G, Bedford, IN 47421',
    url: 'https://hoperesourcectr.org',
  },
  {
    id: 'res_8',
    name: 'Centerstone Mental Health Clinic',
    sector: 'health',
    categoryName: 'Health & Wellness',
    color: '#185955', // Hoosier Deep Forest Teal/Sage
    icon: 'pulse',
    description: 'Outpatient mental health counseling, youth programs, crisis services, and medication management.',
    phone: '812-329-4950',
    address: '1315 Hillcrest Road, Bedford, IN 47421',
    url: 'https://centerstone.org',
  },
  {
    id: 'res_9',
    name: 'Serenity Now Psychiatric Services',
    sector: 'health',
    categoryName: 'Health & Wellness',
    color: '#185955', // Hoosier Deep Forest Teal/Sage
    icon: 'people-circle',
    description: 'Child and adult outpatient psychiatry and counseling clinics. A Hoosier Uplands specialty program.',
    phone: '812-275-4053',
    address: '2125 16th Street, Bedford, IN 47421',
    url: 'https://www.hoosieruplands.org',
  },
  {
    id: 'res_10',
    name: 'Hoosier Uplands Community Outreach',
    sector: 'shelter',
    categoryName: 'Community & Faith',
    color: '#8B5E3C', // Bronze/Brown Wood
    icon: 'extension-puzzle',
    description: 'LIHEAP energy assistance, Head Start, hospice coordination, and weatherization aid.',
    phone: '812-279-0412',
    address: '710 6th Street, Bedford, IN 47421',
    url: 'http://www.hoosieruplands.org',
  },
  {
    id: 'res_11',
    name: 'Becky\'s Place Women Shelter',
    sector: 'shelter',
    categoryName: 'Community & Faith',
    color: '#8B5E3C', // Bronze/Brown Wood
    icon: 'home',
    description: 'Safe shelter, meals, case management, and permanent housing assistance for women and children in need.',
    phone: '812-275-5773',
    address: '1108 5th Street, Bedford, IN 47421',
    url: 'https://www.archindy.org/cc/bloomington/beckysplace.html',
  },
  {
    id: 'res_12',
    name: 'Men\'s Warming Shelter of Bedford',
    sector: 'shelter',
    categoryName: 'Community & Faith',
    color: '#8B5E3C', // Bronze/Brown Wood
    icon: 'snow',
    description: 'Seasonal overnight emergency shelter (Nov 1 - Apr 30) providing hot meals, showers, laundry, and warmth.',
    phone: '812-329-1118',
    address: '1414 H Street, Bedford, IN 47421',
    url: 'https://www.bedfordmenswarmingshelter.org',
  },
  {
    id: 'res_13',
    name: 'L.I.F.E. Food & Financial Pantry',
    sector: 'food',
    categoryName: 'Food & Drink',
    color: '#968469', // Southern Indiana Warm Sand / Bronze Clay
    icon: 'restaurant',
    description: 'Emergency food grocery bags, plus rent/mortgage/utility utility bill assistance grants.',
    phone: '812-279-4442',
    address: '1204 I Street, Bedford, IN 47421',
    url: 'http://www.lifeindiana.org',
  },
  {
    id: 'res_14',
    name: 'Bertha\'s Mission Community Kitchen',
    sector: 'food',
    categoryName: 'Food & Drink',
    color: '#968469', // Southern Indiana Warm Sand / Bronze Clay
    icon: 'cafe',
    description: 'Free drive-thru hot lunch (Tue-Thu 1:00-3:30 PM), homebound meal delivery, and life skills cooking prep.',
    phone: '812-329-1100',
    address: '512 Lincoln Avenue, Bedford, IN 47421',
    url: 'http://berthasmission.com/',
  },
  {
    id: 'res_15',
    name: 'TASC Transit Authority of Stone City',
    sector: 'transit',
    categoryName: 'Auto & Transport',
    color: '#4A6070', // Quarry Slate Blue
    icon: 'bus',
    description: 'Free demand-response, curb-to-curb municipal public transit inside city limits (24-hour advance booking).',
    phone: '812-275-1633',
    address: '1619 K Street, Bedford, IN 47421',
    url: 'https://bedford.in.gov/tasc/',
  },
  {
    id: 'res_16',
    name: 'Thornton Park Book Box',
    sector: 'gov',
    categoryName: 'Education & Childcare',
    color: '#5A7A61', // Muted Sage Green
    icon: 'book',
    description: 'A neighborhood Little Free Library book swap box supported by the Bedford Public Library. Take a book, leave a book!',
    phone: '812-275-4471',
    address: 'Thornton Park, Bedford, IN 47421',
    url: 'https://bedlib.org',
  },
  {
    id: 'res_17',
    name: 'Johnny Junxions Book Box',
    sector: 'gov',
    categoryName: 'Education & Childcare',
    color: '#5A7A61', // Muted Sage Green
    icon: 'book',
    description: 'A rural Little Free Library book swap box located at Johnny Junxions store. Supported by the Bedford Public Library.',
    phone: '812-275-4471',
    address: 'Johnny Junxions, Fayetteville, IN 47421',
    url: 'https://bedlib.org',
  },
  {
    id: 'res_18',
    name: 'Sam\'s Shelf Roadside Stand & Library',
    sector: 'food',
    categoryName: 'Community & Faith',
    color: '#968469', // Southern Indiana Warm Sand / Bronze Clay
    icon: 'leaf',
    description: 'A roadside community blessing pantry box and Little Free Library stand. Take what you need, leave what you can!',
    phone: 'N/A',
    address: '16 Indian Trails Ridge, Bedford, IN 47421',
    url: 'https://www.littlefreepantry.org',
  },
  {
    id: 'res_19',
    name: 'S.P.I.N. Little Free Pantry & Hygiene',
    sector: 'food',
    categoryName: 'Food & Drink',
    color: '#968469', // Southern Indiana Warm Sand / Bronze Clay
    icon: 'heart-half',
    description: 'Supporting People In Need (SPIN) mini-pantry providing dry goods, emergency food, laundry, and shower access (Mon-Fri 9-11 AM).',
    phone: '812-329-1118',
    address: '1414 H St, Bedford, IN 47421',
    url: 'https://www.bedfordmenswarmingshelter.org',
  },
  {
    id: 'res_20',
    name: 'Mitchell Bread of Life Food Box',
    sector: 'food',
    categoryName: 'Food & Drink',
    color: '#968469', // Southern Indiana Warm Sand / Bronze Clay
    icon: 'basket',
    description: 'A cooperative community food box pantry serving Lawrence County and Mitchell residents.',
    phone: '812-849-2111',
    address: '815 W. Main Street, Mitchell, IN 47446',
    url: 'https://www.hoosieruplands.org',
  },
  {
    id: 'res_21',
    name: 'Mitchell Police Department',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61', // Muted Sage Green
    icon: 'shield-half',
    description: 'Municipal law enforcement, traffic safety, and neighborhood public safety services for the City of Mitchell.',
    phone: '812-849-2151',
    address: '407 S 6th St, Mitchell, IN 47446',
    url: 'https://www.mitchell-in.gov/',
  },
  {
    id: 'res_22',
    name: 'Mitchell Fire Department',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61', // Muted Sage Green
    icon: 'flame',
    description: 'Volunteer fire rescue, emergency first-response, and public fire safety education serving Mitchell citizens.',
    phone: '812-849-2222',
    address: '903 Main St, Mitchell, IN 47446',
    url: 'https://www.mitchell-in.gov/',
  },
  {
    id: 'res_23',
    name: 'Oolitic Town Hall & Marshal Office',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61', // Muted Sage Green
    icon: 'trail-sign',
    description: 'Oolitic municipal town clerk, utility billing, and local deputy marshal emergency public safety office.',
    phone: '812-275-6813',
    address: '109 Main St, Oolitic, IN 47451',
    url: 'http://www.townofoolitic.org/',
  },
  {
    id: 'res_24',
    name: 'Lawrence County Health Department',
    sector: 'health',
    categoryName: 'Health & Wellness',
    color: '#185955', // Hoosier Deep Forest Teal/Sage
    icon: 'medical',
    description: 'Vital statistics, immunizations, environmental health inspections, public health safety warnings, and nursing services.',
    phone: '812-275-3234',
    address: '2419 Mitchell Rd, Bedford, IN 47421',
    url: 'https://www.lawrencecounty.in.gov/',
  },
  {
    id: 'res_25',
    name: 'L.I.F.E. Mitchell Food Pantry',
    sector: 'food',
    categoryName: 'Food & Drink',
    color: '#968469', // Southern Indiana Warm Sand / Bronze Clay
    icon: 'basket',
    description: 'Satellite emergency food bank and household pantry distribution box for Mitchell and southern Lawrence County families.',
    phone: '812-849-0113',
    address: '1021 West Main St, Mitchell, IN 47446',
    url: 'http://www.lifeindiana.org/',
  },
  {
    id: 'res_26',
    name: 'Hoosier Uplands Mitchell Learning Center',
    sector: 'gov',
    categoryName: 'Education & Childcare',
    color: '#5A7A61', // Muted Sage Green
    icon: 'school',
    description: 'Head Start early childhood development and preschool educational center supported by Hoosier Uplands.',
    phone: '812-849-4447',
    address: '117 W Grissom Ave, Mitchell, IN 47446',
    url: 'https://www.hoosieruplands.org/',
  },
];

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

export default function ResourcesScreen({ route, navigation }) {
  const {
    isDarkMode,
    colors,
    globalStyles,
    typography,
    profile,
    updateProfile,
    getProfilePictureDetails
  } = useAppContext();

  const styles = getStyles(colors);
  const avatar = getProfilePictureDetails();

  const getDynamicColor = (baseColor) => {
    if (!isDarkMode) return baseColor;
    const colorMap = {
      '#185955': colors.primary,  // Health & Wellness (Hoosier Forest Teal)
      '#5A7A61': '#A5B2AA',       // Gov & Safety (Muted Sage -> Slate Gray/Sage)
      '#968469': colors.accent,   // Food Programs (Warm Sand / Bronze Clay)
      '#8B5E3C': '#F2A541',       // Shelters & Housing (Bronze/Wood -> Ochre Amber)
      '#4A6070': '#A0B2C6',       // Public Transit (Quarry Slate -> Slate Blue)
    };
    return colorMap[baseColor] || baseColor;
  };

  const [activeSector, setActiveSector] = useState('all');
  const [expandedId, setExpandedId] = useState(null);


  // Resource Submission Form States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [resName, setResName] = useState('');
  const [resSector, setResSector] = useState(''); // Sector ID
  const [resAddress, setResAddress] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resWebsite, setResWebsite] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (route?.params?.showAddModal) {
      setShowSubmitModal(true);
      navigation.setParams({ showAddModal: undefined });
    }
  }, [route?.params?.showAddModal]);

  const handleSendResourceSubmit = async () => {
    if (!resName || !resSector || !resAddress || !resDesc || !submitterEmail) {
      Alert.alert("Required Fields", "Please fill in all required fields: Resource Name, Sector, Address, Description, and your Contact Email.");
      return;
    }

    const sectorObj = RESOURCE_SECTORS.find(s => s.id === resSector);
    const sectorName = sectorObj ? sectorObj.name : resSector;

    const emailBody = `Hello,

I would like to submit the following public resource / assistance program for publication in The Limestone app resources tab:

- Resource Name: ${resName}
- Sector: ${sectorName}
- Address: ${resAddress}
- Phone Number: ${resPhone || 'N/A'}
- Website/URL: ${resWebsite || 'N/A'}
- Description of Services: ${resDesc}
- Contact Email: ${submitterEmail}

Thank you!`;

    // 1. Check if the key is default or empty
    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
      triggerResMailtoFallback(emailBody);
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
          subject: `Limestone App - Resource Submission: ${resName}`,
          from_name: 'The Limestone App Users',
          name: resName,
          email: submitterEmail,
          message: emailBody,
          resourceName: resName,
          resourceSector: sectorName,
          resourceAddress: resAddress,
          resourcePhone: resPhone,
          resourceWebsite: resWebsite,
          resourceDesc: resDesc
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
      } else {
        console.warn('Web3Forms response error, falling back to mail client:', data);
        triggerResMailtoFallback(emailBody);
      }
    } catch (err) {
      console.warn('Web3Forms submit error, falling back to mail client:', err);
      triggerResMailtoFallback(emailBody);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerResMailtoFallback = (emailBody) => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Limestone App - Resource Submission: ${resName}`)}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(mailtoUrl)
      .then(() => {
        setSubmitSuccess(true);
      })
      .catch(err => {
        Alert.alert(
          "Mail App Failed",
          `We couldn't submit via Web3Forms or launch your email client. Please send resource details directly to ${CONTACT_EMAIL}.\n\nThank you!`,
          [{ text: "OK" }]
        );
      });
  };

  const handleResetForm = () => {
    setResName('');
    setResSector('');
    setResAddress('');
    setResPhone('');
    setResWebsite('');
    setResDesc('');
    setSubmitterEmail('');
    setSubmitSuccess(false);
    setShowSubmitModal(false);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleOpenMap = (address) => {
    const formattedAddress = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${formattedAddress}`);
  };

  const handleOpenWeb = (url) => {
    Linking.openURL(url);
  };

  // Filter logic — sector and neighborhood only (no search bar)
  const filteredResources = BEDFORD_RESOURCES.filter(res => {
    const matchesSector = activeSector === 'all' || res.sector === activeSector;

    // Neighborhood matching
    let matchesNeighborhood = true;
    if (profile && profile.neighborhood && profile.neighborhood !== 'All County') {
      const hoodLower = profile.neighborhood.toLowerCase();
      const isCountyWide = res.address.toLowerCase().includes('county') ||
                           res.description.toLowerCase().includes('county-wide') ||
                           res.address === 'N/A';
      const isSpecificTown = res.address.toLowerCase().includes(hoodLower) ||
                             res.description.toLowerCase().includes(hoodLower) ||
                             res.name.toLowerCase().includes(hoodLower);
      matchesNeighborhood = isCountyWide || isSpecificTown;
    }

    return matchesSector && matchesNeighborhood;
  });

  const renderSectorButton = ({ item }) => {
    const isActive = activeSector === item.id;
    return (
      <TouchableOpacity 
        style={[
          styles.sectorBtn,
          isActive && styles.sectorBtnActive
        ]}
        onPress={() => {
          setActiveSector(item.id);
          setExpandedId(null);
        }}
      >
        <Ionicons 
          name={item.icon} 
          size={16} 
          color={isActive ? colors.textOnDark : (getDynamicColor(item.color) || colors.textSecondary)} 
          style={styles.sectorIcon}
        />
        <Text style={[styles.sectorText, isActive && styles.sectorTextActive]}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={globalStyles.headerContainer}>
        <Text style={globalStyles.logoText}>County <Text style={globalStyles.logoAccent}>Resources</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.addResourceBtn, { marginRight: SPACING.sm }]}
            onPress={() => setShowSubmitModal(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.addResourceText}>Submit</Text>
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

      <View style={styles.container}>

        {/* Categories Horizontal Ribbon */}
        <View style={styles.ribbonContainer}>
          <FlatList
            data={RESOURCE_SECTORS}
            renderItem={renderSectorButton}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ribbonContent}
          />
        </View>

        {/* Resources Scroll List */}
        <ScrollView style={styles.resourcesScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons name="medkit-outline" size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.heroBadgeText}>LAWRENCE COUNTY SERVICES</Text>
            </View>
            <Text style={styles.heroTitle}>Direct Public{"\n"}Assistance</Text>
            <Text style={styles.heroSub}>
              Quick, active connection to local Bedford public clinics, food pantries, emergency shelters, and transit routes. Support is just a call away.
            </Text>
          </View>

          {filteredResources.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No matching resources found.</Text>
            </View>
          ) : (
            filteredResources.map((res) => {
              const isExpanded = expandedId === res.id;
              return (
                <View 
                  key={res.id} 
                  style={[
                    styles.resCard, 
                    isExpanded && styles.resCardExpanded
                  ]}
                >
                  <View style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 5,
                    backgroundColor: getDynamicColor(res.color),
                    borderTopLeftRadius: 16,
                    borderBottomLeftRadius: 16,
                  }} />
                  <TouchableOpacity style={styles.cardMain} onPress={() => toggleExpand(res.id)} activeOpacity={0.8}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconContainer, { backgroundColor: `${getDynamicColor(res.color)}15` }]}>
                        <Ionicons name={res.icon} size={20} color={getDynamicColor(res.color)} />
                      </View>
                      <View style={styles.headerTitles}>
                        <Text style={styles.resName}>{res.name}</Text>
                        <Text style={styles.resCategory}>{res.categoryName}</Text>
                      </View>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={18} 
                        color={colors.textSecondary} 
                      />
                    </View>
                    <Text style={styles.resDesc}>{res.description}</Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.drawerContainer}>
                      <View style={styles.dashedBorder} />
                      
                      {/* Address detail row */}
                      <TouchableOpacity style={styles.detailRow} onPress={() => handleOpenMap(res.address)}>
                        <Ionicons name="location-outline" size={16} color={colors.accent} style={styles.detailIcon} />
                        <Text style={styles.detailText}>{res.address}</Text>
                      </TouchableOpacity>

                      {/* Phone detail row */}
                      <TouchableOpacity style={styles.detailRow} onPress={() => handleCall(res.phone)}>
                        <Ionicons name="call-outline" size={16} color={colors.accent} style={styles.detailIcon} />
                        <Text style={[styles.detailText, styles.linkText]}>{res.phone}</Text>
                      </TouchableOpacity>

                      {/* Web detail row */}
                      {res.url ? (
                        <TouchableOpacity style={styles.detailRow} onPress={() => handleOpenWeb(res.url)}>
                          <Ionicons name="globe-outline" size={16} color={colors.accent} style={styles.detailIcon} />
                          <Text style={[styles.detailText, styles.linkText]} numberOfLines={1}>Official Website</Text>
                        </TouchableOpacity>
                      ) : null}

                      {/* CTA Action Buttons Strip */}
                      <View style={styles.actionStrip}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(res.phone)}>
                          <Ionicons name="call" size={16} color={colors.textOnDark} style={styles.btnIcon} />
                          <Text style={styles.actionBtnText}>Call Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.actionBtn, { backgroundColor: colors.primary }]} 
                          onPress={() => handleOpenMap(res.address)}
                        >
                          <Ionicons name="navigate" size={16} color={colors.textOnDark} style={styles.btnIcon} />
                          <Text style={styles.actionBtnText}>Directions</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Direct Apply / Book CTA — prominent full-width button */}
                      {res.url ? (
                        <TouchableOpacity
                          style={[
                            styles.applyBtn,
                            { backgroundColor: getDynamicColor(res.color) }
                          ]}
                          onPress={() =>
                            Linking.openURL(res.url).catch(() =>
                              Alert.alert('Could not open link', 'Please visit ' + res.url + ' in your browser.')
                            )
                          }
                        >
                          <Ionicons
                            name={res.sector === 'transit' ? 'bus' : 'open-outline'}
                            size={16}
                            color="#fff"
                            style={{ marginRight: 8 }}
                          />
                          <Text style={styles.applyBtnText}>
                            {res.sector === 'transit'
                              ? 'Book a Ride'
                              : res.sector === 'food'
                              ? 'Get Assistance'
                              : res.sector === 'shelter'
                              ? 'Get Help / Apply'
                              : res.sector === 'health'
                              ? 'Schedule / Apply'
                              : 'Visit Website'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ── INTERACTIVE PUBLIC RESOURCE SUBMISSION FORM MODAL ── */}
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
              Submit <Text style={{ color: colors.accent }}>Public Resource</Text>
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
                <Text style={styles.successTitle}>Resource Submitted!</Text>
                <Text style={styles.successText}>
                  Thank you for submitting this community resource! It has been successfully compiled and sent to the Lawrence County directory coordinator for verification and publication in the Resources tab.
                </Text>
                <TouchableOpacity 
                  style={[styles.formSubmitBtn, { width: '100%', marginTop: SPACING.md }]} 
                  onPress={handleResetForm}
                >
                  <Text style={styles.formSubmitBtnText}>Back to Resources</Text>
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
                Suggest a free food pantry, public health clinic, municipal government agency, utility assistance program, or shelter. Complete the details below to submit directly to our review team!
              </Text>

              {/* Resource Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Resource Name <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. L.I.F.E. Mitchell Food Pantry"
                  placeholderTextColor={colors.textLight}
                  value={resName}
                  onChangeText={setResName}
                />
              </View>

              {/* Select Sector Grid Chips */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Sector / Category <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 }}>
                  {RESOURCE_SECTORS.filter(s => s.id !== 'all').map((sect) => {
                    const isSelected = resSector === sect.id;
                    const sectColor = getDynamicColor(sect.color) || colors.primary;
                    return (
                      <TouchableOpacity
                        key={sect.id}
                        style={[
                          styles.sectorChip,
                          { marginRight: 0, marginVertical: 2 },
                          isSelected 
                            ? { backgroundColor: sectColor, borderColor: sectColor, borderWidth: 2 }
                            : { backgroundColor: colors.cardSurface, borderColor: colors.border, borderWidth: 1 }
                        ]}
                        onPress={() => setResSector(sect.id)}
                      >
                        <Ionicons 
                          name={sect.icon.replace('-outline', '')} 
                          size={14} 
                          color={isSelected ? '#FFFFFF' : sectColor} 
                          style={{ marginRight: 6 }} 
                        />
                        <Text style={[
                          styles.sectorChipText,
                          { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                          { fontWeight: '800' }
                        ]}>
                          {sect.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Physical Address */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Physical Address <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 1021 West Main St, Mitchell, IN 47446"
                  placeholderTextColor={colors.textLight}
                  value={resAddress}
                  onChangeText={setResAddress}
                />
              </View>

              {/* Phone Number */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. (812) 849-0113"
                  placeholderTextColor={colors.textLight}
                  value={resPhone}
                  onChangeText={setResPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Website */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Website URL</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. http://www.lifeindiana.org"
                  placeholderTextColor={colors.textLight}
                  value={resWebsite}
                  onChangeText={setResWebsite}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Brief Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description of Services <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="Provide precise details of assistance offered, pickup times, and eligibility..."
                  placeholderTextColor={colors.textLight}
                  value={resDesc}
                  onChangeText={setResDesc}
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
                  placeholder="e.g. nate@hoosieraiautomations.com"
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
                onPress={handleSendResourceSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.textOnDark} />
                ) : (
                  <>
                    <Ionicons name="mail-sharp" size={16} color={colors.textOnDark} style={{ marginRight: 6 }} />
                    <Text style={styles.formSubmitBtnText}>Submit Resource</Text>
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
    paddingHorizontal: SPACING.md,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.textPrimary,
    fontSize: 14,
  },
  ribbonContainer: {
    marginVertical: SPACING.sm,
  },
  ribbonContent: {
    paddingRight: SPACING.lg,
  },
  sectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: SPACING.sm,
    ...SHADOWS.light,
  },
  sectorBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectorIcon: {
    marginRight: 6,
  },
  sectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sectorTextActive: {
    color: colors.textOnDark,
  },
  resourcesScroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingBottom: SPACING.xl,
  },
  // Hero card — matches Limestone Businesses style
  heroCard: {
    backgroundColor: '#253357', // Deep navy welcome color
    borderRadius: 20,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...SHADOWS.medium,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#968469',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
  introBox: {
    backgroundColor: colors.cardSurface,
    borderRadius: 20,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  introSub: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 2,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  introDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  resCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: SPACING.sm,
    ...SHADOWS.light,
    position: 'relative',
  },
  resCardExpanded: {
    borderColor: colors.border,
    ...SHADOWS.medium,
  },
  cardMain: {
    padding: SPACING.md,
    paddingLeft: SPACING.md + 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    marginLeft: SPACING.sm,
    paddingRight: SPACING.xs,
  },
  resName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resCategory: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
    marginTop: 1,
  },
  resDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  drawerContainer: {
    paddingLeft: SPACING.md + 5,
    paddingRight: SPACING.md,
    paddingBottom: SPACING.md,
  },
  dashedBorder: {
    borderWidth: 0.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 1,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailIcon: {
    marginRight: SPACING.xs,
  },
  detailText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  linkText: {
    color: colors.accent,
    fontWeight: '600',
  },
  actionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    width: '48%',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 6,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: SPACING.sm,
  },
  addResourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184, 90, 56, 0.08)', // Southern Clay Terracotta
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 16,
  },
  addResourceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginLeft: 4,
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
  chipsScroll: {
    marginVertical: 4,
  },
  sectorChip: {
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
  sectorChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

