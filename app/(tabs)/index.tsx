import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
};

type Screen = "home" | "add";
const STORAGE_KEY = "notes_v1";

function NotesApp() {
  const insets = useSafeAreaInsets();

  const [screen, setScreen] = useState<Screen>("home");
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Note[];
        if (Array.isArray(parsed)) setNotes(parsed);
      } catch (e) {
        console.log("Load notes failed:", e);
      }
    };
    loadNotes();
  }, []);

  useEffect(() => {
    const saveNotes = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch (e) {
        console.log("Save notes failed:", e);
      }
    };
    saveNotes();
  }, [notes]);

  const openNote = (note: Note) => Alert.alert(note.title || "Untitled", note.content);

  const confirmDelete = (noteId: string) => {
    Alert.alert("Delete note?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setNotes((p) => p.filter((n) => n.id !== noteId)) },
    ]);
  };

  const goToAdd = () => {
    setTitle("");
    setContent("");
    setScreen("add");
  };

  const saveNote = () => {
    if (!canSave) {
      Alert.alert("Missing info", "Please enter both a title and content.");
      return;
    }
    const newNote: Note = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: title.trim(),
      content: content.trim(),
      createdAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setScreen("home");
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {screen === "add" ? (
          <>
            <Text style={styles.h1}>Add Note</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Grocery list" style={styles.input} />

            <Text style={styles.label}>Content</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write your note..."
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.row}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setScreen("home")}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, canSave ? styles.btnPrimary : styles.btnDisabled]}
                onPress={saveNote}
                disabled={!canSave}
              >
                <Text style={styles.btnPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.h1}>Notes</Text>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={goToAdd}>
                <Text style={styles.btnPrimaryText}>+ Add</Text>
              </Pressable>
            </View>

            {notes.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptyText}>Tap “Add” to create your first note.</Text>
              </View>
            ) : (
              <FlatList
                data={notes}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <Pressable onPress={() => openNote(item)} onLongPress={() => confirmDelete(item.id)} style={styles.card}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardContent} numberOfLines={2}>
                      {item.content}
                    </Text>
                  </Pressable>
                )}
              />
            )}

            <Text style={styles.hint}>Tip: Tap a note to view it. Long press to delete.</Text>
          </>
        )}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NotesApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16, gap: 12 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  h1: { fontSize: 24, fontWeight: "700" },

  label: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  textarea: { minHeight: 140 },

  row: { flexDirection: "row", gap: 12, marginTop: 12 },

  btn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: "center", minWidth: 110 },
  btnPrimary: { backgroundColor: "#111" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: "#f2f2f2" },
  btnGhostText: { color: "#111", fontWeight: "700" },
  btnDisabled: { backgroundColor: "#bbb" },

  list: { paddingVertical: 6, gap: 10 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 14, padding: 14, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardContent: { fontSize: 14, color: "#444" },

  empty: { flex: 1, borderWidth: 1, borderColor: "#eee", borderRadius: 14, padding: 16, justifyContent: "center", gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#444" },

  hint: { color: "#666", fontSize: 12, textAlign: "center", paddingVertical: 8 },
});
