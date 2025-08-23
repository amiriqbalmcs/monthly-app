import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useApp } from '@/contexts/AppContext';
import { getCurrencySymbol } from '@/types';
import { TrendingUp, Users, DollarSign, UserPlus } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AdBanner } from '@/components/AdBanner';
import { PendingContributionsCard } from '@/components/PendingContributionsCard';
import { AD_CONFIG } from '@/constants/ads';
import { HistoryModal } from '@/components/HistoryModal';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { 
    isDarkMode, 
    groups, 
    participants, 
    contributions, 
    selectedCurrency, 
    isLoading 
  } = useApp();

  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedGroupForHistory, setSelectedGroupForHistory] = useState<number | null>(null);

  const stats = useMemo(() => {
    const totalGroups = groups.filter(c => c.is_active).length;
    const totalParticipants = participants.filter(m => m.status === 'active').length;
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    const thisMonthContributions = contributions
      .filter(c => {
        const date = new Date(c.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      totalGroups,
      totalParticipants,
      totalContributions,
      thisMonthContributions
    };
  }, [groups, participants, contributions]);

  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: 0
      };
    }).reverse();

    contributions.forEach(contrib => {
      const date = new Date(contrib.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      const monthData = last6Months.find(m => m.month === monthKey);
      if (monthData) {
        monthData.amount += contrib.amount;
      }
    });

    return {
      labels: last6Months.map(m => m.month),
      datasets: [{
        data: last6Months.map(m => m.amount),
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        strokeWidth: 3
      }]
    };
  }, [contributions]);

  const recentContributions = useMemo(() => {
    return contributions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [contributions]);

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const cardBackground = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Welcome back! Here's your group overview
        </Text>
      </View>

      {AD_CONFIG.SHOW_ADS && AD_CONFIG.SHOW_BANNER_ON_TABS && (
        <AdBanner isDarkMode={isDarkMode} />
      )}

      <View style={styles.statsGrid}>
        <Animated.View entering={FadeInUp.delay(100)} style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
            <Users size={24} color="#2563eb" />
          </View>
          <Text style={[styles.statNumber, { color: textColor }]}>{stats.totalGroups}</Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Active Groups</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
            <UserPlus size={24} color="#16a34a" />
          </View>
          <Text style={[styles.statNumber, { color: textColor }]}>{stats.totalParticipants}</Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Active Participants</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
            <DollarSign size={24} color="#d97706" />
          </View>
          <Text style={[styles.statNumber, { color: textColor }]}>
            {getCurrencySymbol(selectedCurrency)}{stats.thisMonthContributions.toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>This Month</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#e0e7ff' }]}>
            <TrendingUp size={24} color="#667eea" />
          </View>
          <Text style={[styles.statNumber, { color: textColor }]}>
            {getCurrencySymbol(selectedCurrency)}{stats.totalContributions.toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Total Collected</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(500)} style={[styles.chartCard, { backgroundColor: cardBackground }]}>
        <Text style={[styles.chartTitle, { color: textColor }]}>Contribution Trends</Text>
        <Text style={[styles.chartSubtitle, { color: subTextColor }]}>Last 6 months</Text>
        
        {chartData.datasets[0].data.some(val => val > 0) ? (
          <BarChart
            data={chartData}
            width={screenWidth - 60}
            height={200}
            chartConfig={{
              backgroundColor: cardBackground,
              backgroundGradientFrom: cardBackground,
              backgroundGradientTo: cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
              labelColor: () => subTextColor,
              style: {
                borderRadius: 16,
              },
              propsForLabels: {
                fontFamily: 'Inter-Medium',
                fontSize: 12,
              },
              propsForVerticalLabels: {
                fontFamily: 'Inter-Medium',
                fontSize: 12,
              },
            }}
            style={[styles.chart, { alignSelf: 'center' }]}
            showValuesOnTopOfBars={true}
            fromZero={true}
            withInnerLines={false}
            withOuterLines={false}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: subTextColor }]}>
              No contribution data available
            </Text>
          </View>
        )}
      </Animated.View>

      <PendingContributionsCard isDarkMode={isDarkMode} />

      <Animated.View entering={FadeInUp.delay(600)} style={[styles.recentCard, { backgroundColor: cardBackground }]}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: textColor }]}>Recent Contributions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentContributions.length > 0 ? (
          recentContributions.map((contribution, index) => {
            const participant = participants.find(m => m.id === contribution.participant_id);
            const group = groups.find(c => c.id === contribution.group_id);
            
            return (
              <TouchableOpacity 
                key={contribution.id} 
                style={styles.contributionItem}
                onPress={() => {
                  setSelectedGroupForHistory(contribution.group_id);
                  setIsHistoryModalVisible(true);
                }}
              >
                <View style={styles.contributionInfo}>
                  <Text style={[styles.participantName, { color: textColor }]}>
                    {participant?.name || 'Unknown Participant'}
                  </Text>
                  <Text style={[styles.groupName, { color: subTextColor }]}>
                    {group?.name || 'Unknown Group'}
                  </Text>
                  <Text style={[styles.contributionDate, { color: subTextColor }]}>
                    {new Date(contribution.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.contributionAmount, { color: textColor }]}>
                  {getCurrencySymbol(selectedCurrency)}{contribution.amount.toFixed(0)}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: subTextColor }]}>
              No contributions yet
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={{ height: 120 }} />
    

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
  );
}
      
</ScrollView>
    
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    marginRight: '2%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  chartCard: {
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
  chartTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  recentCard: {
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
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#667eea',
  },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  contributionInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  groupName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  contributionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  contributionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});