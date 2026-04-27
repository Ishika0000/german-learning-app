import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

interface Stats {
  streak: number;
  lastStudyDate: string;
  totalPhrasesLearned: number;
  totalWordsLearned: number;
  quizzesTaken: number;
  bestQuizScore: number;
  bestQuizTotal: number;
  weeklyActivity: number[];
  studyMinutes: number;
}

const defaultStats: Stats = {
  streak: 0,
  lastStudyDate: '',
  totalPhrasesLearned: 0,
  totalWordsLearned: 0,
  quizzesTaken: 0,
  bestQuizScore: 0,
  bestQuizTotal: 5,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  studyMinutes: 0,
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ACHIEVEMENTS = [
  { id: 'streak7', icon: '🔥', label: '7 day streak', condition: (s: Stats) => s.streak >= 7, color: '#EF9F27' },
  { id: 'streak30', icon: '🏆', label: '30 day streak', condition: (s: Stats) => s.streak >= 30, color: '#EF9F27' },
  { id: 'perfectQuiz', icon: '🎯', label: 'Perfect quiz', condition: (s: Stats) => s.bestQuizScore === s.bestQuizTotal && s.bestQuizTotal > 0, color: '#9FE1CB' },
  { id: 'phrases25', icon: '📚', label: '25 phrases', condition: (s: Stats) => s.totalPhrasesLearned >= 25, color: '#CECBF6' },
  { id: 'words50', icon: '🧠', label: '50 words', condition: (s: Stats) => s.totalWordsLearned >= 50, color: '#CECBF6' },
  { id: 'quizzes10', icon: '⭐', label: '10 quizzes', condition: (s: Stats) => s.quizzesTaken >= 10, color: '#9FE1CB' },
];

export default function ProgressScreen() {
  const [stats, setStats] = useState<Stats>(defaultStats);

  const loadStats = useCallback(async () => {
    const today = new Date().toDateString();

    // Load learned phrases
    const learnedPhrases = await AsyncStorage.getItem("learnedWords");
    const parsedPhrases: string[] = learnedPhrases ? JSON.parse(learnedPhrases) : [];

    // Load learned vocab
    const learnedVocab = await AsyncStorage.getItem("learnedVocab");
    const parsedVocab: string[] = learnedVocab ? JSON.parse(learnedVocab) : [];

    // Load stored stats
    const storedStats = await AsyncStorage.getItem("progressStats");
    const prev: Stats = storedStats ? JSON.parse(storedStats) : defaultStats;

    // Update streak
    let streak = prev.streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (prev.lastStudyDate === today) {
      streak = prev.streak;
    } else if (prev.lastStudyDate === yesterdayStr) {
      streak = prev.streak + 1;
    } else if (prev.lastStudyDate !== today) {
      streak = parsedPhrases.length > 0 || parsedVocab.length > 0 ? 1 : 0;
    }

    // Update weekly activity
    const dayOfWeek = new Date().getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weeklyActivity = [...prev.weeklyActivity];
    weeklyActivity[adjustedDay] = parsedPhrases.length + parsedVocab.length;

    const updatedStats: Stats = {
      ...prev,
      streak,
      lastStudyDate: today,
      totalPhrasesLearned: prev.totalPhrasesLearned + parsedPhrases.length,
      totalWordsLearned: prev.totalWordsLearned + parsedVocab.length,
      weeklyActivity,
    };

    await AsyncStorage.setItem("progressStats", JSON.stringify(updatedStats));
    setStats(updatedStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const maxActivity = Math.max(...stats.weeklyActivity, 1);
  const hours = Math.floor(stats.studyMinutes / 60);
  const mins = stats.studyMinutes % 60;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16213e' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HEADER */}
        <View style={{
          backgroundColor: '#534AB7',
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 28,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          marginBottom: 24
        }}>
          <Text style={{ color: '#CECBF6', fontSize: 14, marginBottom: 4 }}>Dein Fortschritt 📊</Text>
          <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 4 }}>Progress</Text>
          <Text style={{ color: '#CECBF6', fontSize: 13 }}>Keep up the great work!</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* STREAK */}
          <View style={{
            backgroundColor: '#2a2a4a',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <View>
              <Text style={{ color: '#888', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
                CURRENT STREAK
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold' }}>{stats.streak}</Text>
                <Text style={{ color: '#888', fontSize: 16 }}>days</Text>
              </View>
            </View>
            <Text style={{ fontSize: 48 }}>🔥</Text>
          </View>

          {/* STATS GRID */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: '#2a2a4a', borderRadius: 16, padding: 16 }}>
              <Text style={{ color: '#888', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
                PHRASES
              </Text>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
                {stats.totalPhrasesLearned}
              </Text>
              <Text style={{ color: '#888', fontSize: 11 }}>learned</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#2a2a4a', borderRadius: 16, padding: 16 }}>
              <Text style={{ color: '#888', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
                WORDS
              </Text>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
                {stats.totalWordsLearned}
              </Text>
              <Text style={{ color: '#888', fontSize: 11 }}>learned</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: '#2a2a4a', borderRadius: 16, padding: 16 }}>
              <Text style={{ color: '#888', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
                QUIZZES
              </Text>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
                {stats.quizzesTaken}
              </Text>
              <Text style={{ color: '#888', fontSize: 11 }}>taken</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#2a2a4a', borderRadius: 16, padding: 16 }}>
              <Text style={{ color: '#888', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
                BEST SCORE
              </Text>
              <Text style={{ color: '#9FE1CB', fontSize: 28, fontWeight: 'bold' }}>
                {stats.bestQuizScore}/{stats.bestQuizTotal}
              </Text>
              <Text style={{ color: '#888', fontSize: 11 }}>quiz</Text>
            </View>
          </View>

          {/* WEEKLY ACTIVITY */}
          <View style={{ backgroundColor: '#2a2a4a', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#888', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 16 }}>
              THIS WEEK
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 }}>
              {DAYS.map((day, i) => {
                const val = stats.weeklyActivity[i];
                const barHeight = val > 0 ? Math.max((val / maxActivity) * 60, 8) : 4;
                return (
                  <View key={day} style={{ alignItems: 'center', gap: 6 }}>
                    <View style={{
                      width: 28,
                      height: barHeight,
                      backgroundColor: val > 0 ? '#7F77DD' : '#333',
                      borderRadius: 6
                    }} />
                    <Text style={{ color: '#888', fontSize: 10 }}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ACHIEVEMENTS */}
          <View style={{ backgroundColor: '#2a2a4a', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#888', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 16 }}>
              ACHIEVEMENTS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ACHIEVEMENTS.map(a => {
                const unlocked = a.condition(stats);
                return (
                  <View key={a.id} style={{
                    width: '30%',
                    backgroundColor: '#16213e',
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                    opacity: unlocked ? 1 : 0.35
                  }}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>{a.icon}</Text>
                    <Text style={{
                      color: unlocked ? a.color : '#888',
                      fontSize: 10,
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      {a.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* STUDY TIME */}
          <View style={{
            backgroundColor: '#2a2a4a',
            borderRadius: 16,
            padding: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <View>
              <Text style={{ color: '#888', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
                TOTAL STUDY TIME
              </Text>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>
                {hours}h {mins}min
              </Text>
            </View>
            <Text style={{ fontSize: 36 }}>⏱️</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}