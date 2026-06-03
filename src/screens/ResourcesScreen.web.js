import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Linking, Modal, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, SHADOWS } from '../styles/theme';
import { useAppContext } from '../utils/AppContext';
import { WEB3FORMS_ACCESS_KEY, CONTACT_EMAIL } from '../utils/config';

const RESOURCE_SECTORS = [
  { id: 'all', name: 'All Services', icon: 'grid-outline' },
  { id: 'health', name: 'Health & Wellness', icon: 'heart-outline', color: '#185955' },
  { id: 'gov', name: 'Gov & Safety', icon: 'library-outline', color: '#5A7A61' },
  { id: 'food', name: 'Food Programs', icon: 'restaurant-outline', color: '#968469' },
  { id: 'shelter', name: 'Shelters & Housing', icon: 'home-outline', color: '#8B5E3C' },
  { id: 'transit', name: 'Public Transit', icon: 'car-outline', color: '#4A6070' },
];

const BEDFORD_RESOURCES = [
  {
    id: 'res_1',
    name: 'FSSA Bedford Family Resources',
    sector: 'gov',
    categoryName: 'City Resources',
    color: '#5A7A61',
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
    color: '#5A7A61',
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
    color: '#5A7A61',
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
    color: '#5A7A61',
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
    color: '#5A7A61',
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
    color: '#185955',
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
    color: '#185955',
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
    color: '#185955',
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
    color: '#185955',
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
    color: '#185955',
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
    color: '#8B5E3C',
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
    color: '#8B5E3C',
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
    color: '#8B5E3C',
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
    color: '#968469',
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
    color: '#968469',
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
    color: '#4A6070',
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
    color: '#5A7A61',
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
    color: '#5A7A61',
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
    color: '#968469',
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
    color: '#968469',
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
    color: '#968469',
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
    color: '#5A7A61',
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
    color: '#5A7A61',
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
    color: '#5A7A61',
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
    color: '#185955',
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
    color: '#968469',
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
    color: '#5A7A61',
    icon: 'school',
    description: 'Head Start early childhood development and preschool educational center supported by Hoosier Uplands.',
    phone: '812-849-4447',
    address: '117 W Grissom Ave, Mitchell, IN 47446',
    url: 'https://www.hoosieruplands.org/',
  },
];

