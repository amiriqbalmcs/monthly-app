import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Contribution, Participant } from '@/types';
import { X, Check, ChevronDown, Search } from 'lucide-react-native';

interface ContributionModalProps {
  visible: boolean;
  onClose: () => void;
  contribution?: Contribution | null;
  groupId?: number; // Optional group filter
}

export const ContributionModal: React.FC<ContributionModalProps> = ({
  visible,
  onClose,
  contribution,
  groupId
}) => {
  const { isDarkMode, participants, groups, addContribution, updateContribution } = useApp();
  
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  const backgroundColor = isDarkMode ? '#111827' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBackground = isDarkMode ? '#374151' : '#f3f4f6';
  const borderColor = isDarkMode ? '#4b5563' : '#d1d5db';

  const activeParticipants = useMemo(() => 
    participants.filter(m => {
      // If groupId is provided, only show participants from that group
      const matchesGroup = groupId ? m.group_id === groupId : true;
      return (
        m.status === 'active' && 
        matchesGroup &&
        m.name.toLowerCase().includes(participantSearch.toLowerCase())
      );
    }), 
    [participants, participantSearch, groupId]
  );

  useEffect(() => {
    if (contribution) {
      setAmount(contribution.amount.toString());
      setNote(contribution.note);
      setDate(contribution.date);
      setParticipantId(contribution.participant_id);
    } else {
      // Reset form for new contribution
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setParticipantId(activeParticipants.length > 0 ? activeParticipants[0].id : null);
    }
    setShowParticipantDropdown(false);
    setParticipantSearch('');
  }, [contribution, visible, activeParticipants]);

  const handleSubmit = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid contribution amount');
      return;
    }

    if (!participantId) {
      Alert.alert('Error', 'Please select a participant');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Error', 'Please enter a valid date');
      return;
    }

    // Check if group is being changed for existing participant
    if (participant && participant.group_id !== groupId) {
    try {
      const participant = participants.find(m => m.id === participantId);
      if (!participant) {
        Alert.alert('Error', 'Selected participant not found');
        return;
      }

      const contributionData = {
        amount: Number(amount),
        note: note.trim(),
        date: date,
        participant_id: participantId,
        group_id: groupId || participant.group_id,
        created_at: new Date().toISOString()
      };
        'Move Participant to Different Group?',
        `This will move "${participant.name}" from their current group to the selected group. All their contribution history will be moved as well.`,
        await updateContribution(contribution.id, contributionData);
      } else {
        await addContribution(contributionData);
            text: 'Move Participant',

      onClose();
    } catch (error) {
      Alert.alert('Error', `Failed to ${contribution ? 'update' : 'add'} contribution`);
    } finally {
      setLoading(false);
    }
  };

  const selectedParticipant = participants.find(m => m.id === participantId);
  const selectedGroup = selectedParticipant ? groups.find(c => c.id === selectedParticipant.group_id) : null;

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
              <Text style={[styles.label, { color: textColor }]}>Participant *</Text>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: inputBackground, borderColor }]}
                onPress={() => setShowParticipantDropdown(!showParticipantDropdown)}
              >
                <View style={styles.dropdownContent}>
                  <Text style={[styles.dropdownText, { color: textColor }]} numberOfLines={1}>
                    {selectedParticipant ? selectedParticipant.name : 'Select a participant'}
                  </Text>
                  {selectedGroup && (
                    <Text style={[styles.dropdownSubText, { color: subTextColor }]} numberOfLines={1}>
                      {selectedGroup.name}
                    </Text>
                  )}
                </View>
                <ChevronDown size={16} color={subTextColor} />
              </TouchableOpacity>
              
              {showParticipantDropdown && (
                <View style={[styles.dropdownMenu, { backgroundColor: inputBackground, borderColor }]}>
                  <View style={[styles.searchContainer, { borderBottomColor: borderColor }]}>
                    <Search size={16} color={subTextColor} />
                    <TextInput
                      style={[styles.searchInput, { color: textColor }]}
                      placeholder="Search participants..."
                      placeholderTextColor={subTextColor}
                      value={participantSearch}
                      onChangeText={setParticipantSearch}
                      autoFocus={false}
                    />
                  </View>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {activeParticipants.map((participant) => {
                      const group = groups.find(c => c.id === participant.group_id);
                      return (
                        <TouchableOpacity
                          key={participant.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setParticipantId(participant.id);
                            setShowParticipantDropdown(false);
                            setParticipantSearch('');
                          }}
                        >
                          <View style={styles.participantOption}>
                            <Text style={[styles.dropdownText, { color: textColor }]} numberOfLines={1}>
                              {participant.name}
                            </Text>
                            <Text style={[styles.dropdownSubText, { color: subTextColor }]} numberOfLines={1}>
                              {group?.name || 'Unknown Group'}
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
  participantOption: {
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