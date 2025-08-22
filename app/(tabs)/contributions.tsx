import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Contribution, getCurrencySymbol } from '@/types';
import { Plus, DollarSign, Search, CreditCard as Edit, Trash2, Calendar, User, Users } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { ContributionModal } from '@/components/ContributionModal';
import { AdBanner } from '@/components/AdBanner';
import { AD_CONFIG } from '@/constants/ads';

export default function ContributionsScreen() {
  const { 
    isDarkMode, 
    contributions,
    participants,
    groups,
    selectedCurrency,
    isLoading,
    refreshData,
    deleteContribution
  } = useApp();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const cardBackground = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBackground = isDarkMode ? '#374151' : '#f3f4f6';

  const filteredContributions = useMemo(() => {
    return contributions.filter(contribution => {
      const participant = participants.find(m => m.id === contribution.participant_id);
      const group = groups.find(c => c.id === contribution.group_id);
      
      return (
        participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contribution.note.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [contributions, participants, groups, searchQuery]);

  const monthlyStats = useMemo(() => {
    const thisMonth = new Date();
    const thisMonthContributions = contributions.filter(c => {
      const date = new Date(c.date);
      return date.getMonth() === thisMonth.getMonth() && 
             date.getFullYear() === thisMonth.getFullYear();
    });

    return {
      count: thisMonthContributions.length,
      total: thisMonthContributions.reduce((sum, c) => sum + c.amount, 0)
    };
  }, [contributions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddContribution = () => {
    setEditingContribution(null);
    setIsModalVisible(true);
  };

  const handleEditContribution = (contribution: Contribution) => {
    setEditingContribution(contribution);
    setIsModalVisible(true);
  };

  const handleDeleteContribution = (contribution: Contribution) => {
    Alert.alert(
      'Delete Contribution',
      'Are you sure you want to delete this contribution record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContribution(contribution.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contribution');
            }
          },
        },
      ]
    );
  };

  const renderContributionCard = ({ item: contribution, index }: { item: Contribution; index: number }) => {
    const participant = participants.find(m => m.id === contribution.participant_id);
    const group = groups.find(c => c.id === contribution.group_id);

    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 100)} 
        exiting={FadeOutUp}
        style={[styles.contributionCard, { backgroundColor: cardBackground }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.contributionInfo}>
            <Text style={[styles.participantName, { color: textColor }]} numberOfLines={1}>
              {participant?.name || 'Unknown Participant'}
            </Text>
            <Text style={[styles.groupName, { color: subTextColor }]} numberOfLines={1}>
              {group?.name || 'Unknown Group'}
            </Text>
            <View style={styles.dateContainer}>
              <Calendar size={14} color={subTextColor} />
              <Text style={[styles.contributionDate, { color: subTextColor }]}>
                {new Date(contribution.date).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={[styles.contributionAmount, { color: '#10b981' }]}>
              {getCurrencySymbol(selectedCurrency)}{contribution.amount.toFixed(0)}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#667eea' }]}
                onPress={() => handleEditContribution(contribution)}
              >
                <Edit size={14} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                onPress={() => handleDeleteContribution(contribution)}
              >
                <Trash2 size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {contribution.note ? (
          <Text style={[styles.contributionNote, { color: subTextColor }]} numberOfLines={2}>
            {contribution.note}
          </Text>
        ) : null}
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <DollarSign size={64} color={subTextColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>No Contributions Yet</Text>
      <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
        Start recording participant contributions to track group progress
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddContribution}>
        <Text style={styles.emptyButtonText}>Record Contribution</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Contributions</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Track and manage participant payments
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
            <DollarSign size={20} color="#2563eb" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: textColor }]}>
              {getCurrencySymbol(selectedCurrency)}{monthlyStats.total.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>This Month</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
            <Users size={20} color="#16a34a" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: textColor }]}>
              {monthlyStats.count}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Payments</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: inputBackground }]}>
        <Search size={20} color={subTextColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search contributions..."
          placeholderTextColor={subTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {AD_CONFIG.SHOW_ADS && AD_CONFIG.SHOW_BANNER_ON_TABS && (
        <AdBanner isDarkMode={isDarkMode} />
      )}

      <FlatList
        data={filteredContributions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        renderItem={renderContributionCard}
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
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddContribution}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <ContributionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        contribution={editingContribution}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
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
  contributionCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contributionInfo: {
    flex: 1,
    marginRight: 12,
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  groupName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contributionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  contributionAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributionNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
    fontStyle: 'italic',
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