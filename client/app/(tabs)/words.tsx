import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { VocabWord, wordBank } from '../../constants/wordBank';

const CARD_COLORS = [
  { bg: '#0F6E56', button: '#1D9E75', label: '#9FE1CB', sub: '#5DCAA5' },
  { bg: '#534AB7', button: '#7F77DD', label: '#CECBF6', sub: '#AFA9EC' },
  { bg: '#993C1D', button: '#D85A30', label: '#F5C4B3', sub: '#F0997B' },
  { bg: '#185FA5', button: '#378ADD', label: '#B5D4F4', sub: '#85B7EB' },
  { bg: '#854F0B', button: '#BA7517', label: '#FAC775', sub: '#EF9F27' },
];

const WORDS_PER_DAY = 5;

export default function WordsScreen() {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [learnedIds, setLearnedIds] = useState<string[]>([]);

  useEffect(() => {
    const loadOrPick = async () => {
      const today = new Date().toDateString();
      const savedDate = await AsyncStorage.getItem("wordsDate");
      const savedWords = await AsyncStorage.getItem("dailyVocab");
      const savedLearned = await AsyncStorage.getItem("learnedVocab");
      const savedSeen = await AsyncStorage.getItem("seenVocabIds");

      if (savedLearned) setLearnedIds(JSON.parse(savedLearned));

      // Already picked words today — reuse them
      if (savedDate === today && savedWords) {
        setWords(JSON.parse(savedWords));
        return;
      }

      // Pick 5 unseen words from the bank
      const seenIds: string[] = savedSeen ? JSON.parse(savedSeen) : [];
      const unseen = wordBank.filter(w => !seenIds.includes(w.id));

      // If we've seen everything, reset
      const pool = unseen.length >= WORDS_PER_DAY ? unseen : wordBank;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const todaysWords = shuffled.slice(0, WORDS_PER_DAY);

      // Save seen ids
      const newSeen = [...seenIds, ...todaysWords.map(w => w.id)];
      await AsyncStorage.setItem("seenVocabIds", JSON.stringify(newSeen));
      await AsyncStorage.setItem("wordsDate", today);
      await AsyncStorage.setItem("dailyVocab", JSON.stringify(todaysWords));
      await AsyncStorage.removeItem("learnedVocab");

      setWords(todaysWords);
      setLearnedIds([]);
    };

    loadOrPick();
  }, []);

  const markAsLearned = async (id: string) => {
    const updated = [...learnedIds, id];
    setLearnedIds(updated);
    await AsyncStorage.setItem("learnedVocab", JSON.stringify(updated));
  };

  const activeWords = words.filter(w => !learnedIds.includes(w.id));
  const total = words.length;
  const learned = learnedIds.length;
  const progress = total > 0 ? learned / total : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16213e' }}>
      <FlatList
        data={activeWords}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={{
              backgroundColor: '#0F6E56',
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 28,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
              marginBottom: 24
            }}>
              <Text style={{ color: '#9FE1CB', fontSize: 14, marginBottom: 4 }}>Heute lernen! 📖</Text>
              <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 4 }}>Word of the Day</Text>
              <Text style={{ color: '#9FE1CB', fontSize: 13 }}>
                {learned} learned · {activeWords.length} remaining
              </Text>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              {total > 0 && (
                <View style={{ backgroundColor: '#2a2a4a', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#888', fontSize: 12 }}>Today's progress</Text>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{learned}/{total}</Text>
                  </View>
                  <View style={{ backgroundColor: '#333', borderRadius: 4, height: 8 }}>
                    <View style={{
                      backgroundColor: '#0F6E56',
                      borderRadius: 4,
                      height: 8,
                      width: `${Math.round(progress * 100)}%`
                    }} />
                  </View>
                </View>
              )}

              {activeWords.length === 0 && words.length > 0 && (
                <View style={{ alignItems: 'center', paddingTop: 40 }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>All done for today!</Text>
                  <Text style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>Come back tomorrow for 5 new words.</Text>
                </View>
              )}

              <Text style={{ color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                {activeWords.length > 0 ? "TODAY'S WORDS" : ''}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const color = CARD_COLORS[index % CARD_COLORS.length];
          return (
            <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
              <View style={{ backgroundColor: color.bg, borderRadius: 18, padding: 20 }}>
                <Text style={{ color: color.label, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 6 }}>
                  GERMAN WORD
                </Text>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                  {item.german}
                </Text>
                <Text style={{ color: color.label, fontSize: 16, marginBottom: 12 }}>
                  {item.english}
                </Text>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <Text style={{ color: 'white', fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>
                    🇩🇪 {item.example_de}
                  </Text>
                  <Text style={{ color: color.label, fontSize: 12 }}>
                    🇬🇧 {item.example_en}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => markAsLearned(item.id)}
                  style={{ backgroundColor: color.button, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Mark as Learned ✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </SafeAreaView>
  );
}