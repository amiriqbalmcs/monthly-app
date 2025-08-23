import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { Participant, Contribution, getCurrencySymbol } from '@/types';
import { ArrowLeft, Users, DollarSign, TrendingUp, Calendar, Plus, CreditCard as Edit, Trash2, Mail, Phone, UserPlus } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ParticipantModal } from '@/components/ParticipantModal';
import { ContributionModal } from '@/components/ContributionModal';
import { PendingContributionsCard } from '@/components/PendingContributionsCard';
import { AdBanner } from '@/components/AdBanner';
import { AD_CONFIG } from '@/constants/ads';
import { HistoryModal } from '@/components/HistoryModal';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    isDarkMode, 
    groups, 
    participants, 
    contributions,
    selectedCurrency,
    deleteParticipant,
    deleteContribution
  } = useApp();

  const [activeTab, setActiveTab] = useState<'participants' | 'contributions'>('participants');
  const [isParticipantModalVisible, setIsParticipantModalVisible] = useState(false);
  const [isContributionModalVisible, setIsContributionModalVisible] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const cardBackground = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';

  const group = groups.find(c => c.id === parseInt(id || '0'));
  
  const groupParticipants = useMemo(() => 
    participants.filter(m => m.group_id === parseInt(id || '0')), 
    [participants, id]
  );

  const groupContributions = useMemo(() => 
    contributions.filter(c => c.group_id === parseInt(id || '0')), 
    [contributions, id]
  );

  const stats = useMemo(() => {
    const activeParticipants = groupParticipants.filter(m => m.status === 'active');
    const totalCollected = groupContributions.reduce((sum, c) => sum + c.amount, 0);
    const thisMonthContributions = groupContributions.filter(c => {
      const date = new Date(c.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const thisMonthTotal = thisMonthContributions.reduce((sum, c) => sum + c.amount, 0);
    const progress = group?.monthly_amount && group.monthly_amount > 0 ? (thisMonthTotal / group.monthly_amount) * 100 : 0;

    return {
      totalParticipants: groupParticipants.length,
      activeParticipants: activeParticipants.length,
      totalCollected,
      thisMonthTotal,
      progress: Math.min(progress, 100)
    };
  }, [groupParticipants, groupContributions, group]);

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Group Not Found</Text>
        </View>
      </View>
    );
  }

  const handleDeleteParticipant = (participant: Participant) => {
    Alert.alert(
      'Delete Participant',
      `Remove "${participant.name}" from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteParticipant(participant.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete participant');
            }
          },
        },
      ]
    );
  };

  const handleDeleteContribution = (contribution: Contribution) => {
    Alert.alert(
      'Delete Contribution',
      'Remove this contribution record?',
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

  const renderParticipantItem = ({ item: participant }: { item: Participant }) => {
    const statusColor = participant.status === 'active' ? '#10b981' : 
                       participant.status === 'pending' ? '#f59e0b' : '#6b7280';

    return (
      <View style={[styles.listItem, { backgroundColor: cardBackground }]}>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: textColor }]}>{participant.name}</Text>
          <View style={styles.itemDetails}>
            {participant.email && (
              <View style={styles.contactItem}>
                <Mail size={12} color={subTextColor} />
                <Text style={[styles.contactText, { color: subTextColor }]}>{participant.email}</Text>
              </View>
            )}
            {participant.phone && (
              <View style={styles.contactItem}>
                <Phone size={12} color={subTextColor} />
                <Text style={[styles.contactText, { color: subTextColor }]}>{participant.phone}</Text>
              </View>
            )}
          </View>
          <View style={styles.itemMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{participant.status}</Text>
            </View>
            <Text style={[styles.contributionAmount, { color: textColor }]}>
              {getCurrencySymbol(selectedCurrency)}{participant.monthly_contribution.toFixed(0)}/month
            </Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#667eea' }]}
            onPress={() => {
              setEditingParticipant(participant);
              setIsParticipantModalVisible(true);
            }}
          >
            <Edit size={14} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
            onPress={() => handleDeleteParticipant(participant)}
          >
            <Trash2 size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContributionItem = ({ item: contribution }: { item: Contribution }) => {
    const participant = participants.find(m => m.id === contribution.participant_id);

    return (
      <View style={[styles.listItem, { backgroundColor: cardBackground }]}>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: textColor }]}>{participant?.name || 'Unknown Participant'}</Text>
          <Text style={[styles.itemSubtitle, { color: subTextColor }]}>{contribution.note}</Text>
          <View style={styles.itemMeta}>
            <View style={styles.dateContainer}>
              <Calendar size={12} color={subTextColor} />
              <Text style={[styles.dateText, { color: subTextColor }]}>
                {new Date(contribution.date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.contributionAmount, { color: '#10b981' }]}>
              {getCurrencySymbol(selectedCurrency)}{contribution.amount.toFixed(0)}
            </Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#667eea' }]}
            onPress={() => {
              setEditingContribution(contribution);
              setIsContributionModalVisible(true);
            }}
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
    );
  };

  const progressColor = stats.progress >= 100 ? '#10b981' : stats.progress >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[styles.subtitle, { color: subTextColor }]} numberOfLines={2}>
            {group.description}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.historyButton, { backgroundColor: cardBackground }]}
          onPress={() => setIsHistoryModalVisible(true)}
        >
          <Calendar size={20} color="#667eea" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Animated.View entering={FadeInUp.delay(100)} style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Users size={20} color="#2563eb" />
            </View>
            <Text style={[styles.statNumber, { color: textColor }]}>{stats.activeParticipants}</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Active Participants</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)} style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <DollarSign size={20} color="#16a34a" />
            </View>
            <Text style={[styles.statNumber, { color: textColor }]}>
              {getCurrencySymbol(selectedCurrency)}{stats.thisMonthTotal.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>This Month</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)} style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <TrendingUp size={20} color="#d97706" />
            </View>
            <Text style={[styles.statNumber, { color: textColor }]}>
              {getCurrencySymbol(selectedCurrency)}{stats.totalCollected.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Total Collected</Text>
          </Animated.View>
        </View>

        {/* Progress Card */}
        <Animated.View entering={FadeInUp.delay(400)} style={[styles.progressCard, { backgroundColor: cardBackground }]}>
          <Text style={[styles.progressTitle, { color: textColor }]}>Monthly Target Progress</Text>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressAmount, { color: textColor }]}>
              {getCurrencySymbol(selectedCurrency)}{stats.thisMonthTotal.toFixed(0)} of {getCurrencySymbol(selectedCurrency)}{group.monthly_amount.toFixed(0)}
            </Text>
            <Text style={[styles.progressPercentage, { color: progressColor }]}>
              {stats.progress.toFixed(0)}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: progressColor,
                  width: `${stats.progress}%`
                }
              ]} 
            />
          </View>
        </Animated.View>

        <PendingContributionsCard isDarkMode={isDarkMode} groupId={parseInt(id || '0')} />

        {AD_CONFIG.SHOW_ADS && AD_CONFIG.SHOW_BANNER_ON_TABS && (
          <AdBanner isDarkMode={isDarkMode} />
        )}

        {/* Tab Navigation */}
        <Animated.View entering={FadeInUp.delay(500)} style={[styles.tabContainer, { backgroundColor: cardBackground }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'participants' && { backgroundColor: '#667eea' }
            ]}
            onPress={() => setActiveTab('participants')}
          >
            <Users size={18} color={activeTab === 'participants' ? '#ffffff' : subTextColor} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'participants' ? '#ffffff' : subTextColor }
            ]}>
              Participants ({groupParticipants.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'contributions' && { backgroundColor: '#667eea' }
            ]}
            onPress={() => setActiveTab('contributions')}
          >
            <DollarSign size={18} color={activeTab === 'contributions' ? '#ffffff' : subTextColor} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'contributions' ? '#ffffff' : subTextColor }
            ]}>
              Contributions ({groupContributions.length})
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.contentContainer}>
          {activeTab === 'participants' ? (
            <FlatList
              data={groupParticipants}
              renderItem={renderParticipantItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <UserPlus size={48} color={subTextColor} />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No Participants</Text>
                  <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
                    Add participants to this group to start tracking contributions
                  </Text>
                </View>
              )}
            />
          ) : (
            <FlatList
              data={groupContributions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              renderItem={renderContributionItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <DollarSign size={48} color={subTextColor} />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No Contributions</Text>
                  <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
                    Record participant contributions to track group progress
                  </Text>
                </View>
              )}
            />
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'participants') {
            setEditingParticipant(null);
            setIsParticipantModalVisible(true);
          } else {
            setEditingContribution(null);
            setIsContributionModalVisible(true);
          }
        }}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <ParticipantModal
        visible={isParticipantModalVisible}
        onClose={() => setIsParticipantModalVisible(false)}
        participant={editingParticipant}
      />

      <ContributionModal
        visible={isContributionModalVisible}
        onClose={() => setIsContributionModalVisible(false)}
        contribution={editingContribution}
        groupId={group.id}
      />

      <HistoryModal
        visible={isHistoryModalVisible}
        onClose={() => setIsHistoryModalVisible(false)}
        groupId={group.id}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  progressCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  progressPercentage: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  itemDetails: {
    marginBottom: 8,
    gap: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  contributionAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  itemActions: {
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
  fab: {
    position: 'absolute',
    bottom: 40,
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
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});