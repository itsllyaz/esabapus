import { useState } from "react";
import { supabase } from "./lib/supabase";
import { useEffect } from "react";
function App() {
  const [notes, setNotes] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [update_title, setUpdateTitle] = useState("");
  const [update_content, setUpdateContent] = useState("");

  const [editingNoteId, setEditingNoteId] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [file, setFile] = useState(null);

  async function loadNotes() {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, content");

    if (error) {
      console.error(error);
      return;
    }
    // console.log("THE date: ", data);
    setNotes(data);
  }

  async function createNote() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(userError);
      return;
    }

    if (!user) {
      console.log("No user is logged in");
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        title,
        content,
        user_id: user.id,
      })
      .select();

    if (error) {
      console.error(error);
      return;
    }

    //   console.log("created note:", data);
    // console.log("logged in user: ", user)

    loadNotes();
  }

  async function updateNote(noteId) {
    const { data, error } = await supabase
      .from("notes")
      .update({
        title: title,
        content: content,
      })
      .eq("id", noteId)
      .select();

    if (error) {
      console.error(error);
      return;
    }

    console.log("updated note:", data);

    loadNotes();
    setTitle("");
    setContent("");
  }

  async function deleteNote(noteId) {
    const { data, error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .select();

    if (error) {
      console.error(error);
      return;
    }
    console.log("bob bobo bob");
    console.log("NOTE_ID: ", noteId);
    console.log("USER DATA: ", data);
    console.log("error: ", error);
    loadNotes();
  }

  async function saveEdit(noteId) {
    const titleInput = document.getElementById(`title-${noteId}`);
    const contentInput = document.getElementById(`content-${noteId}`);

    const { data, error } = await supabase
      .from("notes")
      .update({
        title: titleInput.value,
        content: contentInput.value,
      })
      .eq("id", noteId)
      .select();

    if (error) {
      console.error(error);
      return;
    }

    console.log("updated note:", data);

    setEditingNoteId(null);

    loadNotes();
  }

  async function signUp() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("data:", data);
    console.log("error:", error);
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // console.log("data:", data);
    // console.log("error:", error);

    console.log("user email: ", data.user.email);
    console.log("session: ", data.session);
    console.log("error: ", data.error);
  }
  async function logOut() {
    const { data, error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      return;
    }
    console.log("SUCCESSFULLY LOGGED OUT!!!");
    loadNotes();
  }

  async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    console.log("user:", data.user);
    console.log("error:", error);
  }

  async function uploadFile() {
    if (!file) {
      console.log("No file selected");
      return;
    }
		const filePath = `${user.id}/${file.name}`;
    const { data, error } = await supabase.storage
      .from("notes-files")
      .upload(filePath, file);

    console.log("data:", data);
    console.log("error:", error);
  }

function subscribeToNotes() {
  const channel = supabase
    .channel("notes-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notes",
      },
      (payload) => {
        console.log("REALTIME EVENT:", payload);
      }
    )
    .subscribe();

  return channel;
}
  return (
    // ....
    <>
      <div>
        <h2>Sign Up</h2>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
        />

        <button onClick={signUp}>Sign Up</button>
        <button onClick={signIn}> Sign In </button>
        <button onClick={() => logOut()}>Sign Out</button>
      </div>
      //.....
      <h1>Supabase Notes</h1>
      <div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
        />

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Content"
        />

        <button onClick={createNote}>Create Note</button>
      </div>
      <h1>UPDATE NOTE</h1>
      <button onClick={loadNotes}>Load Notes</button>
      {notes.map((note) => (
        <div key={note.id}>
          {editingNoteId === note.id ? (
            <div>
              <input defaultValue={note.title} id={`title-${note.id}`} />

              <textarea defaultValue={note.content} id={`content-${note.id}`} />

              <button onClick={() => saveEdit(note.id)}>Save</button>

              <button onClick={() => setEditingNoteId(null)}>Cancel</button>
            </div>
          ) : (
            <div>
              <h2>{note.title}</h2>
              <p>{note.content}</p>

              <button onClick={() => setEditingNoteId(note.id)}>Edit</button>

              <button onClick={() => deleteNote(note.id)}>Delete</button>
            </div>
          )}
        </div>
      ))}
      <hr />
      <hr />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Upload</button>
    </>
  );
}

export default App;
