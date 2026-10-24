import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { errorMessage } from '../api/errors';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterScreen = () => {
  const navigation = useNavigation<Nav>();
  const register = useAuthStore((state) => state.register);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): string | null => {
    if (!USERNAME_REGEX.test(username.trim())) return 'El usuario debe tener de 3 a 30 caracteres (letras, números o guion bajo).';
    if (!EMAIL_REGEX.test(email.trim())) return 'Ingresa un correo válido.';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Revisa tus datos', validationError);
      return;
    }

    try {
      setSubmitting(true);
      // El backend devuelve el token al registrar: queda con la sesión iniciada
      await register(username.trim(), email.trim(), password);
      // AppNavigator cambia solo a "Main" cuando isAuthenticated pasa a true
    } catch (error: any) {
      Alert.alert('Error', errorMessage(error, 'No se pudo crear la cuenta.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
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
          placeholder="Contraseña"
          placeholderTextColor="#8d99ae"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#8d99ae"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrarme</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1a1a2e' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkButton: { marginTop: 18, alignItems: 'center' },
  linkText: { color: '#8d99ae', fontSize: 14 },
});