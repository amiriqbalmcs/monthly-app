import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useApp } from '@/contexts/AppContext';
import { getCurrencySymbol } from '@/types';
import { X, Calendar, ChevronLeft, ChevronRight, TrendingUp, Users, DollarSign } from 'lucide-react-native';

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: number;
  isDarkMode: boolean;
}

const screenWidth = Dimensions.get('window').width;

export const HistoryModal: React.FC<HistoryModalProps> = ({
  visible,
  onClose,
  groupId,
  isDarkMode
}) => {
  const { groups, participants, contributions, selectedCurrency } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const backgroundColor = isDarkMode ? '#111827' : '#ffffff';
  const cardBackground = isDarkMode ? '#1f2937' : '#f9fafb';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const borderColor = isDarkMode ? '#374151' : '#e5e7eb';

  const group = groups.find(g => g.id === groupId);
  const groupParticipants = participants.filter(p => p.group_id === groupId);

  const historicalData = useMemo(() => {
    if (!group) return { months: [], chartData: null };

    const groupCreatedDate = new Date(group.created_at);
    const currentDate = new Date();
    const months = [];

    // Generate all months from group creation to current month
    let date = new Date(groupCreatedDate.getFullYear(), groupCreatedDate.getMonth(), 1);
    while (date <= currentDate) {
      months.push(new Date(date));
      date.setMonth(date.getMonth() + 1);
    }

    // Prepare chart data for last 6 months
    const last6Months = months.slice(-6);
    const chartLabels = last6Months.map(date => 
      date.toLocaleDateString('en-US', { month: 'short' })
    );
    
    const chartData = last6Months.map(date => {
      const monthContributions = contributions.filter(c => {
        const contribDate = new Date(c.date);
        return (
          c.group_id === groupId &&
          contribDate.getMonth() === date.getMonth() &&
          contribDate.getFullYear() === date.getFullYear()
        );
      });
      return monthContributions.reduce((sum, c) => sum + c.amount, 0);
    });

    return {
      months: months.reverse(), // Most recent first
      chartData: {
        labels: chartLabels,
        datasets: [{
          data: chartData.length > 0 ? chartData : [0],
          color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
          strokeWidth: 3
        }]
      }
    };
  }, [group, contributions, groupId]);

  const selectedMonthData = useMemo(() => {
    const monthContributions = contributions.filter(c => {
      const contribDate = new Date(c.date);
      return (
        c.group_id === groupId &&
        contribDate.getMonth() === selectedMonth.getMonth() &&
        contribDate.getFullYear() === selectedMonth.getFullYear()
      );
    });

    const participantContributions = groupParticipants.map(participant => {
      const participantContribs = monthContributions.filter(c => c.participant_id === participant.id);
      const totalAmount = participantContribs.reduce((sum, c) => sum + c.amount, 0);
      
      return {
        participant,
        contributions: participantContribs,
        totalAmount,
        hasContributed: participantContribs.length > 0
      };
    });

    const totalCollected = monthContributions.reduce((sum, c) => sum + c.amount, 0);
    const activeParticipants = groupParticipants.filter(p => p.status === 'active').length;
    const contributedParticipants = participantContributions.filter(pc => pc.hasContributed).length;

    return {
      totalCollected,
      contributionCount: monthContributions.length,
      activeParticipants,
      contributedParticipants,
      participantContributions,
      progress: group?.monthly_amount ? (totalCollected / group.monthly_amount) * 100 : 0
    };
  }, [selectedMonth, contributions, groupId, groupParticipants, group]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    // Don't go beyond group creation date or future
    const groupCreatedDate = new Date(group?.created_at || '');
    const currentDate = new Date();
    
    if (newDate >= new Date(groupCreatedDate.getFullYear(), groupCreatedDate.getMonth(), 1) && 
        newDate <= currentDate) {
      setSelectedMonth(newDate);
    }
  };

  const canNavigatePrev = useMemo(() => {
    if (!group) return false;
    const groupCreatedDate = new Date(group.created_at);
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return prevMonth >= new Date(groupCreatedDate.getFullYear(), groupCreatedDate.getMonth(), 1);
  }, [selectedMonth, group]);

  const canNavigateNext = useMemo(() => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const currentDate = new Date();
    return nextMonth <= currentDate;
  }, [selectedMonth]);

  const renderParticipantHistory = ({ item }: { item: any }) => {
    const statusColor = item.hasContributed ? '#10b981' : '#ef4444';
    
    return (
      <View style={[styles.participantHistoryItem, { backgroundColor: cardBackground }]}>
        <View style={styles.participantInfo}>
          <Text style={[styles.participantName, { color: textColor }]} numberOfLines={1}>
            {item.participant.name}
          </Text>
          <Text style={[styles.contributionCount, { color: subTextColor }]}>
            {item.contributions.length} contribution{item.contributions.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.totalAmount, { color: statusColor }]}>
            {getCurrencySymbol(selectedCurrency)}{item.totalAmount.toFixed(0)}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
      </View>
    );
  };

  if (!group) return null;

  const progressColor = selectedMonthData.progress >= 100 ? '#10b981' : 
                       selectedMonthData.progress >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Group History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <FlatList
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <>
              {/* Chart Section */}
              <View style={[styles.chartSection, { backgroundColor: cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>6-Month Trend</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Contribution patterns over time
                </Text>
                
                {historicalData.chartData && historicalData.chartData.datasets[0].data.some(val => val > 0) ? (
                  <BarChart
                    data={historicalData.chartData}
                    width={screenWidth - 100}
                    height={180}
                    chartConfig={{
                      backgroundColor: cardBackground,
                      backgroundGradientFrom: cardBackground,
                      backgroundGradientTo: cardBackground,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                      labelColor: () => subTextColor,
                      style: { borderRadius: 16 },
                      propsForLabels: { fontFamily: 'Inter-Medium', fontSize: 12 },
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                    fromZero={true}
                    withInnerLines={false}
                    withOuterLines={false}
                  />
                ) : (
                  <View style={styles.noChartData}>
                    <Text style={[styles.noDataText, { color: subTextColor }]}>
                      No contribution data available for chart
                    </Text>
                  </View>
                )}
              </View>

              {/* Month Navigation */}
              <View style={[styles.monthNavigation, { backgroundColor: cardBackground }]}>
                <TouchableOpacity
                  style={[styles.navButton, !canNavigatePrev && styles.navButtonDisabled]}
                  onPress={() => navigateMonth('prev')}
                  disabled={!canNavigatePrev}
                >
                  <ChevronLeft size={20} color={canNavigatePrev ? textColor : subTextColor} />
                </TouchableOpacity>
                
                <View style={styles.monthDisplay}>
                  <Calendar size={18} color="#667eea" />
                  <Text style={[styles.monthText, { color: textColor }]}>
                    {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.navButton, !canNavigateNext && styles.navButtonDisabled]}
                  onPress={() => navigateMonth('next')}
                  disabled={!canNavigateNext}
                >
                  <ChevronRight size={20} color={canNavigateNext ? textColor : subTextColor} />
                </TouchableOpacity>
              </View>

              {/* Monthly Stats */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                    <DollarSign size={20} color="#2563eb" />
                  </View>
                  <Text style={[styles.statNumber, { color: textColor }]}>
                    {getCurrencySymbol(selectedCurrency)}{selectedMonthData.totalCollected.toFixed(0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>Collected</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                    <Users size={20} color="#16a34a" />
                  </View>
                  <Text style={[styles.statNumber, { color: textColor }]}>
                    {selectedMonthData.contributedParticipants}/{selectedMonthData.activeParticipants}
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>Contributed</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                    <TrendingUp size={20} color="#d97706" />
                  </View>
                  <Text style={[styles.statNumber, { color: progressColor }]}>
                    {selectedMonthData.progress.toFixed(0)}%
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>Target</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressSection, { backgroundColor: cardBackground }]}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressTitle, { color: textColor }]}>Monthly Target Progress</Text>
                  <Text style={[styles.progressAmount, { color: textColor }]}>
                    {getCurrencySymbol(selectedCurrency)}{selectedMonthData.totalCollected.toFixed(0)} of {getCurrencySymbol(selectedCurrency)}{group.monthly_amount.toFixed(0)}
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: progressColor,
                        width: `${Math.min(selectedMonthData.progress, 100)}%`
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Participant History Header */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Participant History</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Individual contributions for {selectedMonth.toLocaleDateString('en-US', { month: 'long' })}
                </Text>
              </View>
            </>
          )}
          data={selectedMonthData.participantContributions}
          renderItem={renderParticipantHistory}
          keyExtractor={(item) => item.participant.id.toString()}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Users size={48} color={subTextColor} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>No Data Available</Text>
              <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
                No contribution data found for this month
              </Text>
            </View>
          )}
          ListFooterComponent={() => <View style={{ height: 40 }} />}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  chartSection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 18,
    borderRadius: 16,
    alignSelf: 'center',
  },
  noChartData: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  statsGrid: {
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
  progressSection: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  progressAmount: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  participantHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  contributionCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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