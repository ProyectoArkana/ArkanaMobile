import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

interface UserProfile {
  username: string;
  email: string;
  avatar_url?: string | null;
  trophies: number;
  wins: number;
  losses: number;
}

interface MatchHistoryItem {
  id: string;
  opponent_username: string;
  result: 'WIN' | 'LOSS';
  finished_at: string;
}

export const ProfileScreen = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const logout = useAuthStore((state) => state.logout);

  const fetchProfile = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Consumimos el endpoint real de nuestro user-service (/api/users/profile)
      const profileRes = await apiClient.get('/users/profile');
      setProfile(profileRes.data);

      // Dejamos el historial en vacío temporalmente hasta programar el módulo de partidas
      setMatches([]);
    } catch (error: any) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo obtener tu perfil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, []),
  );

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const renderMatch = ({ item }: { item: MatchHistoryItem }) => {
    const won = item.result === 'WIN';
    return (
      <View style={[styles.matchRow, { borderLeftColor: won ? '#2a9d8f' : '#e63946' }]}>
        <View>
          <Text style={styles.matchOpponent}>vs {item.opponent_username}</Text>
          <Text style={styles.matchDate}>
            {new Date(item.finished_at).toLocaleDateString('es-MX')}
          </Text>
        </View>
        <Text style={[styles.matchResult, { color: won ? '#2a9d8f' : '#e63946' }]}>
          {won ? 'Victoria' : 'Derrota'}
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!profile) return null;
    const totalGames = profile.wins + profile.losses;
    const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0;

    return (
      <View>
        <View style={styles.profileHeader}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🏆 {profile.trophies || 0}</Text>
            <Text style={styles.statLabel}>Trofeos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile.wins || 0}</Text>
            <Text style={styles.statLabel}>Victorias</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile.losses || 0}</Text>
            <Text style={styles.statLabel}>Derrotas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Efectividad</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Últimas partidas</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        ListHeaderComponent={renderHeader}
        refreshing={refreshing}
        onRefresh={() => fetchProfile(true)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aún no has jugado ninguna partida.</Text>
        }
        ListFooterComponent={
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  profileHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarFallback: { backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  email: { color: '#8d99ae', fontSize: 13, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 22,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#8d99ae', fontSize: 11, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 8,
  },
  matchOpponent: { color: '#fff', fontSize: 15, fontWeight: '600' },
  matchDate: { color: '#7f8c8d', fontSize: 12, marginTop: 2 },
  matchResult: { fontSize: 14, fontWeight: 'bold' },
  emptyText: { color: '#8d99ae', textAlign: 'center', marginVertical: 24 },
  logoutButton: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});