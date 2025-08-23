import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Group, getCurrencySymbol } from '@/types';
import { Plus, Users, DollarSign, CreditCard as Edit, Trash2, Search, Eye, EyeOff, Calendar } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { GroupModal } from '@/components/GroupModal';
import { AdBanner } from '@/components/AdBanner';
import { AD_CONFIG } from '@/constants/ads';
import { HistoryModal } from '@/components/HistoryModal';
import { router } from 'expo-router';

export default function GroupsScreen() {
  const { 
    isDarkMode, 
    groups, 
    participants,
    contributions,
    selectedCurrency,
    isLoading,
    refreshData,
    deleteGroup
  } = useApp();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedGroupForHistory, setSelectedGroupForHistory] = useState<number | null>(null);

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const cardBackground = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';

  const displayedGroups = showInactive ? groups : groups.filter(c => c.is_active);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setIsModalVisible(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsModalVisible(true);
  };

  const handleDeleteGroup = (group: Group) => {
    Alert.alert(
      'Delete Group',
      `Delete "${group.name}"? This will remove the group, its participants, and all transactions permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(group.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const getGroupStats = (group: Group) => {
    const groupParticipants = participants.filter(m => m.group_id === group.id && m.status === 'active');
    
    // Calculate actual contributions for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthContributions = contributions.filter(c => {
      const contribDate = new Date(c.date);
      return (
        c.group_id === group.id &&
        contribDate.getMonth() === currentMonth &&
        contribDate.getFullYear() === currentYear
      );
    });
    const totalCollected = currentMonthContributions.reduce((sum, contrib) => sum + contrib.amount, 0);
    
    return {
      participantCount: groupParticipants.length,
      totalCollected,
      progress: group.monthly_amount > 0 ? (totalCollected / group.monthly_amount) * 100 : 0
    };
  };

  const renderGroupCard = ({ item: group, index }: { item: Group; index: number }) => {
    const stats = getGroupStats(group);
    const progressColor = stats.progress >= 100 ? '#10b981' : stats.progress >= 75 ? '#f59e0b' : '#ef4444';
    const isInactive = !group.is_active;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/group/${group.id}`)}
      >
        <Animated.View 
        entering={FadeInUp.delay(index * 100)} 
        exiting={FadeOutUp}
        style={[
          styles.groupCard, 
          { backgroundColor: cardBackground },
          isInactive && { opacity: 0.6 }
        ]}
        >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>
              {group.name}
              {isInactive && ' (Inactive)'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: group.is_active ? '#10b981' : '#ef4444' }]}>
              <Text style={styles.statusText}>
                {group.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#667eea' }]}
              onPress={() => handleEditGroup(group)}
            >
              <Edit size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#10b981' }]}
              onPress={() => {
                setSelectedGroupForHistory(group.id);
                setIsHistoryModalVisible(true);
              }}
            >
              <Calendar size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleDeleteGroup(group)}
            >
              <Trash2 size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {group.description ? (
          <Text style={[styles.description, { color: subTextColor }]} numberOfLines={2}>
            {group.description}
          </Text>
        ) : null}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Users size={18} color="#667eea" />
            <Text style={[styles.statText, { color: textColor }]}>
              {stats.participantCount} participants
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
            {getCurrencySymbol(selectedCurrency)}{stats.totalCollected.toFixed(0)} of {getCurrencySymbol(selectedCurrency)}{group.monthly_amount.toFixed(0)}
          </Text>
        </View>
      </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Users size={64} color={subTextColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>No Groups Yet</Text>
      <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
        Create your first group to start managing contributions and participants
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddGroup}>
        <Text style={styles.emptyButtonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Groups</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Manage your group settings and track progress
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
        data={displayedGroups}
        renderItem={renderGroupCard}
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
        onPress={handleAddGroup}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <GroupModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        group={editingGroup}
      />

      {selectedGroupForHistory && (
        <HistoryModal
          visible={isHistoryModalVisible}
          onClose={() => {
            setIsHistoryModalVisible(false);
            setSelectedGroupForHistory(null);
          }}
          groupId={selectedGroupForHistory}
          isDarkMode={isDarkMode}
        />
      )}
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
  groupCard: {
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
  groupName: {
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