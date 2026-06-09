import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ImageBackground, Alert,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'Datos';

/**
 * La API a veces devuelve DOS objetos JSON seguidos:  {...}{...}
 * y dentro del segundo viene: materias:[{...},{...},...], creditosAreas:[...]
 *
 * Este parser:
 * 1) Separa SOLO top-level objetos con el patrón `}{` (nunca ocurre dentro de arrays)
 * 2) Parsea cada bloque con JSON.parse
 * 3) Normaliza a:
 *    {
 *      alumno: { carrera, nombre, codigo, ciclo, campus, situacion },
 *      academico: { creditos, creditosRequeridos, promedio, materias[], creditosAreas[] }
 *    }
 */
function parseCuceiPayload(rawText) {
  const txt = String(rawText || '').trim().replace(/^\uFEFF/, '');
  // Si ya es un único JSON válido, úsalo directo
  try {
    const once = JSON.parse(txt);
    return normalizeShape(once);
  } catch {}

  // Si vienen pegados:  ...}{...
  const SAFE_SPLIT = '@@SPLIT@@';
  const joined = txt.replace(/}\s*{/g, `}${SAFE_SPLIT}{`);
  const chunks = joined.split(SAFE_SPLIT);

  const blocks = [];
  for (const chunk of chunks) {
    try { blocks.push(JSON.parse(chunk)); } catch {}
  }
  if (!blocks.length) throw new Error('Respuesta no contiene JSON válido');

  // fusiona manteniendo arrays
  const merged = blocks.reduce((acc, cur) => {
    const out = { ...acc };

    if (Array.isArray(cur.materias)) {
      const prev = Array.isArray(out.materias) ? out.materias : [];
      const all = [...prev, ...cur.materias];
      const seen = new Set();
      out.materias = all.filter(it => {
        const key = `${it?.nrc || ''}|${it?.clave || ''}|${it?.descripcion || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    if (Array.isArray(cur.creditosAreas)) {
      out.creditosAreas = cur.creditosAreas;
    }

    for (const k of Object.keys(cur)) {
      if (k === 'materias' || k === 'creditosAreas') continue;
      // no sobrescribir con vacío
      const v = cur[k];
      if (v === undefined || v === null || v === '') continue;
      if (typeof out[k] === 'number' && typeof v === 'number' && out[k] > 0 && v === 0) continue;
      out[k] = v;
    }
    return out;
  }, {});

  return normalizeShape(merged);
}

function normalizeShape(obj) {
  // Si ya viene con alumno/academico, respétalo
  if (obj?.alumno || obj?.academico) {
    return {
      alumno: {
        carrera: obj?.alumno?.carrera ?? obj?.carrera ?? '',
        nombre: obj?.alumno?.nombre ?? obj?.nombre ?? '',
        codigo: obj?.alumno?.codigo ?? obj?.codigo ?? '',
        ciclo: obj?.alumno?.ciclo ?? obj?.ciclo ?? '',
        campus: obj?.alumno?.campus ?? obj?.campus ?? '',
        situacion: obj?.alumno?.situacion ?? obj?.situacion ?? '',
      },
      academico: {
        creditos: Number(obj?.academico?.creditos ?? obj?.creditos ?? 0),
        creditosRequeridos: Number(obj?.academico?.creditosRequeridos ?? obj?.creditosRequeridos ?? 0),
        promedio: Number(
          typeof obj?.academico?.promedio === 'number'
            ? obj?.academico?.promedio
            : obj?.promedio ?? 0
        ),
        materias: Array.isArray(obj?.academico?.materias) ? obj.academico.materias
                 : Array.isArray(obj?.materias) ? obj.materias : [],
        creditosAreas: Array.isArray(obj?.academico?.creditosAreas) ? obj.academico.creditosAreas
                      : Array.isArray(obj?.creditosAreas) ? obj.creditosAreas : [],
      },
    };
  }

  // Forma plana -> a forma normalizada
  return {
    alumno: {
      carrera: obj?.carrera ?? '',
      nombre: obj?.nombre ?? '',
      codigo: obj?.codigo ?? '',
      ciclo: obj?.ciclo ?? '',
      campus: obj?.campus ?? '',
      situacion: obj?.situacion ?? '',
    },
    academico: {
      creditos: Number(obj?.creditos ?? 0),
      creditosRequeridos: Number(obj?.creditosRequeridos ?? 0),
      promedio: Number(obj?.promedio ?? 0),
      materias: Array.isArray(obj?.materias) ? obj.materias : [],
      creditosAreas: Array.isArray(obj?.creditosAreas) ? obj.creditosAreas : [],
    },
  };
}

export default function Login({ navigation }) {
  const [codigo, setCodigo] = useState('');
  const [nip, setNip] = useState('');
  const [showNip, setShowNip] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const nipInputRef = useRef(null);

  // Si ya hay sesión, saltar a Student
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          navigation.replace('Student', { userData: JSON.parse(raw) });
          return;
        }
      } catch {}
      setChecking(false);
    })();
  }, [navigation]);

  const handleLogin = async () => {
    if (!codigo || !nip) {
      Alert.alert('Campos requeridos', 'Por favor ingresa el Código y NIP');
      return;
    }

    const url = `https://cuceimobile.space/campusCucei/auth.php?codigo=${encodeURIComponent(
      codigo.trim()
    )}&nip=${encodeURIComponent(nip.trim())}`;

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.log('HTTP no OK:', res.status, txt.slice(0, 200));
        Alert.alert('Servidor no disponible', `HTTP ${res.status}`);
        return;
      }

      const raw = await res.text();
      if (/\"message\"/i.test(raw) && !/{/.test(raw)) {
        Alert.alert('Error', 'Credenciales inválidas');
        return;
      }

      const payload = parseCuceiPayload(raw);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      Alert.alert('Bienvenid@', `Hola ${payload?.alumno?.nombre || 'Alumno'}`);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Student', params: { userData: payload } }],
      });
    } catch (error) {
      const isAbort = error?.name === 'AbortError';
      console.log('Error de red/login:', error);
      Alert.alert(
        isAbort ? 'Tiempo de espera agotado' : 'Error de conexión',
        isAbort ? 'El servidor tardó demasiado en responder.' : (error?.message || 'No se pudo conectar con el servidor')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Alert.alert('Saliendo', 'Regresando al menú principal.');
    navigation.reset({ index: 0, routes: [{ name: 'Inicio' }] });
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ImageBackground source={require('./Imagenes/Backgrounds/LogInBackground.png')} style={styles.backgroundImage}>
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <Text style={styles.text}>* Ingresa tus credenciales de SIIAU/LEO para iniciar sesión.</Text>

          <View style={styles.windowContainer}>
            <Text style={styles.headerText}>Log In</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Código"
                value={codigo}
                onChangeText={setCodigo}
                returnKeyType="next"
                onSubmitEditing={() => nipInputRef.current?.focus()}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="NIP"
                secureTextEntry={!showNip}
                value={nip}
                onChangeText={setNip}
                returnKeyType="done"
                ref={nipInputRef}
              />
              <TouchableOpacity onPress={() => setShowNip(!showNip)} style={styles.iconContainer}>
                <FontAwesome name={showNip ? 'eye' : 'eye-slash'} size={24} color="#2cc0e6ff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Entrando…' : 'Iniciar sesión'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBack} style={styles.button}>
              <Text style={styles.buttonText}>Regresar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 15, color: '#fff', textAlign: 'center', fontFamily: 'MyFontArialR', marginBottom: 20 },
  headerText: { fontSize: 60, color: '#2cc0e6ff', textAlign: 'center', fontFamily: 'MyFontRobotoSlab', marginBottom: 40 },
  windowContainer: {
    backgroundColor: 'white', borderRadius: 20, padding: 24, width: '80%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 3.5, elevation: 5,
  },
  inputContainer: { width: '100%', marginBottom: 20, position: 'relative' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, paddingLeft: 10, borderRadius: 8, backgroundColor: 'white', marginBottom: 10 },
  iconContainer: { position: 'absolute', right: 10, top: 12 },
  button: { backgroundColor: '#2cc0e6ff', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 10, width: '80%' },
  buttonText: { color: 'white', textAlign: 'center', fontSize: 18, fontFamily: 'MyFontArialR' },
});
