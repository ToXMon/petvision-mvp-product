// ============================================================================
// PetAvatar - Component for displaying pet avatars
// ============================================================================

import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  AccessibilityInfo,
} from 'react-native';
import { PetAvatarProps } from '../../types/pet';

export const PetAvatar: React.FC<PetAvatarProps> = ({
  uri,
  name,
  species,
  size = 'md',
}) => {
  const sizes = {
    sm: { container: 40, image: 36, text: 14 },
    md: { container: 56, image: 52, text: 18 },
    lg: { container: 80, image: 76, text: 24 },
    xl: { container: 120, image: 112, text: 32 },
  };

  const currentSize = sizes[size];
  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  const getSpeciesColor = (species: string) => {
    const colors = {
      dog: '#4A90E2',
      cat: '#F5A623',
      bird: '#7ED321',
      reptile: '#9013FE',
      other: '#9B9B9B',
    };
    return colors[species as keyof typeof colors] || colors.other;
  };

  const handleAccessibility = () => {
    AccessibilityInfo.announceForAccessibility(`${name}, ${species}`);
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: currentSize.container,
          height: currentSize.container,
          backgroundColor: getSpeciesColor(species),
        },
      ]}
      accessible={true}
      accessibilityLabel={`${name}, ${species}`}
      accessibilityRole="image"
    >
      {uri ? (
        <Image
          source={{ uri }} }
          style={[
            styles.image,
            {
              width: currentSize.image,
              height: currentSize.image,
            },
          ]}
          resizeMode="cover"
          onError={() => console.log('Error loading avatar')}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: currentSize.text,
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    borderRadius: 9999,
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
