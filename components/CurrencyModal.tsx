import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { CURRENCIES } from '@/types';
import { X, Search, Check } from 'lucide-react-native';

interface CurrencyModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
  isDarkMode: boolean;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  visible,
  onClose,
  selectedCurrency,
  onSelectCurrency,
  isDarkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = isDarkMode ? '#111827' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBackground = isDarkMode ? '#374151' : '#f3f4f6';
  const borderColor = isDarkMode ? '#4b5563' : '#d1d5db';

  const filteredCurrencies = useMemo(() => {
    return CURRENCIES.filter(currency =>
      currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      currency.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectCurrency = (currencyCode: string) => {
    onSelectCurrency(currencyCode);
    onClose();
    setSearchQuery('');
  };

  const renderCurrencyItem = ({ item }: { item: typeof CURRENCIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.currencyItem,
        selectedCurrency === item.code && { backgroundColor: '#667eea' }
      ]}
      onPress={() => handleSelectCurrency(item.code)}
    >
      <View style={styles.currencyInfo}>
        <Text style={[
          styles.currencyCode,
          { color: selectedCurrency === item.code ? '#ffffff' : textColor }
        ]}>
          {item.code}
        </Text>
        <Text style={[
          styles.currencyName,
          { color: selectedCurrency === item.code ? '#ffffff' : subTextColor }
        ]}>
          {item.name}
        </Text>
      </View>
      <Text style={[
        styles.currencySymbol,
        { color: selectedCurrency === item.code ? '#ffffff' : textColor }
      ]}>
        {item.symbol}
      </Text>
      {selectedCurrency === item.code && (
        <Check size={20} color="#ffffff" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Select Currency</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: inputBackground }]}>
          <Search size={20} color={subTextColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search currencies..."
            placeholderTextColor={subTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
          />
        </View>

        <FlatList
          data={filteredCurrencies}
          renderItem={renderCurrencyItem}
          keyExtractor={(item) => item.code}
          style={styles.list}
          showsVerticalScrollIndicator={false}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginRight: 12,
  },
});