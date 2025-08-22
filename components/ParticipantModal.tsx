import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Member, Committee } from '@/types';
import { X, Check, ChevronDown } from 'lucide-react-native';

interface MemberModalProps {
  visible: boolean;
  onClose: () => void;
  member?: Member | null;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#10b981' },
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'inactive', label: 'Inactive', color: '#6b7280' }
];

export const MemberModal: React.FC<MemberModalProps> = ({
  visible,
  onClose,
  member
}) => {
  const { isDarkMode, committees, addMember, updateMember } = useApp();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [committeeId, setCommitteeId] = useState<number | null>(null);
  const [status, setStatus] = useState<'active' | 'pending' | 'inactive'>('active');
  const [loading, setLoading] = useState(false);
  const [showCommitteeDropdown, setShowCommitteeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [committeeSearch, setCommitteeSearch] = useState('');

  const backgroundColor = isDarkMode ? '#111827' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBackground = isDarkMode ? '#374151' : '#f3f4f6';
  const borderColor = isDarkMode ? '#4b5563' : '#d1d5db';


  const activeCommittees = useMemo(() => 
    committees.filter(c => 
      c.is_active && 
      c.name.toLowerCase().includes(committeeSearch.toLowerCase())
    ), 
    [committees, committeeSearch]
  );
  
  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setPhone(member.phone);
      setMonthlyContribution(member.monthly_contribution.toString());
      setCommitteeId(member.committee_id);
      setStatus(member.status);
    } else {
      // Reset form for new member
      setName('');
      setEmail('');
      setPhone('');
      setMonthlyContribution('');
      setCommitteeId(activeCommittees.length > 0 ? activeCommittees[0].id : null);
      setStatus('active');
    }
    setShowCommitteeDropdown(false);
    setShowStatusDropdown(false);
  }, [member, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Member name is required');
      return;
    }

    if (!committeeId) {
      Alert.alert('Error', 'Please select a committee');
      return;
    }

    if (!monthlyContribution.trim() || isNaN(Number(monthlyContribution))) {
      Alert.alert('Error', 'Please enter a valid contribution amount');
      return;
    }

    // Check if committee is being changed for existing member
    if (member && member.committee_id !== committeeId) {
      Alert.alert(
        'Move Member to Different Committee?',
        `This will move "${member.name}" from their current committee to the selected committee. All their contribution history will be moved as well.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Move Member',
            style: 'default',
            onPress: () => performUpdate()
          }
        ]
      );
      return;
    }

    performUpdate();
  };

  const performUpdate = async () => {
    setLoading(true);
    
    try {
      const memberData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        monthly_contribution: Number(monthlyContribution),
        committee_id: committeeId,
        status,
        joined_date: member?.joined_date || new Date().toISOString().split('T')[0]
      };

      if (member) {
        await updateMember(member.id, memberData);
      } else {
        await addMember(memberData);
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', `Failed to ${member ? 'update' : 'add'} member`);
    } finally {
      setLoading(false);
    }
  };

  const selectedCommittee = committees.find(c => c.id === committeeId);
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === status);

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
            {member ? 'Edit Member' : 'New Member'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter member's full name"
                placeholderTextColor={subTextColor}
                autoFocus={false}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={email}
                onChangeText={setEmail}
                placeholder="member@example.com"
                placeholderTextColor={subTextColor}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus={false}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1-555-0123"
                placeholderTextColor={subTextColor}
                keyboardType="phone-pad"
                autoFocus={false}
                blurOnSubmit={false}
              />
            </View>

                        <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Committee *</Text>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: inputBackground, borderColor }]}
                onPress={() => setShowCommitteeDropdown(!showCommitteeDropdown)}
              >
                <Text style={[styles.dropdownText, { color: textColor }]} numberOfLines={1}>
                  {selectedCommittee?.name || 'Select a committee'}
                </Text>
                <ChevronDown size={16} color={subTextColor} />
              </TouchableOpacity>
              
              {showCommitteeDropdown && (
                <View style={[styles.dropdownMenu, { backgroundColor: inputBackground, borderColor }]}>
                  <View style={[styles.searchContainer, { backgroundColor: inputBackground, borderBottomColor: borderColor }]}>
                    <TextInput
                      style={[styles.searchInput, { color: textColor }]}
                      placeholder="Search committees..."
                      placeholderTextColor={subTextColor}
                      value={committeeSearch}
                      onChangeText={setCommitteeSearch}
                      autoFocus={false}
                    />
                  </View>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {activeCommittees.map((committee) => (
                    <TouchableOpacity
                      key={committee.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCommitteeId(committee.id);
                        setShowCommitteeDropdown(false);
                        setCommitteeSearch('');
                      }}
                    >
                      <Text style={[styles.dropdownText, { color: textColor }]} numberOfLines={2}>
                        {committee.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: textColor }]}>Monthly Contribution *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                  value={monthlyContribution}
                  onChangeText={setMonthlyContribution}
                  placeholder="0.00"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                  autoFocus={false}
                  blurOnSubmit={false}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: textColor }]}>Status</Text>
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: inputBackground, borderColor }]}
                  onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <View style={styles.dropdownContent}>
                    <View style={[styles.statusDot, { backgroundColor: selectedStatus?.color }]} />
                    <Text style={[styles.dropdownText, { color: textColor }]}>
                      {selectedStatus?.label}
                    </Text>
                  </View>
                  <ChevronDown size={16} color={subTextColor} />
                </TouchableOpacity>
                
                {showStatusDropdown && (
                  <View style={[styles.dropdownMenu, { backgroundColor: inputBackground, borderColor }]}>
                    {STATUS_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setStatus(option.value as any);
                          setShowStatusDropdown(false);
                        }}
                      >
                        <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                        <Text style={[styles.dropdownText, { color: textColor }]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
              {loading ? 'Saving...' : member ? 'Update' : 'Add Member'}
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
  row: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
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
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
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