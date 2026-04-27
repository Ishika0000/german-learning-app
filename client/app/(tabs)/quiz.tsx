import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Word {
  id: string;
  german: string;
  english: string;
  scenario: string;
}

function generateOptions(correct: string, allWords: Word[]): string[] {
  const others = allWords
    .filter(w => w.english !== correct)
    .map(w => w.english)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

const saveQuizResult = async (finalScore: number, total: number) => {
  const stored = await AsyncStorage.getItem("progressStats");
  const prev = stored ? JSON.parse(stored) : {};
  const updatedStats = {
    ...prev,
    quizzesTaken: (prev.quizzesTaken || 0) + 1,
    bestQuizScore: Math.max(prev.bestQuizScore || 0, finalScore),
    bestQuizTotal: total,
  };
  await AsyncStorage.setItem("progressStats", JSON.stringify(updatedStats));
};

export default function QuizScreen() {
  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem("dailyWords");
      if (saved) {
        const parsed = JSON.parse(saved);
        const shuffled = [...parsed].sort(() => Math.random() - 0.5);
        setWords(shuffled);
      }
      setLoadingWords(false);
    };
    load();
  }, []);

  const handleSelect = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === words[current].english) {
      setScore(s => s + 1);
    } else {
      setMissed(m => m + 1);
    }
  };

  const handleNext = () => {
    if (current + 1 >= words.length) {
      saveQuizResult(score + (selected === words[current].english ? 0 : 0), words.length);
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setWords(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setMissed(0);
    setDone(false);
  };

  // LOADING
  if (loadingWords) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#16213e', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#7F77DD" />
      </SafeAreaView>
    );
  }

  // NOT ENOUGH WORDS
  if (words.length < 2) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#16213e', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🧠</Text>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
          Not enough words!
        </Text>
        <Text style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
          Go to the Learn tab, pick a category and load at least 2 phrases first.
        </Text>
      </SafeAreaView>
    );
  }

  const question = words[current];
  const options = generateOptions(question.english, words);

  // RESULTS SCREEN
  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#16213e' }}>
        <View style={{
          backgroundColor: '#534AB7',
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 32,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          alignItems: 'center',
          marginBottom: 24
        }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>Quiz complete!</Text>
          <Text style={{ color: '#CECBF6', fontSize: 14, marginTop: 4 }}>Here's how you did</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{
            backgroundColor: '#2a2a4a',
            borderRadius: 18,
            padding: 24,
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>YOUR SCORE</Text>
            <Text style={{ color: 'white', fontSize: 48, fontWeight: 'bold' }}>
              {score}/{words.length}
            </Text>
            <Text style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
              {score === words.length
                ? '🎯 Perfect score!'
                : score >= words.length / 2
                ? '👍 Good job!'
                : '💪 Keep practicing!'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ flex: 1, backgroundColor: '#2a2a4a', borderRadius: 14, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#9FE1CB', fontSize: 28, fontWeight: 'bold' }}>{score}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>correct</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#2a2a4a', borderRadius: 14, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#F09595', fontSize: 28, fontWeight: 'bold' }}>{missed}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>missed</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRestart}
            style={{
              backgroundColor: '#7F77DD',
              padding: 16,
              borderRadius: 14,
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // QUESTION SCREEN
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16213e' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Header */}
        <View style={{
          backgroundColor: '#7F77DD',
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          alignItems: 'center'
        }}>
          <Text style={{ color: '#CECBF6', fontSize: 12, marginBottom: 8 }}>
            Question {current + 1} of {words.length}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {words.map((_, i) => (
              <View key={i} style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i < current
                  ? '#9FE1CB'
                  : i === current
                  ? 'white'
                  : '#534AB7'
              }} />
            ))}
          </View>
        </View>

        {/* Question card */}
        <View style={{
          backgroundColor: '#2a2a4a',
          borderRadius: 18,
          padding: 24,
          marginBottom: 20,
          alignItems: 'center'
        }}>
          <Text style={{ color: '#888', fontSize: 11, marginBottom: 12, letterSpacing: 1 }}>
            WHAT DOES THIS MEAN?
          </Text>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            {question.german}
          </Text>
          {selected && (
            <Text style={{ color: '#9FE1CB', fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
              💡 {question.scenario}
            </Text>
          )}
        </View>

        {/* Answer options */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          {options.map((option, i) => {
            let bg = '#2a2a4a';
            let opacity = 1;
            let borderColor = 'transparent';

            if (selected) {
              if (option === question.english) {
                bg = '#0F6E56';
                borderColor = '#1D9E75';
              } else if (option === selected) {
                bg = '#A32D2D';
                borderColor = '#D85A30';
              } else {
                opacity = 0.4;
              }
            }

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelect(option)}
                disabled={!!selected}
                style={{
                  backgroundColor: bg,
                  padding: 18,
                  borderRadius: 14,
                  opacity,
                  borderWidth: 1,
                  borderColor
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 15,
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  {option}{selected && option === question.english ? ' ✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next button */}
        {selected && (
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: '#7F77DD',
              padding: 16,
              borderRadius: 14,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
              {current + 1 >= words.length ? 'See results' : 'Next question →'}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}