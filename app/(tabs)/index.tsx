import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

//schema for a note
type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
};

type Theme = "light" | "dark";


//the 3 types of screens there are
type Screen = "home" | "add" | "edit";
const STORAGE_KEY = "notes";
const THEME_STORAGE_KEY = "notes_theme";

function NotesApp() {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();

  //multiple usestates for things that need to be dynamic
  const [screen, setScreen] = useState<Screen>("home");
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(systemTheme === "dark" ? "dark" : "light");


  //after trimming, does it have content condition
  const canSave = title.trim().length > 0 && content.trim().length > 0;
  const isForm = screen === "add" || screen === "edit";


  //runs when app starts, displays all notes that are on local storage
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


  //runs when any note is added/deleted
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

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "dark" || saved === "light") setTheme(saved);
      } catch (e) {
        console.log("Load theme failed:", e);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (e) {
        console.log("Save theme failed:", e);
      }
    };
    saveTheme();
  }, [theme]);

  const openNote = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setScreen("edit");
  };

  const confirmDelete = (noteId: string) => {
    Alert.alert("Delete note?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setNotes((p) => p.filter((n) => n.id !== noteId));
          if (editingId === noteId) {
            setScreen("home");
            setEditingId(null);
            setTitle("");
            setContent("");
          }
        },
      },
    ]);
  };

  const goToAdd = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
    setScreen("add");
  };

  const saveNote = () => {
    if (!canSave) {
      Alert.alert("Missing info", "Please enter both a title and content.");
      return;
    }
    if (screen === "edit" && editingId) {
      setNotes((prev) =>
        prev.map((note) => (note.id === editingId ? { ...note, title: title.trim(), content: content.trim() } : note)),
      );
    } else {
      const newNote: Note = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: title.trim(),
        content: content.trim(),
        createdAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    setEditingId(null);
    setScreen("home");
  };

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const palette = useMemo(
    () =>
      theme === "dark"
        ? {
            background: "#0d1117",
            card: "#161b22",
            border: "#2d333b",
            input: "#0f141c",
            textPrimary: "#f1f5f9",
            textSecondary: "#cbd5e1",
            textMuted: "#94a3b8",
            primaryBg: "#f8fafc",
            primaryText: "#0b0f14",
            ghostBg: "#1f2933",
            disabledBg: "#3b3f46",
            placeholder: "#6b7280",
          }
        : {
            background: "#ffffff",
            card: "#ffffff",
            border: "#e5e7eb",
            input: "#fafafa",
            textPrimary: "#111827",
            textSecondary: "#374151",
            textMuted: "#6b7280",
            primaryBg: "#111827",
            primaryText: "#ffffff",
            ghostBg: "#f3f4f6",
            disabledBg: "#9ca3af",
            placeholder: "#9ca3af",
          },
    [theme],
  );

  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {isForm ? (
          <>
            <Text style={styles.h1}>{screen === "edit" ? "Edit Note" : "Add Note"}</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Grocery list"
              placeholderTextColor={palette.placeholder}
              style={styles.input}
            />

            <Text style={styles.label}>Content</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write your note..."
              placeholderTextColor={palette.placeholder}
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.row}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => {
                  setScreen("home");
                  setEditingId(null);
                }}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, canSave ? styles.btnPrimary : styles.btnDisabled]}
                onPress={saveNote}
                disabled={!canSave}
              >
                <Text style={styles.btnPrimaryText}>{screen === "edit" ? "Save Changes" : "Save"}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.h1}>Notes</Text>
              <View style={styles.headerActions}>
                <Pressable style={[styles.btn, styles.btnGhost]} onPress={toggleTheme}>
                  <Text style={styles.btnGhostText}>{theme === "dark" ? "Light" : "Dark"}</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={goToAdd}>
                  <Text style={styles.btnPrimaryText}>+ Add</Text>
                </Pressable>
              </View>
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

            <Text style={styles.hint}>Tip: Tap a note to edit it. Long press to delete.</Text>
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

const createStyles = (palette: {
  background: string;
  card: string;
  border: string;
  input: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryBg: string;
  primaryText: string;
  ghostBg: string;
  disabledBg: string;
  placeholder: string;
}) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    container: { flex: 1, padding: 16, gap: 12 },

    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    headerActions: { flexDirection: "row", gap: 10 },
    h1: { fontSize: 24, fontWeight: "700", color: palette.textPrimary },

    label: { fontSize: 14, fontWeight: "600", marginTop: 8, color: palette.textPrimary },
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      backgroundColor: palette.input,
      color: palette.textPrimary,
    },
    textarea: { minHeight: 140 },

    row: { flexDirection: "row", gap: 12, marginTop: 12 },

    btn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: "center", minWidth: 110 },
    btnPrimary: { backgroundColor: palette.primaryBg },
    btnPrimaryText: { color: palette.primaryText, fontWeight: "700" },
    btnGhost: { backgroundColor: palette.ghostBg },
    btnGhostText: { color: palette.textPrimary, fontWeight: "700" },
    btnDisabled: { backgroundColor: palette.disabledBg },

    list: { paddingVertical: 6, gap: 10 },
    card: { borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 14, gap: 6, backgroundColor: palette.card },
    cardTitle: { fontSize: 16, fontWeight: "700", color: palette.textPrimary },
    cardContent: { fontSize: 14, color: palette.textSecondary },

    empty: { flex: 1, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 16, justifyContent: "center", gap: 6, backgroundColor: palette.card },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: palette.textPrimary },
    emptyText: { color: palette.textSecondary },

    hint: { color: palette.textMuted, fontSize: 12, textAlign: "center", paddingVertical: 8 },
  });
