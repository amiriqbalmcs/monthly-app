import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Group } from '@/types';
import { X, Check } from 'lucide-react-native';

interface GroupModalProps {
  visible: boolean;
  onClose: () => void;
  group?: Group | null;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  visible,
  onClose,
  group
}) => {
  const { isDarkMode, addGroup, updateGroup, selectedCurrency } = useApp();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const backgroundColor = isDarkMode ? '#111827' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBackground = isDarkMode ? '#374151' : '#f3f4f6';
  const borderColor = isDarkMode ? '#4b5563' : '#d1d5db';

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description);
      setMonthlyAmount(group.monthly_amount.toString());
      setIsActive(!!group.is_active);
    } else {
      // Reset form for new group
      setName('');
      setDescription('');
      setMonthlyAmount('');
      setIsActive(true);
    }
  }, [group, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    if (!monthlyAmount.trim() || isNaN(Number(monthlyAmount))) {
      Alert.alert('Error', 'Please enter a valid monthly amount');
      return;
    }

    setLoading(true);
    
    try {
      const groupData = {
        name: name.trim(),
        description: description.trim(),
        monthly_amount: Number(monthlyAmount),
        is_active: isActive ? 1 : 0,
        created_at: new Date().toISOString()
      };

      if (group) {
        await updateGroup(group.id, groupData);
      } else {
        await addGroup(groupData);
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', `Failed to ${group ? 'update' : 'create'} group`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            {group ? 'Edit Group' : 'New Group'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Group Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter group name"
                placeholderTextColor={subTextColor}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter group description"
                placeholderTextColor={subTextColor}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Monthly Target ({selectedCurrency}) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor }]}
                value={monthlyAmount}
                onChangeText={setMonthlyAmount}
                placeholder="0.00"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Status</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    isActive && styles.activeToggle,
                    { backgroundColor: inputBackground, borderColor }
                  ]}
                  onPress={() => setIsActive(true)}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: isActive ? '#ffffff' : textColor }
                  ]}>
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    !isActive && styles.activeToggle,
                    { backgroundColor: inputBackground, borderColor }
                  ]}
                  onPress={() => setIsActive(false)}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: !isActive ? '#ffffff' : textColor }
                  ]}>
                    Inactive
                  </Text>
                </TouchableOpacity>
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
              {loading ? 'Saving...' : group ? 'Update' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },
  currencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedCurrency: {
    backgroundColor: '#667eea',
  },
  currencyText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  dropdownSubText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  activeToggle: {
    backgroundColor: '#667eea',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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