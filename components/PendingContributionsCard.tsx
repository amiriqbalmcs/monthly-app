import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { getCurrencySymbol } from '@/types';
import { CircleAlert as AlertCircle, Calendar, User, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

interface PendingContributionsCardProps {
  isDarkMode: boolean;
  groupId?: number; // Optional: filter by specific group
}

export const PendingContributionsCard: React.FC<PendingContributionsCardProps> = ({ 
  isDarkMode, 
  groupId 
}) => {
  const { participants, contributions, groups, selectedCurrency } = useApp();

  const pendingData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter participants by group if specified
    const relevantParticipants = groupId 
      ? participants.filter(m => m.group_id === groupId && m.status === 'active')
      : participants.filter(m => m.status === 'active');

    const pendingParticipants = relevantParticipants.filter(participant => {
      // Check if participant has contributed this month
      const hasContributedThisMonth = contributions.some(contribution => {
        const contribDate = new Date(contribution.date);
        return (
          contribution.participant_id === participant.id &&
          contribDate.getMonth() === currentMonth &&
          contribDate.getFullYear() === currentYear
        );
      });

      return !hasContributedThisMonth;
    });

    const totalPendingAmount = pendingParticipants.reduce((sum, participant) => sum + participant.monthly_contribution, 0);

    return {
      participants: pendingParticipants,
      count: pendingParticipants.length,
      totalAmount: totalPendingAmount
    };
  }, [participants, contributions, groupId, selectedCurrency]);

  const cardBackground = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';

  if (pendingData.count === 0) {
    return (
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
            <AlertCircle size={20} color="#16a34a" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: textColor }]}>All Caught Up! 🎉</Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>
              All participants have contributed this month
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const renderPendingParticipant = ({ item: participant }: { item: any }) => {
    const group = groups.find(c => c.id === participant.group_id);
    
    return (
      <TouchableOpacity 
        style={styles.participantItem}
        onPress={() => {
          // Navigate to add contribution for this participant
          router.push(`/group/${participant.group_id}`);
        }}
      >
        <View style={styles.participantInfo}>
          <Text style={[styles.participantName, { color: textColor }]} numberOfLines={1}>
            {participant.name}
          </Text>
          {!groupId && (
            <Text style={[styles.groupName, { color: subTextColor }]} numberOfLines={1}>
              {group?.name}
            </Text>
          )}
        </View>
        <Text style={[styles.pendingAmount, { color: '#ef4444' }]}>
          {getCurrencySymbol(selectedCurrency)}{participant.monthly_contribution.toFixed(0)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
          <AlertCircle size={20} color="#d97706" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: textColor }]}>
            Pending Contributions ({pendingData.count})
          </Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            {getCurrencySymbol(selectedCurrency)}{pendingData.totalAmount.toFixed(0)} expected this month
          </Text>
        </View>
      </View>

      <View style={styles.monthIndicator}>
        <Calendar size={14} color={subTextColor} />
        <Text style={[styles.monthText, { color: subTextColor }]}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <FlatList
        data={pendingData.participants.slice(0, 5)} // Show first 5
        renderItem={renderPendingParticipant}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {pendingData.count > 5 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/(tabs)/participants')}
        >
          <Text style={styles.viewAllText}>
            View all {pendingData.count} pending participants
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  monthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  monthText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  participantInfo: {
    flex: 1,
    marginRight: 12,
  },
  participantName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  groupName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  pendingAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#667eea',
  },
});