export default function ResourcesScreen({ route, navigation }) {
  const {
    isDarkMode,
    colors,
    globalStyles,
    typography,
    profile,
    showToast
  } = useAppContext();

  const { width } = useWindowDimensions();
  const isDesktop = width > 850;
  const styles = getStyles(colors, isDesktop);

  const getDynamicColor = (baseColor) => {
    if (!isDarkMode) return baseColor;
    const colorMap = {
      '#185955': colors.primary,
      '#5A7A61': '#A5B2AA',
      '#968469': colors.accent,
      '#8B5E3C': '#F2A541',
      '#4A6070': '#A0B2C6',
    };
    return colorMap[baseColor] || baseColor;
  };

  const [activeSector, setActiveSector] = useState('all');

  // Resource Submission Form States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [resName, setResName] = useState('');
  const [resSector, setResSector] = useState('');
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
      Alert.alert("Required Fields", "Please fill in all required fields.");
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
- Description: ${resDesc}
- Contact Email: ${submitterEmail}`;

    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
      triggerResMailtoFallback(emailBody);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Limestone App - Resource Submission: ${resName}`,
          email: submitterEmail,
          message: emailBody,
          resourceName: resName
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
        showToast('Resource submitted for verification!', 'success');
      } else {
        triggerResMailtoFallback(emailBody);
      }
    } catch (err) {
      triggerResMailtoFallback(emailBody);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerResMailtoFallback = (emailBody) => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Limestone App - Resource Submission: ${resName}`)}&body=${encodeURIComponent(emailBody)}`;
    Linking.openURL(mailtoUrl)
      .then(() => setSubmitSuccess(true))
      .catch(() => {
        Alert.alert("Submission Failed", `Please email details to ${CONTACT_EMAIL}`);
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

  const handleCall = (phoneNumber) => {
    if (!phoneNumber || phoneNumber === 'N/A') return;
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleOpenMap = (address) => {
    if (!address || address === 'N/A') return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  };

  const handleOpenWeb = (url) => {
    if (!url || url === 'N/A') return;
    Linking.openURL(url);
  };

  // Filter
  const filteredResources = BEDFORD_RESOURCES.filter(res => {
    const matchesSector = activeSector === 'all' || res.sector === activeSector;

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

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
      {/* Search Header Bar */}
      <View style={styles.topControlHeader}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="heart-half" size={24} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.mainTitle}>Direct Assistance & Resources</Text>
        </View>

        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.accent + '15' }]} 
          onPress={() => setShowSubmitModal(true)}
        >
          <Ionicons name="add-circle" size={16} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={[styles.addBtnText, { color: colors.accent }]}>Submit Service</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Welcome Board */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="medkit-sharp" size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.heroBadgeText}>COUNTY PUBLIC SAFETY</Text>
          </View>
          <Text style={styles.heroTitle}>Lawrence County Assistance</Text>
          <Text style={styles.heroSub}>
            Quick, reliable connection to local public clinics, emergency food bank pantries, shelters, and city utility departments.
          </Text>
        </View>

        {/* Categories horizontal menu */}
        <View style={styles.sectorBar}>
          {RESOURCE_SECTORS.map((sector) => {
            const isActive = activeSector === sector.id;
            const sectorColor = getDynamicColor(sector.color) || colors.textSecondary;
            return (
              <TouchableOpacity
                key={sector.id}
                style={[
                  styles.sectorPill,
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setActiveSector(sector.id)}
              >
                <Ionicons 
                  name={sector.icon} 
                  size={14} 
                  color={isActive ? '#FFFFFF' : sectorColor} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[styles.sectorPillText, isActive && { color: '#FFFFFF', fontWeight: '800' }]}>
                  {sector.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <View style={styles.resourcesWebGrid}>
            {filteredResources.map((res) => {
              const resColor = getDynamicColor(res.color);
              return (
                <View key={res.id} style={[styles.resourceWebCard, { borderTopColor: resColor }]}>
                  <View style={styles.resCardHeader}>
                    <View style={[styles.resIconBox, { backgroundColor: resColor + '15' }]}>
                      <Ionicons name={res.icon || 'heart'} size={20} color={resColor} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.resName}>{res.name}</Text>
                      <Text style={styles.resCategory}>{res.categoryName}</Text>
                    </View>
                  </View>

                  <Text style={styles.resDesc}>{res.description}</Text>

                  <View style={styles.resDetailsBox}>
                    <View style={styles.resDetailRow}>
                      <Ionicons name="location-outline" size={13} color={colors.accent} style={{ marginRight: 6 }} />
                      <Text style={styles.resDetailText} numberOfLines={1}>{res.address}</Text>
                    </View>
                    {res.phone && res.phone !== 'N/A' && (
                      <View style={[styles.resDetailRow, { marginTop: 4 }]}>
                        <Ionicons name="call-outline" size={13} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.resDetailText}>{res.phone}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.resCardActions}>
                    {res.phone && res.phone !== 'N/A' && (
                      <TouchableOpacity 
                        style={[styles.resActionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleCall(res.phone)}
                      >
                        <Ionicons name="call" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.resActionBtnText}>Call</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                      style={[styles.resActionBtn, styles.resMapBtn]}
                      onPress={() => handleOpenMap(res.address)}
                    >
                      <Ionicons name="map" size={11} color={colors.textPrimary} style={{ marginRight: 4 }} />
                      <Text style={[styles.resActionBtnText, { color: colors.textPrimary }]}>Directions</Text>
                    </TouchableOpacity>

                    {res.url ? (
                      <TouchableOpacity 
                        style={[styles.resActionBtn, styles.resWebBtn]}
                        onPress={() => handleOpenWeb(res.url)}
                      >
                        <Ionicons name="open-outline" size={11} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.resActionBtnText, { color: colors.primary }]}>Apply</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="medkit-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No Services Scheduled</Text>
            <Text style={styles.emptySub}>We couldn't find any resources matching your selected sector.</Text>
          </View>
        )}
      </ScrollView>

      {/* ── SUBMIT SERVICE MODAL ── */}
      <Modal
        visible={showSubmitModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleResetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Public Assistance Program</Text>
              <TouchableOpacity onPress={handleResetForm}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {submitSuccess ? (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ marginBottom: 12 }} />
                <Text style={styles.successTitle}>Service Received!</Text>
                <Text style={styles.successSub}>Thank you. The county coordinator will review and list this public program soon.</Text>
                <TouchableOpacity style={styles.closeSuccessBtn} onPress={handleResetForm}>
                  <Text style={styles.closeSuccessBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Service Name *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. Bedford City Food Kitchen Center"
                    placeholderTextColor={colors.textLight}
                    value={resName}
                    onChangeText={setResName}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Service Sector *</Text>
                  <View style={styles.catChipsWrapper}>
                    {RESOURCE_SECTORS.filter(s => s.id !== 'all').map(s => (
                      <TouchableOpacity 
                        key={s.id}
                        style={[styles.catChip, resSector === s.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => setResSector(s.id)}
                      >
                        <Text style={[styles.catChipText, resSector === s.id && { color: '#FFFFFF' }]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Physical Address *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. 1204 I St, Bedford, IN"
                    placeholderTextColor={colors.textLight}
                    value={resAddress}
                    onChangeText={setResAddress}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. (812) 279-0000"
                    placeholderTextColor={colors.textLight}
                    value={resPhone}
                    onChangeText={setResPhone}
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Official Link URL</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. https://www.in.gov/fssa"
                    placeholderTextColor={colors.textLight}
                    value={resWebsite}
                    onChangeText={setResWebsite}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Service Description *</Text>
                  <TextInput 
                    style={[styles.modalInput, { height: 60 }]} 
                    placeholder="Describe the application requirements, hours of operation, and service details..."
                    placeholderTextColor={colors.textLight}
                    value={resDesc}
                    onChangeText={setResDesc}
                    multiline
                  />
                </View>

                <View style={styles.formInputGroup}>
                  <Text style={styles.inputLabel}>Your Email *</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="e.g. advocate@mycare.org"
                    placeholderTextColor={colors.textLight}
                    value={submitterEmail}
                    onChangeText={setSubmitterEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitFormBtn, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleSendResourceSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitFormBtnText}>Submit Service</Text>
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
  scrollContainer: {
    padding: 24,
    paddingBottom: 80,
  },
  heroCard: {
    backgroundColor: colors.primary + '10',
    padding: 24,
    borderRadius: 14,
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  heroSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  sectorBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  sectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectorPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  resourcesWebGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  resourceWebCard: {
    width: isDesktop ? '31.5%' : '48%',
    minWidth: 260,
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    padding: 20,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.light,
  },
  resCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  resCategory: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  resDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    height: 48,
    marginBottom: 12,
  },
  resDetailsBox: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  resDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resDetailText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  resMapBtn: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resWebBtn: {
    backgroundColor: colors.primary + '12',
  },
  resActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  emptySub: {
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
  catChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  catChipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
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
