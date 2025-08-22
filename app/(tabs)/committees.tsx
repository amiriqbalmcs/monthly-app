import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Committee, getCurrencySymbol } from '@/types';
import { Plus, Users, DollarSign, CreditCard as Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { GroupModal } from '@/components/GroupModal';
import { AdBanner } from '@/components/AdBanner';
import { AD_CONFIG } from '@/constants/ads';
import { router } from 'expo-router';

export default function CommitteesScreen() {
  const { 
    isDarkMode, 
    committees, 
    members,
    selectedCurrency,
    isLoading,
    refreshData,
    deleteCommittee
  } = useApp();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const cardBackground = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';

  const displayedCommittees = showInactive ? committees : committees.filter(c => c.is_active);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddCommittee = () => {
    setEditingCommittee(null);
    setIsModalVisible(true);
  };

  const handleEditCommittee = (committee: Committee) => {
    setEditingCommittee(committee);
    setIsModalVisible(true);
  };

  const handleDeleteCommittee = (committee: Committee) => {
    Alert.alert(
      'Delete Committee',
      `Are you sure you want to delete "${committee.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommittee(committee.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete committee');
            }
          },
        },
      ]
    );
  };

  const getCommitteeStats = (committee: Committee) => {
    const committeeMembers = members.filter(m => m.committee_id === committee.id && m.status === 'active');
    const totalCollected = committeeMembers.reduce((sum, member) => sum + member.monthly_contribution, 0);
    
    return {
      memberCount: committeeMembers.length,
      totalCollected,
      progress: committee.monthly_amount > 0 ? (totalCollected / committee.monthly_amount) * 100 : 0
    };
  };

  const renderCommitteeCard = ({ item: committee, index }: { item: Committee; index: number }) => {
    const stats = getCommitteeStats(committee);
    const progressColor = stats.progress >= 100 ? '#10b981' : stats.progress >= 75 ? '#f59e0b' : '#ef4444';
    const isInactive = !committee.is_active;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/committee/${committee.id}`)}
      >
        <Animated.View 
        entering={FadeInUp.delay(index * 100)} 
        exiting={FadeOutUp}
        style={[
          styles.committeeCard, 
          { backgroundColor: cardBackground },
          isInactive && { opacity: 0.6 }
        ]}
        >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.committeeName, { color: textColor }]} numberOfLines={1}>
              {committee.name}
              {isInactive && ' (Inactive)'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: committee.is_active ? '#10b981' : '#ef4444' }]}>
              <Text style={styles.statusText}>
                {committee.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#667eea' }]}
              onPress={() => handleEditCommittee(committee)}
            >
              <Edit size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleDeleteCommittee(committee)}
            >
              <Trash2 size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {committee.description ? (
          <Text style={[styles.description, { color: subTextColor }]} numberOfLines={2}>
            {committee.description}
          </Text>
        ) : null}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Users size={18} color="#667eea" />
            <Text style={[styles.statText, { color: textColor }]}>
              {stats.memberCount} members
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <DollarSign size={18} color="#10b981" />
            <Text style={[styles.statText, { color: textColor }]}>
              {getCurrencySymbol(selectedCurrency)}{stats.totalCollected.toFixed(0)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: subTextColor }]}>
              Monthly Target Progress
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
                  width: `${Math.min(stats.progress, 100)}%`
                }
              ]} 
            />
          </View>
          
          <Text style={[styles.progressText, { color: subTextColor }]}>
            {getCurrencySymbol(selectedCurrency)}{stats.totalCollected.toFixed(0)} of {getCurrencySymbol(selectedCurrency)}{committee.monthly_amount.toFixed(0)}
          </Text>
        </View>
      </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Users size={64} color={subTextColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>No Committees Yet</Text>
      <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
        Create your first committee to start managing contributions and members
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddCommittee}>
        <Text style={styles.emptyButtonText}>Create Committee</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Committees</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Manage your committee settings and track progress
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: cardBackground }]}
            onPress={() => setShowInactive(!showInactive)}
          >
            {showInactive ? (
              <EyeOff size={16} color={subTextColor} />
            ) : (
              <Eye size={16} color={subTextColor} />
            )}
            <Text style={[styles.toggleText, { color: subTextColor }]}>
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {AD_CONFIG.SHOW_ADS && AD_CONFIG.SHOW_BANNER_ON_TABS && (
        <AdBanner isDarkMode={isDarkMode} />
      )}

      <FlatList
        data={displayedCommittees}
        renderItem={renderCommitteeCard}
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
        onPress={handleAddCommittee}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <GroupModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        committee={editingCommittee}
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
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  committeeCard: {
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
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  committeeName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
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
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  progressPercentage: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
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