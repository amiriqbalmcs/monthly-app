import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Contribution, Member } from '@/types';
import { X, Check, ChevronDown, Search } from 'lucide-react-native';

interface ContributionModalProps {
  visible: boolean;
  onClose: () => void;
  contribution?: Contribution | null;
  committeeId?: number; // Optional committee filter
}

export const ContributionModal: React.FC<ContributionModalProps> = ({
  visible,
  onClose,
  contribution,
  committeeId
}) => {
  const { isDarkMode, members, committees, addContribution, updateContribution } = useApp();
  
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [memberId, setMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const backgroundColor = isDarkMode ? '#111827' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBackground = isDarkMode ? '#374151' : '#f3f4f6';
  const borderColor = isDarkMode ? '#4b5563' : '#d1d5db';

  const activeMembers = useMemo(() => 
    members.filter(m => {
      // If committeeId is provided, only show members from that committee
      const matchesCommittee = committeeId ? m.committee_id === committeeId : true;
      return (
        m.status === 'active' && 
        matchesCommittee &&
        m.name.toLowerCase().includes(memberSearch.toLowerCase())
      );
    }), 
    [members, memberSearch, committeeId]
  );

  useEffect(() => {
    if (contribution) {
      setAmount(contribution.amount.toString());
      setNote(contribution.note);
      setDate(contribution.date);
      setMemberId(contribution.member_id);
    } else {
      // Reset form for new contribution
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setMemberId(activeMembers.length > 0 ? activeMembers[0].id : null);
    }
    setShowMemberDropdown(false);
    setMemberSearch('');
  }, [contribution, visible, activeMembers]);

  const handleSubmit = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid contribution amount');
      return;
    }

    if (!memberId) {
      Alert.alert('Error', 'Please select a member');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Error', 'Please enter a valid date');
      return;
    }

    setLoading(true);
    
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) {
        Alert.alert('Error', 'Selected member not found');
        return;
      }

      const contributionData = {
        amount: Number(amount),
        note: note.trim(),
        date: date,
        member_id: memberId,
        committee_id: committeeId || member.committee_id,
        created_at: new Date().toISOString()
      };

      if (contribution) {
        await updateContribution(contribution.id, contributionData);
      } else {
        await addContribution(contributionData);
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', `Failed to ${contribution ? 'update' : 'add'} contribution`);
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find(m => m.id === memberId);
  const selectedCommittee = selectedMember ? committees.find(c => c.id === selectedMember.committee_id) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor }]}
      >
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            {contribution ? 'Edit Contribution' : 'New Contribution'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Member *</Text>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: inputBackground, borderColor }]}
                onPress={() => setShowMemberDropdown(!showMemberDropdown)}
              >
                <View style={styles.dropdownContent}>
                  <Text style={[styles.dropdownText, { color: textColor }]} numberOfLines={1}>
                    {selectedMember ? selectedMember.name : 'Select a member'}
                  </Text>
                  {selectedCommittee && (
                    <Text style={[styles.dropdownSubText, { color: subTextColor }]} numberOfLines={1}>
                      {selectedCommittee.name}
                    </Text>
                  )}
                </View>
                <ChevronDown size={16} color={subTextColor} />
              </TouchableOpacity>
              
              {showMemberDropdown && (
                <View style={[styles.dropdownMenu, { backgroundColor: inputBackground, borderColor }]}>
                  <View style={[styles.searchContainer, { borderBottomColor: borderColor }]}>
                    <Search size={16} color={subTextColor} />
                    <TextInput
                      style={[styles.searchInput, { color: textColor }]}
                      placeholder="Search members..."
                      placeholderTextColor={subTextColor}
                      value={memberSearch}
                      onChangeText={setMemberSearch}
                      autoFocus={false}
                    />
                  </View>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {activeMembers.map((member) => {
                      const committee = committees.find(c => c.id === member.committee_id);
                      return (
                        <TouchableOpacity
                          key={member.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setMemberId(member.id);
                            setShowMemberDropdown(false);
                            setMemberSearch('');
                          }}
                        >
                          <View style={styles.memberOption}>
                            <Text style={[styles.dropdownText, { color: textColor }]} numberOfLines={1}>
                              {member.name}
                            </Text>
                            <Text style={[styles.dropdownSubText, { color: subTextColor }]} numberOfLines={1}>
                              {committee?.name || 'Unknown Committee'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Amount *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                autoFocus={false}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Date *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={subTextColor}
                autoFocus={false}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Note</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note about this contribution"
                placeholderTextColor={subTextColor}
                multiline
                numberOfLines={3}
                autoFocus={false}
                blurOnSubmit={false}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.actions, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Check size={18} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : contribution ? 'Update' : 'Add Contribution'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  dropdownContent: {
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  dropdownSubText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 250,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    padding: 12,
  },
  memberOption: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
});