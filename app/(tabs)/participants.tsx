import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Member, getCurrencySymbol } from '@/types';
import { Plus, UserPlus, Search, CreditCard as Edit, Trash2, Mail, Phone } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { ParticipantModal } from '@/components/ParticipantModal';
import { AdBanner } from '@/components/AdBanner';
import { AD_CONFIG } from '@/constants/ads';

export default function MembersScreen() {
  const { 
    isDarkMode, 
    members,
    committees,
    selectedCurrency,
    isLoading,
    refreshData,
    deleteMember
  } = useApp();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const cardBackground = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBackground = isDarkMode ? '#374151' : '#f3f4f6';

  const filteredMembers = useMemo(() => {
    return members.filter(member => 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsModalVisible(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsModalVisible(true);
  };

  const handleDeleteMember = (member: Member) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to remove "${member.name}" from the committee?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMember(member.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete member');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'inactive': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderMemberCard = ({ item: member, index }: { item: Member; index: number }) => {
    const committee = committees.find(c => c.id === member.committee_id);
    const statusColor = getStatusColor(member.status);

    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 100)} 
        exiting={FadeOutUp}
        style={[styles.memberCard, { backgroundColor: cardBackground }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            <Text style={[styles.memberName, { color: textColor }]} numberOfLines={1}>
              {member.name}
            </Text>
            <Text style={[styles.committeeName, { color: subTextColor }]} numberOfLines={1}>
              {committee?.name || 'Unknown Committee'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{member.status}</Text>
            </View>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#667eea' }]}
              onPress={() => handleEditMember(member)}
            >
              <Edit size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleDeleteMember(member)}
            >
              <Trash2 size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contactInfo}>
          {member.email ? (
            <View style={styles.contactItem}>
              <Mail size={16} color={subTextColor} />
              <Text style={[styles.contactText, { color: subTextColor }]} numberOfLines={1}>
                {member.email}
              </Text>
            </View>
          ) : null}
          
          {member.phone ? (
            <View style={styles.contactItem}>
              <Phone size={16} color={subTextColor} />
              <Text style={[styles.contactText, { color: subTextColor }]} numberOfLines={1}>
                {member.phone}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.contributionInfo}>
          <Text style={[styles.contributionLabel, { color: subTextColor }]}>
            Monthly Contribution
          </Text>
          <Text style={[styles.contributionAmount, { color: textColor }]}>
            {getCurrencySymbol(selectedCurrency)}{member.monthly_contribution.toFixed(0)}
          </Text>
        </View>

        <Text style={[styles.joinedDate, { color: subTextColor }]}>
          Joined {new Date(member.joined_date).toLocaleDateString()}
        </Text>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <UserPlus size={64} color={subTextColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>No Members Yet</Text>
      <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
        Add members to your committees to start tracking contributions
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddMember}>
        <Text style={styles.emptyButtonText}>Add Member</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Members</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Manage committee members and track contributions
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: inputBackground }]}>
        <Search size={20} color={subTextColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search members..."
          placeholderTextColor={subTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {AD_CONFIG.SHOW_ADS && AD_CONFIG.SHOW_BANNER_ON_TABS && (
        <AdBanner isDarkMode={isDarkMode} />
      )}

      <FlatList
        data={filteredMembers}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddMember}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <ParticipantModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        member={editingMember}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  memberCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  memberInfo: {
    flex: 1,
    marginRight: 12,
  },
  memberName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  committeeName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    marginBottom: 16,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  contributionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contributionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  contributionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  joinedDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});