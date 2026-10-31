import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { errorMessage } from '../../api/errors';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { AdminUser, ROLE_LABEL, UserRole } from '../../types/users';

const ROLES: UserRole[] = ['PLAYER', 'ADMIN'];

// ARK-011: detalle de un usuario y asignación de rol.
export const UserDetailScreen = () => {
  const { userId } = useRoute<RouteProp<RootStackParamList, 'AdminUserDetail'>>().params;
  const myId = useAuthStore(state => state.user?.id);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      apiClient
        .get<{ user: AdminUser }>(`/admin/users/${userId}`)
        .then(({ data }) => {
          if (!active) return;
          setUser(data.user);
          setError(null);
        })
        .catch((e: any) => {
          if (active) setError(errorMessage(e, 'No se pudo cargar el usuario.'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [userId]),
  );

  const changeRole = (role: UserRole) => {
    if (!user || role === user.role) return;
    Alert.alert('Cambiar rol', `¿Asignar el rol "${ROLE_LABEL[role]}" a ${user.username}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            setSaving(true);
            const { data } = await apiClient.patch<{ user: AdminUser }>(`/admin/users/${user.id}/role`, { role });
            setUser(data.user);
          } catch (e: any) {
            Alert.alert('Error', errorMessage(e, 'No se pudo cambiar el rol.'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error ?? 'Usuario no encontrado.'}</Text>
      </View>
    );
  }

  const isMe = user.id === myId;

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.meta}>
          Victorias: {user.wins} · Derrotas: {user.losses}
        </Text>
        <Text style={styles.meta}>Registro: {new Date(user.created_at).toLocaleDateString('es-MX')}</Text>
      </View>

      <Text style={styles.section}>Rol</Text>
      <View style={styles.roles}>
        {ROLES.map(r => {
          const active = user.role === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.roleButton, active && styles.roleActive, (saving || isMe) && styles.roleDisabled]}
              disabled={saving || isMe}
              onPress={() => changeRole(r)}
            >
              <Text style={[styles.roleText, active && styles.roleTextActive]}>{ROLE_LABEL[r]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {isMe && <Text style={styles.muted}>No puedes cambiar tu propio rol.</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#16213e', borderRadius: 10, padding: 16, marginBottom: 24 },
  username: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  email: { color: '#8d99ae', fontSize: 14, marginTop: 2, marginBottom: 10 },
  meta: { color: '#8d99ae', fontSize: 13, marginTop: 2 },
  section: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  roles: { flexDirection: 'row', marginBottom: 12 },
  roleButton: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  roleActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  roleDisabled: { opacity: 0.6 },
  roleText: { color: '#8d99ae', fontSize: 15, fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  muted: { color: '#8d99ae', fontSize: 14, textAlign: 'center' },
});
