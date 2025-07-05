import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  console.log('🏠 Index - isLoading:', isLoading, 'user:', user?.name || 'none');

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#64748b' }}>
          Loading ChoreChart...
        </Text>
      </View>
    );
  }

  // Redirect based on authentication status
  if (user) {
    console.log('🚀 Redirecting to tabs for user:', user.name);
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('🔐 Redirecting to auth (no user)');
    return <Redirect href="/(auth)" />;
  }
} 