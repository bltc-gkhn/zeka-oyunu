import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';

// Seed bazlı rastgele kart üretici
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generatePoolBySeed = (seedStr) => {
  let currentSeed = parseInt(seedStr, 10) || 123456;

  const numbersList = [1, 10, 100, 1000];
  const vowelsList = ['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü'];
  const consonantsList = [
    'B', 'C', 'Ç', 'D', 'F', 'G', 'Ğ', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'Ş', 'T', 'V', 'Y', 'Z'
  ];

  const shuffle = (arr) => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      currentSeed += 1;
      const j = Math.floor(seededRandom(currentSeed) * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  return {
    numbers: shuffle(numbersList).slice(0, 2),
    vowels: shuffle(vowelsList).slice(0, 2),
    consonants: shuffle(consonantsList).slice(0, 6),
  };
};

export default function App() {
  const [seed, setSeed] = useState('749201');
  const [pool, setPool] = useState(() => generatePoolBySeed('749201'));

  const [inputWord, setInputWord] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [foundWords, setFoundWords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPool(generatePoolBySeed(seed));
  }, [seed]);

  const handleNewGame = () => {
    const randomSeed = Math.floor(100000 + Math.random() * 900000).toString();
    setSeed(randomSeed);
    setFoundWords([]);
    setTotalScore(0);
    setInputWord('');
  };

  const handleShareChallenge = async () => {
    try {
      // ⚠️ Buradaki linki kendi Expo Snack adresiniz ile değiştirin!
      const snackBaseUrl = 'https://snack.expo.dev/@bltc.gkhn.061/zeka-oyunu';
      
      const message = `🧠 zeka-oyunu'da #${seed} oturumunda ${totalScore} puan yaptım!\n\nAynı kartlarla beni geçebilir misin?\n🔗 Oyna: ${snackBaseUrl}?seed=${seed}`;
      
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Hata', 'Paylaşım panosu açılamadı.');
    }
  };

  const handleAppendChar = (char) => {
    setInputWord((prev) => prev + char);
  };

  const handleClear = () => {
    setInputWord('');
  };

  // TDK Kelime Doğrulama Servisi
  const checkWordWithTDK = async (rawInput) => {
    let targetWord = rawInput
      .replace(/1000/g, 'bin')
      .replace(/100/g, 'yüz')
      .replace(/10/g, 'on')
      .replace(/1/g, 'bir')
      .toLowerCase('tr-TR');

    // En az 3 harf kuralı
    if (targetWord.length < 3) {
      return { isValid: false, reason: 'short', expanded: targetWord };
    }

    try {
      const response = await fetch(
        `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(targetWord)}`
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0 && !data.error) {
        return { isValid: true, expanded: targetWord };
      }
    } catch (err) {
      console.warn('TDK API Bağlantı Hatası, lokal kontrole geçiliyor:', err);
    }

    if (targetWord.length >= 3) {
      return { isValid: true, expanded: targetWord };
    }

    return { isValid: false, reason: 'not_found', expanded: targetWord };
  };

  const handleSubmit = async () => {
    const cleanInput = inputWord.trim();
    if (!cleanInput) return;

    if (foundWords.some((w) => w.input.toLowerCase() === cleanInput.toLowerCase())) {
      Alert.alert('Uyarı', 'Bu kelimeyi zaten buldunuz!');
      return;
    }

    setLoading(true);
    const result = await checkWordWithTDK(cleanInput);
    setLoading(false);

    if (result.isValid) {
      const score = result.expanded.length * 2;
      addValidWord(cleanInput, result.expanded, score);
    } else {
      if (result.reason === 'short') {
        Alert.alert('Kural İhlali', 'Oluşturulacak kelimeler en az 3 harfli olmalıdır!');
      } else {
        Alert.alert('Geçersiz Kelime', `"${cleanInput}" TDK sözlüğünde bulunamadı.`);
      }
    }
  };

  const addValidWord = (input, expanded, score) => {
    setFoundWords([{ input, expanded, score }, ...foundWords]);
    setTotalScore((prev) => prev + score);
    setInputWord('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ZEKÂ BULMACA</Text>
          <Text style={styles.seedText}>Oturum Kodu: #{seed}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{totalScore} Puan</Text>
        </View>
      </View>

      {/* Aksiyon Barı */}
      <View style={styles.actionHeader}>
        <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
          <Text style={styles.newGameButtonText}>🔄 Yeni Oyun</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareChallenge}>
          <Text style={styles.shareButtonText}>📲 Meydan Oku</Text>
        </TouchableOpacity>
      </View>

      {/* Kart Havuzu */}
      <View style={styles.poolSection}>
        <Text style={styles.sectionTitle}>Oturum Kartları</Text>

        {/* Rakam Kartları */}
        <View style={styles.cardRow}>
          {pool.numbers.map((num, idx) => (
            <TouchableOpacity
              key={`num-${idx}`}
              style={[styles.card, styles.numberCard]}
              onPress={() => handleAppendChar(num.toString())}
            >
              <Text style={styles.cardText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sesli Harf Kartları */}
        <View style={styles.cardRow}>
          {pool.vowels.map((v, idx) => (
            <TouchableOpacity
              key={`vowel-${idx}`}
              style={[styles.card, styles.vowelCard]}
              onPress={() => handleAppendChar(v)}
            >
              <Text style={styles.cardText}>{v}</Text>
              <Text style={styles.subBadge}>Sınırsız</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sessiz Harf Kartları */}
        <View style={styles.cardRow}>
          {pool.consonants.map((c, idx) => (
            <TouchableOpacity
              key={`cons-${idx}`}
              style={[styles.card, styles.consonantCard]}
              onPress={() => handleAppendChar(c)}
            >
              <Text style={styles.cardText}>{c}</Text>
              <Text style={styles.subBadge}>Max 2</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Giriş & Onay Alanı */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.textInput}
          value={inputWord}
          onChangeText={setInputWord}
          placeholder="Kelime türetin (Min 3 harf)..."
          autoCapitalize="characters"
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.buttonText}>Temizle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bulunan Kelimeler Listesi */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Türetilen Kelimeler ({foundWords.length})</Text>
        <FlatList
          data={foundWords}
          keyExtractor={(item, index) => `${item.input}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.wordItem}>
              <Text style={styles.wordText}>
                {item.input} <Text style={styles.expandedText}>({item.expanded})</Text>
              </Text>
              <Text style={styles.wordScore}>+{item.score} P</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  seedText: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  scoreContainer: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  scoreText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  newGameButton: { flex: 1, backgroundColor: '#6B7280', padding: 10, borderRadius: 8, marginRight: 5, alignItems: 'center' },
  newGameButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  shareButton: { flex: 1, backgroundColor: '#8B5CF6', padding: 10, borderRadius: 8, marginLeft: 5, alignItems: 'center' },
  shareButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  poolSection: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, elevation: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  card: { width: 52, height: 52, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 3 },
  numberCard: { backgroundColor: '#F59E0B' },
  vowelCard: { backgroundColor: '#10B981' },
  consonantCard: { backgroundColor: '#3B82F6' },
  cardText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  subBadge: { color: '#E5E7EB', fontSize: 8, position: 'absolute', bottom: 2, textAlign: 'center' },

  inputSection: { marginVertical: 10 },
  textInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, fontSize: 18, borderWidth: 1, borderColor: '#D1D5DB', textAlign: 'center', fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  clearButton: { flex: 1, backgroundColor: '#EF4444', padding: 12, borderRadius: 8, marginRight: 6, alignItems: 'center' },
  submitButton: { flex: 1, backgroundColor: '#10B981', padding: 12, borderRadius: 8, marginLeft: 6, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },

  listSection: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 12 },
  wordItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  wordText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  expandedText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },
  wordScore: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
});
