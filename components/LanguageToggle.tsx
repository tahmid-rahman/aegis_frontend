import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface LanguageToggleProps {
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ language, setLanguage }) => {
  return (
    <TouchableOpacity
      onPress={() => setLanguage(language === 'en' ? 'bn' : 'en')}
      className="px-3 py-1 bg-surface-variant rounded-full"
      activeOpacity={0.7}
    >
      <Text className="text-on-surface font-medium">
        {language === 'en' ? 'বাংলা' : 'English'}
      </Text>
    </TouchableOpacity>
  );
};

export default LanguageToggle;