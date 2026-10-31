import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { errorMessage } from '../../api/errors';
import { ROLE_LABEL, UserRole } from '../../types/users';

const ROLES: UserRole[] = ['PLAYER', 'ADMIN'];

// ARK-011: alta de un usuario por parte de un administrador.
export const UserFormScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PLAYER');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Ingresa usuario, correo y contraseña.');
      return;
    }
    try {
      setSubmitting(true);
      await apiClient.post('/admin/users', { username: username.trim(), email: email.trim(), password, role });
      Alert.alert('Listo', 'Usuario creado correctamente.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', errorMessage(e, 'No se pudo crear el usuario.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        placeholderTextColor="#8d99ae"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        placeholderTextColor="#8d99ae"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mínimo 6 caracteres)"
        placeholderTextColor="#8d99ae"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.section}>Rol</Text>
      <View style={styles.roles}>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.roleButton, role === r && styles.roleActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{ROLE_LABEL[r]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.submit} onPress={handleCreate} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Crear usuario</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16 },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  section: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 10 },
  roles: { flexDirection: 'row', marginBottom: 20 },
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
  roleText: { color: '#8d99ae', fontSize: 15, fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  submit: { backgroundColor: '#e94560', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
