import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';


const categories: Record<string, string> = {
  smallTalk: "💬 Small Talk",
  street: "🚶 Street",
  office: "💼 Office",
  gym: "🏋️ Gym",
  grocery: "🛒 Grocery"
};

const CARD_COLORS = [
  { bg: '#0F6E56', button: '#1D9E75', label: '#9FE1CB', sub: '#5DCAA5' },
  { bg: '#534AB7', button: '#7F77DD', label: '#CECBF6', sub: '#AFA9EC' },
  { bg: '#993C1D', button: '#D85A30', label: '#F5C4B3', sub: '#F0997B' },
  { bg: '#185FA5', button: '#378ADD', label: '#B5D4F4', sub: '#85B7EB' },
  { bg: '#854F0B', button: '#BA7517', label: '#FAC775', sub: '#EF9F27' },
];

const API_URL = "http://192.168.1.109:5000/generate";

interface Word {
  id: string;
  german: string;
  english: string;
  scenario: string;
}

export default function Home() {
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const loadData = async () => {
      const today = new Date().toDateString();
      const savedDate = await AsyncStorage.getItem("lastDate");
      if (!savedDate || savedDate !== today) {
        await AsyncStorage.setItem("lastDate", today);
        await AsyncStorage.removeItem("dailyWords");
        await AsyncStorage.removeItem("learnedWords");
        setSelectedWords([]);
        setLearnedWords([]);
        return;
      }
      const savedWords = await AsyncStorage.getItem("dailyWords");
      const savedLearned = await AsyncStorage.getItem("learnedWords");
      if (savedWords) setSelectedWords(JSON.parse(savedWords));
      if (savedLearned) setLearnedWords(JSON.parse(savedLearned));
    };
    loadData();
  }, []);

  const markAsLearned = async (id: string) => {
    const updatedWords = selectedWords.filter(word => word.id !== id);
    const newLearned = [...learnedWords, id];
    setSelectedWords(updatedWords);
    setLearnedWords(newLearned);
    await AsyncStorage.setItem("dailyWords", JSON.stringify(updatedWords));
    await AsyncStorage.setItem("learnedWords", JSON.stringify(newLearned));
  };

  const pickWords = async (num: number) => {
    if (!selectedCategory) {
      setError("Please select a category first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory, number: num })
      });
      if (!response.ok) throw new Error("Server error");
      const data: Word[] = await response.json();
      setSelectedWords(data);
      console.log("SAVED WORDS:", JSON.stringify(data));
      await AsyncStorage.setItem("dailyWords", JSON.stringify(data));
    } catch (err) {
      setError("Failed to load words. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const total = selectedWords.length + learnedWords.length;
  const progress = total > 0 ? learnedWords.length / total : 0;

  
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16213e' }}>
      <FlatList
        data={selectedWords}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {/* HEADER */}
            <View style={{
              backgroundColor: '#7F77DD',
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 28,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
              marginBottom: 24
            }}>
              <Text style={{ color: '#CECBF6', fontSize: 14, marginBottom: 4 }}>Guten Tag! 👋</Text>
              <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 4 }}>Learn German</Text>
              <Text style={{ color: '#CECBF6', fontSize: 13 }}>
                {learnedWords.length} learned · {selectedWords.length} active
              </Text>

              
            </View>

            <View style={{ paddingHorizontal: 20 }}>

              {/* CATEGORIES */}
              <Text style={{ color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                CHOOSE CATEGORY
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {Object.entries(categories).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSelectedCategory(key)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor: selectedCategory === key ? '#7F77DD' : '#2a2a4a'
                      }}
                    >
                      <Text style={{
                        color: selectedCategory === key ? 'white' : '#888',
                        fontSize: 13,
                        fontWeight: selectedCategory === key ? '600' : '400'
                      }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* NUMBER PICKER */}
              <Text style={{ color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                HOW MANY PHRASES?
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => pickWords(n)}
                    disabled={loading}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#7F77DD',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: loading ? 0.4 : 1
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ERROR */}
              {error && (
                <Text style={{ color: '#F09595', marginBottom: 12, fontSize: 13 }}>{error}</Text>
              )}

              {/* LOADING */}
              {loading && (
                <ActivityIndicator size="large" color="#7F77DD" style={{ marginVertical: 20 }} />
              )}

              {/* PROGRESS BAR */}
              {total > 0 && (
                <View style={{
                  backgroundColor: '#2a2a4a',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#888', fontSize: 12 }}>Today's progress</Text>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                      {learnedWords.length}/{total}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#333', borderRadius: 4, height: 8 }}>
                    <View style={{
                      backgroundColor: '#7F77DD',
                      borderRadius: 4,
                      height: 8,
                      width: `${Math.round(progress * 100)}%`
                    }} />
                  </View>
                </View>
              )}

              {/* EMPTY STATE */}
              {selectedWords.length === 0 && !loading && (
                <View style={{ alignItems: 'center', paddingTop: 40 }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🇩🇪</Text>
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                    Ready to learn?
                  </Text>
                  <Text style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
                    Pick a category and number of phrases above to get started.
                  </Text>
                </View>
              )}

              <Text style={{ color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                {selectedWords.length > 0 ? 'YOUR PHRASES' : ''}
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
                  GERMAN
                </Text>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
                  {item.german}
                </Text>
                <Text style={{ color: color.label, fontSize: 14, marginBottom: 6 }}>
                  {item.english}
                </Text>
                <Text style={{ color: color.sub, fontSize: 12, fontStyle: 'italic', marginBottom: 14 }}>
                  💡 {item.scenario}
                </Text>
                <TouchableOpacity
                  onPress={() => markAsLearned(item.id)}
                  style={{
                    backgroundColor: color.button,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                    Mark as Learned ✓
                  </Text>
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