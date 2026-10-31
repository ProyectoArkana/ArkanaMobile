import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiClient } from '../../api/client';
import { errorMessage } from '../../api/errors';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { RootStackParamList } from '../../navigation/types';
import { AdminUser, AdminUsersPage, ROLE_LABEL, UserRole } from '../../types/users';

const PAGE_SIZE = 20;
const FILTERS: { label: string; value: '' | UserRole }[] = [
  { label: 'Todos', value: '' },
  { label: 'Jugadores', value: 'PLAYER' },
  { label: 'Admins', value: 'ADMIN' },
];

// ARK-011: listado de usuarios (solo administradores) con búsqueda y filtro por rol.
export const UsersListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'' | UserRole>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebouncedValue(search.trim(), 350);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (offset: number) => {
      const { data } = await apiClient.get<AdminUsersPage>('/admin/users', {
        params: { search: debounced || undefined, role: role || undefined, limit: PAGE_SIZE, offset },
      });
      return data;
    },
    [debounced, role],
  );

  // Se ejecuta al enfocar la pantalla (p. ej. al volver de crear un usuario o cambiar un rol)
  // y cada vez que cambian la búsqueda o el filtro.
  useFocusEffect(
    useCallback(() => {
      const id = ++requestId.current;
      setLoading(true);
      fetchPage(0)
        .then(data => {
          if (id !== requestId.current) return;
          setUsers(data.users);
          setTotal(data.total);
          setError(null);
        })
        .catch((e: any) => {
          if (id !== requestId.current) return;
          setUsers([]);
          setTotal(0);
          setError(errorMessage(e, 'No se pudo cargar la lista de usuarios.'));
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, [fetchPage]),
  );

  const loadMore = async () => {
    if (loading || loadingMore || users.length >= total) return;
    const id = requestId.current;
    try {
      setLoadingMore(true);
      const data = await fetchPage(users.length);
      if (id !== requestId.current) return;
      setUsers(prev => [...prev, ...data.users]);
      setTotal(data.total);
    } catch (e: any) {
      if (id === requestId.current) setError(errorMessage(e, 'No se pudieron cargar más usuarios.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id })}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={[styles.badge, item.role === 'ADMIN' ? styles.badgeAdmin : styles.badgePlayer]}>
        <Text style={styles.badgeText}>{ROLE_LABEL[item.role]}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.input}
        placeholder="Buscar por usuario o correo"
        placeholderTextColor="#8d99ae"
        autoCapitalize="none"
        autoCorrect={false}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.label}
            style={[styles.chip, role === f.value && styles.chipActive]}
            onPress={() => setRole(f.value)}
          >
            <Text style={[styles.chipText, role === f.value && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e94560" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            !error && users.length > 0 ? (
              <Text style={styles.counter}>
                {total} {total === 1 ? 'usuario' : 'usuarios'}
              </Text>
            ) : undefined
          }
          ListEmptyComponent={<Text style={styles.empty}>{error ?? 'No se encontraron usuarios.'}</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#e94560" style={styles.footer} /> : undefined}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AdminUserCreate')}>
        <Text style={styles.fabText}>➕ Crear usuario</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingHorizontal: 14,
    paddingVertical: 12,
    margin: 16,
    marginBottom: 8,
    fontSize: 16,
  },
  filters: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  chip: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  chipActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  chipText: { color: '#8d99ae', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 96 },
  counter: { color: '#8d99ae', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  empty: { color: '#8d99ae', fontSize: 15, textAlign: 'center', marginTop: 60, lineHeight: 22 },
  footer: { marginVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rowInfo: { flexShrink: 1, marginRight: 8 },
  username: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#8d99ae', fontSize: 13, marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeAdmin: { backgroundColor: '#e94560' },
  badgePlayer: { backgroundColor: '#0f3460' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
